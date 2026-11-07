/**
 * API client with authentication and error handling
 */

const BASE_URL = '/api';

export function getToken() {
  return localStorage.getItem('manager_token') || '';
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('manager_token', token);
  } else {
    localStorage.removeItem('manager_token');
  }
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (res.status === 401 && !endpoint.includes('/auth/login')) {
        setToken(null);
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
      throw new Error(data.error || 'خطایی در ارتباط با سرور رخ داده است.');
    }

    return data;
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Auth
  login: (username, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getMe: () => request('/auth/me'),
  changePassword: (currentPassword, newPassword) => request('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),
  updateProfile: (profile) => request('/auth/profile', { method: 'POST', body: JSON.stringify(profile) }),

  // Raw Materials
  getMaterials: () => request('/materials'),
  createMaterial: (data) => request('/materials', { method: 'POST', body: JSON.stringify(data) }),
  updateMaterial: (id, data) => request(`/materials/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMaterial: (id) => request(`/materials/${id}`, { method: 'DELETE' }),

  // Intermediate Goods
  getIntermediates: () => request('/intermediates'),
  getIntermediate: (id) => request(`/intermediates/${id}`),
  createIntermediate: (data) => request('/intermediates', { method: 'POST', body: JSON.stringify(data) }),
  updateIntermediate: (id, data) => request(`/intermediates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteIntermediate: (id) => request(`/intermediates/${id}`, { method: 'DELETE' }),

  // Products
  getProducts: () => request('/products'),
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (data) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  updateProductMultiplier: (id, profitMultiplier) => request(`/products/${id}/multiplier`, { method: 'PATCH', body: JSON.stringify({ profitMultiplier }) }),

  // Units & Default Values
  getUnits: () => request('/units'),
  createCategory: (data) => request('/units/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id, data) => request(`/units/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id) => request(`/units/categories/${id}`, { method: 'DELETE' }),

  createPurchaseUnit: (data) => request('/units/purchase-units', { method: 'POST', body: JSON.stringify(data) }),
  updatePurchaseUnit: (id, data) => request(`/units/purchase-units/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePurchaseUnit: (id) => request(`/units/purchase-units/${id}`, { method: 'DELETE' }),

  createConversionChain: (data) => request('/units/chains', { method: 'POST', body: JSON.stringify(data) }),
  updateConversionChain: (id, data) => request(`/units/chains/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteConversionChain: (id) => request(`/units/chains/${id}`, { method: 'DELETE' }),

  createConversion: (data) => request('/units/conversions', { method: 'POST', body: JSON.stringify(data) }),
  deleteConversion: (id) => request(`/units/conversions/${id}`, { method: 'DELETE' }),

  // Data / Backup
  exportDataUrl: () => `${BASE_URL}/data/export`,
  importData: (data) => request('/data/import', { method: 'POST', body: JSON.stringify(data) }),
  resetData: () => request('/data/reset', { method: 'POST' }),
};
