# LJ Web Management Blog

A simple blog site, hosted for free on GitHub Pages. New posts are published
by uploading a Word document straight through GitHub — no coding required.

**Live site:** https://lj-web-management.github.io/ljwebmanagement-blogpage/
(a custom domain can be connected later — see "Custom domain" below)

## How to publish a new blog post

1. Write your post in a `.docx` Word document. The first heading (Heading 1
   or Heading 2 style) in the document becomes the post title — everything
   after it becomes the body. If you don't add a heading, the filename is
   used as the title instead.
2. Go to the `uploads` folder in this repository on GitHub:
   https://github.com/LJ-Web-Management/ljwebmanagement-blogpage/tree/main/uploads
3. Click **Add file → Upload files**, drag in your `.docx` file, and commit
   directly to the `main` branch.
4. Wait about a minute. A GitHub Action automatically:
   - Extracts the text, headings, images, and formatting from the document
   - Creates a new page for the post under `posts/`
   - Adds it to the homepage post list (`posts.json`), most recent first
   - Moves the original Word file into `uploads/processed/` so it isn't
     converted twice
5. Refresh the site — your post is live at the top of the homepage with a
   "Read Post" button.

You can check progress under the **Actions** tab of the repo. If a post
doesn't appear, check the latest workflow run there for errors (for example,
an unsupported old-style `.doc` file — only modern `.docx` is supported).

## Editing or removing a post

Posts are plain HTML files under `posts/`, and the homepage list is
`posts.json`. Edit or delete an entry from `posts.json` and remove/edit the
matching file in `posts/` to update or take down a post.

## Local development

```
npm install
npm run convert   # converts any .docx files sitting in uploads/
```

Then open `index.html` directly in a browser, or serve the folder locally:

```
npx serve .
```

## Project structure

```
index.html              Homepage — lists all posts, newest first
assets/css/style.css    Site styling
assets/js/main.js       Loads posts.json and renders the homepage list
posts/                  Generated static HTML page per blog post
posts.json              Generated index of posts (title, date, excerpt, slug)
uploads/                Drop .docx files here to publish them
uploads/processed/      Where already-converted Word files are archived
scripts/convert.js      Converts uploads/*.docx into posts/*.html
.github/workflows/      GitHub Action that runs the conversion automatically
```

## Custom domain (www.ljwebmanagement.com)

The site currently runs on the default `github.io` URL. To point
`www.ljwebmanagement.com` at it:

1. In this repo's **Settings → Pages**, set the custom domain to
   `www.ljwebmanagement.com` and save (GitHub will add a `CNAME` file).
2. With whoever manages DNS for `ljwebmanagement.com`, add a `CNAME` record:
   `www` → `lj-web-management.github.io`.
3. Wait for DNS to propagate, then enable **Enforce HTTPS** in the Pages
   settings once GitHub shows the certificate as issued.
