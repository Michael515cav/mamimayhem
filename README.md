# Mami Mayhem Clothing Co. — Site Setup

## Folder Structure
```
mami-mayhem/
├── index.html          ← Main site
├── api/
│   └── products.js     ← Serverless function (Printify API proxy)
├── vercel.json         ← Vercel config
└── README.md
```

---

## Step 1 — Get your Printify Shop ID

You need this to connect the API. Run this in your terminal (or use a tool like Postman):

```bash
curl -H "Authorization: Bearer YOUR_API_TOKEN" \
  https://api.printify.com/v1/shops.json
```

It will return something like:
```json
[{"id": 12345678, "title": "Mami Mayhem", ...}]
```

Copy that `id` number — that's your Shop ID.

---

## Step 2 — Deploy to Vercel

1. Push this folder to a GitHub repo
2. Go to vercel.com → New Project → import the repo
3. During setup, add these **Environment Variables**:

| Variable Name         | Value                          |
|-----------------------|-------------------------------|
| `PRINTIFY_TOKEN`      | Your Printify API token        |
| `PRINTIFY_SHOP_ID`    | Your Shop ID from Step 1       |

4. Hit Deploy — done!

---

## Step 3 — Add AdSense (when approved)

Search for these comments in `index.html` and replace the placeholder divs with your AdSense `<ins>` tags:

- `<!-- TOP AD -->` — 728×90 leaderboard
- `<!-- SIDEBAR ADS -->` — 300×250 (x2)
- `<!-- BOTTOM AD -->` — 728×90 leaderboard

---

## How products update automatically

When she adds or removes a product in Printify, it shows up on the site automatically on the next page load. No code changes needed. Ever.

Products are cached for 5 minutes on Vercel's edge to keep things fast.

---

## Updating other site content

- **Hero text / marquee / about section** → edit `index.html` directly
- **Social links** → search for `instagram.com/mamimayhem` and `tiktok.com/@mamimayhem` in `index.html` and update
- **Contact email** → search for `hello@mamimayhem.com` and update
