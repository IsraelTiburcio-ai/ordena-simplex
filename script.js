(function () {
  'use strict';

  var DATA = window.ORDENA_SIMPLEX;
  var PHASE_LABEL = {
    prep: 'Fase 1 · Preparación',
    ciclo: 'Fase 2 · Ciclo del simplex',
    iter: 'Fase 3 · Mini-iteración'
  };
  // Reparto de cada partida: 2 rondas por fase, en el orden del método.
  var PLAN = [['prep', 2], ['ciclo', 2], ['iter', 2]];
  var TOTAL = PLAN.reduce(function (s, p) { return s + p[1]; }, 0);
  var MUTE_KEY = 'ordena-simplex:muted';
  var REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  var ICON_ON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 9.5v5h3.5L12 18V6L7.5 9.5H4z" fill="currentColor"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  var ICON_OFF = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 9.5v5h3.5L12 18V6L7.5 9.5H4z" fill="currentColor"/><path d="M16 9.5l5 5m0-5l-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

  function $(id) { return document.getElementById(id); }

  var el = {
    main: $('app-main'),
    timer: $('timer'),
    btnMute: $('btn-mute'),
    btnHome: $('btn-home'),
    start: $('screen-start'),
    btnStart: $('btn-start'),
    game: $('screen-game'),
    phase: $('phase-label'),
    roundCount: $('round-count'),
    progress: $('progress'),
    mission: $('mission-text'),
    slots: $('slots'),
    tray: $('tray'),
    trayCount: $('tray-count'),
    trayHint: $('tray-hint'),
    btnClear: $('btn-clear'),
    btnCheck: $('btn-check'),
    feedback: $('feedback'),
    overlay: $('overlay'),
    doneNum: $('done-num'),
    doneText: $('done-text'),
    doneRef: $('done-ref'),
    btnNext: $('btn-next'),
    end: $('screen-end'),
    endTitle: $('end-title'),
    stRounds: $('st-rounds'),
    stTime: $('st-time'),
    stErrors: $('st-errors'),
    stPrecision: $('st-precision'),
    btnReplay: $('btn-replay'),
    btnEndHome: $('btn-end-home')
  };

  /* ---------- Sonido (Web Audio; sin archivos externos) ---------- */
  var Sound = (function () {
    var ctx = null;
    var muted = false;
    try { muted = window.localStorage.getItem(MUTE_KEY) === '1'; } catch (e) { muted = false; }

    function ensure() {
      if (muted) return null;
      if (!ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        try { ctx = new AC(); } catch (e) { return null; }
      }
      if (ctx.state === 'suspended' && ctx.resume) { ctx.resume().catch(function () {}); }
      return ctx;
    }

    function note(freq, when, dur, type, vol, slideTo) {
      var c = ensure();
      if (!c) return;
      var t0 = c.currentTime + (when || 0);
      var osc = c.createOscillator();
      var gain = c.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.03);
    }

    function play(list) {
      list.forEach(function (n) { note(n[0], n[1], n[2], n[3], n[4], n[5]); });
    }

    return {
      unlock: function () { ensure(); },
      isMuted: function () { return muted; },
      setMuted: function (v) {
        muted = !!v;
        try { window.localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch (e) { /* sin almacenamiento */ }
      },
      select: function () { play([[700, 0, 0.07, 'sine', 0.08, 960]]); },
      back: function () { play([[520, 0, 0.08, 'sine', 0.07, 340]]); },
      place: function () { play([[330, 0, 0.12, 'triangle', 0.14, 240]]); },
      error: function () {
        play([[230, 0, 0.16, 'sawtooth', 0.06, 170], [170, 0.15, 0.22, 'sawtooth', 0.05, 110]]);
      },
      round: function () {
        play([
          [523.25, 0, 0.16, 'triangle', 0.12],
          [659.25, 0.09, 0.16, 'triangle', 0.12],
          [783.99, 0.18, 0.16, 'triangle', 0.12],
          [1046.5, 0.27, 0.32, 'triangle', 0.13]
        ]);
      },
      finish: function () {
        play([
          [392, 0, 0.18, 'triangle', 0.12],
          [523.25, 0.13, 0.18, 'triangle', 0.12],
          [659.25, 0.26, 0.18, 'triangle', 0.12],
          [783.99, 0.39, 0.5, 'triangle', 0.14]
        ]);
      }
    };
  })();

  var resultsBridge = window.OptiLabResults ? window.OptiLabResults.create('ordena-simplex') : { start: function () {}, complete: function () {}, cancel: function () {} };

  /* ---------- Estado de la partida ---------- */
  var game = {
    active: false,
    locked: false,
    rounds: [],
    index: 0,
    done: [],
    won: 0,
    errors: 0,
    evaluated: 0,
    round: null,
    slots: [],
    tray: [],
    selected: null,
    marks: null,
    attempts: 0,
    checksTotal: 0,
    justPlaced: -1,
    base: 0,
    startedAt: 0,
    running: false
  };

  /* ---------- Cronómetro (pausa si la pestaña se oculta) ---------- */
  function elapsed() {
    return game.base + (game.running ? performance.now() - game.startedAt : 0);
  }
  function startClock() {
    game.base = 0;
    game.startedAt = performance.now();
    game.running = true;
  }
  function stopClock() {
    if (game.running) {
      game.base += performance.now() - game.startedAt;
      game.running = false;
    }
  }
  function resumeClock() {
    if (game.active && !game.locked && !game.running) {
      game.startedAt = performance.now();
      game.running = true;
    }
  }
  function fmt(ms) {
    var s = Math.floor(ms / 1000);
    var m = Math.floor(s / 60);
    var r = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r;
  }
  function paintTimer() { el.timer.textContent = fmt(elapsed()); }
  setInterval(paintTimer, 250);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stopClock(); else resumeClock();
  });

  /* ---------- Utilidades ---------- */
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function plural(n, one, many) {
    return n + ' ' + (n === 1 ? one : many);
  }

  // Elige 2 rondas por fase (sin variantes que choquen entre sí).
  function pickRounds() {
    var chosen = [];
    PLAN.forEach(function (p) {
      var fase = p[0];
      var k = p[1];
      var taken = 0;
      var pool = shuffle(DATA.rondas.filter(function (r) { return r.fase === fase; }));
      pool.forEach(function (r) {
        if (taken >= k) return;
        var clash = chosen.some(function (c) {
          return (r.conflicto || []).indexOf(c.id) !== -1 || (c.conflicto || []).indexOf(r.id) !== -1;
        });
        if (!clash) {
          chosen.push(r);
          taken++;
        }
      });
    });
    return chosen;
  }

  // Orden inicial de la bandeja: nunca el orden correcto.
  function initialTray(n) {
    var order;
    do {
      order = shuffle(Array.from({ length: n }, function (_, i) { return i; }));
    } while (order.every(function (v, i) { return v === i; }));
    return order;
  }

  function slotEl(i) { return el.slots.querySelector('[data-slot="' + i + '"]'); }
  function cardEl(c) { return el.tray.querySelector('[data-card="' + c + '"]'); }

  function setFeedback(text, tone) {
    el.feedback.textContent = text;
    el.feedback.className = 'feedback' + (tone ? ' is-' + tone : '');
  }

  /* ---------- Render ---------- */
  function render(opts) {
    renderTop();
    renderSlots();
    renderTray();
    if (opts && opts.focus) {
      var target = opts.focus();
      if (target && typeof target.focus === 'function') target.focus({ preventScroll: true });
    }
  }

  function renderTop() {
    var r = game.round;
    el.phase.textContent = PHASE_LABEL[r.fase] || '';
    el.roundCount.textContent = 'Ronda ' + (game.index + 1) + ' de ' + game.rounds.length;
    el.mission.textContent = r.consigna;
    el.progress.setAttribute('aria-valuenow', String(game.won));
    el.progress.setAttribute('aria-valuetext', 'Rondas superadas: ' + game.won + ' de ' + game.rounds.length);
    var segs = el.progress.children;
    for (var i = 0; i < segs.length; i++) {
      var cls = 'seg';
      if (game.done[i]) cls += ' done';
      else if (i === game.index) cls += ' current';
      segs[i].className = cls;
    }
  }

  function slotLabel(i, occ, sel) {
    var n = i + 1;
    if (occ === null) {
      return 'Hueco ' + n + ', vacío. ' + (sel ? 'Pulsa para colocar aquí la tarjeta seleccionada.' : 'Selecciona primero una tarjeta.');
    }
    var state = game.marks ? (game.marks[i] === 'ok' ? 'En orden.' : 'Fuera de lugar.') : '';
    var action;
    if (sel && sel.from === 'slot' && sel.slot === i) action = 'Seleccionada. Pulsa para cancelar.';
    else if (sel) action = 'Pulsa para intercambiar la tarjeta seleccionada con esta.';
    else action = 'Pulsa para seleccionarla.';
    return 'Hueco ' + n + ': ' + game.round.pasos[occ] + '. ' + state + ' ' + action;
  }

  function renderSlots() {
    var r = game.round;
    var sel = game.selected;
    var frag = document.createDocumentFragment();
    r.pasos.forEach(function (_, i) {
      var occ = game.slots[i];
      var li = document.createElement('li');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'slot';
      btn.setAttribute('data-slot', String(i));

      var num = document.createElement('span');
      num.className = 'slot-num';
      num.setAttribute('aria-hidden', 'true');
      num.textContent = String(i + 1);

      var text = document.createElement('span');
      text.className = 'slot-text';
      btn.appendChild(num);
      btn.appendChild(text);

      if (occ === null) {
        text.textContent = 'Hueco vacío';
        if (sel) btn.classList.add('is-target');
      } else {
        btn.classList.add('filled');
        text.textContent = r.pasos[occ];
        if (sel && sel.from === 'slot' && sel.slot === i) btn.classList.add('is-selected');
        if (game.marks) {
          var ok = game.marks[i] === 'ok';
          btn.classList.add(ok ? 'ok' : 'bad');
          var tag = document.createElement('span');
          tag.className = 'tag ' + (ok ? 'tag-ok' : 'tag-bad');
          tag.setAttribute('aria-hidden', 'true');
          tag.textContent = ok ? 'En orden' : 'Fuera de lugar';
          btn.appendChild(tag);
        }
      }
      if (!REDUCED && i === game.justPlaced) btn.classList.add('just-placed');
      btn.setAttribute('aria-label', slotLabel(i, occ, sel));
      li.appendChild(btn);
      frag.appendChild(li);
    });
    el.slots.innerHTML = '';
    el.slots.appendChild(frag);
    game.justPlaced = -1;
  }

  function renderTray() {
    var r = game.round;
    var sel = game.selected;
    var fromSlot = !!(sel && sel.from === 'slot');
    el.tray.innerHTML = '';
    el.tray.classList.toggle('is-drop', fromSlot);
    el.trayHint.hidden = !fromSlot;
    if (game.tray.length === 0) {
      var p = document.createElement('p');
      p.className = 'tray-empty';
      p.textContent = 'Todas las tarjetas están colocadas. Comprueba el orden.';
      el.tray.appendChild(p);
    }
    game.tray.forEach(function (c) {
      var isSel = !!(sel && sel.from === 'tray' && sel.id === c);
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'card' + (isSel ? ' is-selected' : '');
      btn.setAttribute('data-card', String(c));
      btn.setAttribute('aria-pressed', isSel ? 'true' : 'false');
      btn.setAttribute('aria-label', 'Tarjeta: ' + r.pasos[c] + '. ' +
        (isSel ? 'Seleccionada. Toca un hueco para colocarla.' : 'Pulsa para seleccionarla.'));
      btn.textContent = r.pasos[c];
      el.tray.appendChild(btn);
    });
    el.trayCount.textContent = game.tray.length + ' sin colocar';
  }

  /* ---------- Interacción por toque (y teclado) ---------- */
  function placedMsg(i) {
    var pending = game.tray.length;
    if (pending === 0) return 'Todas colocadas. Pulsa Comprobar orden.';
    return 'Colocada en el hueco ' + (i + 1) + '. Quedan ' + plural(pending, 'tarjeta', 'tarjetas') + ' por colocar.';
  }

  function tapCard(c) {
    var sel = game.selected;
    if (sel && sel.from === 'tray' && sel.id === c) {
      game.selected = null;
      setFeedback('Selección cancelada.', null);
      render({ focus: function () { return cardEl(c); } });
      return;
    }
    game.selected = { from: 'tray', id: c, slot: -1 };
    Sound.select();
    setFeedback('Seleccionada: ' + game.round.pasos[c] + '. Toca un hueco para colocarla.', 'info');
    render({ focus: function () { return cardEl(c); } });
  }

  function tapSlot(i) {
    var sel = game.selected;
    var occ = game.slots[i];

    if (!sel) {
      if (occ === null) {
        setFeedback('Ese hueco está vacío. Primero toca una tarjeta de la bandeja.', null);
        render({ focus: function () { return slotEl(i); } });
        return;
      }
      game.selected = { from: 'slot', id: occ, slot: i };
      Sound.select();
      setFeedback('Seleccionada desde el hueco ' + (i + 1) + '. Toca otro hueco para moverla, o un espacio de la bandeja para devolverla.', 'info');
      render({ focus: function () { return slotEl(i); } });
      return;
    }

    if (sel.from === 'slot' && sel.slot === i) {
      game.selected = null;
      setFeedback('Selección cancelada.', null);
      render({ focus: function () { return slotEl(i); } });
      return;
    }

    if (sel.from === 'tray') {
      game.slots[i] = sel.id;
      game.tray = game.tray.filter(function (c) { return c !== sel.id; });
      if (occ !== null) {
        game.tray.push(occ);
        setFeedback('Cambiada en el hueco ' + (i + 1) + '. La tarjeta anterior volvió a la bandeja.', null);
      } else {
        setFeedback(placedMsg(i), null);
      }
    } else {
      game.slots[i] = sel.id;
      game.slots[sel.slot] = occ;
      setFeedback('Movida al hueco ' + (i + 1) + '.', null);
    }

    game.selected = null;
    game.marks = null;
    game.justPlaced = i;
    Sound.place();
    render({ focus: function () { return slotEl(i); } });
  }

  function returnSelected() {
    var sel = game.selected;
    if (!sel || sel.from !== 'slot') return;
    game.slots[sel.slot] = null;
    game.tray.push(sel.id);
    game.selected = null;
    game.marks = null;
    Sound.back();
    setFeedback('Tarjeta devuelta a la bandeja. Quedan ' + plural(game.tray.length, 'tarjeta', 'tarjetas') + ' por colocar.', null);
    render({ focus: function () { return cardEl(sel.id); } });
  }

  function clearSlots() {
    var placed = game.slots.filter(function (v) { return v !== null; });
    if (!placed.length) {
      setFeedback('Los huecos ya están vacíos.', null);
      return;
    }
    game.slots = game.slots.map(function () { return null; });
    game.tray = game.tray.concat(placed);
    game.selected = null;
    game.marks = null;
    Sound.back();
    setFeedback('Huecos limpios. Las tarjetas volvieron a la bandeja.', null);
    render({ focus: function () { return cardEl(game.tray[0]); } });
  }

  /* ---------- Comprobación ---------- */
  function checkOrder() {
    var r = game.round;
    var n = r.pasos.length;
    var missing = game.slots.filter(function (v) { return v === null; }).length;
    if (missing > 0) {
      setFeedback('Faltan ' + plural(missing, 'tarjeta', 'tarjetas') + ' por colocar en la línea.', 'hint');
      return;
    }

    game.attempts++;
    game.checksTotal++;
    game.evaluated += n;
    var marks = game.slots.map(function (c, i) { return c === i ? 'ok' : 'bad'; });
    var wrong = marks.filter(function (m) { return m === 'bad'; }).length;
    game.errors += wrong;
    game.marks = marks;

    if (wrong === 0) {
      roundWon();
      return;
    }

    Sound.error();
    var msg = wrong === 1
      ? '1 tarjeta está fuera de lugar. Revísala y vuelve a comprobar.'
      : wrong + ' tarjetas están fuera de lugar. Revisa las marcadas y vuelve a comprobar.';
    if (game.attempts >= 2) msg += ' Pista: ' + r.pista;
    setFeedback(msg, 'error');
    render({ focus: function () { return el.btnCheck; } });
  }

  function roundWon() {
    game.done[game.index] = true;
    game.won++;
    var last = game.index === game.rounds.length - 1;
    if (last) {
      game.locked = true;
      stopClock();
    }
    Sound.round();
    setFeedback('Correcto. Ronda superada.', 'ok');
    render();
    showOverlay(last);
  }

  function showOverlay(last) {
    var r = game.round;
    el.doneNum.textContent = String(game.index + 1);
    el.doneText.textContent = r.retro;
    el.doneRef.textContent = 'Referencia: cuadernillo, ' + r.ref + '.';
    el.btnNext.textContent = last ? 'Ver resultados' : 'Siguiente ronda';
    el.overlay.hidden = false;
    el.main.setAttribute('inert', '');
    el.main.setAttribute('aria-hidden', 'true');
    el.btnNext.focus({ preventScroll: true });
  }

  /* ---------- Flujo de pantallas ---------- */
  function showScreen(name) {
    el.start.hidden = name !== 'start';
    el.game.hidden = name !== 'game';
    el.end.hidden = name !== 'end';
    el.btnHome.hidden = name === 'start';
    el.overlay.hidden = true;
    el.main.removeAttribute('inert');
    el.main.removeAttribute('aria-hidden');
    paintTimer();
  }

  function startRound() {
    var r = game.rounds[game.index];
    var n = r.pasos.length;
    game.round = r;
    game.slots = new Array(n).fill(null);
    game.tray = initialTray(n);
    game.selected = null;
    game.marks = null;
    game.attempts = 0;
    game.justPlaced = -1;
    setFeedback('Toca una tarjeta y después el hueco donde va.', null);
    render({ focus: function () { return cardEl(game.tray[0]); } });
  }

  function startGame() {
    Sound.unlock();
    game.rounds = pickRounds();
    game.index = 0;
    game.done = game.rounds.map(function () { return false; });
    game.won = 0;
    game.errors = 0;
    game.evaluated = 0;
    game.checksTotal = 0;
    game.locked = false;
    game.active = true;
    resultsBridge.start();
    startClock();
    showScreen('game');
    startRound();
  }

  function finishGame() {
    game.active = false;
    stopClock();
    var total = game.rounds.length;
    var precision = game.evaluated ? Math.round(100 * (game.evaluated - game.errors) / game.evaluated) : 0;
    el.stRounds.textContent = game.won + ' / ' + total;
    el.stTime.textContent = fmt(elapsed());
    el.stErrors.textContent = String(game.errors);
    el.stPrecision.textContent = precision + '%';
    Sound.finish();
    showScreen('end');
    el.endTitle.focus({ preventScroll: true });
    resultsBridge.complete({ reason: 'completed', correct: game.evaluated - game.errors, total: game.evaluated, attempts: game.checksTotal, errors: game.errors, durationMs: Math.max(0, Math.round(elapsed())) });
  }

  function goHome() {
    resultsBridge.cancel();
    game.active = false;
    game.selected = null;
    stopClock();
    showScreen('start');
    el.btnStart.focus({ preventScroll: true });
  }

  /* ---------- Eventos ---------- */
  el.btnStart.addEventListener('click', startGame);
  el.btnReplay.addEventListener('click', startGame);
  el.btnHome.addEventListener('click', goHome);
  el.btnEndHome.addEventListener('click', goHome);

  el.btnNext.addEventListener('click', function () {
    el.overlay.hidden = true;
    el.main.removeAttribute('inert');
    el.main.removeAttribute('aria-hidden');
    if (game.index >= game.rounds.length - 1) {
      finishGame();
      return;
    }
    game.index++;
    startRound();
  });

  el.btnClear.addEventListener('click', function () {
    if (!game.active) return;
    Sound.unlock();
    clearSlots();
  });

  el.btnCheck.addEventListener('click', function () {
    if (!game.active) return;
    Sound.unlock();
    checkOrder();
  });

  el.slots.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('button[data-slot]') : null;
    if (!b || !game.active) return;
    Sound.unlock();
    tapSlot(Number(b.getAttribute('data-slot')));
  });

  el.tray.addEventListener('click', function (e) {
    if (!game.active) return;
    Sound.unlock();
    var b = e.target.closest ? e.target.closest('button[data-card]') : null;
    if (b) {
      tapCard(Number(b.getAttribute('data-card')));
      return;
    }
    returnSelected();
  });

  function paintMute() {
    var m = Sound.isMuted();
    el.btnMute.innerHTML = m ? ICON_OFF : ICON_ON;
    el.btnMute.setAttribute('aria-label', 'Silenciar sonido');
    el.btnMute.setAttribute('aria-pressed', m ? 'true' : 'false');
    el.btnMute.setAttribute('title', m ? 'Sonido desactivado' : 'Sonido activado');
  }

  el.btnMute.addEventListener('click', function () {
    Sound.setMuted(!Sound.isMuted());
    paintMute();
    if (!Sound.isMuted()) Sound.select();
  });

  document.addEventListener('keydown', function (e) {
    // El diálogo tiene un solo control: mantener Tab dentro del modal.
    if (!el.overlay.hidden && e.key === 'Tab') {
      e.preventDefault();
      el.btnNext.focus();
      return;
    }
    if (e.key === 'Escape' && game.active && game.selected && el.overlay.hidden) {
      var sel = game.selected;
      game.selected = null;
      setFeedback('Selección cancelada.', null);
      render({ focus: function () { return sel.from === 'slot' ? slotEl(sel.slot) : cardEl(sel.id); } });
    }
  });

  /* ---------- Arranque ---------- */
  function init() {
    el.progress.innerHTML = '';
    for (var i = 0; i < TOTAL; i++) {
      var s = document.createElement('span');
      s.className = 'seg';
      s.setAttribute('aria-hidden', 'true');
      el.progress.appendChild(s);
    }
    paintMute();
    showScreen('start');
  }

  init();
})();
