
import axios from 'axios';
import { auth } from '../firebase-config'; // Keep auth for token retrieval

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor to add Firebase ID Token
api.interceptors.request.use(async (config) => {
    try {
        const user = auth.currentUser;
        if (user) {
            const token = await user.getIdToken();
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (error) {
        console.error('Error fetching token', error);
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// API Methods
export const ApiService = {
    // Products
    getProducts: () => api.get('/products'),
    addProduct: (productData) => api.post('/products', productData),

    // Orders
    createOrder: (orderData) => api.post('/orders', orderData),
    getOrder: (id) => api.get(`/orders?id=${id}`),
    verifyOrder: (id) => api.get(`/orders?id=${id}`),
    updateOrderStatus: (id, status, scanned) => api.put(`/orders?id=${id}`, { status, scanned }),

    // Messages
    sendMessage: (msgData) => api.post('/messages', msgData),
    getMessages: () => api.get('/messages'),
    markMessageRead: (id) => api.put(`/messages?id=${id}`), // mapped to handler
    deleteMessage: (id) => api.delete(`/messages?id=${id}`),

    // Layaways
    getLayaways: (phone, email) => api.get(`/layaways?phone=${phone || ''}&email=${email || ''}`),
    getLayawayById: (id) => api.get(`/layaways?id=${id}`),
    createLayaway: (data) => api.post('/layaways', data),
    recordPayment: (id, paymentData) => api.put(`/layaways?id=${id}`, paymentData),

    // Uploads
    uploadFile: (formData) => api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    })
};

export default api;
