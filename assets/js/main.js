// Blog home: search, topic filters, sorting and pagination. The first page
// of cards is already in the HTML (built by scripts/templates.js), so nothing
// is re-rendered until the visitor searches, filters, sorts or changes page.
// State is mirrored in the URL (?topic=, ?q=, ?sort=, ?page=) so filtered
// views can be shared and linked to from posts.
(function () {
  'use strict';

  var container = document.getElementById('posts-list');
  var pagination = document.getElementById('pagination');
  var status = document.getElementById('posts-status');
  var searchInput = document.getElementById('search-input');
  var sortSelect = document.getElementById('sort-select');
  var chips = Array.prototype.slice.call(document.querySelectorAll('#topic-chips [data-topic]'));
  if (!container || !pagination || !searchInput || !sortSelect) return;

  var PAGE_SIZE = parseInt(container.getAttribute('data-page-size'), 10) || 18;
  var CARD_SIZES = '(max-width: 640px) calc(100vw - 32px), (max-width: 960px) 45vw, 380px';
  var ARROW = '<svg class="lj-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>';
  var allPosts = null;
  var loading = null;
  var state = { topic: '', q: '', sort: 'date-desc', page: 1 };

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function loadPosts() {
    if (allPosts) return Promise.resolve(allPosts);
    if (!loading) {
      loading = fetch('/posts.json', { cache: 'no-cache' })
        .then(function (res) {
          if (!res.ok) throw new Error('Could not load posts.json');
          return res.json();
        })
        .then(function (posts) {
          allPosts = posts || [];
          return allPosts;
        })
        .catch(function () {
          loading = null;
          return [];
        });
    }
    return loading;
  }

  function isDefault() {
    return !state.topic && !state.q && state.sort === 'date-desc';
  }

  function readUrl() {
    var params = new URLSearchParams(window.location.search);
    state.topic = params.get('topic') || '';
    state.q = params.get('q') || '';
    state.sort = params.get('sort') || 'date-desc';
    state.page = Math.max(1, parseInt(params.get('page'), 10) || 1);
    searchInput.value = state.q;
    sortSelect.value = state.sort;
    if (sortSelect.value !== state.sort) { state.sort = 'date-desc'; sortSelect.value = state.sort; }
    syncChips();
  }

  function writeUrl() {
    var params = new URLSearchParams();
    if (state.topic) params.set('topic', state.topic);
    if (state.q) params.set('q', state.q);
    if (state.sort !== 'date-desc') params.set('sort', state.sort);
    if (state.page > 1) params.set('page', state.page);
    var qs = params.toString();
    history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : '') + window.location.hash);
  }

  function syncChips() {
    chips.forEach(function (c) {
      c.setAttribute('aria-pressed', c.getAttribute('data-topic') === state.topic ? 'true' : 'false');
    });
  }

  function comparator(sort) {
    switch (sort) {
      case 'date-asc': return function (a, b) { return new Date(a.date) - new Date(b.date); };
      case 'title-asc': return function (a, b) { return a.title.localeCompare(b.title); };
      case 'title-desc': return function (a, b) { return b.title.localeCompare(a.title); };
      default: return function (a, b) { return new Date(b.date) - new Date(a.date) || a.title.localeCompare(b.title); };
    }
  }

  function cardHtml(post, index) {
    var slug = encodeURIComponent(post.slug);
    var media = '';
    var lazy = index < 3 ? '' : ' loading="lazy"';
    if (post.webp) {
      media = '<span class="lj-post-card-media"><img src="/assets/img/posts/webp/' + slug + '-640.webp"' +
        ' srcset="/assets/img/posts/webp/' + slug + '-640.webp 640w, /assets/img/posts/webp/' + slug + '-1280.webp 1280w"' +
        ' sizes="' + CARD_SIZES + '" width="640" height="360" alt=""' + lazy + ' decoding="async"></span>';
    } else if (post.image) {
      media = '<span class="lj-post-card-media"><img src="/' + escapeHtml(post.image) + '" width="640" height="360" alt=""' + lazy + ' decoding="async"></span>';
    }
    return (
      '<a class="lj-card lj-post-card" href="/posts/' + slug + '.html">' + media +
      '<span class="lj-post-card-body"><span class="lj-post-card-meta">' +
      (post.category ? '<span class="lj-tag">' + escapeHtml(post.category) + '</span>' : '') +
      '<time datetime="' + escapeHtml(post.date) + '">' + escapeHtml(post.dateDisplay || post.date) + '</time></span>' +
      '<h3>' + escapeHtml(post.title) + '</h3>' +
      (post.excerpt ? '<p>' + escapeHtml(post.excerpt) + '</p>' : '') +
      '<span class="lj-link-arrow">Read article ' + ARROW + '</span></span></a>'
    );
  }

  function render(source) {
    var tokens = state.q.toLowerCase().split(/\s+/).filter(Boolean);
    var posts = source.filter(function (p) {
      if (state.topic && p.categorySlug !== state.topic) return false;
      var hay = ((p.title || '') + ' ' + (p.excerpt || '') + ' ' + (p.category || '')).toLowerCase();
      return tokens.every(function (t) { return hay.indexOf(t) !== -1; });
    });
    posts.sort(comparator(state.sort));
    // The newest post is featured above the list in the default view.
    if (isDefault()) posts = posts.slice(1);

    if (!posts.length) {
      container.innerHTML = '<p class="lj-empty-state" style="grid-column:1/-1">No articles match that search. Try a different word or topic.</p>';
      renderPagination(1);
      status.textContent = 'No articles match.';
      return;
    }
    var totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
    if (state.page > totalPages) state.page = totalPages;
    var start = (state.page - 1) * PAGE_SIZE;
    container.innerHTML = posts.slice(start, start + PAGE_SIZE).map(cardHtml).join('');
    renderPagination(totalPages);
    status.textContent = posts.length + (posts.length === 1 ? ' article' : ' articles') + (totalPages > 1 ? ', page ' + state.page + ' of ' + totalPages : '');
  }

  function update(scroll) {
    writeUrl();
    loadPosts().then(function (posts) {
      render(posts);
      if (scroll) document.getElementById('articles').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function renderPagination(totalPages) {
    if (totalPages <= 1) {
      pagination.innerHTML = '';
      pagination.hidden = true;
      return;
    }
    pagination.hidden = false;
    var cur = state.page;
    var html = '';
    if (cur > 1) html += '<a href="?page=' + (cur - 1) + '" data-page="' + (cur - 1) + '" rel="prev" aria-label="Previous page">' + ARROW.replace('<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>', '<path d="M19 12H5"/><path d="M11 18l-6-6 6-6"/>') + '</a>';
    pageRange(cur, totalPages).forEach(function (p) {
      if (p === '...') html += '<span aria-hidden="true">&hellip;</span>';
      else if (p === cur) html += '<span aria-current="page">' + p + '</span>';
      else html += '<a href="?page=' + p + '" data-page="' + p + '" aria-label="Page ' + p + '">' + p + '</a>';
    });
    if (cur < totalPages) html += '<a href="?page=' + (cur + 1) + '" data-page="' + (cur + 1) + '" rel="next" aria-label="Next page">' + ARROW + '</a>';
    pagination.innerHTML = html;
  }

  // First, last, current +/-1, with "..." standing in for any gaps.
  function pageRange(current, total) {
    var range = [];
    var out = [];
    var last;
    for (var i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= current - 1 && i <= current + 1)) range.push(i);
    }
    range.forEach(function (p) {
      if (last) {
        if (p - last === 2) out.push(last + 1);
        else if (p - last > 2) out.push('...');
      }
      out.push(p);
      last = p;
    });
    return out;
  }

  var debounce = null;
  searchInput.addEventListener('input', function () {
    clearTimeout(debounce);
    debounce = setTimeout(function () {
      state.q = searchInput.value.trim();
      state.page = 1;
      update(false);
    }, 120);
  });
  sortSelect.addEventListener('change', function () {
    state.sort = sortSelect.value;
    state.page = 1;
    update(false);
  });
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      state.topic = chip.getAttribute('data-topic');
      state.page = 1;
      syncChips();
      update(false);
    });
  });
  pagination.addEventListener('click', function (e) {
    var link = e.target.closest('a[data-page]');
    if (!link) return;
    e.preventDefault();
    state.page = parseInt(link.getAttribute('data-page'), 10);
    update(true);
  });

  readUrl();
  if (!isDefault() || state.page > 1) {
    update(false);
  } else {
    var initialTotal = parseInt(container.getAttribute('data-total'), 10) || 0;
    renderPagination(Math.max(1, Math.ceil(initialTotal / PAGE_SIZE)));
    status.textContent = initialTotal + 1 + ' articles';
  }
})();

// Newsletter popup. Opens once each time the blog home is loaded, unless the
// visitor has joined (clicked a Join button, which opens the Typeform) or
// ticked "Don't show this again"; both are remembered in localStorage.
(function () {
  'use strict';

  var KEY = 'lj-newsletter';
  var FORM_ID = 'CwiRULXe';
  var DELAY_MS = 2500;
  var dialog = document.getElementById('lj-newsletter');
  var joins = Array.prototype.slice.call(document.querySelectorAll('[data-lj-newsletter-join]'));
  var never = document.querySelector('[data-lj-popup-never]');

  function remembered() {
    try { return window.localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function remember(value) {
    try {
      if (value) window.localStorage.setItem(KEY, value);
      else window.localStorage.removeItem(KEY);
    } catch (e) {}
  }

  // The Typeform embed library is only loaded when it is about to be needed.
  var typeform = null;
  function loadTypeform() {
    if (typeform) return typeform;
    typeform = new Promise(function (resolve, reject) {
      if (window.tf && window.tf.createPopup) return resolve(window.tf);
      var css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://embed.typeform.com/next/css/popup.css';
      document.head.appendChild(css);
      var js = document.createElement('script');
      js.src = 'https://embed.typeform.com/next/embed.js';
      js.async = true;
      js.onload = function () { window.tf && window.tf.createPopup ? resolve(window.tf) : reject(new Error('Typeform unavailable')); };
      js.onerror = reject;
      document.head.appendChild(js);
    });
    typeform.catch(function () { typeform = null; });
    return typeform;
  }

  function openForm() {
    loadTypeform().then(function (tf) {
      tf.createPopup(FORM_ID, {
        size: 100,
        opacity: 100,
        medium: 'snippet',
        transitiveSearchParams: true,
        iframeProps: { title: 'Newsletter - Subscribe' }
      }).open();
    }).catch(function () {
      window.location.href = 'https://form.typeform.com/to/' + FORM_ID;
    });
  }

  joins.forEach(function (btn) {
    btn.addEventListener('pointerenter', loadTypeform, { once: true });
    btn.addEventListener('click', function () {
      remember('joined');
      if (dialog && dialog.open) dialog.close();
      openForm();
    });
  });

  if (!dialog || typeof dialog.showModal !== 'function') return;

  if (never) {
    never.addEventListener('change', function () { remember(never.checked ? 'hidden' : null); });
  }
  dialog.addEventListener('click', function (e) {
    if (e.target === dialog || e.target.closest('[data-lj-popup-close]')) dialog.close();
  });

  function show() {
    if (remembered() || dialog.open) return;
    // Never stack on top of another open dialog (such as site search).
    var other = document.querySelector('dialog[open]');
    if (other) {
      other.addEventListener('close', function () { setTimeout(show, 600); }, { once: true });
      return;
    }
    dialog.showModal();
    loadTypeform();
  }

  if (!remembered()) setTimeout(show, DELAY_MS);
})();
