// Blog home: search, sort and pagination. The first page of cards is already
// in the HTML (built by scripts/templates.js), so nothing is re-rendered until
// the visitor searches, sorts or changes page.
(function () {
  'use strict';

  var PAGE_SIZE = 20;
  var allPosts = null;
  var loading = null;
  var currentPage = 1;
  var container = document.getElementById('posts-list');
  var pagination = document.getElementById('pagination');
  var status = document.getElementById('posts-status');
  var searchInput = document.getElementById('search-input');
  var sortSelect = document.getElementById('sort-select');
  if (!container || !pagination) return;

  var initialTotal = parseInt(container.getAttribute('data-total'), 10) || 0;
  renderPagination(Math.max(1, Math.ceil(initialTotal / PAGE_SIZE)));

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

  function update() {
    loadPosts().then(renderPosts);
  }

  searchInput.addEventListener('input', function () {
    currentPage = 1;
    update();
  });
  sortSelect.addEventListener('change', function () {
    currentPage = 1;
    update();
  });
  pagination.addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-page]');
    if (!btn || btn.disabled) return;
    currentPage = parseInt(btn.getAttribute('data-page'), 10);
    update();
    document.querySelector('.lj-controls').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  function renderPosts(source) {
    var query = searchInput.value.trim().toLowerCase();
    var posts = source.filter(function (post) {
      return (
        (post.title || '').toLowerCase().indexOf(query) !== -1 ||
        (post.excerpt || '').toLowerCase().indexOf(query) !== -1
      );
    });
    posts.sort(getComparator(sortSelect.value));

    if (posts.length === 0) {
      container.innerHTML = '<p class="lj-empty">No posts match your search.</p>';
      renderPagination(1);
      status.textContent = 'No posts match your search.';
      return;
    }

    var totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;
    var start = (currentPage - 1) * PAGE_SIZE;
    container.innerHTML = posts.slice(start, start + PAGE_SIZE).map(cardHtml).join('');
    renderPagination(totalPages);
    status.textContent = posts.length + (posts.length === 1 ? ' post' : ' posts') + ', page ' + currentPage + ' of ' + totalPages + '.';
  }

  function cardHtml(post, index) {
    var slug = post.slug;
    var thumb;
    if (post.webp) {
      thumb =
        '<img class="lj-card-thumb" src="/assets/img/posts/webp/' + encodeURIComponent(slug) + '-640.webp"' +
        ' srcset="/assets/img/posts/webp/' + encodeURIComponent(slug) + '-640.webp 640w, /assets/img/posts/webp/' + encodeURIComponent(slug) + '-1280.webp 1280w"' +
        ' sizes="(max-width: 640px) calc(100vw - 48px), (max-width: 1024px) 45vw, 360px"' +
        ' width="640" height="360" alt="" ' + (index < 3 ? '' : 'loading="lazy" ') + 'decoding="async">';
    } else if (post.image) {
      thumb = '<img class="lj-card-thumb" src="/' + escapeHtml(post.image) + '" width="640" height="360" alt="" loading="lazy" decoding="async">';
    } else {
      thumb = '<div class="lj-card-thumb lj-card-thumb--empty" aria-hidden="true"></div>';
    }
    return (
      '<a class="lj-card" href="/posts/' + encodeURIComponent(slug) + '.html">' +
      thumb +
      '<div class="lj-card-body">' +
      '<time class="lj-card-date" datetime="' + escapeHtml(post.date) + '">' + escapeHtml(post.dateDisplay || post.date) + '</time>' +
      '<h2 class="lj-card-title">' + escapeHtml(post.title) + '</h2>' +
      (post.excerpt ? '<p class="lj-card-excerpt">' + escapeHtml(post.excerpt) + '</p>' : '') +
      '<span class="lj-card-more" aria-hidden="true">Read article &rarr;</span>' +
      '</div></a>'
    );
  }

  function renderPagination(totalPages) {
    if (totalPages <= 1) {
      pagination.innerHTML = '';
      pagination.hidden = true;
      return;
    }
    pagination.hidden = false;
    var html = '<ul>';
    html += '<li><button type="button" data-page="' + (currentPage - 1) + '"' + (currentPage === 1 ? ' disabled' : '') + ' aria-label="Previous page">' + arrowIcon('left') + '</button></li>';
    getPageRange(currentPage, totalPages).forEach(function (page) {
      if (page === '...') {
        html += '<li><span class="lj-ellipsis" aria-hidden="true">&hellip;</span></li>';
        return;
      }
      html +=
        '<li><button type="button" data-page="' + page + '" aria-label="Page ' + page + '"' +
        (page === currentPage ? ' aria-current="page"' : '') + '>' + page + '</button></li>';
    });
    html += '<li><button type="button" data-page="' + (currentPage + 1) + '"' + (currentPage === totalPages ? ' disabled' : '') + ' aria-label="Next page">' + arrowIcon('right') + '</button></li>';
    html += '</ul>';
    pagination.innerHTML = html;
  }

  // First, last, current +/-1, with "..." standing in for any gaps.
  function getPageRange(current, total) {
    var range = [];
    var withDots = [];
    var lastPage;
    for (var i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= current - 1 && i <= current + 1)) range.push(i);
    }
    range.forEach(function (page) {
      if (lastPage) {
        if (page - lastPage === 2) withDots.push(lastPage + 1);
        else if (page - lastPage > 2) withDots.push('...');
      }
      withDots.push(page);
      lastPage = page;
    });
    return withDots;
  }

  function arrowIcon(dir) {
    var d = dir === 'left' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6';
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + d + '"/></svg>';
  }

  function getComparator(sortValue) {
    switch (sortValue) {
      case 'date-asc':
        return function (a, b) { return new Date(a.date) - new Date(b.date); };
      case 'title-asc':
        return function (a, b) { return (a.title || '').localeCompare(b.title || ''); };
      case 'title-desc':
        return function (a, b) { return (b.title || '').localeCompare(a.title || ''); };
      default:
        return function (a, b) { return new Date(b.date) - new Date(a.date); };
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // The newsletter widget is third party, so it loads on the first
  // interaction instead of competing with the initial render.
  (function () {
    var loaded = false, events = ['pointerdown', 'mousemove', 'scroll', 'touchstart', 'keydown'];
    function load() {
      if (loaded) return;
      loaded = true;
      events.forEach(function (e) { window.removeEventListener(e, load); });
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://embed.typeform.com/next/embed.js';
      document.head.appendChild(s);
    }
    events.forEach(function (e) { window.addEventListener(e, load, { passive: true }); });
  })();
})();
