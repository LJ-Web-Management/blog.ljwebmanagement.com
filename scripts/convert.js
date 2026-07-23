const fs = require("fs");
const path = require("path");
const mammoth = require("mammoth");

const ROOT = path.join(__dirname, "..");
const UPLOADS_DIR = path.join(ROOT, "uploads");
const PROCESSED_DIR = path.join(UPLOADS_DIR, "processed");
const POSTS_DIR = path.join(ROOT, "posts");
const POSTS_JSON = path.join(ROOT, "posts.json");

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "post";
}

function loadPosts() {
  if (!fs.existsSync(POSTS_JSON)) return [];
  const raw = fs.readFileSync(POSTS_JSON, "utf8").trim();
  if (!raw) return [];
  return JSON.parse(raw);
}

function savePosts(posts) {
  fs.writeFileSync(POSTS_JSON, JSON.stringify(posts, null, 2) + "\n");
}

function uniqueSlug(baseSlug, existingSlugs) {
  let slug = baseSlug;
  let n = 2;
  while (existingSlugs.has(slug)) {
    slug = baseSlug + "-" + n;
    n++;
  }
  return slug;
}

function titleFromFilename(filename) {
  const base = filename.replace(/\.docx$/i, "");
  const words = base.replace(/[_-]+/g, " ").trim();
  return words.replace(/\w\S*/g, function (w) {
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  });
}

function extractTitleAndBody(html, fallbackTitle) {
  const headingMatch = html.match(/^\s*<h1[^>]*>(.*?)<\/h1>/i) || html.match(/^\s*<h2[^>]*>(.*?)<\/h2>/i);
  if (headingMatch) {
    const title = headingMatch[1].replace(/<[^>]+>/g, "").trim();
    const body = html.slice(headingMatch.index + headingMatch[0].length);
    return { title: title || fallbackTitle, body };
  }
  return { title: fallbackTitle, body: html };
}

function excerptFromHtml(html, maxLen) {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).replace(/\s+\S*$/, "") + "…";
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildPostPage(title, dateDisplay, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)} | LJ Web Management Blog</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📝</text></svg>">
<link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
<header class="site-header">
  <div class="header-inner">
    <a class="brand" href="../index.html">LJ Web Management</a>
    <nav>
      <a href="../index.html">Blog Home</a>
      <a href="https://www.ljwebmanagement.com">Main Site</a>
    </nav>
  </div>
</header>

<main>
  <a class="back-link" href="../index.html">&larr; Back to Blog</a>
  <div class="post-header">
    <div class="post-date">${escapeHtml(dateDisplay)}</div>
    <h1>${escapeHtml(title)}</h1>
  </div>
  <article class="post-content">
${bodyHtml}
  </article>
</main>

<footer class="site-footer">
  &copy; <span id="year">${new Date().getFullYear()}</span> LJ Web Management
</footer>
</body>
</html>
`;
}

function main() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    console.log("No uploads directory found, nothing to do.");
    return;
  }
  fs.mkdirSync(PROCESSED_DIR, { recursive: true });
  fs.mkdirSync(POSTS_DIR, { recursive: true });

  const files = fs
    .readdirSync(UPLOADS_DIR)
    .filter(function (f) {
      return f.toLowerCase().endsWith(".docx");
    });

  if (files.length === 0) {
    console.log("No new .docx files to convert.");
    return;
  }

  const posts = loadPosts();
  const existingSlugs = new Set(posts.map((p) => p.slug));

  const today = new Date();
  const isoDate = today.toISOString().slice(0, 10);
  const dateDisplay = today.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  files.reduce(function (chain, filename) {
    return chain.then(function () {
      const filePath = path.join(UPLOADS_DIR, filename);
      console.log("Converting " + filename + " ...");
      return mammoth.convertToHtml({ path: filePath }).then(function (result) {
        const { title, body } = extractTitleAndBody(result.value, titleFromFilename(filename));
        const baseSlug = slugify(title);
        const slug = uniqueSlug(baseSlug, existingSlugs);
        existingSlugs.add(slug);

        const pageHtml = buildPostPage(title, dateDisplay, body);
        fs.writeFileSync(path.join(POSTS_DIR, slug + ".html"), pageHtml);

        posts.push({
          title: title,
          slug: slug,
          date: isoDate,
          dateDisplay: dateDisplay,
          excerpt: excerptFromHtml(body, 160),
        });

        fs.renameSync(filePath, path.join(PROCESSED_DIR, filename));
        console.log("  -> posts/" + slug + ".html");

        if (result.messages && result.messages.length) {
          result.messages.forEach(function (m) {
            console.log("  [mammoth] " + m.type + ": " + m.message);
          });
        }
      });
    });
  }, Promise.resolve())
    .then(function () {
      savePosts(posts);
      console.log("Done. " + files.length + " post(s) published.");
    })
    .catch(function (err) {
      console.error(err);
      process.exit(1);
    });
}

main();
