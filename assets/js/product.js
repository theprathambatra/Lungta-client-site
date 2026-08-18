(async () => {
  const root = document.getElementById('pdpRoot');
  if (!root || !window.LungtaStore) return;
  const handle = new URLSearchParams(location.search).get('handle') || 'second-skin-set';
  let product;
  try { product = await LungtaStore.productByHandle(handle); }
  catch (e) { product = (window.LUNGTA_DEMO_PRODUCTS || []).find(p => p.handle === handle) || window.LUNGTA_DEMO_PRODUCTS?.[0]; }
  if (!product) { root.innerHTML = '<div class="catalog-empty">Product not found.</div>'; return; }
  document.title = `${product.title} | LUNGTA`;
  const variants = product.variants || [];
  let selected = variants.find(v => v.available) || variants[0];
  const image = product.image || 'assets/img/alpine-model-4k.webp';
  root.innerHTML = `
    <div class="pdp-gallery"><img id="pdpImage" src="${image}" alt="${product.title}" style="object-position:${product.imagePosition || 'center'}"></div>
    <div class="pdp-info">
      <div class="pdp-kicker">${product.type || 'LUNGTA'}</div>
      <h1 class="pdp-title">${product.title}</h1>
      <div class="pdp-price" id="pdpPrice">${LungtaMoney((selected?.price || product.price).amount, (selected?.price || product.price).currencyCode)}</div>
      <p class="pdp-description">${product.description || 'Performance built around movement, structure and restraint.'}</p>
      <div class="option-name">Size</div>
      <div class="option-list" id="variantList"></div>
      <button class="pdp-add" id="pdpAdd" ${!selected ? 'disabled' : ''}>Add to bag</button>
      <div class="pdp-accordions">
        <details><summary>Material <span>+</span></summary><p>Technical performance construction designed for stretch, recovery and repeated movement.</p></details>
        <details><summary>Fit <span>+</span></summary><p>Close to the body. Choose your usual size for the intended performance fit.</p></details>
        <details><summary>Care <span>+</span></summary><p>Cold wash with similar colours. Do not bleach. Air dry where possible.</p></details>
      </div>
    </div>`;
  const list = document.getElementById('variantList');
  function renderOptions() {
    list.innerHTML = variants.map(v => `<button class="option ${v.id === selected?.id ? 'active' : ''}" data-variant="${v.id}" ${!v.available ? 'disabled' : ''}>${v.title}</button>`).join('');
    list.querySelectorAll('[data-variant]').forEach(b => b.addEventListener('click', () => {
      selected = variants.find(v => v.id === b.dataset.variant) || selected;
      renderOptions();
      const price = selected.price || product.price;
      document.getElementById('pdpPrice').textContent = LungtaMoney(price.amount, price.currencyCode);
      if (selected.image) document.getElementById('pdpImage').src = selected.image;
    }));
  }
  renderOptions();
  document.getElementById('pdpAdd')?.addEventListener('click', async () => {
    if (!selected) return;
    const btn = document.getElementById('pdpAdd');
    btn.disabled = true; btn.textContent = 'Adding...';
    try { await LungtaStore.addLine(selected.id, 1); await LungtaUI?.renderBag(); LungtaUI?.showToast('Added to bag.'); }
    catch (e) { LungtaUI?.showToast(e.message || 'Could not add to bag.'); }
    finally { btn.disabled = false; btn.textContent = 'Add to bag'; }
  });
})();
