const flows = {
  browse: (url) => { const host = safeHost(url); return { title: 'Browsing: DNS → HTTP', intro: `Your browser resolves ${host}, then requests the page over HTTP.`, steps: [
    msg('DNS','Client → DNS resolver','Query',`Standard query A ${host}`,`ID: 0x4a7c\nFlags: recursion desired\nQuestion: <span class="key">${host}</span>, type A`),
    msg('DNS','DNS resolver → Client','Response',`Answer: ${host} → 93.184.216.34`,`ID: 0x4a7c\nFlags: response, recursion available\nAnswer: <span class="key">${host}</span> A 93.184.216.34\nTTL: 3600`),
    msg('HTTP','Client → Web server','Request','GET /course HTTP/1.1',`<span class="key">GET /course HTTP/1.1</span>\nHost: ${host}\nUser-Agent: Protocol-Lab/1.0\nAccept: text/html`),
    msg('HTTP','Web server → Client','Response','HTTP/1.1 200 OK',`<span class="key">HTTP/1.1 200 OK</span>\nContent-Type: text/html\nContent-Length: 1256\nConnection: keep-alive\n\n&lt;html&gt; ... &lt;/html&gt;`)
  ]}},
  mail: ({to,subject,body}) => { const domain = (to.split('@')[1] || 'example.edu'); return { title:'Mail: DNS → SMTP',intro:`The mail client finds a mail server for ${domain}, then conducts an SMTP conversation.`,steps:[
    msg('DNS','Client → DNS resolver','MX query',`Standard query MX ${domain}`,`Question: <span class="key">${domain}</span>, type MX`),
    msg('DNS','DNS resolver → Client','MX response',`Answer: 10 mail.${domain}`,`Answer: <span class="key">${domain}</span> MX 10 mail.${domain}`),
    msg('SMTP','Client → Mail server','Greeting','EHLO protocol-lab.local',`<span class="key">EHLO protocol-lab.local</span>`),
    msg('SMTP','Mail server → Client','Capabilities','250-mail server ready',`250-mail.${domain}\n250-SIZE 35882577\n250-8BITMIME\n250 STARTTLS`),
    msg('SMTP','Client → Mail server','Envelope sender','MAIL FROM:<student@protocol-lab.local>',`<span class="key">MAIL FROM:&lt;student@protocol-lab.local&gt;</span>`),
    msg('SMTP','Client → Mail server','Envelope recipient',`RCPT TO:<${to}>`,`<span class="key">RCPT TO:&lt;${to}&gt;</span>`),
    msg('SMTP','Client → Mail server','Message data','DATA',`<span class="key">DATA</span>\nFrom: student@protocol-lab.local\nTo: ${to}\nSubject: ${subject}\n\n${body}\n.`),
    msg('SMTP','Mail server → Client','Accepted','250 2.0.0 queued',`<span class="key">250 2.0.0</span> Message accepted for delivery`),
    msg('SMTP','Client → Mail server','Close','QUIT',`<span class="key">QUIT</span>`),
    msg('SMTP','Mail server → Client','Close reply','221 2.0.0 Bye',`221 2.0.0 Bye`)
  ]}},
  stream: (quality) => ({ title:'Streaming: DNS → HTTP',intro:`The player resolves the media host, fetches a playlist, then downloads short ${quality} media segments.`,steps:[
    msg('DNS','Client → DNS resolver','Query','Query A media.example.edu',`Question: <span class="key">media.example.edu</span>, type A`),
    msg('DNS','DNS resolver → Client','Response','Answer: 203.0.113.24',`Answer: <span class="key">media.example.edu</span> A 203.0.113.24`),
    msg('HTTP','Client → Media server','Playlist request','GET /lecture/master.m3u8 HTTP/1.1',`<span class="key">GET /lecture/master.m3u8 HTTP/1.1</span>\nHost: media.example.edu`),
    msg('HTTP','Media server → Client','Playlist response','HTTP/1.1 200 OK · application/vnd.apple.mpegurl',`<span class="key">HTTP/1.1 200 OK</span>\nContent-Type: application/vnd.apple.mpegurl\n\n#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=2500000\n${quality}/playlist.m3u8`),
    msg('HTTP','Client → Media server','Segment request',`GET /lecture/${quality}/segment-001.ts HTTP/1.1`,`<span class="key">GET /lecture/${quality}/segment-001.ts HTTP/1.1</span>\nRange: bytes=0-`),
    msg('HTTP','Media server → Client','Segment response','HTTP/1.1 206 Partial Content',`<span class="key">HTTP/1.1 206 Partial Content</span>\nContent-Type: video/mp2t\nContent-Range: bytes 0-499999/500000`),
    msg('HTTP','Client → Media server','Next segment',`GET /lecture/${quality}/segment-002.ts HTTP/1.1`,`<span class="key">GET /lecture/${quality}/segment-002.ts HTTP/1.1</span>`)
  ]})
};
function msg(protocol,direction,label,preview,detail){return{protocol,direction,label,preview,detail}}
function safeHost(value){try{return new URL(value.startsWith('http')?value:'https://'+value).hostname||'example.com'}catch{return 'example.com'}}
let currentFlow=null, revealed=0, selected=-1, timer=null, playing=false;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function addLog(text){const li=document.createElement('li');li.textContent=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+' — '+text;$('#activity-log').prepend(li)}
function setStatus(text){$('#activity-status').textContent=text;$('#sync-status').innerHTML='<span></span> Panels synchronized'}
function start(mode,data){stop();currentFlow=flows[mode](data);revealed=0;selected=-1;$('#protocol-title').textContent=currentFlow.title;$('#protocol-intro').textContent=currentFlow.intro;setStatus('Activity started. Protocol messages are appearing in the right panel.'); addLog(`${mode[0].toUpperCase()+mode.slice(1)} activity started`); render(); play()}
function render(){const root=$('#timeline');root.innerHTML='';if(!currentFlow){return}currentFlow.steps.forEach((step,i)=>{const el=document.createElement('button');el.type='button';el.className='message '+(i<revealed?'visible ':'')+(i===selected?'selected':'');el.disabled=i>=revealed;const side=step.direction.startsWith('Server')||step.direction.startsWith('DNS resolver')||step.direction.startsWith('Web')||step.direction.startsWith('Mail')||step.direction.startsWith('Media')?'server':'';el.innerHTML=`<div class="message-top"><span class="sequence">${String(i+1).padStart(2,'0')}</span><span class="protocol-pill ${step.protocol==='SMTP'?'smtp':''}">${step.protocol}</span><span class="direction ${side}">${step.direction}</span><strong>${step.label}</strong></div><div class="message-preview">${escapeHtml(step.preview)}</div>`;el.onclick=()=>showDetail(i);root.append(el)});$('#step-counter').textContent=`${revealed} / ${currentFlow.steps.length}`;$('#next').disabled=!currentFlow||revealed>=currentFlow.steps.length;$('#previous').disabled=!currentFlow||revealed===0}
function escapeHtml(s){const div=document.createElement('div');div.textContent=s;return div.innerHTML}
function showDetail(i){selected=i;const step=currentFlow.steps[i];$('#detail-card').innerHTML=`<h3>${step.protocol} · ${step.direction}</h3><pre>${step.detail}</pre>`;render()}
function next(){if(!currentFlow||revealed>=currentFlow.steps.length){stop();return}revealed++;showDetail(revealed-1);if(revealed===currentFlow.steps.length){stop();setStatus('Protocol exchange complete. Use Replay to watch it again.');addLog('Protocol visualization completed')}}
function previous(){if(!currentFlow||revealed===0)return;stop();revealed--;selected=revealed?revealed-1:-1;if(selected>=0)showDetail(selected);else{$('#detail-card').innerHTML='<p class="detail-empty">Select a revealed message to inspect its important fields.</p>';render()}}
function play(){if(!currentFlow||revealed>=currentFlow.steps.length)return;playing=true;$('#play-pause').textContent='Pause';timer=setInterval(next,Number($('#speed').value))}
function stop(){playing=false;clearInterval(timer);timer=null;$('#play-pause').textContent='Play'}
$$('.tab').forEach(tab=>tab.onclick=()=>{const mode=tab.dataset.mode;$$('.tab').forEach(x=>x.classList.toggle('active',x===tab));$$('.activity-form').forEach(x=>x.classList.add('hidden'));$(`#${mode}-form`).classList.remove('hidden')});
$('#browse-form').onsubmit=e=>{e.preventDefault();start('browse',$('#url').value)};
$('#mail-form').onsubmit=e=>{e.preventDefault();start('mail',{to:$('#recipient').value,subject:$('#subject').value,body:$('#body').value})};
function youtubeEmbedUrl(value){try{const url=new URL(value);const id=url.searchParams.get('v')||(url.hostname.includes('youtu.be')?url.pathname.slice(1):null)||(url.pathname.match(/\/embed\/([^/?]+)/)||[])[1];return id&&/^[\w-]{11}$/.test(id)?`https://www.youtube-nocookie.com/embed/${id}`:null}catch{return null}}
$('#load-video').onclick=()=>{const source=youtubeEmbedUrl($('#video-url').value);if(!source){setStatus('Please paste a valid public YouTube link.');return}$('#youtube-player').src=source;setStatus('Real YouTube video loaded. Start the stream to view its protocol simulation.');addLog('YouTube video loaded')};
$('#stream-button').onclick=()=>{const isPlaying=$('#stream-button').textContent==='Pause stream';if(isPlaying){$('#stream-button').textContent='Resume stream';$('#stream-state').textContent='Paused';stop();setStatus('Stream paused. The protocol view is paused too.');addLog('Stream paused')}else{$('#stream-button').textContent='Pause stream';$('#stream-state').textContent=`Playing · ${$('#quality').value}`;if(!currentFlow||!currentFlow.title.startsWith('Streaming'))start('stream',$('#quality').value);else play();addLog('Stream playing')}};
$('#next').onclick=()=>{stop();next()};$('#previous').onclick=previous;$('#replay').onclick=()=>{if(!currentFlow)return;stop();revealed=0;selected=-1;$('#detail-card').innerHTML='<p class="detail-empty">Replay started. A message will appear shortly.</p>';render();play()};$('#play-pause').onclick=()=>playing?stop():play();$('#speed').onchange=()=>{if(playing){stop();play()}};$('#clear-log').onclick=()=>$('#activity-log').innerHTML='<li>Log cleared</li>';
