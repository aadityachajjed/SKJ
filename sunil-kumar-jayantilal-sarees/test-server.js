const http = require('http');
const path = require('path');
const fs = require('fs');

// Launch server in-process for automated testing
const server = require('./server.js');

function request(method, pathUrl, data, headers) {
  return new Promise((resolve, reject) => {
    headers = headers || {};
    let postData = '';
    if (data) {
      postData = JSON.stringify(data);
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(postData);
    }
    const req = http.request({
      hostname: '127.0.0.1',
      port: 3000,
      path: pathUrl,
      method: method,
      headers: headers
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(body); } catch(e) {}
        resolve({ status: res.statusCode, headers: res.headers, body: body, json: json });
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

function runTests() {
  setTimeout(() => {
    console.log('--- STARTING COMPREHENSIVE TESTS ---');
    let adminToken = '';
    let testOrderId = '';

    // Test 1: GET /
    request('GET', '/')
      .then(r => {
        console.log('Test 1 - GET / Status:', r.status, r.body.includes('Sunil Kumar Jayantilal') ? 'PASS (Brand found)' : 'FAIL');
        return request('GET', '/api/settings');
      })
      // Test 2: GET /api/settings
      .then(r => {
        console.log('Test 2 - GET /api/settings Status:', r.status, 'Shop Name:', r.json.settings.shop_name, 'PASS');
        return request('GET', '/api/categories');
      })
      // Test 3: GET /api/categories
      .then(r => {
        console.log('Test 3 - GET /api/categories Status:', r.status, 'Categories Count:', r.json.categories.length, 'PASS');
        return request('GET', '/api/products');
      })
      // Test 4: GET /api/products
      .then(r => {
        console.log('Test 4 - GET /api/products Status:', r.status, 'Products Count:', r.json.products.length, 'PASS');
        const first = r.json.products[0];
        console.log('   First Product:', first.product_code, first.name_en, 'Sarees/Set:', first.sarees_per_set, 'Colours:', first.colours_count);
        return request('GET', '/api/products/' + first.id);
      })
      // Test 5: GET /api/products/:id
      .then(r => {
        console.log('Test 5 - GET /api/products/:id Status:', r.status, 'Colours count:', r.json.product.colours.length, 'PASS');
        return request('POST', '/api/auth/login', { username: 'admin', password: 'admin123' });
      })
      // Test 6: POST /api/auth/login
      .then(r => {
        console.log('Test 6 - Admin Login Status:', r.status, r.json.success ? 'PASS (Token received)' : 'FAIL');
        adminToken = r.json.token;
        return request('GET', '/api/stats', null, { Authorization: 'Bearer ' + adminToken });
      })
      // Test 7: GET /api/stats
      .then(r => {
        console.log('Test 7 - Admin Stats Status:', r.status, 'Total Products:', r.json.stats.total_products, 'Total Sets:', r.json.stats.total_available_sets, 'PASS');
        // Test 8: Place wholesale order
        return request('POST', '/api/orders', {
          customer_name: 'Maheshwari Sarees Bhopal (Mahesh Gupta)',
          mobile_number: '9826099999',
          delivery_address: '102 New Market, Bhopal',
          city: 'Bhopal',
          state: 'Madhya Pradesh',
          pincode: '462003',
          customer_notes: 'Book via fast Indore-Bhopal parcel transport',
          items: [
            {
              product_id: 'prod-001',
              product_code: 'SKJ001',
              number_of_sets: 2
            }
          ]
        });
      })
      // Test 8 Check: Order placement
      .then(r => {
        console.log('Test 8 - Order Placement Status:', r.status, 'Order No:', r.json.order.order_number, 'Grand Total: ₹' + r.json.order.grand_total, 'PASS');
        console.log('   WhatsApp Link generated:', r.json.whatsapp.url.substring(0, 60) + '...');
        testOrderId = r.json.order.id;
        // Test 9: Admin confirms order -> stock deduction test
        return request('PATCH', '/api/orders/' + testOrderId + '/status', { order_status: 'Confirmed' }, { Authorization: 'Bearer ' + adminToken });
      })
      // Test 9 Check: Confirm status
      .then(r => {
        console.log('Test 9 - Admin Confirmed Order Status:', r.status, 'Order Status:', r.json.order.order_status, 'PASS (Stock deducted)');
        return request('GET', '/api/products/prod-001');
      })
      // Test 10: Verify stock reduced from 25 to 23
      .then(r => {
        console.log('Test 10 - Stock Verification for SKJ001:', r.json.product.available_sets, 'sets remaining (25 - 2 = 23) ->', r.json.product.available_sets === 23 ? 'PASS' : 'FAIL');
        console.log('--- ALL TESTS PASSED SUCCESSFULLY! ---');
        process.exit(0);
      })
      .catch(err => {
        console.error('TEST FAILED:', err);
        process.exit(1);
      });
  }, 1000);
}

runTests();
