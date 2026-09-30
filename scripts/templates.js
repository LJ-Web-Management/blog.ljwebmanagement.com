// Shared page templates for the blog. The header, full-screen menu and
// footer markup are copied from the main site (LJ-Web-Management/ljwebmanagement.com,
// index.html and faq/index.html) with every link made absolute, so the blog
// and www.ljwebmanagement.com look and behave the same.

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SITE_URL = "https://blog.ljwebmanagement.com";
const MAIN_URL = "https://www.ljwebmanagement.com";
const BLOG_HOME = SITE_URL + "/";
const SHARE_IMAGE = MAIN_URL + "/assets/social-share.png";
const GA_ID = "G-SFXD7K93JS";
const CLARITY_ID = "ylzewu0va8";
const WEBP_DIR = "assets/img/posts/webp";
const WEBP_WIDTHS = [640, 1280];

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

// Same Organization node as the main site's homepage JSON-LD, so search
// engines treat the blog and the main site as one entity.
const ORGANIZATION = {
  "@type": "ProfessionalService",
  "@id": MAIN_URL + "/#organization",
  name: "LJ Web Management",
  url: MAIN_URL + "/",
  logo: MAIN_URL + "/assets/lj-logo.webp",
  image: MAIN_URL + "/assets/lj-logo.webp",
  description:
    "LJ Web Management is a business automation company that builds custom AI workflow automation systems, removing repetitive tasks and bottlenecks by connecting the business tools teams already use.",
  telephone: "+1-877-559-3268",
  email: "info@ljwebmanagement.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "1108 E 9th St.",
    addressLocality: "Lockport",
    addressRegion: "IL",
    postalCode: "60441",
    addressCountry: "US",
  },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    opens: "00:00",
    closes: "23:59",
    description: "Available by appointment",
  },
  priceRange: "$$",
  sameAs: ["https://www.linkedin.com/company/ljwebmanagement", "https://x.com/lj_web_mgmt"],
};

function jsonLd(nodes) {
  const data = { "@context": "https://schema.org", "@graph": nodes };
  // Escape "<" so post titles can never close the script element early.
  return (
    '<script type="application/ld+json">\n' +
    JSON.stringify(data, null, 2).replace(/</g, "\\u003c") +
    "\n</script>"
  );
}

// Google Analytics and Microsoft Clarity, loaded the same way as on the main
// site: calls queue immediately, the libraries load on the first user
// interaction so they never compete with the initial render.
function analyticsSnippet() {
  return `<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${GA_ID}');
  window.clarity = window.clarity || function(){(window.clarity.q = window.clarity.q || []).push(arguments);};
  (function(){
    var loaded = false, events = ['pointerdown', 'mousemove', 'scroll', 'touchstart', 'keydown'];
    function add(src){ var s = document.createElement('script'); s.async = true; s.src = src; document.head.appendChild(s); }
    function load(){
      if (loaded) return;
      loaded = true;
      events.forEach(function(e){ window.removeEventListener(e, load); });
      add('https://www.googletagmanager.com/gtag/js?id=${GA_ID}');
      add('https://www.clarity.ms/tag/${CLARITY_ID}');
    }
    events.forEach(function(e){ window.addEventListener(e, load, {passive: true}); });
  })();
</script>`;
}

// assets/css/style.css is the source; it is minified and inlined in every
// page's <head> (as the main site does) so the first paint needs no extra
// request.
let inlineCss = null;
function siteCss() {
  if (inlineCss === null) {
    inlineCss = fs
      .readFileSync(path.join(ROOT, "assets", "css", "style.css"), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\s+/g, " ")
      .replace(/\s*([{}:;,>])\s*/g, "$1")
      .replace(/;}/g, "}")
      .trim();
  }
  return inlineCss;
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
    '<meta name="twitter:image" content="' + escapeHtml(ogImage) + '">'
  );
  if (opts.extraMeta) lines.push(opts.extraMeta);
  lines.push(
    '<link rel="icon" href="/assets/img/favicon.ico" sizes="any">',
    '<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">',
    '<link rel="preload" href="/assets/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin>',
    '<link rel="preload" href="/assets/fonts/sora-latin.woff2" as="font" type="font/woff2" crossorigin>'
  );
  if (opts.preloadImage) lines.push(opts.preloadImage);
  lines.push("<style>" + siteCss() + "</style>");
  lines.push('<script src="/assets/js/nav.js" defer></script>');
  if (opts.scripts) lines.push(opts.scripts);
  if (opts.jsonLd) lines.push(jsonLd(opts.jsonLd));
  lines.push(analyticsSnippet(), "</head>");
  return lines.join("\n");
}

const HEADER = `<a class="lj-skip" href="#main">Skip to Content</a>
<header class="lj-site-header">
  <div class="lj-header-container">
    <div class="lj-topbar">
        <div class="lj-topbar-inner">
            <a href="${main("/")}" class="lj-topbar-logo" aria-label="LJ Web Management home">
                <img src="/assets/img/lj-logo-80.webp" width="40" height="40" alt="LJ Web Management" loading="eager">
            </a>
            <div class="lj-topbar-right">
                <a href="${main("/contactus/")}" class="lj-topbar-cta">Contact Us</a>
                <button type="button" class="lj-menu-toggle" aria-expanded="false" aria-controls="lj-mega-menu" aria-label="Open menu">
                    <span class="lj-menu-toggle-bars"><span></span><span></span><span></span></span>
                    <span class="lj-menu-toggle-label">Menu</span>
                </button>
            </div>
        </div>
    </div>
  </div>

    <div id="lj-mega-menu" class="lj-mega-menu" aria-hidden="true">
        <div class="lj-mega-menu-inner">
            <button type="button" class="lj-mega-menu-close" aria-label="Close menu">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg>
            </button>
            <a href="${main("/")}" class="lj-mega-menu-logo" aria-label="LJ Web Management home">
                <img src="/assets/img/lj-logo-80.webp" width="40" height="40" alt="LJ Web Management" loading="lazy">
            </a>
            <div class="lj-mega-grid">
                <nav class="lj-mega-col" aria-label="Company">
                    <h3>Company</h3>
                    <a href="${main("/")}">Home</a>
                    <a href="${main("/how-it-works/")}">How It Works</a>
                    <a href="${main("/solutions/")}">Platform Solutions</a>
                    <a href="${main("/faq/")}">Automation FAQ</a>
                    <a href="${main("/contactus/")}">Contact Us</a>
                </nav>
                <nav class="lj-mega-col" aria-label="Automations by industry">
                    <h3>Automations by Industry</h3>
                    <a href="${main("/automations/real-estate/")}">Real Estate Automation</a>
                    <a href="${main("/automations/healthcare/")}">Healthcare Automation</a>
                    <a href="${main("/automations/legal/")}">Legal Automation</a>
                    <a href="${main("/automations/home-services/")}">Home Services Automation</a>
                    <a href="${main("/automations/general-business/")}">General Business Automation</a>
                    <a href="${main("/automations/ecommerce-retail/")}">E-Commerce &amp; Retail Automation</a>
                    <a href="${main("/automations/financial-services/")}">Financial Services Automation</a>
                    <a href="${main("/automations/restaurants-food-service/")}">Restaurants &amp; Food Service Automation</a>
                    <a href="${main("/automations/property-management/")}">Property Management Automation</a>
                    <a href="${main("/automations/construction-contracting/")}">Construction &amp; Contracting Automation</a>
                    <a href="${main("/automations/marketing-agencies/")}">Marketing Agencies Automation</a>
                    <a href="${main("/automations/")}" class="lj-mega-viewall">All 57 Industry Automations &rarr;</a>
                </nav>
                <nav class="lj-mega-col" aria-label="Resources">
                    <h3>Resources</h3>
                    <a href="${main("/roi-calculator/")}">Automation ROI Calculator</a>
                    <a href="${main("/quiz/")}">Automation Match Quiz</a>
                    <a href="${main("/resources/what-is-business-automation/")}">What Is Business Automation?</a>
                    <a href="${main("/resources/business-automation-examples/")}">Business Automation Examples</a>
                    <a href="${main("/resources/ai-automation-for-small-business/")}">AI Automation for Small Business</a>
                    <a href="${BLOG_HOME}">LJ Web Management Blog</a>
                </nav>
                <div class="lj-mega-col lj-mega-cta">
                    <h3>Get Started</h3>
                    <p>Book a free consultation and we'll scope your automation with a flat, upfront quote.</p>
                    <a href="${main("/appointment/")}" class="lj-btn-cyan">Book a Free Consultation</a>
                    <div class="lj-mega-contact">
                        <a href="tel:+18775593268">+1-877-559-3268</a>
                        <a href="mailto:info@ljwebmanagement.com">info@ljwebmanagement.com</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</header>`;

function footer() {
  return `<footer id="bottom" class="lj-footer">
  <div class="lj-footer-top">
    <div class="lj-footer-inner">
      <div class="lj-footer-grid">
        <div class="lj-footer-brand">
          <a href="${main("/")}" aria-label="LJ Web Management home">
            <img src="/assets/img/lj-logo-80.webp" alt="LJ Web Management" width="40" height="40" loading="lazy">
          </a>
          <p>LJ Web Management builds custom AI automation systems that remove repetitive tasks and bottlenecks, connecting the tools you already use so your team can save time and focus on growth.</p>
          <div class="lj-footer-social">
            <a href="https://www.linkedin.com/company/ljwebmanagement" target="_blank" rel="noopener" aria-label="LinkedIn"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45z"></path></svg></a>
            <a href="https://x.com/lj_web_mgmt" target="_blank" rel="noopener" aria-label="X (Twitter)"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg></a>
          </div>
        </div>
        <div class="lj-footer-col">
          <h2>Company</h2>
          <a href="${main("/")}">Home</a>
          <a href="${main("/how-it-works/")}">How It Works</a>
          <a href="${main("/automations/")}">Automations by Industry</a>
          <a href="${main("/solutions/")}">Platform Solutions</a>
          <a href="${main("/appointment/")}">Book a Free Consultation</a>
        </div>
        <div class="lj-footer-col">
          <h2>Free Tools</h2>
          <a href="${main("/roi-calculator/")}">Automation ROI Calculator</a>
          <a href="${main("/quiz/")}">Automation Match Quiz</a>
          <a href="${main("/faq/")}">Automation FAQ</a>
          <a href="${BLOG_HOME}">LJ Web Management Blog</a>
        </div>
        <div class="lj-footer-col">
          <h2>Get in Touch</h2>
          <a href="${main("/contactus/")}">Contact Us</a>
          <a href="mailto:info@ljwebmanagement.com">info@ljwebmanagement.com</a>
          <a href="tel:+18775593268">+1 (877) 559-3268</a>
          <span class="lj-footer-address">1108 E 9th St, Lockport, IL 60441</span>
        </div>
      </div>
    </div>
  </div>
  <div class="lj-footer-bottom">
    <div class="lj-footer-inner lj-footer-bottom-row">
      <span>${new Date().getFullYear()} &copy; LJ Web Management, LLC. All Rights Reserved</span>
      <nav class="lj-footer-legal" aria-label="Legal">
        <a href="${main("/privacy-policy/")}">Privacy Policy</a>
        <a href="${main("/terms-of-service/")}">Terms of Service</a>
      </nav>
    </div>
  </div>
</footer>`;
}

// Closing call to action shown on every post (and on the blog home).
function ctaBox() {
  return `<aside class="lj-post-cta" aria-labelledby="lj-post-cta-title">
  <h2 id="lj-post-cta-title">Ready to Put This Workflow to Work?</h2>
  <p>Book a free consultation and we'll show you exactly where automation fits in your business, with a flat, upfront quote.</p>
  <div class="lj-post-cta-row">
    <a href="${main("/appointment/")}" class="lj-btn lj-btn-cyan">Book a Free Automation Consultation</a>
    <a href="${main("/automations/")}" class="lj-btn lj-btn-outline">Browse Automations by Industry</a>
  </div>
</aside>`;
}

function page(headHtml, mainHtml) {
  return headHtml + "\n<body>\n" + HEADER + "\n" + mainHtml + "\n" + footer() + "\n</body>\n</html>\n";
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
// Post page
// ---------------------------------------------------------------------------

function readingMinutes(bodyHtml) {
  const words = bodyHtml.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 230));
}

function postUrl(slug) {
  return SITE_URL + "/posts/" + slug + ".html";
}

function buildPostPage(post) {
  const canonical = postUrl(post.slug);
  const title = post.title;
  const img = imageSources(post);
  const sizes = "(max-width: 868px) calc(100vw - 48px), 820px";
  const shareImage = post.image ? SITE_URL + "/" + post.image : SHARE_IMAGE;

  const figure = img
    ? `    <figure class="lj-post-figure">
      <img src="${img.src}"${img.srcset ? ` srcset="${img.srcset}" sizes="${sizes}"` : ""} width="1280" height="720" alt="${escapeHtml(title)}" fetchpriority="high" decoding="async">
    </figure>
`
    : "";
  const preload =
    img && img.srcset
      ? `<link rel="preload" as="image" href="${img.src}" imagesrcset="${img.srcset}" imagesizes="${sizes}" fetchpriority="high">`
      : "";

  const headHtml = head({
    title: title + " | LJ Web Management Blog",
    description: post.description,
    canonical,
    ogType: "article",
    ogImage: shareImage,
    extraMeta: `<meta property="article:published_time" content="${post.date}">`,
    preloadImage: preload,
    jsonLd: [
      ORGANIZATION,
      {
        "@type": "BlogPosting",
        "@id": canonical + "#article",
        headline: title,
        description: post.description,
        image: shareImage,
        datePublished: post.date,
        dateModified: post.date,
        author: { "@id": ORGANIZATION["@id"] },
        publisher: { "@id": ORGANIZATION["@id"] },
        mainEntityOfPage: canonical,
        isPartOf: { "@type": "Blog", "@id": BLOG_HOME + "#blog", name: "LJ Web Management Blog", url: BLOG_HOME },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: MAIN_URL + "/" },
          { "@type": "ListItem", position: 2, name: "Blog", item: BLOG_HOME },
          { "@type": "ListItem", position: 3, name: title, item: canonical },
        ],
      },
    ],
  });

  const mainHtml = `<main id="main" class="lj-post" tabindex="-1">
  <article>
    <header class="lj-post-hero">
      <div class="lj-post-hero-inner">
        <a class="lj-back-link" href="/">&larr; All Articles</a>
        <span class="lj-eyebrow">AI &amp; Automation Insights</span>
        <h1>${escapeHtml(title)}</h1>
        <p class="lj-post-meta">By <a href="${main("/")}">LJ Web Management</a> <span aria-hidden="true">&middot;</span> <time datetime="${post.date}">${escapeHtml(post.dateDisplay)}</time> <span aria-hidden="true">&middot;</span> ${readingMinutes(post.bodyHtml)} min read</p>
      </div>
    </header>
    <div class="lj-post-wrap">
${figure}      <div class="lj-post-content">
${post.bodyHtml}
      </div>
${ctaBox()}
    </div>
  </article>
</main>`;

  return page(headHtml, mainHtml);
}

// ---------------------------------------------------------------------------
// Blog home: the first page of cards is rendered here at build time so the
// list is visible (and crawlable) without JavaScript. assets/js/main.js takes
// over for search, sorting and pagination.
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20;
const CARD_SIZES = "(max-width: 640px) calc(100vw - 48px), (max-width: 1024px) 45vw, 360px";

function sortPosts(posts) {
  return posts.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
}

function cardHtml(post, index) {
  const img = imageSources(post);
  const thumb = img
    ? `<img class="lj-card-thumb" src="${img.src}"${img.srcset ? ` srcset="${img.srcset}" sizes="${CARD_SIZES}"` : ""} width="640" height="360" alt="" ${index === 0 ? 'fetchpriority="high"' : index < 3 ? "" : 'loading="lazy"'} decoding="async">`
    : '<div class="lj-card-thumb lj-card-thumb--empty" aria-hidden="true"></div>';
  return (
    '<a class="lj-card" href="/posts/' + encodeURIComponent(post.slug) + '.html">' +
    thumb +
    '<div class="lj-card-body">' +
    '<time class="lj-card-date" datetime="' + escapeHtml(post.date) + '">' + escapeHtml(post.dateDisplay || post.date) + "</time>" +
    '<h2 class="lj-card-title">' + escapeHtml(post.title) + "</h2>" +
    (post.excerpt ? '<p class="lj-card-excerpt">' + escapeHtml(post.excerpt) + "</p>" : "") +
    '<span class="lj-card-more" aria-hidden="true">Read article &rarr;</span>' +
    "</div></a>"
  );
}

function buildIndexPage(posts) {
  const sorted = sortPosts(posts);
  const first = sorted.slice(0, PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const description =
    "Practical AI and automation insights for growing businesses: workflow ideas, operations playbooks and analysis from LJ Web Management.";

  const firstImg = first.length ? imageSources(first[0]) : null;
  const headHtml = head({
    title: "AI & Automation Insights | LJ Web Management Blog",
    preloadImage:
      firstImg && firstImg.srcset
        ? `<link rel="preload" as="image" href="${firstImg.src}" imagesrcset="${firstImg.srcset}" imagesizes="${CARD_SIZES}" fetchpriority="high">`
        : "",
    description,
    canonical: BLOG_HOME,
    scripts: '<script src="/assets/js/main.js" defer></script>',
    jsonLd: [
      ORGANIZATION,
      {
        "@type": "Blog",
        "@id": BLOG_HOME + "#blog",
        name: "LJ Web Management Blog",
        url: BLOG_HOME,
        description,
        publisher: { "@id": ORGANIZATION["@id"] },
        inLanguage: "en-US",
      },
    ],
  });

  const mainHtml = `<main id="main" class="lj-blog" tabindex="-1">
  <section class="lj-blog-hero">
    <div class="lj-blog-hero-inner">
      <span class="lj-eyebrow">AI &amp; Automation Blog</span>
      <h1>AI &amp; Automation Insights</h1>
      <p>News, insights, and analysis on AI and automation for growing businesses, from LJ Web Management.</p>
    </div>
  </section>

  <section class="lj-blog-list" aria-label="Articles">
    <div class="lj-blog-inner">
      <div class="lj-controls">
        <label class="lj-sr-only" for="search-input">Search posts</label>
        <input type="search" id="search-input" class="lj-input lj-search" placeholder="Search posts&hellip;">
        <label class="lj-sr-only" for="sort-select">Sort posts</label>
        <select id="sort-select" class="lj-input lj-sort">
          <option value="date-desc">Date: Newest first</option>
          <option value="date-asc">Date: Oldest first</option>
          <option value="title-asc">Name: A to Z</option>
          <option value="title-desc">Name: Z to A</option>
        </select>
      </div>
      <p id="posts-status" class="lj-sr-only" role="status" aria-live="polite"></p>
      <div id="posts-list" class="lj-card-grid" data-total="${sorted.length}">
${first.map((p, i) => "        " + cardHtml(p, i)).join("\n")}
      </div>
      <nav id="pagination" class="lj-pagination" aria-label="Blog pagination"${totalPages > 1 ? "" : " hidden"}></nav>
    </div>
  </section>

  <section class="lj-blog-cta">
    <div class="lj-blog-inner">
${ctaBox()}
    </div>
  </section>
  <div class="lj-newsletter-corner"><div data-tf-live="01KZAMHRP7TNX59ZZ7J2GXR8E1"></div></div>
</main>`;

  return page(headHtml, mainHtml);
}

// ---------------------------------------------------------------------------
// Newsletter unsubscribe page
// ---------------------------------------------------------------------------

function buildUnsubscribePage() {
  const headHtml = head({
    title: "Unsubscribe from Newsletter | LJ Web Management",
    description: "Unsubscribe from the LJ Web Management AI & Automation newsletter.",
    robots: "noindex",
    canonical: SITE_URL + "/newsletter/unsubscibe/",
    scripts: '<script src="https://embed.typeform.com/next/embed.js" defer></script>',
  });
  const mainHtml = `<main id="main" class="lj-blog" tabindex="-1">
  <section class="lj-blog-hero">
    <div class="lj-blog-hero-inner">
      <span class="lj-eyebrow">Newsletter</span>
      <h1>Unsubscribe from our Newsletter</h1>
    </div>
  </section>
  <section class="lj-blog-list">
    <div class="lj-blog-inner lj-unsubscribe">
      <div data-tf-live="01KZAN1VGA3KXYRTZH1WWXKKER"></div>
      <p class="lj-unsubscribe-back"><a class="lj-btn lj-btn-outline" href="/">&larr; Back to the Blog</a></p>
    </div>
  </section>
</main>`;
  return page(headHtml, mainHtml);
}

module.exports = {
  SITE_URL,
  PAGE_SIZE,
  escapeHtml,
  ensureWebp,
  buildPostPage,
  buildIndexPage,
  buildUnsubscribePage,
  postUrl,
};
