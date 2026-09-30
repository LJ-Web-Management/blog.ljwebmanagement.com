// Re-renders every existing post, the blog home and the newsletter page with
// the current templates (scripts/templates.js). Post URLs, titles, dates and
// body copy are read back from the existing files and kept as they are.
//
// Usage: npm run rebuild

const fs = require("fs");
const path = require("path");
const templates = require("./templates");
const { excerptFromHtml, loadPosts, savePosts, writeIndex } = require("./convert");

const ROOT = path.join(__dirname, "..");
const POSTS_DIR = path.join(ROOT, "posts");

const SECTION_LABELS = [
  "What Happened",
  "Why It Matters for Businesses",
  "The Practical Automation Opportunity",
  "Business Takeaway",
];

// Pulls the post body out of either the original template
// (<article class="post-content">) or the current one (lj-post-content).
function extractBody(html, slug) {
  let m = html.match(/<article class="post-content">\n?([\s\S]*?)\n?\s*<\/article>/);
  if (!m) m = html.match(/<div class="lj-post-content">\n([\s\S]*?)\n\s*<\/div>\n<aside class="lj-post-cta"/);
  if (!m) throw new Error("Could not find the post body in posts/" + slug + ".html");
  let body = m[1];
  SECTION_LABELS.forEach((label) => {
    body = body.split("<p>" + label + "</p>").join("<h2>" + label + "</h2>");
  });
  return body;
}

function uniqueDescriptions(posts) {
  const seen = new Map();
  posts.forEach((p) => {
    const key = p.excerpt.toLowerCase();
    if (seen.has(key)) {
      // Fall back to the title so no two pages share a description.
      p.excerpt = excerptFromHtml("<p>" + p.title + ". " + p.excerpt + "</p>", 155);
    }
    seen.set(p.excerpt.toLowerCase(), true);
  });
}

async function main() {
  const posts = loadPosts();
  const bodies = {};

  for (const post of posts) {
    const file = path.join(POSTS_DIR, post.slug + ".html");
    bodies[post.slug] = extractBody(fs.readFileSync(file, "utf8"), post.slug);
    post.excerpt = excerptFromHtml(bodies[post.slug], 155);
    post.webp = await templates.ensureWebp(post.image, post.slug);
  }
  uniqueDescriptions(posts);

  for (const post of posts) {
    const html = templates.buildPostPage(
      Object.assign({ description: post.excerpt, bodyHtml: bodies[post.slug] }, post)
    );
    fs.writeFileSync(path.join(POSTS_DIR, post.slug + ".html"), html);
  }

  savePosts(posts);
  writeIndex(posts);
  fs.writeFileSync(
    path.join(ROOT, "newsletter", "unsubscibe", "index.html"),
    templates.buildUnsubscribePage()
  );
  console.log("Rebuilt " + posts.length + " posts, index.html and the newsletter page.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
