// ===================================
// Frontend API Service Layer
// ===================================
// All API calls go through this single file.
// Axios interceptor auto-attaches Firebase auth token.

import axios from 'axios';
import { auth } from '../firebase-config';

const api = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000, // 15 second timeout
});

// Auto-attach Firebase ID token to every request
api.interceptors.request.use(async (config) => {
    try {
        const user = auth.currentUser;
        if (user) {
            const token = await user.getIdToken();
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch {
        // No token — public request
    }
    return config;
});

// Normalize error responses
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const message = error.response?.data?.error || error.message || 'Something went wrong';
        return Promise.reject(new Error(message));
    }
);

// ---- API Methods ----
export const ApiService = {
    // Products
    getProducts: () => api.get('/products'),
    addProduct: (data) => api.post('/products', data),
    deleteProduct: (id) => api.delete(`/products?id=${id}`),

    // Orders
    createOrder: (data) => api.post('/orders', data),
    getOrder: (id) => api.get(`/orders?id=${id}`),
    verifyOrder: (id) => api.get(`/orders?id=${id}`),
    updateOrderStatus: (id, status, scanned) => api.put(`/orders?id=${id}`, { status, scanned }),

    // Messages (contact form)
    sendMessage: (data) => api.post('/messages', data),
    getMessages: () => api.get('/messages'),
    markMessageRead: (id) => api.put(`/messages?id=${id}`),
    deleteMessage: (id) => api.delete(`/messages?id=${id}`),

    // Layaways
    getLayaways: (phone, email) => api.get(`/layaways?phone=${phone || ''}&email=${email || ''}`),
    getLayawayById: (id) => api.get(`/layaways?id=${id}`),
    createLayaway: (data) => api.post('/layaways', data),
    recordPayment: (id, data) => api.put(`/layaways?id=${id}`, data),

    // Payment verification
    verifyPayment: (txId) => api.post('/verify-payment', { transaction_id: txId }),
};

export default api;
