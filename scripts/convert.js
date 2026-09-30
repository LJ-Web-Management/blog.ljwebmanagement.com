const fs = require("fs");
const path = require("path");
const mammoth = require("mammoth");
const AdmZip = require("adm-zip");
const templates = require("./templates");

const ROOT = path.join(__dirname, "..");
const UPLOADS_DIR = path.join(ROOT, "uploads");
const PROCESSED_DIR = path.join(UPLOADS_DIR, "processed");
const POSTS_DIR = path.join(ROOT, "posts");
const POSTS_JSON = path.join(ROOT, "posts.json");
const INDEX_HTML = path.join(ROOT, "index.html");
const POST_IMAGES_DIR = path.join(ROOT, "assets", "img", "posts");

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
  if (t.length < 3) return false;
  return /^[\u2500-\u257f\u2014\u2013\-=_~*]+$/.test(t);
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

// Section labels the post writers put on their own line. They are shown as
// real <h2> headings (the wording is unchanged).
const SECTION_HEADINGS = [
  "what happened",
  "why it matters for businesses",
  "the practical automation opportunity",
  "business takeaway",
];

function isSectionHeading(text) {
  return SECTION_HEADINGS.indexOf(plainNormalize(text).toLowerCase()) !== -1;
}

function isSourcesHeading(text) {
  return /^(sources?|references?)$/i.test(plainNormalize(text));
}

// ---------------------------------------------------------------------------
// Manual formatting shortcuts a writer can type directly into the source
// document as plain text, so posts don't rely only on Word styling or the
// AI-faked-bold-unicode trick above: **bold**, *italic*/_italic_, ## and ###
// headings, "> " block quotes, ((asides)), a "[space]" vertical spacer, and
// "1. " numbered lists. Only plain-text paragraphs reach these checks -
// paragraphs with real Word formatting are already routed around this file
// as "raw" blocks (see blocksFromMammothHtml above).
// ---------------------------------------------------------------------------

function isSpacerLine(text) {
  return /^\[space\]$/i.test(text.trim());
}

function isBlockquoteMarker(text) {
  return /^>\s+\S/.test(text.trim());
}

function stripBlockquoteMarker(text) {
  return text.trim().replace(/^>\s+/, "");
}

function isCaptionLine(text) {
  return /^\(\((.+)\)\)$/.test(text.trim());
}

function captionText(text) {
  const m = text.trim().match(/^\(\((.+)\)\)$/);
  return m ? m[1].trim() : text.trim();
}

function headingMarkerMatch(text) {
  const m = text.trim().match(/^(#{2,3})\s+(\S.*)$/);
  if (!m) return null;
  return { level: m[1].length, text: m[2].trim() };
}

function isOrderedListLine(text) {
  return /^\d+\.\s+\S/.test(text.trim());
}

function stripOrderedMarker(text) {
  return text.trim().replace(/^\d+\.\s+/, "");
}

// Applied after normalizeAndMarkBold, whose output is already HTML-escaped -
// the literal *, _, and # punctuation survives escaping, so it's safe to
// match against here.
function applyInlineMarkdown(html) {
  return html
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*\s][^*]*?)\*/g, "<em>$1</em>")
    .replace(/(^|[^\w])_([^_\s][^_]*?)_(?!\w)/g, "$1<em>$2</em>");
}

function formatInline(text) {
  return applyInlineMarkdown(normalizeAndMarkBold(text));
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
  let orderedBuffer = [];
  let sourcesMode = false;
  let sourcesBuffer = [];
  let pendingSourceName = null;

  function flushBullets() {
    if (bulletBuffer.length) {
      output.push(
        "<ul>" +
          bulletBuffer.map((t) => "<li>" + linkifyUrls(formatInline(t)) + "</li>").join("") +
          "</ul>"
      );
      bulletBuffer = [];
    }
  }

  function flushOrdered() {
    if (orderedBuffer.length) {
      output.push(
        "<ol>" +
          orderedBuffer.map((t) => "<li>" + linkifyUrls(formatInline(t)) + "</li>").join("") +
          "</ol>"
      );
      orderedBuffer = [];
    }
  }

  function flushLists() {
    flushBullets();
    flushOrdered();
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
      flushLists();
      flushSources();
      sourcesMode = false;
      output.push(block.html);
      continue;
    }

    const text = block.text.trim();
    if (!text) continue;

    if (isDividerLine(text)) {
      flushLists();
      output.push("<hr>");
      continue;
    }

    if (isSpacerLine(text)) {
      flushLists();
      output.push('<div class="spacer"></div>');
      continue;
    }

    if (isBlockquoteMarker(text)) {
      flushLists();
      output.push(
        "<blockquote>" + linkifyUrls(formatInline(stripBlockquoteMarker(text))) + "</blockquote>"
      );
      continue;
    }

    if (isCaptionLine(text)) {
      flushLists();
      output.push('<p class="caption">' + linkifyUrls(formatInline(captionText(text))) + "</p>");
      continue;
    }

    if (sourcesMode && isUrlLine(text)) {
      sourcesBuffer.push({ name: pendingSourceName || text, url: text.trim() });
      pendingSourceName = null;
      continue;
    }

    if (isSourcesHeading(text)) {
      flushLists();
      flushSources();
      output.push("<h2>" + escapeHtml(plainNormalize(text)) + "</h2>");
      sourcesMode = true;
      continue;
    }

    const heading = headingMarkerMatch(text);
    if (heading) {
      flushLists();
      flushSources();
      sourcesMode = false;
      const tag = "h" + heading.level;
      output.push("<" + tag + ">" + linkifyUrls(formatInline(heading.text)) + "</" + tag + ">");
      continue;
    }

    if (isSectionHeading(text)) {
      flushLists();
      flushSources();
      sourcesMode = false;
      output.push("<h2>" + escapeHtml(plainNormalize(text)) + "</h2>");
      continue;
    }

    if (isMostlyStyled(text)) {
      flushLists();
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

    if (isOrderedListLine(text)) {
      flushBullets();
      orderedBuffer.push(stripOrderedMarker(text));
      continue;
    }

    if (isBulletLine(text)) {
      flushOrdered();
      bulletBuffer.push(stripBullet(text));
      continue;
    }

    flushLists();
    output.push("<p>" + linkifyUrls(formatInline(text)) + "</p>");
  }

  flushLists();
  flushSources();

  return output.join("\n");
}

// Uses the first real paragraph (skipping short label lines such as
// "What Happened") so each post gets its own meta description.
function excerptFromHtml(html, maxLen) {
  const paragraphs = html.match(/<p[^>]*>[\s\S]*?<\/p>/gi) || [];
  const texts = paragraphs.map((p) =>
    decodeEntities(p.replace(/<[^>]+>/g, " "))
      .replace(/\s+/g, " ")
      .trim()
  );
  const text =
    texts.find((t) => t.length >= 80) ||
    texts.find((t) => t.length > 0) ||
    decodeEntities(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1).replace(/\s+\S*$/, "").replace(/[,;:.]$/, "") + "\u2026";
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

function writeIndex(posts) {
  fs.writeFileSync(INDEX_HTML, templates.buildIndexPage(posts));
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

          return templates.ensureWebp(imagePath, slug).then((webp) => {
            const post = {
              title: title,
              slug: slug,
              image: imagePath,
              webp: webp,
              date: isoDate,
              dateDisplay: dateDisplay,
              excerpt: excerptFromHtml(bodyHtml, 155),
            };
            const pageHtml = templates.buildPostPage(
              Object.assign({ description: post.excerpt, bodyHtml: bodyHtml }, post)
            );
            fs.writeFileSync(path.join(POSTS_DIR, slug + ".html"), pageHtml);
            posts.push(post);

            fs.renameSync(filePath, path.join(PROCESSED_DIR, filename));
            console.log("  -> posts/" + slug + ".html");
          });
        });
      });
    }, Promise.resolve())
    .then(() => {
      savePosts(posts);
      writeIndex(posts);
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

module.exports = { buildBodyHtml, excerptFromHtml, loadPosts, savePosts, writeIndex };
