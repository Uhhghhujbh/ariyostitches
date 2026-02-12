import axios from 'axios';
import { auth } from '../firebase-config';

const api = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
});

api.interceptors.request.use(async (config) => {
    try {
        const user = auth.currentUser;
        if (user) {
            const token = await user.getIdToken();
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch {
        // no token — public request
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const message = error.response?.data?.error || error.message || 'Something went wrong';
        return Promise.reject(new Error(message));
    }
);

export const ApiService = {
    getProducts: () => api.get('/products'),
    addProduct: (data) => api.post('/products', data),
    deleteProduct: (id) => api.delete(`/products?id=${id}`),

    createOrder: (data) => api.post('/orders', data),
    getOrder: (id) => api.get(`/orders?id=${id}`),
    verifyOrder: (id) => api.get(`/orders?id=${id}`),
    updateOrderStatus: (id, status, scanned) => api.put(`/orders?id=${id}`, { status, scanned }),

    sendMessage: (data) => api.post('/messages', data),
    getMessages: () => api.get('/messages'),
    markMessageRead: (id) => api.put(`/messages?id=${id}`),
    deleteMessage: (id) => api.delete(`/messages?id=${id}`),

    getLayaways: (phone, email) => api.get(`/layaways?phone=${phone || ''}&email=${email || ''}`),
    getLayawayById: (id) => api.get(`/layaways?id=${id}`),
    createLayaway: (data) => api.post('/layaways', data),
    recordPayment: (id, data) => api.put(`/layaways?id=${id}`, data),

    verifyPayment: (txId) => api.post('/verify-payment', { transaction_id: txId }),
};

export default api;
