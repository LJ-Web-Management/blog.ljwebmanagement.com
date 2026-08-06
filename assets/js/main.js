document.getElementById("year").textContent = new Date().getFullYear();

var PAGE_SIZE = 20;
var allPosts = [];
var currentPage = 1;
var searchInput = document.getElementById("search-input");
var sortSelect = document.getElementById("sort-select");

fetch("posts.json", { cache: "no-store" })
  .then(function (res) {
    if (!res.ok) throw new Error("Could not load posts.json");
    return res.json();
  })
  .then(function (posts) {
    allPosts = posts || [];
    renderPosts();
  })
  .catch(function () {
    allPosts = [];
    renderPosts();
  });

searchInput.addEventListener("input", function () {
  currentPage = 1;
  renderPosts();
});
sortSelect.addEventListener("change", function () {
  currentPage = 1;
  renderPosts();
});

function renderPosts() {
  var container = document.getElementById("posts-list");
  var pagination = document.getElementById("pagination");

  if (allPosts.length === 0) {
    container.innerHTML =
      '<div class="empty-state">No blog posts yet. Upload a Word document to the <code>uploads</code> folder on GitHub to publish the first one.</div>';
    pagination.innerHTML = "";
    return;
  }

  var query = searchInput.value.trim().toLowerCase();
  var posts = allPosts.filter(function (post) {
    return (
      (post.title || "").toLowerCase().indexOf(query) !== -1 ||
      (post.excerpt || "").toLowerCase().indexOf(query) !== -1
    );
  });

  posts.sort(getComparator(sortSelect.value));

  if (posts.length === 0) {
    container.innerHTML = '<div class="empty-state">No posts match your search.</div>';
    pagination.innerHTML = "";
    return;
  }

  var totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;

  var start = (currentPage - 1) * PAGE_SIZE;
  var pagePosts = posts.slice(start, start + PAGE_SIZE);

  container.innerHTML = pagePosts
    .map(function (post) {
      var thumb = post.image
        ? '<img class="post-card-thumb" src="' + escapeHtml(post.image) + '" alt="" loading="lazy" onerror="handleThumbError(this)">'
        : brokenThumbHtml();
      return (
        '<a class="post-card" href="posts/' + encodeURIComponent(post.slug) + '.html">' +
        thumb +
        '<div class="post-card-body">' +
        '<div class="post-date">' + escapeHtml(post.dateDisplay || post.date) + "</div>" +
        "<h2>" + escapeHtml(post.title) + "</h2>" +
        "</div>" +
        "</a>"
      );
    })
    .join("");

  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  var pagination = document.getElementById("pagination");

  if (totalPages <= 1) {
    pagination.innerHTML = "";
    return;
  }

  var pages = getPageRange(currentPage, totalPages);
  var html = '<ul class="pagination-list">';

  html +=
    '<li><button type="button" class="pagination-arrow" data-page="' +
    (currentPage - 1) +
    '"' +
    (currentPage === 1 ? " disabled" : "") +
    ' aria-label="Previous page">' +
    arrowIcon("left") +
    "</button></li>";

  pages.forEach(function (page) {
    if (page === "...") {
      html += '<li><span class="pagination-ellipsis">&hellip;</span></li>';
      return;
    }
    html +=
      '<li><button type="button" class="' +
      (page === currentPage ? "active" : "") +
      '" data-page="' +
      page +
      '" aria-label="Page ' +
      page +
      '"' +
      (page === currentPage ? ' aria-current="page"' : "") +
      ">" +
      page +
      "</button></li>";
  });

  html +=
    '<li><button type="button" class="pagination-arrow" data-page="' +
    (currentPage + 1) +
    '"' +
    (currentPage === totalPages ? " disabled" : "") +
    ' aria-label="Next page">' +
    arrowIcon("right") +
    "</button></li>";

  html += "</ul>";
  pagination.innerHTML = html;

  Array.prototype.forEach.call(pagination.querySelectorAll("button[data-page]:not(:disabled)"), function (btn) {
    btn.addEventListener("click", function () {
      currentPage = parseInt(btn.getAttribute("data-page"), 10);
      renderPosts();
      document.querySelector(".controls-bar").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

// Builds a compact MUI-style page list: first, last, current +/-1, with
// "..." standing in for any gaps so long post lists don't render 40 buttons.
function getPageRange(current, total) {
  var delta = 1;
  var range = [];
  var withDots = [];
  var lastPage;

  for (var i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      range.push(i);
    }
  }

  range.forEach(function (page) {
    if (lastPage) {
      if (page - lastPage === 2) {
        withDots.push(lastPage + 1);
      } else if (page - lastPage > 2) {
        withDots.push("...");
      }
    }
    withDots.push(page);
    lastPage = page;
  });

  return withDots;
}

function arrowIcon(dir) {
  var d = dir === "left" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6";
  return (
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' +
    d +
    '"/></svg>'
  );
}

// Shown in place of a post's thumbnail when it has no featured image, or its
// image file fails to load - a small corner badge rather than a reserved
// thumbnail column, so the title/date text expands to fill the card.
function brokenThumbHtml() {
  return (
    '<div class="post-card-thumb post-card-thumb--empty" aria-hidden="true">' +
    '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/>' +
    '<circle cx="8.5" cy="9" r="1.6"/><path d="M21 16.5l-5.5-5.5a2 2 0 0 0-2.8 0L3 20"/>' +
    '<line x1="3" y1="3" x2="21" y2="21"/></svg>' +
    "</div>"
  );
}

function handleThumbError(img) {
  img.outerHTML = brokenThumbHtml();
}

function getComparator(sortValue) {
  switch (sortValue) {
    case "date-asc":
      return function (a, b) {
        return new Date(a.date) - new Date(b.date);
      };
    case "title-asc":
      return function (a, b) {
        return (a.title || "").localeCompare(b.title || "");
      };
    case "title-desc":
      return function (a, b) {
        return (b.title || "").localeCompare(a.title || "");
      };
    case "date-desc":
    default:
      return function (a, b) {
        return new Date(b.date) - new Date(a.date);
      };
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
