/**
 * ENGLISH LEARNING PLATFORM ENGINE (VERSION 2.2 - Flexible Video ID)
 */

(function() {
    const style = document.createElement('style');
    style.innerHTML = `
        .learning-platform { max-width: 850px; margin: 0 auto; font-family: 'Segoe UI', Arial, sans-serif; color: #000; background: #fff; padding: 5px; box-sizing: border-box; }
        .video-section { position: sticky; top: 0; background: #fff; z-index: 1000; padding-bottom: 10px; border-bottom: 2px solid #000; }
        .video-frame { position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 4px; box-shadow: 0 2px 10px rgba(0,0,0,0.2); background: #000; }
        .video-frame iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
        .instruction-line { font-style: italic; font-size: 14px; color: #333; margin-bottom: 15px; display: block; margin-top: 10px; }
        .shortcut-info { text-align: center; font-size: 12px; margin-top: 8px; color: #444; }
        .shortcut-info b { background: #eee; padding: 2px 5px; border-radius: 3px; border: 1px solid #ccc; }
        .exercise-tabs { display: flex; flex-wrap: wrap; gap: 3px; margin-top: 15px; border-bottom: 2px solid #000; }
        .tab-link { border: 1px solid #ddd; border-bottom: none; padding: 10px 15px; cursor: pointer; background: #f1f1f1; border-radius: 5px 5px 0 0; font-weight: bold; font-size: 12px; color: #444; flex-grow: 1; text-align: center; }
        .tab-link:hover { background: #e0e0e0; }
        .tab-link.active { background: #000; color: #fff; border-color: #000; }
        .tab-panel { padding: 15px; border: 1px solid #000; border-top: none; border-radius: 0 0 5px 5px; min-height: 400px; }
        .hidden { display: none !important; }
        .btn-submit { background: #e74c3c; color: white; border: none; padding: 12px 40px; border-radius: 4px; cursor: pointer; font-size: 16px; margin: 20px auto; font-weight: bold; display: block; transition: 0.3s; }
        .btn-submit:hover { background: #c0392b; }
        .part-nav { margin-bottom: 15px; display: flex; gap: 10px; flex-wrap: wrap; }
        .btn-part { padding: 5px 15px; cursor: pointer; background: #ddd; border: none; border-radius: 3px; font-weight: bold; }
        .btn-part:hover { background: #ccc; }
        .q-item { margin-bottom: 20px; padding: 15px; border-bottom: 1px solid #eee; transition: 0.3s; }
        .options-group { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
        .radio-btn { cursor: pointer; display: inline-flex; align-items: center; justify-content: center; padding: 8px 20px; border: 2px solid #ddd; border-radius: 25px; font-weight: bold; font-size: 14px; transition: 0.2s; user-select: none; }
        .options-group input[type="radio"] { display: none; }
        .options-group input[type="radio"]:checked + .radio-btn { background: #000; color: #fff; border-color: #000; }
        .match-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #eee; }
        .match-input { width: 40px; text-align: center; border: 1px solid #000; font-weight: bold; padding: 5px; text-transform: uppercase; margin-left: 10px; }
        .cloze-select { border: none; border-bottom: 2px solid #e74c3c; font-weight: bold; font-size: 16px; cursor: pointer; padding: 0 5px; background: transparent; }
        .pill-container { display: inline-flex; background: #f0f0f0; border-radius: 20px; padding: 3px; margin-left: 10px; vertical-align: middle; border: 1px solid #ccc; }
        .pill-item { display: none; }
        .pill-label { padding: 4px 15px; border-radius: 17px; cursor: pointer; font-size: 14px; font-weight: bold; transition: 0.3s; color: #555; }
        .pill-item:checked + .pill-label { background: #3498db; color: #fff; }
        .cue-row { padding: 8px 10px; border-left: 4px solid transparent; line-height: 1.6; font-size: 17px; color: #000; margin-bottom: 5px; }
        .cue-active { border-left-color: #3498db; background: #e3f2fd; font-weight: bold; }
        .ans-hint { color: #27ae60; font-size: 13px; font-weight: bold; margin-left: 8px; font-style: italic; }
        .score-box { margin-top: 15px; padding: 15px; border-radius: 4px; text-align: center; font-size: 18px; font-weight: bold; border: 2px solid #27ae60; background: #f0fff4; color: #1e7e34; display: none; }
        .input-fill { border:none; border-bottom:1px solid #000; text-align:center; font-weight:bold; outline: none; background: transparent; color: #000; }
        .loading-msg { padding: 40px; text-align: center; font-size: 18px; color: #666; background: #f9f9f9; border-radius: 4px; }
        .error-msg { color: #e74c3c; padding: 20px; text-align: center; border: 1px solid #e74c3c; background: #fff5f5; border-radius: 4px; }
    `;
    document.head.appendChild(style);

    const container = document.getElementById('learning-app-root');
    let cfg = {}; 
    let player, syncTimer, activeCues = [];

    init();

    async function init() {
        if(!container) return;
        
        const dataUrl = container.getAttribute('data-source');
        const htmlVideoId = container.getAttribute('data-video-id');

        if(!dataUrl) { 
            container.innerHTML = '<div class="error-msg">⚠️ Missing <code>data-source</code> attribute.</div>'; 
            return; 
        }

        container.innerHTML = '<div class="loading-msg">⏳ Loading lesson data...</div>';

        try {
            const response = await fetch(dataUrl);
            if(!response.ok) throw new Error("HTTP " + response.status);
            cfg = await response.json();

            if(htmlVideoId) {
                cfg.videoId = htmlVideoId;
                console.log("Using Video ID from HTML:", htmlVideoId);
            }

            if(!cfg.videoId) {
                throw new Error("No Video ID found (checked HTML attribute and JSON file).");
            }
            
            renderApp();
            loadYoutubeApi();

        } catch (e) {
            container.innerHTML = `<div class="error-msg">❌ Error: ${e.message}</div>`;
            console.error(e);
        }
    }

    function renderApp() {
        let html = `
        <div class="learning-platform">
            <div class="video-section">
                <div class="video-frame"><div id="player"></div></div>
                <div class="shortcut-info">⌨️ <b>Ctrl + Space</b>: Play/Pause | <b>Ctrl + ←</b>: Back 3s</div>
            </div>
            <div class="exercise-tabs">`;

        if(cfg.ex1) html += `<button class="tab-link active" onclick="app.switchTab(event, 'ex1')">EX1 Gap Fill</button>`;
        if(cfg.ex6) html += `<button class="tab-link" onclick="app.switchTab(event, 'ex6')">EX2 Listen-Choose</button>`;
        if(cfg.ex2) html += `<button class="tab-link" onclick="app.switchTab(event, 'ex2')">EX3 T-F-NG</button>`;
        if(cfg.ex3) html += `<button class="tab-link" onclick="app.switchTab(event, 'ex3')">EX4 MCQ</button>`;
        if(cfg.ex4) html += `<button class="tab-link" onclick="app.switchTab(event, 'ex4')">EX5 Matching</button>`;
        if(cfg.ex5) html += `<button class="tab-link" onclick="app.switchTab(event, 'ex5')">EX6 Cloze</button>`;
        
        html += `</div><div class="tab-panel">`;

        if(cfg.ex1) {
            html += `
            <div id="ex1" class="tab-content">
                <span class="instruction-line">Instruction: Listen to the conversation and fill in the blanks.</span>
                <div class="shortcut-info">⌨️ <b>Ctrl + Space</b>: Play/Pause | <b>Ctrl + ←</b>: Back 3s</div>
                <p></p>
                <div class="part-nav">
                    ${cfg.ex1.map((_,i) => `<button class="btn-part" onclick="app.startSync(${i}, 'ex1')">Part ${i+1}</button>`).join('')}
                </div>
                <div id="ex1-workspace"></div>
                <button id="sub-btn-ex1" class="btn-submit hidden" onclick="app.checkEx1()">Submit EX1</button>
            </div>`;
        }

        if(cfg.ex2) {
            html += `<div id="ex2" class="tab-content hidden"><span class="instruction-line">Instruction: True (T), False (F), or Not Given (NG).</span><div id="ex2-workspace"></div><button class="btn-submit" onclick="app.checkEx2()">Submit EX3</button></div>`;
        }

        if(cfg.ex3) {
            html += `<div id="ex3" class="tab-content hidden"><span class="instruction-line">Instruction: Choose the correct answer.</span><div id="ex3-workspace"></div><button class="btn-submit" onclick="app.checkEx3()">Submit EX4</button></div>`;
        }

        if(cfg.ex4) {
            html += `
            <div id="ex4" class="tab-content hidden">
                <span class="instruction-line">Instruction: Match the words with the definitions.</span>
                <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                    <div id="ex4-words" style="flex: 1; min-width: 250px;"></div>
                    <div id="ex4-defs" style="flex: 1.5; font-size: 13px; background: #f9f9f9; padding: 15px; border: 1px solid #ddd; min-width: 250px;"></div>
                </div>
                <button class="btn-submit" onclick="app.checkEx4()">Submit EX5</button>
            </div>`;
        }

        if(cfg.ex5) {
            html += `<div id="ex5" class="tab-content hidden"><span class="instruction-line">Instruction: Choose the correct word based on context.</span><div id="ex5-workspace" style="line-height:2.5; font-size:17px; background:#f4f4f4; padding:15px; border-radius:4px;"></div><button class="btn-submit" onclick="app.checkEx5()">Submit EX6</button></div>`;
        }

        if(cfg.ex6) {
            html += `
            <div id="ex6" class="tab-content hidden">
                <span class="instruction-line">Instruction: Listen and choose the correct word.</span>
                <div class="shortcut-info">⌨️ <b>Ctrl + Space</b>: Play/Pause | <b>Ctrl + ←</b>: Back 3s</div>
                <p></p>
                <div class="part-nav">
                     ${cfg.ex6.map((_,i) => `<button class="btn-part" onclick="app.startSync(${i}, 'ex6')">Part ${i+1}</button>`).join('')}
                </div>
                <div id="ex6-workspace"></div>
                <button id="sub-btn-ex6" class="btn-submit hidden" onclick="app.checkEx6()">Submit EX2</button>
            </div>`;
        }

        html += `</div></div>`; 
        container.innerHTML = html;
        
        renderStatic();
        if(cfg.ex1) setTimeout(() => app.startSync(0, 'ex1'), 500);
        else if(cfg.ex6) setTimeout(() => app.startSync(0, 'ex6'), 500);
    }

    function loadYoutubeApi() {
        if (!window.YT) {
            var tag = document.createElement('script');
            var firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        } else {
            if(window.YT && window.YT.Player) createPlayer();
        }
    }

    window.onYouTubeIframeAPIReady = function() {
        createPlayer();
    }

    function createPlayer() {
        if(document.getElementById('player') && !player && cfg.videoId) {
            player = new YT.Player('player', {
                height:'100%', width:'100%', videoId: cfg.videoId
            });
        }
    }

    function renderStatic() {
        if(cfg.ex2) {
            let h2 = "";
            cfg.ex2.forEach((d, i) => h2 += `<div class="q-item" id="ex2q-${i}"><span>${i+1}. ${d.q}</span><div class="options-group"><input type="radio" id="e2r${i}t" name="e2r${i}" value="true"><label for="e2r${i}t" class="radio-btn">T</label><input type="radio" id="e2r${i}f" name="e2r${i}" value="false"><label for="e2r${i}f" class="radio-btn">F</label><input type="radio" id="e2r${i}n" name="e2r${i}" value="not given"><label for="e2r${i}n" class="radio-btn">NG</label></div></div>`);
            document.getElementById('ex2-workspace').innerHTML = h2;
        }
        if(cfg.ex3) {
            let h3 = "";
            cfg.ex3.forEach((d, i) => {
                h3 += `<div class="q-item" id="ex3q-${i}"><b>${i+1}. ${d.q}</b><div class="options-group">`;
                d.o.forEach((opt, idx) => h3 += `<input type="radio" id="e3r${i}${idx}" name="e3r${i}" value="${idx}"><label for="e3r${i}${idx}" class="radio-btn">${String.fromCharCode(65+idx)}. ${opt}</label>`);
                h3 += `</div></div>`;
            });
            document.getElementById('ex3-workspace').innerHTML = h3;
        }
        if(cfg.ex4) {
            let wh = "", dh = "";
            cfg.ex4.words.forEach((w, i) => wh += `<div class="match-row"><span>${i+1}. ${w}</span><input class="match-input" data-idx="${i}"></div>`);
            Object.keys(cfg.ex4.defs).sort().forEach(k => dh += `<div><b>${k}.</b> ${cfg.ex4.defs[k]}</div>`);
            document.getElementById('ex4-words').innerHTML = wh;
            document.getElementById('ex4-defs').innerHTML = dh;
        }
        if(cfg.ex5) {
            let t = cfg.ex5.text;
            cfg.ex5.opts.forEach((o, i) => {
                let s = `<select class="cloze-select" data-ans="${o[0]}"><option value="">---</option>`;
                o.forEach(opt => s += `<option>${opt}</option>`);
                s += `</select>`;
                t = t.replace(`[${o[0]}]`, s);
            });
            document.getElementById('ex5-workspace').innerHTML = t;
        }
    }

    window.app = {
        switchTab: (evt, id) => {
            document.querySelectorAll(".tab-content").forEach(c => c.classList.add("hidden"));
            document.querySelectorAll(".tab-link").forEach(t => t.classList.remove("active"));
            const target = document.getElementById(id);
            if(target) target.classList.remove("hidden");
            if(evt && evt.currentTarget) evt.currentTarget.classList.add("active");
            clearInterval(syncTimer);
        },
        startSync: (pIdx, type) => {
            const config = (type === 'ex1') ? cfg.ex1 : cfg.ex6;
            if(!config || !config[pIdx]) return;
            activeCues = config[pIdx].cues;
            clearInterval(syncTimer);
            const btn = document.getElementById(`sub-btn-${type}`);
            if(btn) btn.classList.remove('hidden');

            let h = "";
            activeCues.forEach(c => {
                let txt = c.text;
                if(type === 'ex1') {
                    c.ans.forEach(a => {
                        let width = Math.max(60, a.length * 10 + 10);
                        txt = txt.replace(`[${a}]`, `<input class="input-fill" data-ans="${a.toLowerCase()}" style="width:${width}px">`);
                    });
                } else {
                    txt += ` <div class="pill-container">
                        <input type="radio" id="r${c.id}a" name="r${c.id}" value="${c.opt[0]}" class="pill-item">
                        <label for="r${c.id}a" class="pill-label">${c.opt[0]}</label>
                        <input type="radio" id="r${c.id}b" name="r${c.id}" value="${c.opt[1]}" class="pill-item">
                        <label for="r${c.id}b" class="pill-label">${c.opt[1]}</label>
                    </div>`;
                }
                h += `<div id="${type}-row-${c.id}" class="cue-row">${txt}</div>`;
            });
            document.getElementById(`${type}-workspace`).innerHTML = h;
            
            if(player && player.seekTo) {
                player.seekTo(activeCues[0].start); 
                player.playVideo();
            }
            
            syncTimer = setInterval(() => {
                if(!player || !player.getCurrentTime) return;
                let now = player.getCurrentTime();
                activeCues.forEach(c => {
                    let el = document.getElementById(`${type}-row-${c.id}`);
                    if(el) { 
                        if(now >= c.start && now <= c.end) el.classList.add('cue-active'); 
                        else el.classList.remove('cue-active'); 
                    }
                });
            }, 100);
        },
        checkEx1: () => {
            document.querySelectorAll('#ex1 .input-fill').forEach(i => {
                let cor = i.getAttribute('data-ans');
                if(i.value.trim().toLowerCase() === cor) i.style.color="#27ae60"; 
                else { 
                    i.style.color="#e74c3c"; 
                    if(!i.nextElementSibling || !i.nextElementSibling.classList.contains('ans-hint')) 
                        i.insertAdjacentHTML('afterend', `<span class="ans-hint">(${cor})</span>`); 
                }
            });
        },
        checkEx2: () => {
             cfg.ex2.forEach((d, i) => {
                let sel = document.querySelector(`input[name="e2r${i}"]:checked`);
                let row = document.getElementById(`ex2q-${i}`);
                if(sel && sel.value === d.a) row.style.background="#d4edda"; 
                else { 
                    row.style.background="#f8d7da"; 
                    if(!row.innerHTML.includes('ans-hint')) row.insertAdjacentHTML('beforeend', `<span class="ans-hint">(${d.a.toUpperCase()})</span>`); 
                }
            });
        },
        checkEx3: () => {
            cfg.ex3.forEach((d, i) => {
                let sel = document.querySelector(`input[name="e3r${i}"]:checked`);
                let row = document.getElementById(`ex3q-${i}`);
                if(sel && parseInt(sel.value) === d.a) row.style.background="#d4edda"; 
                else { 
                    row.style.background="#f8d7da"; 
                    if(!row.innerHTML.includes('ans-hint')) row.insertAdjacentHTML('beforeend', `<span class="ans-hint">(${String.fromCharCode(65+d.a)})</span>`); 
                }
            });
        },
        checkEx4: () => {
            document.querySelectorAll('.match-input').forEach(i => {
                let idx = i.getAttribute('data-idx');
                if(i.value.trim().toUpperCase() === cfg.ex4.ans[idx]) i.style.background="#d4edda"; 
                else { 
                    i.style.background="#f8d7da"; 
                    if(!i.nextElementSibling || !i.nextElementSibling.classList.contains('ans-hint')) 
                        i.insertAdjacentHTML('afterend', `<span class="ans-hint">(${cfg.ex4.ans[idx]})</span>`); 
                }
            });
        },
        checkEx5: () => {
            document.querySelectorAll('.cloze-select').forEach(s => {
                if(s.value === s.getAttribute('data-ans')) s.style.color="#27ae60"; 
                else { 
                    s.style.color="#e74c3c"; 
                    if(!s.nextElementSibling || !s.nextElementSibling.classList.contains('ans-hint')) 
                        s.insertAdjacentHTML('afterend', `<span class="ans-hint">(${s.getAttribute('data-ans')})</span>`); 
                }
            });
        },
        checkEx6: () => {
            activeCues.forEach(c => {
                let sel = document.querySelector(`input[name="r${c.id}"]:checked`);
                let row = document.getElementById(`ex6-row-${c.id}`);
                if(sel && sel.value === c.correct) row.style.background="#d4edda"; 
                else { 
                    row.style.background="#f8d7da"; 
                    if(!row.innerHTML.includes('ans-hint')) row.insertAdjacentHTML('beforeend', `<span class="ans-hint">(${c.correct})</span>`); 
                }
            });
        }
    };

    document.addEventListener('keydown', (e) => {
        if(e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && player && typeof player.getPlayerState === 'function') {
            if(e.ctrlKey && e.code === 'Space') { 
                e.preventDefault();
                player.getPlayerState()===1 ? player.pauseVideo() : player.playVideo(); 
            }
            if(e.ctrlKey && e.code === 'ArrowLeft') {
                player.seekTo(player.getCurrentTime()-3);
            }
        }
    });


})();

