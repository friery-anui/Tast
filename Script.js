const player = document.getElementById('player');
const playlistEl = document.getElementById('playlist');
const fileInput = document.getElementById('fileInput');
const search = document.getElementById('search');
const btnLoadSample = document.getElementById('btnLoadSample');
const btnPlayAll = document.getElementById('btnPlayAll');
const btnClear = document.getElementById('btnClear');
const playPause = document.getElementById('playPause');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const currentTitle = document.getElementById('currentTitle');
const progress = document.getElementById('progress');
const bar = document.getElementById('bar');
const timeEl = document.getElementById('time');
const volume = document.getElementById('volume');
const btnFull = document.getElementById('btnFull');
const status = document.getElementById('status');

let library = []; // {id, name, type, url, size}
let index = -1;

function formatTime(s){
  if (!isFinite(s)) return '00:00';
  const mm = Math.floor(s/60).toString().padStart(2,'0');
  const ss = Math.floor(s%60).toString().padStart(2,'0');
  return `${mm}:${ss}`;
}

function renderList(filter=''){
  playlistEl.innerHTML='';
  library.forEach((m,i)=>{
    if (filter && !m.name.toLowerCase().includes(filter.toLowerCase())) return;
    const item = document.createElement('div'); item.className='item'; item.dataset.index=i;
    const thumb = document.createElement('div'); thumb.className='thumb'; thumb.textContent = m.type === 'video' ? 'VID' : 'AUD';
    const meta = document.createElement('div'); meta.className='meta';
    const t = document.createElement('div'); t.className='title'; t.textContent = m.name;
    const s = document.createElement('div'); s.className='sub'; s.textContent = `${m.type} • ${m.size || ''}`;
    meta.appendChild(t); meta.appendChild(s);
    item.appendChild(thumb); item.appendChild(meta);
    item.addEventListener('click', ()=> playIndex(i));
    playlistEl.appendChild(item);
  })
}

// play by index
async function playIndex(i){
  if (i<0 || i>=library.length) return;
  index = i; const m = library[i];
  player.src = m.url;
  currentTitle.textContent = m.name;
  status.textContent = `Phát: ${m.name}`;
  try{ await player.play(); }catch(e){ console.warn(e); }
  updateUI();
}

function updateUI(){
  playPause.textContent = player.paused ? '▶' : '❚❚';
}

// handle progress
player.addEventListener('timeupdate', ()=>{
  const pct = player.currentTime / (player.duration || 1) * 100;
  bar.style.width = pct + '%';
  timeEl.textContent = `${formatTime(player.currentTime)} / ${formatTime(player.duration)}`;
});
player.addEventListener('ended', ()=>{
  if (index+1 < library.length) playIndex(index+1);
  else status.textContent = 'Kết thúc danh sách';
});
playPause.addEventListener('click', ()=>{
  if (!player.src) return;
  if (player.paused) player.play(); else player.pause();
  updateUI();
});
player.addEventListener('play', updateUI);
player.addEventListener('pause', updateUI);
prevBtn.addEventListener('click', ()=>{ if (index>0) playIndex(index-1); });
nextBtn.addEventListener('click', ()=>{ if (index+1<library.length) playIndex(index+1); });

// seek
progress.addEventListener('click', (e)=>{
  const rect = progress.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const pct = x / rect.width;
  if (player.duration) player.currentTime = pct * player.duration;
});
volume.addEventListener('input', ()=>{ player.volume = volume.value; });
btnFull.addEventListener('click', ()=>{
  const wrap = document.getElementById('videoWrap');
  if (!document.fullscreenElement) wrap.requestFullscreen().catch(()=>{});
  else document.exitFullscreen().catch(()=>{});
});

// file input
document.querySelector('label.btn').addEventListener('click', ()=> fileInput.click());
fileInput.addEventListener('change', (e)=>{
  const files = Array.from(e.target.files);
  files.forEach(f=> addFileToLibrary(f));
  renderList(search.value);
});

// drag & drop
const videoWrap = document.getElementById('videoWrap');
['dragenter','dragover'].forEach(ev=> videoWrap.addEventListener(ev, (e)=>{ e.preventDefault(); videoWrap.style.outline='2px dashed rgba(255,255,255,0.06)'; }));
['dragleave','drop'].forEach(ev=> videoWrap.addEventListener(ev, (e)=>{ e.preventDefault(); videoWrap.style.outline='none'; }));
videoWrap.addEventListener('drop', (e)=>{
  const items = Array.from(e.dataTransfer.files||[]);
  items.forEach(f=> addFileToLibrary(f));
  renderList(search.value);
});

function addFileToLibrary(file){
  const url = URL.createObjectURL(file);
  const type = file.type.startsWith('video') ? 'video' : (file.type.startsWith('audio') ? 'audio' : 'other');
  if (type==='other') return;
  library.push({id:Date.now()+Math.random(), name:file.name, type, url, size: humanFileSize(file.size)});
  status.textContent = `Đã thêm: ${file.name}`;
}
function humanFileSize(bytes){
  const thresh = 1024;
  if (Math.abs(bytes) < thresh) return bytes + ' B';
  const units = ['KB','MB','GB','TB']; let u = -1;
  do { bytes /= thresh; ++u; } while(Math.abs(bytes) >= thresh && u < units.length - 1);
  return bytes.toFixed(1)+' '+units[u];
}

// sample demo
btnLoadSample.addEventListener('click', ()=>{
  const samples = [
    {name:'Big Buck Bunny (sample)', type:'video', url:'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', size:'4.3 MB'},
    {name:'Sample Audio (piano)', type:'audio', url:'https://interactive-examples.mdn.mozilla.net/media/examples/t-rex-roar.mp3', size:'1.6 MB'}
  ];
  samples.forEach(s=> library.push({...s,id:Date.now()+Math.random()}));
  renderList(search.value);
});

// play all / clear
btnPlayAll.addEventListener('click', ()=>{ if (library.length) playIndex(0); });
btnClear.addEventListener('click', ()=>{
  library.forEach(m=>{ if(m.url.startsWith('blob:')) URL.revokeObjectURL(m.url); });
  library = []; renderList(); player.pause(); player.removeAttribute('src');
  currentTitle.textContent='— Chưa chọn —'; status.textContent='Đã xóa danh sách';
});

// search
search.addEventListener('input', ()=> renderList(search.value));

// shortcuts
window.addEventListener('keydown', (e)=>{
  if (e.code === 'Space' && document.activeElement.tagName !== 'INPUT') {
    e.preventDefault(); if (player.src) { if (player.paused) player.play(); else player.pause(); updateUI(); }
  }
  if (e.key === 'ArrowRight') player.currentTime = Math.min(player.duration||0, player.currentTime + 10);
  if (e.key === 'ArrowLeft') player.currentTime = Math.max(0, player.currentTime - 10);
  if (e.key === 'ArrowUp') { player.volume = Math.min(1, player.volume + 0.05); volume.value = player.volume; }
  if (e.key === 'ArrowDown') { player.volume = Math.max(0, player.volume - 0.05); volume.value = player.volume; }
  if (e.key.toLowerCase() === 'f') { btnFull.click(); }
});

// persistence
window.addEventListener('beforeunload', ()=>{
  try{
    localStorage.setItem('mini_media_library',
      JSON.stringify(library.map(l=>({name:l.name,type:l.type,url:l.url,size:l.size}))));
  }catch(e){}
});
try{
  const saved = JSON.parse(localStorage.getItem('mini_media_library')||'[]');
  if (saved.length) { saved.forEach(s=> library.push({...s,id:Date.now()+Math.random()})); renderList(); }
}catch(e){}

// init
renderList();
  
