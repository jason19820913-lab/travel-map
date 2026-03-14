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

  // Comic filter on tiles
  const s = document.createElement('style');
  s.textContent = '.leaflet-tile-pane{filter:saturate(1.8) contrast(1.15) brightness(1.02) hue-rotate(8deg);}';
  document.head.appendChild(s);

  map.setView([25, 110], 4);
}

function loadCountryMarkers(country) {
  clearMarkers();
  country.places.forEach(pl => addMarker(pl));
}

function addMarker(pl) {
  const cfg = TYPE_CFG[pl.type] || TYPE_CFG.sight;
  const html = `<div class="marker-body" style="background:${cfg.color}"><span class="marker-emoji">${pl.icon}</span></div>`;
  const icon = L.divIcon({ html, className:'comic-marker', iconSize:[38,38], iconAnchor:[19,38], popupAnchor:[0,-42] });
  const m = L.marker([pl.lat, pl.lng], { icon }).addTo(map);
  m.placeId = pl.id;

  m.bindPopup(buildPopupHTML(pl, cfg), { minWidth:185, maxWidth:250 });

  m.on('click', () => {
    scrollToCard(pl.id);
    openCard(pl.id);
  });
  markers.push(m);
}

function buildPopupHTML(pl, cfg) {
  return `<div class="comic-popup">
    <div class="popup-header" style="background:${cfg.color}">
      <span style="font-size:1.4em">${pl.icon}</span><span>${pl.name}</span>
    </div>
    <div class="popup-sub">${cfg.emoji} ${cfg.label}${pl.tips ? ' · ' + pl.tips : ''}</div>
    <div class="popup-actions">
      <button class="popup-btn" onclick="focusCard('${pl.id}')">📋 詳情</button>
      <button class="popup-btn popup-btn-plan" onclick="quickAddToPlan('${pl.id}')">➕ 加行程</button>
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

function panToPlace(lat, lng) {
  map.panTo([lat, lng], { animate: true, duration: 0.7 });
}

function flyToCountry(center, zoom) {
  map.flyTo(center, zoom, { duration: 1.0, easeLinearity: 0.4 });
}

function openMarkerPopup(placeId) {
  const m = markers.find(m => m.placeId === placeId);
  if (m) m.openPopup();
}
