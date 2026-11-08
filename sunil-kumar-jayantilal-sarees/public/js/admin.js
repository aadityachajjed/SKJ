// Sunil Kumar Jayantilal - Admin Dashboard Controller

var adminState = {
  user: null,
  products: [],
  categories: [],
  orders: [],
  settings: {},
  stats: {},
  auditLogs: [],
  activeTab: 'products',
  currentQuickStockProduct: null,
  wizard: {
    step: 1,
    colours: [],
    mainImage: '/images/skj001-main.svg'
  }
};

function showAdminToast(msg, type) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const t = document.createElement('div');
  t.className = 'toast' + (type ? ' toast-' + type : '');
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(function() {
    t.style.opacity = '0';
    setTimeout(function() {
      if (t.parentNode) t.parentNode.removeChild(t);
    }, 300);
  }, 3000);
}

// Check Authentication
function checkAuth() {
  API.getMe().then(function(res) {
    if (res.success && res.user) {
      adminState.user = res.user;
      showDashboardView();
      loadAllAdminData();
    } else {
      showLoginView();
    }
  }).catch(function() {
    showLoginView();
  });
}

function showLoginView() {
  document.getElementById('admin-login-view').style.display = 'flex';
  document.getElementById('admin-dashboard-view').style.display = 'none';
}

function showDashboardView() {
  document.getElementById('admin-login-view').style.display = 'none';
  document.getElementById('admin-dashboard-view').style.display = 'block';
}

function handleLogin() {
  const userEl = document.getElementById('login-username');
  const passEl = document.getElementById('login-password');
  const u = (userEl ? userEl.value : '').trim();
  const p = (passEl ? passEl.value : '');

  if (!u || !p) {
    showAdminToast('Please enter username and password', 'error');
    return;
  }

  API.login(u, p).then(function(res) {
    if (res.success && res.user) {
      adminState.user = res.user;
      showDashboardView();
      loadAllAdminData();
      showAdminToast('Welcome back, ' + res.user.full_name, 'success');
    }
  }).catch(function(err) {
    showAdminToast(err.message || 'Login failed. Check credentials.', 'error');
  });
}

function handleLogout() {
  API.logout().then(function() {
    adminState.user = null;
    showLoginView();
    showAdminToast('Logged out successfully', 'success');
  });
}

// Load All Admin Data
function loadAllAdminData() {
  loadStats();
  loadAdminCategories();
  loadAdminProducts();
  loadAdminOrders();
  loadAdminSettings();
}

function loadStats() {
  API.getStats().then(function(res) {
    if (res.success && res.stats) {
      adminState.stats = res.stats;
      adminState.auditLogs = res.recent_audit || [];
      document.getElementById('stat-products').textContent = res.stats.total_products;
      document.getElementById('stat-available-sets').textContent = res.stats.total_available_sets;
      document.getElementById('stat-out-of-stock').textContent = res.stats.out_of_stock_products;
      document.getElementById('stat-pending-orders').textContent = res.stats.pending_orders;
      document.getElementById('stat-confirmed-orders').textContent = res.stats.confirmed_orders;
      renderAuditLogs();
    }
  }).catch(function(err) {
    console.error('Stats error:', err);
  });
}

function loadAdminCategories() {
  API.getCategories().then(function(res) {
    if (res.success) {
      adminState.categories = res.categories || [];
      const sel = document.getElementById('wiz-category');
      if (sel) {
        sel.innerHTML = '';
        adminState.categories.forEach(function(c) {
          const opt = document.createElement('option');
          opt.value = c.id;
          opt.textContent = c.category_name_hi + ' (' + c.category_name_en + ')';
          sel.appendChild(opt);
        });
      }
    }
  });
}

function loadAdminProducts() {
  API.getProducts().then(function(res) {
    if (res.success) {
      adminState.products = res.products || [];
      renderAdminProductsTable();
    }
  });
}

function renderAdminProductsTable() {
  const tbody = document.getElementById('admin-products-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  const search = (document.getElementById('admin-product-search').value || '').trim().toLowerCase();
  let list = adminState.products;

  if (search) {
    list = list.filter(function(p) {
      return (p.name_en && p.name_en.toLowerCase().indexOf(search) !== -1) ||
             (p.name_hi && p.name_hi.toLowerCase().indexOf(search) !== -1) ||
             (p.product_code && p.product_code.toLowerCase().indexOf(search) !== -1) ||
             (p.fabric_type && p.fabric_type.toLowerCase().indexOf(search) !== -1);
    });
  }

  document.getElementById('admin-prod-count').textContent = list.length;

  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding: 24px;">No products match.</td></tr>';
    return;
  }

  list.forEach(function(p) {
    const tr = document.createElement('tr');
    const isOutOfStock = p.available_sets <= 0;

    tr.innerHTML = `
      <td>
        <img src="${p.main_image}" style="width: 44px; height: 55px; object-fit: cover; border-radius: 4px; border: 1px solid var(--beige);">
      </td>
      <td><strong>${p.product_code}</strong></td>
      <td>
        <div style="font-weight: 700; color: var(--dark);">${p.name_hi}</div>
        <div style="font-size: 0.8rem; color: var(--text-muted);">${p.name_en}</div>
      </td>
      <td>${p.fabric_type || '-'}</td>
      <td><strong>1 Set = ${p.sarees_per_set} Sarees</strong></td>
      <td style="font-weight: 800; color: var(--maroon);">₹${p.price_per_set.toLocaleString('en-IN')}</td>
      <td>
        <span style="font-size: 1.1rem; font-weight: 800; color: ${isOutOfStock ? 'var(--danger)' : 'var(--success)'};">
          ${p.available_sets}
        </span> Sets
      </td>
      <td>
        ${isOutOfStock 
          ? '<span class="stock-status-pill stock-out">Out of Stock</span>' 
          : '<span class="stock-status-pill stock-in">Active In Stock</span>'}
      </td>
      <td>
        <div style="display: flex; gap: 6px;">
          <button class="btn btn-primary btn-sm js-quick-stock" style="padding: 4px 10px; font-size: 0.8rem;">
            Stock ±
          </button>
          <button class="btn btn-secondary btn-sm js-del-prod" style="padding: 4px 10px; font-size: 0.8rem; color: var(--danger);">
            Archive
          </button>
        </div>
      </td>
    `;

    tr.querySelector('.js-quick-stock').addEventListener('click', function() {
      openQuickStockModal(p);
    });

    tr.querySelector('.js-del-prod').addEventListener('click', function() {
      if (confirm('Are you sure you want to archive/hide product ' + p.product_code + ' (' + p.name_en + ')?')) {
        API.deleteProduct(p.id).then(function() {
          showAdminToast('Product archived successfully', 'success');
          loadAdminProducts();
          loadStats();
        });
      }
    });

    tbody.appendChild(tr);
  });
}

// Quick Stock Modal
function openQuickStockModal(product) {
  adminState.currentQuickStockProduct = product;
  document.getElementById('stock-modal-prod-title').textContent = product.product_code + ' - ' + product.name_en;
  document.getElementById('stock-modal-current').textContent = product.available_sets;
  document.getElementById('stock-modal-exact-input').value = product.available_sets;
  document.getElementById('stock-modal').classList.add('active');
}

function closeQuickStockModal() {
  document.getElementById('stock-modal').classList.remove('active');
  adminState.currentQuickStockProduct = null;
}

function adjustQuickStock(diff) {
  const input = document.getElementById('stock-modal-exact-input');
  let val = Number(input.value || 0) + diff;
  if (val < 0) val = 0;
  input.value = val;
}

function saveQuickStock() {
  const p = adminState.currentQuickStockProduct;
  if (!p) return;
  const exactVal = Number(document.getElementById('stock-modal-exact-input').value);
  const reason = document.getElementById('stock-modal-reason').value || 'Admin quick stock update';

  API.updateStock(p.id, { exactStock: exactVal, reason: reason }).then(function(res) {
    if (res.success) {
      showAdminToast('Stock updated to ' + res.available_sets + ' sets', 'success');
      closeQuickStockModal();
      loadAdminProducts();
      loadStats();
    }
  }).catch(function(err) {
    showAdminToast(err.message || 'Stock update failed', 'error');
  });
}

// Load and Render Orders
function loadAdminOrders() {
  API.getOrders().then(function(res) {
    if (res.success) {
      adminState.orders = res.orders || [];
      renderAdminOrders();
    }
  });
}

function renderAdminOrders() {
  const container = document.getElementById('admin-orders-list');
  if (!container) return;
  container.innerHTML = '';

  const filter = document.getElementById('order-status-filter').value;
  let list = adminState.orders;

  if (filter && filter !== 'all') {
    list = list.filter(function(o) { return o.order_status === filter; });
  }

  if (list.length === 0) {
    container.innerHTML = '<div style="background:var(--white); padding:32px; border-radius:8px; text-align:center;">No orders found for this status.</div>';
    return;
  }

  list.forEach(function(o) {
    const card = document.createElement('div');
    card.style.cssText = 'background: var(--white); border: 1.5px solid var(--beige); border-radius: var(--radius-md); padding: 20px; margin-bottom: 16px; box-shadow: var(--shadow-sm);';

    let itemsHtml = '';
    let totalSareesCount = 0;
    if (Array.isArray(o.items)) {
      o.items.forEach(function(i) {
        totalSareesCount += i.total_sarees;
        itemsHtml += `
          <div style="display: flex; justify-content: space-between; font-size: 0.88rem; padding: 6px 0; border-bottom: 1px dashed var(--beige);">
            <div>
              <strong>${i.product_name_snapshot}</strong> (${i.product_code_snapshot})<br>
              <span style="color: var(--text-muted);">${i.number_of_sets} Sets (${i.sarees_per_set_snapshot} Sarees/Set = <strong>${i.total_sarees} Sarees</strong>) @ ₹${i.price_per_set_snapshot.toLocaleString('en-IN')}/Set</span>
            </div>
            <div style="font-weight: 700; color: var(--maroon);">₹${i.total_price.toLocaleString('en-IN')}</div>
          </div>
        `;
      });
    }

    const statuses = ['Pending Confirmation', 'Confirmed', 'Processing', 'Dispatched', 'Delivered', 'Cancelled'];
    let statusOptions = '';
    statuses.forEach(function(st) {
      statusOptions += `<option value="${st}" ${o.order_status === st ? 'selected' : ''}>${st}</option>`;
    });

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid var(--beige); padding-bottom: 12px; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
        <div>
          <span style="font-size: 1.15rem; font-weight: 800; color: var(--maroon);">${o.order_number}</span>
          <span style="font-size: 0.8rem; color: var(--text-muted); margin-left: 8px;">${new Date(o.created_at).toLocaleString('en-IN')}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <label style="font-size: 0.82rem; font-weight: 700;">Order Status:</label>
          <select class="form-control js-change-status" style="width: auto; min-height: 40px; font-weight: 700;">
            ${statusOptions}
          </select>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr; gap: 16px; margin-bottom: 14px; @media(min-width: 640px){grid-template-columns: 1fr 1fr;}">
        <div style="font-size: 0.9rem;">
          <div style="font-weight: 700; color: var(--dark);">${o.customer_name}</div>
          <div style="color: var(--text-muted);">📱 ${o.mobile_number}</div>
          <div style="color: var(--text-muted); margin-top: 4px;">📍 ${o.delivery_address}, ${o.city}, ${o.state} - ${o.pincode}</div>
          ${o.customer_notes ? `<div style="background: #FEF3C7; padding: 6px 10px; border-radius: 4px; margin-top: 6px; font-size: 0.82rem;"><strong>Notes:</strong> ${o.customer_notes}</div>` : ''}
        </div>
        <div style="display: flex; flex-direction: column; justify-content: center; gap: 8px;">
          <a href="tel:${o.mobile_number}" class="btn btn-call btn-sm" style="align-self: flex-start;">
            📞 Call Customer (${o.mobile_number})
          </a>
          <a href="https://wa.me/91${o.mobile_number}?text=${encodeURIComponent('Namaste ' + o.customer_name + ', Regarding your Wholesale Order ' + o.order_number + ' at Sunil Kumar Jayantilal...')}" target="_blank" class="btn btn-whatsapp btn-sm" style="align-self: flex-start;">
            💬 WhatsApp Customer
          </a>
        </div>
      </div>

      <div style="background: var(--cream-soft); padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--beige);">
        <div style="font-weight: 700; font-size: 0.85rem; color: var(--maroon); margin-bottom: 6px;">ORDER SETS & SAREES:</div>
        ${itemsHtml}
        <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 1.1rem; color: var(--maroon); padding-top: 8px; margin-top: 6px;">
          <span>Total Sets: ${o.items.reduce((s,i) => s + i.number_of_sets, 0)} (${totalSareesCount} Sarees)</span>
          <span>Grand Total: ₹${o.grand_total.toLocaleString('en-IN')}</span>
        </div>
      </div>
    `;

    card.querySelector('.js-change-status').addEventListener('change', function(e) {
      const newStatus = e.target.value;
      API.updateOrderStatus(o.id, { order_status: newStatus }).then(function(res) {
        if (res.success) {
          showAdminToast('Order status updated to ' + newStatus + '. Inventory synced.', 'success');
          loadAdminOrders();
          loadAdminProducts();
          loadStats();
        }
      }).catch(function(err) {
        showAdminToast(err.message || 'Status update failed', 'error');
      });
    });

    container.appendChild(card);
  });
}

// Render Audit Logs
function renderAuditLogs() {
  const tbody = document.getElementById('admin-audit-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (adminState.auditLogs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px;">No audit records found.</td></tr>';
    return;
  }

  adminState.auditLogs.forEach(function(l) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${new Date(l.timestamp).toLocaleString('en-IN')}</td>
      <td><strong>${l.product_id}</strong></td>
      <td><span class="stock-status-pill ${l.sets_changed >= 0 ? 'stock-in' : 'stock-out'}">${l.change_type}</span></td>
      <td>${l.previous_stock}</td>
      <td style="font-weight: 700; color: ${l.sets_changed >= 0 ? 'var(--success)' : 'var(--danger)'};">
        ${l.sets_changed > 0 ? '+' + l.sets_changed : l.sets_changed}
      </td>
      <td><strong>${l.new_stock}</strong></td>
      <td>${l.reason || '-'}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Settings
function loadAdminSettings() {
  API.getSettings().then(function(res) {
    if (res.success && res.settings) {
      adminState.settings = res.settings;
      const s = res.settings;
      document.getElementById('set-shop-name').value = s.shop_name || '';
      document.getElementById('set-phone').value = s.phone_number || '';
      document.getElementById('set-whatsapp').value = s.whatsapp_number || '';
      document.getElementById('set-address').value = s.shop_address || '';
      document.getElementById('set-map-direct').value = s.map_direct_url || '';
      document.getElementById('set-map-embed').value = s.map_embed_url || '';
      document.getElementById('set-ann-hi').value = s.announcement_hi || '';
      document.getElementById('set-ann-en').value = s.announcement_en || '';
    }
  });
}

function saveSettings() {
  const payload = {
    shop_name: document.getElementById('set-shop-name').value.trim(),
    phone_number: document.getElementById('set-phone').value.trim(),
    whatsapp_number: document.getElementById('set-whatsapp').value.trim(),
    shop_address: document.getElementById('set-address').value.trim(),
    map_direct_url: document.getElementById('set-map-direct').value.trim(),
    map_embed_url: document.getElementById('set-map-embed').value.trim(),
    announcement_hi: document.getElementById('set-ann-hi').value.trim(),
    announcement_en: document.getElementById('set-ann-en').value.trim()
  };

  API.updateSettings(payload).then(function(res) {
    if (res.success) {
      showAdminToast('Shop settings saved successfully!', 'success');
      adminState.settings = res.settings;
    }
  }).catch(function(err) {
    showAdminToast(err.message || 'Failed to save settings', 'error');
  });
}

// 5-STEP WIZARD FUNCTIONS
function openAddWizard() {
  adminState.wizard.step = 1;
  adminState.wizard.mainImage = '/images/skj001-main.svg';
  
  // Default 6 colours according to PRD example
  const defaultSareesPerSet = 6;
  document.getElementById('wiz-sarees-per-set').value = defaultSareesPerSet;
  document.getElementById('wiz-price').value = 3000;
  document.getElementById('wiz-stock').value = 25;
  document.getElementById('wiz-code').value = 'SKJ' + String(adminState.products.length + 1).padStart(3, '0');

  adminState.wizard.colours = [
    { name_en: 'Red', name_hi: 'लाल', hex: '#DC2626', qty: 1, image: '/images/skj001-col-1.svg' },
    { name_en: 'Pink', name_hi: 'गुलाबी', hex: '#EC4899', qty: 1, image: '/images/skj001-col-2.svg' },
    { name_en: 'Blue', name_hi: 'नीला', hex: '#2563EB', qty: 1, image: '/images/skj001-col-3.svg' },
    { name_en: 'Green', name_hi: 'हरा', hex: '#16A34A', qty: 1, image: '/images/skj001-col-4.svg' },
    { name_en: 'Yellow', name_hi: 'पीला', hex: '#EAB308', qty: 1, image: '/images/skj001-col-5.svg' },
    { name_en: 'Purple', name_hi: 'बैंगनी', hex: '#9333EA', qty: 1, image: '/images/skj001-col-6.svg' }
  ];

  updateWizardStepView(1);
  document.getElementById('wizard-modal').classList.add('active');
}

function closeAddWizard() {
  document.getElementById('wizard-modal').classList.remove('active');
}

function wizardNext(targetStep) {
  // Validate step before advancing
  if (targetStep === 2) {
    const nameEn = document.getElementById('wiz-name-en').value.trim();
    const nameHi = document.getElementById('wiz-name-hi').value.trim();
    if (!nameEn || !nameHi) {
      showAdminToast('Please enter both English and Hindi product names', 'error');
      return;
    }
  }

  if (targetStep === 3) {
    const price = Number(document.getElementById('wiz-price').value);
    const count = Number(document.getElementById('wiz-sarees-per-set').value);
    if (!price || price <= 0) {
      showAdminToast('Please enter valid wholesale price per set', 'error');
      return;
    }
    if (!count || count <= 0) {
      showAdminToast('Please enter valid number of sarees in 1 set', 'error');
      return;
    }
    renderColoursManagerRows();
  }

  if (targetStep === 4) {
    // Validate that colour quantities sum equals declared sarees_per_set
    syncColoursFromInputs();
    const declaredCount = Number(document.getElementById('wiz-sarees-per-set').value);
    const sumQty = adminState.wizard.colours.reduce(function(s, c) { return s + Number(c.qty || 1); }, 0);
    if (sumQty !== declaredCount) {
      showAdminToast('Colour quantities sum (' + sumQty + ') must equal declared set count (' + declaredCount + ' sarees)', 'error');
      return;
    }
    renderPhotoAssignmentCards();
  }

  if (targetStep === 5) {
    renderWizardPreview();
  }

  adminState.wizard.step = targetStep;
  updateWizardStepView(targetStep);
}

function wizardPrev(targetStep) {
  adminState.wizard.step = targetStep;
  updateWizardStepView(targetStep);
}

function updateWizardStepView(step) {
  for (let i = 1; i <= 5; i++) {
    const panel = document.getElementById('panel-step-' + i);
    const node = document.getElementById('node-step-' + i);
    if (panel) panel.style.display = i === step ? 'block' : 'none';
    if (node) {
      if (i < step) {
        node.className = 'step-node completed';
      } else if (i === step) {
        node.className = 'step-node active';
      } else {
        node.className = 'step-node';
      }
    }
  }
}

// STEP 3: Dynamic Colour Management
function renderColoursManagerRows() {
  const container = document.getElementById('colours-rows-container');
  if (!container) return;
  container.innerHTML = '';

  adminState.wizard.colours.forEach(function(c, idx) {
    const row = document.createElement('div');
    row.className = 'colour-row-entry';
    row.innerHTML = `
      <div style="display: flex; gap: 8px;">
        <input type="text" class="form-control js-col-name-en" value="${c.name_en}" placeholder="Colour Name (EN)" style="min-height: 40px;">
        <input type="text" class="form-control js-col-name-hi" value="${c.name_hi}" placeholder="रंग का नाम (HI)" style="min-height: 40px;">
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <input type="color" class="js-col-hex" value="${c.hex}" style="width: 44px; height: 40px; padding: 2px; border: 1px solid var(--beige); border-radius: 4px; cursor: pointer;">
        <span style="font-size: 0.8rem; font-family: monospace;">${c.hex}</span>
      </div>
      <div>
        <label style="font-size: 0.75rem; color: var(--text-muted); display: block;">Quantity in Set:</label>
        <input type="number" class="form-control js-col-qty" value="${c.qty}" min="1" max="10" style="min-height: 40px;">
      </div>
      <div style="font-size: 0.8rem; color: var(--text-muted);">
        ${c.image ? '✓ Photo selected' : 'No photo yet'}
      </div>
      <div>
        <button type="button" class="btn btn-secondary btn-sm js-col-remove" style="color: var(--danger); padding: 6px 12px;">✕</button>
      </div>
    `;

    row.querySelector('.js-col-remove').addEventListener('click', function() {
      adminState.wizard.colours.splice(idx, 1);
      renderColoursManagerRows();
      checkColourSumValidation();
    });

    row.querySelector('.js-col-qty').addEventListener('input', checkColourSumValidation);
    row.querySelector('.js-col-hex').addEventListener('input', function(e) {
      c.hex = e.target.value;
      row.querySelector('span').textContent = e.target.value;
    });

    container.appendChild(row);
  });

  checkColourSumValidation();
}

function syncColoursFromInputs() {
  const rows = document.querySelectorAll('.colour-row-entry');
  adminState.wizard.colours = [];
  rows.forEach(function(row) {
    const nameEn = row.querySelector('.js-col-name-en').value.trim() || 'Colour';
    const nameHi = row.querySelector('.js-col-name-hi').value.trim() || nameEn;
    const hex = row.querySelector('.js-col-hex').value;
    const qty = Number(row.querySelector('.js-col-qty').value || 1);
    adminState.wizard.colours.push({
      name_en: nameEn,
      name_hi: nameHi,
      hex: hex,
      qty: qty,
      image: '/images/skj001-col-1.svg'
    });
  });
}

function checkColourSumValidation() {
  const declaredCount = Number(document.getElementById('wiz-sarees-per-set').value || 6);
  let total = 0;
  document.querySelectorAll('.js-col-qty').forEach(function(inp) {
    total += Number(inp.value || 0);
  });

  const banner = document.getElementById('colour-sum-alert');
  if (total === declaredCount) {
    banner.style.background = '#DCFCE7';
    banner.style.color = '#166534';
    banner.style.border = '1px solid #4ADE80';
    banner.innerHTML = `✓ Perfect Match: All colour quantities sum to <strong>${total} Sarees</strong> (Matches Declared Set Count: ${declaredCount} Sarees)`;
  } else {
    banner.style.background = '#FEF2F2';
    banner.style.color = '#991B1B';
    banner.style.border = '1px solid #F87171';
    banner.innerHTML = `⚠️ Attention: Current colour sum is <strong>${total} Sarees</strong>, but 1 Set declared as <strong>${declaredCount} Sarees</strong>. Total must match!`;
  }
}

function addAnotherColourRow() {
  const idx = adminState.wizard.colours.length + 1;
  adminState.wizard.colours.push({
    name_en: 'Colour ' + idx,
    name_hi: 'रंग ' + idx,
    hex: '#802B43',
    qty: 1,
    image: '/images/skj001-col-1.svg'
  });
  renderColoursManagerRows();
}

// STEP 4: Photo Assignment
function renderPhotoAssignmentCards() {
  const container = document.getElementById('colour-photos-assign-container');
  if (!container) return;
  container.innerHTML = '<h4 style="color: var(--maroon); margin-bottom: 12px;">Colour-wise Saree Photographs:</h4>';

  const grid = document.createElement('div');
  grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px;';

  adminState.wizard.colours.forEach(function(c, idx) {
    const card = document.createElement('div');
    card.style.cssText = 'background: var(--cream-soft); border: 1.5px solid var(--beige); border-radius: 8px; padding: 12px; text-align: center;';
    
    card.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; gap: 6px; margin-bottom: 8px;">
        <span style="width: 16px; height: 16px; border-radius: 50%; background: ${c.hex}; display: inline-block;"></span>
        <strong>${c.name_hi} (${c.name_en})</strong>
      </div>
      <div style="width: 100%; aspect-ratio: 4/5; background: var(--white); border-radius: 6px; overflow: hidden; margin-bottom: 8px; border: 1px solid var(--beige);">
        <img id="col-img-preview-${idx}" src="${c.image || '/images/skj001-col-1.svg'}" style="width: 100%; height: 100%; object-fit: cover;">
      </div>
      <input type="file" id="col-file-input-${idx}" accept="image/*" style="display: none;">
      <button type="button" class="btn btn-secondary btn-sm" style="width: 100%; font-size: 0.8rem;" onclick="document.getElementById('col-file-input-${idx}').click()">
        📷 Select Photo
      </button>
    `;

    card.querySelector('#col-file-input-' + idx).addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        compressAndUpload(file, 'col-' + idx, function(uploadedUrl) {
          c.image = uploadedUrl;
          document.getElementById('col-img-preview-' + idx).src = uploadedUrl;
          showAdminToast('Photo assigned to ' + c.name_en, 'success');
        });
      }
    });

    grid.appendChild(card);
  });

  container.appendChild(grid);
}

// Client-side image compression
function compressAndUpload(file, prefix, callback) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const maxDim = 1000;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);

      API.uploadPhoto(compressedBase64, prefix).then(function(res) {
        if (res.success && res.url) {
          callback(res.url);
        }
      }).catch(function(err) {
        console.error('Upload error:', err);
        showAdminToast('Upload failed. Using preview.', 'error');
        callback(compressedBase64);
      });
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// STEP 5: Live Preview
function renderWizardPreview() {
  const box = document.getElementById('wizard-live-preview-box');
  if (!box) return;

  const nameEn = document.getElementById('wiz-name-en').value.trim();
  const nameHi = document.getElementById('wiz-name-hi').value.trim();
  const code = (document.getElementById('wiz-code').value.trim() || 'SKJ999').toUpperCase();
  const price = Number(document.getElementById('wiz-price').value || 3000);
  const sareesPerSet = Number(document.getElementById('wiz-sarees-per-set').value || 6);
  const stock = Number(document.getElementById('wiz-stock').value || 25);
  const fabric = document.getElementById('wiz-fabric').value.trim() || 'Pure Georgette';
  const desc = document.getElementById('wiz-desc').value.trim();

  let colourBadges = '';
  adminState.wizard.colours.forEach(function(c) {
    colourBadges += `<span style="display:inline-flex; align-items:center; gap:4px; background:#fff; padding:3px 8px; border-radius:12px; font-size:0.8rem; border:1px solid var(--beige); margin:2px;">
      <span style="width:12px; height:12px; border-radius:50%; background:${c.hex}; display:inline-block;"></span>
      ${c.name_hi} (${c.qty})
    </span>`;
  });

  box.innerHTML = `
    <div style="background: var(--cream-soft); border: 2px solid var(--gold); border-radius: var(--radius-lg); padding: 20px; display: grid; grid-template-columns: 1fr; gap: 20px; @media(min-width:640px){grid-template-columns: 200px 1fr;}">
      <div style="aspect-ratio: 4/5; background: #fff; border-radius: 8px; overflow: hidden; border: 1px solid var(--beige);">
        <img src="${adminState.wizard.mainImage}" style="width: 100%; height: 100%; object-fit: cover;">
      </div>
      <div>
        <div style="display: flex; gap: 8px; margin-bottom: 6px;">
          <span class="stock-status-pill stock-in">${stock} Sets Available</span>
          <span style="font-weight: 700; color: var(--gold); font-size: 0.85rem;">SKU: ${code}</span>
        </div>
        <h3 style="color: var(--maroon); font-size: 1.3rem;">${nameHi}</h3>
        <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 10px;">${nameEn} • Fabric: ${fabric}</p>

        <div style="background: #fff; border: 1.5px solid var(--beige); border-radius: 6px; padding: 12px; margin-bottom: 12px;">
          <div style="font-size: 1.15rem; font-weight: 800; color: var(--maroon);">
            1 Set = ${sareesPerSet} Sarees • ₹${price.toLocaleString('en-IN')} / Set
          </div>
          <div style="margin-top: 8px;">
            <div style="font-size: 0.8rem; font-weight: 700; margin-bottom: 4px;">Colours in Set:</div>
            ${colourBadges}
          </div>
        </div>

        <p style="font-size: 0.85rem; color: var(--text-muted);">${desc || 'Standard wholesale set description'}</p>
      </div>
    </div>
  `;
}

// Publish Product to Server
function publishProduct() {
  const nameEn = document.getElementById('wiz-name-en').value.trim();
  const nameHi = document.getElementById('wiz-name-hi').value.trim();
  const code = (document.getElementById('wiz-code').value.trim() || '').toUpperCase();
  const cat = document.getElementById('wiz-category').value;
  const fabric = document.getElementById('wiz-fabric').value.trim();
  const design = document.getElementById('wiz-design').value.trim();
  const desc = document.getElementById('wiz-desc').value.trim();
  const price = Number(document.getElementById('wiz-price').value);
  const sareesPerSet = Number(document.getElementById('wiz-sarees-per-set').value);
  const stock = Number(document.getElementById('wiz-stock').value);
  const moq = Number(document.getElementById('wiz-moq').value || 1);

  const payload = {
    name_en: nameEn,
    name_hi: nameHi,
    product_code: code,
    category_id: cat,
    fabric_type: fabric,
    design_type: design,
    description_en: desc,
    description_hi: desc,
    price_per_set: price,
    sarees_per_set: sareesPerSet,
    available_sets: stock,
    minimum_order_sets: moq,
    main_image: adminState.wizard.mainImage,
    colours: adminState.wizard.colours.map(function(c) {
      return {
        colour_name_en: c.name_en,
        colour_name_hi: c.name_hi,
        hex_code: c.hex,
        quantity_in_set: c.qty,
        colour_image_url: c.image || adminState.wizard.mainImage
      };
    })
  };

  const publishBtn = document.getElementById('btn-publish-product');
  if (publishBtn) publishBtn.disabled = true;

  API.addProduct(payload).then(function(res) {
    if (res.success && res.product) {
      showAdminToast('✓ Product ' + res.product.product_code + ' published successfully!', 'success');
      closeAddWizard();
      loadAdminProducts();
      loadStats();
    }
  }).catch(function(err) {
    showAdminToast(err.message || 'Failed to publish product', 'error');
  }).then(function() {
    if (publishBtn) publishBtn.disabled = false;
  });
}

// Event Listeners Init
document.addEventListener('DOMContentLoaded', function() {
  checkAuth();

  // Login
  document.getElementById('btn-do-login').addEventListener('click', handleLogin);
  document.getElementById('login-password').addEventListener('keyup', function(e) {
    if (e.key === 'Enter') handleLogin();
  });

  // Logout
  document.getElementById('btn-admin-logout').addEventListener('click', handleLogout);

  // Tab switching
  document.querySelectorAll('.admin-tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const tab = btn.getAttribute('data-tab');
      document.querySelectorAll('.admin-tab-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');

      document.querySelectorAll('.tab-content').forEach(function(tc) { tc.style.display = 'none'; });
      const target = document.getElementById('tab-' + tab);
      if (target) target.style.display = 'block';
    });
  });

  // Refresh
  document.getElementById('btn-refresh-data').addEventListener('click', function() {
    loadAllAdminData();
    showAdminToast('Data refreshed', 'success');
  });

  // Search product
  document.getElementById('admin-product-search').addEventListener('input', renderAdminProductsTable);

  // Order status filter
  document.getElementById('order-status-filter').addEventListener('change', renderAdminOrders);

  // Wizard triggers
  document.getElementById('btn-open-add-wizard').addEventListener('click', openAddWizard);
  document.getElementById('wizard-close-btn').addEventListener('click', closeAddWizard);
  document.getElementById('btn-add-colour-row').addEventListener('click', addAnotherColourRow);
  document.getElementById('btn-publish-product').addEventListener('click', publishProduct);

  // Main photo picker in wizard
  document.getElementById('main-photo-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      compressAndUpload(file, 'main', function(url) {
        adminState.wizard.mainImage = url;
        const prev = document.getElementById('main-photo-preview');
        if (prev) {
          prev.innerHTML = `<img src="${url}" style="width: 100px; height: 125px; object-fit: cover; border-radius: 4px; border: 2px solid var(--gold);">`;
        }
        showAdminToast('Main photograph uploaded!', 'success');
      });
    }
  });

  // Quick stock modal
  document.getElementById('stock-modal-close-btn').addEventListener('click', closeQuickStockModal);
  document.getElementById('btn-save-quick-stock').addEventListener('click', saveQuickStock);

  // Settings
  document.getElementById('btn-save-settings').addEventListener('click', saveSettings);
});
