document.getElementById("year").textContent = new Date().getFullYear();

fetch("posts.json", { cache: "no-store" })
  .then(function (res) {
    if (!res.ok) throw new Error("Could not load posts.json");
    return res.json();
  })
  .then(renderPosts)
  .catch(function () {
    renderPosts([]);
  });

function renderPosts(posts) {
  var container = document.getElementById("posts-list");

  if (!posts || posts.length === 0) {
    container.innerHTML =
      '<div class="empty-state">No blog posts yet. Upload a Word document to the <code>uploads</code> folder on GitHub to publish the first one.</div>';
    return;
  }

  posts.sort(function (a, b) {
    return new Date(b.date) - new Date(a.date);
  });

  container.innerHTML = posts
    .map(function (post) {
      return (
        '<article class="post-card">' +
        '<div class="post-date">' + escapeHtml(post.dateDisplay || post.date) + "</div>" +
        '<h2><a href="posts/' + encodeURIComponent(post.slug) + '.html">' + escapeHtml(post.title) + "</a></h2>" +
        '<p class="excerpt">' + escapeHtml(post.excerpt || "") + "</p>" +
        '<a class="btn-read" href="posts/' + encodeURIComponent(post.slug) + '.html">Read Post</a>' +
        "</article>"
      );
    })
    .join("");
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
