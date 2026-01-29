
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
    addProduct: (productData) => api.post('/admin/products', productData),

    // Orders
    createOrder: (orderData) => api.post('/orders', orderData),
    getOrder: (id) => api.get(`/orders?id=${id}`),
    verifyOrder: (id) => api.get(`/admin/orders?id=${id}`), // The endpoint now handles filtering manually or we can change this call to use getOrder but verifyOrder was admin intended. Actually api/orders handles id fetch publicly now so this verify call can just use the same logic or calling /orders?id=xxx via admin page still works because the endpoint is the same. Wait, admin verify uses the same GET logic now.
    updateOrderStatus: (id, status, scanned) => api.put(`/admin/orders?id=${id}`, { status, scanned }),

    // Messages
    sendMessage: (msgData) => api.post('/messages', msgData),
    getMessages: () => api.get('/admin/messages'), // Renamed endpoint in my mind, but api/messages.js handles GET with admin check
    markMessageRead: (id) => api.put(`/messages?id=${id}`), // mapped to handler
    deleteMessage: (id) => api.delete(`/messages?id=${id}`),

    // Layaways
    getLayaways: (phone, email) => api.get(`/layaways?phone=${phone || ''}&email=${email || ''}`),
    getLayawayById: (id) => api.get(`/layaways?id=${id}`),
    createLayaway: (data) => api.post('/layaways', data),
    recordPayment: (id, paymentData) => api.put(`/layaways?id=${id}`, paymentData)
};

export default api;
