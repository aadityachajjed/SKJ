// Sunil Kumar Jayantilal - API Client Service

const API = {
  baseUrl: '',

  getAuthToken: function() {
    return localStorage.getItem('skj_admin_token') || '';
  },

  setAuthToken: function(token) {
    if (token) {
      localStorage.setItem('skj_admin_token', token);
    } else {
      localStorage.removeItem('skj_admin_token');
    }
  },

  request: function(endpoint, options) {
    options = options || {};
    const headers = options.headers || {};
    headers['Content-Type'] = 'application/json';

    const token = API.getAuthToken();
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }
    options.headers = headers;

    return fetch(endpoint, options).then(function(res) {
      return res.json().then(function(data) {
        if (!res.ok) {
          const err = new Error(data.error || 'Server error (' + res.status + ')');
          err.status = res.status;
          err.data = data;
          throw err;
        }
        return data;
      });
    });
  },

  getSettings: function() {
    return API.request('/api/settings');
  },

  updateSettings: function(settings) {
    return API.request('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  },

  getCategories: function() {
    return API.request('/api/categories');
  },

  addCategory: function(cat) {
    return API.request('/api/categories', {
      method: 'POST',
      body: JSON.stringify(cat)
    });
  },

  getProducts: function(params) {
    let query = '';
    if (params) {
      const parts = [];
      Object.keys(params).forEach(function(k) {
        if (params[k] !== undefined && params[k] !== null && params[k] !== '') {
          parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(params[k]));
        }
      });
      if (parts.length > 0) query = '?' + parts.join('&');
    }
    return API.request('/api/products' + query);
  },

  getProduct: function(id) {
    return API.request('/api/products/' + id);
  },

  addProduct: function(product) {
    return API.request('/api/products', {
      method: 'POST',
      body: JSON.stringify(product)
    });
  },

  updateProduct: function(id, product) {
    return API.request('/api/products/' + id, {
      method: 'PUT',
      body: JSON.stringify(product)
    });
  },

  updateStock: function(id, data) {
    return API.request('/api/products/' + id + '/stock', {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  deleteProduct: function(id) {
    return API.request('/api/products/' + id, {
      method: 'DELETE'
    });
  },

  submitOrder: function(orderData) {
    return API.request('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  },

  lookupOrders: function(query) {
    return API.request('/api/orders/lookup/' + encodeURIComponent(query));
  },

  getOrders: function() {
    return API.request('/api/orders');
  },

  updateOrderStatus: function(id, data) {
    return API.request('/api/orders/' + id + '/status', {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  login: function(username, password) {
    return API.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: username, password: password })
    }).then(function(res) {
      if (res.token) {
        API.setAuthToken(res.token);
      }
      return res;
    });
  },

  logout: function() {
    return API.request('/api/auth/logout', { method: 'POST' }).then(function(res) {
      API.setAuthToken(null);
      return res;
    }).catch(function() {
      API.setAuthToken(null);
    });
  },

  getMe: function() {
    return API.request('/api/auth/me');
  },

  getStats: function() {
    return API.request('/api/stats');
  },

  uploadPhoto: function(base64Image, prefix) {
    return API.request('/api/upload', {
      method: 'POST',
      body: JSON.stringify({ image: base64Image, prefix: prefix || 'saree' })
    });
  }
};
