# CargoSphere

Logistics management platform: dashboard, tracking, timeline, orders, live map, search/filter, notifications, analytics. Plain HTML/CSS/JS — no build step. Data is demo data stored in `localStorage`.

## Structure
```
index.html        app shell
css/styles.css    theme + responsive layout
js/data.js        demo data, store, status flow
js/ui.js          helpers, charts, SVG route map
js/app.js         views, router, live simulation
vercel.json       Vercel config
```

## Run locally
`npx serve .` then open the printed URL.

## Deploy to Vercel
1. Push this folder to GitHub, then Import it at vercel.com/new
   (Framework Preset: **Other**, no build command, output directory blank), **or**
2. Run `npx vercel --prod` inside this folder.

To reset demo data: clear site data in your browser.
