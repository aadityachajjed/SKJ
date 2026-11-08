// Sunil Kumar Jayantilal - Customer App Controller

var state = {
  products: [],
  categories: [],
  settings: {},
  activeCategory: 'all',
  searchQuery: '',
  inStockOnly: false,
  cart: [],
  detailProduct: null,
  activeDetailImage: '',
  selectedColourId: null,
  selectedDetailSets: 1
};

// Load cart from localStorage
try {
  const savedCart = localStorage.getItem('skj_cart');
  if (savedCart) {
    state.cart = JSON.parse(savedCart);
  }
} catch (e) {
  state.cart = [];
}

function saveCart() {
  try {
    localStorage.setItem('skj_cart', JSON.stringify(state.cart));
  } catch (e) {}
  updateCartBadge();
}

function updateCartBadge() {
  const totalSets = state.cart.reduce(function(sum, item) {
    return sum + item.number_of_sets;
  }, 0);

  const badges = document.querySelectorAll('.cart-badge, .mobile-nav-badge');
  badges.forEach(function(b) {
    b.textContent = totalSets;
    b.style.display = totalSets > 0 ? 'flex' : 'none';
  });
}

// Show Toast
function showToast(message, type) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast' + (type ? ' toast-' + type : '');
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(function() {
    toast.style.opacity = '0';
    setTimeout(function() {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 3200);
}

// Init App
function initApp() {
  loadSettings();
  loadCategories();
  loadProducts();
  updateCartBadge();
  setupEventListeners();

  window.addEventListener('skj_lang_changed', function() {
    renderProducts();
    renderCategories();
    renderCartDrawer();
    if (state.detailProduct) {
      renderProductDetailModal(state.detailProduct);
    }
  });
}

function loadSettings() {
  API.getSettings().then(function(res) {
    if (res.success && res.settings) {
      state.settings = res.settings;
      applySettings(res.settings);
    }
  }).catch(function(err) {
    console.error('Settings error:', err);
  });
}

function applySettings(s) {
  if (s.phone_number) {
    const callBtns = document.querySelectorAll('.js-call-btn');
    callBtns.forEach(function(b) { b.href = 'tel:' + s.phone_number; });
    const phoneTexts = document.querySelectorAll('.js-shop-phone');
    phoneTexts.forEach(function(t) { t.textContent = s.phone_number; });
  }
  if (s.whatsapp_number) {
    const waBtns = document.querySelectorAll('.js-whatsapp-btn');
    waBtns.forEach(function(b) {
      b.href = 'https://wa.me/91' + s.whatsapp_number + '?text=' + encodeURIComponent('Namaste Sunil Kumar Jayantilal, I am interested in wholesale saree sets.');
    });
  }
  if (s.shop_address) {
    const addrTexts = document.querySelectorAll('.js-shop-address');
    addrTexts.forEach(function(t) { t.textContent = s.shop_address; });
  }
  if (s.map_direct_url) {
    const mapBtns = document.querySelectorAll('.js-map-btn');
    mapBtns.forEach(function(b) { b.href = s.map_direct_url; });
  }
  if (s.map_embed_url) {
    const mapIframe = document.getElementById('shop-map-iframe');
    if (mapIframe) mapIframe.src = s.map_embed_url;
  }
  if (s.announcement_en || s.announcement_hi) {
    const annEl = document.getElementById('announcement-text');
    if (annEl) {
      annEl.textContent = getLang() === 'hi' ? (s.announcement_hi || s.announcement_en) : (s.announcement_en || s.announcement_hi);
    }
  }
}

function loadCategories() {
  API.getCategories().then(function(res) {
    if (res.success) {
      state.categories = res.categories || [];
      renderCategories();
    }
  });
}

function renderCategories() {
  const grid = document.getElementById('category-grid');
  const pillsContainer = document.getElementById('category-filter-pills');
  const lang = getLang();

  if (grid) {
    grid.innerHTML = '';
    state.categories.forEach(function(c) {
      const card = document.createElement('div');
      card.className = 'category-card' + (state.activeCategory === c.id ? ' active' : '');
      const name = lang === 'hi' ? (c.category_name_hi || c.category_name_en) : c.category_name_en;
      const desc = lang === 'hi' ? (c.description_hi || c.description_en) : c.description_en;

      card.innerHTML = `
        <div class="category-img-wrap">
          <img src="${c.image_url}" alt="${name}" loading="lazy">
        </div>
        <h4>${name}</h4>
        <p>${desc}</p>
      `;

      card.addEventListener('click', function() {
        filterByCategory(c.id);
        const catSection = document.getElementById('catalogue-section');
        if (catSection) catSection.scrollIntoView({ behavior: 'smooth' });
      });
      grid.appendChild(card);
    });
  }

  if (pillsContainer) {
    pillsContainer.innerHTML = '';
    
    // "All Sarees" pill
    const allPill = document.createElement('button');
    allPill.className = 'filter-pill' + (state.activeCategory === 'all' ? ' active' : '');
    allPill.textContent = t('filter_all');
    allPill.addEventListener('click', function() { filterByCategory('all'); });
    pillsContainer.appendChild(allPill);

    state.categories.forEach(function(c) {
      const pill = document.createElement('button');
      pill.className = 'filter-pill' + (state.activeCategory === c.id ? ' active' : '');
      pill.textContent = lang === 'hi' ? (c.category_name_hi || c.category_name_en) : c.category_name_en;
      pill.addEventListener('click', function() { filterByCategory(c.id); });
      pillsContainer.appendChild(pill);
    });
  }
}

function filterByCategory(catId) {
  state.activeCategory = catId;
  renderCategories();
  loadProducts();
}

function loadProducts() {
  const params = {};
  if (state.activeCategory && state.activeCategory !== 'all') {
    params.category = state.activeCategory;
  }
  if (state.searchQuery) {
    params.search = state.searchQuery;
  }
  if (state.inStockOnly) {
    params.inStock = 'true';
  }

  API.getProducts(params).then(function(res) {
    if (res.success) {
      state.products = res.products || [];
      renderProducts();
    }
  }).catch(function(err) {
    console.error('Products error:', err);
  });
}

function renderProducts() {
  const container = document.getElementById('products-grid');
  if (!container) return;
  container.innerHTML = '';

  const lang = getLang();

  if (state.products.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px 16px;">
        <h3 style="color: var(--maroon); margin-bottom: 8px;">${lang === 'hi' ? 'कोई साड़ी नहीं मिली' : 'No Sarees Found'}</h3>
        <p>${lang === 'hi' ? 'कृपया अलग शब्द या कैटेगरी खोजें।' : 'Please try different search keywords or clear filters.'}</p>
        <button class="btn btn-secondary btn-sm" style="margin-top: 16px;" onclick="resetFilters()">${lang === 'hi' ? 'सभी साड़ियां दिखाएं' : 'Show All Sarees'}</button>
      </div>
    `;
    return;
  }

  state.products.forEach(function(p) {
    const card = document.createElement('div');
    card.className = 'product-card';

    const name = lang === 'hi' ? (p.name_hi || p.name_en) : p.name_en;
    const catName = lang === 'hi' ? (p.category_name_hi || p.category_name_en) : p.category_name_en;
    const isOutOfStock = p.available_sets <= 0;

    // Colour dots preview
    let colourDotsHtml = '';
    if (Array.isArray(p.colours_summary) && p.colours_summary.length > 0) {
      p.colours_summary.slice(0, 6).forEach(function(c) {
        colourDotsHtml += `<span class="colour-dot" style="background-color: ${c.hex};" title="${lang === 'hi' ? c.name_hi : c.name_en}"></span>`;
      });
      if (p.colours_summary.length > 6) {
        colourDotsHtml += `<span class="colours-count-text">+${p.colours_summary.length - 6}</span>`;
      }
    }

    card.innerHTML = `
      <div class="card-img-wrap js-open-detail" data-id="${p.id}">
        <img src="${p.main_image}" alt="${name}" loading="lazy">
        <span class="card-set-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          ${t('sarees_per_set_badge', { count: p.sarees_per_set })}
        </span>
        <span class="card-code-badge">${p.product_code}</span>
      </div>
      <div class="card-body">
        <div class="card-category-fabric">
          <span>${catName || 'Saree'}</span> • <span>${p.fabric_type || ''}</span>
        </div>
        <h3 class="card-title js-open-detail" data-id="${p.id}">${name}</h3>

        <div class="card-colours-row">
          ${colourDotsHtml}
          <span class="colours-count-text">${t('colours_available', { count: p.colours_count || p.sarees_per_set })}</span>
        </div>

        <div class="card-price-row">
          <div>
            <span class="price-main">₹${p.price_per_set.toLocaleString('en-IN')}</span>
            <span class="price-unit"> / ${t('set_label')}</span>
          </div>
          <div>
            ${isOutOfStock 
              ? `<span class="stock-status-pill stock-out">${t('out_of_stock')}</span>` 
              : `<span class="stock-status-pill stock-in">${t('available_sets', { count: p.available_sets })}</span>`}
          </div>
        </div>

        <div class="card-actions">
          <button class="btn btn-secondary btn-sm js-open-detail" data-id="${p.id}">
            ${t('btn_view_details')}
          </button>
          <button class="btn btn-primary btn-sm js-quick-add" data-id="${p.id}" ${isOutOfStock ? 'disabled' : ''}>
            ${t('btn_add_to_cart')}
          </button>
        </div>
      </div>
    `;

    // Event listeners for detail and quick add
    card.querySelectorAll('.js-open-detail').forEach(function(el) {
      el.addEventListener('click', function() { openProductDetail(p.id); });
    });

    const addBtn = card.querySelector('.js-quick-add');
    if (addBtn && !isOutOfStock) {
      addBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        quickAddToCart(p);
      });
    }

    container.appendChild(card);
  });
}

function resetFilters() {
  state.activeCategory = 'all';
  state.searchQuery = '';
  state.inStockOnly = false;
  const searchInput = document.getElementById('product-search-input');
  if (searchInput) searchInput.value = '';
  renderCategories();
  loadProducts();
}

// Quick Add To Cart (1 Set)
function quickAddToCart(product) {
  if (product.available_sets <= 0) {
    showToast(t('out_of_stock'), 'error');
    return;
  }

  const existingIdx = state.cart.findIndex(function(item) {
    return item.product_id === product.id;
  });

  if (existingIdx !== -1) {
    if (state.cart[existingIdx].number_of_sets >= product.available_sets) {
      showToast(t('toast_max_stock', { max: product.available_sets }), 'error');
      return;
    }
    state.cart[existingIdx].number_of_sets += 1;
    state.cart[existingIdx].total_sarees = state.cart[existingIdx].number_of_sets * product.sarees_per_set;
    state.cart[existingIdx].total_price = state.cart[existingIdx].number_of_sets * product.price_per_set;
  } else {
    state.cart.push({
      product_id: product.id,
      product_code: product.product_code,
      product_name_en: product.name_en,
      product_name_hi: product.name_hi,
      image_url: product.main_image,
      price_per_set: product.price_per_set,
      sarees_per_set: product.sarees_per_set,
      number_of_sets: 1,
      total_sarees: product.sarees_per_set,
      total_price: product.price_per_set,
      max_stock: product.available_sets,
      colours_summary: product.colours_summary || []
    });
  }

  saveCart();
  const name = getLang() === 'hi' ? product.name_hi : product.name_en;
  showToast(t('toast_added_to_cart', { name: name, sets: 1 }), 'success');
  openCartDrawer();
}

// Open Product Detail Modal
function openProductDetail(productId) {
  API.getProduct(productId).then(function(res) {
    if (res.success && res.product) {
      state.detailProduct = res.product;
      state.activeDetailImage = res.product.main_image;
      state.selectedColourId = null;
      state.selectedDetailSets = 1;
      renderProductDetailModal(res.product);

      const modal = document.getElementById('product-detail-modal');
      if (modal) modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }).catch(function(err) {
    console.error('Fetch product detail error:', err);
    showToast(t('toast_error'), 'error');
  });
}

function closeProductDetailModal() {
  const modal = document.getElementById('product-detail-modal');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = '';
}

// Render Product Detail Modal (Critical PRD Section: Colours Display & Set Math)
function renderProductDetailModal(p) {
  const container = document.getElementById('detail-modal-body');
  if (!container) return;

  const lang = getLang();
  const name = lang === 'hi' ? (p.name_hi || p.name_en) : p.name_en;
  const desc = lang === 'hi' ? (p.description_hi || p.description_en) : p.description_en;
  const isOutOfStock = p.available_sets <= 0;
  const maxStock = p.available_sets;

  // Sarees and price calculation based on state.selectedDetailSets
  const setsCount = state.selectedDetailSets;
  const totalSarees = setsCount * p.sarees_per_set;
  const totalPrice = setsCount * p.price_per_set;

  // Build Colour Swatch Cards
  let coloursHtml = '';
  if (Array.isArray(p.colours) && p.colours.length > 0) {
    p.colours.forEach(function(col) {
      const isSelected = state.selectedColourId === col.id;
      const cName = lang === 'hi' ? (col.colour_name_hi || col.colour_name_en) : col.colour_name_en;
      coloursHtml += `
        <div class="colour-selection-card ${isSelected ? 'selected' : ''}" data-col-id="${col.id}" data-col-img="${col.colour_image_url}">
          <span class="circle" style="background-color: ${col.hex_code};"></span>
          <div>
            <div class="c-name">${cName}</div>
            <div class="c-qty">${col.quantity_in_set} ${lang === 'hi' ? 'साड़ी' : 'saree'}</div>
          </div>
        </div>
      `;
    });
  }

  // Thumbnails HTML
  let thumbsHtml = `
    <div class="thumb-item ${state.activeDetailImage === p.main_image ? 'active' : ''}" data-img="${p.main_image}">
      <img src="${p.main_image}" alt="Main Saree">
    </div>
  `;
  if (Array.isArray(p.colours)) {
    p.colours.forEach(function(col) {
      thumbsHtml += `
        <div class="thumb-item ${state.activeDetailImage === col.colour_image_url ? 'active' : ''}" data-img="${col.colour_image_url}" data-col-id="${col.id}">
          <img src="${col.colour_image_url}" alt="${col.colour_name_en}">
        </div>
      `;
    });
  }

  container.innerHTML = `
    <div class="detail-grid">
      <!-- Gallery Column -->
      <div class="gallery-section">
        <div class="main-preview-wrap" id="detail-main-img-wrap">
          <img src="${state.activeDetailImage}" id="detail-main-img" alt="${name}">
          <span class="zoom-hint-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M11 8v6M8 11h6"/></svg>
            ${t('zoom_hint')}
          </span>
        </div>
        <div class="thumbnails-strip" id="detail-thumbs">
          ${thumbsHtml}
        </div>
      </div>

      <!-- Info Column -->
      <div class="detail-info">
        <div class="detail-header-meta">
          <span class="stock-status-pill ${isOutOfStock ? 'stock-out' : 'stock-in'}">
            ${isOutOfStock ? t('out_of_stock') : t('available_sets', { count: maxStock })}
          </span>
          <span style="font-weight: 700; color: var(--gold); font-size: 0.85rem;">${t('product_code_label')}: ${p.product_code}</span>
        </div>

        <h2 style="font-size: 1.5rem; color: var(--maroon);">${name}</h2>

        <div style="font-size: 0.92rem; color: var(--text-muted); display: flex; gap: 16px; flex-wrap: wrap;">
          <span><strong>${t('fabric_label')}:</strong> ${p.fabric_type || 'Georgette Silk'}</span>
          <span><strong>${t('design_label')}:</strong> ${p.design_type || 'Set Print'}</span>
        </div>

        <!-- Prominent Set Quantity Highlight Banner -->
        <div class="set-highlight-banner">
          <div>
            <div class="main-text">1 ${t('set_label')} = ${p.sarees_per_set} ${lang === 'hi' ? 'साड़ियां' : 'Sarees'}</div>
            <div class="sub-text">${t('set_quantity_box_desc', { count: p.sarees_per_set })}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 1.4rem; font-weight: 800; color: var(--maroon);">₹${p.price_per_set.toLocaleString('en-IN')}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">/ ${t('set_label')}</div>
          </div>
        </div>

        <!-- Special Colours Included in Set (Interactive Swatches) -->
        <div class="colours-box">
          <div class="colours-box-header">
            <span class="colours-box-title">${t('colours_included_title')} (${p.colours ? p.colours.length : 0})</span>
            <span class="colours-box-note">${t('colours_included_note')}</span>
          </div>
          <div class="colours-list-interactive" id="colours-interactive-list">
            ${coloursHtml}
          </div>
        </div>

        <!-- Set Calculator and Stepper -->
        <div class="calc-box">
          <div class="calc-row">
            <span style="font-weight: 700; color: var(--dark);">${t('qty_selector_label')}</span>
            <div class="quantity-stepper">
              <button class="step-btn" id="modal-step-dec" ${setsCount <= 1 ? 'disabled' : ''}>-</button>
              <input type="text" class="step-input" id="modal-step-val" value="${setsCount}" readonly>
              <button class="step-btn" id="modal-step-inc" ${setsCount >= maxStock ? 'disabled' : ''}>+</button>
            </div>
          </div>

          <div class="calc-breakdown">
            <div class="calc-line">
              <span>${setsCount} ${t('set_label')} × ${p.sarees_per_set} ${lang === 'hi' ? 'साड़ियां' : 'sarees'}:</span>
              <strong>${totalSarees} ${lang === 'hi' ? 'साड़ियां' : 'Sarees'}</strong>
            </div>
            <div class="calc-line">
              <span>${setsCount} ${t('set_label')} × ₹${p.price_per_set.toLocaleString('en-IN')}:</span>
              <strong>₹${totalPrice.toLocaleString('en-IN')}</strong>
            </div>
            <div class="calc-line total">
              <span>${t('total_price_label')}:</span>
              <span>₹${totalPrice.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 8px;">
          <button class="btn btn-primary btn-lg" id="modal-add-to-cart-btn" ${isOutOfStock ? 'disabled' : ''}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            ${t('btn_add_set_to_cart', { count: setsCount })}
          </button>
          <a class="btn btn-whatsapp btn-lg" id="modal-wa-btn" target="_blank" href="https://wa.me/91${state.settings.whatsapp_number || '9425191176'}?text=${encodeURIComponent('Hello Sunil Kumar Jayantilal, I want wholesale inquiry for Saree Set ' + p.product_code + ' - ' + p.name_en)}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z"/></svg>
            ${t('btn_enquire_whatsapp')}
          </a>
        </div>

        <p style="font-size: 0.9rem; line-height: 1.5; color: var(--text-muted); margin-top: 12px;">${desc}</p>
      </div>
    </div>
  `;

  // Bind Swatch Click: updates main photo and swatch highlight
  container.querySelectorAll('.colour-selection-card').forEach(function(card) {
    card.addEventListener('click', function() {
      const colId = card.getAttribute('data-col-id');
      const colImg = card.getAttribute('data-col-img');
      state.selectedColourId = colId;
      state.activeDetailImage = colImg;

      const mainImg = document.getElementById('detail-main-img');
      if (mainImg) mainImg.src = colImg;

      // Update swatch card classes
      container.querySelectorAll('.colour-selection-card').forEach(function(c) {
        c.classList.remove('selected');
      });
      card.classList.add('selected');

      // Update thumb strip
      container.querySelectorAll('.thumb-item').forEach(function(t) {
        t.classList.remove('active');
        if (t.getAttribute('data-col-id') === colId) {
          t.classList.add('active');
        }
      });
    });
  });

  // Bind Thumbnail Clicks
  container.querySelectorAll('.thumb-item').forEach(function(thumb) {
    thumb.addEventListener('click', function() {
      const imgUrl = thumb.getAttribute('data-img');
      const colId = thumb.getAttribute('data-col-id');
      state.activeDetailImage = imgUrl;
      state.selectedColourId = colId || null;

      const mainImg = document.getElementById('detail-main-img');
      if (mainImg) mainImg.src = imgUrl;

      container.querySelectorAll('.thumb-item').forEach(function(t) { t.classList.remove('active'); });
      thumb.classList.add('active');

      container.querySelectorAll('.colour-selection-card').forEach(function(c) {
        if (c.getAttribute('data-col-id') === colId) c.classList.add('selected');
        else c.classList.remove('selected');
      });
    });
  });

  // Zoom Click
  const mainImgWrap = document.getElementById('detail-main-img-wrap');
  if (mainImgWrap) {
    mainImgWrap.addEventListener('click', function() {
      openZoomModal(state.activeDetailImage, name);
    });
  }

  // Stepper Dec / Inc
  const decBtn = document.getElementById('modal-step-dec');
  const incBtn = document.getElementById('modal-step-inc');

  if (decBtn) {
    decBtn.addEventListener('click', function() {
      if (state.selectedDetailSets > 1) {
        state.selectedDetailSets -= 1;
        renderProductDetailModal(p);
      }
    });
  }
  if (incBtn) {
    incBtn.addEventListener('click', function() {
      if (state.selectedDetailSets < maxStock) {
        state.selectedDetailSets += 1;
        renderProductDetailModal(p);
      } else {
        showToast(t('toast_max_stock', { max: maxStock }), 'error');
      }
    });
  }

  // Add to cart from modal
  const modalAddBtn = document.getElementById('modal-add-to-cart-btn');
  if (modalAddBtn && !isOutOfStock) {
    modalAddBtn.addEventListener('click', function() {
      addSetsToCart(p, state.selectedDetailSets);
      closeProductDetailModal();
    });
  }
}

function addSetsToCart(product, setsCount) {
  const existingIdx = state.cart.findIndex(function(item) {
    return item.product_id === product.id;
  });

  if (existingIdx !== -1) {
    const newTotal = state.cart[existingIdx].number_of_sets + setsCount;
    if (newTotal > product.available_sets) {
      showToast(t('toast_max_stock', { max: product.available_sets }), 'error');
      return;
    }
    state.cart[existingIdx].number_of_sets = newTotal;
    state.cart[existingIdx].total_sarees = newTotal * product.sarees_per_set;
    state.cart[existingIdx].total_price = newTotal * product.price_per_set;
  } else {
    state.cart.push({
      product_id: product.id,
      product_code: product.product_code,
      product_name_en: product.name_en,
      product_name_hi: product.name_hi,
      image_url: product.main_image,
      price_per_set: product.price_per_set,
      sarees_per_set: product.sarees_per_set,
      number_of_sets: setsCount,
      total_sarees: setsCount * product.sarees_per_set,
      total_price: setsCount * product.price_per_set,
      max_stock: product.available_sets,
      colours_summary: product.colours_summary || []
    });
  }

  saveCart();
  const name = getLang() === 'hi' ? product.name_hi : product.name_en;
  showToast(t('toast_added_to_cart', { name: name, sets: setsCount }), 'success');
  openCartDrawer();
}

// Fullscreen Zoom Modal
function openZoomModal(imgUrl, title) {
  let zoomModal = document.getElementById('zoom-modal');
  if (!zoomModal) {
    zoomModal = document.createElement('div');
    zoomModal.id = 'zoom-modal';
    zoomModal.className = 'modal-overlay';
    zoomModal.innerHTML = `
      <div style="position: relative; max-width: 90vw; max-height: 90vh;">
        <button class="modal-close-btn" id="zoom-close-btn">&times;</button>
        <img id="zoom-modal-img" src="" style="width: 100%; height: auto; max-height: 85vh; object-fit: contain; border-radius: 8px;">
      </div>
    `;
    document.body.appendChild(zoomModal);
    zoomModal.querySelector('#zoom-close-btn').addEventListener('click', function() {
      zoomModal.classList.remove('active');
    });
    zoomModal.addEventListener('click', function(e) {
      if (e.target === zoomModal) zoomModal.classList.remove('active');
    });
  }

  document.getElementById('zoom-modal-img').src = imgUrl;
  zoomModal.classList.add('active');
}

// Cart Drawer Functions
function openCartDrawer() {
  renderCartDrawer();
  const overlay = document.getElementById('cart-drawer-overlay');
  const drawer = document.getElementById('cart-drawer');
  if (overlay) overlay.classList.add('active');
  if (drawer) drawer.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCartDrawer() {
  const overlay = document.getElementById('cart-drawer-overlay');
  const drawer = document.getElementById('cart-drawer');
  if (overlay) overlay.classList.remove('active');
  if (drawer) drawer.classList.remove('active');
  document.body.style.overflow = '';
}

function renderCartDrawer() {
  const body = document.getElementById('cart-drawer-body');
  const footer = document.getElementById('cart-drawer-footer');
  if (!body || !footer) return;

  const lang = getLang();

  if (state.cart.length === 0) {
    body.innerHTML = `
      <div class="empty-cart-view">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        <h3 style="color: var(--maroon); margin-bottom: 6px;">${t('cart_empty_title')}</h3>
        <p style="font-size: 0.9rem;">${t('cart_empty_desc')}</p>
        <button class="btn btn-secondary btn-sm" style="margin-top: 16px;" onclick="closeCartDrawer()">${t('cart_btn_browse')}</button>
      </div>
    `;
    footer.style.display = 'none';
    return;
  }

  footer.style.display = 'flex';
  body.innerHTML = '';

  let grandTotalAmount = 0;
  let grandTotalSarees = 0;

  state.cart.forEach(function(item, idx) {
    grandTotalAmount += item.total_price;
    grandTotalSarees += item.total_sarees;

    const name = lang === 'hi' ? (item.product_name_hi || item.product_name_en) : item.product_name_en;

    const el = document.createElement('div');
    el.className = 'cart-item';
    el.innerHTML = `
      <div class="cart-item-img">
        <img src="${item.image_url}" alt="${name}">
      </div>
      <div class="cart-item-info">
        <div class="cart-item-title">${name}</div>
        <div class="cart-item-code">${t('product_code_label')}: ${item.product_code}</div>
        <div class="cart-item-formula">
          ${item.number_of_sets} ${t('set_label')} × ${item.sarees_per_set} = <strong>${item.total_sarees} ${lang === 'hi' ? 'साड़ियां' : 'Sarees'}</strong>
        </div>
        <div class="cart-item-stepper-row">
          <div class="quantity-stepper">
            <button class="step-btn js-cart-dec" data-idx="${idx}">-</button>
            <input type="text" class="step-input" value="${item.number_of_sets}" readonly style="width: 44px; height: 36px; font-size: 0.95rem;">
            <button class="step-btn js-cart-inc" data-idx="${idx}">+</button>
          </div>
          <div class="cart-item-price">₹${item.total_price.toLocaleString('en-IN')}</div>
          <button class="cart-item-remove js-cart-del" data-idx="${idx}">✕</button>
        </div>
      </div>
    `;

    // Handlers
    el.querySelector('.js-cart-dec').addEventListener('click', function() {
      if (item.number_of_sets > 1) {
        item.number_of_sets -= 1;
        item.total_sarees = item.number_of_sets * item.sarees_per_set;
        item.total_price = item.number_of_sets * item.price_per_set;
        saveCart();
        renderCartDrawer();
      } else {
        removeCartItem(idx);
      }
    });

    el.querySelector('.js-cart-inc').addEventListener('click', function() {
      if (item.number_of_sets < item.max_stock) {
        item.number_of_sets += 1;
        item.total_sarees = item.number_of_sets * item.sarees_per_set;
        item.total_price = item.number_of_sets * item.price_per_set;
        saveCart();
        renderCartDrawer();
      } else {
        showToast(t('toast_max_stock', { max: item.max_stock }), 'error');
      }
    });

    el.querySelector('.js-cart-del').addEventListener('click', function() {
      removeCartItem(idx);
    });

    body.appendChild(el);
  });

  // Update Footer totals
  document.getElementById('cart-total-sarees-count').textContent = t('cart_total_sarees', { sarees: grandTotalSarees });
  document.getElementById('cart-grand-total-amount').textContent = '₹' + grandTotalAmount.toLocaleString('en-IN');
}

function removeCartItem(idx) {
  state.cart.splice(idx, 1);
  saveCart();
  renderCartDrawer();
}

// Checkout Modal
function openCheckoutModal() {
  if (state.cart.length === 0) {
    showToast(t('cart_empty_title'), 'error');
    return;
  }
  closeCartDrawer();

  const lang = getLang();
  const summaryList = document.getElementById('checkout-items-summary');
  if (summaryList) {
    summaryList.innerHTML = '';
    let grandAmount = 0;
    let grandSarees = 0;

    state.cart.forEach(function(item) {
      grandAmount += item.total_price;
      grandSarees += item.total_sarees;
      const li = document.createElement('div');
      li.style.cssText = 'display: flex; justify-content: space-between; font-size: 0.88rem; padding: 6px 0; border-bottom: 1px dashed var(--beige);';
      const name = lang === 'hi' ? (item.product_name_hi || item.product_name_en) : item.product_name_en;
      li.innerHTML = `
        <div>
          <strong>${name}</strong> (${item.product_code})<br>
          <span style="color: var(--text-muted);">${item.number_of_sets} ${t('set_label')} = ${item.total_sarees} ${lang === 'hi' ? 'साड़ियां' : 'sarees'}</span>
        </div>
        <div style="font-weight: 700; color: var(--maroon);">₹${item.total_price.toLocaleString('en-IN')}</div>
      `;
      summaryList.appendChild(li);
    });

    document.getElementById('checkout-total-sets').textContent = state.cart.reduce((s, i) => s + i.number_of_sets, 0);
    document.getElementById('checkout-total-sarees').textContent = grandSarees;
    document.getElementById('checkout-grand-total').textContent = '₹' + grandAmount.toLocaleString('en-IN');
  }

  const modal = document.getElementById('checkout-modal');
  if (modal) modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCheckoutModal() {
  const modal = document.getElementById('checkout-modal');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = '';
}

// Submit Order (Mode: 'web' or 'whatsapp')
function handleOrderSubmit(mode) {
  const nameInput = document.getElementById('cust-name');
  const phoneInput = document.getElementById('cust-phone');
  const addressInput = document.getElementById('cust-address');
  const cityInput = document.getElementById('cust-city');
  const stateInput = document.getElementById('cust-state');
  const pincodeInput = document.getElementById('cust-pincode');
  const notesInput = document.getElementById('cust-notes');

  const customerName = (nameInput ? nameInput.value : '').trim();
  const mobile = (phoneInput ? phoneInput.value : '').replace(/[^0-9]/g, '');
  const address = (addressInput ? addressInput.value : '').trim();
  const city = (cityInput ? cityInput.value : '').trim();
  const stateVal = (stateInput ? stateInput.value : '').trim();
  const pincode = (pincodeInput ? pincodeInput.value : '').trim();
  const notes = (notesInput ? notesInput.value : '').trim();

  if (!customerName) {
    showToast('Please enter your business or retailer name', 'error');
    if (nameInput) nameInput.focus();
    return;
  }
  if (!mobile || mobile.length < 10) {
    showToast('Please enter a valid 10-digit mobile number', 'error');
    if (phoneInput) phoneInput.focus();
    return;
  }
  if (!address) {
    showToast('Please enter your shop or delivery address', 'error');
    if (addressInput) addressInput.focus();
    return;
  }

  const payload = {
    customer_name: customerName,
    mobile_number: mobile,
    delivery_address: address,
    city: city || 'Indore',
    state: stateVal || 'Madhya Pradesh',
    pincode: pincode || '452002',
    customer_notes: notes,
    items: state.cart.map(function(i) {
      return {
        product_id: i.product_id,
        product_code: i.product_code,
        number_of_sets: i.number_of_sets
      };
    })
  };

  const submitBtn = document.getElementById('submit-order-btn');
  const waBtn = document.getElementById('send-wa-order-btn');
  if (submitBtn) submitBtn.disabled = true;
  if (waBtn) waBtn.disabled = true;

  API.submitOrder(payload).then(function(res) {
    if (res.success && res.order) {
      // Clear Cart
      state.cart = [];
      saveCart();
      closeCheckoutModal();

      // Show Confirmation Dialog
      openConfirmationModal(res.order, res.whatsapp);

      if (mode === 'whatsapp' && res.whatsapp && res.whatsapp.url) {
        window.open(res.whatsapp.url, '_blank');
      }
    }
  }).catch(function(err) {
    console.error('Order submission error:', err);
    showToast(err.message || t('toast_error'), 'error');
  }).then(function() {
    if (submitBtn) submitBtn.disabled = false;
    if (waBtn) waBtn.disabled = false;
  });
}

function openConfirmationModal(order, whatsapp) {
  const modal = document.getElementById('confirmation-modal');
  if (!modal) return;

  document.getElementById('conf-order-number').textContent = order.order_number;
  document.getElementById('conf-cust-name').textContent = order.customer_name;
  document.getElementById('conf-phone').textContent = order.mobile_number;
  document.getElementById('conf-total').textContent = '₹' + order.grand_total.toLocaleString('en-IN');
  document.getElementById('conf-status-notice').textContent = t('confirmation_status_notice', { phone: order.mobile_number });

  const waBtn = document.getElementById('conf-whatsapp-btn');
  if (waBtn && whatsapp && whatsapp.url) {
    waBtn.href = whatsapp.url;
  }

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeConfirmationModal() {
  const modal = document.getElementById('confirmation-modal');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = '';
}

// Order Lookup Modal
function openOrderLookupModal() {
  const modal = document.getElementById('lookup-modal');
  if (modal) modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeOrderLookupModal() {
  const modal = document.getElementById('lookup-modal');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = '';
}

function performOrderLookup() {
  const input = document.getElementById('lookup-input');
  const query = (input ? input.value : '').trim();
  if (!query) {
    showToast('Please enter mobile number or order code', 'error');
    return;
  }

  const resultContainer = document.getElementById('lookup-results');
  resultContainer.innerHTML = '<p style="text-align: center; padding: 16px;">Searching...</p>';

  API.lookupOrders(query).then(function(res) {
    if (res.success && res.orders && res.orders.length > 0) {
      resultContainer.innerHTML = '';
      res.orders.forEach(function(o) {
        const card = document.createElement('div');
        card.style.cssText = 'background: var(--cream-soft); border: 1.5px solid var(--beige); border-radius: 8px; padding: 16px; margin-bottom: 12px;';
        
        let statusBadge = '<span class="stock-status-pill stock-in">' + o.order_status + '</span>';
        if (o.order_status === 'Pending Confirmation') {
          statusBadge = '<span class="stock-status-pill" style="background:#FEF3C7; color:#92400E;">' + o.order_status + '</span>';
        } else if (o.order_status === 'Cancelled') {
          statusBadge = '<span class="stock-status-pill stock-out">' + o.order_status + '</span>';
        }

        let itemsHtml = '';
        if (Array.isArray(o.items)) {
          o.items.forEach(function(i) {
            itemsHtml += `<div style="font-size: 0.85rem; color: var(--text-muted);">• ${i.product_name_snapshot} (${i.number_of_sets} Sets / ${i.total_sarees} Sarees) - ₹${i.total_price.toLocaleString('en-IN')}</div>`;
          });
        }

        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
            <strong style="color: var(--maroon); font-size: 1.05rem;">${o.order_number}</strong>
            ${statusBadge}
          </div>
          <div style="font-size: 0.85rem; margin-bottom: 6px;">Customer: <strong>${o.customer_name}</strong> (${o.mobile_number})</div>
          <div style="font-size: 0.85rem; margin-bottom: 8px;">Date: ${new Date(o.created_at).toLocaleDateString('en-IN')}</div>
          <div style="border-top: 1px dashed var(--beige); padding-top: 8px; margin-top: 6px;">
            ${itemsHtml}
          </div>
          <div style="text-align: right; font-weight: 800; color: var(--maroon); font-size: 1.1rem; margin-top: 8px;">
            Total: ₹${o.grand_total.toLocaleString('en-IN')}
          </div>
        `;
        resultContainer.appendChild(card);
      });
    } else {
      resultContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 24px;">No orders found for this query.</p>';
    }
  }).catch(function(err) {
    resultContainer.innerHTML = '<p style="color: var(--danger); text-align: center;">Error searching orders.</p>';
  });
}

// Global Event Listeners
function setupEventListeners() {
  // Language Switch Buttons
  document.querySelectorAll('.lang-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const targetLang = btn.getAttribute('data-lang');
      setLang(targetLang);
    });
  });

  // Search Input with debounce
  const searchInput = document.getElementById('product-search-input');
  if (searchInput) {
    let timeout;
    searchInput.addEventListener('input', function() {
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        state.searchQuery = searchInput.value.trim();
        loadProducts();
      }, 300);
    });
  }

  // Cart Button triggers
  document.querySelectorAll('.js-open-cart').forEach(function(b) {
    b.addEventListener('click', function(e) {
      e.preventDefault();
      openCartDrawer();
    });
  });

  const cartCloseBtn = document.getElementById('cart-drawer-close-btn');
  if (cartCloseBtn) cartCloseBtn.addEventListener('click', closeCartDrawer);

  const cartOverlay = document.getElementById('cart-drawer-overlay');
  if (cartOverlay) cartOverlay.addEventListener('click', closeCartDrawer);

  // Modal Closers
  const detailClose = document.getElementById('detail-modal-close-btn');
  if (detailClose) detailClose.addEventListener('click', closeProductDetailModal);

  const detailModal = document.getElementById('product-detail-modal');
  if (detailModal) {
    detailModal.addEventListener('click', function(e) {
      if (e.target === detailModal) closeProductDetailModal();
    });
  }

  const checkoutClose = document.getElementById('checkout-modal-close-btn');
  if (checkoutClose) checkoutClose.addEventListener('click', closeCheckoutModal);

  const confClose = document.getElementById('conf-close-btn');
  if (confClose) confClose.addEventListener('click', closeConfirmationModal);

  const lookupClose = document.getElementById('lookup-modal-close-btn');
  if (lookupClose) lookupClose.addEventListener('click', closeOrderLookupModal);

  // Checkout Triggers
  const proceedBtn = document.getElementById('cart-proceed-checkout-btn');
  if (proceedBtn) proceedBtn.addEventListener('click', openCheckoutModal);

  const submitOrderBtn = document.getElementById('submit-order-btn');
  if (submitOrderBtn) {
    submitOrderBtn.addEventListener('click', function(e) {
      e.preventDefault();
      handleOrderSubmit('web');
    });
  }

  const sendWaOrderBtn = document.getElementById('send-wa-order-btn');
  if (sendWaOrderBtn) {
    sendWaOrderBtn.addEventListener('click', function(e) {
      e.preventDefault();
      handleOrderSubmit('whatsapp');
    });
  }

  // Lookup trigger
  const lookupBtn = document.getElementById('btn-execute-lookup');
  if (lookupBtn) lookupBtn.addEventListener('click', performOrderLookup);

  document.querySelectorAll('.js-open-lookup').forEach(function(b) {
    b.addEventListener('click', function(e) {
      e.preventDefault();
      openOrderLookupModal();
    });
  });
}

// Start app when DOM ready
document.addEventListener('DOMContentLoaded', initApp);
