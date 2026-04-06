// js/map.js

let map, markers = [];

const TYPE_CFG = {
  sight:      { label:'景點', color:'#4FC3F7', emoji:'🏛️' },
  restaurant: { label:'餐廳', color:'#FF9A3C', emoji:'🍽️' },
  nature:     { label:'自然', color:'#69D84F', emoji:'🌿' },
  hotel:      { label:'住宿', color:'#B57BFF', emoji:'🏨' },
  shopping:   { label:'購物', color:'#FF6B9D', emoji:'🛍️' }
};

function initMap() {
  const el = document.getElementById('map');
  if (!el) return;

  map = L.map('map', { zoomControl: true });

  // ESRI World Street Map — completely free, no API key, reliable globally
  L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, HERE, DeLorme, USGS',
      maxZoom: 19
    }
  ).addTo(map);

  // Comic colour filter
  const s = document.createElement('style');
  s.textContent = '.leaflet-tile-pane{filter:saturate(1.5) contrast(1.08) brightness(1.03);}';
  document.head.appendChild(s);

  map.setView([25, 110], 4);
  setTimeout(() => map.invalidateSize(), 200);
}

function loadCountryMarkers(country) {
  clearMarkers();
  country.places.forEach(pl => addMarker(pl));
}

function addMarker(pl) {
  const cfg = TYPE_CFG[pl.type] || TYPE_CFG.sight;
  const html =
    '<div style="' +
      'width:40px;height:40px;' +
      'background:' + cfg.color + ';' +
      'border:3.5px solid #1a1a1a;' +
      'border-radius:50% 50% 50% 4px;' +
      'transform:rotate(-45deg);' +
      'box-shadow:3px 3px 0 #1a1a1a;' +
      'display:flex;align-items:center;justify-content:center;' +
    '">' +
      '<span style="transform:rotate(45deg);font-size:17px;line-height:1">' + pl.icon + '</span>' +
    '</div>';

  const icon = L.divIcon({
    html: html,
    className: '',
    iconSize:    [40, 40],
    iconAnchor:  [20, 40],
    popupAnchor: [0, -44]
  });

  const m = L.marker([pl.lat, pl.lng], { icon: icon }).addTo(map);
  m.placeId = pl.id;
  m.bindPopup(buildPopup(pl, cfg), { minWidth: 210, maxWidth: 270 });
  m.on('click', function() { scrollToCard(pl.id); openCard(pl.id); });
  markers.push(m);
}

function buildPopup(pl, cfg) {
  // Use getNavUrl if available (defined in index.html), fallback to Google Maps
  var navUrl = (typeof getNavUrl === 'function') ? getNavUrl(pl, currentCountry) : 'https://www.google.com/maps/dir/?api=1&destination=' + pl.lat + ',' + pl.lng + '&travelmode=walking';
  const tel = pl.phone
    ? '<a class="pp-btn pp-btn-tel" href="tel:' + pl.phone + '">📞 電話</a>'
    : '';
  return '<div class="pp">' +
    '<div class="pp-head" style="background:' + cfg.color + '">' +
      '<span style="font-size:1.4em">' + pl.icon + '</span>' +
      '<div>' +
        '<div style="font-family:\'Fredoka One\',\'Noto Sans TC\',sans-serif;font-size:.95rem;line-height:1.2">' + pl.name + '</div>' +
        '<div style="font-size:.68rem;font-weight:800;opacity:.75">' + cfg.emoji + ' ' + cfg.label + (pl.tips ? ' · ' + pl.tips : '') + '</div>' +
      '</div>' +
    '</div>' +
    '<div class="pp-acts">' +
      '<button class="pp-btn" onclick="focusCard(\'' + pl.id + '\')">📋 詳情</button>' +
      ((typeof currentCountry !== 'undefined' && currentCountry && currentCountry.id === 'korea')
        ? '<button class="pp-btn pp-btn-nav" onclick="openNaverNav({lat:' + pl.lat + ',lng:' + pl.lng + ',name:' + JSON.stringify(pl.name) + '})">🗺️ Naver</button>'
        : '<a class="pp-btn pp-btn-nav" href="' + navUrl + '" target="_blank">🧭 導航</a>'
      ) +
      tel +
    '</div>' +
  '</div>';
}

function clearMarkers()   { markers.forEach(function(m){ map.removeLayer(m); }); markers = []; }
function panToPlace(a, b) { map.panTo([a, b], { animate: true, duration: 0.7 }); }
function flyToCountry(c, z) { map.flyTo(c, z, { duration: 1.0, easeLinearity: 0.4 }); }
function openMarkerPopup(id) {
  var m = markers.find(function(x){ return x.placeId === id; });
  if (m) m.openPopup();
}
function showMarkersOfTypes(country, activeTypes) {
  markers.forEach(function(m) {
    var pl = country.places.find(function(p){ return p.id === m.placeId; });
    if (pl && activeTypes.has(pl.type)) {
      if (!map.hasLayer(m)) m.addTo(map);
    } else {
      map.removeLayer(m);
    }
  });
}
