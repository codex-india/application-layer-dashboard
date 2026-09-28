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
    
    // NEW: Video container element
    const videoContainer = document.getElementById('video-settings-container');
    
    let activeAction = 'browse web'; // Default selection
    let isSimulating = false;
    let currentMessages = [];
    let currentViewLayer = 'application';

    // Tab Selection Logic
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            if (isSimulating) return;
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeAction = tab.textContent.trim().toLowerCase();
            
            // Show YouTube video ONLY if "Stream Video" is selected
            if (activeAction === 'stream video') {
                videoContainer.style.display = 'block';
            } else {
                videoContainer.style.display = 'none';
            }
            
            logActivity(`Selected action: ${activeAction}`);
        });
    });

    // Layer Toggle Logic
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
            if (!isSimulating && currentMessages.length > 0) {
                transportStats.style.display = 'block';
            }
        }
        renderMessages();
    }

    function logActivity(message) {
        const li = document.createElement('li');
        li.textContent = message;
        activityLog.appendChild(li);
        activityLog.scrollTop = activityLog.scrollHeight;
    }

    // Informative Simulation Data
    const protocolData = {
        'browse web': [
            { app: 'DNS Query', transport: 'UDP', port: 53, size: 45, desc: 'Client asks DNS server: "What is the IP address for website.com?"' },
            { app: 'DNS Response', transport: 'UDP', port: 53, size: 60, desc: 'DNS server replies: "The IP address is 192.168.1.10"' },
            { app: 'TCP Handshake', transport: 'TCP', port: 80, size: 180, desc: 'SYN, SYN-ACK, ACK: Establishing a reliable connection' },
            { app: 'HTTP GET', transport: 'TCP', port: 80, size: 400, desc: 'Client requests the /index.html file from the server' },
            { app: 'HTTP 200 OK', transport: 'TCP', port: 80, size: 1500, desc: 'Server delivers the HTML Payload reliably' }
        ],
        'stream video': [
            { app: 'DNS Query', transport: 'UDP', port: 53, size: 50, desc: 'Client asks DNS server: "What is the IP for youtube.com?"' },
            { app: 'QUIC Handshake', transport: 'UDP', port: 443, size: 250, desc: 'Establishing a low-latency secure connection over UDP' },
            { app: 'QUIC Stream Data', transport: 'UDP', port: 443, size: 8500, desc: 'High-speed encrypted video frame delivery (Chunk 1)' },
            { app: 'QUIC Stream Data', transport: 'UDP', port: 443, size: 8500, desc: 'High-speed encrypted video frame delivery (Chunk 2)' },
            { app: 'QUIC Stream Data', transport: 'UDP', port: 443, size: 8500, desc: 'High-speed encrypted video frame delivery (Chunk 3)' }
        ],
        'send mail': [
            { app: 'DNS Query (MX)', transport: 'UDP', port: 53, size: 55, desc: 'Client asks for Mail Exchange (MX) records for the domain' },
            { app: 'TCP Handshake', transport: 'TCP', port: 25, size: 180, desc: 'SYN, SYN-ACK, ACK: Establishing connection to Mail Server' },
            { app: 'SMTP EHLO', transport: 'TCP', port: 25, size: 120, desc: 'Client introduces itself to the mail server' },
            { app: 'SMTP MAIL FROM', transport: 'TCP', port: 25, size: 150, desc: 'Defining the sender and recipient addresses' },
            { app: 'SMTP DATA', transport: 'TCP', port: 25, size: 2048, desc: 'Transmitting the email body and attachments reliably' }
        ]
    };

    function renderMessages() {
        if (currentMessages.length === 0) return;
        vizContainer.innerHTML = ''; 
        
        currentMessages.forEach(msg => {
            const card = document.createElement('div');
            card.className = `message-card ${msg.transport.toLowerCase()}`;
            
            const icon = msg.transport === 'UDP' ? '📦' : '🔗';
            const title = currentViewLayer === 'application' ? msg.app : `${msg.transport} Segment (Port ${msg.port})`;
            
            // Add extra visual flair based on layer
            const detailsHtml = currentViewLayer === 'transport' 
                ? `<div style="margin-top: 8px;"><span class="size-badge">${msg.size} Bytes</span> <span class="layer-badge ${msg.transport.toLowerCase()}">${msg.transport}</span></div>` 
                : '';

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
    }

    function calculateStats(messages, action) {
        let udp = 0, tcp = 0, bytes = 0;
        
        messages.forEach(msg => {
            if (msg.transport === 'UDP') udp++;
            if (msg.transport === 'TCP') tcp++;
            bytes += msg.size;
        });

        document.getElementById('stat-udp').textContent = udp;
        document.getElementById('stat-tcp').textContent = tcp;
        document.getElementById('stat-bytes').textContent = bytes;

        const insightEl = document.getElementById('transport-insight');
        if (action === 'stream video') {
            insightEl.innerHTML = "<strong>Transport Insight:</strong> Video streaming relies heavily on <strong>UDP (QUIC protocol)</strong>. UDP does not wait to acknowledge every packet, making it fast and preventing video buffering, even if a few frames get lost.";
        } else {
            insightEl.innerHTML = "<strong>Transport Insight:</strong> Web browsing and Email rely on <strong>TCP</strong> for reliable, ordered delivery ensuring no text or HTML is corrupted. They only use <strong>UDP</strong> for the initial, quick DNS lookup.";
        }
    }

    simulateBtn.addEventListener('click', () => {
        if (!activeAction || isSimulating) return;
        
        isSimulating = true;
        simulateBtn.textContent = 'Simulating Traffic...';
        simulateBtn.disabled = true;
        statusText.textContent = '🔴 Simulating';
        
        vizContainer.innerHTML = '';
        transportStats.style.display = 'none';
        layerToggleContainer.style.display = 'flex';
        
        currentMessages = [];
        const messagesToRun = protocolData[activeAction];
        
        logActivity(`Started simulating: ${activeAction}`);
        
        messagesToRun.forEach((msg, index) => {
            setTimeout(() => {
                currentMessages.push(msg);
                renderMessages();
                messageCount.textContent = `${index + 1} / ${messagesToRun.length}`;
                logActivity(`Captured ${msg.transport} packet: ${msg.app}`);
                
                if (index === messagesToRun.length - 1) {
                    isSimulating = false;
                    simulateBtn.textContent = 'Run Simulation';
                    simulateBtn.disabled = false;
                    statusText.textContent = '🟢 Ready';
                    calculateStats(messagesToRun, activeAction);
                    
                    if (currentViewLayer === 'transport') {
                        transportStats.style.display = 'block';
                    }
                }
            }, (index + 1) * 900); // Slightly slower for readability
        });
    });
});
