/* LJ Web Management site script.
   Shared by www.ljwebmanagement.com (assets/js/site.js) and
   blog.ljwebmanagement.com (assets/js/site.js). Keep both copies identical.
   Handles the header menus, the site search dialog, list filters, the
   article table of contents and a few small page behaviors. */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  root.classList.add('lj-js');

  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }
  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------- Header ---------- */
  var header = $('[data-lj-header]');
  var desktop = window.matchMedia('(min-width: 1041px)');

  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    var menus = $$('.lj-has-menu', header);
    var closeTimer = null;
    var hovered = null;

    var setMenu = function (item, open) {
      item.classList.toggle('is-open', open);
      var btn = $('.lj-nav-link', item);
      if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    var closeAll = function (except) {
      menus.forEach(function (m) { if (m !== except) setMenu(m, false); });
    };

    menus.forEach(function (item) {
      var btn = $('.lj-nav-link', item);
      btn.addEventListener('click', function (e) {
        // A mouse hovering the item has already opened its menu, so a click
        // keeps it open instead of toggling it shut. Keyboard activation
        // (detail 0) and touch still toggle.
        var keepOpen = desktop.matches && e.detail > 0 && hovered === item;
        var open = keepOpen || !item.classList.contains('is-open');
        closeAll(item);
        setMenu(item, open);
      });
      item.addEventListener('pointerenter', function (e) {
        if (e.pointerType !== 'mouse' || !desktop.matches) return;
        hovered = item;
        clearTimeout(closeTimer);
        closeAll(item);
        setMenu(item, true);
      });
      item.addEventListener('pointerleave', function (e) {
        if (e.pointerType !== 'mouse' || !desktop.matches) return;
        if (hovered === item) hovered = null;
        closeTimer = setTimeout(function () { setMenu(item, false); }, 140);
      });
      item.addEventListener('focusout', function (e) {
        if (desktop.matches && !item.contains(e.relatedTarget)) setMenu(item, false);
      });
    });

    doc.addEventListener('click', function (e) {
      if (!e.target.closest('.lj-has-menu')) closeAll();
    });

    var burger = $('.lj-burger', header);
    var setNav = function (open) {
      header.classList.toggle('is-nav-open', open);
      doc.body.classList.toggle('lj-nav-open', open);
      if (burger) {
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      }
    };
    if (burger) {
      burger.addEventListener('click', function () { setNav(!header.classList.contains('is-nav-open')); });
    }
    desktop.addEventListener && desktop.addEventListener('change', function () { setNav(false); closeAll(); });

    doc.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var openItem = $('.lj-has-menu.is-open', header);
      if (openItem) {
        setMenu(openItem, false);
        $('.lj-nav-link', openItem).focus();
      } else if (header.classList.contains('is-nav-open')) {
        setNav(false);
        burger.focus();
      }
    });
  }

  /* ---------- Search dialog ---------- */
  var dialog = $('#lj-search');
  if (dialog && typeof dialog.showModal === 'function') {
    var input = $('#lj-search-input', dialog);
    var results = $('#lj-search-results', dialog);
    var hint = $('[data-lj-search-hint]', dialog);
    var status = $('[data-lj-search-status]', dialog);
    var announce = function (text) { if (status) status.textContent = text; };
    var base = (header && header.getAttribute('data-lj-base')) || '';
    var index = null;
    var loading = false;
    var active = -1;
    var current = [];
    var TYPE_BOOST = { Category: 7, Industry: 6, Course: 6, Guide: 5, Quiz: 5, Calculator: 5, Term: 5, Tool: 4, Page: 4, Lesson: 4, Article: 1, Automation: 0 };

    var loadIndex = function () {
      if (index || loading) return;
      loading = true;
      var items = [];
      var pending = 1;
      var done = function () {
        pending -= 1;
        if (pending > 0) return;
        index = items;
        if (input.value) render(input.value);
      };
      var s = doc.createElement('script');
      s.src = dialog.getAttribute('data-lj-index');
      s.async = true;
      s.onload = function () {
        (window.LJ_SEARCH_INDEX || []).forEach(function (r) {
          items.push({ type: r[0], title: r[1], sub: r[2], url: (r[3].charAt(0) === '/' ? base : '') + r[3], extra: r[4] || '' });
        });
        done();
      };
      s.onerror = done;
      doc.head.appendChild(s);

      var postsUrl = dialog.getAttribute('data-lj-posts');
      if (postsUrl && window.fetch) {
        pending += 1;
        fetch(postsUrl).then(function (r) { return r.json(); }).then(function (posts) {
          posts.forEach(function (p) {
            items.push({ type: 'Article', title: p.title, sub: 'Blog · ' + (p.dateDisplay || p.date), url: '/posts/' + p.slug + '.html', extra: p.excerpt || '' });
          });
          done();
        }).catch(done);
      }
    };

    var tokenize = function (q) {
      return q.toLowerCase().replace(/[^a-z0-9&\s-]/g, ' ').split(/\s+/).filter(Boolean);
    };

    var highlight = function (text, tokens) {
      var out = escapeHtml(text);
      tokens.forEach(function (t) {
        if (t.length < 2) return;
        var re = new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
        out = out.replace(re, '<mark>$1</mark>');
      });
      return out;
    };

    var render = function (q) {
      var tokens = tokenize(q);
      hint.hidden = tokens.length > 0;
      if (!tokens.length) { results.innerHTML = ''; current = []; announce(''); return; }
      if (!index) {
        results.innerHTML = '<li class="lj-search-none">Loading&hellip;</li>';
        return;
      }
      var phrase = tokens.join(' ');
      var scored = [];
      for (var i = 0; i < index.length; i++) {
        var it = index[i];
        var title = it.title.toLowerCase();
        var hay = title + ' ' + it.sub.toLowerCase() + ' ' + it.extra.toLowerCase();
        var ok = true, score = TYPE_BOOST[it.type] || 0;
        for (var j = 0; j < tokens.length; j++) {
          if (hay.indexOf(tokens[j]) === -1) { ok = false; break; }
          if (title.indexOf(tokens[j]) !== -1) score += 4;
        }
        if (!ok) continue;
        if (title.indexOf(phrase) !== -1) score += 10;
        if (title.indexOf(phrase) === 0) score += 4;
        scored.push([score, it]);
      }
      scored.sort(function (a, b) { return b[0] - a[0] || a[1].title.length - b[1].title.length; });
      current = scored.slice(0, 40).map(function (s) { return s[1]; });
      active = current.length ? 0 : -1;
      if (!current.length) {
        results.innerHTML = '<li class="lj-search-none">No matches for &ldquo;' + escapeHtml(q) + '&rdquo;. Try a tool name, a role, or a task like &ldquo;reminder&rdquo;.</li>';
        announce('No matches');
        return;
      }
      results.innerHTML = current.map(function (it, i) {
        return '<li><a href="' + escapeHtml(it.url) + '"' + (i === active ? ' class="is-active"' : '') + '>' +
          '<span class="lj-search-type">' + it.type + '</span>' +
          '<span><strong>' + highlight(it.title, tokens) + '</strong><small>' + escapeHtml(it.sub) + '</small></span>' +
          '</a></li>';
      }).join('');
      announce(scored.length + (scored.length === 1 ? ' result' : ' results') + (scored.length > current.length ? ', showing the top ' + current.length : ''));
    };

    var move = function (delta) {
      var links = $$('a', results);
      if (!links.length) return;
      active = (active + delta + links.length) % links.length;
      links.forEach(function (a, i) {
        a.classList.toggle('is-active', i === active);
      });
      links[active].scrollIntoView({ block: 'nearest' });
    };

    var open = function (q) {
      if (dialog.open) return;
      loadIndex();
      dialog.showModal();
      doc.body.style.overflow = 'hidden';
      if (typeof q === 'string') input.value = q;
      render(input.value);
      input.focus();
      input.select();
    };
    var close = function () { if (dialog.open) dialog.close(); };
    dialog.addEventListener('close', function () { doc.body.style.overflow = ''; });

    doc.addEventListener('click', function (e) {
      var opener = e.target.closest('[data-lj-search-open]');
      if (opener) {
        e.preventDefault();
        open(opener.getAttribute('data-lj-search-query') || undefined);
        return;
      }
      if (e.target.closest('[data-lj-search-close]') || e.target === dialog) close();
      var chip = e.target.closest('[data-lj-q]');
      if (chip && dialog.contains(chip)) {
        input.value = chip.getAttribute('data-lj-q');
        render(input.value);
        input.focus();
      }
    });
    input.addEventListener('input', function () { render(input.value); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Enter') {
        var link = $('a.is-active', results);
        if (link) { e.preventDefault(); window.location.href = link.href; }
      }
    });
    doc.addEventListener('keydown', function (e) {
      var tag = (e.target.tagName || '').toLowerCase();
      var typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
      if ((e.key === '/' && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        open();
      }
    });
  }

  /* ---------- List filters (industry, category, tool and hub pages) ---------- */
  $$('[data-lj-filter]').forEach(function (scope) {
    var q = $('[data-lj-filter-q]', scope);
    var chips = $$('[data-lj-filter-cat]', scope);
    var select = $('[data-lj-filter-select]', scope);
    var items = $$('[data-lj-item]', scope);
    var groups = $$('[data-lj-group]', scope);
    var status = $('[data-lj-filter-status]', scope);
    var empty = $('[data-lj-filter-empty]', scope);
    var cat = '';
    var ind = '';
    var total = items.length;
    var noun = scope.getAttribute('data-lj-noun') || 'automations';

    var apply = function () {
      var tokens = q ? q.value.toLowerCase().split(/\s+/).filter(Boolean) : [];
      var shown = 0;
      items.forEach(function (el) {
        var text = el.getAttribute('data-text') || el.textContent.toLowerCase();
        var ok = (!cat || el.getAttribute('data-cat') === cat) && (!ind || el.getAttribute('data-ind') === ind) && tokens.every(function (t) { return text.indexOf(t) !== -1; });
        el.hidden = !ok;
        if (ok) shown += 1;
      });
      groups.forEach(function (g) {
        g.hidden = !$$('[data-lj-item]', g).some(function (el) { return !el.hidden; });
      });
      if (status) status.textContent = shown === total ? total + ' ' + noun : 'Showing ' + shown + ' of ' + total + ' ' + noun;
      if (empty) empty.hidden = shown !== 0;
    };

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        cat = chip.getAttribute('data-lj-filter-cat');
        chips.forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
        apply();
      });
    });
    if (q) q.addEventListener('input', apply);
    if (select) select.addEventListener('change', function () { ind = select.value; apply(); });
    var initial = window.location.hash.match(/^#cat-(.+)$/);
    if (initial) {
      var match = chips.filter(function (c) { return c.getAttribute('data-lj-filter-cat') === initial[1]; })[0];
      if (match) match.click();
    }
  });

  /* ---------- Article table of contents ---------- */
  var tocLinks = $$('.lj-toc a');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var byId = {};
    tocLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var visible = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting; });
      var first = tocLinks.filter(function (a) { return visible[a.getAttribute('href').slice(1)]; })[0];
      if (first) {
        tocLinks.forEach(function (a) { a.classList.toggle('is-active', a === first); });
      }
    }, { rootMargin: '-80px 0px -60% 0px' });
    Object.keys(byId).forEach(function (id) {
      var h = doc.getElementById(id);
      if (h) io.observe(h);
    });
  }

  /* ---------- Wide tables: keyboard scrolling ---------- */
  // Article tables scroll sideways on small screens; a table that overflows
  // must be focusable so keyboard users can scroll it too.
  var tables = $$('.lj-prose table');
  if (tables.length) {
    var markScrollable = function () {
      tables.forEach(function (t) {
        if (t.scrollWidth > t.clientWidth + 1) t.setAttribute('tabindex', '0');
        else t.removeAttribute('tabindex');
      });
    };
    markScrollable();
    window.addEventListener('resize', markScrollable);
  }

  /* ---------- Reveal on scroll ---------- */
  var reveals = $$('.lj-reveal');
  if (reveals.length) {
    if ('IntersectionObserver' in window) {
      var ro = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('is-visible'); ro.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px' });
      reveals.forEach(function (el) { ro.observe(el); });
    } else {
      reveals.forEach(function (el) { el.classList.add('is-visible'); });
    }
  }

  /* ---------- Click-to-play video ---------- */
  $$('[data-lj-video]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var video = doc.createElement('video');
      video.src = btn.getAttribute('data-lj-video');
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      video.className = 'lj-video';
      video.setAttribute('width', '1920');
      video.setAttribute('height', '1080');
      var captions = btn.getAttribute('data-lj-captions');
      if (captions) {
        var track = doc.createElement('track');
        track.kind = 'captions';
        track.src = captions;
        track.srclang = 'en';
        track.label = 'English';
        track.default = true;
        video.appendChild(track);
      }
      btn.parentNode.replaceChild(video, btn);
      video.play().catch(function () {});
    }, { once: true });
  });

  /* ---------- Privacy choices: cookie banner and settings ---------- */
  // Analytics stay off until the visitor accepts them. The choice is stored
  // in a first-party cookie shared by www and the blog; a Global Privacy
  // Control or Do Not Track signal counts as "no" unless the visitor turns
  // analytics on themselves. The loader itself lives in chrome.analytics().
  var banner = $('#lj-consent');
  var panel = $('#lj-consent-panel');
  if (banner && panel && typeof panel.showModal === 'function') {
    var NAME = banner.getAttribute('data-lj-consent-cookie');
    var VERSION = banner.getAttribute('data-lj-consent-version');
    var toggle = $('#lj-consent-analytics', panel);
    var signal = navigator.globalPrivacyControl === true || navigator.doNotTrack === '1' || window.doNotTrack === '1';
    var shared = /(^|\.)ljwebmanagement\.com$/.test(window.location.hostname) ? '; Domain=.ljwebmanagement.com' : '';

    // true = analytics allowed, false = declined, null = no valid choice yet.
    var readChoice = function () {
      var m = doc.cookie.match(new RegExp('(?:^|;\\s*)' + NAME + '=([^;]*)'));
      if (!m) return null;
      var v = decodeURIComponent(m[1]).split('|');
      return v[0] === VERSION ? v[1] === 'a1' : null;
    };
    var writeChoice = function (on) {
      var value = [VERSION, on ? 'a1' : 'a0', new Date().toISOString().slice(0, 10)].join('|');
      doc.cookie = NAME + '=' + encodeURIComponent(value) + '; Max-Age=31536000; Path=/; SameSite=Lax' + shared + (window.location.protocol === 'https:' ? '; Secure' : '');
    };
    var clearAnalyticsCookies = function () {
      doc.cookie.split(';').forEach(function (c) {
        var name = c.split('=')[0].trim();
        if (!/^(_ga|_gid|_gat|_clck|_clsk|_cltk|CLID)/.test(name)) return;
        ['', '; Domain=' + window.location.hostname, shared].forEach(function (d) {
          doc.cookie = name + '=; Max-Age=0; Path=/' + d;
        });
      });
    };
    var placeBanner = function () {
      doc.documentElement.style.setProperty('--lj-consent-h', banner.hidden ? '0px' : banner.offsetHeight + 12 + 'px');
    };
    var showBanner = function (show) {
      // Keyboard and screen reader users reach the banner right after the
      // skip link instead of at the very end of the page.
      if (show && banner.previousElementSibling !== $('.lj-skip')) {
        var skip = $('.lj-skip');
        doc.body.insertBefore(banner, skip ? skip.nextSibling : doc.body.firstChild);
      }
      banner.hidden = !show;
      placeBanner();
    };
    var renderStatus = function () {
      var choice = readChoice();
      var text = choice === true ? 'Optional analytics are on. You can turn them off at any time.'
        : signal && choice !== false ? 'Optional analytics are off because your browser sent a Global Privacy Control or Do Not Track signal.'
          : choice === false ? 'Optional analytics are off.' : 'You have not made a choice yet, so optional analytics are off.';
      $$('[data-lj-consent-status]').forEach(function (el) { el.textContent = text; });
    };
    var applyChoice = function (on) {
      var wasLoaded = window.ljAnalytics && window.ljAnalytics.loaded();
      writeChoice(on);
      showBanner(false);
      if (panel.open) panel.close();
      renderStatus();
      if (on) {
        if (window.ljAnalytics) window.ljAnalytics.arm();
      } else {
        clearAnalyticsCookies();
        // Scripts that already ran cannot be unloaded; reload without them.
        if (wasLoaded) window.location.reload();
      }
    };
    var openPanel = function () {
      var choice = readChoice();
      toggle.checked = choice === true;
      $('[data-lj-consent-signal]', panel).hidden = !(signal && choice !== true);
      panel.showModal();
    };

    doc.addEventListener('click', function (e) {
      var set = e.target.closest('[data-lj-consent-set]');
      if (set) { applyChoice(set.getAttribute('data-lj-consent-set') === '1'); return; }
      if (e.target.closest('[data-lj-consent-open]')) { e.preventDefault(); openPanel(); return; }
      if (e.target.closest('[data-lj-consent-save]')) { applyChoice(toggle.checked); return; }
      if (e.target.closest('[data-lj-consent-close]') || e.target === panel) panel.close();
    });
    window.addEventListener('resize', function () { if (!banner.hidden) placeBanner(); });

    if (readChoice() === null && !signal) showBanner(true);
    renderStatus();
  }

  /* ---------- Highlight a solution reached by #anchor ---------- */
  if (window.location.hash) {
    var target = doc.getElementById(window.location.hash.slice(1));
    if (target && target.classList.contains('lj-sol')) {
      target.classList.add('is-highlight');
      setTimeout(function () { target.classList.remove('is-highlight'); }, 2600);
    }
  }
})();
