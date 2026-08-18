(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function money(value, currency = "INR") {
    const n = Number(value || 0);
    return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: currency === "INR" ? 0 : 2 }).format(n);
  }
  window.LungtaMoney = money;

  const header = $(".site-header");
  if (header) {
    const updateHeader = () => {
      const probes = $$('[data-header-theme]');
      let theme = document.body.dataset.header || "dark";
      for (const el of probes) {
        const r = el.getBoundingClientRect();
        if (r.top <= 84 && r.bottom > 84) { theme = el.dataset.headerTheme; break; }
      }
      header.dataset.theme = theme;
      header.classList.toggle("scrolled", scrollY > 18);
    };
    addEventListener("scroll", updateHeader, { passive: true });
    addEventListener("resize", updateHeader);
    updateHeader();
  }

  const reveal = $$("[data-reveal]");
  if (!reduced && reveal.length) {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
    }), { threshold: 0.12, rootMargin: "0px 0px -5%" });
    reveal.forEach(el => io.observe(el));
  } else reveal.forEach(el => el.classList.add("is-visible"));

  if (!reduced) {
    const parallax = $$('[data-parallax]');
    let raf = 0;
    const render = () => {
      raf = 0;
      const vh = innerHeight;
      parallax.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const p = (r.top + r.height / 2 - vh / 2) / vh;
        const strength = Number(el.dataset.parallax || 18);
        el.style.transform = `translate3d(0,${(-p * strength).toFixed(2)}px,0) scale(1.015)`;
      });
    };
    addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(render); }, { passive: true });
    addEventListener("resize", render);
    render();
  }

  const menu = $("#mobileMenu");
  const search = $("#searchPanel");
  const bag = $("#bagDrawer");
  const toast = $("#toast");
  function lock(on) { document.documentElement.classList.toggle("no-scroll", on); }
  function closeAll() {
    [menu, search, bag].filter(Boolean).forEach(el => el.classList.remove("open"));
    lock(false);
  }
  $("#menuButton")?.addEventListener("click", () => { closeAll(); menu?.classList.add("open"); lock(true); });
  $("#searchButton")?.addEventListener("click", () => { closeAll(); search?.classList.add("open"); lock(true); setTimeout(() => $("#globalSearch")?.focus(), 120); });
  $("#bagButton")?.addEventListener("click", async () => { closeAll(); bag?.classList.add("open"); lock(true); await renderBag(); });
  $$('[data-close]').forEach(b => b.addEventListener("click", closeAll));
  addEventListener("keydown", e => { if (e.key === "Escape") closeAll(); });

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(showToast.t);
    showToast.t = setTimeout(() => toast.classList.remove("show"), 2300);
  }
  document.addEventListener("lungta:toast", e => showToast(e.detail));

  const searchInput = $("#globalSearch");
  searchInput?.addEventListener("keydown", e => {
    if (e.key === "Enter" && searchInput.value.trim()) location.href = `shop.html?q=${encodeURIComponent(searchInput.value.trim())}`;
  });

  async function renderBag() {
    const body = $("#bagBody"), count = $("#bagCount"), total = $("#bagTotal"), checkout = $("#checkoutButton");
    if (!body || !window.LungtaStore) return;
    body.innerHTML = '<p class="muted">Loading bag...</p>';
    const cart = await LungtaStore.getCart();
    const qty = cart?.totalQuantity || 0;
    if (count) count.textContent = qty;
    $$("[data-bag-count]").forEach(el => el.textContent = qty);
    if (!qty) {
      body.innerHTML = '<div class="empty-bag"><p>Your bag is empty.</p><a class="text-link" href="shop.html">Shop the collection</a></div>';
      if (total) total.textContent = money(0, "INR");
      if (checkout) checkout.disabled = true;
      return;
    }
    if (checkout) checkout.disabled = false;
    const lines = cart.demoLines || (cart.lines?.nodes || []).map(line => ({
      quantity: line.quantity,
      title: line.merchandise.product.title,
      variantTitle: line.merchandise.title,
      image: line.merchandise.product.featuredImage?.url || "",
      handle: line.merchandise.product.handle,
      price: line.merchandise.price
    }));
    body.innerHTML = lines.map(line => `
      <a class="bag-line" href="product.html?handle=${encodeURIComponent(line.handle)}">
        <div class="bag-thumb">${line.image ? `<img src="${line.image}" alt="">` : ""}</div>
        <div><strong>${line.title}</strong><small>${line.variantTitle || ""} · Qty ${line.quantity}</small></div>
        <span>${money(line.price.amount, line.price.currencyCode)}</span>
      </a>`).join("");
    if (total) total.textContent = money(cart.cost.subtotalAmount.amount, cart.cost.subtotalAmount.currencyCode);
  }
  $("#checkoutButton")?.addEventListener("click", () => LungtaStore.checkout());
  window.LungtaUI = { renderBag, showToast, closeAll };
  renderBag();
})();
