// js/data.js — load travel data from data.json
var TRAVEL_DATA = null;

async function loadData() {
  try {
    const res = await fetch('./data.json?v=' + Date.now());
    if (!res.ok) throw new Error('HTTP ' + res.status);
    TRAVEL_DATA = await res.json();
    console.log('✅ data.json loaded:', TRAVEL_DATA.countries?.length, 'countries');
  } catch(e) {
    console.error('❌ data.json load failed:', e.message);
    // Empty fallback so map still initialises
    TRAVEL_DATA = {
      site: { title: '土豪哥的旅行漫遊地圖', subtitle: "TuHaoGe's Travel Map" },
      countries: []
    };
  }
  return TRAVEL_DATA;
}
