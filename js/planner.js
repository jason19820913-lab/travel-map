// js/planner.js — Itinerary Planner v2
// Features: multi-day, drag-and-drop, auto-sort by distance (Haversine), share link, text export

let plannerOpen  = false;
let planDays     = [{ id:'d1', label:'第 1 天', items:[] }];
let dayCounter   = 1;
let dragPlaceId  = null;
let dragSrcDayId = null;
let dragOverEl   = null;

function togglePlanner() {
  plannerOpen = !plannerOpen;
  document.getElementById('plannerPanel').classList.toggle('open', plannerOpen);
  if (plannerOpen) renderPlanner();
}
function openPlanner() {
  plannerOpen = true;
  document.getElementById('plannerPanel').classList.add('open');
  renderPlanner();
}

function addDay() {
  dayCounter++;
  planDays.push({ id:'d'+dayCounter, label:'第 '+dayCounter+' 天', items:[] });
  renderPlanner(); updatePlannerCount();
}
function removeDay(dayId) {
  if (planDays.length === 1) { showToast('⚠️ 至少保留一天'); return; }
  const day   = planDays.find(d => d.id === dayId);
  const first = planDays.find(d => d.id !== dayId);
  if (day && first) day.items.forEach(item => { if (!first.items.find(i => i.id===item.id)) first.items.push(item); });
  planDays = planDays.filter(d => d.id !== dayId);
  renderPlanner(); updatePlannerCount(); showToast('景點已移入其他天');
}
function clearPlanner() {
  planDays=[{id:'d1',label:'第 1 天',items:[]}]; dayCounter=1;
  renderPlanner(); updatePlannerCount(); updateAddBtns(); clearRoutes();
}

function addToPlan(placeId, dayId) {
  const day = planDays.find(d => d.id===dayId) || planDays[0];
  if (planDays.some(d => d.items.find(i => i.id===placeId))) { showToast('✅ 已在行程中了！'); return; }
  const pl = findPlace(placeId); if (!pl) return;
  day.items.push(makePlanItem(pl));
  renderPlanner(); updatePlannerCount(); updateAddBtns();
  showToast('📌 已加入 '+day.label+'！');
}
function quickAddToPlan(placeId) {
  addToPlan(placeId, planDays[0].id);
  if (!plannerOpen) openPlanner();
}
function removeFromPlan(placeId, dayId) {
  const day = planDays.find(d => d.id===dayId); if (!day) return;
  day.items = day.items.filter(i => i.id!==placeId);
  renderPlanner(); updatePlannerCount(); updateAddBtns();
}
function isInPlan(placeId) { return planDays.some(d => d.items.some(i => i.id===placeId)); }
function makePlanItem(pl) {
  return { id:pl.id, name:pl.name, icon:pl.icon, type:pl.type, duration:pl.duration||60, nav:pl.nav, lat:pl.lat, lng:pl.lng };
}

// ════════════════════════════════════════════
// AUTO-SORT BY DISTANCE (Haversine + Nearest-Neighbour)
// ════════════════════════════════════════════
function haversine(lat1,lng1,lat2,lng2) {
  const R=6371, dL=(lat2-lat1)*Math.PI/180, dG=(lng2-lng1)*Math.PI/180;
  const a=Math.sin(dL/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dG/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
function sortByDistance(items) {
  if (items.length<=2) return [...items];
  const unvisited=[...items], result=[unvisited.shift()];
  while (unvisited.length) {
    const last=result[result.length-1]; let best=0, bestDist=Infinity;
    unvisited.forEach((item,idx) => { const d=haversine(last.lat,last.lng,item.lat,item.lng); if(d<bestDist){bestDist=d;best=idx;} });
    result.push(unvisited.splice(best,1)[0]);
  }
  return result;
}
function autoSortDay(dayId) {
  const day=planDays.find(d=>d.id===dayId);
  if (!day||day.items.length<2){showToast('⚠️ 至少需要 2 個地點');return;}
  day.items=sortByDistance(day.items);
  renderPlanner(); drawDayRoute(day); showToast('🗺️ 已依距離優化！');
}
function autoSortAll() {
  planDays.forEach(d=>{ if(d.items.length>=2) d.items=sortByDistance(d.items); });
  renderPlanner(); showToast('🗺️ 所有天數已優化！');
}

// Polyline route on Leaflet map
function drawDayRoute(day) {
  clearRoutes();
  if (typeof map==='undefined'||day.items.length<2) return;
  const coords=day.items.map(i=>[i.lat,i.lng]);
  const colors=['#FF6B9D','#4FC3F7','#69D84F','#FF9A3C','#B57BFF'];
  const color=colors[planDays.indexOf(day)%colors.length];
  const line=L.polyline(coords,{color,weight:4,opacity:.8,dashArray:'8,5',lineJoin:'round'}).addTo(map);
  window._routeLayers=[line];
  map.fitBounds(line.getBounds(),{padding:[50,50]});
}
function clearRoutes() {
  if(window._routeLayers) window._routeLayers.forEach(l=>{try{map.removeLayer(l);}catch(e){}});
  window._routeLayers=[];
}

// ════════════════════════════════════════════
// RENDER
// ════════════════════════════════════════════
const dayBgColors=['#FFE94E','#FFD0E8','#C8F0FF','#D0FFD8','#E8DAFF','#FFE0C0'];

function renderPlanner() {
  const container=document.getElementById('plannerDays');
  const summary=document.getElementById('plannerSummary');
  if (!container) return;
  const totalItems=planDays.reduce((s,d)=>s+d.items.length,0);
  const totalMins=planDays.reduce((s,d)=>s+d.items.reduce((ss,i)=>ss+(i.duration||60),0),0);
  const totalKm=calcTotalKm();
  summary.innerHTML=`<span>📅 ${planDays.length} 天</span><span>📍 ${totalItems} 站</span><span>⏱ ${fmtDur(totalMins)}</span>${totalKm>0?'<span>🛣️ ~'+totalKm+'km</span>':''}`;

  if (totalItems===0&&planDays.length===1) {
    container.innerHTML=`<div class="empty-planner"><div class="big">🗺️</div><div>還沒有任何行程</div><div style="font-size:.7rem;color:#bbb;margin-top:6px">點景點的 ➕ 按鈕，或從地圖彈窗加入！</div></div>`;
    return;
  }
  container.innerHTML='';
  planDays.forEach((day,dayIdx)=>{
    const dayMins=day.items.reduce((s,i)=>s+(i.duration||60),0);
    const dayKm=day.items.length>=2?calcRouteKm(day.items):0;
    const block=document.createElement('div'); block.className='day-block';
    block.innerHTML=`
      <div class="day-label" style="background:${dayBgColors[dayIdx%dayBgColors.length]}">
        <div class="day-title">
          <span>📅</span>
          <span contenteditable="true" class="day-name-edit"
            onblur="renameDayBlur('${day.id}',this.textContent)"
            onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur()}"
          >${day.label}</span>
          <small class="day-meta">${day.items.length}站 · ${fmtDur(dayMins)}${dayKm>0?' · ~'+dayKm+'km':''}</small>
        </div>
        <div class="day-label-actions">
          <button class="day-sort-btn" onclick="autoSortDay('${day.id}')" title="依距離自動排序">🗺️ 排序</button>
          <button class="day-remove-btn" onclick="removeDay('${day.id}')">✕</button>
        </div>
      </div>
      <div class="drop-zone" id="dz-${day.id}" data-day="${day.id}">
        ${day.items.length===0?'<div class="drop-zone-hint">拖曳景點到這裡 或 點 ➕ 加入</div>':''}
        ${day.items.map((item,idx)=>renderPlanItem(item,day.id,idx)).join('')}
      </div>`;
    container.appendChild(block);
    setupDropZone(document.getElementById('dz-'+day.id));
  });
  document.querySelectorAll('.plan-item[draggable]').forEach(el=>{
    el.addEventListener('dragstart',onItemDragStart);
    el.addEventListener('dragend',onItemDragEnd);
  });
}

function renderPlanItem(item,dayId,idx) {
  return `<div class="plan-item ${item.type}-item" draggable="true" data-id="${item.id}" data-day="${dayId}">
    <div class="pi-drag">⠿</div>
    <span class="pi-num">${idx+1}</span>
    <span class="pi-icon">${item.icon}</span>
    <div class="pi-info"><div class="pi-name">${item.name}</div><div class="pi-dur">⏱ ${fmtDur(item.duration)}</div></div>
    <a class="pi-nav" href="${item.nav}" target="_blank" onclick="event.stopPropagation()">🧭</a>
    <button class="pi-remove" onclick="removeFromPlan('${item.id}','${dayId}')">✕</button>
  </div>`;
}

function fmtDur(mins) {
  if (!mins) return '60min';
  return mins>=60?Math.floor(mins/60)+'h'+(mins%60?mins%60+'m':''):mins+'min';
}
function renameDayBlur(dayId,text) {
  const day=planDays.find(d=>d.id===dayId);
  if (day&&text.trim()) day.label=text.trim();
}

// ════════════════════════════════════════════
// DRAG & DROP
// ════════════════════════════════════════════
function onItemDragStart(e) {
  dragPlaceId=e.currentTarget.dataset.id; dragSrcDayId=e.currentTarget.dataset.day;
  e.currentTarget.classList.add('dragging'); e.dataTransfer.effectAllowed='move';
}
function onItemDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
  document.querySelectorAll('.drop-zone').forEach(z=>z.classList.remove('drag-over'));
}
function setupDropZone(el) {
  el.addEventListener('dragover',e=>{
    e.preventDefault(); e.dataTransfer.dropEffect='move';
    if (dragOverEl&&dragOverEl!==el) dragOverEl.classList.remove('drag-over');
    el.classList.add('drag-over'); dragOverEl=el;
  });
  el.addEventListener('dragleave',e=>{ if(!el.contains(e.relatedTarget)) el.classList.remove('drag-over'); });
  el.addEventListener('drop',e=>{
    e.preventDefault(); el.classList.remove('drag-over');
    if (!dragPlaceId) return;
    const targetDayId=el.dataset.day;
    if (dragSrcDayId===targetDayId) {
      // reorder within same day
      const day=planDays.find(d=>d.id===targetDayId);
      const afterEl=getDragAfterElement(el,e.clientY);
      const item=day.items.find(i=>i.id===dragPlaceId);
      day.items=day.items.filter(i=>i.id!==dragPlaceId);
      if (!afterEl) day.items.push(item);
      else { const idx=day.items.findIndex(i=>i.id===afterEl.dataset.id); day.items.splice(Math.max(0,idx),0,item); }
    } else {
      const src=planDays.find(d=>d.id===dragSrcDayId);
      const tgt=planDays.find(d=>d.id===targetDayId);
      if (!src||!tgt) return;
      if (tgt.items.find(i=>i.id===dragPlaceId)){showToast('已在那天了');return;}
      const item=src.items.find(i=>i.id===dragPlaceId);
      src.items=src.items.filter(i=>i.id!==dragPlaceId);
      tgt.items.push(item); showToast('↔️ 已移至'+tgt.label);
    }
    dragPlaceId=null; dragSrcDayId=null;
    renderPlanner(); updatePlannerCount();
  });
}
function getDragAfterElement(container,y) {
  const els=[...container.querySelectorAll('.plan-item:not(.dragging)')];
  return els.reduce((closest,el)=>{
    const box=el.getBoundingClientRect(), offset=y-box.top-box.height/2;
    return (offset<0&&offset>closest.offset)?{offset,element:el}:closest;
  },{offset:-Infinity}).element;
}

// ════════════════════════════════════════════
// DISTANCE CALC
// ════════════════════════════════════════════
function calcRouteKm(items) {
  if (items.length<2) return 0;
  let total=0;
  for(let i=0;i<items.length-1;i++) total+=haversine(items[i].lat,items[i].lng,items[i+1].lat,items[i+1].lng);
  return Math.round(total);
}
function calcTotalKm() { return planDays.reduce((s,d)=>s+calcRouteKm(d.items),0); }

// ════════════════════════════════════════════
// SHARE & EXPORT
// ════════════════════════════════════════════
function sharePlan() {
  const payload=planDays.map(d=>({l:d.label,ids:d.items.map(i=>i.id)}));
  const encoded=btoa(encodeURIComponent(JSON.stringify(payload)));
  const url=location.href.split('?')[0]+'?plan='+encoded;
  document.getElementById('shareUrl').value=url;
  document.getElementById('shareModal').classList.remove('hidden');
}
function copyShareUrl() {
  const val=document.getElementById('shareUrl').value;
  navigator.clipboard.writeText(val).then(()=>showToast('✅ 連結已複製！')).catch(()=>{document.getElementById('shareUrl').select();document.execCommand('copy');showToast('✅ 連結已複製！');});
}
function closeShareModal() { document.getElementById('shareModal').classList.add('hidden'); }

function loadPlanFromUrl() {
  const raw=new URLSearchParams(location.search).get('plan'); if(!raw) return;
  try {
    const data=JSON.parse(decodeURIComponent(atob(raw)));
    planDays=[]; data.forEach((d,i)=>{
      const items=d.ids.map(id=>{const pl=findPlace(id);return pl?makePlanItem(pl):null;}).filter(Boolean);
      planDays.push({id:'d'+(i+1),label:d.l,items});
    });
    dayCounter=planDays.length;
    openPlanner(); updatePlannerCount(); updateAddBtns();
    showToast('🗓️ 已載入分享行程！');
  } catch(e){console.warn('Invalid plan URL',e);}
}

function exportPlan() {
  let text='✈️ 我的旅行行程\n'+'═'.repeat(28)+'\n\n';
  planDays.forEach(d=>{
    const mins=d.items.reduce((s,i)=>s+(i.duration||60),0);
    text+=`【${d.label}】（約 ${fmtDur(mins)}）\n`;
    d.items.forEach((item,idx)=>{ text+=`  ${idx+1}. ${item.icon} ${item.name}（${fmtDur(item.duration)}）\n`; });
    if(d.items.length>=2) text+=`  🛣️ 總移動距離約 ${calcRouteKm(d.items)} km\n`;
    text+='\n';
  });
  text+='─'.repeat(28)+'\n✈️ 由旅行漫遊地圖規劃\n'+location.href.split('?')[0];
  navigator.clipboard.writeText(text).then(()=>showToast('📋 行程已複製！')).catch(()=>showToast('⚠️ 請手動複製'));
}

// ════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════
function findPlace(id) {
  if (!TRAVEL_DATA) return null;
  for (const c of TRAVEL_DATA.countries) { const pl=c.places.find(p=>p.id===id); if(pl) return pl; }
  return null;
}
function updatePlannerCount() {
  const total=planDays.reduce((s,d)=>s+d.items.length,0);
  const el=document.getElementById('plannerCount');
  if(el){el.textContent=total;el.style.display=total>0?'':'none';}
}
function updateAddBtns() {
  document.querySelectorAll('.btn-add-plan').forEach(btn=>{
    const pid=btn.dataset.placeId; if(!pid) return;
    const added=isInPlan(pid);
    btn.classList.toggle('added',added);
    btn.title=added?'已加入行程':'加入行程';
    btn.textContent=added?'✅':'➕';
  });
}
function showToast(msg) {
  const t=document.getElementById('toast'); if(!t) return;
  t.textContent=msg; t.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer=setTimeout(()=>t.classList.remove('show'),2600);
}
