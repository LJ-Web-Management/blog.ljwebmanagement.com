const fs = require("fs");
const path = require("path");
const mammoth = require("mammoth");

const ROOT = path.join(__dirname, "..");
const UPLOADS_DIR = path.join(ROOT, "uploads");
const PROCESSED_DIR = path.join(UPLOADS_DIR, "processed");
const POSTS_DIR = path.join(ROOT, "posts");
const POSTS_JSON = path.join(ROOT, "posts.json");

const SUPPORTED_EXTENSIONS = [".docx", ".txt"];

// ---------------------------------------------------------------------------
// "Styled text" detection.
//
// Many AI-generated / social-style posts fake bold and headings using the
// Unicode Mathematical Alphanumeric Symbols block (e.g. "𝐎𝐩𝐞𝐧𝐀𝐈") instead of
// real formatting, use a line of box-drawing characters ("━━━━") as a section
// divider, "•" for bullets, and a "Sources" section listing a name followed
// by its URL on the next line. This parser recognises that shape (from a
// .docx OR a plain .txt) and turns it into real HTML headings/lists/links.
// ---------------------------------------------------------------------------

function isStyledChar(ch) {
  const cp = ch.codePointAt(0);
  return cp >= 0x1d400 && cp <= 0x1d7ff;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function decodeEntities(str) {
  return String(str)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// Normalizes styled Unicode text back to plain characters, wrapping runs
// that were styled in <strong> so the "boldness" survives as real HTML.
function normalizeAndMarkBold(text) {
  const chars = Array.from(text);
  let html = "";
  let i = 0;
  while (i < chars.length) {
    const bold = isStyledChar(chars[i]);
    let j = i;
    while (j < chars.length && isStyledChar(chars[j]) === bold) j++;
    const run = chars.slice(i, j).join("").normalize("NFKC");
    const escaped = escapeHtml(run);
    html += bold ? "<strong>" + escaped + "</strong>" : escaped;
    i = j;
  }
  return html;
}

function plainNormalize(text) {
  return text.normalize("NFKC").trim();
}

function styledRatio(text) {
  const letters = Array.from(text).filter((c) => /[\p{L}\p{N}]/u.test(c));
  if (letters.length === 0) return 0;
  const styled = letters.filter(isStyledChar).length;
  return styled / letters.length;
}

function isMostlyStyled(text) {
  return styledRatio(text) > 0.6;
}

function isDividerLine(text) {
  const t = text.trim();
  if (t.length < 5) return false;
  return /^[─-╿—–\-=_~*]+$/.test(t);
}

function isBulletLine(text) {
  return /^[•‣◦▪●·]\s+/.test(text.trim()) || /^[*-]\s+\S/.test(text.trim());
}

function stripBullet(text) {
  return text.trim().replace(/^[•‣◦▪●·*-]\s+/, "");
}

function isUrlLine(text) {
  return /^https?:\/\/\S+$/i.test(text.trim());
}

function isSourcesHeading(text) {
  return /^(sources?|references?)$/i.test(plainNormalize(text));
}

function linkifyUrls(html) {
  return html.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );
}

// ---------------------------------------------------------------------------
// Extracting an ordered list of paragraph "blocks" from either a mammoth
// HTML conversion (.docx) or plain text (.txt), so both file types can be
// run through the exact same structural parser below.
// ---------------------------------------------------------------------------

function blocksFromMammothHtml(html) {
  const matches = html.match(/<(h[1-6]|p|ul|ol|table|blockquote)[^>]*>[\s\S]*?<\/\1>/gi) || [];
  return matches.map((block) => {
    const tagMatch = block.match(/^<([a-z0-9]+)/i);
    const tag = tagMatch[1].toLowerCase();
    if (tag === "p") {
      const inner = block.replace(/^<p[^>]*>/i, "").replace(/<\/p>$/i, "");
      if (/<[a-z]/i.test(inner)) {
        // Contains real formatting (bold/italic/link/image) - leave untouched.
        return { type: "raw", html: block };
      }
      return { type: "text", text: decodeEntities(inner) };
    }
    if (tag === "h1" || tag === "h2") {
      const text = decodeEntities(block.replace(/<[^>]+>/g, ""));
      return { type: "heading", tag, text, html: block };
    }
    return { type: "raw", html: block };
  });
}

function blocksFromPlainText(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => ({ type: "text", text: line }));
}

// ---------------------------------------------------------------------------
// Title + body building
// ---------------------------------------------------------------------------

function titleFromFilename(filename) {
  const base = filename.replace(/\.(docx|txt)$/i, "");
  const words = base.replace(/[_-]+/g, " ").trim();
  return words.replace(/\w\S*/g, function (w) {
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  });
}

function extractTitle(blocks, fallbackTitle) {
  if (blocks.length === 0) return { title: fallbackTitle, rest: blocks };
  const first = blocks[0];
  if (first.type === "heading") {
    return { title: plainNormalize(first.text) || fallbackTitle, rest: blocks.slice(1) };
  }
  if (first.type === "text" && first.text.trim()) {
    return { title: plainNormalize(first.text) || fallbackTitle, rest: blocks.slice(1) };
  }
  return { title: fallbackTitle, rest: blocks };
}

function buildBodyHtml(blocks) {
  const output = [];
  let bulletBuffer = [];
  let sourcesMode = false;
  let sourcesBuffer = [];
  let pendingSourceName = null;

  function flushBullets() {
    if (bulletBuffer.length) {
      output.push(
        "<ul>" +
          bulletBuffer.map((t) => "<li>" + linkifyUrls(normalizeAndMarkBold(t)) + "</li>").join("") +
          "</ul>"
      );
      bulletBuffer = [];
    }
  }

  function flushSources() {
    if (sourcesBuffer.length) {
      output.push(
        '<ul class="sources-list">' +
          sourcesBuffer
            .map(
              (s) =>
                '<li><a href="' +
                escapeHtml(s.url) +
                '" target="_blank" rel="noopener noreferrer">' +
                escapeHtml(s.name) +
                "</a></li>"
            )
            .join("") +
          "</ul>"
      );
      sourcesBuffer = [];
    }
    if (pendingSourceName) {
      output.push("<p>" + escapeHtml(pendingSourceName) + "</p>");
      pendingSourceName = null;
    }
  }

  for (const block of blocks) {
    if (block.type === "raw" || block.type === "heading") {
      flushBullets();
      flushSources();
      sourcesMode = false;
      output.push(block.html);
      continue;
    }

    const text = block.text.trim();
    if (!text) continue;

    if (isDividerLine(text)) {
      flushBullets();
      continue;
    }

    if (sourcesMode && isUrlLine(text)) {
      sourcesBuffer.push({ name: pendingSourceName || text, url: text.trim() });
      pendingSourceName = null;
      continue;
    }

    if (isSourcesHeading(text)) {
      flushBullets();
      flushSources();
      output.push("<h2>" + escapeHtml(plainNormalize(text)) + "</h2>");
      sourcesMode = true;
      continue;
    }

    if (isMostlyStyled(text)) {
      flushBullets();
      flushSources();
      sourcesMode = false;
      output.push("<h2>" + escapeHtml(plainNormalize(text)) + "</h2>");
      continue;
    }

    if (sourcesMode) {
      if (pendingSourceName) {
        output.push("<p>" + escapeHtml(pendingSourceName) + "</p>");
      }
      pendingSourceName = plainNormalize(text);
      continue;
    }

    if (isBulletLine(text)) {
      bulletBuffer.push(stripBullet(text));
      continue;
    }

    flushBullets();
    output.push("<p>" + linkifyUrls(normalizeAndMarkBold(text)) + "</p>");
  }

  flushBullets();
  flushSources();

  return output.join("\n");
}

function excerptFromHtml(html, maxLen) {
  const match = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  const source = match ? match[1] : html;
  const text = decodeEntities(source.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).replace(/\s+\S*$/, "") + "…";
}

// ---------------------------------------------------------------------------
// Page template + post index
// ---------------------------------------------------------------------------

function slugify(text) {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "post"
  );
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

function buildPostPage(title, dateDisplay, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)} | LJ Web Management Blog</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📝</text></svg>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
<header class="site-header">
  <div class="header-inner">
    <a class="brand" href="../index.html">
      <img src="../assets/img/lj-logo.webp" alt="LJ Web Management" width="95" height="40">
    </a>
    <nav>
      <a href="../index.html">Blog</a>
      <a href="https://www.ljwebmanagement.com">Main Site</a>
      <a href="https://www.ljwebmanagement.com/contactus">Contact Us</a>
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
  <div class="footer-links">
    <a href="https://www.ljwebmanagement.com">Main Site</a>
    <a href="https://www.ljwebmanagement.com/contactus">Contact Us</a>
  </div>
  &copy; <span id="year">${new Date().getFullYear()}</span> LJ Web Management
</footer>
</body>
</html>
`;
}

// ---------------------------------------------------------------------------
// Per-file conversion
// ---------------------------------------------------------------------------

function convertFile(filePath, filename) {
  const ext = path.extname(filename).toLowerCase();

  if (ext === ".docx") {
    return mammoth.convertToHtml({ path: filePath }).then((result) => {
      if (result.messages && result.messages.length) {
        result.messages.forEach((m) => console.log("  [mammoth] " + m.type + ": " + m.message));
      }
      const blocks = blocksFromMammothHtml(result.value);
      return { blocks };
    });
  }

  if (ext === ".txt") {
    const text = fs.readFileSync(filePath, "utf8");
    return Promise.resolve({ blocks: blocksFromPlainText(text) });
  }

  return Promise.reject(new Error("Unsupported file type: " + ext));
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
    .filter((f) => SUPPORTED_EXTENSIONS.includes(path.extname(f).toLowerCase()));

  if (files.length === 0) {
    console.log("No new documents to convert.");
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

  files
    .reduce((chain, filename) => {
      return chain.then(() => {
        const filePath = path.join(UPLOADS_DIR, filename);
        console.log("Converting " + filename + " ...");
        return convertFile(filePath, filename).then(({ blocks }) => {
          const { title, rest } = extractTitle(blocks, titleFromFilename(filename));
          const bodyHtml = buildBodyHtml(rest);

          const baseSlug = slugify(title);
          const slug = uniqueSlug(baseSlug, existingSlugs);
          existingSlugs.add(slug);

          const pageHtml = buildPostPage(title, dateDisplay, bodyHtml);
          fs.writeFileSync(path.join(POSTS_DIR, slug + ".html"), pageHtml);

          posts.push({
            title: title,
            slug: slug,
            date: isoDate,
            dateDisplay: dateDisplay,
            excerpt: excerptFromHtml(bodyHtml, 160),
          });

          fs.renameSync(filePath, path.join(PROCESSED_DIR, filename));
          console.log("  -> posts/" + slug + ".html");
        });
      });
    }, Promise.resolve())
    .then(() => {
      savePosts(posts);
      console.log("Done. " + files.length + " post(s) published.");
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

if (require.main === module) {
  main();
}

module.exports = { buildPostPage };
