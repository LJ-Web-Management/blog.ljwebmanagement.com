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
        '<a class="post-card" href="posts/' + encodeURIComponent(post.slug) + '.html">' +
        '<div class="post-date">' + escapeHtml(post.dateDisplay || post.date) + "</div>" +
        "<h2>" + escapeHtml(post.title) + "</h2>" +
        "</a>"
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
