document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('[role="tablist"] button');
    const simulateBtn = document.getElementById('btn-simulate');
    const activityLog = document.getElementById('activity-log');
    const vizContainer = document.getElementById('visualization-container');
    const messageCount = document.getElementById('message-count');
    const statusText = document.querySelector('header div:nth-child(2) span');
    
    // NEW Elements
    const layerToggleContainer = document.getElementById('layer-toggle-container');
    const btnAppLayer = document.getElementById('btn-app-layer');
    const btnTransportLayer = document.getElementById('btn-transport-layer');
    const transportStats = document.getElementById('transport-stats');
    
    let activeAction = null;
    let isSimulating = false;
    let currentMessages = [];
    let currentViewLayer = 'application'; // 'application' or 'transport'

    // Tab Selection
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            if (isSimulating) return;
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeAction = tab.textContent.trim().toLowerCase();
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
        
        // Re-render messages with new layer perspective
        renderMessages();
    }

    function logActivity(message) {
        const li = document.createElement('li');
        li.textContent = message;
        activityLog.appendChild(li);
        activityLog.scrollTop = activityLog.scrollHeight;
    }

    // Simulation Data (App + Transport Layer Data)
    const protocolData = {
        'browse web': [
            { app: 'DNS Query', transport: 'UDP', port: 53, size: 45, desc: 'Find IP for website' },
            { app: 'DNS Response', transport: 'UDP', port: 53, size: 60, desc: 'IP is 192.168.1.10' },
            { app: 'HTTP GET', transport: 'TCP', port: 80, size: 400, desc: 'Request /index.html' },
            { app: 'HTTP 200 OK', transport: 'TCP', port: 80, size: 1500, desc: 'HTML Payload delivered' }
        ],
        'stream video': [
            { app: 'DNS Query', transport: 'UDP', port: 53, size: 50, desc: 'Find youtube.com' },
            { app: 'TCP Handshake', transport: 'TCP', port: 443, size: 180, desc: 'SYN, SYN-ACK, ACK' },
            { app: 'QUIC/Video Stream', transport: 'UDP', port: 443, size: 8500, desc: 'High-speed datagram' },
            { app: 'QUIC/Video Stream', transport: 'UDP', port: 443, size: 8500, desc: 'High-speed datagram' }
        ],
        'send mail': [
            { app: 'DNS Query', transport: 'UDP', port: 53, size: 55, desc: 'MX Record for domain' },
            { app: 'SMTP EHLO', transport: 'TCP', port: 25, size: 120, desc: 'Handshake with mail server' },
            { app: 'SMTP MAIL FROM', transport: 'TCP', port: 25, size: 150, desc: 'Sender/Recipient info' },
            { app: 'SMTP DATA', transport: 'TCP', port: 25, size: 2048, desc: 'Email Payload delivered' }
        ]
    };

    function renderMessages() {
        if (currentMessages.length === 0) return;
        
        vizContainer.innerHTML = ''; // Clear container
        
        currentMessages.forEach(msg => {
            const card = document.createElement('div');
            card.className = `message-card ${msg.transport.toLowerCase()}`;
            
            const icon = msg.transport === 'UDP' ? '📦' : '🔗';
            const title = currentViewLayer === 'application' ? msg.app : `${msg.transport} Segment (Port ${msg.port})`;
            const detailsHtml = currentViewLayer === 'transport' 
                ? `<span class="size-badge">${msg.size} Bytes</span>` 
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
            insightEl.textContent = "Notice how Streaming relies heavily on UDP (QUIC) for fast, connectionless data transfer to prevent buffering.";
        } else {
            insightEl.textContent = "Notice how Web and Mail rely on TCP for reliable, ordered delivery, while using UDP just for quick DNS lookups.";
        }
    }

    simulateBtn.addEventListener('click', () => {
        if (!activeAction || isSimulating) return;
        
        isSimulating = true;
        simulateBtn.textContent = 'Simulating...';
        simulateBtn.disabled = true;
        statusText.textContent = '🔴 Simulating';
        
        vizContainer.innerHTML = '';
        transportStats.style.display = 'none';
        layerToggleContainer.style.display = 'flex';
        
        currentMessages = [];
        const messagesToRun = protocolData[activeAction];
        
        if (!messagesToRun) {
            logActivity("Error: Invalid action.");
            isSimulating = false;
            return;
        }

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
            }, (index + 1) * 800);
        });
    });
});
