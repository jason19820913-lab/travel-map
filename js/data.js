// js/data.js
// Loads travel data from data.json and exposes window.TRAVEL_DATA

var TRAVEL_DATA = null;

async function loadData() {
  // Try fetching data.json (works when served via HTTP/GitHub Pages)
  try {
    const res = await fetch('data.json?v=' + Date.now());
    if (!res.ok) throw new Error('fetch failed');
    TRAVEL_DATA = await res.json();
  } catch(e) {
    console.warn('Could not fetch data.json, using inline fallback.');
    TRAVEL_DATA = getInlineData();
  }
  return TRAVEL_DATA;
}

// Fallback inline data (mirrors data.json — keep in sync)
function getInlineData() {
  return {
    site: {
      title: "土豪哥的旅行漫遊地圖",
      subtitle: "TuHaoGe's Travel Map",
      description: "記錄每一段旅行的美好，分享給每一位旅人",
      adminPassword: "travel2024"
    },
    countries: []
  };
}
