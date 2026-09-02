// ===============================
// GLOBAL STATE
// ===============================
let isReading = false;
let voices = [];



/* =========================================================
   PRACTICE HEATMAP — JAVASCRIPT
   =========================================================
   Production-ready. No external dependencies.
   ========================================================= */

(function () {
    "use strict";

    /* ---------------------------------------------------------
       Color stops for the heatmap.
       Each stop = { count, rgb:[r,g,b] }.
       Values between stops are linearly interpolated.
       --------------------------------------------------------- */
    var HEATMAP_STOPS = [
        { count: 0,   rgb: [255, 255, 255] }, // #ffffff
        { count: 1,   rgb: [255, 230, 238] }, // #ffe6ee
        { count: 10,  rgb: [255, 179, 204] }, // #ffb3cc
        { count: 25,  rgb: [255, 204, 128] }, // #ffcc80
        { count: 50,  rgb: [255, 241, 118] }, // #fff176
        { count: 75,  rgb: [165, 214, 167] }, // #a5d6a7
        { count: 100, rgb: [76, 175, 80]   }  // #4caf50
    ];

    /* ---------------------------------------------------------
       Internal: linear interpolation between two numbers.
       --------------------------------------------------------- */
    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    /* ---------------------------------------------------------
       Internal: convert a listen count into an interpolated
       rgb() CSS color string using HEATMAP_STOPS.
       --------------------------------------------------------- */
    function getHeatmapColor(count) {
        if (!isFinite(count) || count <= 0) {
            return "rgb(255, 255, 255)";
        }

        // Clamp to the maximum defined stop.
        var lastStop = HEATMAP_STOPS[HEATMAP_STOPS.length - 1];
        if (count >= lastStop.count) {
            return "rgb(" + lastStop.rgb[0] + ", " +
                            lastStop.rgb[1] + ", " +
                            lastStop.rgb[2] + ")";
        }

        // Find the two stops the count falls between.
        for (var i = 0; i < HEATMAP_STOPS.length - 1; i++) {
            var lower = HEATMAP_STOPS[i];
            var upper = HEATMAP_STOPS[i + 1];

            if (count >= lower.count && count <= upper.count) {
                var range = upper.count - lower.count;
                var t = range === 0 ? 0 : (count - lower.count) / range;

                var r = Math.round(lerp(lower.rgb[0], upper.rgb[0], t));
                var g = Math.round(lerp(lower.rgb[1], upper.rgb[1], t));
                var b = Math.round(lerp(lower.rgb[2], upper.rgb[2], t));

                return "rgb(" + r + ", " + g + ", " + b + ")";
            }
        }

        // Fallback (should not be reached).
        return "rgb(255, 255, 255)";
    }

    /* ---------------------------------------------------------
       Internal: determine the practice-level CSS class
       for a given listen count.
       --------------------------------------------------------- */
    function getPracticeClass(count) {
        if (count >= 100) return "practice-mastered";
        if (count >= 50)  return "practice-high";
        if (count >= 10)  return "practice-medium";
        if (count >= 1)   return "practice-low";
        return null; // 0 listens => no practice class
    }

    var PRACTICE_CLASSES = [
        "practice-low",
        "practice-medium",
        "practice-high",
        "practice-mastered"
    ];

    /* ---------------------------------------------------------
       Internal: read a cell's current listen count safely.
       --------------------------------------------------------- */
    function readCount(cell) {
        var raw = cell.dataset.listenCount;
        var n = parseInt(raw, 10);
        return isFinite(n) && n > 0 ? n : 0;
    }

    /* =========================================================
       PUBLIC: updateCellPracticeColor(cell)
       Applies the interpolated heatmap background color and
       the correct practice-level class. Touches only this cell.
       ========================================================= */
    function updateCellPracticeColor(cell) {
        if (!cell) return;

        var count = readCount(cell);

        // Apply interpolated background color directly.
        cell.style.backgroundColor = getHeatmapColor(count);

        // Update practice-level class (remove old, add new).
        var targetClass = getPracticeClass(count);
        for (var i = 0; i < PRACTICE_CLASSES.length; i++) {
            if (PRACTICE_CLASSES[i] !== targetClass) {
                cell.classList.remove(PRACTICE_CLASSES[i]);
            }
        }
        if (targetClass) {
            cell.classList.add(targetClass);
        }

        // Ensure the cell can anchor a badge without layout shift.
        if (!cell.classList.contains("practice-cell")) {
            cell.classList.add("practice-cell");
        }
    }

    /* =========================================================
       PUBLIC: updateCellPracticeBadge(cell)
       Creates/updates/hides the upper-right corner badge.
       Reuses the existing badge node to avoid DOM churn.
       ========================================================= */

   
    function updateCellPracticeBadge(cell) {
    return;
}



   
    /* =========================================================
       PUBLIC: incrementCellListenCount(cell)
       Increments the cell's listen count by 1 and updates ONLY
       that cell's color + badge. Call this AFTER successful
       completion of TTS or audio playback.
       ========================================================= */
    function incrementCellListenCount(cell) {
        if (!cell) return;

        var count = readCount(cell);
        count += 1;
        cell.dataset.listenCount = String(count);

        // Update only the affected cell — no full-table scan.
        updateCellPracticeColor(cell);
        updateCellPracticeBadge(cell);
    }

    /* =========================================================
       PUBLIC: exportPracticeData()
       Returns a plain object mapping cell-id -> listenCount.
       Include the returned object in your existing JSON export.

       NOTE: Each cell must have a stable identifier so counts
       can be restored. We use cell.dataset.cellId. If your cells
       already have an id, set CELL_ID_ATTR accordingly below.
       ========================================================= */

    // Adjust this if your cells identify themselves differently.
    var CELL_SELECTOR = ".practice-cell, [data-cell-id]";
    var CELL_ID_ATTR = "cellId"; // => cell.dataset.cellId

    function getCellId(cell) {
        return cell.dataset[CELL_ID_ATTR] || cell.id || null;
    }

    function exportPracticeData() {
        var data = {};
        var cells = document.querySelectorAll(CELL_SELECTOR);

        for (var i = 0; i < cells.length; i++) {
            var cell = cells[i];
            var count = readCount(cell);
            if (count > 0) {
                var id = getCellId(cell);
                if (id) {
                    data[id] = count;
                }
            }
        }
        return data;
    }

    /* =========================================================
       PUBLIC: restorePracticeData(data)
       Accepts the object produced by exportPracticeData() and
       restores counts, then rebuilds colors + badges.
       Only touches cells that exist and have stored counts
       (plus a light pass to clear any stale visuals).
       ========================================================= */
    function restorePracticeData(data) {
        if (!data || typeof data !== "object") return;

        var cells = document.querySelectorAll(CELL_SELECTOR);

        for (var i = 0; i < cells.length; i++) {
            var cell = cells[i];
            var id = getCellId(cell);
            var count = id && Object.prototype.hasOwnProperty.call(data, id)
                ? parseInt(data[id], 10)
                : 0;

            if (!isFinite(count) || count < 0) {
                count = 0;
            }

            cell.dataset.listenCount = String(count);

            // Rebuild visuals for this cell.
            updateCellPracticeColor(cell);
            updateCellPracticeBadge(cell);
        }
    }

    /* ---------------------------------------------------------
       Expose the public API globally so existing code can call.
       --------------------------------------------------------- */
    window.incrementCellListenCount = incrementCellListenCount;
    window.updateCellPracticeColor  = updateCellPracticeColor;
    window.updateCellPracticeBadge  = updateCellPracticeBadge;
    window.exportPracticeData       = exportPracticeData;
    window.restorePracticeData      = restorePracticeData;
})();


/* =========================================================
   RESET HEATMAP
   Wipes every cell's listen count back to zero and restores
   the "fresh, never practiced" heatmap look. Does not touch
   cell text/media, only the practice-tracking data.
   ========================================================= */
function resetHeatmap() {
    if (!confirm("Reset the heatmap? This clears every cell's listen count back to zero.")) {
        return;
    }

    var cells = document.querySelectorAll("[data-listen-count]");
    cells.forEach(function (cell) {
        cell.dataset.listenCount = "0";
        if (typeof window.updateCellPracticeColor === "function") {
            window.updateCellPracticeColor(cell);
        }
    });

    // If the behind-the-curtain numbers are currently on screen,
    // refresh them so they immediately show the reset zeros.
    if (window.__curtainDataVisible && typeof renderCurtainData === "function") {
        renderCurtainData();
    }
}
window.resetHeatmap = resetHeatmap;


/* =========================================================
   SITE USAGE TRACKER
   Client-side stand-in for what will eventually be a backend
   analytics service. Tracks total time this browser has spent
   on the app, persisted in localStorage so it survives reloads.

   FUTURE BACKEND INTEGRATION NOTE:
   When this moves server-side, swap getStoredTotal()/saveStoredTotal()
   for real API calls (e.g. GET /api/usage/:userId on load, and
   POST /api/usage/:userId/heartbeat instead of the localStorage
   write in tick()). The public methods below (getTotalMs,
   formatDuration) can stay exactly the same, so nothing else in
   the app needs to change when the storage layer moves.
   ========================================================= */
var SiteUsageTracker = (function () {
    var STORAGE_KEY = "speechTable_totalViewTimeMs";
    var HEARTBEAT_MS = 5000; // how often elapsed time gets banked

    var sessionStart = Date.now();
    var lastTick = sessionStart;

    function getStoredTotal() {
        var raw = null;
        try {
            raw = localStorage.getItem(STORAGE_KEY);
        } catch (e) {
            return 0; // storage unavailable (private browsing, etc.)
        }
        var n = parseInt(raw, 10);
        return isFinite(n) && n > 0 ? n : 0;
    }

    function saveStoredTotal(ms) {
        try {
            localStorage.setItem(STORAGE_KEY, String(ms));
        } catch (e) {
            // storage unavailable — fail silently, tracking just won't persist
        }
    }

    function tick() {
        var now = Date.now();
        var elapsed = now - lastTick;
        lastTick = now;
        if (elapsed > 0) {
            saveStoredTotal(getStoredTotal() + elapsed);
        }
    }

    setInterval(tick, HEARTBEAT_MS);
    window.addEventListener("beforeunload", tick);
    document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "hidden") {
            tick();
        } else {
            lastTick = Date.now();
        }
    });

    function getTotalMs() {
        // Banked total, plus whatever has accrued since the last tick.
        return getStoredTotal() + (Date.now() - lastTick);
    }

    function formatDuration(ms) {
        var totalSeconds = Math.floor(ms / 1000);
        var h = Math.floor(totalSeconds / 3600);
        var m = Math.floor((totalSeconds % 3600) / 60);
        var s = totalSeconds % 60;
        var parts = [];
        if (h) parts.push(h + "h");
        if (h || m) parts.push(m + "m");
        parts.push(s + "s");
        return parts.join(" ");
    }

    return {
        getTotalMs: getTotalMs,
        formatDuration: formatDuration
    };
})();
window.SiteUsageTracker = SiteUsageTracker;


/* =========================================================
   BEHIND-THE-CURTAIN DATA VIEW
   Toggle that reveals, on every tracked cell, the exact number
   of times it's been read aloud / played (its listenCount —
   the same number the heatmap color is already derived from),
   plus a small panel showing total time spent on the site.

   FUTURE BACKEND INTEGRATION NOTE: the per-cell numbers already
   come from exportPracticeData()'s shape (cellId -> count), and
   the time-on-site number comes from SiteUsageTracker above —
   both are written so that swapping their source for a server
   response later shouldn't require touching this function.
   ========================================================= */
window.__curtainDataVisible = false;
var __curtainTimeInterval = null;

function renderCurtainData() {
    var cells = document.querySelectorAll("[data-listen-count]");
    cells.forEach(function (cell) {
        var count = parseInt(cell.dataset.listenCount, 10) || 0;

        if (!cell.classList.contains("practice-cell")) {
            cell.classList.add("practice-cell"); // ensures position:relative for the badge
        }

        var badge = cell.querySelector(".practice-badge");
        if (!badge) {
            badge = document.createElement("span");
            badge.className = "practice-badge";
            cell.appendChild(badge);
        }
        badge.textContent = String(count);
        badge.classList.add("is-visible");
    });

    updateCurtainTimeDisplay();
}

function clearCurtainData() {
    document.querySelectorAll(".practice-badge").forEach(function (badge) {
        badge.remove();
    });

    var panel = document.getElementById("curtainTimePanel");
    if (panel) panel.remove();
}

function updateCurtainTimeDisplay() {
    var panel = document.getElementById("curtainTimePanel");
    if (!panel) {
        panel = document.createElement("div");
        panel.id = "curtainTimePanel";
        panel.style.cssText =
            "position:fixed;bottom:16px;right:16px;background:#141414;color:#fff;" +
            "padding:10px 16px;border-radius:8px;font-size:13px;font-family:monospace;" +
            "z-index:2000;box-shadow:0 4px 15px rgba(0,0,0,0.3);";
        document.body.appendChild(panel);
    }
    var ms = window.SiteUsageTracker.getTotalMs();
    panel.textContent = "⏱ Total time on site: " + window.SiteUsageTracker.formatDuration(ms);
}

function toggleCurtainData() {
    window.__curtainDataVisible = !window.__curtainDataVisible;
    var btn = document.getElementById("curtainDataBtn");

    if (window.__curtainDataVisible) {
        renderCurtainData();
        __curtainTimeInterval = setInterval(updateCurtainTimeDisplay, 1000);
        if (btn) btn.textContent = "Hide Behind-Curtain Data";
    } else {
        clearCurtainData();
        if (__curtainTimeInterval) {
            clearInterval(__curtainTimeInterval);
            __curtainTimeInterval = null;
        }
        if (btn) btn.textContent = "See Behind-Curtain Data";
    }
}
window.toggleCurtainData = toggleCurtainData;



function loadVoices() {
  voices = speechSynthesis.getVoices() || [];
  updateLanguageDropdowns();
}

if ("speechSynthesis" in window) {
  speechSynthesis.onvoiceschanged = loadVoices;

  // Some browsers load voices late, so call a few times
  loadVoices();
  setTimeout(loadVoices, 250);
  setTimeout(loadVoices, 1000);
}


// ===============================
// HELPER: Blob <-> Base64
// ===============================
// Converts Blob to Base64 string (for saving)
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// Converts Base64 string back to Blob (for loading)
function base64ToBlob(dataUrl) {
    const parts = dataUrl.split(';base64,');
    const mimeType = parts[0].split(':')[1];
    const rawBase64 = parts[1];
    const byteCharacters = atob(rawBase64);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
        const slice = byteCharacters.slice(offset, offset + 1024);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        byteArrays.push(new Uint8Array(byteNumbers));
    }
    return new Blob(byteArrays, { type: mimeType });
}





// ===============================
// AUDIO RECORDING (Force WebM + Recognize OGX)
// ===============================
let audioContext = null;
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let recordingStartTime = 0;
let recordingTimerInterval = null;

async function initializeRecorder() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    // FORCE WebM format - if not supported, fallback to whatever browser wants
    const options = { mimeType: 'audio/webm;codecs=opus' };
    const supported = MediaRecorder.isTypeSupported(options.mimeType);
    
    mediaRecorder = new MediaRecorder(stream, supported ? options : {});
    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
      saveRecording();
    };

    return true;
  } catch (err) {
    alert("❌ Audio access failed: " + err.message);
    return false;
  }
}

async function startRecording() {
  const recordBtn = document.getElementById("recordBtn");
  const stopBtn = document.getElementById("stopRecordBtn");
  const status = document.getElementById("recordingStatus");
  const timer = document.getElementById("recordingTimer");

  const ready = await initializeRecorder();
  if (!ready) return;

  mediaRecorder.start();
  isRecording = true;
  recordingStartTime = Date.now();

  recordBtn.style.display = "none";
  stopBtn.style.display = "inline-block";
  status.style.display = "block";
  timer.style.display = "block";
  timer.textContent = " 00:00";

  recordingTimerInterval = setInterval(() => {
    if (!isRecording) {
      clearInterval(recordingTimerInterval);
      return;
    }
    const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
    const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
    const secs = String(elapsed % 60).padStart(2, "0");
    timer.textContent = ` ${mins}:${secs}`;
  }, 1000);

  console.log("Recording started");
}

function stopRecording() {
  if (!isRecording || !mediaRecorder) return;

  isRecording = false;
  mediaRecorder.stop();
  clearInterval(recordingTimerInterval);

  document.getElementById("recordBtn").style.display = "inline-block";
  document.getElementById("stopRecordBtn").style.display = "none";
  document.getElementById("recordingStatus").style.display = "none";
  document.getElementById("recordingTimer").style.display = "none";

  console.log("Recording stopped");
}

function saveRecording() {
  if (!audioChunks.length) {
    alert("No audio recorded.");
    return;
  }

  // Use ACTUAL mime type from the recorder (might be audio/ogg on Firefox)
  const actualMimeType = audioChunks[0].type || 'audio/webm';
  const extension = actualMimeType.includes('ogg') ? 'ogg' : 'webm';
  
  const audioBlob = new Blob(audioChunks, { type: actualMimeType });
  const url = URL.createObjectURL(audioBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `recording_${getTimestamp()}.${extension}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  const status = document.getElementById("recordingStatus");
  status.textContent = "✅ Recording saved!";
  status.style.background = "#27ae60";
  setTimeout(() => {
    status.style.display = "none";
  }, 3000);
}









// ===============================
// UTIL: COLUMN + CELL PARSING
// ===============================
function colToIndex(col) {
  return col.toUpperCase().charCodeAt(0) - 65;
}

function parseCell(ref) {
  if (!ref || ref.trim() === "") return null;
  const match = ref.match(/^([A-Z]+)(\d+)$/i);
  if (!match) return null;
  // Returns 1-based row index to match UI (A1 = row 1)
  const col = colToIndex(match[1]);
  const row = parseInt(match[2]);
  return { col, row };
}






// ===============================
// VOICE SELECTION
// ===============================
// ===============================
// VOICE SELECTION - ALL BROWSER LANGUAGES
// ===============================

const LEGACY_LANG_MAP = {
  EN: "en",
  IT: "it",
  ES: "es",
  FR: "fr",
  DE: "de"
};

function normalizeLang(code) {
  return code?.trim().replace("_", "-").toLowerCase();
}

function getVoice(langCode) {
  if (!voices.length) {
    voices = speechSynthesis.getVoices() || [];
  }

  const mappedCode = LEGACY_LANG_MAP[langCode] || langCode;
  const wanted = normalizeLang(mappedCode);

  if (!wanted || wanted === "off") return null;

  // Exact match first, e.g. "en-US"
  let voice = voices.find(v => normalizeLang(v.lang) === wanted);
  if (voice) return voice;

  // Base-language match, e.g. "en" matches "en-US" or "en-GB"
  const baseLang = wanted.split("-")[0];

  return voices.find(v => {
    const voiceLang = normalizeLang(v.lang);
    return voiceLang?.split("-")[0] === baseLang;
  }) || null;
}

function getBrowserLanguages() {
  const unique = new Map();

  voices.forEach(v => {
    if (!v.lang) return;

    const key = normalizeLang(v.lang);
    if (!unique.has(key)) {
      unique.set(key, v.lang);
    }
  });

  return [...unique.values()].sort((a, b) => a.localeCompare(b));
}

// A solid manual fallback table for the languages/regions that browser
// TTS voices actually ship with. Intl.DisplayNames (below) covers far
// more, but it isn't supported in every browser/webview, so this table
// guarantees a real name for the common cases even where DisplayNames
// silently fails — which is exactly why the dropdown was showing raw
// codes like "en-gb" instead of a name.
const MANUAL_LANGUAGE_NAMES = {
  en: "English", es: "Spanish", fr: "French", de: "German", it: "Italian",
  pt: "Portuguese", nl: "Dutch", sv: "Swedish", da: "Danish", nb: "Norwegian",
  no: "Norwegian", fi: "Finnish", pl: "Polish", ru: "Russian", uk: "Ukrainian",
  cs: "Czech", sk: "Slovak", hu: "Hungarian", ro: "Romanian", bg: "Bulgarian",
  el: "Greek", tr: "Turkish", ar: "Arabic", he: "Hebrew", hi: "Hindi",
  bn: "Bengali", ur: "Urdu", fa: "Persian", th: "Thai", vi: "Vietnamese",
  id: "Indonesian", ms: "Malay", zh: "Chinese", "zh-hans": "Chinese (Simplified)",
  "zh-hant": "Chinese (Traditional)", ja: "Japanese", ko: "Korean",
  fil: "Filipino", tl: "Filipino", sw: "Swahili", am: "Amharic",
  af: "Afrikaans", sq: "Albanian", hr: "Croatian", sr: "Serbian",
  sl: "Slovenian", lt: "Lithuanian", lv: "Latvian", et: "Estonian",
  is: "Icelandic", ga: "Irish", cy: "Welsh", ca: "Catalan", eu: "Basque",
  gl: "Galician", mt: "Maltese", ta: "Tamil", te: "Telugu", ml: "Malayalam",
  kn: "Kannada", mr: "Marathi", gu: "Gujarati", pa: "Punjabi", ne: "Nepali",
  si: "Sinhala", my: "Burmese", km: "Khmer", lo: "Lao", ka: "Georgian",
  hy: "Armenian", az: "Azerbaijani", kk: "Kazakh", uz: "Uzbek", mn: "Mongolian"
};

const MANUAL_REGION_NAMES = {
  US: "United States", GB: "United Kingdom", CA: "Canada", AU: "Australia",
  NZ: "New Zealand", IE: "Ireland", ZA: "South Africa", IN: "India",
  ES: "Spain", MX: "Mexico", AR: "Argentina", CO: "Colombia", CL: "Chile",
  PE: "Peru", VE: "Venezuela", FR: "France", BE: "Belgium", CH: "Switzerland",
  DE: "Germany", AT: "Austria", IT: "Italy", PT: "Portugal", BR: "Brazil",
  NL: "Netherlands", SE: "Sweden", DK: "Denmark", NO: "Norway", FI: "Finland",
  PL: "Poland", RU: "Russia", UA: "Ukraine", CZ: "Czechia", GR: "Greece",
  TR: "Turkey", CN: "China", TW: "Taiwan", HK: "Hong Kong", JP: "Japan",
  KR: "South Korea", TH: "Thailand", VN: "Vietnam", ID: "Indonesia",
  MY: "Malaysia", PH: "Philippines", SA: "Saudi Arabia", EG: "Egypt",
  IL: "Israel", AE: "United Arab Emirates", SG: "Singapore"
};

function getLanguageLabel(lang) {
  const normalized = (lang || "").replace("_", "-");
  const parts = normalized.split("-");
  const languageCode = (parts[0] || "").toLowerCase();
  const regionCode = parts[1] ? parts[1].toUpperCase() : "";

  let languageName = MANUAL_LANGUAGE_NAMES[languageCode] || "";
  let regionName = regionCode ? (MANUAL_REGION_NAMES[regionCode] || "") : "";

  // Fill in anything the manual table missed using Intl.DisplayNames,
  // where available. Each half is tried independently so a missing
  // region name (or an unsupported browser) never blanks out a
  // language name we already found manually, or vice versa.
  if (!languageName) {
    try {
      const languageNames = new Intl.DisplayNames([navigator.language || "en"], { type: "language" });
      languageName = languageNames.of(languageCode) || "";
    } catch { /* Intl.DisplayNames unsupported here — manual table is all we get */ }
  }
  if (regionCode && !regionName) {
    try {
      const regionNames = new Intl.DisplayNames([navigator.language || "en"], { type: "region" });
      regionName = regionNames.of(regionCode) || "";
    } catch { /* fine — just show the language name without a region */ }
  }

  if (!languageName) return lang; // truly unrecognized code — show it raw as a last resort

  return regionName ? `${languageName} (${regionName})` : languageName;
}

function updateLanguageDropdowns() {
  const table = document.getElementById("sheet");
  if (!table) return;

  const selectorRow = table.rows[1];
  if (!selectorRow) return;

  const langs = getBrowserLanguages();

  // Do not wipe existing dropdowns before voices are loaded
  if (!langs.length) return;

  for (let c = 1; c < selectorRow.cells.length; c++) {
    const select = selectorRow.cells[c]?.querySelector("select");
    if (!select) continue;

    const currentValue = select.value || "Off";

    select.innerHTML = "";

    const offOption = document.createElement("option");
    offOption.value = "Off";
    offOption.textContent = "Off";
    select.appendChild(offOption);

    langs.forEach(lang => {
      const option = document.createElement("option");
      option.value = lang;
      option.textContent = getLanguageLabel(lang);
      select.appendChild(option);
    });

    // Preserve current selection if possible
    if (currentValue === "Off") {
      select.value = "Off";
      continue;
    }

    const mappedCurrent = LEGACY_LANG_MAP[currentValue] || currentValue;
    const normalizedCurrent = normalizeLang(mappedCurrent);
    const currentBase = normalizedCurrent?.split("-")[0];

    const exactMatch = langs.find(l => normalizeLang(l) === normalizedCurrent);
    const baseMatch = langs.find(l => normalizeLang(l).split("-")[0] === currentBase);

    select.value = exactMatch || baseMatch || "Off";
  }
}














// ===============================
// PAPERCLIP & MEDIA ATTACHMENT
// ===============================

// ===============================
// PAPERCLIP & MEDIA ATTACHMENT (MULTI-FILE SUPPORT)
// ===============================

document.body.insertAdjacentHTML('beforeend', `
  <input type="file" id="cellFileInput" accept="image/jpeg, image/jpg, image/png, image/gif, image/webp, audio/mp3, audio/mpeg, audio/webm, audio/wav, audio/ogg, video/webm, video/mp4" style="display:none">
  <button id="floatingClip" contenteditable="false" title="Attach Media">📎</button>
  <button id="floatingMic" contenteditable="false" title="Record Audio">🎤</button>
  <div id="mediaPopup"></div>
`);

const floatingClip = document.getElementById("floatingClip");
const floatingMic = document.getElementById("floatingMic");
const fileInput = document.getElementById("cellFileInput");
const sheetWrap = document.getElementById("sheetWrap");
let activeCell = null;

// Show paperclip + mic when cell is focused
document.getElementById("sheet").addEventListener("focusin", (e) => {
    if (e.target.tagName === "TD") {
        activeCell = e.target;
        const rect = activeCell.getBoundingClientRect();
        floatingClip.style.display = "block";
        floatingClip.style.top = (window.scrollY + rect.top + 4) + "px";
        floatingClip.style.left = (window.scrollX + rect.right - 28) + "px";

        // Don't yank the mic icon away from the cell that's actively recording
        if (!cellMicRecording) {
            floatingMic.style.display = "block";
            floatingMic.style.top = (window.scrollY + rect.top + 4) + "px";
            floatingMic.style.left = (window.scrollX + rect.right - 56) + "px";
        }
    }
});

// Hide paperclip/mic on scroll/click outside (but never hide the mic mid-recording)
sheetWrap.addEventListener("scroll", () => {
    floatingClip.style.display = "none";
    if (!cellMicRecording) floatingMic.style.display = "none";
});
document.addEventListener("mousedown", (e) => {
    if (e.target !== floatingClip && e.target !== floatingMic && e.target.tagName !== "TD") {
        floatingClip.style.display = "none";
        if (!cellMicRecording) floatingMic.style.display = "none";
    }
});

// ===============================
// PER-CELL MIC RECORDING
// Records straight from the cell's own hover/tap icon.
// On Stop: saves a copy to the device (same as the big Record
// button already does) AND attaches it to the cell using the
// exact same mediaUrls/mediaTypes system the paperclip uses,
// so Start Reading fires it automatically when it passes over
// that cell — no extra step needed.
// ===============================
let cellMicRecorder = null;
let cellMicChunks = [];
let cellMicStream = null;
let cellMicRecording = false;
let cellMicTargetCell = null;

floatingMic.addEventListener("mousedown", async (e) => {
    e.preventDefault();

    if (!cellMicRecording) {
        if (!activeCell) return;
        cellMicTargetCell = activeCell;

        try {
            cellMicStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (err) {
            alert("❌ Microphone access failed: " + err.message);
            return;
        }

        const options = { mimeType: 'audio/webm;codecs=opus' };
        const supported = MediaRecorder.isTypeSupported(options.mimeType);
        cellMicRecorder = new MediaRecorder(cellMicStream, supported ? options : {});
        cellMicChunks = [];

        cellMicRecorder.ondataavailable = (ev) => {
            if (ev.data && ev.data.size > 0) cellMicChunks.push(ev.data);
        };

        cellMicRecorder.onstop = () => {
            finishCellMicRecording();
        };

        cellMicRecorder.start();
        cellMicRecording = true;
        floatingMic.textContent = "⏹";
        floatingMic.classList.add("mic-recording");
        floatingMic.title = "Stop Recording";
    } else {
        cellMicRecorder.stop();
        cellMicRecording = false;
        floatingMic.textContent = "🎤";
        floatingMic.classList.remove("mic-recording");
        floatingMic.title = "Record Audio";
    }
});

function finishCellMicRecording() {
    if (cellMicStream) {
        cellMicStream.getTracks().forEach(t => t.stop());
        cellMicStream = null;
    }

    const cell = cellMicTargetCell;
    cellMicTargetCell = null;

    if (!cellMicChunks.length || !cell) {
        cellMicChunks = [];
        floatingMic.style.display = "none";
        return;
    }

    const actualMimeType = cellMicChunks[0].type || 'audio/webm';
    const extension = actualMimeType.includes('ogg') ? 'ogg' : 'webm';
    const audioBlob = new Blob(cellMicChunks, { type: actualMimeType });
    cellMicChunks = [];

    // 1. Save a copy straight to the user's device
    const downloadUrl = URL.createObjectURL(audioBlob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `cell_recording_${getTimestamp()}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);

    // 2. Attach it to the cell (same mechanism as the paperclip)
    let mediaUrls = [];
    let mediaTypes = [];
    if (cell.dataset.mediaUrls) {
        try {
            mediaUrls = JSON.parse(cell.dataset.mediaUrls);
            mediaTypes = JSON.parse(cell.dataset.mediaTypes);
        } catch (err) {
            mediaUrls = [];
            mediaTypes = [];
        }
    }

    const attachUrl = URL.createObjectURL(audioBlob);
    mediaUrls.push(attachUrl);
    mediaTypes.push(actualMimeType);

    cell.dataset.mediaUrls = JSON.stringify(mediaUrls);
    cell.dataset.mediaTypes = JSON.stringify(mediaTypes);

    if (!cell.innerHTML.includes("🎵")) {
        cell.appendChild(document.createTextNode(" 🎵"));
    }

    floatingMic.style.display = "none";
}

// Trigger file upload
floatingClip.addEventListener("mousedown", (e) => {
    e.preventDefault();
    if (activeCell) fileInput.click();
});

// Handle file attachment (SUPER RELIABLE EMOJI FIX)
fileInput.addEventListener("change", async function(e) {
    const file = e.target.files[0];
    if (!file || !activeCell) return;
    const cellForThisFile = activeCell; // capture now, in case focus moves before this finishes

    // SAVE-TABLE RELIABILITY FIX: read the picked file into memory and
    // rebuild it as a plain Blob right now, immediately after picking.
    // On many phones (especially iOS picking from Files/Photos), the
    // File object handed back by <input type="file"> is backed by a
    // short-lived OS-level resource — it plays fine immediately, but if
    // you go on to attach several more files to other cells before
    // finally clicking Save Table, that original reference can go stale
    // by the time Save Table re-fetches it to encode it. A plain
    // in-memory Blob (built from bytes we already grabbed) has no such
    // expiry — which is exactly why mic recordings never had this
    // problem: they were already pure in-memory Blobs from the start.
    let safeBlob;
    try {
        const buffer = await file.arrayBuffer();
        safeBlob = new Blob([buffer], { type: file.type || "application/octet-stream" });
    } catch (err) {
        console.error("Could not read attached file into memory, using original reference:", err);
        safeBlob = file;
    }

    // Get existing attachments
    let mediaUrls = [];
    let mediaTypes = [];
    
    if (cellForThisFile.dataset.mediaUrls) {
        try {
            mediaUrls = JSON.parse(cellForThisFile.dataset.mediaUrls);
            mediaTypes = JSON.parse(cellForThisFile.dataset.mediaTypes);
        } catch(e) {
            mediaUrls = [];
            mediaTypes = [];
        }
    }

    // Add new file
    const fileUrl = URL.createObjectURL(safeBlob);
    mediaUrls.push(fileUrl);
    mediaTypes.push(safeBlob.type || file.type);

    // Save arrays to dataset
    cellForThisFile.dataset.mediaUrls = JSON.stringify(mediaUrls);
    cellForThisFile.dataset.mediaTypes = JSON.stringify(mediaTypes);

    // ==== EMOJI FIX: Works 100% of the time ====
    const emojiMap = {
        'image': '🖼️',
        'audio': '🎵',
        'video': '🎥'
    };
    
    // Get file extension (SUPER RELIABLE)
    const ext = file.name.split('.').pop().toLowerCase();
    let typePrefix = file.type.split('/')[0];
    
    // If MIME type is missing or unknown, use extension
    if (!emojiMap[typePrefix]) {
        if (['mp3', 'wav', 'webm', 'ogg', 'ogx', 'm4a', 'aac', 'flac'].includes(ext)) {
            typePrefix = 'audio';
        } else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
            typePrefix = 'image';
        } else if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) {
            typePrefix = 'video';
        }
    }
    
    // FORCE ADD EMOJI if not present — always on the cell this file was
    // actually attached to, not whatever cell happens to be focused now
    // (the user may have already clicked into another cell while this
    // file was being read into memory above).
    const emoji = emojiMap[typePrefix];
    if (emoji && !cellForThisFile.innerHTML.includes(emoji)) {
        cellForThisFile.appendChild(document.createTextNode(` ${emoji}`));
    }
    
    this.value = ""; 
    floatingClip.style.display = "none"; 
    if (activeCell === cellForThisFile) placeCaretAtEnd(activeCell);
});



// ===============================
// SPEAK FUNCTION
// ===============================
function speak(text, lang, rate,cell) {
  return new Promise(resolve => {
    if (!text || !text.trim()) return resolve();

    const utter = new SpeechSynthesisUtterance(text);
    const voice = getVoice(lang);

    if (voice) {
      utter.voice = voice;
      utter.lang = voice.lang;
    } else if (lang && lang !== "Off") {
      utter.lang = LEGACY_LANG_MAP[lang] || lang;
    }

 utter.rate = rate || 1;
utter.pitch = 1.05;
    
 utter.onend = function() {
      // Heatmap counting now happens the instant the cell is
      // highlighted/starts playing (see startReading), not here —
      // this just resolves the speech promise.
      resolve();
    };

    utter.onerror = resolve;

    speechSynthesis.speak(utter);
  });
}



// ===============================
// UI HELPERS
// ===============================
// ===============================
// UI HELPERS
// ===============================
function clearHighlight() {
  document.querySelectorAll(".reading").forEach(c => c.classList.remove("reading"));
}

window.currentMediaElement = null; // Global tracker for audio/video playback

function stopReading() {
  isReading = false;
  speechSynthesis.cancel();
  
  // Stop ALL media elements (plural!)
  if (window.currentMediaElements) {
    window.currentMediaElements.forEach(el => {
        try { el.pause(); } catch(e) {}
    });
    window.currentMediaElements = null;
  }
  
  const popup = document.getElementById("mediaPopup");
  if (popup) popup.innerHTML = "";
  window._pendingRowAudios = [];

  clearHighlight();
}

// ===============================
// CELL BUBBLE HELPERS (media + written content)
// ===============================
// True when the Overlap dial is on (>0s) — this is what turns on the
// "multiple bubbles can be on screen, stacked left-to-right" behavior.
function isOverlapModeOn() {
  const v = parseFloat(document.getElementById("overlapDelay")?.value || "0");
  return v > 0;
}

function getCellCleanText(cell) {
  const raw = cell?.innerText || "";
  return raw.replace(/[🖼️🎵🎥]/g, "").trim();
}

// Builds and shows one bubble (media on top, written content underneath,
// same look/position as the existing media popup). When overlap is off,
// this replaces whatever bubble is currently showing (original behavior).
// When overlap is on, up to 2 bubbles can be visible at once; the oldest
// is dropped to make room and the newest bubble stacks to the right.
function presentCellBubble(cell, { images = [], videos = [], text = "" } = {}) {
  const container = document.getElementById("mediaPopup");
  if (!container) return null;
  if (!images.length && !videos.length && !text) return null;

  if (!isOverlapModeOn()) {
    container.innerHTML = "";
  } else {
    while (container.children.length >= 2) {
      container.removeChild(container.firstElementChild);
    }
  }

  const group = document.createElement("div");
  group.className = "bubbleGroup";

  const mediaBox = document.createElement("div");
  mediaBox.className = "mediaBox";
  if (!images.length && !videos.length) mediaBox.style.display = "none"; // shown once audio is added
  images.forEach(url => {
    const img = document.createElement("img");
    img.src = url;
    mediaBox.appendChild(img);
  });
  videos.forEach(url => {
    const video = document.createElement("video");
    video.src = url;
    video.controls = true;
    mediaBox.appendChild(video);
  });
  group.appendChild(mediaBox);

  if (text) {
    const textBubble = document.createElement("div");
    textBubble.className = "textBubble";
    textBubble.textContent = text;
    group.appendChild(textBubble);
  }

  container.appendChild(group);
  requestAnimationFrame(() => group.classList.add("bubbleShow"));

  return { group, mediaBox };
}

function removeBubbleGroup(group) {
  if (!group || !group.parentNode) return;
  group.classList.remove("bubbleShow");
  setTimeout(() => {
    if (group.parentNode) group.parentNode.removeChild(group);
  }, 300);
}

// ===============================
// MEDIA PLAYER
// ===============================
// ===============================
// MEDIA PLAYER (MULTI-FILE + NO FREEZE)
// ===============================

// overlapMs: if falsy, behaves EXACTLY like before (fully waits for
// every audio in the cell to finish — original one-at-a-time behavior).
// If a positive number, the LAST audio file in this cell will resolve
// early after overlapMs milliseconds (or when it actually finishes,
// whichever comes first) INSTEAD of waiting for it to fully end. The
// audio itself is NOT stopped — it keeps playing in the background,
// which is what creates the overlap with whatever plays next.
function playCellMedia(cell, overlapMs) {
  return new Promise(async (resolve) => {
    let mediaUrls = [];
    let mediaTypes = [];

    try {
      mediaUrls = cell.dataset.mediaUrls ? JSON.parse(cell.dataset.mediaUrls) : [];
      mediaTypes = cell.dataset.mediaTypes ? JSON.parse(cell.dataset.mediaTypes) : [];
    } catch (e) {
      console.error("Bad media data:", e);
      return resolve({ hasAudio: false, hasImage: false, bubbleGroup: null });
    }

    const images = [];
    const audios = [];
    const videos = [];

    mediaUrls.forEach((url, i) => {
      const type = mediaTypes[i] || "";

      if (isImageType(type)) {
        images.push(url);
      } else if (isAudioType(type)) {
        audios.push(url);
      } else if (isVideoType(type)) {
        videos.push(url);
      } else {
        // If unknown, try treating it as audio
        audios.push(url);
      }
    });

    // Show the bubble (media on top, written cell content underneath).
    // This happens even for cells with no media, so plain text also
    // pops up in a bubble the same way media does.
    const bubble = presentCellBubble(cell, { images, videos, text: getCellCleanText(cell) });

    if (!mediaUrls.length) {
      // Text-only (or empty) cell: hand the bubble off to the caller
      // (the reading engine) so it stays up for the duration of speech.
      return resolve({ hasAudio: false, hasImage: false, bubbleGroup: bubble ? bubble.group : null });
    }

    // If only image/video but no audio, do not block long
    if (!audios.length) {
      setTimeout(() => {
        if (bubble) removeBubbleGroup(bubble.group);
        resolve({
          hasAudio: false,
          hasImage: images.length > 0,
          bubbleGroup: null
        });
      }, 300);

      return;
    }

    // Accumulate into the shared, page-level list rather than
    // replacing it, so that when overlap is active, audio elements
    // from more than one cell can be tracked (and stopped by
    // stopReading) at the same time.
    if (!window.currentMediaElements) window.currentMediaElements = [];

    // Play audio files one by one WITHIN this cell (unchanged).
    // Only the LAST audio in the cell is eligible for the
    // early-resolve/overlap behavior, since overlap is meant to
    // control the transition to the NEXT cell, not audios within
    // the same cell.
    for (let i = 0; i < audios.length; i++) {
      if (!isReading) break;

      const url = audios[i];
      const isLastAudioInCell = i === audios.length - 1;

      const audio = document.createElement("audio");
      audio.src = url;
      audio.controls = true;
      audio.preload = "auto";

      if (bubble) {
        bubble.mediaBox.style.display = "";
        bubble.mediaBox.appendChild(audio);
        // Only the last audio owns bubble cleanup, so earlier per-file
        // audios in a multi-file cell don't remove the bubble early.
        if (isLastAudioInCell) audio._bubbleGroup = bubble.group;
      }

      window.currentMediaElements.push(audio);

      if (overlapMs && isLastAudioInCell) {
        // Early-resolve: don't block the reader waiting for this
        // audio to finish. It keeps playing in the background — but
        // track its TRUE completion so the reading engine can still
        // wait for it before repeating/advancing past this row.
        const p = playAndWaitForAudio(audio, overlapMs);
        window._pendingRowAudios.push(p.trueCompletion);
        await p;
      } else {
        // Original behavior: wait for full completion.
        await playAndWaitForAudio(audio);
      }
    }

    resolve({
      hasAudio: true,
      hasImage: images.length > 0,
      bubbleGroup: null
    });
  });
}


// True-completion tracking for row-boundary waits: when overlap lets a
// row move on while a cell's audio keeps playing in the background, we
// still need to know when that audio ACTUALLY finishes so the reading
// engine can pause before repeating/advancing past that row. Each entry
// is a Promise that resolves once the corresponding audio truly ends
// (onended/onerror/onabort/timeout) — never on the early overlap resolve.
window._pendingRowAudios = window._pendingRowAudios || [];

// overlapMs (optional): if provided, this promise resolves after
// overlapMs milliseconds even if the audio is still playing, so the
// caller (the reading engine) can move on to the next cell while
// this audio keeps going in the background. The audio is NEVER
// paused/stopped by this early resolve — it plays out naturally and
// still fires its own onended (still increments listen count, still
// gets removed from window.currentMediaElements) whenever it
// actually finishes.
function playAndWaitForAudio(audio, overlapMs) {
  let markTrueDone;
  const trueCompletion = new Promise(res => { markTrueDone = res; });

  const outer = new Promise((resolve) => {
    let finished = false;      // guards the OUTER promise (this call)
    let overlapTimer = null;

    function removeFromTracking() {
      if (window.currentMediaElements) {
        const idx = window.currentMediaElements.indexOf(audio);
        if (idx !== -1) window.currentMediaElements.splice(idx, 1);
      }
    }

    // Resolves the promise this call returned. Does NOT touch the
    // audio element itself — that keeps playing regardless.
    function resolveOnce() {
      if (finished) return;
      finished = true;
      clearTimeout(overlapTimer);
      resolve();
    }

    function done() {
      clearTimeout(timeout);
      audio.onended = null;
      audio.onerror = null;
      audio.onabort = null;
      removeFromTracking();
      // Only the last audio in a cell is tagged with its bubble, so this
      // only fires bubble removal once the cell's audio truly finishes
      // (even if the reading loop already moved on via overlap).
      if (audio._bubbleGroup) removeBubbleGroup(audio._bubbleGroup);
      resolveOnce();
      markTrueDone(); // audio has ACTUALLY finished now
    }

    audio.onended = function() {
      // Heatmap counting now happens the instant the cell is
      // highlighted/starts playing (see startReading), not here.
      // (This used to increment window._currentCellForAudio, a single
      // shared global — which is exactly what caused counts to land on
      // the wrong cell whenever Overlap let more than one cell's audio
      // be in flight at once.)
      done();
    };
    audio.onerror = done;
    audio.onabort = done;

    // Safety timeout so app cannot freeze forever
    const timeout = setTimeout(() => {
      console.warn("Audio timeout, moving to next cell");
      try {
        audio.pause();
      } catch (e) {}
      done();
    }, 120000);

    // OVERLAP: resolve early after overlapMs, but leave the audio
    // element playing (and its onended/tracking-cleanup listeners
    // intact) so it finishes naturally in the background.
    if (overlapMs && overlapMs > 0) {
      overlapTimer = setTimeout(() => {
        resolveOnce();
      }, overlapMs);
    }

    audio.play().catch(err => {
      console.error("Audio autoplay failed:", err);

      const mediaBox = audio.parentElement;
      if (mediaBox) {
        const warning = document.createElement("div");
        warning.style.cssText =
          "background:#fff3cd;color:#856404;padding:6px;margin:4px 0;border-radius:4px;font-size:13px;";
        warning.textContent =
          "Audio was blocked by browser. Click play. Reader will wait until it finishes.";
        mediaBox.prepend(warning);
      }

      // DO NOT resolve here.
      // This is important.
      // If autoplay is blocked, user can click play manually,
      // and the reader will still wait for audio.onended.
    });
  });

  outer.trueCompletion = trueCompletion;
  return outer;
}

function isImageType(type) {
  return type.startsWith("image");
}

function isAudioType(type) {
  return (
    type.startsWith("audio") ||
    type.includes("ogg") ||
    type.includes("mp3") ||
    type.includes("mpeg") ||
    type.includes("wav") ||
    type.includes("webm")
  );
}

function isVideoType(type) {
  return (
    type.startsWith("video") ||
    type.includes("mp4") ||
    type.includes("mov")
  );
}
// ===============================
// MAIN READING ENGINE
// ===============================
// ===============================
// MAIN READING ENGINE
// ===============================
async function startReading() {
  if (isReading) return;
  isReading = true;
  // Fresh tracking list for this run (overlap mode can have more than
  // one cell's audio playing at once, so this is an accumulating list,
  // not a single "current" element).
  window.currentMediaElements = [];
  window._pendingRowAudios = [];

  const table = document.getElementById("sheet");
  if (!table) {
    console.error("Table not found");
    isReading = false;
    return;
  }

  const getSpeed = () => parseFloat(document.getElementById("speed")?.value || "1");
  // Overlap dial is in SECONDS (0 = off / original behavior).
  const getOverlapMs = () => {
    const v = parseFloat(document.getElementById("overlapDelay")?.value || "0");
    return v > 0 ? Math.round(v * 1000) : 0;
  };
  const repeatRow = parseInt(document.getElementById("repeatRow")?.value || "1");
  const repeatTable = parseInt(document.getElementById("repeatTable")?.value || "1");
  const repeatCell = parseInt(document.getElementById("repeatCell")?.value || "1");

  const start = parseCell(document.getElementById("startCell")?.value) || { row: 1, col: 0 };

  // If End Cell is left blank, default to the sheet's ACTUAL current
  // last row — not a hardcoded "26". This is the real reason reading
  // (and re-reading after an Upload or Auto Vocab Builder run) kept
  // stopping at row 26/27 even on much bigger tables: the fallback used
  // to be a fixed number instead of following the real sheet size.
  const currentDataRowsAtStart = table.rows.length - 2; // minus header + language rows
  const end = parseCell(document.getElementById("endCell")?.value) ||
    { row: currentDataRowsAtStart, col: 25 };

  const reverse = document.getElementById("reverse")?.checked;

  // AUTO-EXPAND: if the requested range (e.g. typing "A27" as Start/End
  // Cell) reaches past rows that actually exist yet, grow the sheet to
  // cover it first. Without this, table.rows[r+1] comes back empty for
  // any row past whatever currently exists and the reader silently
  // skips it — which is exactly why it looked like it "stopped at 26"
  // and refused to start anywhere beyond that.
  const neededDataRows = Math.max(start.row, end.row);
  const currentDataRows = table.rows.length - 2; // minus header + language rows
  if (neededDataRows > currentDataRows && typeof addNewRows === "function") {
    addNewRows(neededDataRows - currentDataRows);
  }

  let rowRange = [];
  let colRange = [];

  for (let r = start.row; r <= end.row; r++) rowRange.push(r);
  for (let c = start.col; c <= end.col; c++) colRange.push(c);

  if (reverse) {
    rowRange.reverse();
    colRange.reverse();
  }

  try {
    for (let rt = 0; rt < repeatTable; rt++) {
      if (!isReading) return;

      for (let r of rowRange) {
        if (!isReading) return;

        const row = table.rows[r + 1];
        if (!row) continue;

        for (let rr = 0; rr < repeatRow; rr++) {
          if (!isReading) return;

          for (let colIdx = 0; colIdx < colRange.length; colIdx++) {
            if (!isReading) return;

            const c = colRange[colIdx];
            // Overlap only ever applies BETWEEN two adjacent cells in
            // this same row — so the last cell in the row range has
            // nothing after it to overlap with, and always waits fully.
            const isLastColInRow = colIdx === colRange.length - 1;

            const cell = row.cells[c + 1];
            if (!cell) continue;

            const rawText = cell.innerText || "";
            const cleanText = rawText.replace(/[🖼️🎵🎥]/g, "").trim();

            const selector = table.rows[1]?.cells[c + 1]?.querySelector("select");
            const lang = selector?.value || "Off";

            let hasMedia = false;
            try {
              hasMedia =
                cell.dataset.mediaUrls &&
                JSON.parse(cell.dataset.mediaUrls).length > 0;
            } catch (e) {
              hasMedia = false;
            }

            /*
              IMPORTANT LOGIC:

              - If cell has media, allow it even if language is Off.
              - If cell has no media and language is Off, skip it.
              - If cell has no text and no media, skip it.
            */
            if (lang === "Off" || (!hasMedia && !cleanText)) {
            continue;
            }

            for (let rc = 0; rc < repeatCell; rc++) {
              if (!isReading) return;

              cell.classList.add("reading");

              // HEATMAP: count the cell the instant it's highlighted and
              // begins playing — not when its audio/speech finishes. This
              // is what the heatmap should have always keyed off of: a
              // synchronous, per-cell increment tied directly to the cell
              // that's actually being read right now. Doing it here (and
              // ONLY here) means the count can never be misattributed to
              // whatever cell happens to be playing later when Overlap is
              // on, and every cell that gets read — including a single
              // Column A / Column B pass — is guaranteed to register.
              incrementCellListenCount(cell);

              // Only the FINAL repeat of THIS cell, when it is NOT the
              // last column in the row, is eligible to overlap into the
              // next cell. Earlier repeatCell passes of the same cell
              // always wait fully (repeating a cell into itself would
              // just be it overlapping with itself, which isn't the
              // point of this feature) — this keeps Repeat Cell, Repeat
              // Row, and Repeat Table Loop completely unaffected.
              const isFinalRepeatOfCell = rc === repeatCell - 1;
              const overlapMs =
                !isLastColInRow && isFinalRepeatOfCell ? getOverlapMs() : 0;

              // 1. Play media and WAIT until audio finishes (or, if
              // overlap is active for this transition, wait only the
              // configured overlap delay while the audio keeps playing).
              const mediaResult = await playCellMedia(cell, overlapMs);

              if (!isReading) return;

              // 2. Only read text if:
              // - no audio was played
              // - language is not Off
              // - text exists
              if (!mediaResult.hasAudio && lang !== "Off" && cleanText) {
                await speak(cleanText, lang, getSpeed(), cell);
              }

              // Text-only cells (no media) hand their bubble back to us
              // via bubbleGroup — remove it now that this cell's turn is done.
              if (mediaResult.bubbleGroup) removeBubbleGroup(mediaResult.bubbleGroup);

              cell.classList.remove("reading");
            }
          }

          // Row pass finished. If overlap let the last audio-bearing
          // cell in this row keep playing in the background, wait for
          // it to ACTUALLY finish before repeating this row again or
          // moving on to the next row — so a row is never cut off or
          // repeated over top of its own still-playing audio.
          if (window._pendingRowAudios.length) {
            const pending = window._pendingRowAudios;
            window._pendingRowAudios = [];
            await Promise.all(pending);
          }
        }
      }
    }
  } finally {
    isReading = false;
    clearHighlight();

    const popup = document.getElementById("mediaPopup");
    if (popup) popup.innerHTML = "";
    window._pendingRowAudios = [];
  }
}











// ===============================
// EXPORT & SAVE (harmonised)
// ===============================



function getTimestamp() {
  const d = new Date();
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

// ===============================
// READER OPTIONS — save/restore
// (Speed, Overlap Delay, Repeats, Start/End Cell, Reverse Order)
// ===============================
function exportReaderOptions() {
    const get = (id) => document.getElementById(id);
    return {
        speed: get("speed")?.value,
        overlapDelay: get("overlapDelay")?.value,
        repeatRow: get("repeatRow")?.value,
        repeatTable: get("repeatTable")?.value,
        repeatCell: get("repeatCell")?.value,
        startCell: get("startCell")?.value,
        endCell: get("endCell")?.value,
        reverse: get("reverse")?.checked
    };
}

function restoreReaderOptions(opts) {
    if (!opts) return;
    const set = (id, value) => {
        const el = document.getElementById(id);
        if (el && value !== undefined && value !== null) el.value = value;
    };

    set("speed", opts.speed);
    set("overlapDelay", opts.overlapDelay);
    set("repeatRow", opts.repeatRow);
    set("repeatTable", opts.repeatTable);
    set("repeatCell", opts.repeatCell);
    set("startCell", opts.startCell);
    set("endCell", opts.endCell);

    const reverseEl = document.getElementById("reverse");
    if (reverseEl && typeof opts.reverse === "boolean") reverseEl.checked = opts.reverse;

    // The Overlap Delay slider has its own live label (e.g. "1.5s overlap")
    // that only updates on the slider's "input" event — fire it manually
    // so the label matches the restored value instead of showing "0.0s (off)".
    const overlapEl = document.getElementById("overlapDelay");
    if (overlapEl) overlapEl.dispatchEvent(new Event("input"));
}

// ===============================
// EXPORT & SAVE (with Media)
// ===============================
async function exportTableData() { // <-- Now async
    const table = document.getElementById("sheet");
    if (!table) return null;

    const dataRows = table.rows.length - 2;
    const colCount = 26;
    const cells = [];
    const languages = [];
    const media = {}; // NEW: Stores media data

    // Get language settings
    const selectorRow = table.rows[1];
    for (let c = 0; c < colCount; c++) {
        const cell = selectorRow?.cells[c + 1];
        const select = cell?.querySelector("select");
        languages.push(select?.value || "Off");
    }

    // Process cells and media
    // NOTE: this whole per-row body is wrapped in try/catch so that a
    // problem with ONE row (e.g. a broken media reference) can never
    // abort the export and silently truncate every row after it — the
    // row's text is always preserved even if that row's media fails.
    for (let r = 2; r < table.rows.length; r++) {
        const row = table.rows[r];
        const rowData = [];
        try {
            for (let c = 1; c <= colCount; c++) {
                const cell = row.cells[c];
                const text = cell?.innerText?.trim() || "";
                rowData.push(text);

                // Save media if present
                if (cell?.dataset.mediaUrls && cell?.dataset.mediaTypes) {
                    try {
                        const urls = JSON.parse(cell.dataset.mediaUrls);
                        const types = JSON.parse(cell.dataset.mediaTypes);
                        if (urls.length > 0) {
                            const cellKey = `${r-2}-${c-1}`; // Use 0-based indices
                            media[cellKey] = { urls: [], types: types };

                            // Convert each media file to Base64
                            for (let i = 0; i < urls.length; i++) {
                                const response = await fetch(urls[i]);
                                const blob = await response.blob();
                                const base64 = await blobToBase64(blob);
                                media[cellKey].urls.push(base64);
                            }
                        }
                    } catch (err) {
                        console.error("Media export failed for cell", r, c, err);
                    }
                }
            }
        } catch (err) {
            console.error("Row export failed for row", r, err);
        }
        cells.push(rowData);
    }

    return {
        createdAt: new Date().toISOString(),
        columns: colCount,
        rows: dataRows,
        cells,
        languages,
               media, // <-- NEW
        readerOptions: exportReaderOptions(), // NEW: Speed, Start/End Cell, Repeats, etc.
        practiceData: exportPracticeData() // ADD THIS LINE
    };
}

function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function openSaveDialog(defaultName, onConfirm) {
  const overlay = document.createElement("div");
  overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:9999;";
  const box = document.createElement("div");
  box.style.cssText = "background:#fff;padding:20px;border-radius:10px;width:320px;font-family:Arial;";
  box.innerHTML = `
    <h3 style="margin-top:0;">Save Table</h3>
    <input id="fileName" style="width:100%;padding:8px" value="${defaultName}">
    <div style="margin-top:12px;display:flex;justify-content:flex-end;gap:8px;">
      <button id="cancel">Cancel</button>
      <button id="save">Save</button>
    </div>`;
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  overlay.querySelector("#cancel").onclick = () => overlay.remove();
  overlay.querySelector("#save").onclick = () => {
    const name = overlay.querySelector("#fileName").value.trim();
    overlay.remove();
    onConfirm(name || defaultName);
  };
}

// ===============================
// SAVE TABLE (with Media + Custom Filename)
// ===============================
async function saveTable() {
    const defaultName = `language-table_${getTimestamp()}.json`;
    
    // First, ask for filename
    openSaveDialog(defaultName, async (finalName) => { // <-- Make callback async
        const data = await exportTableData();
        if (!data) return;

        // Warn if file is huge
        const jsonString = JSON.stringify(data, null, 2);
        const sizeMB = (new Blob([jsonString]).size / 1024 / 1024).toFixed(2);
        if (sizeMB > 10) {
            if (!confirm(`Warning: Save file is ${sizeMB}MB. Continue?`)) return;
        }

        downloadJSON(finalName.endsWith(".json") ? finalName : finalName + ".json", data);
    });
}
// ===============================
// UPLOAD TABLE (harmonised)
// ===============================
// ===============================
// UPLOAD TABLE (harmonised) - FIXED
// ===============================
// ===============================
// UPLOAD TABLE (with Media)
// ===============================
function uploadTable() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    input.onchange = function () {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async function (e) { // <-- Now async
            try {
                const data = JSON.parse(e.target.result);

                if (!data.cells || !data.languages) {
                    throw new Error("Missing 'cells' or 'languages'");
                }

                const table = document.getElementById("sheet");
                if (!table) throw new Error("Table not found");

                // Clear existing rows
                while (table.rows.length > 2) {
                    table.deleteRow(2);
                }

                // Restore languages
                const selectorRow = table.rows[1];
                for (let c = 0; c < data.languages.length; c++) {
                    const cell = selectorRow.cells[c + 1];
                    const select = cell?.querySelector("select");
                    if (select) select.value = data.languages[c];
                }

                // Rebuild cells and restore media
                for (let r = 0; r < data.cells.length; r++) {
                    const rowArray = data.cells[r];
                    const newRow = table.insertRow();
                    const numberCell = newRow.insertCell();
                    numberCell.textContent = newRow.rowIndex - 1;
                    numberCell.className = "row-number";

                    for (let c = 0; c < rowArray.length; c++) {
                        const td = newRow.insertCell();
                        td.textContent = rowArray[c] || "";
                        td.contentEditable = "true";
                      // ADD THESE LINES:
                      td.dataset.cellId = r + ":" + c; // Stable ID for save/load
                      td.dataset.listenCount = "0";    // Initialize listen count

                        // Restore media if exists.
                        // Wrapped in its own try/catch: a single corrupt/
                        // unreadable media entry must NOT abort the rest
                        // of the upload — otherwise every row after the
                        // bad cell silently never gets loaded, even
                        // though it looks like the file only had a
                        // handful of rows in it.
                        const cellKey = `${r}-${c}`;
                        if (data.media && data.media[cellKey]) {
                            try {
                                const mediaInfo = data.media[cellKey];
                                const urls = [];

                                // Convert Base64 back to blobs and URLs
                                for (let i = 0; i < mediaInfo.urls.length; i++) {
                                    const base64 = mediaInfo.urls[i];
                                    const blob = base64ToBlob(base64);
                                    const url = URL.createObjectURL(blob);
                                    urls.push(url);
                                }

                                td.dataset.mediaUrls = JSON.stringify(urls);
                                td.dataset.mediaTypes = JSON.stringify(mediaInfo.types);

                                // Restore emojis
                                const emojiMap = {
                                    'image': '🖼️',
                                    'audio': '🎵',
                                    'video': '🎥'
                                };
                                const uniqueTypes = [...new Set(mediaInfo.types)];
                                uniqueTypes.forEach(type => {
                                    const prefix = type.split('/')[0];
                                    const emoji = emojiMap[prefix];
                                    if (emoji && !td.innerHTML.includes(emoji)) {
                                        td.appendChild(document.createTextNode(` ${emoji}`));
                                    }
                                });
                            } catch (mediaErr) {
                                console.error("Media restore failed for cell", r, c, mediaErr);
                            }
                        }
                    }
                }
 if (data.practiceData) {
   try { restorePracticeData(data.practiceData); }
   catch (pErr) { console.error("Practice data restore failed:", pErr); }
 }

 if (data.readerOptions) {
   try { restoreReaderOptions(data.readerOptions); }
   catch (rErr) { console.error("Reader options restore failed:", rErr); }
 }

              // Keep the row-expansion counter in sync with what was
              // actually just loaded — otherwise Tab-expansion, Upload
              // Column, and the Auto Vocab Builder (which all rely on
              // this counter for numbering/expanding further rows) stay
              // stuck thinking the sheet only has its original row count.
              if (typeof totalRows !== "undefined") {
                totalRows = Math.max(totalRows, data.cells.length);
              }

              alert(`✅ Table uploaded successfully! (${data.cells.length} rows)`);

            } catch (err) {
                alert("Invalid JSON file: " + (err.message || ""));
            }
        };
        reader.readAsText(file);
    };

    input.click();
}











// ===============================
// UI TOGGLES
// ===============================
function toggleUpload() {
  const box = document.getElementById("uploadBox");
  if (!box) return;
  box.style.display = box.style.display === "block" ? "none" : "block";
}


function toggleExtract() {
  const box = document.getElementById("extractBox");
  if (!box) return;

  // Close upload if open (keeps UI clean)
  const uploadBox = document.getElementById("uploadBox");
  if (uploadBox) uploadBox.style.display = "none";

  box.style.display = box.style.display === "block" ? "none" : "block";
}


function toggleReader() {
  const bar = document.getElementById("toolbar");
  if (!bar) return;
  bar.style.display = bar.style.display === "flex" ? "none" : "flex";
} 




// ===============================
// UI TOGGLES
// ===============================

















// ===============================
// Upload
// ===============================

window.uploadColumn = function () {
  console.log("🚀 UPLOAD CLICKED!");

  const rawText = document.getElementById("columnData").value.trim();
  if (!rawText) {
    alert("Please paste some text.");
    return;
  }

  const startCellInput = document.getElementById("startCellUpload").value.trim().toUpperCase();
  const direction = document.getElementById("uploadDirection").value;

  let startCol = 0;   // Default = Column A
  let startRow = 0;   // Default = Row 1

  if (startCellInput) {
    const match = startCellInput.match(/^([A-Z]+)(\d+)$/);
    if (!match) {
      alert("Invalid cell format. Please use something like A1, B5, or C12");
      return;
    }
    startCol = match[1].charCodeAt(0) - 65;
    startRow = parseInt(match[2]) - 1;
  }

  const lines = rawText.split(/\r?\n/).map(x => x.trim()).filter(x => x !== "");

  // Auto-expand table if needed
  const neededRows = direction === "down" 
    ? startRow + lines.length 
    : startRow + 1;

  const currentRows = sheetTable.rows.length - 2;
  if (neededRows > currentRows) {
    addNewRows(neededRows - currentRows);
  }

  // Fill the cells
  for (let i = 0; i < lines.length; i++) {
    let rowIndex = startRow;
    let colIndex = startCol;

    if (direction === "down") {
      rowIndex += i;
    } else {
      colIndex += i;
    }

    const row = sheetTable.rows[rowIndex + 2];
    if (!row) continue;
    const cell = row.cells[colIndex + 1];
    if (!cell) continue;

    cell.innerText = lines[i];
  }

  alert(`✅ Successfully uploaded ${lines.length} item${lines.length === 1 ? '' : 's'}!`);

  // Optional: clear the input after successful upload
  // document.getElementById("columnData").value = "";
};



// ===============================
// EXTRACT RANGE
// ===============================
function extractRange(mode) {
  const table = document.getElementById("sheet");
  if (!table) {
    alert("Table not found.");
    return;
  }

  const startRef = document.getElementById("extractStart").value.trim().toUpperCase();
  const endRef   = document.getElementById("extractEnd").value.trim().toUpperCase();

  const start = parseCell(startRef);
  const end   = parseCell(endRef);

  if (!start || !end) {
    alert("Invalid cell format. Use format like A1 or C5.");
    return;
  }

  // Normalize selection (handles reversed input)
  const startRow = Math.min(start.row, end.row);
  const endRow   = Math.max(start.row, end.row);
  const startCol = Math.min(start.col, end.col);
  const endCol   = Math.max(start.col, end.col);

  let extracted = [];

  for (let r = startRow; r <= endRow; r++) {
    const tableRow = table.rows[r + 1]; // +1 offset (header row)
    if (!tableRow) continue;

    let rowData = [];

    for (let c = startCol; c <= endCol; c++) {
      const cell = tableRow.cells[c + 1]; // +1 skip row number column
      if (!cell) continue;

      rowData.push(cell.innerText || "");

      if (mode === "remove") {
        cell.innerText = "";
      }
    }

    extracted.push(rowData.join("\t"));
  }

  if (mode === "copy") {
    const text = extracted.join("\n");

    navigator.clipboard.writeText(text).then(() => {
      alert("✅ Range copied!");
    }).catch(() => {
      alert("Clipboard blocked by browser.");
    });
  }

  if (mode === "remove") {
    alert("✅ Range cleared!");
  }
}


// ===============================================================
// SPECIAL EXTRACT / SPECIAL UPLOAD COLUMN
// -----------------------------------------------------------------
// Purpose: extractRange() above only copies plain text (clipboard),
// so it can't carry images/audio/video with it. These two features
// are a heavier-duty pair for moving big ranges — including their
// media (jpegs, audio clips, etc.) — OUT of one spreadsheet and INTO
// another one as a downloadable, re-uploadable .json file. This is
// what makes it possible to, e.g., generate a column of sales-report
// audio clips here, download just that column, then re-upload it into
// a fresh spreadsheet at whatever cell you choose.
//
// File format written/read (shared with audio-converter.js so files
// extracted on either page can be uploaded on either page):
// {
//   format: "special-range-v1",
//   createdAt, startCell, endCell, numRows, numCols,
//   cells: [ [ { text, media: [{type, data(base64)}] }, ... ], ... ]
// }
// ===============================================================

function toggleSpecialExtract() {
  const box = document.getElementById("specialExtractBox");
  if (!box) return;
  const other = document.getElementById("specialUploadBox");
  if (other) other.style.display = "none";
  box.style.display = box.style.display === "block" ? "none" : "block";
}

function toggleSpecialUpload() {
  const box = document.getElementById("specialUploadBox");
  if (!box) return;
  const other = document.getElementById("specialExtractBox");
  if (other) other.style.display = "none";
  box.style.display = box.style.display === "block" ? "none" : "block";
}

// Reads a range (text + media) off the sheet into the shared JSON shape.
// Kept separate from exportTableData() because that one dumps the WHOLE
// table; this only walks the requested rectangle, which is what makes
// it usable for grabbing e.g. just column B rows 1-500.
async function buildSpecialRangeData(table, startRow, endRow, startCol, endCol) {
  const cells = [];

  for (let r = startRow; r <= endRow; r++) {
    const tableRow = table.rows[r + 1]; // +1 header row offset (same as extractRange)
    const rowOut = [];

    for (let c = startCol; c <= endCol; c++) {
      const cell = tableRow ? tableRow.cells[c + 1] : null; // +1 row-number col
      const text = cell ? (cell.innerText || "").replace(/[🖼️🎵🎥]/g, "").trim() : "";
      const cellOut = { text, media: [] };

      if (cell?.dataset.mediaUrls && cell?.dataset.mediaTypes) {
        try {
          const urls = JSON.parse(cell.dataset.mediaUrls);
          const types = JSON.parse(cell.dataset.mediaTypes);
          for (let i = 0; i < urls.length; i++) {
            try {
              const response = await fetch(urls[i]);
              const blob = await response.blob();
              const data = await blobToBase64(blob);
              cellOut.media.push({ type: types[i] || blob.type || "", data });
            } catch (mediaErr) {
              console.error("Special extract: media read failed", r, c, mediaErr);
            }
          }
        } catch (err) {
          console.error("Special extract: media parse failed", r, c, err);
        }
      }

      rowOut.push(cellOut);
    }

    cells.push(rowOut);
  }

  return cells;
}

async function specialExtractColumn() {
  const table = document.getElementById("sheet");
  if (!table) { alert("Table not found."); return; }

  const startRef = document.getElementById("specialExtractStart")?.value.trim().toUpperCase();
  const endRef = document.getElementById("specialExtractEnd")?.value.trim().toUpperCase();

  const start = parseCell(startRef);
  const end = parseCell(endRef);
  if (!start || !end) {
    alert("Invalid cell format. Use format like A1 or C5.");
    return;
  }

  const startRow = Math.min(start.row, end.row);
  const endRow = Math.max(start.row, end.row);
  const startCol = Math.min(start.col, end.col);
  const endCol = Math.max(start.col, end.col);

  const statusEl = document.getElementById("specialExtractStatus");
  if (statusEl) statusEl.textContent = "Reading range + media…";

  let cells;
  try {
    cells = await buildSpecialRangeData(table, startRow, endRow, startCol, endCol);
  } catch (err) {
    console.error(err);
    if (statusEl) statusEl.textContent = "";
    alert("Extract failed: " + (err.message || err));
    return;
  }

  const data = {
    format: "special-range-v1",
    createdAt: new Date().toISOString(),
    startCell: startRef,
    endCell: endRef,
    numRows: endRow - startRow + 1,
    numCols: endCol - startCol + 1,
    cells
  };

  const jsonString = JSON.stringify(data);
  const sizeMB = (new Blob([jsonString]).size / 1024 / 1024).toFixed(2);
  if (sizeMB > 10 && !confirm(`This range (with media) is ${sizeMB}MB. Continue downloading?`)) {
    if (statusEl) statusEl.textContent = "";
    return;
  }

  downloadJSON(`special-extract_${startRef}-${endRef}_${getTimestamp()}.json`, data);
  if (statusEl) statusEl.textContent = `✅ Downloaded ${data.numRows}×${data.numCols} cells.`;
}

// Writes a previously-extracted special-range-v1 file into the sheet,
// anchored at whatever start cell the user picks, restoring media
// (base64 -> blob -> object URL) exactly like uploadTable() does for
// a full-table upload, just scoped to the pasted block's shape.
function specialUploadColumn() {
  const fileInput = document.getElementById("specialUploadFile");
  const file = fileInput?.files?.[0];
  if (!file) {
    alert("Choose a .json file extracted with Special Extract Column first.");
    return;
  }

  const targetRef = document.getElementById("specialUploadStart")?.value.trim().toUpperCase();
  const target = parseCell(targetRef);
  if (!target) {
    alert("Invalid target start cell. Use format like A1 or C5.");
    return;
  }

  const statusEl = document.getElementById("specialUploadStatus");
  if (statusEl) statusEl.textContent = "Reading file…";

  const reader = new FileReader();
  reader.onload = async function (e) {
    let data;
    try {
      data = JSON.parse(e.target.result);
      if (!data.cells || !Array.isArray(data.cells)) {
        throw new Error("This doesn't look like a Special Extract file (missing 'cells').");
      }
    } catch (err) {
      if (statusEl) statusEl.textContent = "";
      alert("Invalid file: " + (err.message || err));
      return;
    }

    const table = document.getElementById("sheet");
    if (!table) { alert("Table not found."); return; }

    const numRows = data.cells.length;
    const numCols = data.cells[0]?.length || 0;

    // Auto-expand rows if the block runs past the bottom of the sheet
    // (columns are capped at 26 / A-Z, same as the rest of the app).
    const neededRows = target.row + numRows;
    const currentRows = table.rows.length - 2;
    if (neededRows > currentRows && typeof addNewRows === "function") {
      addNewRows(neededRows - currentRows);
    }

    if (statusEl) statusEl.textContent = "Placing cells + restoring media…";

    const emojiMap = { image: "🖼️", audio: "🎵", video: "🎥" };
    let placed = 0;

    for (let r = 0; r < numRows; r++) {
      const destRowIndex = target.row + r;
      const tableRow = table.rows[destRowIndex + 1]; // +1 header offset
      if (!tableRow) continue;

      for (let c = 0; c < numCols; c++) {
        const destCol = target.col + c;
        if (destCol > 25) continue; // past column Z — sheet is capped at 26 cols
        const destCell = tableRow.cells[destCol + 1]; // +1 row-number col
        if (!destCell) continue;

        const srcCell = data.cells[r][c] || { text: "", media: [] };

        destCell.textContent = srcCell.text || "";
        destCell.dataset.listenCount = destCell.dataset.listenCount || "0";

        if (srcCell.media && srcCell.media.length) {
          try {
            const urls = [];
            const types = [];
            srcCell.media.forEach(m => {
              const blob = base64ToBlob(m.data);
              urls.push(URL.createObjectURL(blob));
              types.push(m.type || blob.type || "");
            });
            destCell.dataset.mediaUrls = JSON.stringify(urls);
            destCell.dataset.mediaTypes = JSON.stringify(types);

            const uniqueTypes = [...new Set(types)];
            uniqueTypes.forEach(type => {
              const prefix = (type || "").split("/")[0];
              const emoji = emojiMap[prefix];
              if (emoji && !destCell.textContent.includes(emoji)) {
                destCell.appendChild(document.createTextNode(` ${emoji}`));
              }
            });
          } catch (mediaErr) {
            console.error("Special upload: media restore failed", r, c, mediaErr);
          }
        }

        placed++;
      }
    }

    if (statusEl) statusEl.textContent = `✅ Placed ${numRows}×${numCols} cells starting at ${targetRef}.`;
    alert(`✅ Uploaded ${placed} cell${placed === 1 ? "" : "s"} starting at ${targetRef}!`);
  };

  reader.readAsText(file);
}











document.getElementById("openFinder").addEventListener("click", () => {
  const newTab = window.open("", "_blank");
  if (!newTab) {
    alert("Allow pop-ups for this site to open the Frequency Finder.");
    return;
  }

  newTab.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Frequency Finder</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{
    font-family:'Segoe UI',Arial,sans-serif;
    background:#0d0d0d;color:#e0e0e0;
    padding:24px;min-height:100vh;
  }
  h1{color:#5ea4ff;margin-bottom:6px;font-size:28px}
  .subtitle{color:#888;margin-bottom:18px;font-size:14px;line-height:1.5}
  textarea{
    width:100%;height:320px;padding:16px;
    font-size:15px;line-height:1.6;
    border-radius:10px;border:2px solid #222;
    background:#141414;color:#e0e0e0;
    resize:vertical;outline:none;
    transition:border-color .2s;
  }
  textarea:focus{border-color:#5ea4ff}
  .controls{
    display:flex;flex-wrap:wrap;gap:10px;
    align-items:center;margin-top:14px;
  }
  .controls label{color:#aaa;font-size:14px}
  .controls input[type=number], .controls input[type=text]{
    padding:10px 12px;font-size:14px;
    border:none;border-radius:8px;
    background:#1a1a1a;color:#e0e0e0;
  }
  .controls input[type=number]{width:65px;text-align:center}
  .controls input[type=text]{width:220px}
  .controls input::placeholder{color:#555}
  button{
    background:linear-gradient(135deg,#2b7cff,#1a5ec2);
    color:#fff;border:none;padding:11px 22px;
    border-radius:10px;cursor:pointer;font-size:15px;
    font-weight:600;transition:all .2s;
  }
  button:hover{transform:translateY(-1px);box-shadow:0 4px 18px #2b7cff55}
  button:active{transform:translateY(0)}
  button:disabled{opacity:.5;cursor:wait;transform:none;box-shadow:none}
  
  /* COPY BUTTONS */
  .copy-btn{
    background:#1a1a1a;border:1px solid #333;color:#aaa;
    padding:9px 14px;font-size:13px;border-radius:8px;cursor:pointer;
    transition:all .2s;font-weight:500;
  }
  .copy-btn:hover{background:#222;color:#fff;border-color:#5ea4ff}
  .copy-btn.copied{background:#1b5e20;border-color:#4caf50;color:#fff}

  .stats{
    margin-top:18px;padding:12px 16px;
    background:#161616;border-radius:8px;
    font-size:13px;color:#999;display:none;
  }
  .stats span{color:#5ea4ff;font-weight:700}
  .table-wrap{
    margin-top:20px;max-height:60vh;
    overflow-y:auto;border-radius:10px;
    border:1px solid #222;display:none;
  }
  table{width:100%;border-collapse:collapse;background:#111}
  thead{position:sticky;top:0;z-index:2}
  th{
    background:#1e1e1e;color:#5ea4ff;
    padding:14px 16px;text-align:left;
    font-size:14px;border-bottom:2px solid #333;
  }
  td{
    padding:10px 16px;border-bottom:1px solid #1a1a1a;
    font-size:14px;
  }
  tr:hover td{background:#1a2233}
  tr:nth-child(even) td{background:#0f0f0f}
  tr:nth-child(even):hover td{background:#1a2233}
  .rank{color:#555;font-size:12px;margin-right:8px}
  .bar-cell{position:relative}
  .bar{
    position:absolute;left:0;top:0;bottom:0;
    background:#2b7cff15;border-radius:3px;
    pointer-events:none;transition:width .4s ease;
  }
  .bar-text{position:relative;z-index:1}
  .no-results{
    text-align:center;padding:40px;color:#555;font-size:15px;
  }
  .spinner{
    display:inline-block;width:18px;height:18px;
    border:3px solid #ffffff44;border-top-color:#fff;
    border-radius:50%;animation:spin .6s linear infinite;
    vertical-align:middle;margin-right:8px;
  }
  @keyframes spin{to{transform:rotate(360deg)}}
</style>
</head>
<body>

<h1>\u{1F50D} Frequency Finder</h1>
<div class="subtitle">
  Paste any text \u2014 Bible verses, Bhagavad Gita, Quran, Tao Te Ching,
  Tolstoy poems, or anything in any language. Digits & punctuation are stripped.
  Case is ignored. Copy any column instantly.
</div>

<textarea id="textInput"
  placeholder="Paste your text here \u2014 large or small\u2026"></textarea>

<div class="controls">
  <label>Combo size:</label>
  <input id="comboSize" type="number" min="1" max="12" value="1">
  <button id="findBtn">Find Frequency</button>
  <input id="filterInput" type="text" placeholder="Filter results\u2026">
  <button id="copyWords" class="copy-btn">Copy Words</button>
  <button id="copyCounts" class="copy-btn">Copy Counts</button>
  <button id="copyPcts" class="copy-btn">Copy %</button>
</div>

<div class="stats" id="stats"></div>

<div class="table-wrap" id="tableWrap">
  <table id="resultTable">
    <thead>
      <tr>
        <th style="width:40%">Word / Combination</th>
        <th style="width:20%">Count</th>
        <th style="width:40%">% of Text</th>
      </tr>
    </thead>
    <tbody id="tbody"></tbody>
  </table>
</div>

<script>
(function(){
  "use strict";

  /* ---------- helpers ---------- */
  function normalizeText(text){
    text = text.normalize("NFKC");
    text = text.replace(/\\p{N}/gu, " ");
    text = text.toLocaleLowerCase();
    text = text.replace(/[\\p{P}\\p{S}\\p{C}]/gu, " ");
    text = text.replace(/\\s+/g, " ").trim();
    return text;
  }

  function tokenize(text){
    var m = text.match(/\\p{L}+/gu);
    return m ? m : [];
  }

  function buildNgrams(words, n){
    if(n < 1) n = 1;
    var out = [];
    for(var i = 0; i <= words.length - n; i++){
      out.push(words.slice(i, i + n).join(" "));
    }
    return out;
  }

  function escapeHtml(s){
    return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  /* ---------- state ---------- */
  var findBtn    = document.getElementById("findBtn");
  var textInput  = document.getElementById("textInput");
  var comboInput = document.getElementById("comboSize");
  var filterIn   = document.getElementById("filterInput");
  var tbody      = document.getElementById("tbody");
  var tableWrap  = document.getElementById("tableWrap");
  var statsDiv   = document.getElementById("stats");

  var allResults = [];
  var currentDisplay = [];

  /* ---------- render ---------- */
  function renderTable(data){
    currentDisplay = data; // track what's visible for copying
    var maxCount = data.length ? data[0].count : 1;
    var html = "";
    var limit = Math.min(data.length, 5000);

    for(var i = 0; i < limit; i++){
      var d = data[i];
      var pct = d.pct.toFixed(4);
      var barW = ((d.count / maxCount) * 100).toFixed(2);
      html += '<tr>' +
        '<td><span class="rank">#' + (i+1) + '</span>' + escapeHtml(d.word) + '</td>' +
        '<td>' + d.count.toLocaleString() + '</td>' +
        '<td class="bar-cell">' +
          '<div class="bar" style="width:' + barW + '%"></div>' +
          '<span class="bar-text">' + pct + '%</span>' +
        '</td>' +
      '</tr>';
    }

    if(data.length > limit){
      html += '<tr><td colspan="3" class="no-results">Showing top ' + limit.toLocaleString() + ' of ' + data.length.toLocaleString() + '</td></tr>';
    }
    if(!data.length){
      html = '<tr><td colspan="3" class="no-results">No results.</td></tr>';
    }

    tbody.innerHTML = html;
  }

  /* ---------- main logic ---------- */
  findBtn.addEventListener("click", function(){
    var raw = textInput.value;
    if(!raw.trim()){ alert("Please paste some text first."); return; }

    findBtn.disabled = true;
    findBtn.innerHTML = '<span class="spinner"></span>Processing\u2026';

    setTimeout(function(){
      var n = parseInt(comboInput.value, 10) || 1;
      if(n < 1) n = 1; if(n > 12) n = 12;
      comboInput.value = n;

      var cleaned = normalizeText(raw);
      var words   = tokenize(cleaned);
      if(!words.length){ alert("No words found."); resetBtn(); return; }

      var units = buildNgrams(words, n);
      var freq  = Object.create(null);
      for(var i = 0; i < units.length; i++){
        freq[units[i]] = (freq[units[i]] || 0) + 1;
      }

      var total = units.length;
      var sorted = Object.keys(freq).map(function(w){
        return { word:w, count:freq[w], pct:(freq[w]/total)*100 };
      }).sort(function(a,b){ return b.count - a.count; });

      allResults = sorted;
      statsDiv.style.display = "block";
      statsDiv.innerHTML = 'Tokens: <span>'+total.toLocaleString()+'</span> | Unique: <span>'+sorted.length.toLocaleString()+'</span> | Combo: <span>'+n+'</span>';
      
      renderTable(sorted);
      tableWrap.style.display = "block";
      resetBtn();
    }, 50);
  });

  function resetBtn(){
    findBtn.disabled = false;
    findBtn.textContent = "Find Frequency";
  }

  /* ---------- filter ---------- */
  filterIn.addEventListener("input", function(){
    var q = this.value.toLocaleLowerCase().trim();
    if(!q){ renderTable(allResults); return; }
    renderTable(allResults.filter(function(d){ return d.word.indexOf(q) !== -1; }));
  });

  /* ---------- COPY COLUMNS ---------- */
  function setupCopy(btnId, extractor){
    document.getElementById(btnId).addEventListener("click", function(){
      if(!currentDisplay.length) return;
      var text = currentDisplay.map(extractor).join("\\n");
      navigator.clipboard.writeText(text).then(() => {
        var btn = this, orig = btn.textContent;
        btn.textContent = "Copied!";
        btn.classList.add("copied");
        setTimeout(() => { btn.textContent = orig; btn.classList.remove("copied"); }, 1400);
      }).catch(() => {
        // Fallback for older browsers or non-HTTPS
        var ta = document.createElement("textarea");
        ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select();
        document.execCommand("copy"); document.body.removeChild(ta);
        var btn = this, orig = btn.textContent;
        btn.textContent = "Copied!"; btn.classList.add("copied");
        setTimeout(() => { btn.textContent = orig; btn.classList.remove("copied"); }, 1400);
      });
    });
  }

  setupCopy("copyWords",  d => d.word);
  setupCopy("copyCounts", d => d.count);
  setupCopy("copyPcts",   d => d.pct.toFixed(4) + "%");

})();
</script>
</body>
</html>`);
});


// ===============================
// RECORDER BUTTON EVENTS
// ===============================
document.getElementById("recordBtn")?.addEventListener("click", startRecording);
document.getElementById("stopRecordBtn")?.addEventListener("click", stopRecording);



// Sync practice visuals on page load
(function syncInitialPracticeVisuals() {
    var cells = document.querySelectorAll("td[contenteditable='true']");
    for (var i = 0; i < cells.length; i++) {
        var cell = cells[i];
        // Ensure cell ID exists
        if (!cell.dataset.cellId) {
            var row = cell.closest("tr");
            var rowIndex = row ? row.rowIndex - 2 : 0;
            var colIndex = cell.cellIndex - 1;
            cell.dataset.cellId = rowIndex + ":" + colIndex;
        }
        if (!cell.dataset.listenCount) {
            cell.dataset.listenCount = "0";
        }
        if (!cell.classList.contains("practice-cell")) {
            cell.classList.add("practice-cell");
        }
        updateCellPracticeColor(cell);
        updateCellPracticeBadge(cell);
    }
})();


// =====================================================
// BEGIN CONVERSION JS BLOCK
// =====================================================

function toggleConversion(){

    const box =
        document.getElementById(
            "conversionBox"
        );

    box.style.display =
        box.style.display === "block"
        ? "none"
        : "block";
}


// ---------------------------------------------
// CELL HELPERS
// ---------------------------------------------
// NOTE: This used to be a SECOND top-level function named `parseCell`.
// Because JS function declarations in the same scope silently overwrite
// each other (last one wins), this definition was clobbering the real
// `parseCell` defined earlier in the file (the one with 1-based rows,
// case-insensitive matching, and null/empty-string safety used by
// startReading() and extractRange()). That collision was the root cause
// of "start cell / end cell not working": every call to parseCell()
// anywhere in the app — including the main reader — was actually running
// THIS 0-based version instead, silently shifting every row index by one.
// Renamed to parseCellZeroBased to remove the collision; only this
// function's own two call sites (below, in startAudioConversion) use it,
// since getCellByCoords() also expects 0-based rows.
function parseCellZeroBased(cellRef){

    if (!cellRef) return null;

    const match =
        cellRef.match(/^([A-Z]+)(\d+)$/i);

    if(!match) return null;

    return {
        col:
            match[1]
            .toUpperCase()
            .charCodeAt(0) - 65,

        row:
            parseInt(match[2]) - 1
    };
}


function getCellByCoords(row,col){

    const table =
        document.getElementById("sheet");

    const tr =
        table.rows[row + 2];

    if(!tr) return null;

    return tr.cells[col + 1];
}


// ---------------------------------------------
// MAIN CONVERSION ENGINE
// ---------------------------------------------
async function startAudioConversion(){

    const startCell =
        document.getElementById(
            "audioStartCell"
        ).value
        .trim()
        .toUpperCase();

    const endCell =
        document.getElementById(
            "audioEndCell"
        ).value
        .trim()
        .toUpperCase();

    const outputColumn =
        document.getElementById(
            "audioOutputColumn"
        ).value
        .trim()
        .toUpperCase();

    const progressContainer =
        document.getElementById(
            "audioProgressContainer"
        );

    const progressBar =
        document.getElementById(
            "audioProgressBar"
        );

    const progressText =
        document.getElementById(
            "audioProgressText"
        );

    const start =
        parseCellZeroBased(startCell);

    const end =
        parseCellZeroBased(endCell);

    const outCol =
        outputColumn.charCodeAt(0)-65;

    if(!start || !end){
        alert(
            "Invalid cell range."
        );
        return;
    }

    // -----------------------------------------
    // Ask user for audio capture permission
    // -----------------------------------------
    alert(
        "Choose THIS TAB and enable Share Tab Audio."
    );

    const captureStream =
        await navigator.mediaDevices
        .getDisplayMedia({
            video:true,
            audio:true
        });

    progressContainer.style.display =
        "block";

    progressText.style.display =
        "block";

    const totalCells =
        (end.row - start.row) + 1;

    let completed = 0;

    for(
        let r = start.row;
        r <= end.row;
        r++
    ){

        const sourceCell =
            getCellByCoords(
                r,
                start.col
            );

        if(!sourceCell)
            continue;

        const text =
            sourceCell.innerText.trim();

        if(!text)
            continue;

        sourceCell.classList.add(
            "reading"
        );

        progressText.innerText =
            `Recording ${completed+1} / ${totalCells}`;

        progressBar.style.width =
            (
                (completed / totalCells)
                *100
            ) + "%";

        // -----------------------------
        // START RECORDING
        // -----------------------------
        const chunks = [];

        const recorder =
            new MediaRecorder(
                captureStream
            );

        recorder.ondataavailable =
            e => {

                if(
                    e.data &&
                    e.data.size > 0
                ){
                    chunks.push(e.data);
                }
            };

        recorder.start();

        // -----------------------------
        // SPEAK CELL
        // -----------------------------
        await new Promise(
            resolve=>{

            const utterance =
                new SpeechSynthesisUtterance(
                    text
                );

            utterance.rate =
                0.85;

            utterance.onend =
                ()=>{

                    setTimeout(
                        ()=>{

                        recorder.stop();

                    },300);

                };

            recorder.onstop =
                ()=>{

                    const blob =
                        new Blob(
                            chunks,
                            {
                                type:
                                "audio/webm"
                            }
                        );

                    const url =
                        URL.createObjectURL(
                            blob
                        );

                    const targetCell =
                        getCellByCoords(
                            r,
                            outCol
                        );

                    if(targetCell){

                        targetCell.innerHTML =
                            "🎵";

                        targetCell.dataset.audio =
                            url;

                        targetCell.style.cursor =
                            "pointer";

                        targetCell.onclick =
                            function(){

                            const audio =
                                new Audio(
                                    this.dataset.audio
                                );

                            audio.play();

                        };
                    }

                    resolve();
                };

            speechSynthesis.speak(
                utterance
            );

        });

        sourceCell.classList.remove(
            "reading"
        );

        completed++;

        progressBar.style.width =
            (
                (completed / totalCells)
                *100
            ) + "%";
    }

    progressText.innerText =
        `Finished ${completed} cells`;

    captureStream
        .getTracks()
        .forEach(
            t=>t.stop()
        );

    alert(
        "Audio conversion complete."
    );
}

// =====================================================
// END CONVERSION JS BLOCK
// =====================================================





// (Duplicate toggleExtract/extractRange definitions that used to live
// here were removed — they were byte-identical to the ones defined
// earlier in this file, just a leftover from a previous merge.)






// ===============================
// MAX CONCURRENT OVERLAP AUDIO WATCHER
// Keeps at most MAX_CONCURRENT_AUDIO clips playing at once.
// When a new one pushes the count over the limit, the OLDEST
// currently-playing audio is stopped and dropped.
// ===============================
(function () {
  const MAX_CONCURRENT_AUDIO = 3; // change this number to taste

  setInterval(() => {
    const list = window.currentMediaElements;
    if (!list || list.length <= MAX_CONCURRENT_AUDIO) return;

    while (list.length > MAX_CONCURRENT_AUDIO) {
      const oldest = list.shift(); // index 0 = earliest one still playing
      if (!oldest) break;
      try { oldest.pause(); } catch (e) {}
      try { oldest.remove(); } catch (e) {} // pull it out of the popup too
    }
  }, 200); // checks 5x/sec
})();
