let player, syncTimer, activeCues = [];
let sheetData = {};

async function initPlatform() {
    // 1. Force YouTube API to load immediately
    loadYouTubeAPI(); 

    try {
        const response = await fetch(SHEET_CSV_URL);
        const csvText = await response.text();
        
        // CSV Parsing logic
        const rows = csvText.split('\n').map(row => row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/));
        const contentRow = rows.find(r => r[0] && r[0].replace(/"/g, "").trim() === LESSON_ID);

        if (contentRow) {
            const parseCell = (cell) => {
                if (!cell) return null;
                let clean = cell.trim();
                if (clean.startsWith('"') && clean.endsWith('"')) {
                    clean = clean.substring(1, clean.length - 1).replace(/""/g, '"');
                }
                try {
                    return JSON.parse(clean);
                } catch (e) {
                    console.error("JSON Syntax Error. Check double quotes in cell:", clean);
                    return null;
                }
            };

            sheetData = {
                videoId: contentRow[1].replace(/"/g, "").trim(),
                ex1: parseCell(contentRow[2]),
                ex2: parseCell(contentRow[3]),
                ex3: parseCell(contentRow[4]),
                ex4: parseCell(contentRow[5]),
                ex5: parseCell(contentRow[6]),
                ex6: parseCell(contentRow[7])
            };

            // Update Video ID once data is fetched
            if (player && player.loadVideoById && sheetData.videoId) {
                player.loadVideoById(sheetData.videoId);
            }
            renderStaticExercises();
        }
    } catch (err) {
        console.error("Critical: Failed to load sheet data:", err);
    }
}

function loadYouTubeAPI() {
    if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
    } else if (window.YT && window.YT.Player) {
        onYouTubeIframeAPIReady();
    }
}

window.onYouTubeIframeAPIReady = function() {
    player = new YT.Player('player', {
        height: '100%', width: '100%', 
        videoId: "0zksokY32r4", // Fallback ID
        playerVars: { 'rel': 0, 'showinfo': 0, 'autoplay': 0 },
        events: { 'onReady': () => { if(sheetData && sheetData.ex2) renderStaticExercises(); } }
    });
};

function renderStaticExercises() {
    if (sheetData.ex2) {
        let h = "";
        sheetData.ex2.forEach((d, i) => {
            h += `<div class="q-item" id="ex2q-${i}"><span>${i+1}. ${d.q}</span><div class="options-group">` +
                  `<input type="radio" id="e2r${i}t" name="e2r${i}" value="true"><label for="e2r${i}t" class="radio-btn">T</label>` +
                  `<input type="radio" id="e2r${i}f" name="e2r${i}" value="false"><label for="e2r${i}f" class="radio-btn">F</label>` +
                  `<input type="radio" id="e2r${i}n" name="e2r${i}" value="not given"><label for="e2r${i}n" class="radio-btn">NG</label></div></div>`;
        });
        document.getElementById('ex2-workspace').innerHTML = h;
    }

    if (sheetData.ex3) {
        let h = "";
        sheetData.ex3.forEach((d, i) => {
            h += `<div class="q-item" id="ex3q-${i}"><b>${i+1}. ${d.q}</b><div class="options-group">`;
            d.o.forEach((opt, idx) => h += `<input type="radio" id="e3r${i}${idx}" name="e3r${i}" value="${idx}"><label for="e3r${i}${idx}" class="radio-btn">${String.fromCharCode(65+idx)}. ${opt}</label>`);
            h += `</div></div>`;
        });
        document.getElementById('ex3-workspace').innerHTML = h;
    }

    if (sheetData.ex4) {
        let wh = "", dh = "";
        sheetData.ex4.words.forEach((w, i) => wh += `<div class="match-row"><span>${i+1}. ${w}</span><input class="match-input" data-idx="${i}"></div>`);
        Object.keys(sheetData.ex4.defs).sort().forEach(k => dh += `<div><b>${k}.</b> ${sheetData.ex4.defs[k]}</div>`);
        document.getElementById('ex4-words').innerHTML = wh;
        document.getElementById('ex4-defs').innerHTML = dh;
    }

    if (sheetData.ex5) {
        let t = sheetData.ex5.text;
        sheetData.ex5.opts.forEach((o, i) => {
            let s = `<select class="cloze-select" data-ans="${o[0]}"><option value="">---</option>`;
            o.forEach(opt => s += `<option>${opt}</option>`);
            s += `</select>`;
            t = t.replace(`[${o[0]}]`, s);
        });
        document.getElementById('ex5-workspace').innerHTML = t;
    }
}

window.switchTab = function(evt, id) {
    document.querySelectorAll(".tab-content").forEach(c => c.classList.add("hidden"));
    document.querySelectorAll(".tab-link").forEach(t => t.classList.remove("active"));
    document.getElementById(id).classList.remove("hidden");
    evt.currentTarget.classList.add("active");
    clearInterval(syncTimer);
}

window.startSync = function(pIdx, type) {
    const config = (type === 'ex1') ? sheetData.ex1 : sheetData.ex6;
    if (!config || !config[pIdx]) return;
    activeCues = config[pIdx].cues;
    clearInterval(syncTimer);
    
    let subBtn = document.getElementById(`sub-btn-${type}`);
    if(subBtn) subBtn.classList.remove('hidden');

    let html = "";
    activeCues.forEach(c => {
        let txt = c.text;
        if(type === 'ex1') c.ans.forEach(a => txt = txt.replace(`[${a}]`, `<input class="input-fill" data-ans="${a.toLowerCase()}" style="width:${a.length*10+20}px">`));
        else txt += ` <div class="pill-container"><input type="radio" id="r${c.id}a" name="r${c.id}" value="${c.opt[0]}" class="pill-item"><label for="r${c.id}a" class="pill-label">${c.opt[0]}</label><input type="radio" id="r${c.id}b" name="r${c.id}" value="${c.opt[1]}" class="pill-item"><label for="r${c.id}b" class="pill-label">${c.opt[1]}</label></div>`;
        html += `<div id="${type}-row-${c.id}" class="cue-row">${txt}</div>`;
    });
    document.getElementById(`${type}-workspace`).innerHTML = html;
    player.seekTo(activeCues[0].start); player.playVideo();
    syncTimer = setInterval(() => {
        let now = player.getCurrentTime();
        activeCues.forEach(c => {
            let rows = document.querySelectorAll(`[id$="-row-${c.id}"]`);
            rows.forEach(el => { if(now >= c.start && now <= c.end) el.classList.add('cue-active'); else el.classList.remove('cue-active'); });
        });
    }, 100);
}

// Result Checkers
window.checkEx1 = () => document.querySelectorAll('#ex1 .input-fill').forEach(i => { let cor = i.getAttribute('data-ans'); if(i.value.trim().toLowerCase() === cor) i.style.color="#27ae60"; else { i.style.color="#e74c3c"; i.insertAdjacentHTML('afterend', `<span class="ans-hint">(${cor})</span>`); } });
window.checkEx2 = () => sheetData.ex2.forEach((d, i) => { let sel = document.querySelector(`input[name="e2r${i}"]:checked`); let row = document.getElementById(`ex2q-${i}`); if(sel && sel.value === d.a) row.style.background="#d4edda"; else { row.style.background="#f8d7da"; row.insertAdjacentHTML('beforeend', `<span class="ans-hint">(${d.a.toUpperCase()})</span>`); } });
window.checkEx3 = () => sheetData.ex3.forEach((d, i) => { let sel = document.querySelector(`input[name="e3r${i}"]:checked`); let row = document.getElementById(`ex3q-${i}`); if(sel && parseInt(sel.value) === d.a) row.style.background="#d4edda"; else { row.style.background="#f8d7da"; row.insertAdjacentHTML('beforeend', `<span class="ans-hint">(${String.fromCharCode(65+d.a)})</span>`); } });
window.checkEx4 = () => document.querySelectorAll('.match-input').forEach(i => { let idx = i.getAttribute('data-idx'); if(i.value.toUpperCase() === sheetData.ex4.ans[idx]) i.style.background="#d4edda"; else { i.style.background="#f8d7da"; i.insertAdjacentHTML('afterend', `<span class="ans-hint">(${sheetData.ex4.ans[idx]})</span>`); } });
window.checkEx5 = () => document.querySelectorAll('.cloze-select').forEach(s => { if(s.value === s.getAttribute('data-ans')) s.style.color="#27ae60"; else { s.style.color="#e74c3c"; s.insertAdjacentHTML('afterend', `<span class="ans-hint">(${s.getAttribute('data-ans')})</span>`); } });
window.checkEx6 = () => activeCues.forEach(c => { let sel = document.querySelector(`input[name="r${c.id}"]:checked`); let row = document.getElementById(`ex6-row-${c.id}`); if(sel && sel.value === c.correct) row.style.background="#d4edda"; else { row.style.background="#f8d7da"; row.insertAdjacentHTML('beforeend', `<span class="ans-hint">(${c.correct})</span>`); } });

// Shortcuts
document.addEventListener('keydown', (e) => {
    if(e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
        if(e.ctrlKey && e.code === 'Space') { if(player && player.getPlayerState) player.getPlayerState() === 1 ? player.pauseVideo() : player.playVideo(); e.preventDefault(); }
        if(e.ctrlKey && e.code === 'ArrowLeft') if(player && player.seekTo) player.seekTo(player.getCurrentTime() - 3);
    }
});

document.addEventListener('DOMContentLoaded', initPlatform);