(async () => {
  const grid = document.getElementById('catalogGrid');
  const count = document.getElementById('shopCount');
  if (!grid || !window.LungtaStore) return;
  const params = new URLSearchParams(location.search);
  let active = (params.get('filter') || 'all').toLowerCase();
  const q = (params.get('q') || '').trim().toLowerCase();
  const filters = [...document.querySelectorAll('[data-filter]')];
  let products = [];
  try { products = await LungtaStore.products(50); }
  catch (e) { products = window.LUNGTA_DEMO_PRODUCTS || []; LungtaUI?.showToast('Shopify could not be reached. Preview catalog shown.'); }

  const label = document.getElementById('shopLabel');
  const setLabel = () => {
    const names = { all: 'Shop', new: 'New In', sets: 'Sets', tops: 'Tops', bottoms: 'Bottoms', outerwear: 'Outerwear' };
    if (label) label.textContent = q ? `Search: ${params.get('q')}` : (names[active] || 'Shop');
  };

  const match = p => {
    const tags = (p.tags || []).map(t => String(t).toLowerCase());
    const type = String(p.type || '').toLowerCase();
    const title = String(p.title || '').toLowerCase();
    if (q && ![title, type, ...tags].some(x => x.includes(q))) return false;
    if (active === 'all') return true;
    if (active === 'new') return tags.some(t => t.includes('new'));
    if (active === 'sets') return type.includes('set') || tags.some(t => t.includes('set'));
    if (active === 'tops') return type.includes('top') || tags.some(t => t.includes('top'));
    if (active === 'bottoms') return type.includes('bottom') || type.includes('legging') || tags.some(t => t.includes('bottom'));
    if (active === 'outerwear') return type.includes('outer') || tags.some(t => t.includes('outer'));
    return true;
  };

  const render = () => {
    const list = products.filter(match);
    if (count) count.textContent = `${list.length} pieces`;
    filters.forEach(b => b.classList.toggle('active', b.dataset.filter === active));
    setLabel();
    if (!list.length) { grid.innerHTML = '<div class="catalog-empty">No pieces found.</div>'; return; }
    grid.innerHTML = list.map((p, i) => `
      <a class="product-card" href="product.html?handle=${encodeURIComponent(p.handle)}">
        <div class="card-image">
          <img src="${p.image}" alt="${p.title}" loading="${i < 4 ? 'eager' : 'lazy'}" style="object-position:${p.imagePosition || 'center'}">
          ${(p.tags || []).map(t => String(t).toLowerCase()).includes('new') ? '<span class="card-badge">New</span>' : ''}
        </div>
        <div class="card-meta"><strong>${p.title}</strong><span>${LungtaMoney(p.price.amount, p.price.currencyCode)}</span></div>
        <div class="card-type">${p.type || 'LUNGTA'}</div>
      </a>`).join('');
  };
  filters.forEach(b => b.addEventListener('click', () => {
    active = b.dataset.filter;
    const u = new URL(location.href);
    if (active === 'all') u.searchParams.delete('filter'); else u.searchParams.set('filter', active);
    u.searchParams.delete('q');
    history.replaceState({}, '', u);
    render();
  }));
  render();
})();
