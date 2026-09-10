// Second Exposure — renderers for the deja vu log.
// Data is embedded in the page (no fetch); the ledger is static HTML,
// so the page degrades to a readable record without JavaScript.

(function () {
  var DATA = JSON.parse(document.getElementById('data').textContent);
  var E = DATA.entries;
  var NS = 'http://www.w3.org/2000/svg';
  var PRESENCE = '#8b7de8', ECHO = '#b5862f', MUTEDP = 'rgba(139,125,232,0.45)';
  var LINE = '#26242f';

  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function txt(node, s) { node.textContent = s; return node; }
  function date(e) { return new Date(e.dt); }
  var T0 = date(E[0]).getTime(), T1 = date(E[E.length - 1]).getTime();
  function fmtTime(e) {
    var h = e.hour % 12 || 12, ap = e.hour < 12 ? 'am' : 'pm';
    return h + ':' + String(e.minute).padStart(2, '0') + ' ' + ap;
  }
  var MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function fmtDate(e) { return MON[e.month - 1] + ' ' + e.day + ', ' + e.year; }

  // ---------- shared tooltip ----------
  var tip = document.createElement('div');
  tip.className = 'tip';
  tip.hidden = true;
  document.body.appendChild(tip);
  function showTip(e, evt) {
    tip.innerHTML = '<span class="when">' + fmtDate(e) + ' · ' + fmtTime(e) + ' · ' + e.weekday + '</span>' + e.context;
    tip.hidden = false;
    var x = evt.pageX + 14, y = evt.pageY + 10;
    if (x + 280 > window.scrollX + document.documentElement.clientWidth) x = evt.pageX - 274;
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
  }
  function hideTip() { tip.hidden = true; }
  function hoverable(node, e) {
    node.style.cursor = 'pointer';
    node.addEventListener('mousemove', function (evt) { showTip(e, evt); });
    node.addEventListener('mouseleave', hideTip);
    node.addEventListener('click', function (evt) {
      if (tip.hidden) showTip(e, evt); else hideTip();
      evt.stopPropagation();
    });
  }
  document.addEventListener('click', hideTip);

  // ---------- 1. hero tick strip ----------
  (function () {
    var svg = document.getElementById('tickstrip');
    if (!svg) return;
    var W = 1000, H = 52;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    E.forEach(function (e, i) {
      var x = 8 + (W - 16) * i / (E.length - 1);
      el('line', { x1: x + 1.5, y1: 14, x2: x + 1.5, y2: 44, stroke: MUTEDP, 'stroke-width': 2 }, svg);
      var t = el('line', { x1: x, y1: 12, x2: x, y2: 42, stroke: PRESENCE, 'stroke-width': 2 }, svg);
      hoverable(t, e);
    });
  })();

  // ---------- 2. the pulse (seismogram) ----------
  function renderPulse() {
    var host = document.getElementById('pulse');
    if (!host) return;
    host.innerHTML = '';
    var vertical = window.innerWidth < 640;
    var years = [2023, 2024, 2025, 2026];
    var counts = DATA.stats.per_year;

    if (!vertical) {
      var W = 1100, H = 200, L = 10, R = 1090, BASE = 120;
      var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H });
      host.appendChild(svg);
      function X(t) { return L + (R - L) * (t - T0) / (T1 - T0); }
      // year bands
      years.forEach(function (y) {
        var a = Math.max(T0, new Date(y, 0, 1).getTime());
        var b = Math.min(T1, new Date(y + 1, 0, 1).getTime());
        if (y === 2023) a = T0;
        el('rect', { x: X(a), y: 24, width: X(b) - X(a), height: 132, fill: y % 2 ? 'rgba(139,125,232,0.045)' : 'none' }, svg);
        txt(el('text', { x: (X(a) + X(b)) / 2, y: 190, 'text-anchor': 'middle', 'class': 'svg-label' }, svg), y + ' — ' + counts[y]);
      });
      el('line', { x1: L, y1: BASE, x2: R, y2: BASE, stroke: LINE, 'stroke-width': 1 }, svg);
      E.forEach(function (e) {
        var x = X(date(e).getTime());
        var h = 34 + (e.hour >= 22 || e.hour < 4 ? 18 : 0);
        el('line', { x1: x + 2, y1: BASE - h + 3, x2: x + 2, y2: BASE, stroke: MUTEDP, 'stroke-width': 2 }, svg);
        var s = el('line', { x1: x, y1: BASE - h, x2: x, y2: BASE, stroke: PRESENCE, 'stroke-width': 2 }, svg);
        hoverable(s, e);
      });
      // drought bracket
      var d0 = X(new Date(2024, 1, 16).getTime()), d1 = X(new Date(2024, 6, 2).getTime());
      el('path', { d: 'M ' + d0 + ' 138 v 8 H ' + d1 + ' v -8', fill: 'none', stroke: '#9a94ac', 'stroke-width': 1 }, svg);
      txt(el('text', { x: (d0 + d1) / 2, y: 162, 'text-anchor': 'middle', 'class': 'svg-label' }, svg), 'the quiet stretch — 136 days of nothing');
      // 18.7h double
      var dbl = E.filter(function (e) { return e.year === 2023 && e.month === 8; });
      var cx = (X(date(dbl[0]).getTime()) + X(date(dbl[1]).getTime())) / 2;
      el('circle', { cx: cx, cy: BASE - 20, r: 15, fill: 'none', stroke: ECHO, 'stroke-width': 1.25 }, svg);
      txt(el('text', { x: cx, y: BASE - 46, 'text-anchor': 'middle', 'class': 'svg-annot' }, svg), 'twice in one day, basically');
    } else {
      var Wv = 340, Hv = 900, TOPv = 16, BOTv = 880, BASEx = 90;
      var svgv = el('svg', { viewBox: '0 0 ' + Wv + ' ' + Hv });
      host.appendChild(svgv);
      function Y(t) { return TOPv + (BOTv - TOPv) * (t - T0) / (T1 - T0); }
      el('line', { x1: BASEx, y1: TOPv, x2: BASEx, y2: BOTv, stroke: LINE, 'stroke-width': 1 }, svgv);
      years.forEach(function (y) {
        var a = Math.max(T0, new Date(y, 0, 1).getTime());
        txt(el('text', { x: 10, y: Y(a) + 14, 'class': 'svg-label strong' }, svgv), y + ' — ' + counts[y]);
      });
      E.forEach(function (e) {
        var y = Y(date(e).getTime());
        var h = 60 + (e.hour >= 22 || e.hour < 4 ? 26 : 0);
        el('line', { x1: BASEx, y1: y + 2, x2: BASEx + h - 3, y2: y + 2, stroke: MUTEDP, 'stroke-width': 2 }, svgv);
        var s = el('line', { x1: BASEx, y1: y, x2: BASEx + h, y2: y, stroke: PRESENCE, 'stroke-width': 2 }, svgv);
        hoverable(s, e);
      });
      var q0 = Y(new Date(2024, 1, 16).getTime()), q1 = Y(new Date(2024, 6, 2).getTime());
      el('path', { d: 'M 60 ' + q0 + ' h -8 V ' + q1 + ' h 8', fill: 'none', stroke: '#9a94ac', 'stroke-width': 1 }, svgv);
      var lbl = txt(el('text', { x: 44, y: (q0 + q1) / 2, 'class': 'svg-label', 'text-anchor': 'middle' }, svgv), '136 days of nothing');
      lbl.setAttribute('transform', 'rotate(-90 44 ' + (q0 + q1) / 2 + ')');
    }
  }

  // ---------- 3. year rings ----------
  (function () {
    var host = document.getElementById('rings');
    if (!host) return;
    var S = 560, C = S / 2;
    var svg = el('svg', { viewBox: '0 0 ' + S + ' ' + S, style: 'max-width:560px' });
    host.appendChild(svg);
    var radii = { 2023: 90, 2024: 140, 2025: 190, 2026: 240 };
    function angle(e) {
      var doy = (Date.UTC(2001, e.month - 1, e.day) - Date.UTC(2001, 0, 1)) / 86400000;
      return doy / 365.25 * 2 * Math.PI - Math.PI / 2;
    }
    function pos(e, r) { var a = angle(e); return [C + r * Math.cos(a), C + r * Math.sin(a)]; }
    // month spokes + labels
    for (var m = 0; m < 12; m++) {
      var a = m / 12 * 2 * Math.PI - Math.PI / 2;
      el('line', { x1: C + 70 * Math.cos(a), y1: C + 70 * Math.sin(a), x2: C + 255 * Math.cos(a), y2: C + 255 * Math.sin(a), stroke: LINE, 'stroke-width': 0.5 }, svg);
      txt(el('text', { x: C + 268 * Math.cos(a + 0.26), y: C + 268 * Math.sin(a + 0.26) + 4, 'text-anchor': 'middle', 'class': 'svg-label' }, svg), MON[m]);
    }
    Object.keys(radii).forEach(function (y) {
      el('circle', { cx: C, cy: C, r: radii[y], fill: 'none', stroke: LINE, 'stroke-width': 1 }, svg);
      txt(el('text', { x: C + 6, y: C - radii[y] - 5, 'class': 'svg-label' }, svg), y);
    });
    // echo chords (amber radial lines joining aligned dots)
    var echoes = DATA.stats.calendar_echoes;
    Object.keys(echoes).forEach(function (mdKey) {
      var pair = E.filter(function (e) { return e.month + '/' + e.day === mdKey; });
      var pts = pair.map(function (e) { return pos(e, radii[e.year]); });
      var a = angle(pair[0]);
      var chord = el('line', {
        x1: C + 70 * Math.cos(a), y1: C + 70 * Math.sin(a),
        x2: C + 255 * Math.cos(a), y2: C + 255 * Math.sin(a),
        stroke: ECHO, 'stroke-width': 1.5, 'class': 'chord', opacity: 0.8
      }, svg);
      chord.style.animation = 'chordpulse 4s ease-in-out infinite';
    });
    var style = document.createElement('style');
    style.textContent = '@keyframes chordpulse { 0%,100% { opacity: 0.8; } 50% { opacity: 0.3; } }';
    document.head.appendChild(style);
    // dots
    E.forEach(function (e) {
      var isEcho = echoes[e.month + '/' + e.day];
      var p = pos(e, radii[e.year]);
      var d = el('circle', { cx: p[0], cy: p[1], r: 5, fill: isEcho ? ECHO : PRESENCE, stroke: '#0f0e14', 'stroke-width': 2 }, svg);
      hoverable(d, e);
    });
  })();

  // ---------- 4. clock ----------
  (function () {
    var host = document.getElementById('clock');
    if (!host) return;
    var S = 480, C = S / 2;
    var svg = el('svg', { viewBox: '0 0 ' + S + ' ' + S, style: 'max-width:480px' });
    host.appendChild(svg);
    function hangle(h, m) { return (h + m / 60) / 24 * 2 * Math.PI - Math.PI / 2; }
    // late-night wedge 22:00–04:00
    var a0 = hangle(22, 0), a1 = hangle(28, 0);
    var R = 190;
    el('path', {
      d: 'M ' + C + ' ' + C +
         ' L ' + (C + R * Math.cos(a0)) + ' ' + (C + R * Math.sin(a0)) +
         ' A ' + R + ' ' + R + ' 0 0 1 ' + (C + R * Math.cos(a1)) + ' ' + (C + R * Math.sin(a1)) + ' Z',
      fill: 'rgba(139,125,232,0.09)'
    }, svg);
    el('circle', { cx: C, cy: C, r: R, fill: 'none', stroke: LINE, 'stroke-width': 1 }, svg);
    [0, 6, 12, 18].forEach(function (h) {
      var a = hangle(h, 0);
      txt(el('text', { x: C + (R + 32) * Math.cos(a), y: C + (R + 32) * Math.sin(a) + 4, 'text-anchor': 'middle', 'class': 'svg-label' }, svg),
        h === 0 ? 'midnight' : h === 12 ? 'noon' : (h % 12) + (h < 12 ? ' am' : ' pm'));
    });
    // dots with outward jitter on hour collisions
    var seen = {};
    E.forEach(function (e) {
      var key = e.hour;
      seen[key] = (seen[key] || 0);
      var r = 150 + seen[key] * 14;
      seen[key]++;
      var a = hangle(e.hour, e.minute);
      var d = el('circle', { cx: C + r * Math.cos(a), cy: C + r * Math.sin(a), r: 5.5, fill: PRESENCE, stroke: '#0f0e14', 'stroke-width': 2 }, svg);
      hoverable(d, e);
    });
    txt(el('text', { x: C + 92 * Math.cos(hangle(1, 0)), y: C + 92 * Math.sin(hangle(1, 0)), 'text-anchor': 'middle', 'class': 'svg-label' }, svg), 'the late shift');
  })();

  // ---------- 5. the same chair (nested regions) ----------
  (function () {
    var host = document.getElementById('chair');
    if (!host) return;
    var W = 620, H = 430;
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, style: 'max-width:620px' });
    host.appendChild(svg);
    // regions
    el('ellipse', { cx: 240, cy: 210, rx: 220, ry: 180, fill: 'none', stroke: LINE, 'stroke-width': 1.25 }, svg);
    el('ellipse', { cx: 200, cy: 235, rx: 125, ry: 105, fill: 'rgba(139,125,232,0.06)', stroke: LINE, 'stroke-width': 1 }, svg);
    txt(el('text', { x: 240, y: 52, 'text-anchor': 'middle', 'class': 'svg-label strong' }, svg), 'home (SF) — 28');
    txt(el('text', { x: 200, y: 168, 'text-anchor': 'middle', 'class': 'svg-label strong' }, svg), 'at the desk — 16');
    txt(el('text', { x: 545, y: 52, 'text-anchor': 'middle', 'class': 'svg-label strong' }, svg), 'elsewhere — 12');
    // deterministic row layout inside each region
    function layoutRows(list, cx, cy, perRow) {
      var pts = [];
      list.forEach(function (e, i) {
        var row = Math.floor(i / perRow), col = i % perRow;
        var rowLen = Math.min(perRow, list.length - row * perRow);
        pts.push([cx + (col - (rowLen - 1) / 2) * 22, cy + row * 22]);
      });
      return pts;
    }
    var desk = E.filter(function (e) { return e.ptype === 'home' && e.desk; });
    var homeNotDesk = E.filter(function (e) { return e.ptype === 'home' && !e.desk; });
    var away = E.filter(function (e) { return e.ptype !== 'home'; });
    var groups = [
      [desk, 200, 205, 5],
      [homeNotDesk, 310, 120, 4],
      [away, 545, 120, 4],
    ];
    groups.forEach(function (g) {
      var pts = layoutRows(g[0], g[1], g[2], g[3]);
      g[0].forEach(function (e, i) {
        var gaming = e.gaming;
        var d = el('circle', {
          cx: pts[i][0], cy: pts[i][1], r: 7,
          fill: gaming ? PRESENCE : MUTEDP,
          stroke: '#0f0e14', 'stroke-width': 2
        }, svg);
        hoverable(d, e);
      });
    });
    // legend
    txt(el('text', { x: 30, y: 415, 'class': 'svg-label' }, svg), '● bright = while gaming (18 of 40) · ● faded = everything else');
  })();

  // ---------- 6. away games (arcs) ----------
  (function () {
    var host = document.getElementById('arcs');
    if (!host) return;
    var away = E.filter(function (e) { return e.ptype !== 'home'; });
    // rough distance order from SF
    var order = ['in uber', 'dim sum', 'hot pot', "simone's house", 'ny home', "opa's", 'Munich', 'Salzburg', 'Interalpen'];
    function rank(e) {
      var s = (e.place + ' ' + e.context).toLowerCase();
      for (var i = 0; i < order.length; i++) if (s.indexOf(order[i].toLowerCase()) >= 0) return i;
      return order.length;
    }
    away.sort(function (a, b) { return rank(a) - rank(b); });
    var W = 1000, H = 360, BASE = 300, X0 = 60;
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H });
    host.appendChild(svg);
    el('line', { x1: 20, y1: BASE, x2: W - 20, y2: BASE, stroke: LINE, 'stroke-width': 1 }, svg);
    txt(el('text', { x: X0, y: BASE + 24, 'text-anchor': 'middle', 'class': 'svg-label strong' }, svg), 'home, SF');
    el('circle', { cx: X0, cy: BASE, r: 5, fill: PRESENCE }, svg);
    // terminus per unique landing point (both Interalpen arcs share one)
    var landings = {};
    var nextX = 165;
    away.forEach(function (e) {
      var key = (e.place + e.context).toLowerCase().indexOf('interalpen') >= 0 ? 'Interalpen' : e.place;
      if (!(key in landings)) { landings[key] = nextX; nextX += 92; }
    });
    away.forEach(function (e, i) {
      var key = (e.place + e.context).toLowerCase().indexOf('interalpen') >= 0 ? 'Interalpen' : e.place;
      var x = landings[key];
      var h = 40 + (x - X0) * 0.28;
      var isInter = key === 'Interalpen';
      var arc = el('path', {
        d: 'M ' + X0 + ' ' + BASE + ' Q ' + (X0 + (x - X0) / 2) + ' ' + (BASE - h) + ' ' + x + ' ' + BASE,
        fill: 'none',
        stroke: isInter ? ECHO : PRESENCE,
        'stroke-width': 1.75,
        opacity: 0.85
      }, svg);
      hoverable(arc, e);
    });
    Object.keys(landings).forEach(function (key) {
      var x = landings[key];
      var isInter = key === 'Interalpen';
      el('circle', { cx: x, cy: BASE, r: 5, fill: isInter ? ECHO : PRESENCE }, svg);
      if (isInter) el('circle', { cx: x, cy: BASE, r: 11, fill: 'none', stroke: ECHO, 'stroke-width': 1 }, svg);
      var label = key === 'ny home' ? 'NY home'
        : key.indexOf('uber') >= 0 ? 'an Uber, SF'
        : key.indexOf('hot pot') >= 0 ? 'hot pot, SF'
        : key.indexOf('dim sum') >= 0 ? 'dim sum, LA'
        : key.indexOf('simone') >= 0 ? 'Colorado'
        : key.indexOf('opa') >= 0 ? 'Connecticut'
        : key;
      var t = txt(el('text', { x: x, y: BASE + 24, 'text-anchor': 'middle', 'class': 'svg-label' }, svg), label);
      if (isInter) {
        txt(el('text', { x: x, y: BASE + 42, 'text-anchor': 'middle', 'class': 'svg-annot' }, svg), 'landed here twice:');
        txt(el('text', { x: x, y: BASE + 56, 'text-anchor': 'middle', 'class': 'svg-annot' }, svg), '7/29/25 and 7/29/26');
      }
    });
  })();

  // ---------- 7. echo tags in the ledger ----------
  document.querySelectorAll('.echo-tag').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var twin = document.getElementById(btn.getAttribute('data-twin'));
      if (!twin) return;
      twin.scrollIntoView({ behavior: 'smooth', block: 'center' });
      twin.classList.remove('flash');
      void twin.offsetWidth;
      twin.classList.add('flash');
    });
  });

  renderPulse();
  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(renderPulse, 200);
  });
})();
