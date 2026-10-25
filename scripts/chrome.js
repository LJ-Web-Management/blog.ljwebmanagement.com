// Shared site chrome: header, navigation, search dialog, footer, icons,
// analytics and the Organization schema node.
//
// This file is used by BOTH sites and must stay identical in:
//   LJ-Web-Management/ljwebmanagement.com       build/lib/chrome.js
//   LJ-Web-Management/blog.ljwebmanagement.com  scripts/chrome.js
// It has no dependencies so it can be copied between the repos as is.
// Every link is built from `base` (main site) and `blogBase` (blog), so the
// main site renders root-relative links to itself and absolute links to the
// blog, and the blog does the reverse.

const SITE_URL = "https://www.ljwebmanagement.com";
const BLOG_URL = "https://blog.ljwebmanagement.com";
const GA_ID = "G-SFXD7K93JS";
const CLARITY_ID = "ylzewu0va8";
const PHONE = "+1-877-559-3268";
const PHONE_DISPLAY = "+1 (877) 559-3268";
const EMAIL = "info@ljwebmanagement.com";

const SOCIAL = [
  { name: "LinkedIn", url: "https://www.linkedin.com/company/ljwebmanagement/", icon: "linkedin" },
  { name: "Instagram", url: "https://www.instagram.com/ljwebmanagement/", icon: "instagram" },
  { name: "X (Twitter)", url: "https://x.com/lj_web_mgmt", icon: "xlogo" },
];

// Navigation data. Category and industry names must match
// content/taxonomy.js and content/automations.json on the main site (the
// main build checks this).
const NAV_CATEGORIES = [
  ["lead-follow-up-sales", "Lead Follow-Up & Sales", "target"],
  ["marketing-retention", "Marketing & Customer Retention", "megaphone"],
  ["scheduling-dispatch", "Scheduling, Reminders & Dispatch", "calendar"],
  ["customer-communication", "Customer Service & Communication", "message"],
  ["reviews-feedback", "Reviews, Feedback & Reputation", "star"],
  ["billing-finance", "Billing, Payments & Finance", "receipt"],
  ["onboarding-intake", "Client Onboarding & Intake", "userPlus"],
  ["hr-team", "HR, Hiring & Team Management", "users"],
  ["compliance-documents", "Compliance, Documents & Deadlines", "shield"],
  ["operations-inventory", "Operations, Inventory & Vendors", "box"],
  ["reporting-analytics", "Reporting & Analytics", "chart"],
];

// Solution categories for the Solutions menu. build.js checks these against
// content/solutions/ so the menu never drifts from the solution pages.
const NAV_SOLUTIONS = [
  ["websites-digital-presence", "Websites & Digital Presence", "layers", "Sites, stores, SEO, AI chat"],
  ["sales-marketing", "Sales, CRM & Marketing", "target", "CRM, campaigns, quotes, reviews"],
  ["customer-experience", "Customer Experience & Support", "message", "Booking, portals, help desk"],
  ["operations-field-service", "Operations & Field Service", "tool", "Dispatch, inventory, projects"],
  ["finance-billing", "Finance, Billing & Payments", "receipt", "Billing, AR, AP, month-end close"],
  ["erp-enterprise-systems", "ERP & Enterprise Systems", "building", "ERP, integrations, compliance"],
  ["hr-people-training", "HR, People & Training", "users", "Payroll, hiring, scheduling, LMS"],
  ["data-ai-analytics", "Data, AI & Analytics", "chart", "Dashboards, AI agents, forecasting"],
  ["industry-platforms-saas", "Industry Platforms, Apps & SaaS", "grid", "POS, marketplaces, apps, SaaS"],
];

const NAV_INDUSTRIES = [
  ["real-estate", "Real Estate"],
  ["healthcare", "Healthcare"],
  ["legal", "Legal"],
  ["home-services", "Home Services"],
  ["restaurants-food-service", "Restaurants & Food Service"],
  ["ecommerce-retail", "E-Commerce & Retail"],
  ["property-management", "Property Management"],
  ["fitness-wellness", "Fitness & Wellness"],
  ["professional-services", "Professional Services"],
  ["automotive", "Automotive"],
];

const ICONS = {
  arrowRight: '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
  arrowLeft: '<path d="M19 12H5"/><path d="M11 18l-6-6 6-6"/>',
  chevronDown: '<path d="M6 9l6 6 6-6"/>',
  chevronRight: '<path d="M9 6l6 6-6 6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  menu: '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>',
  close: '<path d="M6 6l12 12"/><path d="M18 6L6 18"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/>',
  xCircle: '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6"/><path d="M15 9l-6 6"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
  megaphone: '<path d="M3 10.5v3a1 1 0 0 0 1 1h2.5L12 19V5L6.5 9.5H4a1 1 0 0 0-1 1z"/><path d="M16 9a4 4 0 0 1 0 6"/><path d="M18.8 6.2a8 8 0 0 1 0 11.6"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M16 3v4"/><path d="M8 3v4"/><path d="M3.5 10h17"/><path d="M8 14h3"/>',
  message: '<path d="M20.5 12a8.5 8.5 0 0 1-12.3 7.6L3.5 21l1.4-4.5A8.5 8.5 0 1 1 20.5 12z"/><path d="M8.5 12h.01"/><path d="M12 12h.01"/><path d="M15.5 12h.01"/>',
  star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
  receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M14.5 8.5h-3.2a1.7 1.7 0 0 0 0 3.5h1.4a1.7 1.7 0 0 1 0 3.5H9.5"/><path d="M12 7v1.5"/><path d="M12 15.5V17"/>',
  userPlus: '<circle cx="9" cy="8" r="4"/><path d="M2.5 20.5v-.5a6.5 6.5 0 0 1 13 0v.5"/><path d="M19 8v6"/><path d="M16 11h6"/>',
  users: '<circle cx="9" cy="8" r="4"/><path d="M2.5 20.5v-.5a6.5 6.5 0 0 1 13 0v.5"/><path d="M16 4.2a4 4 0 0 1 0 7.6"/><path d="M21.5 20.5v-.5a6.5 6.5 0 0 0-3.5-5.8"/>',
  shield: '<path d="M12 3l7.5 3v5.8c0 4.6-3.2 7.9-7.5 9.2-4.3-1.3-7.5-4.6-7.5-9.2V6z"/><path d="M9 12l2.2 2.2L15.5 10"/>',
  box: '<path d="M20.5 7.5L12 3 3.5 7.5 12 12z"/><path d="M3.5 7.5v9L12 21l8.5-4.5v-9"/><path d="M12 12v9"/>',
  chart: '<path d="M3.5 20.5h17"/><rect x="5" y="11" width="3.2" height="6.5" rx="1"/><rect x="10.4" y="5.5" width="3.2" height="12" rx="1"/><rect x="15.8" y="8.5" width="3.2" height="9" rx="1"/>',
  zap: '<path d="M13 2.5L4.5 13.5H11l-1 8 8.5-11H12z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  plug: '<path d="M9 2.5v5"/><path d="M15 2.5v5"/><path d="M6.5 7.5h11v3.5a5.5 5.5 0 0 1-11 0z"/><path d="M12 16.5v5"/>',
  sparkles: '<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.8 2.2 2.2.8-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  book: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5z"/><path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H20v-3"/><path d="M8 7.5h8"/>',
  pen: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  calculator: '<rect x="5" y="2.5" width="14" height="19" rx="2.5"/><path d="M8.5 6.5h7"/><path d="M8.5 11h.01"/><path d="M12 11h.01"/><path d="M15.5 11h.01"/><path d="M8.5 14.5h.01"/><path d="M12 14.5h.01"/><path d="M15.5 14.5h.01"/><path d="M8.5 18h.01"/><path d="M12 18h3.5"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.3a2.6 2.6 0 0 1 5 .9c0 1.7-2.5 2.3-2.5 3.8"/><path d="M12 17h.01"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
  building: '<rect x="4.5" y="3" width="15" height="18" rx="1.5"/><path d="M9 7h1.5"/><path d="M13.5 7H15"/><path d="M9 11h1.5"/><path d="M13.5 11H15"/><path d="M9 15h1.5"/><path d="M13.5 15H15"/><path d="M10.5 21v-3h3v3"/>',
  phone: '<path d="M5 3.5h3.5l1.5 4.5-2 1.5a11 11 0 0 0 6 6l1.5-2 4.5 1.5V19a2 2 0 0 1-2 2A16 16 0 0 1 3 5.5a2 2 0 0 1 2-2z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 7l8.5 6 8.5-6"/>',
  pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  play: '<path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5v-.5a7.5 7.5 0 0 1 15 0v.5"/>',
  tool: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3.5 17.5v3h3l5.8-5.8a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',
  rss: '<path d="M5 11a8 8 0 0 1 8 8"/><path d="M5 5a14 14 0 0 1 14 14"/><circle cx="5.5" cy="18.5" r="1.2"/>',
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6"/><path d="M9 17h6"/>',
  linkedin: '<path fill="currentColor" stroke="none" d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45z"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
  school: '<path d="M2.5 9L12 4.5 21.5 9 12 13.5z"/><path d="M6.5 11v4.5c0 1.4 2.5 3 5.5 3s5.5-1.6 5.5-3V11"/><path d="M21.5 9v5"/>',
  listCheck: '<path d="M4 6.5l1.5 1.5L8.5 5"/><path d="M4 12.5l1.5 1.5 3-3"/><path d="M4 18.5l1.5 1.5 3-3"/><path d="M11.5 7h8.5"/><path d="M11.5 13h8.5"/><path d="M11.5 19h8.5"/>',
  bookOpen: '<path d="M12 6.5C10.3 5 7.8 4.5 3.5 4.5v14c4.3 0 6.8.5 8.5 2 1.7-1.5 4.2-2 8.5-2v-14c-4.3 0-6.8.5-8.5 2z"/><path d="M12 6.5v14"/>',
  award: '<circle cx="12" cy="9" r="5.5"/><path d="M8.5 13.3L7 21l5-2.5 5 2.5-1.5-7.7"/>',
  copy: '<rect x="8.5" y="8.5" width="12" height="12" rx="2.5"/><path d="M15.5 8.5V6a2.5 2.5 0 0 0-2.5-2.5H6A2.5 2.5 0 0 0 3.5 6v7A2.5 2.5 0 0 0 6 15.5h2.5"/>',
  bot: '<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 8V4.5"/><circle cx="12" cy="3.5" r="1"/><path d="M9 13.5h.01"/><path d="M15 13.5h.01"/><path d="M9.5 17h5"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.8"/>',
  dollar: '<circle cx="12" cy="12" r="9"/><path d="M14.8 9.2c-.4-.9-1.5-1.6-2.8-1.6-1.6 0-2.8.9-2.8 2.1 0 2.9 5.8 1.5 5.8 4.4 0 1.2-1.3 2.2-3 2.2-1.4 0-2.6-.7-3-1.7"/><path d="M12 6v1.6"/><path d="M12 16.3V18"/>',
  trend: '<path d="M3.5 17l6-6 4 4 7-7.5"/><path d="M15 7.5h5.5V13"/>',
  lightbulb: '<path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
  calendarX: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M16 3v4"/><path d="M8 3v4"/><path d="M3.5 10h17"/><path d="M10 13.5l4 4"/><path d="M14 13.5l-4 4"/>',
  xlogo: '<path fill="currentColor" stroke="none" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>',
};

function icon(name, cls) {
  const paths = ICONS[name];
  if (!paths) throw new Error("Unknown icon: " + name);
  return (
    '<svg class="lj-icon' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    paths +
    "</svg>"
  );
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Same Organization node on every page of both sites, so search engines
// treat the blog and the main site as one entity.
const ORGANIZATION = {
  "@type": "ProfessionalService",
  "@id": SITE_URL + "/#organization",
  name: "LJ Web Management",
  url: SITE_URL + "/",
  logo: SITE_URL + "/assets/lj-logo.webp",
  image: SITE_URL + "/assets/lj-logo.webp",
  description:
    "LJ Web Management is a business automation company that builds custom AI workflow automation systems, removing repetitive tasks and bottlenecks by connecting the business tools teams already use.",
  telephone: PHONE,
  email: EMAIL,
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
  sameAs: SOCIAL.map((s) => s.url),
};

// Privacy choices. Analytics (Google Analytics and Microsoft Clarity) run by
// default; visitors can opt out from the cookie banner or "Your Privacy
// Choices", and a Global Privacy Control or Do Not Track signal counts as an
// opt-out. The choice is kept in a first-party cookie on .ljwebmanagement.com
// so one answer covers www and the blog. Bump CONSENT_VERSION to show the
// banner to everyone again after a material change.
const CONSENT_COOKIE = "lj_consent";
const CONSENT_VERSION = "v1";

// Analytics loader for the <head>. Calls queue immediately and the libraries
// load on the first user interaction, so they never compete with the initial
// render. GA4 runs with Google signals and ad personalization off.
function analytics() {
  return `<script>
window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied'});gtag('js',new Date());
window.clarity=window.clarity||function(){(window.clarity.q=window.clarity.q||[]).push(arguments);};
(function(){var loaded=false,armed=false,ev=['pointerdown','mousemove','scroll','touchstart','keydown'];
function choice(){var m=document.cookie.match(/(?:^|;\\s*)${CONSENT_COOKIE}=([^;]*)/);if(!m)return null;var v=decodeURIComponent(m[1]).split('|');return v[0]==='${CONSENT_VERSION}'?v[1]==='a1':null;}
function signal(){return navigator.globalPrivacyControl===true||navigator.doNotTrack==='1'||window.doNotTrack==='1';}
function allowed(){var c=choice();return c===null?!signal():c;}
function add(s){var e=document.createElement('script');e.async=true;e.src=s;document.head.appendChild(e);}
function load(){if(loaded||!allowed())return;loaded=true;ev.forEach(function(e){window.removeEventListener(e,load);});gtag('consent','update',{analytics_storage:'granted'});gtag('config','${GA_ID}',{allow_google_signals:false,allow_ad_personalization_signals:false});clarity('consentv2',{ad_Storage:'denied',analytics_Storage:'granted'});add('https://www.googletagmanager.com/gtag/js?id=${GA_ID}');add('https://www.clarity.ms/tag/${CLARITY_ID}');}
function arm(){if(armed||!allowed())return;armed=true;ev.forEach(function(e){window.addEventListener(e,load,{passive:true});});}
window.ljAnalytics={allowed:allowed,arm:arm,loaded:function(){return loaded;}};arm();})();
</script>`;
}

// Tawk.to live chat, loaded on first interaction and kept minimized until
// the visitor opens it themselves. While the cookie banner covers the
// bottom-right corner (small screens), the chat bubble is raised above it.
function chatWidget() {
  return `<script>
var Tawk_API=Tawk_API||{},Tawk_LoadStart=new Date();
(function(){var opened=false;window.addEventListener('blur',function(){if(document.activeElement&&document.activeElement.tagName==='IFRAME'){opened=true;setTimeout(function(){opened=false;},1500);}});Tawk_API.onLoad=function(){Tawk_API.minimize();};Tawk_API.onChatMaximized=function(){if(!opened){Tawk_API.minimize();}};})();
(function(){var loaded=false;function load(){if(loaded)return;loaded=true;var b=document.getElementById('lj-consent');if(b&&!b.hidden){var r=b.getBoundingClientRect();if(r.right>window.innerWidth-110){var y=Math.round(window.innerHeight-r.top)+12;Tawk_API.customStyle={visibility:{desktop:{position:'br',xOffset:20,yOffset:y},mobile:{position:'br',xOffset:10,yOffset:y}}};}}var s=document.createElement('script');s.async=true;s.src='https://embed.tawk.to/6a5c3cb0940f101d5323afce/1jts4q4bq';s.charset='UTF-8';s.setAttribute('crossorigin','*');document.body.appendChild(s);}['mousemove','scroll','touchstart','keydown','click'].forEach(function(e){window.addEventListener(e,load,{passive:true,once:true});});})();
</script>`;
}

// Cookie notice and the privacy settings dialog. Hidden until site.js
// decides whether to show them. "OK" and "Opt out" are equally prominent.
function consentUi(opts) {
  const { main } = links(opts);
  const cat = (title, text, control) =>
    `<div class="lj-consent-cat"><div><p class="lj-consent-cat-title">${title}</p><p>${text}</p></div>${control}</div>`;
  return `<section class="lj-consent" id="lj-consent" aria-labelledby="lj-consent-title" data-lj-consent-cookie="${CONSENT_COOKIE}" data-lj-consent-version="${CONSENT_VERSION}" hidden>
  <div class="lj-consent-inner">
    <div class="lj-consent-text">
      <h2 id="lj-consent-title">Your privacy choices</h2>
      <p>We use cookies for analytics (Google Analytics and Microsoft Clarity, which can record how you use our pages) to understand and improve this site. We do not sell or share your personal information or use advertising cookies. You can opt out at any time. <a href="${main("/privacy-policy/")}#cookies">Privacy Policy</a></p>
    </div>
    <div class="lj-consent-actions">
      <button type="button" class="lj-btn lj-btn-primary lj-btn-sm" data-lj-consent-set="1">OK</button>
      <button type="button" class="lj-btn lj-btn-primary lj-btn-sm" data-lj-consent-set="0">Opt out</button>
      <button type="button" class="lj-btn lj-btn-ghost lj-btn-sm" data-lj-consent-open>Settings</button>
    </div>
  </div>
</section>
<dialog class="lj-popup lj-consent-panel" id="lj-consent-panel" aria-labelledby="lj-consent-panel-title">
  <div class="lj-consent-panel-head">
    <h2 id="lj-consent-panel-title">Privacy and cookie settings</h2>
    <button type="button" class="lj-popup-close" data-lj-consent-close aria-label="Close privacy settings">${icon("close")}</button>
  </div>
  <div class="lj-consent-panel-body">
    <p>Analytics are on unless you turn them off. You can change this at any time from <strong>Your Privacy Choices</strong> at the bottom of every page.</p>
    <p class="lj-consent-signal" data-lj-consent-signal hidden>Your browser sent a Global Privacy Control or Do Not Track signal, so optional analytics are off. You can still turn them on below if you want to.</p>
    ${cat("Strictly necessary", `Remember your privacy choices (a first-party cookie named <code>${CONSENT_COOKIE}</code>, kept for 12 months) and on-device preferences such as course progress and the blog newsletter pop-up (browser local storage). We use these only to apply your choices, never to identify or track you.`, '<span class="lj-tag">Always on</span>')}
    ${cat('<label for="lj-consent-analytics">Analytics</label>', "Google Analytics measures visits, pages, devices, and approximate location. Microsoft Clarity records clicks, scrolling, and page interactions to create heatmaps and session recordings. Google signals and ad personalization are turned off.", '<input type="checkbox" class="lj-switch" id="lj-consent-analytics" role="switch">')}
    ${cat("Selling, sharing, and targeted advertising", "We do not sell or share personal information, use advertising cookies, or engage in targeted advertising. Turning analytics off stops all optional measurement.", '<span class="lj-tag">Never used</span>')}
    ${cat("Live chat and forms", "Live chat (Tawk.to) loads after you first interact with a page, and receives your messages if you start a chat. Forms (Typeform) load on the pages where you fill them in, and the information you enter goes to Typeform for us.", '<span class="lj-tag">Part of the site</span>')}
    <p class="lj-consent-more"><a href="${main("/privacy-choices/")}">Learn about your privacy rights and how to make a request</a></p>
  </div>
  <div class="lj-consent-panel-foot">
    <button type="button" class="lj-btn lj-btn-primary lj-btn-sm" data-lj-consent-save>Save my choices</button>
    <button type="button" class="lj-btn lj-btn-ghost lj-btn-sm" data-lj-consent-set="1">Allow analytics</button>
    <button type="button" class="lj-btn lj-btn-ghost lj-btn-sm" data-lj-consent-set="0">Opt out of analytics</button>
  </div>
</dialog>`;
}

function links(opts) {
  const base = opts.base || "";
  const blogBase = opts.blogBase == null ? BLOG_URL : opts.blogBase;
  return {
    main: (p) => base + p,
    blog: (p) => (blogBase || "") + p,
  };
}

function header(opts) {
  const { main, blog } = links(opts);
  const active = opts.active || "";
  const cur = (key) => (active === key ? ' aria-current="page"' : "");
  const curCls = (key) => (active === key ? " is-current" : "");

  const catLinks = NAV_CATEGORIES.map(
    ([slug, name, ic]) =>
      `<li><a class="lj-menu-link" href="${main("/automations/category/" + slug + "/")}"><span class="lj-menu-icon">${icon(ic)}</span><span>${escapeHtml(name)}</span></a></li>`
  ).join("");
  const indLinks = NAV_INDUSTRIES.map(
    ([slug, name]) => `<li><a class="lj-menu-link lj-menu-link--plain" href="${main("/automations/" + slug + "/")}">${escapeHtml(name)}</a></li>`
  ).join("");

  const solLinks = NAV_SOLUTIONS.map(
    ([slug, name, ic, desc]) =>
      `<li><a class="lj-menu-link lj-menu-link--rich" href="${main("/solutions/" + slug + "/")}"><span class="lj-menu-icon">${icon(ic)}</span><span><strong>${escapeHtml(name)}</strong><small>${desc}</small></span></a></li>`
  ).join("");

  const resource = (href, ic, title, desc) =>
    `<li><a class="lj-menu-link lj-menu-link--rich" href="${href}"><span class="lj-menu-icon">${icon(ic)}</span><span><strong>${title}</strong><small>${desc}</small></span></a></li>`;

  return `<a class="lj-skip" href="#main">Skip to content</a>
<header class="lj-header" data-lj-header data-lj-base="${opts.base || ""}">
  <div class="lj-header-bar lj-container">
    <a class="lj-brand" href="${main("/")}" aria-label="LJ Web Management home">
      <img src="${opts.logoSrc || "/assets/lj-logo-80.webp"}" width="40" height="40" alt="">
      <span class="lj-brand-text">LJ Web <span>Management</span></span>
    </a>
    <nav class="lj-nav" id="lj-nav" aria-label="Main">
      <ul class="lj-nav-list">
        <li class="lj-nav-item lj-has-menu lj-has-menu--wide${curCls("automations")}">
          <button type="button" class="lj-nav-link" aria-expanded="false" aria-controls="lj-menu-automations">Automations ${icon("chevronDown", "lj-nav-caret")}</button>
          <div class="lj-menu lj-menu--wide" id="lj-menu-automations">
            <div class="lj-menu-grid">
              <div class="lj-menu-col">
                <p class="lj-menu-title">By business function</p>
                <ul class="lj-menu-list lj-menu-list--2col">${catLinks}</ul>
              </div>
              <div class="lj-menu-col">
                <p class="lj-menu-title">Popular industries</p>
                <ul class="lj-menu-list">${indLinks}</ul>
                <a class="lj-menu-more" href="${main("/automations/#industries")}">All 57 industries ${icon("arrowRight")}</a>
              </div>
              <a class="lj-menu-feature" href="${main("/automations/")}">
                <span class="lj-menu-feature-icon">${icon("sparkles")}</span>
                <strong>Browse 1,000+ automations</strong>
                <span>Search by role, tool, or industry and see exactly how each workflow runs.</span>
                <span class="lj-menu-feature-cta">Open the catalog ${icon("arrowRight")}</span>
              </a>
            </div>
          </div>
        </li>
        <li class="lj-nav-item lj-has-menu lj-has-menu--wide${curCls("solutions")}">
          <button type="button" class="lj-nav-link" aria-expanded="false" aria-controls="lj-menu-solutions">Solutions ${icon("chevronDown", "lj-nav-caret")}</button>
          <div class="lj-menu lj-menu--sol" id="lj-menu-solutions">
            <p class="lj-menu-title">Platform solutions by category</p>
            <ul class="lj-menu-list lj-menu-list--3col">${solLinks}</ul>
            <a class="lj-menu-more" href="${main("/solutions/")}">See all solutions ${icon("arrowRight")}</a>
          </div>
        </li>
        <li class="lj-nav-item${curCls("how")}"><a class="lj-nav-link" href="${main("/how-it-works/")}"${cur("how")}>How It Works</a></li>
        <li class="lj-nav-item lj-has-menu${curCls("resources")}">
          <button type="button" class="lj-nav-link" aria-expanded="false" aria-controls="lj-menu-resources">Resources ${icon("chevronDown", "lj-nav-caret")}</button>
          <div class="lj-menu lj-menu--res" id="lj-menu-resources">
            <div class="lj-menu-grid lj-menu-grid--2">
              <div class="lj-menu-col">
                <p class="lj-menu-title">Learn</p>
                <ul class="lj-menu-list">
                  ${resource(main("/resources/"), "grid", "Resource Center", "Every free guide, course, and tool")}
                  ${resource(main("/guides/"), "book", "Automation Guides", "How to automate, step by step")}
                  ${resource(main("/learn/"), "school", "Free Courses", "Automation 101 and AI at Work")}
                  ${resource(main("/glossary/"), "bookOpen", "Glossary", "Automation and AI terms explained")}
                </ul>
              </div>
              <div class="lj-menu-col">
                <p class="lj-menu-title">Try</p>
                <ul class="lj-menu-list">
                  ${resource(main("/tools/"), "calculator", "Calculators &amp; Tools", "ROI, time savings, AI cost, and more")}
                  ${resource(main("/quizzes/"), "listCheck", "Quizzes &amp; Assessments", "AI readiness and automation IQ")}
                  ${resource(main("/tools/ai-prompt-library/"), "message", "AI Prompt Library", "Copy-ready prompts for business")}
                  ${resource(blog("/"), "pen", "Blog", "Fresh AI and automation ideas daily")}
                </ul>
              </div>
            </div>
          </div>
        </li>
        <li class="lj-nav-item${curCls("blog")}"><a class="lj-nav-link" href="${blog("/")}"${cur("blog")}>Blog</a></li>
      </ul>
      <div class="lj-nav-mobile-cta">
        <a class="lj-btn lj-btn-primary lj-btn-block" href="${main("/appointment/")}">Book a Free Consultation</a>
        <a class="lj-btn lj-btn-ghost lj-btn-block" href="${main("/contactus/")}">Contact Us</a>
      </div>
    </nav>
    <div class="lj-header-actions">
      <button type="button" class="lj-search-trigger" data-lj-search-open aria-label="Search automations, guides, and articles">
        ${icon("search")}<span class="lj-search-trigger-text">Search</span><kbd>/</kbd>
      </button>
      <a class="lj-btn lj-btn-primary lj-btn-sm lj-header-cta" href="${main("/appointment/")}">Book a Free Call</a>
      <button type="button" class="lj-burger" aria-expanded="false" aria-controls="lj-nav" aria-label="Open menu">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
</header>
<dialog class="lj-search" id="lj-search" aria-label="Search the site" data-lj-index="${opts.searchIndexUrl || main("/assets/data/search-index.js")}"${opts.blogPostsUrl ? ` data-lj-posts="${opts.blogPostsUrl}"` : ""}>
  <div class="lj-search-panel">
    <div class="lj-search-field">
      ${icon("search")}
      <input type="search" id="lj-search-input" placeholder="Search automations, industries, guides&hellip;" autocomplete="off" spellcheck="false" aria-label="Search" aria-controls="lj-search-results">
      <button type="button" class="lj-search-close" data-lj-search-close aria-label="Close search">Esc</button>
    </div>
    <div class="lj-search-body">
      <ul class="lj-search-results" id="lj-search-results" aria-label="Search results"></ul>
      <p class="lj-sr-only" aria-live="polite" data-lj-search-status></p>
      <div class="lj-search-empty" data-lj-search-hint>
        <p class="lj-search-hint-title">Popular searches</p>
        <div class="lj-chip-row">
          <button type="button" class="lj-chip" data-lj-q="missed call">Missed call text-back</button>
          <button type="button" class="lj-chip" data-lj-q="appointment reminder">Appointment reminders</button>
          <button type="button" class="lj-chip" data-lj-q="invoice">Invoicing</button>
          <button type="button" class="lj-chip" data-lj-q="how to automate">How to automate</button>
          <button type="button" class="lj-chip" data-lj-q="ai agent">AI agents</button>
          <button type="button" class="lj-chip" data-lj-q="quickbooks">QuickBooks</button>
        </div>
      </div>
    </div>
    <div class="lj-search-foot"><span><kbd>&uarr;</kbd><kbd>&darr;</kbd> to navigate</span><span><kbd>Enter</kbd> to open</span><a href="${main("/automations/")}">Browse the full catalog ${icon("arrowRight")}</a></div>
  </div>
</dialog>`;
}

function footer(opts) {
  const { main, blog } = links(opts);
  const year = opts.year || new Date().getFullYear();
  const col = (title, items) =>
    `<div class="lj-footer-col"><h2>${title}</h2><ul>${items.map(([href, label]) => `<li><a href="${href}">${label}</a></li>`).join("")}</ul></div>`;

  return `<footer class="lj-footer">
  <div class="lj-container">
    <div class="lj-footer-cta">
      <div>
        <h2>Ready to cut through the delay?</h2>
        <p>Book a free consultation. We'll map the workflow, recommend what to automate first, and give you a flat, upfront quote.</p>
      </div>
      <div class="lj-footer-cta-actions">
        <a class="lj-btn lj-btn-accent" href="${main("/appointment/")}">Book a Free Consultation</a>
        <a class="lj-btn lj-btn-light" href="${main("/roi-calculator/")}">Calculate Your ROI</a>
      </div>
    </div>
    <div class="lj-footer-grid">
      <div class="lj-footer-brand">
        <a class="lj-brand lj-brand--light" href="${main("/")}" aria-label="LJ Web Management home">
          <img src="${opts.logoSrc || "/assets/lj-logo-80.webp"}" width="40" height="40" alt="" loading="lazy">
          <span class="lj-brand-text">LJ Web <span>Management</span></span>
        </a>
        <p>Custom AI automation systems that remove repetitive work and bottlenecks by connecting the tools your team already uses.</p>
        <ul class="lj-footer-contact">
          <li><a href="tel:${PHONE}">${icon("phone")}${PHONE_DISPLAY}</a></li>
          <li><a href="mailto:${EMAIL}">${icon("mail")}${EMAIL}</a></li>
          <li><span>${icon("pin")}1108 E 9th St, Lockport, IL 60441</span></li>
        </ul>
        <div class="lj-footer-social">${SOCIAL.map((s) => `<a href="${s.url}" target="_blank" rel="noopener" aria-label="${s.name}">${icon(s.icon)}</a>`).join("")}</div>
      </div>
      ${col("Automations", [
        [main("/automations/"), "Browse All 1,000+"],
        [main("/automations/category/lead-follow-up-sales/"), "Lead Follow-Up &amp; Sales"],
        [main("/automations/category/scheduling-dispatch/"), "Scheduling &amp; Reminders"],
        [main("/automations/category/billing-finance/"), "Billing &amp; Payments"],
        [main("/automations/category/reviews-feedback/"), "Reviews &amp; Reputation"],
        [main("/automations/category/onboarding-intake/"), "Client Onboarding"],
      ])}
      ${col("Industries", [
        [main("/automations/real-estate/"), "Real Estate"],
        [main("/automations/healthcare/"), "Healthcare"],
        [main("/automations/legal/"), "Legal"],
        [main("/automations/home-services/"), "Home Services"],
        [main("/automations/restaurants-food-service/"), "Restaurants"],
        [main("/automations/#industries"), "All 57 Industries"],
      ])}
      ${col("Resources", [
        [main("/resources/"), "Resource Center"],
        [main("/guides/"), "Automation Guides"],
        [main("/learn/"), "Free Courses"],
        [main("/tools/"), "Calculators &amp; Tools"],
        [main("/quizzes/"), "Quizzes &amp; Assessments"],
        [main("/glossary/"), "Automation Glossary"],
        [blog("/"), "Blog"],
      ])}
      ${col("Company", [
        [main("/how-it-works/"), "How It Works"],
        [main("/solutions/"), "Platform Solutions"],
        [main("/faq/"), "Automation FAQ"],
        [main("/appointment/"), "Book a Consultation"],
        [main("/contactus/"), "Contact Us"],
      ])}
    </div>
    <div class="lj-footer-bottom">
      <span>&copy; ${year} LJ Web Management, LLC. All rights reserved.</span>
      <nav aria-label="Legal"><a href="${main("/privacy-policy/")}">Privacy Policy</a><a href="${main("/terms-of-service/")}">Terms of Service</a><a href="${main("/accessibility/")}">Accessibility</a><a href="${main("/privacy-choices/")}" data-lj-consent-open>Your Privacy Choices</a></nav>
    </div>
  </div>
</footer>
${consentUi(opts)}`;
}

module.exports = {
  NAV_SOLUTIONS,
  SITE_URL,
  BLOG_URL,
  PHONE,
  PHONE_DISPLAY,
  EMAIL,
  SOCIAL,
  NAV_CATEGORIES,
  NAV_INDUSTRIES,
  ORGANIZATION,
  CONSENT_COOKIE,
  icon,
  analytics,
  chatWidget,
  header,
  footer,
};
