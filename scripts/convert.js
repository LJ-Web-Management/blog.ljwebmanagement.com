const fs = require("fs");
const path = require("path");
const mammoth = require("mammoth");
const AdmZip = require("adm-zip");

const ROOT = path.join(__dirname, "..");
const UPLOADS_DIR = path.join(ROOT, "uploads");
const PROCESSED_DIR = path.join(UPLOADS_DIR, "processed");
const POSTS_DIR = path.join(ROOT, "posts");
const POSTS_JSON = path.join(ROOT, "posts.json");
const POST_IMAGES_DIR = path.join(ROOT, "assets", "img", "posts");
const SITE_URL = "https://lj-web-management.github.io/ljwebmanagement-blogpage";
const LOGO_URL = SITE_URL + "/assets/img/lj-logo.webp";

const SUPPORTED_EXTENSIONS = [".docx", ".txt", ".zip"];
const DOC_EXTENSIONS = [".docx", ".txt"];
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

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

function buildPostPage(title, dateDisplay, bodyHtml, imagePath) {
  const featuredImageHtml = imagePath
    ? `  <div class="post-featured-image">
    <img src="../${imagePath}" alt="${escapeHtml(title)}" loading="eager">
  </div>
`
    : "";

  const shareImageUrl = imagePath ? SITE_URL + "/" + imagePath : LOGO_URL;
  const escapedTitle = escapeHtml(title);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapedTitle} | AI Automation Insights</title>
<link rel="icon" type="image/webp" href="../assets/img/lj-logo.webp">
<meta property="og:title" content="${escapedTitle}">
<meta property="og:image" content="${shareImageUrl}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${escapedTitle}">
<meta name="twitter:image" content="${shareImageUrl}">
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
${featuredImageHtml}  <article class="post-content">
${bodyHtml}
  </article>
</main>

<footer class="site-footer">
  <div class="footer-row">
    <a class="footer-logo" href="https://www.ljwebmanagement.com">
      <img src="../assets/img/lj-logo.webp" alt="LJ Web Management">
    </a>
    <nav class="footer-links">
      <a href="https://www.ljwebmanagement.com/privacy-policy">Privacy Policy</a>
      <a href="https://www.ljwebmanagement.com/terms-of-service">Terms of Service</a>
      <a href="https://www.ljwebmanagement.com/contactus">Contact Us</a>
    </nav>
    <div class="footer-social">
      <a href="https://www.linkedin.com/company/mrpress-automation" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
      </a>
      <a href="https://x.com/mp_automation" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
      </a>
    </div>
  </div>
  <div class="footer-bottom">
    &copy; <span id="year">${new Date().getFullYear()}</span> LJ Web Management - All Rights Reserved
  </div>
</footer>
</body>
</html>
`;
}

// ---------------------------------------------------------------------------
// Per-file conversion
// ---------------------------------------------------------------------------

// A zip upload may contain OS cruft alongside the real document/image
// (e.g. "__MACOSX/" entries or ".DS_Store" from a Mac zip) - ignore those.
function isJunkEntry(entryName) {
  const base = path.basename(entryName);
  return entryName.startsWith("__MACOSX/") || base === ".DS_Store" || base.startsWith("._");
}

function convertZip(filePath) {
  const zip = new AdmZip(filePath);
  const entries = zip.getEntries().filter((e) => !e.isDirectory && !isJunkEntry(e.entryName));

  const docEntry = entries.find((e) =>
    DOC_EXTENSIONS.includes(path.extname(e.entryName).toLowerCase())
  );
  const imageEntry = entries.find((e) =>
    IMAGE_EXTENSIONS.includes(path.extname(e.entryName).toLowerCase())
  );

  if (!docEntry) {
    return Promise.reject(
      new Error("Zip file does not contain a .docx or .txt document: " + filePath)
    );
  }

  const docExt = path.extname(docEntry.entryName).toLowerCase();
  const docBuffer = docEntry.getData();

  const blocksPromise =
    docExt === ".docx"
      ? mammoth.convertToHtml({ buffer: docBuffer }).then((result) => {
          if (result.messages && result.messages.length) {
            result.messages.forEach((m) => console.log("  [mammoth] " + m.type + ": " + m.message));
          }
          return blocksFromMammothHtml(result.value);
        })
      : Promise.resolve(blocksFromPlainText(docBuffer.toString("utf8")));

  return blocksPromise.then((blocks) => {
    const image = imageEntry
      ? { buffer: imageEntry.getData(), ext: path.extname(imageEntry.entryName).toLowerCase() }
      : null;
    return { blocks, image };
  });
}

function convertFile(filePath, filename) {
  const ext = path.extname(filename).toLowerCase();

  if (ext === ".zip") {
    return convertZip(filePath);
  }

  if (ext === ".docx") {
    return mammoth.convertToHtml({ path: filePath }).then((result) => {
      if (result.messages && result.messages.length) {
        result.messages.forEach((m) => console.log("  [mammoth] " + m.type + ": " + m.message));
      }
      const blocks = blocksFromMammothHtml(result.value);
      return { blocks, image: null };
    });
  }

  if (ext === ".txt") {
    const text = fs.readFileSync(filePath, "utf8");
    return Promise.resolve({ blocks: blocksFromPlainText(text), image: null });
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
        return convertFile(filePath, filename).then(({ blocks, image }) => {
          const { title, rest } = extractTitle(blocks, titleFromFilename(filename));
          const bodyHtml = buildBodyHtml(rest);

          const baseSlug = slugify(title);
          const slug = uniqueSlug(baseSlug, existingSlugs);
          existingSlugs.add(slug);

          let imagePath = null;
          if (image) {
            fs.mkdirSync(POST_IMAGES_DIR, { recursive: true });
            const imgExt = image.ext === ".jpeg" ? ".jpg" : image.ext;
            imagePath = "assets/img/posts/" + slug + imgExt;
            fs.writeFileSync(path.join(ROOT, imagePath), image.buffer);
          }

          const pageHtml = buildPostPage(title, dateDisplay, bodyHtml, imagePath);
          fs.writeFileSync(path.join(POSTS_DIR, slug + ".html"), pageHtml);

          posts.push({
            title: title,
            slug: slug,
            image: imagePath,
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
