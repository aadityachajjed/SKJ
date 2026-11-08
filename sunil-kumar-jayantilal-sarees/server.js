const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'data', 'db.json');
const PUBLIC_DIR = path.join(__dirname, 'public');
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// In-memory active sessions: token -> { user, expiresAt }
const sessions = new Map();

// Helper: Read DB
function readDb() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read db.json:', err);
    throw err;
  }
}

// Helper: Atomic Write DB
function writeDb(data) {
  const tmpFile = DB_FILE + '.tmp.' + Date.now();
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmpFile, DB_FILE);
}

// Helper: Hash password
function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 1000, 32, 'sha256').toString('hex');
}

// MIME types dictionary
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon'
};

// Parse JSON request body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 50 * 1024 * 1024) { // 50MB limit
        req.connection.destroy();
        reject(new Error('Request payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        resolve({ raw: body });
      }
    });
    req.on('error', reject);
  });
}

// Send JSON response
function sendJson(res, statusCode, data) {
  const payload = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  });
  res.end(payload);
}

// Authentication check middleware
function getAuthenticatedAdmin(req) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }
  return session.user;
}

// Format WhatsApp wholesale order message
function buildWhatsAppMessage(order, items, shopSettings) {
  const shopPhone = shopSettings.whatsapp_number || '9425191176';
  const lines = [];
  lines.push('*WHLESALE SAREE ORDER INQUIRY*');
  lines.push('*Shop:* Sunil Kumar Jayantilal');
  lines.push('*Order No:* ' + order.order_number);
  lines.push('*Date:* ' + new Date(order.created_at).toLocaleDateString('en-IN'));
  lines.push('---------------------------------');
  lines.push('*Customer Details:*');
  lines.push('Name: ' + order.customer_name);
  lines.push('Mobile: ' + order.mobile_number);
  lines.push('Address: ' + order.delivery_address + ', ' + order.city + ', ' + order.state + ' - ' + order.pincode);
  if (order.customer_notes) {
    lines.push('Notes: ' + order.customer_notes);
  }
  lines.push('---------------------------------');
  lines.push('*Order Items (Complete Sets):*');
  
  let grandTotalSarees = 0;
  items.forEach((item, index) => {
    grandTotalSarees += item.total_sarees;
    lines.push((index + 1) + '. *' + item.product_name_snapshot + '* (' + item.product_code_snapshot + ')');
    lines.push('   • Sets Ordered: ' + item.number_of_sets + ' Set(s)');
    lines.push('   • Sarees/Set: ' + item.sarees_per_set_snapshot + ' Sarees');
    lines.push('   • Total Sarees: ' + item.total_sarees + ' Sarees');
    lines.push('   • Rate: ₹' + item.price_per_set_snapshot.toLocaleString('en-IN') + '/Set');
    lines.push('   • Subtotal: ₹' + item.total_price.toLocaleString('en-IN'));
  });
  lines.push('---------------------------------');
  lines.push('*Total Sets:* ' + items.reduce((s, i) => s + i.number_of_sets, 0) + ' Sets');
  lines.push('*Total Sarees:* ' + grandTotalSarees + ' Sarees');
  lines.push('*Grand Total:* ₹' + order.grand_total.toLocaleString('en-IN'));
  lines.push('---------------------------------');
  lines.push('Kindly confirm order availability and dispatch details. Thank you!');

  const text = lines.join('\n');
  const encoded = encodeURIComponent(text);
  return {
    text: text,
    url: 'https://wa.me/91' + shopPhone + '?text=' + encoded
  };
}

// Main HTTP request router
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
    });
    return res.end();
  }

  // --- API ROUTES ---
  if (pathname.startsWith('/api/')) {
    // 1. Settings
    if (pathname === '/api/settings') {
      const db = readDb();
      if (method === 'GET') {
        return sendJson(res, 200, { success: true, settings: db.business_settings });
      }
      if (method === 'PUT') {
        const user = getAuthenticatedAdmin(req);
        if (!user) return sendJson(res, 401, { error: 'Unauthorized admin access' });
        return parseBody(req).then(body => {
          db.business_settings = Object.assign({}, db.business_settings, body, {
            updated_at: new Date().toISOString()
          });
          writeDb(db);
          return sendJson(res, 200, { success: true, settings: db.business_settings });
        });
      }
    }

    // 2. Categories
    if (pathname === '/api/categories') {
      const db = readDb();
      if (method === 'GET') {
        const cats = db.categories.filter(c => c.is_active !== false);
        return sendJson(res, 200, { success: true, categories: cats });
      }
      if (method === 'POST') {
        const user = getAuthenticatedAdmin(req);
        if (!user) return sendJson(res, 401, { error: 'Unauthorized admin access' });
        return parseBody(req).then(body => {
          if (!body.category_name_en) return sendJson(res, 400, { error: 'Category name required' });
          const newCat = {
            id: 'cat-' + Date.now(),
            category_name_en: body.category_name_en,
            category_name_hi: body.category_name_hi || body.category_name_en,
            description_en: body.description_en || '',
            description_hi: body.description_hi || '',
            image_url: body.image_url || '/images/skj001-main.svg',
            is_active: true
          };
          db.categories.push(newCat);
          writeDb(db);
          return sendJson(res, 201, { success: true, category: newCat });
        });
      }
    }

    // 3. Products
    if (pathname === '/api/products') {
      const db = readDb();
      if (method === 'GET') {
        const query = parsedUrl.query;
        const search = (query.search || '').trim().toLowerCase();
        const category = (query.category || '').trim();
        const fabric = (query.fabric || '').trim();
        const inStockOnly = query.inStock === 'true';

        let list = db.products.filter(p => p.is_active !== false);

        if (category && category !== 'all') {
          list = list.filter(p => p.category_id === category);
        }
        if (fabric) {
          list = list.filter(p => p.fabric_type && p.fabric_type.toLowerCase().includes(fabric.toLowerCase()));
        }
        if (inStockOnly) {
          list = list.filter(p => p.available_sets > 0);
        }
        if (search) {
          list = list.filter(p => 
            (p.name_en && p.name_en.toLowerCase().includes(search)) ||
            (p.name_hi && p.name_hi.toLowerCase().includes(search)) ||
            (p.product_code && p.product_code.toLowerCase().includes(search)) ||
            (p.fabric_type && p.fabric_type.toLowerCase().includes(search)) ||
            (p.design_type && p.design_type.toLowerCase().includes(search))
          );
        }

        const enriched = list.map(p => {
          const colours = db.product_colours.filter(c => c.product_id === p.id);
          const cat = db.categories.find(c => c.id === p.category_id);
          return Object.assign({}, p, {
            colours_count: colours.length,
            colours_summary: colours.map(c => ({
              name_en: c.colour_name_en,
              name_hi: c.colour_name_hi,
              hex: c.hex_code,
              qty: c.quantity_in_set
            })),
            category_name_en: cat ? cat.category_name_en : '',
            category_name_hi: cat ? cat.category_name_hi : ''
          });
        });

        return sendJson(res, 200, { success: true, products: enriched, total: enriched.length });
      }

      if (method === 'POST') {
        const user = getAuthenticatedAdmin(req);
        if (!user) return sendJson(res, 401, { error: 'Unauthorized admin access' });

        return parseBody(req).then(body => {
          if (!body.name_en || !body.price_per_set || !body.sarees_per_set) {
            return sendJson(res, 400, { error: 'Missing mandatory fields (name, price_per_set, sarees_per_set)' });
          }

          const pricePerSet = Number(body.price_per_set);
          const sareesPerSet = Number(body.sarees_per_set);
          const availableSets = Number(body.available_sets || 0);
          const minOrder = Number(body.minimum_order_sets || 1);

          if (isNaN(pricePerSet) || pricePerSet <= 0) return sendJson(res, 400, { error: 'Invalid price per set' });
          if (isNaN(sareesPerSet) || sareesPerSet <= 0) return sendJson(res, 400, { error: 'Invalid sarees per set' });

          let productCode = (body.product_code || '').trim().toUpperCase();
          if (!productCode) {
            const count = db.products.length + 1;
            productCode = 'SKJ' + String(count).padStart(3, '0');
          }

          const existingCode = db.products.find(p => p.product_code.toUpperCase() === productCode);
          if (existingCode) {
            return sendJson(res, 400, { error: 'Product code "' + productCode + '" already exists.' });
          }

          const productId = 'prod-' + Date.now();
          const coloursInput = Array.isArray(body.colours) ? body.colours : [];
          
          let totalColourQty = 0;
          coloursInput.forEach(c => {
            totalColourQty += Number(c.quantity_in_set || 1);
          });

          if (coloursInput.length > 0 && totalColourQty !== sareesPerSet) {
            return sendJson(res, 400, { 
              error: 'Colour quantities sum (' + totalColourQty + ') must match set quantity (' + sareesPerSet + ' sarees).' 
            });
          }

          const mainImage = body.main_image || (coloursInput[0] && coloursInput[0].colour_image_url) || '/images/skj001-main.svg';

          const newProduct = {
            id: productId,
            product_code: productCode,
            name_en: body.name_en.trim(),
            name_hi: (body.name_hi || body.name_en).trim(),
            description_en: body.description_en || '',
            description_hi: body.description_hi || '',
            category_id: body.category_id || (db.categories[0] ? db.categories[0].id : 'cat-printed'),
            fabric_type: body.fabric_type || 'Georgette Silk',
            design_type: body.design_type || 'Printed',
            price_per_set: pricePerSet,
            sarees_per_set: sareesPerSet,
            available_sets: availableSets,
            minimum_order_sets: minOrder,
            is_active: body.is_active !== false,
            main_image: mainImage,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          db.products.unshift(newProduct);

          db.product_images.push({
            id: 'img-' + productCode + '-main-' + Date.now(),
            product_id: productId,
            colour_id: null,
            image_url: mainImage,
            image_type: 'main',
            display_order: 1,
            created_at: newProduct.created_at
          });

          coloursInput.forEach((c, idx) => {
            const colourId = 'col-' + productCode + '-' + (idx + 1) + '-' + Date.now();
            const colImg = c.colour_image_url || mainImage;
            db.product_colours.push({
              id: colourId,
              product_id: productId,
              colour_name_en: c.colour_name_en || ('Colour ' + (idx + 1)),
              colour_name_hi: c.colour_name_hi || c.colour_name_en || ('रंग ' + (idx + 1)),
              hex_code: c.hex_code || '#641E32',
              quantity_in_set: Number(c.quantity_in_set || 1),
              colour_image_url: colImg,
              display_order: idx + 1
            });

            db.product_images.push({
              id: 'img-' + productCode + '-col-' + (idx + 1) + '-' + Date.now(),
              product_id: productId,
              colour_id: colourId,
              image_url: colImg,
              image_type: 'colour',
              display_order: idx + 2,
              created_at: newProduct.created_at
            });
          });

          db.stock_audit_log.unshift({
            id: 'audit-' + Date.now(),
            product_id: productId,
            change_type: 'initial',
            previous_stock: 0,
            new_stock: availableSets,
            sets_changed: availableSets,
            reason: 'New product creation by admin',
            timestamp: newProduct.created_at
          });

          writeDb(db);
          return sendJson(res, 201, { success: true, product: newProduct });
        });
      }
    }

    // Single Product details: /api/products/:id
    const productDetailMatch = pathname.match(/^\/api\/products\/([a-zA-Z0-9_-]+)$/);
    if (productDetailMatch) {
      const pId = productDetailMatch[1];
      const db = readDb();
      const productIndex = db.products.findIndex(p => p.id === pId || p.product_code === pId);
      if (productIndex === -1) return sendJson(res, 404, { error: 'Product not found' });
      const product = db.products[productIndex];

      if (method === 'GET') {
        const colours = db.product_colours.filter(c => c.product_id === product.id).sort((a,b) => a.display_order - b.display_order);
        const images = db.product_images.filter(i => i.product_id === product.id).sort((a,b) => a.display_order - b.display_order);
        const category = db.categories.find(c => c.id === product.category_id);

        return sendJson(res, 200, {
          success: true,
          product: Object.assign({}, product, {
            colours: colours,
            images: images,
            category: category
          })
        });
      }

      if (method === 'PUT') {
        const user = getAuthenticatedAdmin(req);
        if (!user) return sendJson(res, 401, { error: 'Unauthorized admin access' });

        return parseBody(req).then(body => {
          const updated = Object.assign({}, product, {
            name_en: body.name_en !== undefined ? body.name_en : product.name_en,
            name_hi: body.name_hi !== undefined ? body.name_hi : product.name_hi,
            description_en: body.description_en !== undefined ? body.description_en : product.description_en,
            description_hi: body.description_hi !== undefined ? body.description_hi : product.description_hi,
            category_id: body.category_id !== undefined ? body.category_id : product.category_id,
            fabric_type: body.fabric_type !== undefined ? body.fabric_type : product.fabric_type,
            design_type: body.design_type !== undefined ? body.design_type : product.design_type,
            price_per_set: body.price_per_set !== undefined ? Number(body.price_per_set) : product.price_per_set,
            sarees_per_set: body.sarees_per_set !== undefined ? Number(body.sarees_per_set) : product.sarees_per_set,
            minimum_order_sets: body.minimum_order_sets !== undefined ? Number(body.minimum_order_sets) : product.minimum_order_sets,
            main_image: body.main_image || product.main_image,
            is_active: body.is_active !== undefined ? body.is_active : product.is_active,
            updated_at: new Date().toISOString()
          });

          if (body.available_sets !== undefined && Number(body.available_sets) !== product.available_sets) {
            const oldStock = product.available_sets;
            const newStock = Math.max(0, Number(body.available_sets));
            updated.available_sets = newStock;

            db.stock_audit_log.unshift({
              id: 'audit-' + Date.now(),
              product_id: product.id,
              change_type: newStock > oldStock ? 'manual_add' : 'manual_reduce',
              previous_stock: oldStock,
              new_stock: newStock,
              sets_changed: newStock - oldStock,
              reason: 'Admin updated stock from product editor',
              timestamp: new Date().toISOString()
            });
          }

          if (Array.isArray(body.colours)) {
            db.product_colours = db.product_colours.filter(c => c.product_id !== product.id);
            db.product_images = db.product_images.filter(i => i.product_id !== product.id || i.image_type === 'main');

            body.colours.forEach((c, idx) => {
              const colourId = 'col-' + product.product_code + '-' + (idx + 1) + '-' + Date.now();
              const colImg = c.colour_image_url || updated.main_image;
              db.product_colours.push({
                id: colourId,
                product_id: product.id,
                colour_name_en: c.colour_name_en || ('Colour ' + (idx + 1)),
                colour_name_hi: c.colour_name_hi || c.colour_name_en || ('रंग ' + (idx + 1)),
                hex_code: c.hex_code || '#641E32',
                quantity_in_set: Number(c.quantity_in_set || 1),
                colour_image_url: colImg,
                display_order: idx + 1
              });

              db.product_images.push({
                id: 'img-' + product.product_code + '-col-' + (idx + 1) + '-' + Date.now(),
                product_id: product.id,
                colour_id: colourId,
                image_url: colImg,
                image_type: 'colour',
                display_order: idx + 2,
                created_at: new Date().toISOString()
              });
            });
          }

          db.products[productIndex] = updated;
          writeDb(db);
          return sendJson(res, 200, { success: true, product: updated });
        });
      }

      if (method === 'DELETE') {
        const user = getAuthenticatedAdmin(req);
        if (!user) return sendJson(res, 401, { error: 'Unauthorized admin access' });

        db.products[productIndex].is_active = false;
        db.products[productIndex].updated_at = new Date().toISOString();
        
        db.stock_audit_log.unshift({
          id: 'audit-' + Date.now(),
          product_id: product.id,
          change_type: 'manual_reduce',
          previous_stock: product.available_sets,
          new_stock: 0,
          sets_changed: -product.available_sets,
          reason: 'Product archived / hidden by admin',
          timestamp: new Date().toISOString()
        });

        writeDb(db);
        return sendJson(res, 200, { success: true, message: 'Product archived successfully' });
      }
    }

    // Quick Stock update: PATCH /api/products/:id/stock
    const stockMatch = pathname.match(/^\/api\/products\/([a-zA-Z0-9_-]+)\/stock$/);
    if (stockMatch && method === 'PATCH') {
      const user = getAuthenticatedAdmin(req);
      if (!user) return sendJson(res, 401, { error: 'Unauthorized admin access' });
      const pId = stockMatch[1];
      const db = readDb();
      const p = db.products.find(item => item.id === pId || item.product_code === pId);
      if (!p) return sendJson(res, 404, { error: 'Product not found' });

      return parseBody(req).then(body => {
        const adjustment = Number(body.adjustment || 0);
        const newExactStock = body.exactStock !== undefined ? Number(body.exactStock) : null;

        const oldStock = p.available_sets;
        let finalStock = oldStock;

        if (newExactStock !== null) {
          finalStock = Math.max(0, newExactStock);
        } else {
          finalStock = Math.max(0, oldStock + adjustment);
        }

        p.available_sets = finalStock;
        p.updated_at = new Date().toISOString();

        db.stock_audit_log.unshift({
          id: 'audit-' + Date.now(),
          product_id: p.id,
          change_type: finalStock > oldStock ? 'manual_add' : 'manual_reduce',
          previous_stock: oldStock,
          new_stock: finalStock,
          sets_changed: finalStock - oldStock,
          reason: body.reason || 'Admin quick stock update',
          timestamp: new Date().toISOString()
        });

        writeDb(db);
        return sendJson(res, 200, { success: true, product_id: p.id, available_sets: finalStock });
      });
    }

    // 4. Orders
    if (pathname === '/api/orders') {
      const db = readDb();
      if (method === 'GET') {
        const user = getAuthenticatedAdmin(req);
        if (!user) return sendJson(res, 401, { error: 'Unauthorized admin access' });

        const ordersWithItems = db.orders.map(ord => {
          const items = db.order_items.filter(i => i.order_id === ord.id);
          return Object.assign({}, ord, { items: items });
        }).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        return sendJson(res, 200, { success: true, orders: ordersWithItems });
      }

      if (method === 'POST') {
        return parseBody(req).then(body => {
          const customerName = (body.customer_name || '').trim();
          const mobile = (body.mobile_number || '').replace(/[^0-9]/g, '');
          const address = (body.delivery_address || '').trim();
          const city = (body.city || '').trim();
          const state = (body.state || '').trim();
          const pincode = (body.pincode || '').trim();
          const notes = (body.customer_notes || '').trim();
          const cartItems = Array.isArray(body.items) ? body.items : [];

          if (!customerName) return sendJson(res, 400, { error: 'Customer name is required' });
          if (!mobile || mobile.length < 10) return sendJson(res, 400, { error: 'Valid 10-digit mobile number is required' });
          if (!address) return sendJson(res, 400, { error: 'Delivery address is required' });
          if (cartItems.length === 0) return sendJson(res, 400, { error: 'Your cart is empty. Please add wholesale saree sets to order.' });

          const orderId = 'ord-' + Date.now();
          const orderNumber = 'SKJ-' + new Date().getFullYear() + '-' + String(db.orders.length + 1001);

          let subtotal = 0;
          const validatedItems = [];

          for (let i = 0; i < cartItems.length; i++) {
            const item = cartItems[i];
            const product = db.products.find(p => p.id === item.product_id || p.product_code === item.product_code);
            if (!product) {
              return sendJson(res, 400, { error: 'Product not found: ' + (item.product_name || item.product_id) });
            }
            if (!product.is_active) {
              return sendJson(res, 400, { error: 'Product "' + product.name_en + '" is currently not available.' });
            }

            const setsOrdered = Number(item.number_of_sets || 1);
            if (setsOrdered <= 0) {
              return sendJson(res, 400, { error: 'Invalid number of sets for ' + product.name_en });
            }
            if (product.minimum_order_sets && setsOrdered < product.minimum_order_sets) {
              return sendJson(res, 400, { error: 'Minimum order for ' + product.name_en + ' is ' + product.minimum_order_sets + ' set(s).' });
            }
            if (setsOrdered > product.available_sets) {
              return sendJson(res, 400, { 
                error: 'Only ' + product.available_sets + ' set(s) available for "' + product.name_en + '". Cannot order ' + setsOrdered + ' sets.' 
              });
            }

            const totalSarees = product.sarees_per_set * setsOrdered;
            const totalPrice = product.price_per_set * setsOrdered;
            subtotal += totalPrice;

            validatedItems.push({
              id: 'item-' + Date.now() + '-' + Math.floor(Math.random()*1000),
              order_id: orderId,
              product_id: product.id,
              product_code_snapshot: product.product_code,
              product_name_snapshot: product.name_en,
              price_per_set_snapshot: product.price_per_set,
              sarees_per_set_snapshot: product.sarees_per_set,
              number_of_sets: setsOrdered,
              total_sarees: totalSarees,
              total_price: totalPrice
            });
          }

          const grandTotal = subtotal;

          const newOrder = {
            id: orderId,
            order_number: orderNumber,
            customer_name: customerName,
            mobile_number: mobile,
            delivery_address: address,
            city: city,
            state: state,
            pincode: pincode,
            subtotal: subtotal,
            delivery_charge: 0,
            grand_total: grandTotal,
            order_status: 'Pending Confirmation',
            payment_status: 'To be Confirmed with Shop',
            customer_notes: notes,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          db.orders.unshift(newOrder);
          db.order_items.push.apply(db.order_items, validatedItems);

          const existingCust = db.customers.find(c => c.mobile_number === mobile);
          if (!existingCust) {
            db.customers.push({
              id: 'cust-' + Date.now(),
              full_name: customerName,
              mobile_number: mobile,
              delivery_address: address,
              city: city,
              state: state,
              pincode: pincode,
              created_at: newOrder.created_at
            });
          }

          writeDb(db);

          const whatsapp = buildWhatsAppMessage(newOrder, validatedItems, db.business_settings);

          return sendJson(res, 201, {
            success: true,
            order: newOrder,
            items: validatedItems,
            whatsapp: whatsapp,
            message: 'Your order request has been received. The shop will contact you for confirmation.'
          });
        });
      }
    }

    // Customer Lookup order: GET /api/orders/lookup/:query
    const lookupMatch = pathname.match(/^\/api\/orders\/lookup\/([a-zA-Z0-9_-]+)$/);
    if (lookupMatch && method === 'GET') {
      const query = lookupMatch[1].trim();
      const db = readDb();
      const matchedOrders = db.orders.filter(o => 
        o.order_number.toLowerCase() === query.toLowerCase() ||
        o.mobile_number.indexOf(query) !== -1
      );

      const enriched = matchedOrders.map(ord => {
        const items = db.order_items.filter(i => i.order_id === ord.id);
        return Object.assign({}, ord, { items: items });
      });

      return sendJson(res, 200, { success: true, orders: enriched });
    }

    // Order status update: PATCH /api/orders/:id/status
    const orderStatusMatch = pathname.match(/^\/api\/orders\/([a-zA-Z0-9_-]+)\/status$/);
    if (orderStatusMatch && method === 'PATCH') {
      const user = getAuthenticatedAdmin(req);
      if (!user) return sendJson(res, 401, { error: 'Unauthorized admin access' });

      const ordId = orderStatusMatch[1];
      const db = readDb();
      const ord = db.orders.find(o => o.id === ordId || o.order_number === ordId);
      if (!ord) return sendJson(res, 404, { error: 'Order not found' });

      return parseBody(req).then(body => {
        const newStatus = (body.order_status || '').trim();
        const newPaymentStatus = (body.payment_status || '').trim();

        const prevStatus = ord.order_status;
        const items = db.order_items.filter(i => i.order_id === ord.id);

        if (newStatus === 'Confirmed' && prevStatus !== 'Confirmed') {
          items.forEach(item => {
            const product = db.products.find(p => p.id === item.product_id);
            if (product) {
              const oldStock = product.available_sets;
              const newStock = Math.max(0, oldStock - item.number_of_sets);
              product.available_sets = newStock;
              product.updated_at = new Date().toISOString();

              db.stock_audit_log.unshift({
                id: 'audit-' + Date.now() + '-' + Math.floor(Math.random()*100),
                product_id: product.id,
                change_type: 'order_confirmed',
                previous_stock: oldStock,
                new_stock: newStock,
                sets_changed: -item.number_of_sets,
                reason: 'Stock deducted on confirming Order ' + ord.order_number,
                timestamp: new Date().toISOString()
              });
            }
          });
        } else if (newStatus === 'Cancelled' && prevStatus === 'Confirmed') {
          items.forEach(item => {
            const product = db.products.find(p => p.id === item.product_id);
            if (product) {
              const oldStock = product.available_sets;
              const newStock = oldStock + item.number_of_sets;
              product.available_sets = newStock;
              product.updated_at = new Date().toISOString();

              db.stock_audit_log.unshift({
                id: 'audit-' + Date.now() + '-' + Math.floor(Math.random()*100),
                product_id: product.id,
                change_type: 'order_cancelled',
                previous_stock: oldStock,
                new_stock: newStock,
                sets_changed: item.number_of_sets,
                reason: 'Stock restored on cancelling Order ' + ord.order_number,
                timestamp: new Date().toISOString()
              });
            }
          });
        }

        if (newStatus) ord.order_status = newStatus;
        if (newPaymentStatus) ord.payment_status = newPaymentStatus;
        ord.updated_at = new Date().toISOString();

        writeDb(db);
        return sendJson(res, 200, { success: true, order: ord });
      });
    }

    // 5. Authentication
    if (pathname === '/api/auth/login' && method === 'POST') {
      return parseBody(req).then(body => {
        const username = (body.username || body.email || '').trim().toLowerCase();
        const password = body.password || '';

        const db = readDb();
        const admin = db.admin_users.find(u => 
          (u.username && u.username.toLowerCase() === username) || 
          (u.email && u.email.toLowerCase() === username)
        );

        if (!admin || !admin.is_active) {
          return sendJson(res, 401, { error: 'Invalid username or password' });
        }

        const calculatedHash = hashPassword(password, admin.salt);
        if (calculatedHash !== admin.password_hash) {
          return sendJson(res, 401, { error: 'Invalid username or password' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const sessionData = {
          user: {
            id: admin.id,
            full_name: admin.full_name,
            username: admin.username,
            email: admin.email,
            role: admin.role
          },
          expiresAt: Date.now() + 24 * 60 * 60 * 1000
        };
        sessions.set(token, sessionData);

        return sendJson(res, 200, {
          success: true,
          token: token,
          user: sessionData.user,
          expires_in: 86400
        });
      });
    }

    if (pathname === '/api/auth/logout' && method === 'POST') {
      const authHeader = req.headers['authorization'] || '';
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      if (token) sessions.delete(token);
      return sendJson(res, 200, { success: true, message: 'Logged out successfully' });
    }

    if (pathname === '/api/auth/me' && method === 'GET') {
      const user = getAuthenticatedAdmin(req);
      if (!user) return sendJson(res, 401, { error: 'Not authenticated' });
      return sendJson(res, 200, { success: true, user: user });
    }

    // 6. Photo Upload
    if (pathname === '/api/upload' && method === 'POST') {
      const user = getAuthenticatedAdmin(req);
      if (!user) return sendJson(res, 401, { error: 'Unauthorized admin access' });

      return parseBody(req).then(body => {
        if (!body.image) {
          return sendJson(res, 400, { error: 'No image data provided' });
        }

        const matches = body.image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        let buffer;
        let ext = '.jpg';

        if (matches && matches.length === 3) {
          const mime = matches[1];
          if (mime.indexOf('png') !== -1) ext = '.png';
          else if (mime.indexOf('svg') !== -1) ext = '.svg';
          else if (mime.indexOf('webp') !== -1) ext = '.webp';
          buffer = Buffer.from(matches[2], 'base64');
        } else {
          buffer = Buffer.from(body.image, 'base64');
        }

        const safePrefix = (body.prefix || 'upload').replace(/[^a-zA-Z0-9_-]/g, '');
        const filename = safePrefix + '-' + Date.now() + '-' + Math.floor(Math.random()*1000) + ext;
        const filePath = path.join(UPLOADS_DIR, filename);

        fs.writeFileSync(filePath, buffer);

        const fileUrl = '/uploads/' + filename;
        return sendJson(res, 201, {
          success: true,
          url: fileUrl,
          filename: filename
        });
      });
    }

    // 7. Dashboard Stats
    if (pathname === '/api/stats' && method === 'GET') {
      const user = getAuthenticatedAdmin(req);
      if (!user) return sendJson(res, 401, { error: 'Unauthorized admin access' });

      const db = readDb();
      const activeProducts = db.products.filter(p => p.is_active !== false);
      const totalSets = activeProducts.reduce((sum, p) => sum + p.available_sets, 0);
      const outOfStock = activeProducts.filter(p => p.available_sets === 0).length;
      const pendingOrders = db.orders.filter(o => o.order_status === 'Pending Confirmation').length;
      const confirmedOrders = db.orders.filter(o => o.order_status === 'Confirmed').length;

      return sendJson(res, 200, {
        success: true,
        stats: {
          total_products: activeProducts.length,
          total_available_sets: totalSets,
          out_of_stock_products: outOfStock,
          pending_orders: pendingOrders,
          confirmed_orders: confirmedOrders,
          total_orders: db.orders.length
        },
        recent_audit: db.stock_audit_log.slice(0, 10)
      });
    }

    return sendJson(res, 404, { error: 'API route not found' });
  }

  // --- STATIC FILE SERVING ---
  const filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

  if (filePath.indexOf(PUBLIC_DIR) !== 0) {
    res.writeHead(403);
    return res.end('Access denied');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      if (pathname === '/admin' || pathname === '/admin/') {
        const adminPath = path.join(PUBLIC_DIR, 'admin.html');
        return fs.readFile(adminPath, (aErr, data) => {
          if (aErr) {
            res.writeHead(404);
            return res.end('Not found');
          }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(data);
        });
      }

      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end('<h1>404 - Page Not Found</h1><p><a href="/">Return to Sunil Kumar Jayantilal Sarees</a></p>');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log('Sunil Kumar Jayantilal Wholesale Saree Server running at http://localhost:' + PORT);
});
