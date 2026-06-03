// ==UserScript==
// @name         Noob Controller
// @namespace    http://tampermonkey.net/
// @version      v0.2
// @description  Premium Arras.io Bot Controller
// @author       Antigravity
// @match        *://arras.io/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=arras.io
// @require      https://cdnjs.cloudflare.com/ajax/libs/msgpack-lite/0.1.26/msgpack.min.js
// @grant        none
// ==/UserScript==

/* global msgpack */

(function () {
    'use strict';

    // Premium UI Styles
    const style = document.createElement('style');
    style.innerHTML = `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');

        :root {
            --primary: #00f5a0;
            --primary-glow: rgba(0, 245, 160, 0.4);
            --bg-glass: rgba(10, 15, 25, 0.8);
            --bg-card: rgba(255, 255, 255, 0.04);
            --bg-card-hover: rgba(255, 255, 255, 0.08);
            --text-main: #ffffff;
            --text-dim: #a0a0b0;
            --border: rgba(255, 255, 255, 0.1);
            --font: 'Outfit', sans-serif;
            --radius: 24px;
        }

        #scriptMenuOverlay {
            position: fixed;
            inset: 0;
            background: none;
            z-index: 9999998;
            display: none;
            pointer-events: all;
        }

        #scriptMenu {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 520px;
            background: #1a1a1a;
            border: 2px solid #000;
            border-radius: 4px;
            color: #fff;
            font-family: 'Outfit', sans-serif;
            z-index: 9999999;
            display: flex;
            flex-direction: column;
            box-shadow: 0 0 50px rgba(0,0,0,0.8);
            animation: fadeIn 0.2s ease-out;
            user-select: none;
            overflow: hidden;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translate(-50%, -49%) scale(0.98); }
            to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }

        .header-minimal {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            background: #111;
            border-bottom: 1px solid #333;
        }

        .title-minimal { font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #aaa; }
        
        .tab-bar {
            display: flex;
            background: rgba(255, 255, 255, 0.05);
            padding: 6px;
            gap: 6px;
            border-bottom: 1px solid var(--border);
        }

        .tab-btn {
            flex: 1;
            padding: 10px;
            border-radius: 12px;
            font-size: 13px;
            font-weight: 700;
            color: var(--text-dim);
            cursor: pointer;
            text-align: center;
            transition: 0.2s;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .tab-btn.active {
            background: var(--bg-card-hover);
            color: var(--primary);
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }

        .dashboard {
            display: flex;
            flex-direction: column;
            gap: 24px;
            padding: 24px;
            min-height: 420px;
            max-height: 60vh;
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: var(--primary) transparent;
        }

        .log-box {
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 12px;
            padding: 12px;
            min-height: 120px;
            max-height: 220px;
            overflow-y: auto;
            font-size: 11px;
            color: #fff;
            line-height: 1.4;
            white-space: pre-wrap;
        }

        .log-entry {
            display: flex;
            flex-direction: column;
            gap: 6px;
            margin-bottom: 10px;
            padding: 12px;
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 12px;
            background: rgba(0,0,0,0.18);
        }

        .log-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
        }

        .hash-details {
            display: flex;
            align-items: center;
            gap: 10px;
            flex: 1;
            min-width: 0;
        }

        .team-badge {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            display: inline-block;
            border: 1px solid rgba(255,255,255,0.18);
            flex-shrink: 0;
        }

        .team-label {
            font-size: 11px;
            color: rgba(255,255,255,0.8);
            text-transform: uppercase;
            font-weight: 700;
            letter-spacing: 0.5px;
            margin-left: 6px;
        }

        .team-blue { background: #3f88ff; }
        .team-green { background: #37d35a; }
        .team-red { background: #ff3f5e; }
        .team-purple { background: #bf6cff; }
        .team-unknown { background: rgba(255,255,255,0.18); }

        .hash-text {
            font-family: monospace;
            color: #fff;
            overflow-wrap: anywhere;
        }

        .entry-copy-btn {
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.12);
            border-radius: 10px;
            color: var(--primary);
            padding: 4px 8px;
            font-size: 10px;
            cursor: pointer;
        }

        .log-meta {
            color: rgba(255,255,255,0.7);
            font-size: 11px;
        }

        .tab-content { display: none; flex-direction: column; gap: 24px; }
        .tab-content.active { display: flex; }

        .section-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 4px;
        }

        .section-header svg { width: 18px; height: 18px; color: var(--primary); }
        .section-header span { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #fff; }

        .status-tag {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 10px;
            font-weight: 800;
            color: #ff4b2b;
            text-transform: uppercase;
            padding: 4px 8px;
            background: rgba(255, 75, 43, 0.1);
            border: 1px solid rgba(255, 75, 43, 0.2);
            border-radius: 4px;
        }

        .status-tag.connected {
            color: var(--primary);
            background: rgba(0, 245, 160, 0.1);
            border-color: rgba(0, 245, 160, 0.2);
        }

        .status-tag::before {
            content: '';
            width: 6px;
            height: 6px;
            background: currentColor;
            border-radius: 50%;
            box-shadow: 0 0 8px currentColor;
        }

        .section {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .section-label {
            font-size: 12px;
            font-weight: 700;
            color: var(--text-dim);
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        /* Improved Grid & Toggles */
        .toggle-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }

        .toggle-item {
            position: relative;
            cursor: pointer;
        }

        .toggle-item input {
            display: none;
        }

        .toggle-box {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.2s ease;
        }

        .toggle-item:hover .toggle-box {
            background: var(--bg-card-hover);
            border-color: rgba(255, 255, 255, 0.2);
            transform: translateY(-2px);
        }

        .toggle-name {
            font-size: 14px;
            font-weight: 600;
            color: var(--text-main);
        }

        .switch-ui {
            width: 36px;
            height: 20px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            position: relative;
            transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .switch-ui::after {
            content: '';
            position: absolute;
            width: 14px;
            height: 14px;
            background: white;
            border-radius: 50%;
            top: 3px;
            left: 3px;
            transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .toggle-item input:checked + .toggle-box {
            background: rgba(0, 245, 160, 0.05);
            border-color: rgba(0, 245, 160, 0.3);
        }

        .toggle-item input:checked + .toggle-box .switch-ui {
            background: var(--primary);
            box-shadow: 0 0 15px var(--primary-glow);
        }

        .toggle-item input:checked + .toggle-box .switch-ui::after {
            left: 19px;
        }

        /* Inputs */
        input[type="text"], input[type="number"] {
            width: 100%;
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 14px 18px;
            color: white;
            font-family: var(--font);
            font-size: 15px;
            outline: none;
            transition: 0.2s;
            box-sizing: border-box;
        }

        input:focus {
            border-color: var(--primary);
            background: var(--bg-card-hover);
            box-shadow: 0 0 20px rgba(0, 245, 160, 0.1);
        }

        /* Select */
        .select-container { position: relative; }
        .select-head {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 14px 18px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            transition: 0.2s;
        }
        .select-head:hover { background: var(--bg-card-hover); }
        .select-head.active { border-color: var(--primary); }

        .dropdown {
            position: absolute;
            top: calc(100% + 8px);
            left: 0; right: 0;
            background: #0d1117;
            border: 1px solid var(--border);
            border-radius: 16px;
            max-height: 280px;
            overflow-y: auto;
            z-index: 1000;
            display: none;
            box-shadow: 0 20px 50px rgba(0,0,0,0.6);
        }
        .dropdown.show { display: block; }
        .drop-group { padding: 12px 18px; font-size: 10px; font-weight: 800; color: var(--primary); text-transform: uppercase; letter-spacing: 1px; background: rgba(0, 245, 160, 0.05); }
        .drop-item { padding: 12px 18px; font-size: 14px; color: var(--text-dim); cursor: pointer; transition: 0.2s; }
        .drop-item:hover { color: white; background: var(--bg-card-hover); padding-left: 24px; }
        .drop-item.selected { color: white; background: var(--primary); font-weight: 600; }

        /* Slider */
        .slider-box {
            background: var(--bg-card);
            border-radius: 16px;
            padding: 20px;
            border: 1px solid var(--border);
        }
        .slider-labels { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 13px; font-weight: 600; }
        
        input[type="range"] {
            -webkit-appearance: none;
            width: 100%;
            height: 4px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 2px;
            outline: none;
        }
        input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 18px;
            height: 18px;
            background: var(--primary);
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 0 10px var(--primary-glow);
        }

        /* Buttons */
        .btn-group { display: grid; grid-template-columns: 2fr 1fr; gap: 12px; }
        button {
            padding: 16px;
            border-radius: 16px;
            border: none;
            font-family: var(--font);
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        
        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            filter: grayscale(1);
        }

        #connectNoob { background: var(--primary); color: #050505; }
        #connectNoob:hover { transform: translateY(-2px); box-shadow: 0 8px 25px var(--primary-glow); }

        /* #reconnectServer removed — replaced by per-codespace connect buttons */

        #deleteNoobs { background: rgba(255, 75, 43, 0.1); color: #ff4b2b; border: 1px solid rgba(255, 75, 43, 0.2); width: 100%; }
        #deleteNoobs:hover { background: #ff4b2b; color: white; }

        .mode-btn {
            border: 1px solid var(--border);
            border-radius: 16px;
            background: var(--bg-card);
            color: var(--text-dim);
            font-size: 14px;
            font-weight: 700;
            padding: 14px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .mode-btn.active {
            background: var(--primary);
            color: #050505;
            border-color: rgba(0, 245, 160, 0.4);
        }

        /* Tabs */
        .tab-bar {
            display: flex;
            gap: 8px;
            background: rgba(255, 255, 255, 0.03);
            padding: 4px;
            border-radius: 14px;
            border: 1px solid var(--border);
        }
        .tab-btn {
            flex: 1;
            padding: 10px;
            border-radius: 10px;
            font-size: 13px;
            font-weight: 600;
            color: var(--text-dim);
            cursor: pointer;
            text-align: center;
            transition: 0.2s;
        }
        .tab-btn.active {
            background: var(--bg-card-hover);
            color: var(--primary);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }
        .tab-content { display: none; flex-direction: column; gap: 24px; }
        .tab-content.active { display: flex; }

        .chat-input-wrapper {
            position: relative;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        #broadcastBtn {
            background: linear-gradient(135deg, var(--primary) 0%, #00d2ff 100%);
            color: #050505;
            width: 100%;
        }

        .footer { text-align: center; font-size: 10px; color: #555; padding: 12px; border-top: 1px solid #222; background: #111; }

        /* Codespace Manager */
        .codespace-list { display: flex; flex-direction: column; gap: 8px; }
        .codespace-entry {
            display: flex; align-items: center; gap: 8px;
            padding: 10px 12px; background: var(--bg-card);
            border: 1px solid var(--border); border-radius: 14px;
            flex-wrap: wrap;
        }
        .codespace-entry .cs-url-input {
            flex: 1; min-width: 120px; font-size: 11px;
            padding: 7px 10px; border-radius: 10px; font-family: monospace;
        }
        .codespace-status {
            font-size: 9px; font-weight: 800; text-transform: uppercase;
            padding: 3px 7px; border-radius: 6px; white-space: nowrap; letter-spacing: 0.5px;
        }
        .cs-connected  { color: var(--primary); background: rgba(0,245,160,0.1); border: 1px solid rgba(0,245,160,0.2); }
        .cs-connecting { color: #ffd700;         background: rgba(255,215,0,0.1);  border: 1px solid rgba(255,215,0,0.3); }
        .cs-disconnected { color: #ff4b2b;       background: rgba(255,75,43,0.1);  border: 1px solid rgba(255,75,43,0.2); }
        .cs-btn {
            padding: 6px 11px; font-size: 11px; font-weight: 700;
            border-radius: 8px; cursor: pointer; border: none;
            font-family: var(--font); transition: 0.2s;
        }
        .cs-connect-btn    { background: var(--primary); color: #050505; }
        .cs-connect-btn:hover { opacity: 0.85; }
        .cs-disconnect-btn { background: rgba(255,75,43,0.15); color: #ff4b2b; border: 1px solid rgba(255,75,43,0.2); }
        .cs-disconnect-btn:hover { background: #ff4b2b; color: white; }
        .cs-remove-btn {
            background: rgba(255,255,255,0.05); color: #888;
            border: 1px solid rgba(255,255,255,0.1);
            width: 28px; height: 28px; padding: 0;
            border-radius: 8px; font-size: 14px; line-height: 1;
            display: flex; align-items: center; justify-content: center;
        }
        .cs-remove-btn:hover { background: rgba(255,75,43,0.2); color: #ff4b2b; }
        #addCodespaceBtn {
            background: rgba(0,245,160,0.06); color: var(--primary);
            border: 1px dashed rgba(0,245,160,0.3); padding: 10px;
            font-size: 13px; width: 100%; border-radius: 14px;
        }
        #addCodespaceBtn:hover { background: rgba(0,245,160,0.12); }
        #reconnectAllBtn { background: #1a1a2e; color: #aaa; border: 1px solid #333; width: 100%; margin-top: 4px; font-size: 13px; padding: 12px; }
        #reconnectAllBtn:hover { background: #222; color: white; }
        .cs-count-badge {
            margin-left: auto; font-size: 10px; font-weight: 700;
            padding: 3px 10px; border-radius: 20px;
            background: rgba(0,245,160,0.08); color: var(--primary);
            border: 1px solid rgba(0,245,160,0.2);
        }
    `;
    document.head.appendChild(style);

    const menuOverlay = document.createElement('div');
    menuOverlay.id = 'scriptMenuOverlay';
    menuOverlay.style.display = 'none';
    document.body.appendChild(menuOverlay);

    const menu = document.createElement('div');
    menu.id = 'scriptMenu';
    menu.style.display = 'none';
    menu.innerHTML = `
        <div class="header-minimal">
            <span class="title-minimal">Noob Hub • Dashboard</span>
            <div class="status-tag" id="statusPill">
                <span id="serverStatus">Connecting</span>
            </div>
        </div>

        <div class="tab-bar">
            <div class="tab-btn active" data-tab="main">Main Dashboard</div>
            <div class="tab-btn" data-tab="macros">Macros</div>
            <div class="tab-btn" data-tab="teamfind">Team Find</div>
        </div>

        <div class="dashboard">
            <div id="mainTab" class="tab-content active">
                <!-- Combat Section -->
                <div class="control-section">
                    <div class="section-header">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l-2 2-3-3-2 2L2 16l2-2-3-3 2-2 3 3 2-2 2 2z"/></svg>
                        <span>Combat Systems</span>
                    </div>
                    <div class="toggle-grid">
                        <label class="toggle-item">
                            <input id="autofire" type="checkbox">
                            <div class="toggle-box">
                                <span class="toggle-name">Autofire</span>
                                <div class="switch-ui"></div>
                            </div>
                        </label>
                        <label class="toggle-item">
                            <input id="autospin" type="checkbox">
                            <div class="toggle-box">
                                <span class="toggle-name">Auto Spin</span>
                                <div class="switch-ui"></div>
                            </div>
                        </label>
                        <label class="toggle-item">
                            <input id="overrideMode" type="checkbox">
                            <div class="toggle-box">
                                <span class="toggle-name">Override (R)</span>
                                <div class="switch-ui"></div>
                            </div>
                        </label>
                        <label class="toggle-item">
                            <input id="sneakMode" type="checkbox">
                            <div class="toggle-box">
                                <span class="toggle-name">SD (O)</span>
                                <div class="switch-ui"></div>
                            </div>
                        </label>
                    </div>
                    <button id="respawnBots" style="width: 100%; margin-top: 8px; background: var(--bg-card); border: 1px solid var(--border); color: white;">Force All Respawn</button>
                    <div class="slider-box">
                        <div class="slider-labels">
                            <span>Aim Smoothing</span>
                            <span style="color:var(--primary);"><span id="sensitivityValue">20</span>%</span>
                        </div>
                        <input id="mouseSensitivity" type="range" min="1" max="100" step="1" value="20">
                    </div>
                </div>

                <!-- Bot Management -->
                <div class="control-section">
                    <div class="section-header">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4M8 15h.01M16 15h.01"/></svg>
                        <span>Swarm Intelligence</span>
                    </div>
                    <div class="toggle-grid">
                        <label class="toggle-item">
                            <input id="mbs" type="checkbox" checked>
                            <div class="toggle-box">
                                <span class="toggle-name">Follow Mouse</span>
                                <div class="switch-ui"></div>
                            </div>
                        </label>
                        <label class="toggle-item">
                            <input id="feeding" type="checkbox">
                            <div class="toggle-box">
                                <span class="toggle-name">Auto Feed</span>
                                <div class="switch-ui"></div>
                            </div>
                        </label>
                    </div>
                    <div class="toggle-grid">
                        <label class="toggle-item" style="grid-column: span 2;">
                            <input id="manualMode" type="checkbox">
                            <div class="toggle-box">
                                <span class="toggle-name">Manual Coordinates Mode</span>
                                <div class="switch-ui"></div>
                            </div>
                        </label>
                    </div>
                    <div id="manualCoordsSection" style="display: none; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div class="section-label" style="grid-column: span 2;">Target Coordinates (X, Y)</div>
                        <input id="manualX" type="number" placeholder="X Coord" value="0">
                        <input id="manualY" type="number" placeholder="Y Coord" value="0">
                    </div>
                    <div class="select-container" id="tankContainer">
                        <div class="select-head" id="tankTrigger">
                            <span id="selectedTankDisplay">Select Tank Class</span>
                            <input type="text" id="tankSearchInput" placeholder="Search..." style="display:none; width:100%; background:transparent; border:none; color:white; outline:none;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
                        </div>
                        <div class="dropdown" id="tankOptionsList"></div>
                    </div>
                </div>

                <!-- Network Settings -->
                <div class="control-section">
                    <div class="section-header">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                        <span>Network Configuration</span>
                    </div>
                    <div style="display:flex; flex-direction:column; gap: 12px;">
                        <input id="serverHash" type="text" placeholder="Server Endpoint (Hash or URL)">
                        <div style="display:flex; gap:12px; align-items:center;">
                            <span style="font-size:12px; color:var(--text-dim); white-space:nowrap;">Bot Density:</span>
                            <input id="botCount" type="number" value="1" min="1" max="800" step="1">
                            <span style="font-size:11px;color:#ff4b2b;font-weight:700;">/ 800</span>
                        </div>
                        <div id="botDensityPreview" style="font-size:12px; color:#999; margin-top:4px;">N:1 = Allowed</div>
                        <div class="btn-group" style="grid-template-columns: 1fr 1fr;">
                            <button id="connectNoob">Deploy Swarm</button>
                            <button id="deleteNoobs" style="background:rgba(255,75,43,0.1);color:#ff4b2b;border:1px solid rgba(255,75,43,0.2);">Kill All Bots</button>
                        </div>
                    </div>
                </div>

                <!-- Codespace Manager -->
                <div class="control-section">
                    <div class="section-header">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><path d="m9 8 2 2-2 2M13 12h2"/></svg>
                        <span>Codespace Manager</span>
                        <span class="cs-count-badge" id="csCountBadge">0 Connected</span>
                    </div>
                    <!-- Watcher Status Bar -->
                    <div id="watcherBar" style="display:flex;align-items:center;gap:8px;padding:9px 14px;background:rgba(0,245,160,0.04);border:1px solid rgba(0,245,160,0.12);border-radius:12px;font-size:11px;">
                        <span id="watcherDot" style="width:7px;height:7px;border-radius:50%;background:#555;flex-shrink:0;transition:background 0.3s;"></span>
                        <span id="watcherStatus" style="color:var(--text-dim);flex:1;">Watcher idle</span>
                        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;margin:0;">
                            <span style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.5px;">Auto-watch</span>
                            <input type="checkbox" id="watcherToggle" checked style="width:auto;padding:0;accent-color:var(--primary);">
                        </label>
                    </div>
                    <div id="codespaceList" class="codespace-list"></div>
                    <div style="display:flex; gap:8px; align-items:center; margin-top:8px; flex-wrap: wrap;">
                        <label class="toggle-item" style="margin:0;">
                            <input id="codespaceSafeMode" type="checkbox" checked>
                            <div class="toggle-box" style="padding: 12px 16px;">
                                <span class="toggle-name" style="font-size: 12px;">Safe Codespace Mode</span>
                                <div class="switch-ui" style="width: 32px; height: 18px;"></div>
                            </div>
                        </label>
                        <input id="codespaceMaxBots" type="number" min="1" max="100" value="20" style="width: 100px; padding: 10px; border-radius: 12px; border: 1px solid var(--border); background: var(--bg-card); color: white;" placeholder="Max / CS">
                        <input id="codespaceSpawnWindow" type="number" min="0" max="30" value="15" style="width: 100px; padding: 10px; border-radius: 12px; border: 1px solid var(--border); background: var(--bg-card); color: white;" placeholder="0-30s">
                    </div>
                    <button id="addCodespaceBtn" style="margin-top:4px;">＋ Add Codespace</button>
                    <button id="reconnectAllBtn">↺ Reconnect All</button>
                </div>
            </div>

            <div id="teamfindTab" class="tab-content">
                <div class="control-section">
                    <div class="section-header">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v20M2 12h20"/></svg>
                        <span>Team Finder</span>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:12px;">
                        <div style="font-size:12px; color: var(--text-dim);">
                            Spawn bots to scan for team-specific server hashes.
                        </div>
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <input id="teamFindHash" type="text" placeholder="Base Hash (e.g. oa)">
                            <select id="teamFindTeam" style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 14px; color: white;">
                                <option value="">All Teams</option>
                                <option value="1">Team 1 (Blue)</option>
                                <option value="2">Team 2 (Green)</option>
                                <option value="3">Team 3 (Red)</option>
                                <option value="4">Team 4 (Purple)</option>
                            </select>
                            <input id="teamFindCount" type="number" placeholder="Bots" min="1" value="1">
                        </div>
                        <button id="teamFindBtn">Execute Scan</button>
                        <button id="stopTeamFindBtn" disabled style="width: 100%; margin-top: 8px; background: #ff4b2b; color: white; border-radius: 16px; font-weight: 700;">Stop Scan</button>
                        <div style="display:flex; gap:12px; align-items:center; justify-content: space-between;">
                            <span id="teamFindStatus" style="font-size:12px; color: var(--text-dim);">Ready</span>
                            <button id="copyHashLog" style="padding: 8px 16px; font-size: 12px; border-radius: 8px; background: var(--bg-card-hover);">Copy All Hashes</button>
                        </div>
                        <div id="teamFindLog" class="log-box"></div>
                    </div>
                </div>
            </div>

            <div id="macrosTab" class="tab-content">
                <!-- Transmission Hub (Macros) -->
                <div class="control-section">
                    <div class="section-header">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17.5 19c2.5 0 4.5-2 4.5-4.5 0-2.4-1.9-4.3-4.3-4.5C16.9 6.4 13.7 4 10 4 6.7 4 4 6.3 3.1 9.4 1.3 10.3 0 12.2 0 14.5 0 17 2 19 4.5 19Z"/></svg>
                        <span>Transmission Hub</span>
                    </div>
                    <div class="chat-input-wrapper">
                        <input id="chatMessage" type="text" placeholder="Broadcast message...">
                        <label class="toggle-item">
                            <input id="repeatChat" type="checkbox">
                            <div class="toggle-box" style="padding: 12px 16px;">
                                <span class="toggle-name" style="font-size: 12px;">Continuous Loop (Spam)</span>
                                <div class="switch-ui" style="width: 32px; height: 18px;"></div>
                            </div>
                        </label>
                        <button id="broadcastBtn">Execute Transmission</button>
                    </div>
                    <div class="toggle-grid" style="grid-template-columns: repeat(4, 1fr); gap: 8px;">
                        <button class="phrase-btn" style="padding: 8px; font-size: 11px; background: #222; border: 1px solid #333;">GG</button>
                        <button class="phrase-btn" style="padding: 8px; font-size: 11px; background: #222; border: 1px solid #333;">EZ</button>
                        <button class="phrase-btn" style="padding: 8px; font-size: 11px; background: #222; border: 1px solid #333;">WP</button>
                        <button class="phrase-btn" style="padding: 8px; font-size: 11px; background: #222; border: 1px solid #333;">?</button>
                    </div>
                </div>
            </div>
        </div>

        <div class="footer">Premium Arras Swarm Controller • ESC to Toggle</div>
    `;



    document.body.appendChild(menu);
    menu.style.display = 'none';

    // Helper to stop events from bubbling to game
    const killEvent = e => {
        e.stopPropagation();
        e.stopImmediatePropagation();
    };

    const getEl = id => document.getElementById(id);
    const HTML = {
        serverStatus: getEl("serverStatus"),
        serverStatusBadge: getEl("statusPill"),
        tankContainer: getEl("tankContainer"),
        tankTrigger: getEl("tankTrigger"),
        selectedTankDisplay: getEl("selectedTankDisplay"),
        tankSearchInput: getEl("tankSearchInput"),
        tankOptionsList: getEl("tankOptionsList"),
        serverHash: getEl("serverHash"),
        botCount: getEl("botCount"),
        botDensityPreview: getEl("botDensityPreview"),
        mbs: getEl("mbs"),
        feeding: getEl("feeding"),
        overrideMode: getEl("overrideMode"),
        sneakMode: getEl("sneakMode"),
        respawnBots: getEl("respawnBots"),
        connectNoob: getEl("connectNoob"),
        deleteNoobs: getEl("deleteNoobs"),
        autofire: getEl("autofire"),
        autospin: getEl("autospin"),
        codespaceSafeMode: getEl("codespaceSafeMode"),
        codespaceMaxBots: getEl("codespaceMaxBots"),
        manualMode: getEl("manualMode"),
        manualX: getEl("manualX"),
        manualY: getEl("manualY"),
        manualCoordsSection: getEl("manualCoordsSection"),
        mouseSensitivity: getEl("mouseSensitivity"),
        sensitivityValue: getEl("sensitivityValue"),
        broadcastBtn: getEl("broadcastBtn"),
        chatMessage: getEl("chatMessage"),
        repeatChat: getEl("repeatChat"),
        teamFindHash: getEl("teamFindHash"),
        teamFindTeam: getEl("teamFindTeam"),
        teamFindCount: getEl("teamFindCount"),
        teamFindBtn: getEl("teamFindBtn"),
        stopTeamFindBtn: getEl("stopTeamFindBtn"),
        teamFindStatus: getEl("teamFindStatus"),
        teamFindLog: getEl("teamFindLog"),
        copyHashLog: getEl("copyHashLog"),
        tabs: {
            main: getEl("mainTab"),
            macros: getEl("macrosTab"),
            teamfind: getEl("teamfindTab")
        }
    };

    var _codespaceConnections = [];
    var nextConnId = 0;

    function updateBotDensityPreview() {
        const openConns = getOpenConnections();
        const n = openConns.length;
        const raw = HTML.botCount.value.trim();
        const value = Number(raw);
        const countValid = Number.isInteger(value) && value >= 1 && value <= 800;

        if (n === 0) {
            HTML.botDensityPreview.textContent = `N:0 = no ready connections`;
            HTML.botDensityPreview.style.color = '#ff4b2b';
        } else if (!countValid) {
            HTML.botDensityPreview.textContent = `N:${n} = invalid bot density`;
            HTML.botDensityPreview.style.color = '#ff4b2b';
        } else {
            const dist = getCountDistribution(value);
            const breakdown = dist.map(d => d.count).join(' + ');
            HTML.botDensityPreview.textContent = `N:${n} => ${breakdown} = ${value} (Division V2) -> Allowed`;
            HTML.botDensityPreview.style.color = '#999';
        }

        if (HTML.connectNoob) {
            HTML.connectNoob.disabled = (n === 0 || !countValid);
        }
    }

    HTML.botCount.addEventListener('input', () => {
        updateBotDensityPreview();
    });

    HTML.botCount.addEventListener('blur', () => {
        const raw = HTML.botCount.value.trim();
        const value = Number(raw);
        if (!Number.isNaN(value)) {
            const fixed = Math.min(Math.max(Math.floor(value), 1), 800);
            HTML.botCount.value = fixed;
        }
        updateBotDensityPreview();
    });

    updateBotDensityPreview();

    // Tab Switching Logic
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const tabId = btn.dataset.tab;
            HTML.tabs[tabId].classList.add('active');
        };
    });

    const teamFindHashes = new Set();
    const TEAM_COLORS = { 1: 'team-blue', 2: 'team-green', 3: 'team-red', 4: 'team-purple' };

    function appendTeamFindLog(report) {
        const hash = (report.hash || report.serverHash || '').replace(/^#/, '');
        if (!hash || teamFindHashes.has(hash)) return;
        teamFindHashes.add(hash);

        const teamMatch = hash.match(/[1-4]/);
        const team = teamMatch ? parseInt(teamMatch[0]) : null;
        const badgeClass = team ? TEAM_COLORS[team] : 'team-unknown';

        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerHTML = `
            <div class="log-row">
                <div class="hash-details">
                    <span class="team-badge ${badgeClass}"></span>
                    <span class="team-label">${team ? 'Team ' + team : 'Unknown'}</span>
                    <span class="hash-text">${hash}</span>
                </div>
                <button class="entry-copy-btn">Copy</button>
            </div>
            <div class="log-meta">Found by Bot ${report.botId || 'Swarm'}</div>
        `;

        entry.querySelector('.entry-copy-btn').onclick = () => {
            navigator.clipboard.writeText(hash);
        };

        HTML.teamFindLog.appendChild(entry);
        HTML.teamFindLog.scrollTop = HTML.teamFindLog.scrollHeight;
    }

    HTML.teamFindBtn.onclick = () => {
        const hash = HTML.teamFindHash.value.trim();
        const team = HTML.teamFindTeam.value || null;
        const time = 5; // controller no longer exposes a timer UI; server uses inactivity semantics
        const rawCount = HTML.teamFindCount.value.trim();
        const countValue = parseInt(rawCount) || 1;
        const rawWindow = HTML.codespaceSpawnWindow ? HTML.codespaceSpawnWindow.value.trim() : "15";
        const parsedWindow = parseInt(rawWindow, 10);
        const spawnWindow = Number.isInteger(parsedWindow)
            ? Math.min(Math.max(parsedWindow, 0), 30)
            : 15;

        if (!Number.isInteger(countValue) || countValue < 1 || countValue > 800) {
            return alert("Scan bot count must be a whole number between 1 and 800.");
        }

        if (!hash) return alert("Enter a base hash!");

        const distribution = getCountDistribution(countValue);
        if (!distribution) {
            return alert("No ready codespace connections available.");
        }

        // Reset logs and UI
        teamFindHashes.clear();
        HTML.teamFindLog.innerHTML = "";
        HTML.teamFindStatus.textContent = `Scanning... (using ${distribution.length} connections)`;
        HTML.teamFindBtn.disabled = true;
        HTML.stopTeamFindBtn.disabled = false;

        // Ask each connected codespace to spawn a share of scan bots
        packetDistributed("Y", countValue, hash, time, team, spawnWindow);
    };

    HTML.stopTeamFindBtn.onclick = () => {
        packet("B"); // Terminate all bots (including scan swarm)
        HTML.teamFindBtn.disabled = false;
        HTML.stopTeamFindBtn.disabled = true;
        HTML.teamFindStatus.textContent = "Stopped";
        teamFindHashes.clear();
    };

    // Chat Broadcast Logic
    HTML.broadcastBtn.onclick = () => {
        const msg = HTML.chatMessage.value.trim();
        const spam = HTML.repeatChat.checked;
        if (msg) {
            packet("T", msg, spam);
            if (!spam) HTML.chatMessage.value = "";
        } else if (!spam) {
            // If message is empty and spam is off, stop any active spam
            packet("T", "", false);
        }
    };

    HTML.chatMessage.onkeydown = (e) => {
        e.stopPropagation();
        if (e.key === "Enter") {
            HTML.broadcastBtn.click();
        }
    };

    document.querySelectorAll('.phrase-btn').forEach(btn => {
        btn.onclick = () => {
            packet("T", btn.textContent, false);
        };
    });

    HTML.copyHashLog.onclick = () => {
        const allHashes = Array.from(teamFindHashes).join('\n');
        if (allHashes) navigator.clipboard.writeText(allHashes);
    };


    let ws; // kept for legacy compat — real state lives in `connections`

    // Manual Coords Visibility
    HTML.manualMode.onchange = () => {
        HTML.manualCoordsSection.style.display = HTML.manualMode.checked ? "grid" : "none";
    };

    const saveSettings = () => {
        const settings = {
            serverHash: HTML.serverHash.value,
            botCount: HTML.botCount.value,
            autofire: HTML.autofire.checked,
            autospin: HTML.autospin.checked,
            mbs: HTML.mbs.checked,
            overrideMode: HTML.overrideMode.checked,
            sneakMode: HTML.sneakMode.checked,
            feeding: HTML.feeding.checked,
            manualMode: HTML.manualMode.checked,
            manualX: HTML.manualX.value,
            manualY: HTML.manualY.value,
            mouseSensitivity: HTML.mouseSensitivity.value,
            chatMessage: HTML.chatMessage.value,
            repeatChat: HTML.repeatChat.checked,
            teamFindHash: HTML.teamFindHash.value,
            teamFindTeam: HTML.teamFindTeam.value,
            teamFindCount: HTML.teamFindCount.value,
            currentTank: currentTank
        };
        localStorage.setItem('noob_settings', JSON.stringify(settings));
    };

    const loadSettings = () => {
        const data = localStorage.getItem('noob_settings');
        if (data) {
            try {
                const settings = JSON.parse(data);
                if (settings.serverHash !== undefined) HTML.serverHash.value = settings.serverHash;
                if (settings.botCount !== undefined) HTML.botCount.value = settings.botCount;
                if (settings.autofire !== undefined) HTML.autofire.checked = settings.autofire;
                if (settings.autospin !== undefined) HTML.autospin.checked = settings.autospin;
                if (settings.mbs !== undefined) HTML.mbs.checked = settings.mbs;
                if (settings.overrideMode !== undefined) HTML.overrideMode.checked = settings.overrideMode;
                if (settings.sneakMode !== undefined) HTML.sneakMode.checked = settings.sneakMode;
                if (settings.feeding !== undefined) HTML.feeding.checked = settings.feeding;
                if (settings.manualMode !== undefined) HTML.manualMode.checked = settings.manualMode;
                if (settings.manualX !== undefined) HTML.manualX.value = settings.manualX;
                if (settings.manualY !== undefined) HTML.manualY.value = settings.manualY;
                        if (settings.mouseSensitivity !== undefined) {
                    HTML.mouseSensitivity.value = settings.mouseSensitivity;
                    HTML.sensitivityValue.textContent = settings.mouseSensitivity;
                }
                if (settings.chatMessage !== undefined) HTML.chatMessage.value = settings.chatMessage;
                if (settings.repeatChat !== undefined) HTML.repeatChat.checked = settings.repeatChat;
                if (settings.teamFindHash !== undefined) HTML.teamFindHash.value = settings.teamFindHash;
                if (settings.teamFindTeam !== undefined) HTML.teamFindTeam.value = settings.teamFindTeam;
                if (settings.teamFindCount !== undefined) HTML.teamFindCount.value = settings.teamFindCount;
                if (settings.currentTank !== undefined) currentTank = settings.currentTank;

                // Update UI state
                HTML.manualMode.onchange();
            } catch (e) { console.error("Failed to load settings", e); }
        }
    };

    // TANK DEFINITIONS (Clean & Deduplicated)
    // TANK DEFINITIONS (Exhaustive List)
    const tankCategories = {
        "Essentials": {
            basic: "Basic",
            twin: "Twin",
            sniper: "Sniper",
            machinegun: "Machine Gun",
            flankguard: "Flank Guard",
            director: "Director",
            pounder: "Pounder",
            smasher: "Smasher",
            auto6: "Auto-4/6",
            mega3: "Mega-3",
            shotgun: "Shotgun",
            pursuer: "Pursuer"
        },
        "Advanced Tanks": {
            doubletwin: "Double Twin",
            tripleshot: "Triple Shot",
            sprayer: "Sprayer",
            redistributor: "Redistributor",
            hexatank: "Hexa Tank",
            octotank: "Octo Tank",
            booster: "Booster",
            fighter: "Fighter",
            tripletwin: "Triple Twin",
            overseer: "Overseer",
            underseer: "Underseer",
            manager: "Manager",
            destroyer: "Destroyer",
            anni: "Annihilator",
            rocketeer: "Rocketeer",
            pentashot: "Penta Shot",
            machinegunner: "Machine Gunner",
            gunner: "Gunner",
            auto3_single: { name: "Auto-3", tanks: "auto3" },
            auto4: "Auto-4",
            toppler: "Toppler",
            crack: "Crackshot",
            triplex: "Triplex",
            quadruplex: "Quadruplex",
            predator: "Predator",
            lorry: "Lorry",
            parapet: "Parapet",
            fortress: "Fortress",
            triplet: "Triplet",
            sidewinder: "Sidewinder"
        },
        "Arms Race / Special": {
            browser: "Browser",
            strider: "Strider",
            surfer: "Surfer",
            eagle: "Eagle",
            phoenix: "Phoenix",
            vulture: "Vulture",
            automingler: "Automingler",
            gale: "Gale",
            nona: "Nona",
            septamachine: "Septa Machine",
            jerker: "Jerker",
            limpet: "Limpet",
            firework: "Firework",
            coli: "Collision",
            levi: "Leviathan",
            finger: "Finger",
            rocket: "Rocket (ram)"
        },
        "Support & Utility": {
            engineer: "Engineer",
            assembler: "Assembler",
            architect: "Architect",
            factory: "Factory",
            spawner: "Spawner",
            foundry: "Foundry",
            topbanana: "Top Banana",
            healer: "Healer",
            physician: "Physician",
            chemist: "Chemist"
        },
        "Smashers & Rams": {
            megasmasher: "Mega Smasher",
            spike: "Spike",
            autosmasher: "Auto Smasher",
            landmine: "Landmine",
            thorn: "Thorn",
            megaspike: "Mega Spike",
            slammer: "Slammer",
            basher: "Basher"
        },
        "Branches": {
            triangle: {
                name: "Tri-Angle Path",
                tanks: ["fighter", "autotriangle", "surfer", "eagle", "bomber", "vulture", "phoenix"]
            },
            launchers: {
                name: "Launchers Path",
                tanks: ["skimmer", "twister", "swarmer", "sidewinder", "fieldgun"]
            },
            drones: {
                name: "Drones Path",
                tanks: ["overczar", "tyrant", "autooverlord", "megaautooverseer", "tripleautooverseer", "autooverdrive", "headman", "overcheese", "overstorm"]
            },
            auto3: {
                name: "Auto-3 Path",
                tanks: ["auto5", "mega3", "auto6"]
            },
            dps: {
                name: "DPS Path",
                tanks: ["penta", "spread", "octo", "autogunner", "triplet", "predator", "triplex", "quadruplex", "machinegunner"]
            },
            smashers_branch: {
                name: "Smashers Path",
                tanks: ["megasmasher", "spike", "autosmasher", "landmine"]
            }
        },
        "Arms Race Branches": {
            triangle_ar: {
                name: "Tri-Angle (AR)",
                tanks: ["browser", "strider", "autobomber", "tripleautotriangle", "surferdrive", "electrocutor", "kicker", "megaautotriangle", "roller", "autoeagle"]
            },
            launchers_ar: {
                name: "Launchers (AR)",
                tanks: ["hyperskimmer", "skidder", "gyro", "hypercluster", "coli", "molotov", "hypertwister", "ream"]
            },
            annies: {
                name: "Annihilators (AR)",
                tanks: ["obliterator", "compound", "wiper", "stomper", "autoanni", "shaver", "eradicator"]
            },
            necro: {
                name: "Underseer (AR)",
                tanks: ["diviner", "autonecro", "necrodrive", "megaautounderdrive", "tripleautounderdrive", "pentamancer", "pentadrive", "warlock", "autopentaseer"]
            },
            carriers: {
                name: "Carriers (AR)",
                tanks: ["warship", "battlerdrive", "bismarck", "proddrive", "manufacture", "dirigible", "autobattleship", "autoprod", "autocruiserdrive"]
            },
            auto3_ar: {
                name: "Auto-3 (AR)",
                tanks: ["auto6", "auto7", "mega5", "batter4", "hurler3", "autoauto4"]
            },
            dps_ar: {
                name: "DPS (AR)",
                tanks: ["toppler", "coli", "crack", "autooperator", "manufacture", "lorry"]
            },
            spikes_ar: {
                name: "Spikes (AR)",
                tanks: ["thorn", "megaspike", "claymore", "spear", "prick"]
            },
            crash: {
                name: "Crash (AR)",
                tanks: ["whirlwind", "tempest", "septamech", "doubleequalizer", "rigger", "lorry", "manufacture", "doublespread", "palisade"]
            }
        }
    };

    // Custom Select Logic
    let currentTank = "basic";

    function populateTankOptions(filter = "") {
        const list = HTML.tankOptionsList;
        list.innerHTML = "";
        const query = filter.toLowerCase();

        for (const groupName in tankCategories) {
            const matches = [];
            for (const tankKey in tankCategories[groupName]) {
                const definition = tankCategories[groupName][tankKey];
                const tankName = typeof definition === "string" ? definition : definition.name;

                if (tankName.toLowerCase().includes(query)) {
                    matches.push({ key: tankKey, name: tankName });
                }
            }

            if (matches.length > 0) {
                const label = document.createElement("div");
                label.className = "drop-group";
                label.textContent = groupName;
                list.appendChild(label);

                matches.forEach(match => {
                    const item = document.createElement("div");
                    item.className = "drop-item" + (match.key === currentTank ? " selected" : "");
                    item.textContent = match.name;
                    item.onclick = (e) => {
                        e.stopPropagation();
                        selectTank(match.key, match.name);
                    };
                    list.appendChild(item);
                });
            }
        }
    }

    function selectTank(key, name) {
        if (key) currentTank = key;

        let definition;
        for (const group in tankCategories) {
            if (tankCategories[group][currentTank]) {
                definition = tankCategories[group][currentTank];
                break;
            }
        }

        if (definition) {
            const displayName = typeof definition === "string" ? definition : definition.name;
            if (HTML.selectedTankDisplay) HTML.selectedTankDisplay.textContent = displayName;
            packet("Z", definition.tanks || currentTank);
            saveSettings();
        }
        closeDropdown();
    }

    function toggleDropdown() {
        const isOpen = HTML.tankOptionsList.classList.contains("show");
        if (isOpen) closeDropdown();
        else openDropdown();
    }

    function openDropdown() {
        if (!HTML.tankOptionsList) return;
        HTML.tankOptionsList.classList.add("show");
        if (HTML.tankTrigger) HTML.tankTrigger.classList.add("active");
        if (HTML.selectedTankDisplay) HTML.selectedTankDisplay.style.display = "none";
        if (HTML.tankSearchInput) {
            HTML.tankSearchInput.style.display = "block";
            HTML.tankSearchInput.value = "";
            HTML.tankSearchInput.focus();
        }
        populateTankOptions();
    }

    function closeDropdown() {
        if (!HTML.tankOptionsList) return;
        HTML.tankOptionsList.classList.remove("show");
        if (HTML.tankTrigger) HTML.tankTrigger.classList.remove("active");
        if (HTML.selectedTankDisplay) HTML.selectedTankDisplay.style.display = "block";
        if (HTML.tankSearchInput) HTML.tankSearchInput.style.display = "none";
    }



    HTML.tankTrigger.onclick = (e) => {
        e.stopPropagation();
        toggleDropdown();
    };

    HTML.tankSearchInput.oninput = () => {
        populateTankOptions(HTML.tankSearchInput.value);
    };

    HTML.tankSearchInput.onkeydown = (e) => {
        // Prevent keys from leaking to the game while typing
        e.stopPropagation();

        if (e.key === "Enter") {
            e.preventDefault();
            const firstItem = HTML.tankOptionsList.querySelector(".opt-item");
            if (firstItem) {
                firstItem.click();
            }
        }
    };

    HTML.tankSearchInput.onclick = (e) => e.stopPropagation();

    // Close on outside click
    window.addEventListener("click", (e) => {
        if (!HTML.tankContainer.contains(e.target)) {
            closeDropdown();
        }
    });

    // Initial load and setup
    try {
        loadSettings();
        populateTankOptions();
        setTimeout(() => {
            selectTank(currentTank);
        }, 100);

        // Auto-save listeners
        const inputElements = [HTML.serverHash, HTML.botCount, HTML.manualX, HTML.manualY, HTML.mouseSensitivity, HTML.chatMessage];
        inputElements.forEach(el => {
            if (el) {
                el.addEventListener('input', () => {
                    if (el === HTML.mouseSensitivity && HTML.sensitivityValue) {
                        HTML.sensitivityValue.textContent = el.value;
                    }
                    saveSettings();
                });
            }
        });

        const toggleElements = [HTML.autofire, HTML.autospin, HTML.mbs, HTML.feeding, HTML.manualMode, HTML.repeatChat, HTML.overrideMode, HTML.sneakMode];
        toggleElements.forEach(el => {
            if (el) {
                el.addEventListener('change', saveSettings);
            }
        });
    } catch (e) {
        console.error("Initialization error:", e);
    }

    // KEYBOARD CONTROLS
    let keys = {};
    let menuVisible = false;

    const isMenuTyping = (element) => {
        if (!element) return false;
        const tag = element.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
        if (element.isContentEditable) return true;
        return menu.contains(element);
    };

    const isAllowedMenuShortcut = (e) => {
        if (e.key === "Escape") return true;
        if (/^F\d{1,2}$/.test(e.key)) return true;
        if ((e.ctrlKey || e.metaKey) && /^[rn]$/i.test(e.key)) return true;
        return false;
    };

    window.addEventListener("keydown", e => {
        const code = e.code || "";
        if (e.key === "Escape" || e.keyCode === 27) {
            menuVisible = !menuVisible;
            menu.style.display = menuVisible ? "flex" : "none";
            menuOverlay.style.display = menuVisible ? "block" : "none";
            if (menuVisible) keys = {}; // Force stop tank movement on open
            e.preventDefault();
            killEvent(e);
            return;
        }

        if (menuVisible) {
            if (isMenuTyping(e.target) || isAllowedMenuShortcut(e)) {
                e.stopPropagation(); // Allow typing but don't bubble to game
                return;
            }
            e.preventDefault();
            killEvent(e);
            keys[code] = false;
            return;
        }

        if (keys[code]) return;
        keys[code] = true;
    }, true);

    window.addEventListener("keyup", e => {
        const code = e.code || "";
        if (menuVisible) {
            killEvent(e);
            if (!isMenuTyping(e.target)) e.preventDefault();
        }
        keys[code] = false;
    }, true);

    // MOUSE TRACKING
    let mouseX = 0, mouseY = 0, mouseDown = false, rMouseDown = false;
    window.addEventListener("mousedown", e => {
        if (menuVisible) {
            if (menu.contains(e.target)) {
                e.stopPropagation();
                return;
            }
            e.preventDefault();
            killEvent(e);
            return;
        }
        if (e.button == 0) mouseDown = true;
        else if (e.button == 2) rMouseDown = true;
    }, true);

    window.addEventListener("mouseup", e => {
        if (menuVisible) {
            if (menu.contains(e.target)) {
                e.stopPropagation();
                return;
            }
            e.preventDefault();
            killEvent(e);
            return;
        }
        if (e.button == 0) mouseDown = false;
        else if (e.button == 2) rMouseDown = false;
    }, true);

    window.addEventListener("mousemove", e => {
        if (menuVisible) {
            if (menu.contains(e.target)) {
                e.stopPropagation();
                return;
            }
            e.preventDefault();
            killEvent(e);
            return;
        }
        mouseX = e.clientX - (window.innerWidth / 2);
        mouseY = e.clientY - (window.innerHeight / 2);
    }, true);

    // MULTI-CODESPACE WEBSOCKET SYSTEM
    const DEFAULT_URLS = [
        "ws://localhost:8082",
        "wss://22cb6dab-35eb-4dee-b8fb-6bf16190293e-00-25r1nww0aylsx.worf.replit.dev:3000"
    ];

    // Broadcast a packet to ALL open connections
    function packet(...args) {
        const data = msgpack.encode(args);
        for (const conn of _codespaceConnections) {
            if (conn.ws && conn.ws.readyState === WebSocket.OPEN) {
                conn.ws.send(data);
            }
        }
    }

    // Send a packet to ONE specific connection
    function packetTo(conn, ...args) {
        if (conn.ws && conn.ws.readyState === WebSocket.OPEN) {
            conn.ws.send(msgpack.encode(args));
        }
    }

    function getOpenConnections() {
        if (typeof _codespaceConnections === 'undefined' || !Array.isArray(_codespaceConnections)) {
            return [];
        }
        return _codespaceConnections.filter(c => c.ws && c.ws.readyState === WebSocket.OPEN && c.ready);
    }

    function getCountDistribution(count) {
        const openConns = getOpenConnections();
        if (!openConns.length || !Number.isInteger(count) || count < 1) return null;

        const safeMode = HTML.codespaceSafeMode && HTML.codespaceSafeMode.checked;
        const maxPerCodespace = safeMode && HTML.codespaceMaxBots
            ? Math.max(1, Math.min(100, Number(HTML.codespaceMaxBots.value) || 20))
            : Infinity;

        const distribution = openConns.map(conn => ({
            conn,
            count: 0,
            cap: conn.isCodespace ? maxPerCodespace : Infinity
        }));

        let remaining = count;
        let index = 0;
        while (remaining > 0) {
            const item = distribution[index % distribution.length];
            if (item.count < item.cap) {
                item.count += 1;
                remaining -= 1;
            }
            index += 1;
            if (index > distribution.length * 200) {
                // Avoid infinite loops if count cannot be assigned under caps
                break;
            }
        }

        if (remaining > 0) return null;
        return distribution.filter(d => d.count > 0);
    }

    function packetDistributed(command, count, ...args) {
        const distribution = getCountDistribution(count);
        if (!distribution) return false;

        distribution.forEach(item => {
            packetTo(item.conn, command, args[0], item.count, ...args.slice(1));
        });
        return true;
    }

    // Update the header pill and codespace count badge
    function updateHeaderStatus() {
        const total = _codespaceConnections.length;
        const connected = _codespaceConnections.filter(c => c.ws && c.ws.readyState === WebSocket.OPEN).length;
        if (HTML.serverStatus) {
            HTML.serverStatus.textContent = total === 0 ? "No Codespaces" : `${connected}/${total} Connected`;
        }
        if (HTML.serverStatusBadge) {
            connected > 0
                ? HTML.serverStatusBadge.classList.add("connected")
                : HTML.serverStatusBadge.classList.remove("connected");
        }
        const badge = document.getElementById("csCountBadge");
        if (badge) badge.textContent = `${connected} Connected`;
        updateBotDensityPreview();
    }

    // Connect a specific conn object to its URL
    function connectTo(conn) {
        const url = conn.urlInput ? conn.urlInput.value.trim() : conn.url;
        if (!url) return;
        conn.url = url;

        // Close existing socket if any
        if (conn.ws) {
            conn.ws.onclose = null; // Suppress auto-reconnect on manual reconnect
            conn.ws.close();
            conn.ws = null;
            conn.ready = false;
        }

        conn.ready = false;
        conn.statusEl.textContent = "Connecting";
        conn.statusEl.className = "codespace-status cs-connecting";
        if (conn.connectBtn) conn.connectBtn.disabled = true;
        if (conn.disconnectBtn) conn.disconnectBtn.disabled = false;

        const ws = new WebSocket(url);
        ws.binaryType = "arraybuffer";
        conn.ws = ws;

        ws.onopen = () => {
            conn.statusEl.textContent = "Connected";
            conn.statusEl.className = "codespace-status cs-connected";
            conn.ready = false;
            packetTo(conn, "M", 72011);
            updateHeaderStatus();
        };

        ws.onmessage = m => {
            const data = msgpack.decode(new Uint8Array(m.data));
            const type = data.shift();
            if (type == "M") {
                packetTo(conn, "C", data[0] ^ 845);
                conn.statusEl.textContent = "Ready";
                conn.statusEl.className = "codespace-status cs-connected";
                conn.ready = true;
                updateHeaderStatus();
                // Send current tank selection to this new connection
                let definition;
                for (const group in tankCategories) {
                    if (tankCategories[group] && tankCategories[group][currentTank]) {
                        definition = tankCategories[group][currentTank];
                        break;
                    }
                }
                if (definition) packetTo(conn, "Z", definition.tanks || currentTank);
            } else if (type == "X") {
                if (HTML.teamFindStatus) HTML.teamFindStatus.textContent = "Joining...";
                if (HTML.teamFindBtn) HTML.teamFindBtn.disabled = false;
                if (HTML.stopTeamFindBtn) HTML.stopTeamFindBtn.disabled = true;
            } else if (type == "R") {
                appendTeamFindLog(data[0]);
                if (HTML.teamFindStatus) HTML.teamFindStatus.textContent = `Hash found [${teamFindHashes.size}]`;
            }
        };

        ws.onclose = () => {
            conn.statusEl.textContent = "Disconnected";
            conn.statusEl.className = "codespace-status cs-disconnected";
            conn.ready = false;
            if (conn.connectBtn) conn.connectBtn.disabled = false;
            if (conn.disconnectBtn) conn.disconnectBtn.disabled = true;
            conn.ws = null;
            updateHeaderStatus();
        };

        ws.onerror = () => {
            conn.statusEl.textContent = "Error";
            conn.statusEl.className = "codespace-status cs-disconnected";
            conn.ready = false;
        };
    }

    // ── PERSISTENCE ──────────────────────────────────────────────────────
    const CS_STORAGE_KEY = 'noob_codespaces';

    function saveCodespaces() {
        const urls = _codespaceConnections.map(c => c.urlInput ? c.urlInput.value.trim() : c.url).filter(Boolean);
        localStorage.setItem(CS_STORAGE_KEY, JSON.stringify(urls));
    }

    function loadCodespaces() {
        try {
            const raw = localStorage.getItem(CS_STORAGE_KEY);
            if (raw) {
                const urls = JSON.parse(raw);
                if (Array.isArray(urls) && urls.length > 0) return urls;
            }
        } catch (e) {}
        return null; // fall back to DEFAULT_URLS
    }

    // ── HELPERS ───────────────────────────────────────────────────────────
    function isGithubDev(url) {
        return typeof url === 'string' && url.includes('github.dev');
    }

    function getTabLabel(url) {
        if (!url) return null;
        if (isGithubDev(url)) {
            // Extract the codespace name: e.g. wss://name-xyz.app.github.dev → "name-xyz"
            const match = url.match(/\/\/([^.]+)/);
            return match ? `⬡ ${match[1]}` : '⬡ github.dev';
        }
        if (url.includes('localhost')) return '⌂ localhost';
        return null;
    }

    // Build a codespace UI entry and add to the list
    function createCodespaceEntry(url = "") {
        const id = nextConnId++;
        const list = document.getElementById("codespaceList");
        if (!list) return null;

        const isGH   = isGithubDev(url);
        const label  = getTabLabel(url);
        const ghBadge = isGH
            ? `<span style="font-size:9px;background:rgba(88,166,255,0.15);color:#58a6ff;border:1px solid rgba(88,166,255,0.25);border-radius:5px;padding:2px 6px;white-space:nowrap;flex-shrink:0;">github.dev</span>`
            : '';

        const entry = document.createElement("div");
        entry.className = "codespace-entry";
        entry.dataset.id = id;
        entry.innerHTML = `
            <span class="codespace-status cs-disconnected">Offline</span>
            ${ghBadge}
            <input type="text" class="cs-url-input"
                placeholder="wss://name.app.github.dev or ws://localhost:8082"
                value="${url}"
                title="${label || url}">
            <button class="cs-btn cs-connect-btn">Connect</button>
            <button class="cs-btn cs-disconnect-btn" disabled>Disc.</button>
            <button class="cs-btn cs-remove-btn" title="Remove">✕</button>
        `;

        const statusEl      = entry.querySelector(".codespace-status");
        const urlInput      = entry.querySelector(".cs-url-input");
        const connectBtn    = entry.querySelector(".cs-connect-btn");
        const disconnectBtn = entry.querySelector(".cs-disconnect-btn");
        const removeBtn     = entry.querySelector(".cs-remove-btn");

        const isRemote = url && !url.includes('localhost') && !url.includes('127.0.0.1');
        const conn = { id, ws: null, url, statusEl, urlInput, connectBtn, disconnectBtn, entryEl: entry, ready: false, isCodespace: isRemote };
        _codespaceConnections.push(conn);

        // Re-badge when URL changes
        urlInput.addEventListener("change", () => {
            const newUrl = urlInput.value.trim();
            conn.url = newUrl;
            conn.isCodespace = newUrl && !newUrl.includes('localhost') && !newUrl.includes('127.0.0.1');
            // Update github.dev badge dynamically
            const existingBadge = entry.querySelector("span[style*='58a6ff']");
            if (isGithubDev(newUrl) && !existingBadge) {
                urlInput.insertAdjacentHTML('beforebegin',
                    `<span style="font-size:9px;background:rgba(88,166,255,0.15);color:#58a6ff;border:1px solid rgba(88,166,255,0.25);border-radius:5px;padding:2px 6px;white-space:nowrap;flex-shrink:0;">github.dev</span>`);
            } else if (!isGithubDev(newUrl) && existingBadge) {
                existingBadge.remove();
            }
            saveCodespaces();
        });

        connectBtn.onclick = (e) => { e.stopPropagation(); connectTo(conn); };
        disconnectBtn.onclick = (e) => {
            e.stopPropagation();
            if (conn.ws) { conn.ws.onclose = null; conn.ws.close(); conn.ws = null; }
            conn.statusEl.textContent = "Offline";
            conn.statusEl.className = "codespace-status cs-disconnected";
            connectBtn.disabled = false;
            disconnectBtn.disabled = true;
            updateHeaderStatus();
        };
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            if (conn.ws) { conn.ws.onclose = null; conn.ws.close(); }
            const idx = _codespaceConnections.indexOf(conn);
            if (idx > -1) _codespaceConnections.splice(idx, 1);
            entry.remove();
            saveCodespaces();
            updateHeaderStatus();
        };

        list.appendChild(entry);
        saveCodespaces();
        updateHeaderStatus();

        // Auto-connect if a URL is provided
        if (url) connectTo(conn);

        return conn;
    }

    // ── WATCHER LOOP ──────────────────────────────────────────────────────
    // Cycle: check all disconnected codespaces (3s window) → wait 30s → repeat
    const WATCHER_CHECK_MS = 3000;
    const WATCHER_WAIT_MS  = 30000;
    let watcherTimer = null;

    function setWatcherDot(color) {
        const dot = document.getElementById("watcherDot");
        if (dot) dot.style.background = color;
    }
    function setWatcherText(msg) {
        const el = document.getElementById("watcherStatus");
        if (el) el.textContent = msg;
    }

    async function watcherCycle() {
        const toggle = document.getElementById("watcherToggle");
        if (!toggle || !toggle.checked) {
            setWatcherDot("#555");
            setWatcherText("Watcher disabled");
            return;
        }

        // ── CHECK PHASE (3 s) ─────────────────────────────────────────
        setWatcherDot("#ffd700");
        const down = _codespaceConnections.filter(c => !c.ws || c.ws.readyState !== WebSocket.OPEN);
        setWatcherText(`Checking… ${down.length} offline`);
        down.forEach(c => connectTo(c));
        await new Promise(r => setTimeout(r, WATCHER_CHECK_MS));

        // ── WAIT PHASE (30 s countdown) ───────────────────────────────
        setWatcherDot("#00f5a0");
        const connected = _codespaceConnections.filter(c => c.ws && c.ws.readyState === WebSocket.OPEN).length;
        const lastCheck = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        for (let remaining = WATCHER_WAIT_MS / 1000; remaining > 0; remaining--) {
            const tgl = document.getElementById("watcherToggle");
            if (!tgl || !tgl.checked) break;
            setWatcherText(`✓ ${lastCheck} — ${connected}/${_codespaceConnections.length} up — next in ${remaining}s`);
            await new Promise(r => setTimeout(r, 1000));
        }

        // Schedule next cycle
        watcherTimer = setTimeout(watcherCycle, 0);
    }

    function startWatcher() {
        if (watcherTimer) clearTimeout(watcherTimer);
        watcherTimer = setTimeout(watcherCycle, 1000); // first check 1s after load
    }




    HTML.connectNoob.addEventListener("click", () => {
        const hash = HTML.serverHash.value?.replace("#", "") || window.location.hash.slice(1);
        const rawCount = HTML.botCount.value.trim();
        const countValue = Number(rawCount);
        const rawWindow = HTML.codespaceSpawnWindow ? HTML.codespaceSpawnWindow.value.trim() : "15";
        const parsedWindow = parseInt(rawWindow, 10);
        const spawnWindow = Number.isInteger(parsedWindow)
            ? Math.min(Math.max(parsedWindow, 0), 30)
            : 15;

        if (!Number.isInteger(countValue) || countValue < 1 || countValue > 800) {
            alert("Bot density must be a whole number between 1 and 800.");
            HTML.botCount.focus();
            updateBotDensityPreview();
            return;
        }

        if (getOpenConnections().length === 0) {
            alert("No ready codespace connections available.");
            return;
        }

        if (!hash) {
            alert("Please paste a server hash or join a game first!");
            return;
        }
        packetDistributed("F", countValue, hash, spawnWindow);
    });

    HTML.deleteNoobs.addEventListener("click", () => { packet("B"); });

    HTML.respawnBots.onclick = () => { packet("K"); };

    if (HTML.respawnBots) {
        HTML.respawnBots.onclick = () => { packet("K"); };
    }

    // CODESPACE MANAGER — init saved/default entries and wire buttons
    setTimeout(() => {
        const saved = loadCodespaces();
        const urlsToLoad = saved || DEFAULT_URLS;
        urlsToLoad.forEach(url => createCodespaceEntry(url));
        updateHeaderStatus();

        const addBtn = document.getElementById("addCodespaceBtn");
        if (addBtn) {
            addBtn.onclick = (e) => {
                e.stopPropagation();
                createCodespaceEntry("");
            };
        }

        const reconnectAllBtn = document.getElementById("reconnectAllBtn");
        if (reconnectAllBtn) {
            reconnectAllBtn.onclick = (e) => {
                e.stopPropagation();
                _codespaceConnections.forEach(c => connectTo(c));
            };
        }

        if (HTML.codespaceSafeMode) {
            HTML.codespaceSafeMode.addEventListener("change", updateBotDensityPreview);
        }
        if (HTML.codespaceMaxBots) {
            HTML.codespaceMaxBots.addEventListener("input", updateBotDensityPreview);
            HTML.codespaceMaxBots.addEventListener("blur", updateBotDensityPreview);
        }
        if (HTML.codespaceSpawnWindow) {
            HTML.codespaceSpawnWindow.addEventListener("input", updateBotDensityPreview);
            HTML.codespaceSpawnWindow.addEventListener("blur", updateBotDensityPreview);
        }

        // Watcher toggle restarts cycle when re-enabled
        const watcherToggle = document.getElementById("watcherToggle");
        if (watcherToggle) {
            watcherToggle.addEventListener("change", () => {
                if (watcherToggle.checked) {
                    startWatcher();
                } else {
                    if (watcherTimer) clearTimeout(watcherTimer);
                    setWatcherDot("#555");
                    setWatcherText("Watcher disabled");
                }
            });
        }

        startWatcher();
    }, 0);

    // GAME COORDINATE INTERCEPTION
    let x = null, y = null, lastUpdate = 0;
    const oldStrokeText = CanvasRenderingContext2D.prototype.strokeText;
    CanvasRenderingContext2D.prototype.strokeText = function (text, ...args) {
        if (text.includes("Coordinates: (")) {
            const match = text.match(/Coordinates: \(([^)]+)\)/);
            if (match) {
                const parts = match[1].split(", ");
                x = parseFloat(parts[0]);
                y = parseFloat(parts[1]);
                lastUpdate = Date.now();
            }
        } else if (text.startsWith("You have been killed by") || text === "You have died a stupid death.") {
            x = y = null; // Clear coordinates on death
        }
        return oldStrokeText.call(this, text, ...args);
    };

    // Sensitivity slider update
    HTML.mouseSensitivity.oninput = () => {
        HTML.sensitivityValue.textContent = HTML.mouseSensitivity.value;
    };

    // BOT HEARTBEAT
    setInterval(() => {
        const divisor = parseFloat(HTML.mouseSensitivity.value) || 20;

        packet("A",
            x, y,
            mouseX / divisor,
            mouseY / divisor,
            mouseDown, rMouseDown,
            HTML.mbs.checked,
            HTML.feeding.checked,
            keys["ShiftLeft"],
            HTML.autofire.checked,
            HTML.autospin.checked,
            HTML.manualMode.checked,
            parseFloat(HTML.manualX.value) || 0,
            parseFloat(HTML.manualY.value) || 0,
            HTML.overrideMode.checked,
            HTML.sneakMode.checked
        );
    }, 80);

})();
