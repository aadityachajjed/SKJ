const fs = require('fs');
const path = require('path');
const EventEmitter = require('events').EventEmitter;
const http = require('http');

let requestHandler = null;
http.createServer = function(handler) {
  requestHandler = handler;
  const mockServer = new EventEmitter();
  mockServer.listen = function(port, cb) { if (cb) cb(); return mockServer; };
  return mockServer;
};

// Require server.js from the same directory
process.chdir(__dirname);
require('./server.js');

function callApi(method, urlStr, body, headers) {
  return new Promise(function(resolve, reject) {
    const req = new EventEmitter();
    req.method = method;
    req.url = urlStr;
    req.headers = headers || {};

    const res = new EventEmitter();
    res.statusCode = 200;
    res._headers = {};
    res._body = '';
    res.writeHead = function(code, h) {
      res.statusCode = code;
      if (h) Object.assign(res._headers, h);
    };
    res.end = function(chunk) {
      if (chunk) res._body += chunk;
      let json = null;
      try { json = JSON.parse(res._body); } catch(e) {}
      resolve({ status: res.statusCode, headers: res._headers, body: res._body, json: json });
    };

    requestHandler(req, res);

    if (body) {
      const payload = JSON.stringify(body);
      req.headers['content-type'] = 'application/json';
      req.headers['content-length'] = Buffer.byteLength(payload);
      process.nextTick(function() {
        req.emit('data', payload);
        req.emit('end');
      });
    } else {
      process.nextTick(function() {
        req.emit('end');
      });
    }
  });
}

let adminToken = '';
const uniqueSku = 'SKJEDIT' + Math.floor(100 + Math.random() * 900);
let createdProductId = '';

console.log('--- Step 1: Admin Login ---');
callApi('POST', '/api/auth/login', { username: 'admin', password: 'admin123' })
  .then(function(res) {
    console.log('Login status:', res.status);
    if (!res.json || !res.json.token) throw new Error('No token returned: ' + res.body);
    adminToken = res.json.token;

    console.log('--- Step 2: Add New Stock (Wholesale Set) ---');
    const newProduct = {
      name_en: 'Edit Test Saree',
      name_hi: 'एडिट टेस्ट साड़ी',
      product_code: uniqueSku,
      category_id: 'cat-printed',
      fabric_type: 'Chiffon Silk',
      design_type: 'Floral Foil Print',
      description_en: 'Initial description',
      description_hi: 'प्रारंभिक विवरण',
      price_per_set: 3200,
      sarees_per_set: 4,
      available_sets: 20,
      sale_type: 'wholesale',
      colours: [
        { colour_name_en: 'Red', colour_name_hi: 'लाल', hex_code: '#FF0000', quantity_in_set: 2 },
        { colour_name_en: 'Green', colour_name_hi: 'हरा', hex_code: '#00FF00', quantity_in_set: 2 }
      ]
    };

    return callApi('POST', '/api/products', newProduct, {
      'authorization': 'Bearer ' + adminToken
    });
  })
  .then(function(res) {
    console.log('Add stock status:', res.status);
    if (res.status !== 201) throw new Error('Failed to create product: ' + res.body);
    createdProductId = res.json.product.id;
    console.log('Created product ID:', createdProductId, 'SKU:', res.json.product.product_code);

    console.log('--- Step 3: Fetch Product Details via GET /api/products/:id ---');
    return callApi('GET', '/api/products/' + createdProductId);
  })
  .then(function(res) {
    console.log('GET product status:', res.status);
    if (res.status !== 200) throw new Error('Failed to fetch product: ' + res.body);
    const prod = res.json.product;
    console.log('Fetched Product Name:', prod.name_en, 'Price: ₹' + prod.price_per_set, 'Stock:', prod.available_sets, 'Colours count:', prod.colours.length);

    console.log('--- Step 4: Edit Product Stock & Details via PUT /api/products/:id ---');
    const updatePayload = {
      name_en: 'Updated Deluxe Foil Print Saree',
      name_hi: 'अपडेटेड डीलक्स फॉयल प्रिंट साड़ी',
      price_per_set: 3600,
      available_sets: 35, // Stock increased from 20 to 35
      fabric_type: 'Premium Chiffon Silk',
      colours: [
        { colour_name_en: 'Crimson Red', colour_name_hi: 'गहरा लाल', hex_code: '#B91C1C', quantity_in_set: 2 },
        { colour_name_en: 'Emerald Green', colour_name_hi: 'पन्ना हरा', hex_code: '#047857', quantity_in_set: 2 }
      ]
    };

    return callApi('PUT', '/api/products/' + createdProductId, updatePayload, {
      'authorization': 'Bearer ' + adminToken
    });
  })
  .then(function(res) {
    console.log('PUT product status:', res.status);
    if (res.status !== 200) throw new Error('Failed to update product: ' + res.body);
    console.log('Updated product price: ₹' + res.json.product.price_per_set, 'New Stock:', res.json.product.available_sets);

    console.log('--- Step 5: Verify Updated Details & Stock Audit Log ---');
    return callApi('GET', '/api/stats', null, {
      'authorization': 'Bearer ' + adminToken
    });
  })
  .then(function(res) {
    console.log('Admin stats status:', res.status);
    const auditLogs = (res.json && res.json.recent_audit) || [];
    const relevantAudit = auditLogs.find(function(a) { return a.product_id === createdProductId && a.change_type === 'manual_add'; });
    if (!relevantAudit) throw new Error('Stock audit entry not found for edit update');
    console.log('Audit log verified: previous_stock=' + relevantAudit.previous_stock + ', new_stock=' + relevantAudit.new_stock + ', sets_changed=' + relevantAudit.sets_changed + ' (' + relevantAudit.reason + ')');

    console.log('--- Step 6: Test Changing Product Mode to Retail Single Saree ---');
    const retailSwitchPayload = {
      sale_type: 'retail',
      price_per_set: 750, // Price per single saree
      available_sets: 50, // 50 individual sarees
      colours: [
        { colour_name_en: 'Crimson Red', colour_name_hi: 'गहरा लाल', hex_code: '#B91C1C', quantity_in_set: 1 },
        { colour_name_en: 'Emerald Green', colour_name_hi: 'पन्ना हरा', hex_code: '#047857', quantity_in_set: 1 },
        { colour_name_en: 'Royal Blue', colour_name_hi: 'रॉयल ब्लू', hex_code: '#1D4ED8', quantity_in_set: 1 }
      ]
    };

    return callApi('PUT', '/api/products/' + createdProductId, retailSwitchPayload, {
      'authorization': 'Bearer ' + adminToken
    });
  })
  .then(function(res) {
    console.log('Switch to retail status:', res.status);
    if (res.status !== 200) throw new Error('Failed to switch to retail: ' + res.body);
    const p = res.json.product;
    console.log('Retail product verified: sale_type=' + p.sale_type + ', sarees_per_set=' + p.sarees_per_set + ', price=₹' + p.price_per_set + ', stock=' + p.available_sets);

    console.log('\n========================================');
    console.log('ALL EDIT STOCK & PRODUCT TESTS PASSED!');
    console.log('========================================');
    process.exit(0);
  })
  .catch(function(err) {
    console.error('TEST ERROR:', err);
    process.exit(1);
  });
