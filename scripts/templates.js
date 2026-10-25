// Page templates for the blog. The header, navigation, search, footer and
// icons come from scripts/chrome.js and the styles from assets/css/site.css,
// both shared verbatim with the main site (LJ-Web-Management/ljwebmanagement.com),
// so the blog and www.ljwebmanagement.com look and behave as one site.

const fs = require("fs");
const path = require("path");
const chrome = require("./chrome");

const { icon } = chrome;
const ROOT = path.join(__dirname, "..");
const SITE_URL = "https://blog.ljwebmanagement.com";
const MAIN_URL = chrome.SITE_URL;
const BLOG_HOME = SITE_URL + "/";
const SHARE_IMAGE = MAIN_URL + "/assets/social-share.png";
const LOGO = "/assets/img/lj-logo-80.webp";
const WEBP_DIR = "assets/img/posts/webp";
const WEBP_WIDTHS = [640, 1280];
const PAGE_SIZE = 18;
const BLOG_NAME = "LJ Web Management Blog";

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function main(p) {
  return MAIN_URL + p;
}

function jsonLd(nodes) {
  const data = { "@context": "https://schema.org", "@graph": [chrome.ORGANIZATION].concat(nodes) };
  // Escape "<" so post titles can never close the script element early.
  return '<script type="application/ld+json">' + JSON.stringify(data).replace(/</g, "\\u003c") + "</script>";
}

// ---------------------------------------------------------------------------
// Topics. Every post is filed under one topic, picked from its title the
// first time it is published (first matching rule wins). Each topic points
// readers to the matching automation category and guide on the main site.
// ---------------------------------------------------------------------------

const TOPICS = [
  { slug: "learn", name: "Tech Skills for Beginners", test: /beginner|first web page|first react|learning to code|first tech skill|first no-code|python basics|neural networks|prompt engineering|first ai workflow|repetitive task before you automate/i,
    practice: ["/automations/", "Browse 1,000+ done-for-you automations"], guide: ["/guides/how-to-automate-your-business/", "How to automate your business"] },
  { slug: "governance", name: "AI Strategy & Governance", test: /governance|govern |automation change|automation telemetry|automation sunset|automation portfolio|automation readiness|automation control room|test workflow automations|change impact review|data pipeline ownership|definition drift|data refresh failure|change freeze/i,
    practice: ["/automations/category/compliance-documents/", "Compliance, documents & deadlines automations"], guide: ["/guides/ai-vs-automation/", "AI vs. automation: when to use each"] },
  { slug: "field-service", name: "Field Service", test: /field service|dispatch|truck roll|work order|field audit|service estimate|service visits|service parts|field scheduling|field teams|technician|job cost|change order|facilities|equipment|calibration/i,
    practice: ["/automations/category/scheduling-dispatch/", "Scheduling, reminders & dispatch automations"], guide: ["/guides/reduce-no-shows-appointment-reminders/", "How to reduce no-shows"] },
  { slug: "people", name: "HR & Team", test: /employee|new-hire|new hire|hire |interview|training expirations|timesheet|payroll|workforce|travel approval|offboarding/i,
    practice: ["/automations/category/hr-team/", "HR, hiring & team automations"], guide: ["/guides/employee-onboarding-automation/", "Employee onboarding automation checklist"] },
  { slug: "compliance", name: "Compliance & Data", test: /compliance|audit|consent|data retention|data deletion|policy|regulatory|contract|certificate|insurance renewals|access review|access exception|privacy|identity conflicts|master data|merge review|address change|document expiration|tax exemption|nexus|returned mail|customer data|asset registry|accessibility/i,
    practice: ["/automations/category/compliance-documents/", "Compliance, documents & deadlines automations"], guide: ["/guides/document-workflow-automation/", "Document workflow automation"] },
  { slug: "finance", name: "Finance & Billing", test: /invoice|cash|collection|receivable|payable|expense|payment|billing|credit memo|credit limit|credit approval|revenue recognition|month-end|finance|purchase card|refund|spend|budget|margin|warranty reserve|supplier payments|profitability|sla credit|subscription waste|entitlements/i,
    practice: ["/automations/category/billing-finance/", "Billing, payments & finance automations"], guide: ["/guides/automate-invoicing-payment-reminders/", "How to automate invoicing and payment reminders"] },
  { slug: "reporting", name: "Reporting & Leadership", test: /executive reporting|executive forecasts|board ready|kpi|briefing|reporting|dashboard|meeting decisions|meeting follow-up|narrative|calendar capacity|risk radar|status updates/i,
    practice: ["/automations/category/reporting-analytics/", "Reporting & analytics automations"], guide: ["/guides/how-to-automate-reports/", "How to automate reports and dashboards"] },
  { slug: "marketing", name: "Marketing & Website", test: /website|marketing|campaign|content|seo|conversion|heatmap|form |search logs|pricing page|chat transcripts|attribution/i,
    practice: ["/automations/category/marketing-retention/", "Marketing & customer retention automations"], guide: ["/guides/automate-review-requests/", "How to automate review requests"] },
  { slug: "sales", name: "Sales & CRM", test: /sales|crm|lead|pipeline|quote|proposal|deal|forecast|territory|win loss|bid no-bid|pricing|price change|demo|referral|prospect|order promise/i,
    practice: ["/automations/category/lead-follow-up-sales/", "Lead follow-up & sales automations"], guide: ["/guides/automate-lead-follow-up/", "How to automate lead follow-up"] },
  { slug: "customer-experience", name: "Customer Experience", test: /customer|support|escalation|onboarding|renewal|retention|cancellation|portal|chatbot|knowledge|help desk|macro|adoption|health score|implementation|warranty|service recovery|reviews/i,
    practice: ["/automations/category/customer-communication/", "Customer service & communication automations"], guide: ["/guides/how-to-automate-customer-support/", "How to automate customer support"] },
  { slug: "operations", name: "Operations & Supply Chain", test: /./,
    practice: ["/automations/category/operations-inventory/", "Operations, inventory & vendor automations"], guide: ["/guides/business-process-automation/", "Business process automation (BPA)"] },
];
const TOPIC_BY_SLUG = Object.fromEntries(TOPICS.map((t) => [t.slug, t]));

function topicFor(title) {
  return TOPICS.find((t) => t.test.test(title));
}

// Fills in category/categorySlug on posts that do not have one yet.
function assignTopics(posts) {
  posts.forEach((p) => {
    if (!p.categorySlug || !TOPIC_BY_SLUG[p.categorySlug]) {
      const t = topicFor(p.title);
      p.categorySlug = t.slug;
    }
    p.category = TOPIC_BY_SLUG[p.categorySlug].name;
  });
  return posts;
}

// ---------------------------------------------------------------------------
// Shared head / page shell
// ---------------------------------------------------------------------------

// assets/css/site.css is minified and inlined in every page's <head> so the
// first paint needs no extra request.
let inlineCss = null;
function siteCss() {
  if (inlineCss === null) {
    inlineCss = fs
      .readFileSync(path.join(ROOT, "assets", "css", "site.css"), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\s+/g, " ")
      .replace(/\s*([{}:;,>])\s*/g, "$1")
      .replace(/;}/g, "}")
      .trim();
  }
  return inlineCss;
}

let jsVersion = null;
function siteJs() {
  if (jsVersion === null) {
    jsVersion = require("crypto").createHash("sha1").update(fs.readFileSync(path.join(ROOT, "assets", "js", "site.js"))).digest("hex").slice(0, 10);
  }
  return "/assets/js/site.js?v=" + jsVersion;
}

function head(opts) {
  const title = escapeHtml(opts.title);
  const description = escapeHtml(opts.description);
  const ogImage = opts.ogImage || SHARE_IMAGE;
  const lines = [
    "<!DOCTYPE html>",
    '<html lang="en-US">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    "<title>" + title + "</title>",
    '<meta name="description" content="' + description + '">',
  ];
  if (opts.robots) lines.push('<meta name="robots" content="' + opts.robots + '">');
  if (opts.canonical) lines.push('<link rel="canonical" href="' + opts.canonical + '">');
  lines.push(
    '<meta property="og:type" content="' + (opts.ogType || "website") + '">',
    '<meta property="og:site_name" content="LJ Web Management">',
    '<meta property="og:title" content="' + title + '">',
    '<meta property="og:description" content="' + description + '">'
  );
  if (opts.canonical) lines.push('<meta property="og:url" content="' + opts.canonical + '">');
  lines.push(
    '<meta property="og:image" content="' + escapeHtml(ogImage) + '">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:title" content="' + title + '">',
    '<meta name="twitter:description" content="' + description + '">',
    '<meta name="twitter:image" content="' + escapeHtml(ogImage) + '">',
    '<meta name="theme-color" content="#081426">'
  );
  if (opts.extraMeta) lines.push(opts.extraMeta);
  lines.push(
    '<link rel="icon" href="/assets/img/favicon.ico" sizes="any">',
    '<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">',
    '<link rel="alternate" type="application/rss+xml" title="' + BLOG_NAME + '" href="' + SITE_URL + '/feed.xml">',
    '<link rel="preload" href="/assets/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin>',
    '<link rel="preload" href="/assets/fonts/sora-latin.woff2" as="font" type="font/woff2" crossorigin>'
  );
  if (opts.preloadImage) lines.push(opts.preloadImage);
  lines.push("<style>" + siteCss() + "</style>");
  lines.push("<script>document.documentElement.classList.add('lj-js')</script>");
  lines.push('<script src="' + siteJs() + '" defer></script>');
  if (opts.scripts) lines.push(opts.scripts);
  lines.push(jsonLd(opts.jsonLd || []));
  lines.push(chrome.analytics(), "</head>");
  return lines.join("\n");
}

const CHROME_OPTS = {
  base: MAIN_URL,
  blogBase: "",
  active: "blog",
  logoSrc: LOGO,
  searchIndexUrl: MAIN_URL + "/assets/data/search-index.js",
  blogPostsUrl: "/posts.json",
};

function page(headHtml, mainHtml, endScripts) {
  return [
    headHtml,
    "<body>",
    chrome.header(CHROME_OPTS),
    '<main id="main" tabindex="-1">',
    mainHtml,
    "</main>",
    chrome.footer(Object.assign({ year: new Date().getFullYear() }, CHROME_OPTS)),
    endScripts || "",
    chrome.chatWidget(),
    "</body>",
    "</html>",
    "",
  ].join("\n");
}

function breadcrumbs(items) {
  const html =
    '<nav class="lj-breadcrumbs" aria-label="Breadcrumb"><ol>' +
    items
      .map(([name, href], i) =>
        i === items.length - 1
          ? '<li><span aria-current="page">' + escapeHtml(name.length > 70 ? name.slice(0, 69).replace(/\s+\S*$/, "") + "…" : name) + "</span></li>"
          : '<li><a href="' + href + '">' + escapeHtml(name) + "</a></li>"
      )
      .join("") +
    "</ol></nav>";
  const schema = {
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, href], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      item: href.indexOf("http") === 0 ? href : SITE_URL + href,
    })),
  };
  return { html, schema };
}

// ---------------------------------------------------------------------------
// Images: every featured PNG gets small WebP copies so post and card images
// stay light. The original PNG is kept for social share previews.
// ---------------------------------------------------------------------------

function webpPath(slug, width) {
  return WEBP_DIR + "/" + slug + "-" + width + ".webp";
}

function ensureWebp(imagePath, slug) {
  if (!imagePath) return Promise.resolve(false);
  const src = path.join(ROOT, imagePath);
  if (!fs.existsSync(src)) return Promise.resolve(false);
  let sharp;
  try {
    sharp = require("sharp");
  } catch (e) {
    console.warn("  sharp is not installed, skipping WebP copies for " + slug);
    return Promise.resolve(false);
  }
  fs.mkdirSync(path.join(ROOT, WEBP_DIR), { recursive: true });
  const srcTime = fs.statSync(src).mtimeMs;
  return Promise.all(
    WEBP_WIDTHS.map((w) => {
      const out = path.join(ROOT, webpPath(slug, w));
      if (fs.existsSync(out) && fs.statSync(out).mtimeMs >= srcTime) return null;
      return sharp(src).resize({ width: w, withoutEnlargement: true }).webp({ quality: 72 }).toFile(out);
    })
  ).then(() => true);
}

function hasWebp(slug) {
  return WEBP_WIDTHS.every((w) => fs.existsSync(path.join(ROOT, webpPath(slug, w))));
}

function imageSources(post) {
  if (!post.image) return null;
  if (hasWebp(post.slug)) {
    return {
      src: "/" + webpPath(post.slug, 640),
      srcset: WEBP_WIDTHS.map((w) => "/" + webpPath(post.slug, w) + " " + w + "w").join(", "),
    };
  }
  return { src: "/" + post.image, srcset: "" };
}

// ---------------------------------------------------------------------------
// Post cards. The markup matches postCard() in the main site's
// build/lib/blogfeed.js so cards look the same on both sites.
// ---------------------------------------------------------------------------

const CARD_SIZES = "(max-width: 640px) calc(100vw - 32px), (max-width: 960px) 45vw, 380px";

function postCard(post, opts) {
  opts = opts || {};
  const img = imageSources(post);
  const href = (opts.absolute ? SITE_URL : "") + "/posts/" + encodeURIComponent(post.slug) + ".html";
  const loading = opts.eager ? ' fetchpriority="high"' : ' loading="lazy"';
  const media = img
    ? '<span class="lj-post-card-media"><img src="' + img.src + '"' + (img.srcset ? ' srcset="' + img.srcset + '" sizes="' + CARD_SIZES + '"' : "") + ' width="640" height="360" alt=""' + loading + ' decoding="async"></span>'
    : "";
  const Tag = opts.heading || "h3";
  return (
    '<a class="lj-card lj-post-card" href="' + href + '" data-lj-item data-cat="' + escapeHtml(post.categorySlug || "") + '">' +
    media +
    '<span class="lj-post-card-body"><span class="lj-post-card-meta">' +
    (post.category ? '<span class="lj-tag">' + escapeHtml(post.category) + "</span>" : "") +
    '<time datetime="' + escapeHtml(post.date) + '">' + escapeHtml(post.dateDisplay || post.date) + "</time></span>" +
    "<" + Tag + ">" + escapeHtml(post.title) + "</" + Tag + ">" +
    (post.excerpt ? "<p>" + escapeHtml(post.excerpt) + "</p>" : "") +
    '<span class="lj-link-arrow">Read article ' + icon("arrowRight") + "</span></span></a>"
  );
}

// ---------------------------------------------------------------------------
// Post page
// ---------------------------------------------------------------------------

function readingMinutes(bodyHtml) {
  const words = bodyHtml.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 230));
}

function postUrl(slug) {
  return SITE_URL + "/posts/" + slug + ".html";
}

function slugifyHeading(text) {
  return text.toLowerCase().replace(/<[^>]+>/g, "").replace(/&[a-z]+;/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// Adds ids to <h2> headings (for the table of contents) without changing
// the stored post body. rebuild.js strips them again when it reads a page.
function withHeadingIds(bodyHtml) {
  const toc = [];
  const used = {};
  const html = bodyHtml.replace(/<h2>([\s\S]*?)<\/h2>/g, (all, inner) => {
    let id = slugifyHeading(inner) || "section";
    if (used[id]) id += "-" + ++used[id];
    else used[id] = 1;
    toc.push([id, inner.replace(/<[^>]+>/g, "")]);
    return '<h2 id="' + id + '">' + inner + "</h2>";
  });
  return { html, toc };
}

function relatedPosts(post, all, n) {
  const sorted = sortPosts(all).filter((p) => p.slug !== post.slug);
  const same = sorted.filter((p) => p.categorySlug === post.categorySlug);
  const picked = same.slice(0, n);
  sorted.forEach((p) => {
    if (picked.length < n && picked.indexOf(p) === -1) picked.push(p);
  });
  return picked;
}

function buildPostPage(post, allPosts) {
  allPosts = allPosts || [];
  const canonical = postUrl(post.slug);
  const title = post.title;
  const img = imageSources(post);
  const sizes = "(max-width: 860px) calc(100vw - 32px), 760px";
  const shareImage = post.image ? SITE_URL + "/" + post.image : SHARE_IMAGE;
  const topic = TOPIC_BY_SLUG[post.categorySlug] || topicFor(post.title);
  const crumbs = breadcrumbs([
    ["Home", MAIN_URL + "/"],
    ["Blog", "/"],
    [title, "/posts/" + post.slug + ".html"],
  ]);
  const body = withHeadingIds(post.bodyHtml);
  const minutes = readingMinutes(post.bodyHtml);
  const share = encodeURIComponent(canonical);
  const shareTitle = encodeURIComponent(title);
  const related = relatedPosts(post, allPosts, 3);

  const figure = img
    ? `<figure class="lj-article-figure"><img src="${img.src}"${img.srcset ? ` srcset="${img.srcset}" sizes="${sizes}"` : ""} width="1280" height="720" alt="${escapeHtml(title)}" fetchpriority="high" decoding="async"></figure>`
    : "";
  const preload =
    img && img.srcset ? `<link rel="preload" as="image" href="${img.src}" imagesrcset="${img.srcset}" imagesizes="${sizes}" fetchpriority="high">` : "";

  const headHtml = head({
    title: title + " | " + BLOG_NAME,
    description: post.description,
    canonical,
    ogType: "article",
    ogImage: shareImage,
    extraMeta: `<meta property="article:published_time" content="${post.date}"><meta property="article:section" content="${escapeHtml(topic.name)}">`,
    preloadImage: preload,
    jsonLd: [
      {
        "@type": "BlogPosting",
        "@id": canonical + "#article",
        headline: title,
        description: post.description,
        image: shareImage,
        datePublished: post.date,
        dateModified: post.date,
        articleSection: topic.name,
        wordCount: post.bodyHtml.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length,
        author: { "@id": chrome.ORGANIZATION["@id"] },
        publisher: { "@id": chrome.ORGANIZATION["@id"] },
        mainEntityOfPage: canonical,
        isPartOf: { "@type": "Blog", "@id": BLOG_HOME + "#blog", name: BLOG_NAME, url: BLOG_HOME },
      },
      crumbs.schema,
    ],
  });

  const mainHtml = `<header class="lj-article-hero">
  <div class="lj-container">
    ${crumbs.html}
    <a class="lj-eyebrow lj-eyebrow--pill" href="/?topic=${topic.slug}">${escapeHtml(topic.name)}</a>
    <h1>${escapeHtml(title)}</h1>
    <div class="lj-article-meta">
      <span class="lj-author"><img src="${LOGO}" width="36" height="36" alt=""><span>LJ Web Management<small>Automation team</small></span></span>
      <span>${icon("calendar")}<time datetime="${post.date}">${escapeHtml(post.dateDisplay)}</time></span>
      <span>${icon("clock")}${minutes} min read</span>
    </div>
  </div>
</header>
<div class="lj-container">
  <div class="lj-article-layout">
    <article>
      ${figure}
      <div class="lj-prose">
<!-- post-body:start -->
${body.html}
<!-- post-body:end -->
      </div>
      <div class="lj-article-footer">
        <div class="lj-share"><span>Share this article</span>
          <a href="https://www.linkedin.com/sharing/share-offsite/?url=${share}" target="_blank" rel="noopener" aria-label="Share on LinkedIn">${icon("linkedin")}</a>
          <a href="https://x.com/intent/post?url=${share}&amp;text=${shareTitle}" target="_blank" rel="noopener" aria-label="Share on X">${icon("xlogo")}</a>
          <a href="mailto:?subject=${shareTitle}&amp;body=${share}" aria-label="Share by email">${icon("mail")}</a>
        </div>
      </div>
    </article>
    <aside class="lj-article-aside" aria-label="On this page">
      ${body.toc.length > 1 ? '<nav class="lj-toc" aria-label="Table of contents"><p>On this page</p><ol>' + body.toc.map(([id, t]) => '<li><a href="#' + id + '">' + escapeHtml(t) + "</a></li>").join("") + "</ol></nav>" : ""}
      <div class="lj-aside-cta"><strong>Put this into practice</strong>See it as a done-for-you automation, with a flat, upfront quote.<a class="lj-btn lj-btn-accent lj-btn-sm" href="${main(topic.practice[0])}">Explore automations</a><a class="lj-aside-link" href="${main(topic.guide[0])}">Guide: ${escapeHtml(topic.guide[1])}</a><a class="lj-aside-link" href="${main("/resources/")}">Free courses, quizzes, and calculators</a></div>
    </aside>
  </div>
</div>
${related.length ? `<section class="lj-section lj-section--mist">
  <div class="lj-container">
    <div class="lj-section-head lj-section-head--split">
      <div><span class="lj-eyebrow">Keep reading</span><h2>More on ${escapeHtml(topic.name.toLowerCase())}</h2></div>
      <a class="lj-link-arrow" href="/?topic=${topic.slug}">All ${escapeHtml(topic.name)} articles ${icon("arrowRight")}</a>
    </div>
    <div class="lj-grid lj-grid-3">${related.map((p) => postCard(p)).join("")}</div>
  </div>
</section>` : ""}`;

  return page(headHtml, mainHtml);
}

// ---------------------------------------------------------------------------
// Blog home: the first page of cards is rendered at build time so the list
// is visible (and crawlable) without JavaScript. assets/js/main.js takes
// over for search, topic filters, sorting and pagination.
// ---------------------------------------------------------------------------

function sortPosts(posts) {
  return posts.slice().sort((a, b) => new Date(b.date) - new Date(a.date) || a.title.localeCompare(b.title));
}

function buildIndexPage(posts) {
  assignTopics(posts);
  const sorted = sortPosts(posts);
  const [featured, ...rest] = sorted;
  const first = rest.slice(0, PAGE_SIZE);
  const counts = {};
  sorted.forEach((p) => (counts[p.categorySlug] = (counts[p.categorySlug] || 0) + 1));
  const description =
    "Practical AI and automation insights for growing businesses: workflow playbooks, operations ideas, and beginner tech skills from LJ Web Management, published daily.";
  const fImg = featured ? imageSources(featured) : null;
  const featuredSizes = "(max-width: 820px) calc(100vw - 32px), 640px";

  const headHtml = head({
    title: "AI & Automation Blog | LJ Web Management",
    description,
    canonical: BLOG_HOME,
    preloadImage: fImg && fImg.srcset ? `<link rel="preload" as="image" href="${fImg.src}" imagesrcset="${fImg.srcset}" imagesizes="${featuredSizes}" fetchpriority="high">` : "",
    scripts: '<script src="/assets/js/main.js" defer></script>',
    jsonLd: [
      {
        "@type": "Blog",
        "@id": BLOG_HOME + "#blog",
        name: BLOG_NAME,
        url: BLOG_HOME,
        description,
        publisher: { "@id": chrome.ORGANIZATION["@id"] },
        inLanguage: "en-US",
        blogPost: sorted.slice(0, 10).map((p) => ({ "@type": "BlogPosting", headline: p.title, url: postUrl(p.slug), datePublished: p.date })),
      },
    ],
  });

  const featuredHtml = featured
    ? `<a class="lj-card lj-post-card lj-post-card--featured lj-blog-featured" href="/posts/${encodeURIComponent(featured.slug)}.html">
      ${fImg ? `<span class="lj-post-card-media"><img src="${fImg.src}"${fImg.srcset ? ` srcset="${fImg.srcset}" sizes="${featuredSizes}"` : ""} width="1280" height="720" alt="" fetchpriority="high" decoding="async"></span>` : ""}
      <span class="lj-post-card-body">
        <span class="lj-post-card-meta"><span class="lj-tag lj-tag--cyan">Latest</span><span class="lj-tag">${escapeHtml(featured.category)}</span><time datetime="${featured.date}">${escapeHtml(featured.dateDisplay)}</time></span>
        <h2 class="lj-mt-0" style="font-size:clamp(1.4rem,2.4vw,1.9rem)">${escapeHtml(featured.title)}</h2>
        ${featured.excerpt ? `<p>${escapeHtml(featured.excerpt)}</p>` : ""}
        <span class="lj-link-arrow">Read article ${icon("arrowRight")}</span>
      </span>
    </a>`
    : "";

  const chips = TOPICS.filter((t) => counts[t.slug])
    .map((t) => `<button type="button" class="lj-chip" data-topic="${t.slug}" aria-pressed="false">${escapeHtml(t.name)} <span class="lj-chip-count">${counts[t.slug]}</span></button>`)
    .join("");

  const mainHtml = `<section class="lj-page-hero lj-page-hero--center">
  <div class="lj-container">
    <span class="lj-eyebrow lj-eyebrow--pill">AI &amp; automation blog</span>
    <h1>Automation ideas you can <span class="lj-gradient-text--ink">use this week</span></h1>
    <p class="lj-lead">Practical playbooks for growing businesses: workflows worth automating, how AI fits into real operations, and beginner tech skills. New articles every day.</p>
    <div class="lj-btn-row"><button type="button" class="lj-btn lj-btn-primary" data-lj-newsletter-join>${icon("mail")}Join the Newsletter</button><a class="lj-btn lj-btn-ghost" href="${main("/resources/")}">Resource Center</a><a class="lj-btn lj-btn-ghost" href="/feed.xml">${icon("rss")}RSS</a></div>
  </div>
</section>

<section class="lj-section" id="articles" aria-labelledby="articles-title">
  <div class="lj-container">
    ${featuredHtml}
    <h2 id="articles-title" class="lj-blog-title">Browse by topic</h2>
    <div class="lj-blog-controls">
      <div class="lj-input-wrap">${icon("search")}<label class="lj-sr-only" for="search-input">Search articles</label><input type="search" id="search-input" class="lj-input" placeholder="Search articles&hellip;" autocomplete="off"></div>
      <label class="lj-sr-only" for="sort-select">Sort articles</label>
      <select id="sort-select" class="lj-input">
        <option value="date-desc">Newest first</option>
        <option value="date-asc">Oldest first</option>
        <option value="title-asc">Title: A to Z</option>
        <option value="title-desc">Title: Z to A</option>
      </select>
    </div>
    <div class="lj-filter-chips" role="group" aria-label="Filter by topic" id="topic-chips">
      <button type="button" class="lj-chip" data-topic="" aria-pressed="true">All topics <span class="lj-chip-count">${sorted.length}</span></button>${chips}
    </div>
    <p id="posts-status" class="lj-filter-status" role="status" aria-live="polite" style="margin:14px 0 0"></p>
    <div id="posts-list" class="lj-grid lj-grid-3" style="margin-top:18px" data-total="${rest.length}" data-page-size="${PAGE_SIZE}">
${first.map((p, i) => "      " + postCard(p, { eager: i === 0 })).join("\n")}
    </div>
    <nav id="pagination" class="lj-pagination" aria-label="Blog pagination"${rest.length > PAGE_SIZE ? "" : " hidden"}></nav>
  </div>
</section>

<dialog class="lj-popup" id="lj-newsletter" aria-labelledby="lj-newsletter-title" aria-describedby="lj-newsletter-desc">
  <div class="lj-popup-head">
    <button type="button" class="lj-popup-close" data-lj-popup-close aria-label="Close">${icon("close")}</button>
    <span class="lj-card-icon">${icon("mail")}</span>
    <h2 id="lj-newsletter-title">Automation ideas, straight to your inbox</h2>
    <p id="lj-newsletter-desc">Practical workflows, AI tips, and new guides from the team that builds them. Free, and you can unsubscribe anytime.</p>
  </div>
  <div class="lj-popup-body">
    <button type="button" class="lj-btn lj-btn-primary lj-btn-block" data-lj-newsletter-join autofocus>Join the Newsletter ${icon("arrowRight")}</button>
    <label class="lj-popup-check"><input type="checkbox" data-lj-popup-never> Don't show this again</label>
    <p class="lj-popup-note">We use your email address only to send the newsletter, through Typeform. Unsubscribe anytime. <a href="${main("/privacy-policy/")}">Privacy Policy</a></p>
  </div>
</dialog>`;

  return page(headHtml, mainHtml);
}

// ---------------------------------------------------------------------------
// Newsletter unsubscribe page and 404
// ---------------------------------------------------------------------------

function buildUnsubscribePage() {
  const headHtml = head({
    title: "Unsubscribe from Newsletter | LJ Web Management",
    description: "Unsubscribe from the LJ Web Management AI & Automation newsletter.",
    robots: "noindex",
    canonical: SITE_URL + "/newsletter/unsubscibe/",
    scripts: '<script src="https://embed.typeform.com/next/embed.js" defer></script>',
  });
  const mainHtml = `<section class="lj-page-hero lj-page-hero--center">
  <div class="lj-container">
    <span class="lj-eyebrow lj-eyebrow--pill">Newsletter</span>
    <h1>Unsubscribe from our newsletter</h1>
    <p class="lj-lead">Sorry to see you go. Confirm below and we'll stop sending the newsletter.</p>
  </div>
</section>
<section class="lj-section">
  <div class="lj-container lj-container--narrow">
    <div class="lj-embed"><div data-tf-live="01KZAN1VGA3KXYRTZH1WWXKKER"></div></div>
    <p class="lj-notice">We use the email address you enter here only to remove it from our newsletter list. Typeform processes this form for us. See our <a href="${main("/privacy-policy/")}">Privacy Policy</a>.</p>
    <p class="lj-center lj-mt-lg"><a class="lj-btn lj-btn-ghost" href="/">${icon("arrowLeft")} Back to the Blog</a></p>
  </div>
</section>`;
  return page(headHtml, mainHtml);
}

function buildNotFoundPage() {
  const headHtml = head({ title: "Page Not Found | LJ Web Management Blog", description: "The page you were looking for could not be found.", robots: "noindex, follow" });
  const mainHtml = `<section class="lj-page-hero lj-page-hero--dark lj-page-hero--center" style="padding-block:96px">
  <div class="lj-container">
    <span class="lj-eyebrow lj-eyebrow--pill">Error 404</span>
    <h1>This page couldn't be found</h1>
    <p class="lj-lead" style="margin-inline:auto">The article you're looking for doesn't exist or has moved. Try searching, or head back to the latest posts.</p>
    <div style="max-width:560px;margin:28px auto 0"><button type="button" class="lj-hero-search" data-lj-search-open aria-label="Search the site">${icon("search")}<span class="lj-hero-search-text">Search articles, automations, and guides</span><span class="lj-btn lj-btn-primary lj-btn-sm">Search</span></button></div>
    <div class="lj-hero-quick" style="justify-content:center"><a href="/">Latest articles</a><a href="${main("/")}">LJ Web Management home</a><a href="${main("/automations/")}">Automations</a><a href="${main("/guides/")}">Guides</a></div>
  </div>
</section>`;
  return page(headHtml, mainHtml);
}

// ---------------------------------------------------------------------------
// Feeds: RSS, sitemap, and the latest-posts script the main site embeds.
// ---------------------------------------------------------------------------

function xmlEscape(s) {
  return escapeHtml(s).replace(/'/g, "&apos;");
}

function buildFeed(posts) {
  const items = sortPosts(posts)
    .slice(0, 50)
    .map(
      (p) =>
        "    <item>\n" +
        "      <title>" + xmlEscape(p.title) + "</title>\n" +
        "      <link>" + postUrl(p.slug) + "</link>\n" +
        '      <guid isPermaLink="true">' + postUrl(p.slug) + "</guid>\n" +
        "      <pubDate>" + new Date(p.date + "T12:00:00Z").toUTCString() + "</pubDate>\n" +
        "      <category>" + xmlEscape(p.category || "") + "</category>\n" +
        "      <description>" + xmlEscape(p.excerpt || "") + "</description>\n" +
        "    </item>"
    )
    .join("\n");
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n  <channel>\n' +
    "    <title>" + BLOG_NAME + "</title>\n    <link>" + BLOG_HOME + "</link>\n" +
    "    <description>Practical AI and automation insights for growing businesses.</description>\n    <language>en-us</language>\n" +
    '    <atom:link href="' + SITE_URL + '/feed.xml" rel="self" type="application/rss+xml"/>\n' +
    items +
    "\n  </channel>\n</rss>\n"
  );
}

function buildSitemap(posts) {
  const urls = [{ loc: BLOG_HOME, lastmod: sortPosts(posts)[0].date, freq: "daily", pri: "1.0" }].concat(
    sortPosts(posts).map((p) => ({ loc: postUrl(p.slug), lastmod: p.date, freq: "monthly", pri: "0.7" }))
  );
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) => "  <url>\n    <loc>" + u.loc + "</loc>\n    <lastmod>" + u.lastmod + "</lastmod>\n    <changefreq>" + u.freq + "</changefreq>\n    <priority>" + u.pri + "</priority>\n  </url>").join("\n") +
    "\n</urlset>\n"
  );
}

// Script loaded by www.ljwebmanagement.com (home page and guides hub) to show
// the newest posts. It fills every [data-lj-latest-posts] element.
function buildLatestPostsScript(posts) {
  const latest = sortPosts(posts)
    .slice(0, 6)
    .map((p) => {
      const img = imageSources(p);
      return { t: p.title, u: postUrl(p.slug), d: p.date, dd: p.dateDisplay, c: p.category, e: p.excerpt && p.excerpt.length > 130 ? p.excerpt.slice(0, 129).replace(/\s+\S*$/, "") + "…" : p.excerpt, i: img ? SITE_URL + img.src : "" };
    });
  const arrow = icon("arrowRight").replace(/'/g, "\\'");
  return (
    "/* Generated by scripts/templates.js on every publish. Do not edit. */\n" +
    "(function () {\n" +
    "  var posts = " + JSON.stringify(latest).replace(/</g, "\\u003c") + ";\n" +
    "  function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;'); }\n" +
    "  function card(p) {\n" +
    "    return '<a class=\"lj-card lj-post-card\" href=\"' + esc(p.u) + '\">' +\n" +
    "      (p.i ? '<span class=\"lj-post-card-media\"><img src=\"' + esc(p.i) + '\" width=\"640\" height=\"360\" alt=\"\" loading=\"lazy\" decoding=\"async\"></span>' : '') +\n" +
    "      '<span class=\"lj-post-card-body\"><span class=\"lj-post-card-meta\">' + (p.c ? '<span class=\"lj-tag\">' + esc(p.c) + '</span>' : '') +\n" +
    "      '<time datetime=\"' + esc(p.d) + '\">' + esc(p.dd) + '</time></span><h3>' + esc(p.t) + '</h3>' + (p.e ? '<p>' + esc(p.e) + '</p>' : '') +\n" +
    "      '<span class=\"lj-link-arrow\">Read article " + arrow + "</span></span></a>';\n" +
    "  }\n" +
    "  function render() {\n" +
    "    var nodes = document.querySelectorAll('[data-lj-latest-posts]');\n" +
    "    for (var i = 0; i < nodes.length; i++) {\n" +
    "      var n = parseInt(nodes[i].getAttribute('data-count'), 10) || 3;\n" +
    "      nodes[i].innerHTML = posts.slice(0, n).map(card).join('');\n" +
    "    }\n" +
    "  }\n" +
    "  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render); else render();\n" +
    "})();\n"
  );
}

module.exports = {
  SITE_URL,
  PAGE_SIZE,
  TOPICS,
  escapeHtml,
  ensureWebp,
  assignTopics,
  buildPostPage,
  buildIndexPage,
  buildUnsubscribePage,
  buildNotFoundPage,
  buildFeed,
  buildSitemap,
  buildLatestPostsScript,
  postUrl,
};
