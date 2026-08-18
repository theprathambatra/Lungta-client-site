(() => {
  const cfg = window.LUNGTA_CONFIG || {};
  const DEMO = () => window.LUNGTA_DEMO_PRODUCTS || [];
  const configured = () => Boolean(cfg.SHOPIFY_DOMAIN && cfg.STOREFRONT_TOKEN);
  const endpoint = () => `https://${cfg.SHOPIFY_DOMAIN}/api/${cfg.STOREFRONT_API_VERSION || "2026-04"}/graphql.json`;

  async function gql(query, variables = {}) {
    if (!configured()) throw new Error("Shopify is not configured");
    const res = await fetch(endpoint(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": cfg.STOREFRONT_TOKEN
      },
      body: JSON.stringify({ query, variables })
    });
    const json = await res.json();
    if (!res.ok || json.errors) throw new Error(json.errors?.[0]?.message || `Shopify request failed: ${res.status}`);
    return json.data;
  }

  const productFields = `
    id title handle description productType tags availableForSale
    featuredImage { url altText width height }
    images(first: 6) { nodes { url altText width height } }
    priceRange { minVariantPrice { amount currencyCode } }
    options { name values }
    variants(first: 100) { nodes { id title availableForSale selectedOptions { name value } price { amount currencyCode } image { url altText } } }
  `;

  function normalize(node) {
    return {
      id: node.id,
      title: node.title,
      handle: node.handle,
      type: node.productType || "",
      tags: node.tags || [],
      price: node.priceRange?.minVariantPrice || { amount: "0", currencyCode: "INR" },
      image: node.featuredImage?.url || node.images?.nodes?.[0]?.url || "",
      images: node.images?.nodes || [],
      description: node.description || "",
      options: node.options || [],
      available: node.availableForSale,
      variants: (node.variants?.nodes || []).map(v => ({
        id: v.id,
        title: v.title,
        available: v.availableForSale,
        selectedOptions: v.selectedOptions || [],
        price: v.price,
        image: v.image?.url || ""
      }))
    };
  }

  async function products(first = 50) {
    if (!configured()) return DEMO();
    const data = await gql(`query Products($first:Int!){ products(first:$first, sortKey:CREATED_AT, reverse:true){ nodes{ ${productFields} } } }`, { first });
    return data.products.nodes.map(normalize);
  }

  async function productByHandle(handle) {
    if (!configured()) return DEMO().find(p => p.handle === handle) || DEMO()[0] || null;
    const data = await gql(`query Product($handle:String!){ product(handle:$handle){ ${productFields} } }`, { handle });
    return data.product ? normalize(data.product) : null;
  }

  const CART_KEY = "lungta_shopify_cart_id";
  const DEMO_CART_KEY = "lungta_demo_cart";

  function demoCart() {
    try { return JSON.parse(localStorage.getItem(DEMO_CART_KEY)) || []; } catch { return []; }
  }
  function saveDemoCart(lines) { localStorage.setItem(DEMO_CART_KEY, JSON.stringify(lines)); }

  async function createCart(variantId, quantity = 1) {
    const data = await gql(`mutation CartCreate($lines:[CartLineInput!]){ cartCreate(input:{lines:$lines}){ cart{ id checkoutUrl totalQuantity cost{ subtotalAmount{ amount currencyCode } } lines(first:50){ nodes{ id quantity merchandise{ ... on ProductVariant{ id title product{ title handle featuredImage{url altText} } price{amount currencyCode} } } } } } userErrors{field message} } }`, { lines: [{ merchandiseId: variantId, quantity }] });
    if (data.cartCreate.userErrors?.length) throw new Error(data.cartCreate.userErrors[0].message);
    localStorage.setItem(CART_KEY, data.cartCreate.cart.id);
    return data.cartCreate.cart;
  }

  async function addLine(variantId, quantity = 1) {
    if (!configured()) {
      const product = DEMO().find(p => p.variants.some(v => v.id === variantId));
      const variant = product?.variants.find(v => v.id === variantId);
      if (!product || !variant) throw new Error("Preview product not found");
      const cart = demoCart();
      const existing = cart.find(x => x.variantId === variantId);
      if (existing) existing.quantity += quantity;
      else cart.push({ variantId, quantity, title: product.title, variantTitle: variant.title, price: product.price, image: product.image, handle: product.handle });
      saveDemoCart(cart);
      return getCart();
    }
    const id = localStorage.getItem(CART_KEY);
    if (!id) return createCart(variantId, quantity);
    try {
      const data = await gql(`mutation Add($cartId:ID!,$lines:[CartLineInput!]!){ cartLinesAdd(cartId:$cartId,lines:$lines){ cart{ id checkoutUrl totalQuantity cost{ subtotalAmount{amount currencyCode} } lines(first:50){ nodes{ id quantity merchandise{ ... on ProductVariant{ id title product{title handle featuredImage{url altText}} price{amount currencyCode} } } } } } userErrors{field message} } }`, { cartId: id, lines: [{ merchandiseId: variantId, quantity }] });
      if (data.cartLinesAdd.userErrors?.length) throw new Error(data.cartLinesAdd.userErrors[0].message);
      return data.cartLinesAdd.cart;
    } catch (err) {
      localStorage.removeItem(CART_KEY);
      return createCart(variantId, quantity);
    }
  }

  async function getCart() {
    if (!configured()) {
      const lines = demoCart();
      const totalQuantity = lines.reduce((s, x) => s + x.quantity, 0);
      const amount = lines.reduce((s, x) => s + Number(x.price.amount) * x.quantity, 0).toFixed(2);
      const currencyCode = lines[0]?.price?.currencyCode || "INR";
      return { id: "demo", totalQuantity, checkoutUrl: "", cost: { subtotalAmount: { amount, currencyCode } }, demoLines: lines, lines: { nodes: [] } };
    }
    const id = localStorage.getItem(CART_KEY);
    if (!id) return null;
    try {
      const data = await gql(`query Cart($id:ID!){ cart(id:$id){ id checkoutUrl totalQuantity cost{ subtotalAmount{amount currencyCode} } lines(first:50){ nodes{ id quantity merchandise{ ... on ProductVariant{ id title product{title handle featuredImage{url altText}} price{amount currencyCode} } } } } } }`, { id });
      if (!data.cart) localStorage.removeItem(CART_KEY);
      return data.cart;
    } catch (err) {
      localStorage.removeItem(CART_KEY);
      return null;
    }
  }

  async function checkout() {
    if (!configured()) {
      document.dispatchEvent(new CustomEvent("lungta:toast", { detail: "Connect Shopify in assets/js/config.js to enable checkout." }));
      return;
    }
    const cart = await getCart();
    if (cart?.checkoutUrl) location.href = cart.checkoutUrl;
  }

  window.LungtaStore = { configured, products, productByHandle, addLine, getCart, checkout, config: cfg };
})();
