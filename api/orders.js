import axios from 'axios';
import { getDb } from './lib/firebase-admin.js';
import { withMiddleware, requireAdmin } from './lib/middleware.js';
import { validateOrder, sanitizeString } from './lib/validators.js';

const handler = async (req, res) => {
    // POST /api/orders (Create Order)
    if (req.method === 'POST') {
        const data = req.body;
        const validationErrors = validateOrder(data);
        if (validationErrors.length > 0) {
            return res.status(400).json({ error: 'Validation failed', details: validationErrors });
        }

        // Verify Payment first
        try {
            const flwResponse = await axios.get(
                `https://api.flutterwave.com/v3/transactions/${data.paymentRef}/verify`,
                {
                    headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` }
                }
            );

            const { status, data: txData } = flwResponse.data;
            if (status !== 'success' || txData.status !== 'successful' || txData.amount < data.total) {
                return res.status(400).json({ error: 'Payment verification failed or amount mismatch' });
            }

            // Create Order
            const newOrder = {
                customer: {
                    name: sanitizeString(data.customer.name),
                    email: data.customer.email,
                    phone: sanitizeString(data.customer.phone)
                },
                items: data.items.map(item => ({
                    id: item.id,
                    name: sanitizeString(item.name),
                    price: Number(item.price),
                    image_url: item.image_url,
                    description: sanitizeString(item.description || '')
                })),
                total: Number(data.total),
                paymentRef: data.paymentRef,
                flwRef: data.flwRef,
                date: new Date().toISOString(),
                status: 'Paid',
                scanned: false
            };

            const docRef = await getDb().collection('orders').add(newOrder);
            return res.status(201).json({ id: docRef.id, ...newOrder });

        } catch (error) {
            console.error('Order Creation Error:', error);
            return res.status(500).json({ error: 'Failed to create order' });
        }
    }

    // GET /api/orders?id=:id (Public Receipt)
    if (req.method === 'GET') {
        const { id } = req.query;
        if (id) {
            try {
                const docRef = getDb().collection('orders').doc(id);
                const doc = await docRef.get();

                if (!doc.exists) {
                    // Check layaways if not found in orders
                    const layawayRef = getDb().collection('layaways').doc(id);
                    const layawayDoc = await layawayRef.get();
                    if (layawayDoc.exists) {
                        return res.status(200).json({ type: 'layaway', id: layawayDoc.id, ...layawayDoc.data() });
                    }
                    return res.status(404).json({ error: 'Order not found' });
                }

                return res.status(200).json({ type: 'order', id: doc.id, ...doc.data() });
            } catch (error) {
                return res.status(500).json({ error: 'Failed to fetch order' });
            }
        }
        // If no ID, continue to admin check (for listing all orders, if implemented later, or just fail)
    }

    // AUTH REQUIRED FOR ADMIN ACTIONS
    if (!requireAdmin(req, res)) return;

    // PUT /api/admin/orders/:id (Update Status/Scanned)
    if (req.method === 'PUT') {
        const { id } = req.query;
        const { scanned, status } = req.body;

        if (!id) return res.status(400).json({ error: 'Missing ID' });

        try {
            // Check order first
            const orderRef = getDb().collection('orders').doc(id);
            const orderDoc = await orderRef.get();

            if (orderDoc.exists) {
                await orderRef.update({ ...(scanned !== undefined && { scanned }), ...(status && { status }) });
                return res.status(200).json({ success: true });
            }

            // Check layaway
            const layawayRef = getDb().collection('layaways').doc(id);
            const layawayDoc = await layawayRef.get();
            if (layawayDoc.exists) {
                await layawayRef.update({ ...(scanned !== undefined && { scanned }) });
                return res.status(200).json({ success: true });
            }

            return res.status(404).json({ error: 'Order not found' });
        } catch (error) {
            return res.status(500).json({ error: 'Update failed' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
};

export default withMiddleware(handler);
