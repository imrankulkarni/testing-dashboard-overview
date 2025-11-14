(function(){
  const BACKEND = (location.hostname === 'localhost') ? 'http://localhost:4000' : (window.__BACKEND_URL__ || 'https://YOUR_RENDER_BACKEND_URL');
  if (typeof io === 'undefined') console.warn('Add <script src="https://cdn.socket.io/4.7.0/socket.io.min.js"></script>');
  const socket = io(BACKEND, { transports: ['websocket','polling'] });
  socket.on('connect', () => { try { socket.emit('presence:join', window.__CURRENT_USER__||{name:'anonymous'}); } catch(e){} });
  socket.on('dashboard:init', applyStateToDOM);
  socket.on('dashboard:update', (u)=>{ applyStateToDOM(u.state); });
  socket.on('presence:update', handlePresenceUpdate);
  socket.on('presence:leave', handlePresenceLeave);
  document.addEventListener('click', (e)=>{ const btn=e.target.closest('[data-action]'); if(!btn) return; fetch(`${BACKEND}/api/button/${encodeURIComponent(btn.dataset.action)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(btn.dataset.payload?JSON.parse(btn.dataset.payload):{by:'web'})}); });
  function applyStateToDOM(state){ if(!state) return; const el=document.getElementById('last-update'); if(el && state.lastUpdate) el.textContent=state.lastUpdate.action+' @ '+state.lastUpdate.timestamp; if(state.data){ Object.keys(state.data).forEach(k=>{ const c=document.getElementById('count-'+k); if(c) c.textContent=state.data[k]; }); } }
  function handlePresenceUpdate(p){ const el=document.getElementById('active-users'); if(!el) return; const list=el.querySelector('ul')||(function(){const ul=document.createElement('ul');el.appendChild(ul);return ul})(); let li=list.querySelector('[data-sid="'+p.id+'"]'); if(!li){ li=document.createElement('li'); li.setAttribute('data-sid',p.id); list.appendChild(li);} li.textContent=(p.user && p.user.name)?p.user.name:JSON.stringify(p.user); }
  function handlePresenceLeave(p){ const el=document.getElementById('active-users'); if(!el) return; const list=el.querySelector('ul'); if(!list) return; const li=list.querySelector('[data-sid="'+p.id+'"]'); if(li) li.remove(); }
  window.__DASHBOARD_SOCKET__=socket;
})();
