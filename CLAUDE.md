# Instructions for working in this repo

## Never use em dashes ("—")

Do not use the em dash character in page templates, scripts, code comments,
commit messages, or documentation. Write the sentence another way instead
(a comma, semicolon, colon, parentheses, or two sentences). This matches the
rule in the main site repo (LJ-Web-Management/ljwebmanagement.com).

## How the blog is built

Posts are published by uploading a .docx, .txt, or .zip (document plus
featured image) to `uploads/`. The "Convert Word Docs to Blog Posts" workflow
runs `scripts/convert.js`, which writes `posts/<slug>.html`, updates
`posts.json`, and regenerates the blog home, `feed.xml`, `sitemap.xml`,
`404.html` and `assets/js/latest-posts.js`.

`npm run rebuild` re-renders every existing post and listing page with the
current templates. Run it after changing `scripts/templates.js`,
`scripts/chrome.js`, or `assets/css/site.css`.

Each post is filed under a topic (`category` / `categorySlug` in
`posts.json`), chosen from its title by the rules in `TOPICS` in
`scripts/templates.js` the first time it is published.

## Shared with the main site

The blog is meant to feel like part of www.ljwebmanagement.com, so it uses
the main site's header, footer, design system and site script. These files
must stay identical in both repos:

| This repo | Main site repo |
| --- | --- |
| `scripts/chrome.js` | `build/lib/chrome.js` |
| `assets/css/site.css` | `assets/css/site.css` |
| `assets/js/site.js` | `assets/js/site.js` |

Change them in the main site repo first, copy them here, then run
`npm run rebuild`. The blog's site search loads the main site's index from
`https://www.ljwebmanagement.com/assets/data/search-index.js`, and the main
site embeds `assets/js/latest-posts.js` to show the newest posts.

## Privacy and accessibility rules

Analytics, session recording, and live chat load only through the shared
`scripts/chrome.js` (copied from the main site), which honors visitors' opt-out
choices. Never add tracking scripts directly to templates; see "Privacy and accessibility rules" in the main site
repo's CLAUDE.md. Forms that collect personal information need a short notice
at collection linking to the Privacy Policy, like the newsletter pop-up and
unsubscribe page.
