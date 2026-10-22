// Plate and Play: fills the page from the "Plate and Play: content" Google Sheet.
// The markup in index.html / fa.html is episode 1 and stays as-is if the sheet can't be read.
(function () {
  var SHEET_ID = '1KT9mo5vbhGUllbqroTdoK_O6MAn3-nmtPEZ2NsKeB3g';
  var LANG = document.documentElement.lang === 'fa' ? 'fa' : 'en';

  var FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
  var num = function (x) {
    return LANG === 'fa' ? String(x).replace(/[0-9]/g, function (d) { return FA_DIGITS[d]; }) : String(x);
  };
  var pad = function (x) { return num(String(x).length < 2 ? '0' + x : x); };

  var T = {
    en: {
      hints: ['Cook the dish and play the game to collect both.', 'Halfway there. One more to go.', 'Full plate, game won. See you next episode.'],
      cooked: ['I cooked it', 'Plate collected'], played: ['I played it', 'Play collected'],
      copy: ['Copy the list', 'Copied'],
      score: function (s) { return s + ' / 2'; },
      bought: function (a, b) { return a + ' of ' + b; },
      episode: function (n) { return 'Episode ' + n; },
      tip: function (t) { return 'Tip: ' + t.charAt(0).toLowerCase() + t.slice(1); },
      minutes: function (m) {
        if (m < 60) return m + ' min';
        var h = m / 60;
        return (h === Math.floor(h) ? h : h.toFixed(1)) + (h === 1 ? ' hour' : ' hours');
      },
      serves: function (n) { return 'Serves ' + n; },
      players: function (n) { return n + '+ players'; },
      gameMinutes: function (m) { return m + ' min'; },
      title: function (ep) { return ep.dish + ' and ' + ep.game + ' · Plate and Play'; }
    },
    fa: {
      hints: ['غذا را بپز و بازی را انجام بده تا هر دو را جمع کنی.', 'نصف راه را رفتی. یکی دیگر مانده.', 'بشقاب پر، بازی برده. تا قسمت بعد!'],
      cooked: ['پختمش', 'بشقاب جمع شد'], played: ['بازی‌اش کردم', 'بازی جمع شد'],
      copy: ['کپی فهرست', 'کپی شد'],
      score: function (s) { return s + ' از ' + num(2); },
      bought: function (a, b) { return a + ' از ' + b; },
      episode: function (n) { return 'قسمت ' + n; },
      tip: function (t) { return 'نکته: ' + t; },
      minutes: function (m) {
        if (m < 60) return num(m) + ' دقیقه';
        var h = m / 60;
        return num(h === Math.floor(h) ? h : h.toFixed(1)) + ' ساعت';
      },
      serves: function (n) { return 'برای ' + n + ' نفر'; },
      players: function (n) { return n + ' نفر یا بیشتر'; },
      gameMinutes: function (m) { return m + ' دقیقه'; },
      title: function (ep) { return ep.dish + ' و ' + ep.game + ' · بشقاب و بازی'; }
    }
  }[LANG];

  // ---- Score and shopping list ----

  var state = { cooked: false, played: false };
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var bind = function (key, text) { $('[data-bind="' + key + '"]').textContent = text; };
  var cookedBtn = $('#cooked');
  var playedBtn = $('#played');
  var coinBase = cookedBtn.style.cssText.replace(/background:.*$/, '');
  var coin = function (on, fg, bg) {
    return coinBase + (on ? 'background: ' + bg + '; color: ' + fg + '; border: 2px solid ' + bg
      : 'background: transparent; color: #FFFFFF; border: 2px dashed #9C7F86');
  };

  function renderScore() {
    var score = (state.cooked ? 1 : 0) + (state.played ? 1 : 0);
    bind('scoreText', T.score(num(score)));
    bind('scoreHint', T.hints[score]);
    bind('cookedLabel', T.cooked[state.cooked ? 1 : 0]);
    bind('playedLabel', T.played[state.played ? 1 : 0]);
    cookedBtn.setAttribute('aria-pressed', state.cooked);
    playedBtn.setAttribute('aria-pressed', state.played);
    cookedBtn.style.cssText = coin(state.cooked, '#FFFFFF', '#A3182F');
    playedBtn.style.cssText = coin(state.played, '#1E1B4B', '#FFD84D');
  }

  function renderBought() {
    var boxes = $$('input[data-item]');
    var bought = boxes.filter(function (b) { return b.checked; }).length;
    bind('boughtText', T.bought(num(bought), num(boxes.length)));
  }

  cookedBtn.addEventListener('click', function () { state.cooked = !state.cooked; renderScore(); });
  playedBtn.addEventListener('click', function () { state.played = !state.played; renderScore(); });
  document.addEventListener('change', function (e) { if (e.target.matches('input[data-item]')) renderBought(); });

  $('#copy-list').addEventListener('click', function () {
    var text = $$('[data-list="items"] label').map(function (row) {
      return $('[data-f="label"]', row).textContent + ' — ' + $('[data-f="qty"]', row).textContent;
    }).join('\n');
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(text).then(function () {
      bind('copyLabel', T.copy[1]);
      setTimeout(function () { bind('copyLabel', T.copy[0]); }, 2000);
    }, function () {});
  });

  $('#print-rules').addEventListener('click', function (e) { e.preventDefault(); window.print(); });

  // ---- Content from the sheet ----

  function parseCsv(text) {
    var rows = [], row = [], field = '', quoted = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (quoted) {
        if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
        else if (c === '"') quoted = false;
        else field += c;
      } else if (c === '"') quoted = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c !== '\r') field += c;
    }
    if (field || row.length) { row.push(field); rows.push(row); }
    var head = rows.shift() || [];
    return rows.map(function (r) {
      var o = {};
      head.forEach(function (h, j) { o[h.trim()] = (r[j] || '').trim(); });
      return o;
    });
  }

  function loadTab(name) {
    var url = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent(name);
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error(name + ': ' + r.status);
      return r.text();
    }).then(parseCsv);
  }

  var byOrder = function (a, b) { return Number(a.order) - Number(b.order); };
  var text = function (row, key) { return row[key + '_' + LANG] || row[key + '_fa'] || ''; };

  function setField(name, value) {
    $$('[data-f="' + name + '"]').forEach(function (el) {
      if (el.closest('[data-list]')) return;
      if (value) { el.textContent = value; el.hidden = false; } else el.hidden = true;
    });
  }

  // Rebuilds a list from rows, reusing the existing children as templates in turn
  // so the hand-set colors and tilts keep cycling.
  function fillList(name, rows, fill) {
    var box = $('[data-list="' + name + '"]');
    if (!box.templates) box.templates = $$(':scope > *', box).map(function (el) { return el.cloneNode(true); });
    box.textContent = '';
    rows.forEach(function (row, i) {
      var el = box.templates[i % box.templates.length].cloneNode(true);
      fill(el, row, i);
      box.appendChild(el);
    });
  }
  var put = function (el, key, value) { var t = $('[data-f="' + key + '"]', el); if (t) t.textContent = value; };

  function render(episodes, ingredients, steps) {
    var published = episodes.filter(function (e) { return /^true$/i.test(e.published) && e.id; })
      .sort(function (a, b) { return Number(a.id) - Number(b.id); });
    if (!published.length) return;
    var wanted = new URLSearchParams(location.search).get('ep');
    var ep = published.filter(function (e) { return e.id === wanted; })[0] || published[published.length - 1];
    var id = ep.id;

    var info = { dish: text(ep, 'dish'), game: text(ep, 'game') };
    document.title = T.title(info);
    setField('dish', info.dish);
    setField('dishIntro', text(ep, 'dish_intro'));
    setField('game', info.game);
    setField('gameIntro', text(ep, 'game_intro'));
    setField('why', text(ep, 'why'));
    setField('tip', text(ep, 'tip') && T.tip(text(ep, 'tip')));
    setField('epNum', pad(id));
    setField('cookTime', ep.cook_minutes && T.minutes(Number(ep.cook_minutes)));
    setField('serves', ep.serves && T.serves(num(ep.serves)));
    setField('players', ep.players_min && T.players(num(ep.players_min)));
    setField('gameTime', ep.game_minutes && T.gameMinutes(num(ep.game_minutes)));

    var watch = $('#watch');
    watch.hidden = !ep.youtube_url;
    if (ep.youtube_url) watch.href = ep.youtube_url;

    var art = $('#dish-art'), photo = $('#dish-photo');
    if (ep.photo_url) {
      if (!photo) {
        photo = document.createElement('img');
        photo.id = 'dish-photo';
        photo.style.cssText = 'align-self: center; margin-top: 8px; width: 280px; height: 250px; object-fit: cover; border-radius: 24px';
        art.parentNode.insertBefore(photo, art);
      }
      photo.src = ep.photo_url;
      photo.alt = info.dish;
      art.style.display = 'none';
    }

    var mine = function (rows) { return rows.filter(function (r) { return r.episode_id === id; }); };
    var kind = function (k) { return mine(steps).filter(function (s) { return s.kind === k; }).sort(byOrder); };

    fillList('items', mine(ingredients).sort(byOrder), function (el, row) {
      put(el, 'label', text(row, 'item'));
      put(el, 'qty', text(row, 'amount'));
    });
    fillList('cook', kind('cook'), function (el, row, i) { put(el, 'n', num(i + 1)); put(el, 'text', text(row, 'text')); });
    fillList('play', kind('play'), function (el, row, i) { put(el, 'n', num(i + 1)); put(el, 'text', text(row, 'text')); });
    fillList('need', kind('need'), function (el, row) { el.textContent = text(row, 'text'); });
    renderBought();

    var others = published.filter(function (e) { return e !== ep; });
    $('#episodes').hidden = !others.length;
    fillList('episodes', others, function (el, row) {
      el.href = '?ep=' + encodeURIComponent(row.id);
      put(el, 'num', T.episode(pad(row.id)));
      put(el, 'dish', text(row, 'dish'));
      put(el, 'game', text(row, 'game'));
    });

    var other = $('#lang-switch');
    other.href = other.getAttribute('href').split('?')[0] + '?ep=' + encodeURIComponent(id);
  }

  renderScore();
  renderBought();
  Promise.all([loadTab('Episodes'), loadTab('Ingredients'), loadTab('Steps')])
    .then(function (tabs) { render(tabs[0], tabs[1], tabs[2]); })
    .catch(function (err) { console.warn('Plate and Play: showing built-in episode, sheet not loaded.', err); });
})();
