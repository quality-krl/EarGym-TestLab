// app.js (module)
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

const NOTE_ORDER = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const A4_INDEX = NOTE_ORDER.indexOf("A");

const DIFFICULTY_LABELS = {
  en: ["Easy", "Standard", "Hard"],
  he: ["קל", "סטנדרטי", "קשה"],
};

function noteFreqFromA4(semitonesFromA4) {
  return 440 * Math.pow(2, semitonesFromA4 / 12);
}

function buildNotePool(difficulty) {
  if (difficulty === 0) return ["C","D","E","F","G","A","B"];
  return NOTE_ORDER.slice();
}

function pickOne(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function setText(trainerEl, key, value) {
  const el = $(`[data-out='${key}']`, trainerEl);
  if (el) el.textContent = String(value);
}

function setPrompt(trainerEl, text) {
  const out = $("[data-out='prompt']", trainerEl);
  if (out) out.textContent = text || "";
}

function clearNoteStates(trainerEl) {
  $$(".noteBtn", trainerEl).forEach(b => b.classList.remove("is-correct", "is-wrong"));
}

function setNotesEnabledByPool(trainerEl, pool, enabled) {
  const allowed = new Set(pool);
  $$(".noteBtn", trainerEl).forEach(b => {
    const n = b.getAttribute("data-note");
    b.disabled = !(enabled && allowed.has(n));
  });
}

function getLang() {
  return $("#lang-he")?.checked ? "he" : "en";
}

function setDocDir() {
  const lang = getLang();
  document.documentElement.lang = lang === "he" ? "he" : "en";
  document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
  document.documentElement.dataset.lang = lang;
}

function playLangSwitchFx() {
  document.body.classList.remove("langSwap");
  void document.body.offsetWidth; // restart animation reliably
  document.body.classList.add("langSwap");
  window.clearTimeout(playLangSwitchFx._t);
  playLangSwitchFx._t = window.setTimeout(() => {
    document.body.classList.remove("langSwap");
  }, 650);
}

/**
 * FLIP animation (brand + toggle), hardened:
 * - clears transforms before measuring (prevents drift/stuck states)
 * - cancels previous run when toggled quickly
 * - measures only once per frame
 */
function flipMoveHeader(applyChange) {
  const brand = document.querySelector(".brand");
  const lang = document.querySelector(".lang");
  const els = [brand, lang].filter(Boolean);

  // If nothing to animate: just apply.
  if (els.length === 0) {
    applyChange();
    setDocDir();
    playLangSwitchFx();
    return;
  }

  // --- FIX: keep scroll stable on mobile during dir/layout swap
  const x0 = window.scrollX || 0;
  const y0 = window.scrollY || 0;

  // Cancel any prior animation artifacts.
  els.forEach(el => {
    el.style.transition = "";
    el.style.transform = "";
  });

  if (flipMoveHeader._t) {
    window.clearTimeout(flipMoveHeader._t);
    flipMoveHeader._t = null;
  }
  if (flipMoveHeader._raf1) {
    cancelAnimationFrame(flipMoveHeader._raf1);
    flipMoveHeader._raf1 = null;
  }
  if (flipMoveHeader._raf2) {
    cancelAnimationFrame(flipMoveHeader._raf2);
    flipMoveHeader._raf2 = null;
  }

  const firstRects = els.map(el => el.getBoundingClientRect());

  applyChange();
  setDocDir();

  // Re-apply scroll immediately (prevents iOS "jump" on dir/display swap)
  window.scrollTo(x0, y0);

  flipMoveHeader._raf1 = requestAnimationFrame(() => {
    // keep stable before measuring
    window.scrollTo(x0, y0);

    const lastRects = els.map(el => el.getBoundingClientRect());

    els.forEach((el, i) => {
      const dx = firstRects[i].left - lastRects[i].left;
      const dy = firstRects[i].top - lastRects[i].top;
      el.style.transition = "transform 0s";
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    });

    flipMoveHeader._raf2 = requestAnimationFrame(() => {
      // keep stable during animation start
      window.scrollTo(x0, y0);

      els.forEach(el => {
        el.style.transition = "transform 520ms cubic-bezier(.2,.9,.2,1)";
        el.style.transform = "translate(0,0)";
      });

      playLangSwitchFx();

      flipMoveHeader._t = window.setTimeout(() => {
        els.forEach(el => {
          el.style.transition = "";
          el.style.transform = "";
        });
        flipMoveHeader._t = null;
      }, 560);
    });
  });
}


function initLanguage() {
  setDocDir();

  // Label clicks -> FLIP reliably.
  $$(".lang__btn").forEach(lbl => {
    lbl.addEventListener("click", (e) => {
      e.preventDefault();
      const target = lbl.getAttribute("data-lang") === "he" ? "he" : "en";
      flipMoveHeader(() => {
        $("#lang-he").checked = target === "he";
        $("#lang-en").checked = target !== "he";
      });
    });
  });

  // Keyboard / direct changes fallback (no FLIP).
  ["lang-en","lang-he"].forEach(id => {
    const r = document.getElementById(id);
    if (!r) return;
    r.addEventListener("change", () => {
      setDocDir();
      playLangSwitchFx();
    });
  });
}

/**
 * Benchmark data:
 * ONLY publicly documented absolute/perfect pitch artists.
 */
function buildBenchData() {
  return {
    en: [
      { name:"Charlie Puth", meta:"Pop / Producer", tag:{t:"Absolute pitch (public demos)", c:"yes"}, link:"https://www.youtube.com/watch?v=6gTmyhRM6k0" },
      { name:"Jacob Collier", meta:"Multi-instrumentalist", tag:{t:"Absolute pitch (documented)", c:"yes"}, link:"https://en.wikipedia.org/wiki/List_of_people_with_absolute_pitch" },
      { name:"Ella Fitzgerald", meta:"Jazz vocalist", tag:{t:"Perfect pitch (documented)", c:"yes"}, link:"https://www.nprillinois.org/2017-04-25/celebrating-the-centennial-of-jazz-legend-ella-fitzgerald" },
      { name:"Mariah Carey", meta:"Vocalist", tag:{t:"Absolute pitch (documented)", c:"yes"}, link:"https://en.wikipedia.org/wiki/List_of_people_with_absolute_pitch" },
      { name:"Celine Dion", meta:"Vocalist", tag:{t:"Absolute pitch (documented)", c:"yes"}, link:"https://en.wikipedia.org/wiki/List_of_people_with_absolute_pitch" },
      { name:"Yngwie Malmsteen", meta:"Guitarist", tag:{t:"Absolute pitch (documented)", c:"yes"}, link:"https://en.wikipedia.org/wiki/List_of_people_with_absolute_pitch" },
      { name:"Wolfgang A. Mozart", meta:"Classical composer", tag:{t:"Absolute pitch (documented)", c:"yes"}, link:"https://en.wikipedia.org/wiki/List_of_people_with_absolute_pitch" },
      { name:"Ludwig van Beethoven", meta:"Classical composer", tag:{t:"Absolute pitch (documented)", c:"yes"}, link:"https://en.wikipedia.org/wiki/List_of_people_with_absolute_pitch" },
      { name:"Niccolò Paganini", meta:"Violin virtuoso", tag:{t:"Absolute pitch (documented)", c:"yes"}, link:"https://www.wga.hu/html_m/d/david_a/2/24davida.html" },
    ],
    he: [
      { name:"צ’רלי פות’", meta:"פופ / מפיק", tag:{t:"שמיעה אבסולוטית (הדגמות פומביות)", c:"yes"}, link:"https://www.youtube.com/watch?v=6gTmyhRM6k0" },
      { name:"ג’ייקוב קולייר", meta:"רב-נגן", tag:{t:"שמיעה אבסולוטית (מתועד)", c:"yes"}, link:"https://en.wikipedia.org/wiki/List_of_people_with_absolute_pitch" },
      { name:"אלה פיצג’רלד", meta:"ג’אז", tag:{t:"שמיעה מושלמת (מתועד)", c:"yes"}, link:"https://www.nprillinois.org/2017-04-25/celebrating-the-centennial-of-jazz-legend-ella-fitzgerald" },
      { name:"מריה קארי", meta:"זמרת", tag:{t:"שמיעה אבסולוטית (מתועד)", c:"yes"}, link:"https://en.wikipedia.org/wiki/List_of_people_with_absolute_pitch" },
      { name:"סלין דיון", meta:"זמרת", tag:{t:"שמיעה אבסולוטית (מתועד)", c:"yes"}, link:"https://en.wikipedia.org/wiki/List_of_people_with_absolute_pitch" },
      { name:"אינגווי מלמסטין", meta:"גיטריסט", tag:{t:"שמיעה אבסולוטית (מתועד)", c:"yes"}, link:"https://en.wikipedia.org/wiki/List_of_people_with_absolute_pitch" },
      { name:"מוצרט", meta:"מלחין קלאסי", tag:{t:"שמיעה אבסולוטית (מתועד)", c:"yes"}, link:"https://en.wikipedia.org/wiki/List_of_people_with_absolute_pitch" },
      { name:"לודוויג ואן בטהובן", meta:"מלחין קלאסי", tag:{t:"שמיעה אבסולוטית (מתועד)", c:"yes"}, link:"https://en.wikipedia.org/wiki/List_of_people_with_absolute_pitch" },
      { name:"ניקולו פגניני", meta:"וירטואוז כינור", tag:{t:"שמיעה אבסולוטית (מתועד)", c:"yes"}, link:"https://www.wga.hu/html_m/d/david_a/2/24davida.html" },
    ],
  };
}

function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;", "'":"&#39;"
  }[c]));
}

function benchCardHTML(x) {
  const fullName = escapeHTML(x.name);
  const fullMeta = escapeHTML(x.meta);

  return `
    <div class="bCard">
      <div class="bName" tabindex="0" title="${fullName}" aria-label="${fullName}" data-full="${fullName}">${fullName}</div>
      <div class="bMeta" tabindex="0" title="${fullMeta}" aria-label="${fullMeta}" data-full="${fullMeta}">${fullMeta}</div>
      <div class="bTag is-yes">${escapeHTML(x.tag.t)}</div>
      <a class="bLink" href="${x.link}" target="_blank" rel="noopener noreferrer">Source</a>
    </div>
  `;
}

function renderBench() {
  const data = buildBenchData();
  const enWrap = document.querySelector("[data-bench='en']");
  const heWrap = document.querySelector("[data-bench='he']");
  if (enWrap) enWrap.innerHTML = data.en.map(benchCardHTML).join("");
  if (heWrap) heWrap.innerHTML = data.he.map(benchCardHTML).join("");
}

/**
 * Touch-only: allow tapping a bench card to pin the tooltip (adds .is-open),
 * tap elsewhere or press Escape to close.
 */
function initBenchTouchTooltips() {
  const isTouch = window.matchMedia?.("(hover: none)").matches;
  if (!isTouch) return;

  const closeAll = () => $$(".bCard.is-open").forEach(c => c.classList.remove("is-open"));

  document.addEventListener("click", (e) => {
    const link = e.target.closest?.(".bLink");
    if (link) return; // don't interfere with Source clicks

    const card = e.target.closest?.(".bCard");
    if (!card) {
      closeAll();
      return;
    }

    // Toggle only this card; close others.
    const isOpen = card.classList.contains("is-open");
    closeAll();
    if (!isOpen) card.classList.add("is-open");
  }, { passive: true });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAll();
  });
}

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
  }
  async ensure() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.12;
    this.master.connect(this.ctx.destination);
  }
  async resume() {
    await this.ensure();
    if (this.ctx.state === "suspended") await this.ctx.resume();
  }
  async beep(freq, seconds = 0.78) {
    await this.resume();
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t0);

    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(1.0, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);

    osc.connect(gain);
    gain.connect(this.master);

    osc.start(t0);
    osc.stop(t0 + seconds);

    return new Promise(resolve => { osc.onended = resolve; });
  }
}

function initTrainer(trainerEl, audio) {
  const locale = trainerEl.getAttribute("data-trainer") === "he" ? "he" : "en";

  const playBtn = $("[data-action='play']", trainerEl);
  const replayBtn = $("[data-action='replay']", trainerEl);
  const nextBtn = $("[data-action='new']", trainerEl);
  const resetBtn = $("[data-action='reset']", trainerEl);
  const assistToggle = $("[data-action='assist']", trainerEl);
  const diffRange = $("[data-action='difficulty']", trainerEl);
  const diffLabel = $("[data-out='difficultyLabel']", trainerEl);

  let targetNote = null;
  let targetFreq = null;
  let answered = false;
  let currentPool = buildNotePool(1);

  let correct = 0;
  let total = 0;
  let streak = 0;
  let best = 0;

  const bestKey = `pitch_best_${locale}`;
  const savedBest = Number(localStorage.getItem(bestKey) || "0");
  best = Number.isFinite(savedBest) ? savedBest : 0;

  function difficulty() {
    const v = Number(diffRange?.value ?? 1);
    return clamp(v, 0, 2);
  }

  function syncDifficultyLabel() {
    const d = difficulty();
    currentPool = buildNotePool(d);
    if (diffLabel) diffLabel.textContent = DIFFICULTY_LABELS[locale][d];
    if (!targetNote && !answered) {
      setNotesEnabledByPool(trainerEl, currentPool, false);
    }
  }

  function syncStats() {
    const score = total === 0 ? 0 : Math.round((correct / total) * 100);
    best = Math.max(best, score);
    localStorage.setItem(bestKey, String(best));

    setText(trainerEl, "score", score);
    setText(trainerEl, "correct", correct);
    setText(trainerEl, "total", total);
    setText(trainerEl, "streak", streak);
    setText(trainerEl, "best", best);
  }

  function resetRoundUI() {
    clearNoteStates(trainerEl);
    answered = false;
    if (nextBtn) nextBtn.disabled = true;
  }

  function promptAsk() {
    setPrompt(trainerEl, locale === "he" ? "איזה תו שמעתם?" : "Which note was it?");
  }

  function pickTarget() {
    const d = difficulty();
    const pool = buildNotePool(d);
    currentPool = pool;

    targetNote = pickOne(pool);

    const octaveShift = d === 2 ? pickOne([-12, 0, 12]) : 0;
    const semitonesFromA4 = (NOTE_ORDER.indexOf(targetNote) - A4_INDEX) + octaveShift;
    targetFreq = noteFreqFromA4(semitonesFromA4);
  }

  async function playSequence() {
    await audio.resume();
    resetRoundUI();
    pickTarget();

    if (replayBtn) replayBtn.disabled = false;
    setNotesEnabledByPool(trainerEl, currentPool, false);

    const assistOn = !!assistToggle?.checked;
    if (assistOn) {
      await audio.beep(440, 0.45);
      await wait(110);
    }
    await audio.beep(targetFreq, 0.82);

    promptAsk();
    setNotesEnabledByPool(trainerEl, currentPool, true);
  }

  async function replay() {
    if (!targetFreq) return;
    await audio.resume();

    setNotesEnabledByPool(trainerEl, currentPool, false);

    const assistOn = !!assistToggle?.checked;
    if (assistOn) {
      await audio.beep(440, 0.45);
      await wait(110);
    }
    await audio.beep(targetFreq, 0.82);

    if (!answered) promptAsk();
    setNotesEnabledByPool(trainerEl, currentPool, true);
  }

  function handleGuess(btn) {
    if (!targetNote || answered) return;

    answered = true;
    total += 1;

    const guess = btn.getAttribute("data-note");
    clearNoteStates(trainerEl);

    const isCorrect = guess === targetNote;
    if (isCorrect) {
      correct += 1;
      streak += 1;
      btn.classList.add("is-correct");
      setPrompt(trainerEl, locale === "he" ? `נכון. זה היה ${targetNote}.` : `Correct. It was ${targetNote}.`);
    } else {
      streak = 0;
      btn.classList.add("is-wrong");
      const correctBtn = $(`.noteBtn[data-note="${CSS.escape(targetNote)}"]`, trainerEl);
      if (correctBtn) correctBtn.classList.add("is-correct");
      setPrompt(trainerEl, locale === "he" ? `לא. זה היה ${targetNote}.` : `Not quite. It was ${targetNote}.`);
    }

    syncStats();
    if (nextBtn) nextBtn.disabled = false;
    setNotesEnabledByPool(trainerEl, currentPool, false);
  }

  function nextRound() {
    resetRoundUI();
    targetFreq = null;
    targetNote = null;
    if (replayBtn) replayBtn.disabled = true;

    setPrompt(trainerEl, locale === "he" ? "לחצו “נגן” כדי לשמוע תו חדש." : "Press “Play” to hear a new note.");
    setNotesEnabledByPool(trainerEl, currentPool, false);
  }

  function resetAll() {
    correct = 0;
    total = 0;
    streak = 0;
    syncStats();
    resetRoundUI();
    targetFreq = null;
    targetNote = null;

    if (replayBtn) replayBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = true;

    setPrompt(trainerEl, locale === "he" ? "לחצו “נגן” כדי להתחיל." : "Press “Play” to begin.");
    setNotesEnabledByPool(trainerEl, currentPool, false);
  }

  playBtn?.addEventListener("click", playSequence);
  replayBtn?.addEventListener("click", replay);
  nextBtn?.addEventListener("click", nextRound);
  resetBtn?.addEventListener("click", resetAll);
  diffRange?.addEventListener("input", () => { syncDifficultyLabel(); nextRound(); });

  $$(".noteBtn", trainerEl).forEach(btn => {
    btn.addEventListener("click", () => handleGuess(btn));
  });

  syncDifficultyLabel();
  syncStats();
  resetAll();
}

function init() {
  initLanguage();
  renderBench();
  initBenchTouchTooltips();

  const audio = new AudioEngine();
  $$(".trainer").forEach(t => initTrainer(t, audio));
}

document.addEventListener("DOMContentLoaded", init);
