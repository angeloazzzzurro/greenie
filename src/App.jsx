import { useState, useRef, useCallback } from "react";

const SCREENS = { HOME: "home", SCAN: "scan", RESULT: "result", LIBRARY: "library", MAP: "map", CALENDAR: "calendar" };

const ROOMS = [
  { id: "living",   name: "Living Room", icon: "🛋️",  color: "#2D6A4F" },
  { id: "bedroom",  name: "Bedroom",     icon: "🛏️",  color: "#1B4332" },
  { id: "kitchen",  name: "Kitchen",     icon: "🍳",  color: "#40916C" },
  { id: "bathroom", name: "Bathroom",    icon: "🚿",  color: "#1B4332" },
  { id: "balcony",  name: "Balcony",     icon: "🌤️", color: "#52B788" },
  { id: "study",    name: "Study",       icon: "📚",  color: "#2D6A4F" },
];

// ─── localStorage helpers ─────────────────────────────────────────────────────

function loadLibrary() {
  try { return JSON.parse(localStorage.getItem("greenie_library") || "[]"); }
  catch { return []; }
}

function saveLibrary(lib) {
  localStorage.setItem("greenie_library", JSON.stringify(lib));
}

function loadApiKey() {
  return localStorage.getItem("greenie_apikey") || import.meta.env.VITE_ANTHROPIC_KEY || "";
}

function saveApiKey(key) {
  localStorage.setItem("greenie_apikey", key);
}

function wateredLabel(dateStr) {
  if (!dateStr) return "Unknown";
  const days = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

// ─── Stili ───────────────────────────────────────────────────────────────────

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --bg: #0A0F0A;
    --surface: #111811;
    --surface2: #182018;
    --border: rgba(74,157,82,0.15);
    --green-deep: #1B4332;
    --green-mid: #2D6A4F;
    --green-bright: #52B788;
    --green-glow: #74C69D;
    --green-light: #B7E4C7;
    --cream: #F0EBE0;
    --text: #E8F5E8;
    --text-muted: #6B8F71;
    --accent: #95D5B2;
    --danger: #E07A5F;
    --warn: #F2CC8F;
    --font-display: 'Playfair Display', serif;
    --font-body: 'DM Sans', sans-serif;
  }

  .app {
    font-family: var(--font-body);
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    max-width: 430px;
    margin: 0 auto;
    position: relative;
    overflow: hidden;
  }

  .app::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 9999;
    opacity: 0.6;
  }

  .screen {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    animation: fadeSlide 0.4s ease;
  }

  @keyframes fadeSlide {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .home-header {
    padding: 56px 24px 24px;
    background: linear-gradient(160deg, #0A1A0E 0%, #0A0F0A 60%);
    position: relative;
    overflow: hidden;
  }

  .home-header::after {
    content: '';
    position: absolute;
    top: -80px; right: -80px;
    width: 280px; height: 280px;
    background: radial-gradient(circle, rgba(82,183,136,0.12) 0%, transparent 70%);
    border-radius: 50%;
  }

  .greeting {
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 300;
    color: var(--text-muted);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  .home-title {
    font-family: var(--font-display);
    font-size: 34px;
    font-weight: 700;
    color: var(--text);
    line-height: 1.1;
  }

  .home-title em { color: var(--green-bright); font-style: italic; }

  .home-subtitle {
    margin-top: 10px;
    font-size: 14px;
    color: var(--text-muted);
    font-weight: 300;
  }

  .scan-hero {
    margin: 28px 24px;
    background: linear-gradient(135deg, var(--green-deep) 0%, #0D2B1F 100%);
    border-radius: 24px;
    padding: 32px 24px;
    position: relative;
    overflow: hidden;
    cursor: pointer;
    border: 1px solid rgba(82,183,136,0.2);
    transition: transform 0.2s;
  }

  .scan-hero:active { transform: scale(0.98); }

  .scan-hero::before {
    content: '🌿';
    position: absolute;
    right: 20px; top: 50%;
    transform: translateY(-50%);
    font-size: 72px;
    opacity: 0.25;
  }

  .scan-label {
    font-size: 11px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--green-bright);
    font-weight: 500;
    margin-bottom: 8px;
  }

  .scan-hero h2 {
    font-family: var(--font-display);
    font-size: 26px;
    font-weight: 700;
    color: var(--cream);
    line-height: 1.2;
  }

  .scan-hero p {
    font-size: 13px;
    color: rgba(240,235,224,0.5);
    margin-top: 8px;
    font-weight: 300;
  }

  .scan-btn-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: 20px;
    background: var(--green-bright);
    color: var(--bg);
    font-weight: 500;
    font-size: 14px;
    padding: 10px 20px;
    border-radius: 100px;
    border: none;
    cursor: pointer;
    font-family: var(--font-body);
  }

  .section { padding: 0 24px; margin-bottom: 28px; }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
  }

  .section-title {
    font-family: var(--font-display);
    font-size: 20px;
    font-weight: 700;
    color: var(--text);
  }

  .see-all {
    font-size: 12px;
    color: var(--green-bright);
    cursor: pointer;
    font-weight: 400;
    letter-spacing: 0.05em;
  }

  .plant-card {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 10px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .plant-card:active { opacity: 0.8; transform: scale(0.99); }

  .plant-emoji-circle {
    width: 48px; height: 48px;
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    font-size: 24px;
    flex-shrink: 0;
  }

  .plant-info { flex: 1; }
  .plant-name { font-size: 15px; font-weight: 500; color: var(--text); }
  .plant-family { font-size: 12px; color: var(--text-muted); margin-top: 2px; font-style: italic; }

  .health-bar-wrap { display: flex; align-items: center; gap: 8px; margin-top: 8px; }

  .health-bar {
    flex: 1; height: 3px;
    background: rgba(255,255,255,0.08);
    border-radius: 2px;
    overflow: hidden;
  }

  .health-fill { height: 100%; border-radius: 2px; transition: width 1s ease; }
  .health-val { font-size: 11px; font-weight: 500; color: var(--text-muted); }
  .water-badge { font-size: 11px; color: var(--text-muted); font-weight: 300; white-space: nowrap; }

  .tips-scroll {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    padding-bottom: 4px;
    scrollbar-width: none;
  }
  .tips-scroll::-webkit-scrollbar { display: none; }

  .tip-card {
    flex-shrink: 0;
    width: 140px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 14px;
    font-size: 12px;
  }

  .tip-icon { font-size: 20px; margin-bottom: 8px; }
  .tip-title { font-weight: 500; color: var(--accent); margin-bottom: 4px; }
  .tip-text { color: var(--text-muted); line-height: 1.4; font-weight: 300; }

  .bottom-nav {
    position: fixed;
    bottom: 0; left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 430px;
    background: rgba(10,15,10,0.92);
    backdrop-filter: blur(20px);
    border-top: 1px solid var(--border);
    display: flex;
    padding: 12px 0 24px;
    z-index: 100;
  }

  .nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    opacity: 0.4;
    transition: opacity 0.2s;
  }

  .nav-item.active { opacity: 1; }
  .nav-item svg { width: 22px; height: 22px; }
  .nav-label { font-size: 10px; font-weight: 400; letter-spacing: 0.05em; }

  .scan-screen { background: #000; }

  .camera-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    min-height: 60vh;
    background: linear-gradient(160deg, #050D07 0%, #000 100%);
  }

  .upload-zone {
    width: 260px; height: 260px;
    border: 2px dashed rgba(82,183,136,0.3);
    border-radius: 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: all 0.3s;
  }

  .upload-zone:hover {
    border-color: var(--green-bright);
    background: rgba(82,183,136,0.04);
  }

  .upload-zone.has-image { border-style: solid; }

  .upload-preview {
    position: absolute; inset: 0;
    object-fit: cover;
    border-radius: 30px;
  }

  .upload-overlay {
    position: absolute; inset: 0;
    background: rgba(0,0,0,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 30px;
  }

  .corner {
    position: absolute;
    width: 20px; height: 20px;
    border-color: var(--green-bright);
    border-style: solid;
    border-width: 0;
  }
  .corner.tl { top: 8px; left: 8px; border-top-width: 2px; border-left-width: 2px; border-top-left-radius: 4px; }
  .corner.tr { top: 8px; right: 8px; border-top-width: 2px; border-right-width: 2px; border-top-right-radius: 4px; }
  .corner.bl { bottom: 8px; left: 8px; border-bottom-width: 2px; border-left-width: 2px; border-bottom-left-radius: 4px; }
  .corner.br { bottom: 8px; right: 8px; border-bottom-width: 2px; border-right-width: 2px; border-bottom-right-radius: 4px; }

  .upload-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    color: var(--text-muted);
    font-size: 13px;
    font-weight: 300;
  }
  .upload-placeholder span:first-child { font-size: 36px; }

  .scan-bottom {
    padding: 24px;
    background: var(--surface);
    border-top: 1px solid var(--border);
  }

  .apikey-input {
    width: 100%;
    padding: 11px 14px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 12px;
    color: var(--text);
    font-size: 13px;
    font-family: var(--font-body);
    outline: none;
    margin-bottom: 12px;
  }
  .apikey-input:focus { border-color: var(--green-bright); }
  .apikey-input::placeholder { color: var(--text-muted); }

  .scan-hint {
    font-size: 12px;
    color: var(--text-muted);
    text-align: center;
    margin-bottom: 16px;
    line-height: 1.5;
    font-weight: 300;
  }

  .analyze-btn {
    width: 100%;
    padding: 16px;
    background: var(--green-bright);
    color: var(--bg);
    border: none;
    border-radius: 16px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    font-family: var(--font-body);
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  .analyze-btn:active { transform: scale(0.98); background: var(--green-glow); }
  .analyze-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .loading-screen {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 24px;
    padding: 40px;
  }

  .loading-orb {
    width: 100px; height: 100px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, var(--green-glow), var(--green-deep));
    animation: pulse 1.8s ease-in-out infinite;
    position: relative;
  }

  .loading-orb::after {
    content: '🌿';
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40px;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(82,183,136,0.4); }
    50% { transform: scale(1.08); box-shadow: 0 0 0 24px rgba(82,183,136,0); }
  }

  .loading-text {
    font-family: var(--font-display);
    font-size: 22px;
    color: var(--text);
    text-align: center;
  }

  .loading-sub {
    font-size: 13px;
    color: var(--text-muted);
    text-align: center;
    font-weight: 300;
  }

  .result-hero { position: relative; height: 280px; overflow: hidden; }

  .result-img { width: 100%; height: 100%; object-fit: cover; }

  .result-img-placeholder {
    width: 100%; height: 100%;
    background: linear-gradient(135deg, var(--green-deep), #0A1F10);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 80px;
  }

  .result-gradient {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 160px;
    background: linear-gradient(transparent, var(--bg));
  }

  .result-badge {
    position: absolute;
    top: 16px; left: 16px;
    background: rgba(10,15,10,0.85);
    backdrop-filter: blur(10px);
    border: 1px solid var(--border);
    padding: 6px 12px;
    border-radius: 100px;
    font-size: 11px;
    color: var(--green-bright);
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .back-btn {
    position: absolute;
    top: 16px; right: 16px;
    width: 36px; height: 36px;
    background: rgba(10,15,10,0.85);
    backdrop-filter: blur(10px);
    border: 1px solid var(--border);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 18px;
    color: var(--text);
  }

  .result-content { padding: 16px 24px 120px; }

  .plant-main-name {
    font-family: var(--font-display);
    font-size: 32px;
    font-weight: 700;
    color: var(--text);
    line-height: 1.1;
  }

  .plant-sci-name {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 15px;
    color: var(--text-muted);
    margin-top: 4px;
  }

  .confidence-row { display: flex; align-items: center; gap: 10px; margin-top: 12px; }
  .conf-label { font-size: 12px; color: var(--text-muted); }
  .conf-bar { flex: 1; height: 4px; background: rgba(255,255,255,0.08); border-radius: 2px; overflow: hidden; }
  .conf-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--green-mid), var(--green-glow));
    border-radius: 2px;
  }
  .conf-val { font-size: 12px; color: var(--green-bright); font-weight: 500; }

  .tags-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 16px; }

  .tag {
    padding: 5px 12px;
    border-radius: 100px;
    font-size: 11px;
    font-weight: 400;
    border: 1px solid;
  }

  .tag-green { border-color: rgba(82,183,136,0.3); color: var(--green-bright); background: rgba(82,183,136,0.08); }

  .divider { height: 1px; background: var(--border); margin: 20px 0; }

  .section-label {
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-muted);
    font-weight: 500;
    margin-bottom: 12px;
  }

  .description { font-size: 14px; line-height: 1.7; color: rgba(232,245,232,0.75); font-weight: 300; }

  .care-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 4px; }

  .care-item {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 14px;
  }

  .care-icon { font-size: 22px; margin-bottom: 6px; }
  .care-title { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
  .care-value { font-size: 13px; font-weight: 500; color: var(--text); }

  .health-analysis {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 16px;
  }

  .health-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }

  .health-score { font-family: var(--font-display); font-size: 28px; font-weight: 700; }

  .issues-list { margin-top: 8px; }
  .issue-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 8px 0;
    border-bottom: 1px solid var(--border);
    font-size: 13px;
    line-height: 1.5;
    color: rgba(232,245,232,0.75);
    font-weight: 300;
  }
  .issue-item:last-child { border-bottom: none; }
  .issue-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }

  .health-pill { padding: 4px 10px; border-radius: 100px; font-size: 12px; font-weight: 500; }

  .add-library-btn {
    width: 100%;
    padding: 14px;
    background: transparent;
    border: 1px solid var(--green-bright);
    color: var(--green-bright);
    border-radius: 14px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    font-family: var(--font-body);
    margin-top: 16px;
    transition: all 0.2s;
  }
  .add-library-btn:active { background: rgba(82,183,136,0.1); }

  .lib-header {
    padding: 56px 24px 20px;
    background: linear-gradient(160deg, #0A1A0E 0%, var(--bg) 100%);
  }

  .lib-title { font-family: var(--font-display); font-size: 30px; font-weight: 700; }
  .lib-subtitle { font-size: 13px; color: var(--text-muted); margin-top: 4px; font-weight: 300; }
  .lib-content { padding: 16px 24px 120px; }

  .lib-card {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 18px;
    padding: 14px 14px 12px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
  }
  .lib-card:active { opacity: 0.8; }

  .lib-card-top {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .lib-emoji {
    width: 52px; height: 52px;
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    font-size: 26px;
    flex-shrink: 0;
  }

  .lib-meta { flex: 1; min-width: 0; }
  .lib-name { font-size: 16px; font-weight: 500; }
  .lib-family { font-size: 12px; color: var(--text-muted); font-style: italic; margin-top: 2px; }

  .lib-card-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px solid var(--border);
  }

  .lib-watered-text {
    font-size: 12px;
    color: var(--text-muted);
    font-weight: 300;
  }

  .water-now-btn {
    font-size: 11px;
    font-weight: 500;
    color: #52B788;
    background: rgba(82,183,136,0.1);
    border: 1px solid rgba(82,183,136,0.25);
    border-radius: 100px;
    padding: 4px 10px;
    cursor: pointer;
    font-family: var(--font-body);
    transition: all 0.2s;
  }
  .water-now-btn:active { background: rgba(82,183,136,0.2); }

  .watered-today-badge {
    font-size: 11px;
    font-weight: 500;
    color: var(--green-bright);
  }

  .delete-btn {
    position: absolute;
    top: 10px; right: 10px;
    width: 24px; height: 24px;
    background: rgba(224,122,95,0.12);
    border: 1px solid rgba(224,122,95,0.25);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px;
    color: var(--danger);
    cursor: pointer;
    line-height: 1;
    transition: all 0.2s;
  }
  .delete-btn:active { background: rgba(224,122,95,0.3); }

  .scroll-content {
    overflow-y: auto;
    max-height: calc(100vh - 80px);
    padding-bottom: 80px;
    scrollbar-width: none;
  }
  .scroll-content::-webkit-scrollbar { display: none; }

  .file-input { display: none; }

  .rooms-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 12px 24px 100px;
    scrollbar-width: none;
  }
  .rooms-scroll::-webkit-scrollbar { display: none; }

  .room-card {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 18px;
    margin-bottom: 12px;
  }

  .room-card-top {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 14px;
  }

  .room-icon-wrap {
    width: 50px; height: 50px;
    border-radius: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 24px;
  }

  .room-name { font-size: 16px; font-weight: 500; color: var(--text); }
  .room-count { font-size: 12px; color: var(--text-muted); margin-top: 3px; font-weight: 300; }

  .room-plants-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 14px;
  }

  .room-plant-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 100px;
    padding: 5px 10px 5px 6px;
    cursor: pointer;
    transition: border-color 0.2s;
  }
  .room-plant-chip:active { opacity: 0.7; }

  .room-plant-emoji { font-size: 16px; line-height: 1; }
  .room-plant-name { font-size: 12px; color: var(--text); font-weight: 400; }
  .room-plant-remove { font-size: 15px; color: var(--text-muted); margin-left: 1px; line-height: 1; }

  .room-add-btn {
    width: 100%;
    padding: 10px;
    background: transparent;
    border: 1px dashed rgba(82,183,136,0.2);
    color: var(--text-muted);
    border-radius: 12px;
    font-size: 13px;
    cursor: pointer;
    font-family: var(--font-body);
    transition: all 0.2s;
    letter-spacing: 0.02em;
  }
  .room-add-btn:active { border-color: var(--green-bright); color: var(--green-bright); background: rgba(82,183,136,0.06); }

  .unassigned-section {
    background: rgba(82,183,136,0.06);
    border: 1px solid rgba(82,183,136,0.15);
    border-radius: 16px;
    padding: 14px 16px;
    margin-bottom: 12px;
  }
  .unassigned-label {
    font-size: 11px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 10px;
  }
  .unassigned-chips { display: flex; flex-wrap: wrap; gap: 8px; }

  .sheet-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.55);
    z-index: 200;
  }

  .assign-sheet {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 430px;
    background: var(--surface);
    border-top-left-radius: 24px;
    border-top-right-radius: 24px;
    border-top: 1px solid var(--border);
    border-left: 1px solid var(--border);
    border-right: 1px solid var(--border);
    padding-bottom: 40px;
    z-index: 201;
    max-height: 65vh;
    overflow-y: auto;
    scrollbar-width: none;
    animation: slideUp 0.28s ease;
  }
  .assign-sheet::-webkit-scrollbar { display: none; }

  @keyframes slideUp {
    from { transform: translateX(-50%) translateY(100%); }
    to   { transform: translateX(-50%) translateY(0); }
  }

  .sheet-handle {
    width: 36px; height: 4px;
    background: rgba(255,255,255,0.1);
    border-radius: 2px;
    margin: 12px auto 16px;
  }

  .sheet-title {
    font-family: var(--font-display);
    font-size: 20px;
    font-weight: 700;
    padding: 0 24px 4px;
    color: var(--text);
  }
  .sheet-subtitle {
    font-size: 12px;
    color: var(--text-muted);
    padding: 0 24px 16px;
    font-weight: 300;
  }

  .sheet-divider { height: 1px; background: var(--border); margin: 0 0 4px; }

  .sheet-empty {
    text-align: center;
    padding: 32px 24px;
    color: var(--text-muted);
    font-size: 14px;
    font-weight: 300;
  }

  .assign-plant-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 24px;
    cursor: pointer;
    transition: background 0.15s;
  }
  .assign-plant-item:active { background: var(--surface2); }

  .assign-emoji {
    width: 46px; height: 46px;
    border-radius: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    flex-shrink: 0;
  }

  .assign-info { flex: 1; }
  .assign-name { font-size: 15px; font-weight: 500; color: var(--text); }
  .assign-family { font-size: 12px; color: var(--text-muted); font-style: italic; margin-top: 2px; }
  .assign-from { font-size: 11px; color: var(--text-muted); margin-top: 3px; }
  .assign-arrow { font-size: 18px; color: var(--green-bright); font-weight: 300; }

  /* ── Calendar ── */
  .cal-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 0 0 100px;
    scrollbar-width: none;
  }
  .cal-scroll::-webkit-scrollbar { display: none; }

  .days-strip {
    display: flex;
    gap: 8px;
    padding: 4px 24px 16px;
    overflow-x: auto;
    scrollbar-width: none;
    flex-shrink: 0;
  }
  .days-strip::-webkit-scrollbar { display: none; }

  .day-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 8px 12px;
    border-radius: 14px;
    border: 1px solid var(--border);
    background: var(--surface2);
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.2s;
    min-width: 48px;
  }
  .day-btn.active {
    background: var(--green-mid);
    border-color: var(--green-bright);
  }
  .day-btn.today { border-color: rgba(82,183,136,0.4); }
  .day-label { font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); }
  .day-num { font-size: 17px; font-weight: 600; color: var(--text); }
  .day-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--green-bright); }
  .day-btn.active .day-label,
  .day-btn.active .day-num { color: var(--text); }

  .cal-section { padding: 0 24px 4px; }
  .cal-section-title {
    font-size: 11px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 10px;
    padding-top: 16px;
  }

  .cal-plant-card {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 18px;
    padding: 14px 16px;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .cal-plant-card.overdue { border-color: rgba(224,122,95,0.3); background: rgba(224,122,95,0.06); }
  .cal-plant-card.due-today { border-color: rgba(242,204,143,0.3); background: rgba(242,204,143,0.05); }

  .cal-urgency {
    width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
  }

  .cal-emoji {
    width: 44px; height: 44px; border-radius: 13px;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; flex-shrink: 0;
  }

  .cal-info { flex: 1; min-width: 0; }
  .cal-name { font-size: 15px; font-weight: 500; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .cal-due  { font-size: 12px; color: var(--text-muted); margin-top: 3px; }
  .cal-due.overdue { color: #E07A5F; }
  .cal-due.due-today { color: #F2CC8F; }

  .cal-water-btn {
    padding: 7px 14px;
    background: var(--green-mid);
    color: var(--text);
    border: none;
    border-radius: 100px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    font-family: var(--font-body);
    white-space: nowrap;
    flex-shrink: 0;
    transition: opacity 0.2s;
  }
  .cal-water-btn:active { opacity: 0.7; }
  .cal-water-btn.done { background: rgba(82,183,136,0.15); color: var(--green-bright); }

  .cal-empty {
    text-align: center;
    padding: 40px 24px;
    color: var(--text-muted);
    font-size: 14px;
    font-weight: 300;
  }
`;

// ─── Anthropic API ────────────────────────────────────────────────────────────

async function identifyPlant(imageBase64, apiKey) {
  const prompt = `You are Flora, an expert botanist AI. Analyze this plant image and respond ONLY with valid JSON (no markdown, no backticks):
{
  "commonName": "string",
  "scientificName": "string",
  "family": "string",
  "confidence": number (0-100),
  "emoji": "single plant emoji",
  "tags": ["string array, 2-4 tags like Tropical, Pet-Safe, Low-Maintenance, etc."],
  "description": "2-3 sentences about this plant",
  "care": {
    "light": "string (e.g. Bright indirect)",
    "water": "string (e.g. Every 7-10 days)",
    "humidity": "string (e.g. 60-80%)",
    "temperature": "string (e.g. 18-27°C)",
    "soil": "string (e.g. Well-draining mix)",
    "fertilizer": "string (e.g. Monthly in spring)"
  },
  "health": {
    "score": number (0-100),
    "status": "Excellent|Good|Fair|Poor",
    "issues": [
      { "type": "warning|info|danger", "text": "string" }
    ]
  }
}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageBase64 } },
          { type: "text", text: prompt }
        ]
      }]
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  const text = data.content?.find(c => c.type === "text")?.text || "{}";
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

// ─── Icone ───────────────────────────────────────────────────────────────────

const HomeIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" fill={active ? "#52B788" : "none"} stroke={active ? "#52B788" : "#6B8F71"} strokeWidth="1.8">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
    <path d="M9 21V12h6v9"/>
  </svg>
);

const ScanIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#6B8F71" strokeWidth="1.8">
    <circle cx="12" cy="12" r="3"/>
    <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"/>
  </svg>
);

const MapIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={active ? "#52B788" : "#6B8F71"} strokeWidth="1.8">
    <polygon points="3 7 9 4 15 7 21 4 21 17 15 20 9 17 3 20"/>
    <line x1="9" y1="4" x2="9" y2="17"/>
    <line x1="15" y1="7" x2="15" y2="20"/>
  </svg>
);

const CalendarIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={active ? "#52B788" : "#6B8F71"} strokeWidth="1.8">
    <rect x="3" y="4" width="18" height="18" rx="3"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
    <circle cx="8" cy="15" r="1" fill={active ? "#52B788" : "#6B8F71"}/>
    <circle cx="12" cy="15" r="1" fill={active ? "#52B788" : "#6B8F71"}/>
    <circle cx="16" cy="15" r="1" fill={active ? "#52B788" : "#6B8F71"}/>
  </svg>
);

const LibIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={active ? "#52B788" : "#6B8F71"} strokeWidth="1.8">
    <rect x="3" y="3" width="7" height="7" rx="1.5"/>
    <rect x="14" y="3" width="7" height="7" rx="1.5"/>
    <rect x="3" y="14" width="7" height="7" rx="1.5"/>
    <rect x="14" y="14" width="7" height="7" rx="1.5"/>
  </svg>
);

function healthColor(score) {
  if (score >= 80) return "#52B788";
  if (score >= 60) return "#F2CC8F";
  return "#E07A5F";
}

// ─── Schermate ───────────────────────────────────────────────────────────────

function HomeScreen({ setScreen, library }) {
  const tips = [
    { icon: "💧", title: "Watering", text: "Check soil moisture before watering — most plants hate soggy roots." },
    { icon: "☀️", title: "Light", text: "Rotate plants monthly for even, symmetrical growth." },
    { icon: "🌱", title: "Repotting", text: "Spring is the best time to repot into fresh soil." },
    { icon: "🌡️", title: "Temperature", text: "Avoid placing plants near drafts or radiators." },
  ];

  return (
    <div className="screen">
      <div className="scroll-content">
        <div className="home-header">
          <div className="greeting">Hello, botanist 🌿</div>
          <h1 className="home-title">Your <em>flora</em><br/>awaits</h1>
          <p className="home-subtitle">Identify, analyse, and care for your plants</p>
        </div>

        <div className="scan-hero" onClick={() => setScreen(SCREENS.SCAN)}>
          <div className="scan-label">New scan</div>
          <h2>Identify a<br/>plant now</h2>
          <p>Upload a photo for full analysis<br/>and personalised care advice</p>
          <button className="scan-btn-pill">📷 Scan</button>
        </div>

        {library.length > 0 && (
          <div className="section">
            <div className="section-header">
              <div className="section-title">My library</div>
              <div className="see-all" onClick={() => setScreen(SCREENS.LIBRARY)}>See all →</div>
            </div>
            {library.slice(0, 2).map(p => (
              <div key={p.id} className="plant-card" onClick={() => setScreen(SCREENS.LIBRARY)}>
                <div className="plant-emoji-circle" style={{ background: p.color + "33" }}>
                  {p.emoji}
                </div>
                <div className="plant-info">
                  <div className="plant-name">{p.name}</div>
                  <div className="plant-family">{p.family}</div>
                  <div className="health-bar-wrap">
                    <div className="health-bar">
                      <div className="health-fill" style={{ width: `${p.health}%`, background: healthColor(p.health) }} />
                    </div>
                    <div className="health-val">{p.health}%</div>
                  </div>
                </div>
                <div className="water-badge">💧 {wateredLabel(p.lastWateredDate)}</div>
              </div>
            ))}
          </div>
        )}

        <div className="section">
          <div className="section-header">
            <div className="section-title">Today's tips</div>
          </div>
          <div className="tips-scroll">
            {tips.map((t, i) => (
              <div key={i} className="tip-card">
                <div className="tip-icon">{t.icon}</div>
                <div className="tip-title">{t.title}</div>
                <div className="tip-text">{t.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav current="home" setScreen={setScreen} />
    </div>
  );
}

function ScanScreen({ setScreen, setResult, setImageUrl, apiKey, setApiKey }) {
  const [image, setImage] = useState(null);
  const [imageB64, setImageB64] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const handleFile = useCallback((file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setImage(dataUrl);
      setImageB64(dataUrl.split(",")[1]);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleAnalyze = async () => {
    if (!imageB64) return;
    if (!apiKey.trim()) {
      alert("Please enter your Anthropic API key.");
      return;
    }
    setLoading(true);
    try {
      const res = await identifyPlant(imageB64, apiKey.trim());
      setResult(res);
      setImageUrl(image);
      setScreen(SCREENS.RESULT);
    } catch (e) {
      console.error(e);
      alert("Analysis error: " + e.message);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="screen" style={{ background: "var(--bg)" }}>
        <div className="loading-screen">
          <div className="loading-orb" />
          <div className="loading-text">Analysing the plant…</div>
          <div className="loading-sub">Flora is consulting its<br/>botanical database</div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen scan-screen">
      <div className="camera-area">
        <div
          className={`upload-zone ${image ? "has-image" : ""}`}
          onClick={() => fileRef.current?.click()}
        >
          {image ? (
            <>
              <img src={image} alt="preview" className="upload-preview" />
              <div className="upload-overlay">
                <span style={{ color: "white", fontSize: 13 }}>Change photo</span>
              </div>
            </>
          ) : (
            <>
              <div className="corner tl" /><div className="corner tr" />
              <div className="corner bl" /><div className="corner br" />
              <div className="upload-placeholder">
                <span>🌿</span>
                <span>Upload a photo</span>
                <span style={{ fontSize: 11, opacity: 0.6 }}>JPG, PNG, WebP</span>
              </div>
            </>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="file-input"
          onChange={e => handleFile(e.target.files[0])}
        />
        <div style={{ marginTop: 16, color: "var(--text-muted)", fontSize: 13, textAlign: "center", fontWeight: 300 }}>
          Aim at leaves, flowers, or the whole plant
        </div>
      </div>

      <div className="scan-bottom">
        <input
          className="apikey-input"
          type="password"
          placeholder="Anthropic API key  (sk-ant-…)"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
        />
        <div className="scan-hint">
          For best results, photograph in good light<br/>with leaves or flowers clearly visible
        </div>
        <button className="analyze-btn" onClick={handleAnalyze} disabled={!image}>
          🔍 Identify plant
        </button>
        <button
          onClick={() => setScreen(SCREENS.HOME)}
          style={{ width: "100%", marginTop: 10, background: "transparent", border: "none", color: "var(--text-muted)", fontSize: 14, cursor: "pointer", padding: 10, fontFamily: "var(--font-body)" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function ResultScreen({ result, imageUrl, setScreen, addToLibrary, isFromLibrary, onBack }) {
  if (!result) return null;

  const c = result.confidence || 88;
  const health = result.health || { score: 82, status: "Good", issues: [] };
  const care = result.care || {};
  const issueColor = (t) => t === "danger" ? "#E07A5F" : t === "warning" ? "#F2CC8F" : "#52B788";

  const careItems = [
    { icon: "☀️", title: "Light", value: care.light },
    { icon: "💧", title: "Water", value: care.water },
    { icon: "💨", title: "Humidity", value: care.humidity },
    { icon: "🌡️", title: "Temperature", value: care.temperature },
    { icon: "🌱", title: "Soil", value: care.soil },
    { icon: "🌿", title: "Fertilizer", value: care.fertilizer },
  ].filter(i => i.value);

  const handleBack = onBack || (() => setScreen(SCREENS.HOME));

  return (
    <div className="screen" style={{ background: "var(--bg)" }}>
      <div className="scroll-content">
        <div className="result-hero">
          {imageUrl
            ? <img src={imageUrl} alt={result.commonName} className="result-img" />
            : <div className="result-img-placeholder">{result.emoji || "🌿"}</div>
          }
          <div className="result-gradient" />
          <div className="result-badge">🌿 {isFromLibrary ? "Saved" : "Identified"}</div>
          <div className="back-btn" onClick={handleBack}>×</div>
        </div>

        <div className="result-content">
          <div className="plant-main-name">{result.commonName || "Plant"}</div>
          <div className="plant-sci-name">{result.scientificName}</div>

          <div className="confidence-row">
            <div className="conf-label">Confidence</div>
            <div className="conf-bar"><div className="conf-fill" style={{ width: `${c}%` }} /></div>
            <div className="conf-val">{c}%</div>
          </div>

          <div className="tags-row">
            {(result.tags || []).map((t, i) => (
              <div key={i} className="tag tag-green">{t}</div>
            ))}
          </div>

          <div className="divider" />
          <div className="section-label">Description</div>
          <div className="description">{result.description}</div>

          <div className="divider" />
          <div className="section-label">Health analysis</div>
          <div className="health-analysis">
            <div className="health-header">
              <div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>Health index</div>
                <div className="health-score" style={{ color: healthColor(health.score) }}>{health.score}/100</div>
              </div>
              <div className="health-pill" style={{
                background: healthColor(health.score) + "22",
                color: healthColor(health.score),
                border: `1px solid ${healthColor(health.score)}44`
              }}>
                {health.status}
              </div>
            </div>
            {health.issues?.length > 0 && (
              <div className="issues-list">
                {health.issues.map((issue, i) => (
                  <div key={i} className="issue-item">
                    <div className="issue-dot" style={{ background: issueColor(issue.type) }} />
                    {issue.text}
                  </div>
                ))}
              </div>
            )}
          </div>

          {careItems.length > 0 && (
            <>
              <div className="divider" />
              <div className="section-label">Care guide</div>
              <div className="care-grid">
                {careItems.map((item, i) => (
                  <div key={i} className="care-item">
                    <div className="care-icon">{item.icon}</div>
                    <div className="care-title">{item.title}</div>
                    <div className="care-value">{item.value}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {!isFromLibrary && (
            <button className="add-library-btn" onClick={() => {
              addToLibrary(result, imageUrl);
              setScreen(SCREENS.LIBRARY);
            }}>
              + Add to library
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function LibraryScreen({ library, setScreen, removeFromLibrary, updateWatered, onSelectPlant }) {
  return (
    <div className="screen">
      <div className="lib-header">
        <div className="lib-title">My library</div>
        <div className="lib-subtitle">{library.length} {library.length === 1 ? "plant" : "plants"} saved</div>
      </div>
      <div className="lib-content scroll-content">
        {library.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 24px", color: "var(--text-muted)" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🌱</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--text)", marginBottom: 8 }}>Empty library</div>
            <div style={{ fontSize: 14, fontWeight: 300 }}>Scan a plant to start your collection</div>
            <button
              onClick={() => setScreen(SCREENS.SCAN)}
              style={{ marginTop: 24, padding: "12px 28px", background: "var(--green-bright)", color: "var(--bg)", border: "none", borderRadius: 100, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-body)" }}
            >
              Scan now
            </button>
          </div>
        ) : (
          library.map(p => {
            const label = wateredLabel(p.lastWateredDate);
            const isToday = label === "Today";
            return (
              <div key={p.id} className="lib-card" onClick={() => onSelectPlant(p)}>
                <button
                  className="delete-btn"
                  onClick={e => { e.stopPropagation(); removeFromLibrary(p.id); }}
                  title="Remove plant"
                >×</button>

                <div className="lib-card-top">
                  <div className="lib-emoji" style={{ background: p.color + "33" }}>{p.emoji}</div>
                  <div className="lib-meta">
                    <div className="lib-name">{p.name}</div>
                    <div className="lib-family">{p.family}</div>
                  </div>
                  <div className="health-pill" style={{
                    background: healthColor(p.health) + "22",
                    color: healthColor(p.health),
                    border: `1px solid ${healthColor(p.health)}44`
                  }}>
                    {p.health}%
                  </div>
                </div>

                <div className="lib-card-bottom">
                  <span className="lib-watered-text">💧 Watered {label}</span>
                  {isToday ? (
                    <span className="watered-today-badge">✓ Done today</span>
                  ) : (
                    <button
                      className="water-now-btn"
                      onClick={e => { e.stopPropagation(); updateWatered(p.id); }}
                    >
                      Water now
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      <BottomNav current="library" setScreen={setScreen} />
    </div>
  );
}

function MapScreen({ library, setScreen }) {
  const [assignments, setAssignments] = useState(() => {
    const d = {};
    if (library[0]) d[library[0].id] = "living";
    if (library[1]) d[library[1].id] = "living";
    if (library[2]) d[library[2].id] = "bedroom";
    return d;
  });
  const [addingTo, setAddingTo] = useState(null);

  const plantsInRoom = (roomId) => library.filter(p => assignments[p.id] === roomId);
  const unassigned = library.filter(p => !assignments[p.id]);
  const assignedRoomCount = new Set(Object.values(assignments)).size;

  const assignPlant = (plantId, roomId) => {
    setAssignments(prev => ({ ...prev, [plantId]: roomId }));
    setAddingTo(null);
  };

  const removeFromRoom = (plantId) => {
    setAssignments(prev => { const n = { ...prev }; delete n[plantId]; return n; });
  };

  const availableForRoom = (roomId) =>
    library.filter(p => assignments[p.id] !== roomId);

  return (
    <div className="screen" style={{ height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div className="lib-header" style={{ flexShrink: 0 }}>
        <div className="lib-title">My Home</div>
        <div className="lib-subtitle">
          {library.length} plants · {assignedRoomCount} {assignedRoomCount === 1 ? "room" : "rooms"}
        </div>
      </div>

      <div className="rooms-scroll">
        {unassigned.length > 0 && (
          <div className="unassigned-section">
            <div className="unassigned-label">Not placed yet</div>
            <div className="unassigned-chips">
              {unassigned.map(plant => (
                <div key={plant.id} className="room-plant-chip">
                  <span className="room-plant-emoji">{plant.emoji}</span>
                  <span className="room-plant-name">{plant.name.split(" ")[0]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {ROOMS.map(room => {
          const plants = plantsInRoom(room.id);
          return (
            <div key={room.id} className="room-card">
              <div className="room-card-top">
                <div className="room-icon-wrap" style={{ background: room.color + "28" }}>
                  {room.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="room-name">{room.name}</div>
                  <div className="room-count">
                    {plants.length === 0 ? "No plants" : `${plants.length} ${plants.length === 1 ? "plant" : "plants"}`}
                  </div>
                </div>
              </div>

              {plants.length > 0 && (
                <div className="room-plants-row">
                  {plants.map(plant => (
                    <div key={plant.id} className="room-plant-chip" onClick={() => removeFromRoom(plant.id)}>
                      <span className="room-plant-emoji">{plant.emoji}</span>
                      <span className="room-plant-name">{plant.name.split(" ")[0]}</span>
                      <span className="room-plant-remove">×</span>
                    </div>
                  ))}
                </div>
              )}

              <button className="room-add-btn" onClick={() => setAddingTo(room.id)}>
                + Add plant
              </button>
            </div>
          );
        })}
      </div>

      {addingTo && (
        <>
          <div className="sheet-overlay" onClick={() => setAddingTo(null)} />
          <div className="assign-sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-title">
              {ROOMS.find(r => r.id === addingTo)?.icon} {ROOMS.find(r => r.id === addingTo)?.name}
            </div>
            <div className="sheet-subtitle">Select a plant to add to this room</div>
            <div className="sheet-divider" />
            {availableForRoom(addingTo).length === 0 ? (
              <div className="sheet-empty">All your plants are already here 🌿</div>
            ) : (
              availableForRoom(addingTo).map(plant => (
                <div key={plant.id} className="assign-plant-item" onClick={e => { e.stopPropagation(); assignPlant(plant.id, addingTo); }}>
                  <div className="assign-emoji" style={{ background: plant.color + "33" }}>{plant.emoji}</div>
                  <div className="assign-info">
                    <div className="assign-name">{plant.name}</div>
                    <div className="assign-family">{plant.family}</div>
                    {assignments[plant.id] && (
                      <div className="assign-from">
                        Currently in {ROOMS.find(r => r.id === assignments[plant.id])?.name}
                      </div>
                    )}
                  </div>
                  <div className="assign-arrow">→</div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      <BottomNav current="map" setScreen={setScreen} />
    </div>
  );
}

// ─── Calendar helpers ─────────────────────────────────────────────────────────

function parseWaterDays(waterText) {
  if (!waterText) return 7;
  const range = waterText.match(/(\d+)\s*[-–]\s*(\d+)\s*days?/i);
  if (range) return Math.round((+range[1] + +range[2]) / 2);
  const single = waterText.match(/every\s+(\d+)\s*days?/i);
  if (single) return +single[1];
  const weeks = waterText.match(/(\d+)\s*weeks?/i);
  if (weeks) return +weeks[1] * 7;
  if (/week/i.test(waterText)) return 7;
  if (/2[-–]3\s*times/i.test(waterText)) return 3;
  if (/times?\s+a\s+week/i.test(waterText)) return 3;
  return 7;
}

function toDateStr(date) {
  return date.toISOString().slice(0, 10);
}

function CalendarScreen({ library, updateWatered, setScreen }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  const [selectedDay, setSelectedDay] = useState(toDateStr(today));

  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const plantNextDate = (plant) => {
    if (!plant.lastWateredDate) return today;
    const interval = parseWaterDays(plant.resultData?.care?.water);
    const last = new Date(plant.lastWateredDate);
    last.setHours(0, 0, 0, 0);
    const next = new Date(last);
    next.setDate(last.getDate() + interval);
    return next;
  };

  const plantsForDay = (dayStr) => {
    const day = new Date(dayStr);
    return library.filter(p => {
      const next = plantNextDate(p);
      if (dayStr === toDateStr(today)) return next <= day;
      return toDateStr(next) === dayStr;
    });
  };

  const hasDot = (d) => plantsForDay(toDateStr(d)).length > 0;

  const selectedDate = new Date(selectedDay);
  const isToday = toDateStr(selectedDate) === toDateStr(today);
  const dayPlants = plantsForDay(selectedDay);

  const overdueOnSelected = isToday
    ? dayPlants.filter(p => plantNextDate(p) < today)
    : [];
  const dueOnSelected = isToday
    ? dayPlants.filter(p => toDateStr(plantNextDate(p)) === selectedDay)
    : dayPlants;

  const getStatus = (plant) => {
    const next = plantNextDate(plant);
    if (next < today) return "overdue";
    if (toDateStr(next) === toDateStr(today)) return "due-today";
    return "ok";
  };

  const getDueLabel = (plant) => {
    const next = plantNextDate(plant);
    const diff = Math.round((next - today) / 86400000);
    if (diff < 0) return `Overdue by ${Math.abs(diff)} day${Math.abs(diff) !== 1 ? "s" : ""}`;
    if (diff === 0) return "Due today";
    if (diff === 1) return "Due tomorrow";
    return `Due in ${diff} days`;
  };

  const PlantRow = ({ plant }) => {
    const status = getStatus(plant);
    const interval = parseWaterDays(plant.resultData?.care?.water);
    const lastWatered = new Date(plant.lastWateredDate);
    lastWatered.setHours(0, 0, 0, 0);
    const wateredToday = toDateStr(lastWatered) === toDateStr(today);

    return (
      <div className={`cal-plant-card ${status}`}>
        <div className="cal-urgency" style={{
          background: status === "overdue" ? "#E07A5F" : status === "due-today" ? "#F2CC8F" : "#52B788"
        }} />
        <div className="cal-emoji" style={{ background: plant.color + "33" }}>{plant.emoji}</div>
        <div className="cal-info">
          <div className="cal-name">{plant.name}</div>
          <div className={`cal-due ${status}`}>
            {getDueLabel(plant)} · every {interval}d
          </div>
        </div>
        <button
          className={`cal-water-btn${wateredToday ? " done" : ""}`}
          onClick={() => !wateredToday && updateWatered(plant.id)}
        >
          {wateredToday ? "✓ Done" : "💧 Water"}
        </button>
      </div>
    );
  };

  return (
    <div className="screen" style={{ height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div className="lib-header" style={{ flexShrink: 0 }}>
        <div className="lib-title">Watering</div>
        <div className="lib-subtitle">{library.length} plants to track</div>
      </div>

      <div className="days-strip">
        {days.map(d => {
          const str = toDateStr(d);
          const active = str === selectedDay;
          const isT = str === toDateStr(today);
          return (
            <div
              key={str}
              className={`day-btn${active ? " active" : ""}${isT && !active ? " today" : ""}`}
              onClick={() => setSelectedDay(str)}
            >
              <div className="day-label">{DAY_NAMES[d.getDay()]}</div>
              <div className="day-num">{d.getDate()}</div>
              {hasDot(d) && !active && <div className="day-dot" />}
            </div>
          );
        })}
      </div>

      <div className="cal-scroll">
        {library.length === 0 ? (
          <div className="cal-empty">
            <div style={{ fontSize: 40, marginBottom: 12 }}>💧</div>
            <div>No plants to track yet</div>
            <div style={{ marginTop: 6, fontSize: 12 }}>Add plants via Scan to see their schedule</div>
          </div>
        ) : dayPlants.length === 0 ? (
          <div className="cal-empty">
            <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
            <div>No watering needed {isToday ? "today" : "on this day"}</div>
          </div>
        ) : (
          <>
            {overdueOnSelected.length > 0 && (
              <div className="cal-section">
                <div className="cal-section-title">Overdue</div>
                {overdueOnSelected.map(p => <PlantRow key={p.id} plant={p} />)}
              </div>
            )}
            {dueOnSelected.length > 0 && (
              <div className="cal-section">
                <div className="cal-section-title">{isToday ? "Due today" : `${DAY_NAMES[selectedDate.getDay()]} ${selectedDate.getDate()}`}</div>
                {dueOnSelected.map(p => <PlantRow key={p.id} plant={p} />)}
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav current="calendar" setScreen={setScreen} />
    </div>
  );
}

function BottomNav({ current, setScreen }) {
  return (
    <div className="bottom-nav">
      <div className={`nav-item ${current === "home" ? "active" : ""}`} onClick={() => setScreen(SCREENS.HOME)}>
        <HomeIcon active={current === "home"} />
        <div className="nav-label" style={{ color: current === "home" ? "#52B788" : "#6B8F71" }}>Home</div>
      </div>
      <div className={`nav-item ${current === "map" ? "active" : ""}`} onClick={() => setScreen(SCREENS.MAP)}>
        <MapIcon active={current === "map"} />
        <div className="nav-label" style={{ color: current === "map" ? "#52B788" : "#6B8F71" }}>Map</div>
      </div>
      <div className="nav-item" onClick={() => setScreen(SCREENS.SCAN)}>
        <div style={{
          width: 50, height: 50, borderRadius: 16,
          background: "linear-gradient(135deg, #2D6A4F, #52B788)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginTop: -20, boxShadow: "0 4px 20px rgba(82,183,136,0.4)"
        }}>
          <ScanIcon />
        </div>
        <div className="nav-label" style={{ color: "#6B8F71", marginTop: 2 }}>Scan</div>
      </div>
      <div className={`nav-item ${current === "calendar" ? "active" : ""}`} onClick={() => setScreen(SCREENS.CALENDAR)}>
        <CalendarIcon active={current === "calendar"} />
        <div className="nav-label" style={{ color: current === "calendar" ? "#52B788" : "#6B8F71" }}>Water</div>
      </div>
      <div className={`nav-item ${current === "library" ? "active" : ""}`} onClick={() => setScreen(SCREENS.LIBRARY)}>
        <LibIcon active={current === "library"} />
        <div className="nav-label" style={{ color: current === "library" ? "#52B788" : "#6B8F71" }}>Library</div>
      </div>
    </div>
  );
}

// ─── App root ─────────────────────────────────────────────────────────────────

export default function FloraApp() {
  const [screen, setScreen] = useState(SCREENS.HOME);
  const [result, setResult] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [library, setLibrary] = useState(() => loadLibrary());
  const [apiKey, setApiKey] = useState(() => loadApiKey());
  const [selectedPlant, setSelectedPlant] = useState(null);

  const handleSetApiKey = (key) => {
    setApiKey(key);
    saveApiKey(key);
  };

  const addToLibrary = (res, imgUrl) => {
    const plant = {
      id: Date.now(),
      name: res.commonName,
      family: res.family || res.scientificName,
      health: res.health?.score ?? 80,
      lastWateredDate: new Date().toISOString(),
      emoji: res.emoji || "🌿",
      color: "#2D6A4F",
      resultData: res,
      imageUrl: imgUrl || null,
    };
    const updated = [plant, ...library];
    setLibrary(updated);
    saveLibrary(updated);
  };

  const removeFromLibrary = (id) => {
    const updated = library.filter(p => p.id !== id);
    setLibrary(updated);
    saveLibrary(updated);
  };

  const updateWatered = (id) => {
    const updated = library.map(p =>
      p.id === id ? { ...p, lastWateredDate: new Date().toISOString() } : p
    );
    setLibrary(updated);
    saveLibrary(updated);
  };

  const handleSelectPlant = (plant) => {
    setSelectedPlant(plant);
    setScreen(SCREENS.RESULT);
  };

  const handleBackFromResult = () => {
    setSelectedPlant(null);
    setResult(null);
    setScreen(selectedPlant ? SCREENS.LIBRARY : SCREENS.HOME);
  };

  const activeResult = selectedPlant ? selectedPlant.resultData : result;
  const activeImageUrl = selectedPlant ? selectedPlant.imageUrl : imageUrl;

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        {screen === SCREENS.HOME && <HomeScreen setScreen={setScreen} library={library} />}
        {screen === SCREENS.SCAN && (
          <ScanScreen
            setScreen={setScreen}
            setResult={setResult}
            setImageUrl={setImageUrl}
            apiKey={apiKey}
            setApiKey={handleSetApiKey}
          />
        )}
        {screen === SCREENS.RESULT && (
          <ResultScreen
            result={activeResult}
            imageUrl={activeImageUrl}
            setScreen={setScreen}
            addToLibrary={addToLibrary}
            isFromLibrary={!!selectedPlant}
            onBack={handleBackFromResult}
          />
        )}
        {screen === SCREENS.LIBRARY && (
          <LibraryScreen
            library={library}
            setScreen={setScreen}
            removeFromLibrary={removeFromLibrary}
            updateWatered={updateWatered}
            onSelectPlant={handleSelectPlant}
          />
        )}
        {screen === SCREENS.MAP && <MapScreen library={library} setScreen={setScreen} />}
        {screen === SCREENS.CALENDAR && <CalendarScreen library={library} updateWatered={updateWatered} setScreen={setScreen} />}
      </div>
    </>
  );
}
