document.getElementById("year").textContent = new Date().getFullYear();

var allPosts = [];
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

searchInput.addEventListener("input", renderPosts);
sortSelect.addEventListener("change", renderPosts);

function renderPosts() {
  var container = document.getElementById("posts-list");

  if (allPosts.length === 0) {
    container.innerHTML =
      '<div class="empty-state">No blog posts yet. Upload a Word document to the <code>uploads</code> folder on GitHub to publish the first one.</div>';
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
    return;
  }

  container.innerHTML = posts
    .map(function (post) {
      var thumb = post.image
        ? '<img class="post-card-thumb" src="' + escapeHtml(post.image) + '" alt="" loading="lazy">'
        : "";
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
