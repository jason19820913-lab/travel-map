// js/app.js — Main app: tabs, sidebar, card logic

let currentCountry = null;
let activeFilters = new Set(['sight','restaurant','nature']);

// ── Boot ──
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();

  // Apply site config
  const site = TRAVEL_DATA.site;
  document.title = site.title;
  document.getElementById('siteTitle').textContent = site.title;
  document.getElementById('siteSubtitle').textContent = site.subtitle;

  // Init map
  initMap();

  // Build tabs
  buildTabs();

  // Auto-select first country
  if (TRAVEL_DATA.countries.length > 0) selectCountry(TRAVEL_DATA.countries[0]);

  // Load shared plan from URL
  loadPlanFromUrl();

  // Hide onboard tip after 6s or on first interaction
  const tip = document.getElementById('onboardTip');
  if (tip) {
    setTimeout(() => { tip.style.transition = 'opacity .6s'; tip.style.opacity = '0'; setTimeout(() => tip.remove(), 700); }, 6000);
  }
});

// ── Build Tabs ──
function buildTabs() {
  const wrap = document.getElementById('tabsWrap');
  wrap.innerHTML = '';
  TRAVEL_DATA.countries.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'tab-btn';
    btn.dataset.id = c.id;
    btn.innerHTML = `<span class="t-flag">${c.flag}</span>${c.name}<span class="tab-count">${c.places.length}</span>`;
    btn.addEventListener('click', () => selectCountry(c));
    wrap.appendChild(btn);
  });
}

// ── Select Country ──
function selectCountry(c) {
  currentCountry = c;
  activeFilters = new Set(['sight','restaurant','nature']);

  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.id === c.id));

  triggerSpeedLines();
  flyToCountry(c.center, c.zoom);
  loadCountryMarkers(c);
  renderSidebar(c);
}

// ── Sidebar ──
function renderSidebar(c) {
  document.getElementById('sflag').textContent  = c.flag;
  document.getElementById('stitle').textContent = c.name;
  document.getElementById('sdesc').textContent  = c.desc;

  // Filter chips
  const bar = document.getElementById('filterBar');
  bar.innerHTML = '';
  const types = [...new Set(c.places.map(p => p.type))];
  types.forEach(type => {
    const cfg = TYPE_CFG[type];
    const chip = document.createElement('button');
    chip.className = `f-chip active-${type}`;
    chip.dataset.type = type;
    chip.textContent = `${cfg.emoji} ${cfg.label}`;
    chip.addEventListener('click', () => {
      if (activeFilters.has(type)) {
        if (activeFilters.size === 1) return;
        activeFilters.delete(type);
        chip.classList.remove(`active-${type}`);
        chip.style.opacity = '0.4';
      } else {
        activeFilters.add(type);
        chip.classList.add(`active-${type}`);
        chip.style.opacity = '1';
      }
      renderCards(c);
      showMarkersOfTypes(c, activeFilters);
    });
    bar.appendChild(chip);
  });

  renderCards(c);
}

function renderCards(c) {
  const list = document.getElementById('placeList');
  list.innerHTML = '';
  c.places.filter(p => activeFilters.has(p.type)).forEach(pl => {
    const cfg = TYPE_CFG[pl.type];
    const dur = pl.duration ? (pl.duration >= 60 ? Math.floor(pl.duration/60) + 'h' + (pl.duration%60 ? (pl.duration%60)+'m':'') : pl.duration+'min') : '';
    const inPlan = isInPlan(pl.id);
    const card = document.createElement('div');
    card.className = `place-card card-${pl.type}`;
    card.id = `card-${pl.id}`;
    card.innerHTML = `
      <div class="card-top" onclick="toggleCard('${pl.id}',${pl.lat},${pl.lng})">
        <div class="card-icon-wrap">${pl.icon}</div>
        <div class="card-info">
          <div class="card-name">${pl.name}</div>
          <span class="card-badge">${cfg.emoji} ${cfg.label}</span>
          ${pl.tips ? `<div class="card-meta">💡 ${pl.tips}${dur ? ' · ⏱ '+dur : ''}</div>` : ''}
        </div>
        <div class="card-actions-top">
          <button class="btn-add-plan ${inPlan?'added':''}" data-place-id="${pl.id}"
            title="${inPlan?'已加入行程':'加入行程'}"
            onclick="event.stopPropagation(); quickAddToPlan('${pl.id}')"
          >${inPlan?'✅':'➕'}</button>
          <span class="card-chevron" id="chev-${pl.id}">▾</span>
        </div>
      </div>
      <div class="card-body" id="body-${pl.id}">
        <p class="card-desc">${pl.desc}</p>
        <div class="card-btns">
          <a class="btn btn-nav"     href="${pl.nav}"     target="_blank">🧭 導航</a>
          <a class="btn btn-article" href="${pl.article}" target="_blank">📝 文章</a>
          <button class="btn btn-plan" onclick="quickAddToPlan('${pl.id}')">➕ 加行程</button>
        </div>
      </div>`;
    list.appendChild(card);
  });
}

// ── Card Expand ──
function toggleCard(id, lat, lng) {
  const body = document.getElementById(`body-${id}`);
  const chev = document.getElementById(`chev-${id}`);
  const card = document.getElementById(`card-${id}`);
  const wasOpen = body.classList.contains('open');

  document.querySelectorAll('.card-body').forEach(b => b.classList.remove('open'));
  document.querySelectorAll('.card-chevron').forEach(c => c.classList.remove('open'));
  document.querySelectorAll('.place-card').forEach(c => c.classList.remove('is-active'));

  if (!wasOpen) {
    body.classList.add('open');
    chev.classList.add('open');
    card.classList.add('is-active');
    panToPlace(lat, lng);
    openMarkerPopup(id);
  }
}

function openCard(id) {
  const pl = currentCountry?.places.find(p => p.id === id);
  if (pl) toggleCard(id, pl.lat, pl.lng);
}

function scrollToCard(id) {
  const card = document.getElementById(`card-${id}`);
  if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function focusCard(id) {
  const pl = currentCountry?.places.find(p => p.id === id);
  if (!pl) return;
  if (!activeFilters.has(pl.type)) {
    activeFilters.add(pl.type);
    const chip = document.querySelector(`.f-chip[data-type="${pl.type}"]`);
    if (chip) { chip.classList.add(`active-${pl.type}`); chip.style.opacity = '1'; }
    renderCards(currentCountry);
    showMarkersOfTypes(currentCountry, activeFilters);
  }
  scrollToCard(id);
  openCard(id);
}

// ── Speed Lines FX ──
function triggerSpeedLines() {
  const el = document.getElementById('speedLines');
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 600);
}

// ════════════════════════════════════════════
// DRAG-TO-RESIZE sidebar (desktop)
// ════════════════════════════════════════════
(function initResize() {
  const handle  = document.getElementById('resizeHandle');
  const sidebar = document.getElementById('sidebar');
  if (!handle || !sidebar) return;

  let dragging = false, startX = 0, startW = 0;
  const isMobile = () => window.innerWidth <= 600;

  handle.addEventListener('mousedown', e => {
    if (isMobile()) return;
    dragging = true;
    startX   = e.clientX;
    startW   = sidebar.offsetWidth;
    handle.classList.add('dragging');
    document.body.style.cursor    = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });

  document.addEventListener('mousemove', e => {
    if (!dragging || isMobile()) return;
    const delta  = startX - e.clientX;           // drag left = wider
    const newW   = Math.min(Math.max(startW + delta, 200), window.innerWidth * 0.55);
    sidebar.style.width = newW + 'px';
    map && map.invalidateSize();
  });

  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    handle.classList.remove('dragging');
    document.body.style.cursor     = '';
    document.body.style.userSelect = '';
    map && map.invalidateSize();
  });

  // Touch support
  handle.addEventListener('touchstart', e => {
    if (isMobile()) return;
    dragging = true;
    startX   = e.touches[0].clientX;
    startW   = sidebar.offsetWidth;
    handle.classList.add('dragging');
    e.preventDefault();
  }, { passive: false });

  document.addEventListener('touchmove', e => {
    if (!dragging || isMobile()) return;
    const delta = startX - e.touches[0].clientX;
    const newW  = Math.min(Math.max(startW + delta, 200), window.innerWidth * 0.55);
    sidebar.style.width = newW + 'px';
  }, { passive: true });

  document.addEventListener('touchend', () => {
    if (!dragging) return;
    dragging = false;
    handle.classList.remove('dragging');
    map && map.invalidateSize();
  });
})();

// ════════════════════════════════════════════
// MOBILE PLANNER — backdrop toggle
// ════════════════════════════════════════════
const _origTogglePlanner = togglePlanner;
// Override togglePlanner to also manage backdrop on mobile
function togglePlanner() {
  _origTogglePlanner();
  const backdrop = document.getElementById('plannerBackdrop');
  if (backdrop && window.innerWidth <= 600) {
    backdrop.classList.toggle('show', plannerOpen);
  }
  // Invalidate map size after panel animation
  setTimeout(() => map && map.invalidateSize(), 350);
}
