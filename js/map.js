// js/map.js — Leaflet map, markers, popups

let map, markers = [];

const TYPE_CFG = {
  sight:      { label:'景點', color:'#4FC3F7', emoji:'🏛️' },
  restaurant: { label:'餐廳', color:'#FF9A3C', emoji:'🍽️' },
  nature:     { label:'自然', color:'#69D84F', emoji:'🌿' }
};

function initMap() {
  map = L.map('map', { zoomControl: true });
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  // Comic colour filter
  const s = document.createElement('style');
  s.textContent = '.leaflet-tile-pane{filter:saturate(1.8) contrast(1.15) brightness(1.02) hue-rotate(8deg);}';
  document.head.appendChild(s);

  map.setView([25, 110], 4);
}

function loadCountryMarkers(country) {
  clearMarkers();
  country.places.forEach(pl => addMarker(pl));
}

// ── Diamond-pin marker (漫畫風菱形圖釘) ──
function addMarker(pl) {
  const cfg  = TYPE_CFG[pl.type] || TYPE_CFG.sight;
  const html = `
    <div style="
      width:40px;height:40px;
      background:${cfg.color};
      border:3.5px solid #1a1a1a;
      border-radius:50% 50% 50% 4px;
      transform:rotate(-45deg);
      box-shadow:3px 3px 0 #1a1a1a;
      display:flex;align-items:center;justify-content:center;
    ">
      <span style="transform:rotate(45deg);font-size:17px;line-height:1;">${pl.icon}</span>
    </div>`;
  const icon = L.divIcon({
    html,
    className: '',
    iconSize:   [40, 40],
    iconAnchor: [20, 40],
    popupAnchor:[0, -44]
  });
  const m = L.marker([pl.lat, pl.lng], { icon }).addTo(map);
  m.placeId = pl.id;
  m.bindPopup(buildPopup(pl, cfg), { minWidth:210, maxWidth:260 });
  m.on('click', () => { scrollToCard(pl.id); openCard(pl.id); });
  markers.push(m);
}

// ── Popup: 詳情 / 導航 / 電話 ──
function buildPopup(pl, cfg) {
  const navUrl  = `https://www.google.com/maps/dir/?api=1&destination=${pl.lat},${pl.lng}&travelmode=walking`;
  const telHtml = pl.phone
    ? `<a class="pp-btn pp-btn-tel" href="tel:${pl.phone}">📞 電話</a>`
    : '';
  return `<div class="pp">
    <div class="pp-head" style="background:${cfg.color}">
      <span style="font-size:1.45em">${pl.icon}</span>
      <div>
        <div style="font-family:var(--fh,'Fredoka One',sans-serif);font-size:.98rem;line-height:1.2">${pl.name}</div>
        <div style="font-size:.68rem;font-weight:800;opacity:.75">${cfg.emoji} ${cfg.label}${pl.tips ? ' · ' + pl.tips : ''}</div>
      </div>
    </div>
    <div class="pp-acts">
      <button class="pp-btn" onclick="focusCard('${pl.id}')">📋 詳情</button>
      <a class="pp-btn pp-btn-nav" href="${navUrl}" target="_blank">🧭 導航</a>
      ${telHtml}
    </div>
  </div>`;
}

function clearMarkers() {
  markers.forEach(m => map.removeLayer(m));
  markers = [];
}

function showMarkersOfTypes(country, activeTypes) {
  markers.forEach(m => {
    const pl = country.places.find(p => p.id === m.placeId);
    if (pl && activeTypes.has(pl.type)) {
      if (!map.hasLayer(m)) m.addTo(map);
    } else {
      map.removeLayer(m);
    }
  });
}

function panToPlace(lat, lng) { map.panTo([lat, lng], { animate:true, duration:0.7 }); }
function flyToCountry(c, z)   { map.flyTo(c, z, { duration:1.0, easeLinearity:0.4 }); }
function openMarkerPopup(id)  { const m = markers.find(x=>x.placeId===id); if(m) m.openPopup(); }
