# LUNGTA Website

Static multi-page storefront built for GitHub Pages with a Shopify Storefront API integration layer.

## Pages

- `index.html` - homepage
- `shop.html` - product directory and filters
- `product.html?handle=...` - product detail page
- `material.html` - material and performance story
- `about.html` - brand story
- `account.html` - Shopify customer account handoff

## Shopify setup

Open `assets/js/config.js` and add only a **public Storefront API token** and your Shopify domain:

```js
window.LUNGTA_CONFIG = {
  SHOPIFY_DOMAIN: "your-store.myshopify.com",
  STOREFRONT_TOKEN: "your-public-storefront-token",
  STOREFRONT_API_VERSION: "2026-04",
  CUSTOMER_ACCOUNT_URL: "https://your-store.myshopify.com/account"
};
```

Do not place an Admin API token or private server token in this repository.

When Shopify is configured, the shop page reads live Shopify products, product pages resolve by handle, Add to Bag uses Shopify Cart API, and Checkout redirects to Shopify's checkout URL. Until then, the site displays a local preview catalog so the design can be reviewed immediately.

## GitHub Pages

This site has no build step.

1. Upload the contents of this folder to the repository root.
2. Commit and push to `main`.
3. In GitHub repository settings, open Pages.
4. Deploy from the `main` branch and root folder.
5. If using a custom domain, add it in GitHub Pages settings after the site is live.

## Assets

Final campaign assets are stored under `assets/img/` in optimized high-resolution WebP format. Brand wordmark and Apex mark use transparent PNG files.
