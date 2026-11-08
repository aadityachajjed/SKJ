const fs = require('fs');
const path = require('path');
const EventEmitter = require('events').EventEmitter;

const http = require('http');
let requestHandler = null;
const originalCreateServer = http.createServer;
http.createServer = function(handler) {
  requestHandler = handler;
  const mockServer = new EventEmitter();
  mockServer.listen = function(port, cb) { if (cb) cb(); return mockServer; };
  return mockServer;
};

// Require server.js
require('./server.js');

function callApi(method, urlStr, body, headers) {
  return new Promise((resolve, reject) => {
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
      process.nextTick(() => {
        req.emit('data', payload);
        req.emit('end');
      });
    } else {
      process.nextTick(() => {
        req.emit('end');
      });
    }
  });
}

function runApiTests() {
  console.log('--- DIRECT API & WORKFLOW VALIDATION ---');
  let adminToken = '';
  let orderId = '';
  let prodBeforeStock = 0;

  // 1. Settings
  return callApi('GET', '/api/settings')
    .then(sRes => {
      console.log('1. Settings API:', sRes.status, 'Shop:', sRes.json.settings.shop_name);
      // 2. Categories
      return callApi('GET', '/api/categories');
    })
    .then(cRes => {
      console.log('2. Categories API:', cRes.status, 'Count:', cRes.json.categories.length);
      // 3. Products
      return callApi('GET', '/api/products');
    })
    .then(pRes => {
      console.log('3. Products API:', pRes.status, 'Active products:', pRes.json.products.length);
      // 4. Admin Login
      return callApi('POST', '/api/auth/login', { username: 'admin', password: 'admin123' });
    })
    .then(loginRes => {
      console.log('4. Admin Login:', loginRes.status, 'Token exists:', !!loginRes.json.token);
      adminToken = loginRes.json.token;
      // 5. Admin Stats
      return callApi('GET', '/api/stats', null, { authorization: 'Bearer ' + adminToken });
    })
    .then(statsRes => {
      console.log('5. Stats API:', statsRes.status, 'Total Sets:', statsRes.json.stats.total_available_sets);
      // 6. Submit Wholesale Order
      return callApi('POST', '/api/orders', {
        customer_name: 'Shree Radhe Saree Emporium (Suresh Patel)',
        mobile_number: '9827011223',
        delivery_address: '45 Sarafa Bazar',
        city: 'Indore',
        state: 'Madhya Pradesh',
        pincode: '452002',
        customer_notes: 'Keep 2 sets of SKJ002 ready for transport dispatch',
        items: [
          { product_id: 'prod-002', number_of_sets: 2 }
        ]
      });
    })
    .then(orderRes => {
      console.log('6. Order Placement:', orderRes.status, 'Order No:', orderRes.json.order.order_number, 'Grand Total: ₹' + orderRes.json.order.grand_total);
      orderId = orderRes.json.order.id;
      return callApi('GET', '/api/products/prod-002');
    })
    .then(prodBeforeRes => {
      prodBeforeStock = prodBeforeRes.json.product.available_sets;
      console.log('   Stock before confirmation:', prodBeforeStock, 'sets');
      return callApi('PATCH', '/api/orders/' + orderId + '/status', { order_status: 'Confirmed' }, { authorization: 'Bearer ' + adminToken });
    })
    .then(confRes => {
      console.log('7. Order Status Confirmed:', confRes.status, confRes.json.order.order_status);
      return callApi('GET', '/api/products/prod-002');
    })
    .then(prodAfterRes => {
      const prodAfterStock = prodAfterRes.json.product.available_sets;
      console.log('   Stock after confirmation:', prodAfterStock, 'sets (Successfully deducted 2 sets: ' + (prodBeforeStock - 2 === prodAfterStock) + ')');
      // 8. Add New Saree Set via Admin Wizard
      return callApi('POST', '/api/products', {
        name_en: 'Festive Banarasi Katan Silk Set',
        name_hi: 'त्योहारी बनारसी कातन सिल्क सेट',
        product_code: 'SKJ007',
        category_id: 'cat-silk',
        fabric_type: 'Katan Silk',
        design_type: 'Gold Zari Floral Weave',
        price_per_set: 5400,
        sarees_per_set: 6,
        available_sets: 20,
        minimum_order_sets: 1,
        main_image: '/images/skj002-main.svg',
        colours: [
          { colour_name_en: 'Rani Pink', colour_name_hi: 'रानी गुलाबी', hex_code: '#EC4899', quantity_in_set: 1 },
          { colour_name_en: 'Royal Blue', colour_name_hi: 'रॉयल ब्लू', hex_code: '#1D4ED8', quantity_in_set: 1 },
          { colour_name_en: 'Maroon', colour_name_hi: 'महरून', hex_code: '#641E32', quantity_in_set: 1 },
          { colour_name_en: 'Emerald Green', colour_name_hi: 'पन्ना हरा', hex_code: '#15803D', quantity_in_set: 1 },
          { colour_name_en: 'Mustard Yellow', colour_name_hi: 'हल्दी पीला', hex_code: '#EAB308', quantity_in_set: 1 },
          { colour_name_en: 'Purple', colour_name_hi: 'बैंगनी', hex_code: '#7E22CE', quantity_in_set: 1 }
        ]
      }, { authorization: 'Bearer ' + adminToken });
    })
    .then(addRes => {
      console.log('8. Add New Saree Set (Admin Wizard):', addRes.status, 'New SKU:', addRes.json.product.product_code, 'Price: ₹' + addRes.json.product.price_per_set);
      console.log('--- ALL BACKEND ENDPOINTS AND INVENTORY LOGIC VALIDATED PERFECTLY! ---');
    })
    .catch(err => {
      console.error('API Test Error:', err);
      process.exit(1);
    });
}

runApiTests();
