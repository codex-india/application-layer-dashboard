document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('[role="tablist"] button');
    const simulateBtn = document.getElementById('btn-simulate');
    const activityLog = document.getElementById('activity-log');
    const vizContainer = document.getElementById('visualization-container');
    const messageCount = document.getElementById('message-count');
    const statusText = document.querySelector('header div:nth-child(2) span');
    
    const layerToggleContainer = document.getElementById('layer-toggle-container');
    const btnAppLayer = document.getElementById('btn-app-layer');
    const btnTransportLayer = document.getElementById('btn-transport-layer');
    const transportStats = document.getElementById('transport-stats');
    const videoContainer = document.getElementById('video-settings-container');
    
    // Playback Controls
    const playbackControls = document.getElementById('playback-controls');
    const btnPrev = document.getElementById('btn-prev');
    const btnPlayPause = document.getElementById('btn-playpause');
    const btnNext = document.getElementById('btn-next');
    const btnReplay = document.getElementById('btn-replay');

    let activeAction = 'browse web'; 
    let currentViewLayer = 'application';
    
    // Simulation Engine State
    let messagesToRun = [];
    let currentStepIndex = 0;
    let isPlaying = false;
    let playInterval = null;

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            if (isPlaying) return;
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeAction = tab.textContent.trim().toLowerCase();
            videoContainer.style.display = (activeAction === 'stream video') ? 'block' : 'none';
            logActivity(`Selected action: ${activeAction}`);
        });
    });

    btnAppLayer.addEventListener('click', () => switchLayer('application'));
    btnTransportLayer.addEventListener('click', () => switchLayer('transport'));

    function switchLayer(layer) {
        currentViewLayer = layer;
        if (layer === 'application') {
            btnAppLayer.classList.add('active-layer');
            btnTransportLayer.classList.remove('active-layer');
            transportStats.style.display = 'none';
        } else {
            btnTransportLayer.classList.add('active-layer');
            btnAppLayer.classList.remove('active-layer');
            if (currentStepIndex === messagesToRun.length) transportStats.style.display = 'block';
        }
        renderMessages();
    }

    function logActivity(message) {
        const li = document.createElement('li');
        li.textContent = message;
        activityLog.appendChild(li);
        activityLog.scrollTop = activityLog.scrollHeight;
    }

    // HIGHLY DETAILED PROTOCOL DATA (Seq, Ack, Flags, Cwnd, Teardown)
    const protocolData = {
        'browse web': [
            { app: 'DNS Query', transport: 'UDP', dir: 'Client ➔ Server', port: 53, size: 45, flags: '-', seq: '-', ack: '-', cwnd: '-', desc: 'What is the IP for website.com?' },
            { app: 'DNS Response', transport: 'UDP', dir: 'Server ➔ Client', port: 53, size: 60, flags: '-', seq: '-', ack: '-', cwnd: '-', desc: 'IP is 192.168.1.10' },
            { app: 'TCP Handshake (SYN)', transport: 'TCP', dir: 'Client ➔ Server', port: 80, size: 0, flags: '[SYN]', seq: 0, ack: 0, cwnd: '-', desc: 'Initiate reliable connection' },
            { app: 'TCP Handshake (SYN-ACK)', transport: 'TCP', dir: 'Server ➔ Client', port: 80, size: 0, flags: '[SYN, ACK]', seq: 0, ack: 1, cwnd: '10 MSS', desc: 'Acknowledge SYN, initial cwnd set' },
            { app: 'TCP Handshake (ACK)', transport: 'TCP', dir: 'Client ➔ Server', port: 80, size: 0, flags: '[ACK]', seq: 1, ack: 1, cwnd: '-', desc: 'Connection established' },
            { app: 'HTTP GET', transport: 'TCP', dir: 'Client ➔ Server', port: 80, size: 400, flags: '[PSH, ACK]', seq: 1, ack: 1, cwnd: '-', desc: 'Requesting /index.html' },
            { app: 'HTTP 200 OK (Chunk 1)', transport: 'TCP', dir: 'Server ➔ Client', port: 80, size: 1000, flags: '[ACK]', seq: 1, ack: 401, cwnd: '10 MSS', desc: 'Sending first chunk of HTML' },
            { app: 'TCP ACK (Client)', transport: 'TCP', dir: 'Client ➔ Server', port: 80, size: 0, flags: '[ACK]', seq: 401, ack: 1001, cwnd: '-', desc: 'Acknowledging chunk 1' },
            { app: 'HTTP 200 OK (Chunk 2)', transport: 'TCP', dir: 'Server ➔ Client', port: 80, size: 500, flags: '[PSH, ACK]', seq: 1001, ack: 401, cwnd: '20 MSS (Slow Start)', desc: 'Cwnd doubles! Sending rest of HTML' },
            { app: 'TCP Teardown (FIN)', transport: 'TCP', dir: 'Server ➔ Client', port: 80, size: 0, flags: '[FIN, ACK]', seq: 1501, ack: 401, cwnd: '-', desc: 'Server done sending data' },
            { app: 'TCP Teardown (ACK)', transport: 'TCP', dir: 'Client ➔ Server', port: 80, size: 0, flags: '[ACK]', seq: 401, ack: 1502, cwnd: '-', desc: 'Connection closed gracefully' }
        ],
        'stream video': [
            { app: 'DNS Query', transport: 'UDP', dir: 'Client ➔ Server', port: 53, size: 50, flags: '-', seq: '-', ack: '-', cwnd: '-', desc: 'Find IP for youtube.com' },
            { app: 'QUIC Initial', transport: 'UDP', dir: 'Client ➔ Server', port: 443, size: 1200, flags: 'Initial', seq: 0, ack: '-', cwnd: '-', desc: 'Combined Crypto/Transport Handshake' },
            { app: 'QUIC Handshake/Data', transport: 'UDP', dir: 'Server ➔ Client', port: 443, size: 1200, flags: 'Handshake', seq: 0, ack: 0, cwnd: '14 KB', desc: 'Server accepts, begins streaming immediately' },
            { app: 'Video Frame (Chunk 1)', transport: 'UDP', dir: 'Server ➔ Client', port: 443, size: 1350, flags: '1-RTT', seq: 1200, ack: '-', cwnd: '28 KB (Scaling)', desc: 'Unreliable datagram frame delivery' },
            { app: 'Video Frame (Chunk 2)', transport: 'UDP', dir: 'Server ➔ Client', port: 443, size: 1350, flags: '1-RTT', seq: 2550, ack: '-', cwnd: '42 KB', desc: 'Unreliable datagram frame delivery' }
        ],
        'send mail': [
            { app: 'DNS Query (MX)', transport: 'UDP', dir: 'Client ➔ Server', port: 53, size: 55, flags: '-', seq: '-', ack: '-', cwnd: '-', desc: 'Look up Mail Exchange server' },
            { app: 'TCP Handshake (SYN)', transport: 'TCP', dir: 'Client ➔ Server', port: 25, size: 0, flags: '[SYN]', seq: 0, ack: 0, cwnd: '-', desc: 'Connect to Mail Server' },
            { app: 'TCP Handshake (SYN-ACK)', transport: 'TCP', dir: 'Server ➔ Client', port: 25, size: 0, flags: '[SYN, ACK]', seq: 0, ack: 1, cwnd: '10 MSS', desc: 'Server accepts connection' },
            { app: 'TCP Handshake (ACK)', transport: 'TCP', dir: 'Client ➔ Server', port: 25, size: 0, flags: '[ACK]', seq: 1, ack: 1, cwnd: '-', desc: 'Connection established' },
            { app: 'SMTP EHLO', transport: 'TCP', dir: 'Client ➔ Server', port: 25, size: 120, flags: '[PSH, ACK]', seq: 1, ack: 1, cwnd: '-', desc: 'Introduce client' },
            { app: 'SMTP DATA', transport: 'TCP', dir: 'Client ➔ Server', port: 25, size: 2048, flags: '[PSH, ACK]', seq: 121, ack: 1, cwnd: '-', desc: 'Send email payload' },
            { app: 'TCP Teardown (FIN)', transport: 'TCP', dir: 'Client ➔ Server', port: 25, size: 0, flags: '[FIN, ACK]', seq: 2169, ack: 1, cwnd: '-', desc: 'Client closes connection' }
        ]
    };

    function renderMessages() {
        vizContainer.innerHTML = ''; 
        if (currentStepIndex === 0) {
            vizContainer.innerHTML = '<p class="placeholder">Simulation started. Press Play or Step Forward.</p>';
            return;
        }

        const msgsToRender = messagesToRun.slice(0, currentStepIndex);
        
        msgsToRender.forEach(msg => {
            const card = document.createElement('div');
            card.className = `message-card ${msg.transport.toLowerCase()}`;
            
            const icon = msg.transport === 'UDP' ? '📦' : '🔗';
            const title = currentViewLayer === 'application' ? msg.app : `${msg.transport} Segment (${msg.dir})`;
            
            let detailsHtml = '';
            if (currentViewLayer === 'transport') {
                detailsHtml = `
                    <div class="tcp-details">
                        <span class="layer-badge ${msg.transport.toLowerCase()}">${msg.transport} Port ${msg.port}</span>
                        <span class="detail-badge">Size: ${msg.size}B</span>
                        <span class="detail-badge flags">Flags: ${msg.flags}</span>
                        <span class="detail-badge seq">Seq=${msg.seq}</span>
                        <span class="detail-badge ack">Ack=${msg.ack}</span>
                        ${msg.cwnd !== '-' ? `<span class="detail-badge cwnd">cwnd: ${msg.cwnd}</span>` : ''}
                    </div>
                `;
            }

            card.innerHTML = `
                <div class="msg-icon">${icon}</div>
                <div class="msg-details">
                    <strong>${title}</strong>
                    <p>${msg.desc}</p>
                    ${detailsHtml}
                </div>
            `;
            vizContainer.appendChild(card);
        });
        
        // Auto-scroll to bottom
        vizContainer.scrollTop = vizContainer.scrollHeight;
    }

    function calculateStats() {
        let udp = 0, tcp = 0, bytes = 0;
        messagesToRun.forEach(msg => {
            if (msg.transport === 'UDP') udp++;
            if (msg.transport === 'TCP') tcp++;
            bytes += msg.size;
        });

        document.getElementById('stat-udp').textContent = udp;
        document.getElementById('stat-tcp').textContent = tcp;
        document.getElementById('stat-bytes').textContent = bytes;

        const insightEl = document.getElementById('transport-insight');
        if (activeAction === 'browse web') {
            insightEl.innerHTML = "<strong>Extra Credit Insight:</strong> Notice the <strong>Congestion Window (cwnd)</strong> doubling from 10 MSS to 20 MSS after the first successful ACK. This is TCP <strong>Slow Start</strong> in action!";
        } else if (activeAction === 'stream video') {
            insightEl.innerHTML = "<strong>Transport Insight:</strong> Streaming uses UDP/QUIC. There is no traditional TCP handshake or strict ACKing, preventing head-of-line blocking and reducing latency.";
        } else {
            insightEl.innerHTML = "<strong>Transport Insight:</strong> Mail uses TCP for guaranteed delivery. Notice the 3-way handshake at the start (SYN, SYN-ACK, ACK) and connection teardown (FIN) at the end.";
        }
    }

    // Engine Controls
    function updateControls() {
        messageCount.textContent = `${currentStepIndex} / ${messagesToRun.length}`;
        btnPrev.disabled = currentStepIndex === 0;
        btnNext.disabled = currentStepIndex === messagesToRun.length;
        
        if (currentStepIndex === messagesToRun.length) {
            pauseSimulation();
            btnPlayPause.disabled = true;
            statusText.textContent = '🟢 Simulation Complete';
            calculateStats();
            if (currentViewLayer === 'transport') transportStats.style.display = 'block';
        } else {
            btnPlayPause.disabled = false;
        }
    }

    function stepForward() {
        if (currentStepIndex < messagesToRun.length) {
            currentStepIndex++;
            const msg = messagesToRun[currentStepIndex - 1];
            logActivity(`Captured ${msg.transport}: ${msg.app}`);
            renderMessages();
            updateControls();
        }
    }

    function stepBackward() {
        if (currentStepIndex > 0) {
            currentStepIndex--;
            renderMessages();
            updateControls();
        }
    }

    function playSimulation() {
        isPlaying = true;
        btnPlayPause.innerHTML = '⏸ Pause';
        statusText.textContent = '🔴 Playing';
        playInterval = setInterval(stepForward, 1200);
    }

    function pauseSimulation() {
        isPlaying = false;
        btnPlayPause.innerHTML = '▶️ Play';
        statusText.textContent = '🟡 Paused';
        clearInterval(playInterval);
    }

    btnPlayPause.addEventListener('click', () => {
        isPlaying ? pauseSimulation() : playSimulation();
    });

    btnNext.addEventListener('click', () => {
        pauseSimulation();
        stepForward();
    });

    btnPrev.addEventListener('click', () => {
        pauseSimulation();
        stepBackward();
    });

    btnReplay.addEventListener('click', () => {
        pauseSimulation();
        currentStepIndex = 0;
        transportStats.style.display = 'none';
        renderMessages();
        updateControls();
        playSimulation();
    });

    simulateBtn.addEventListener('click', () => {
        messagesToRun = protocolData[activeAction];
        currentStepIndex = 0;
        
        vizContainer.innerHTML = '';
        transportStats.style.display = 'none';
        layerToggleContainer.style.display = 'flex';
        playbackControls.style.display = 'flex';
        
        logActivity(`--- Started: ${activeAction} ---`);
        updateControls();
        playSimulation();
    });
});
