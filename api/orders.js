// ===================================
// /api/orders — Order Management
// ===================================
// POST (public)  → create order (after payment verification)
// GET  (public)  → get single order by ID (receipt)
// PUT  (admin)   → update order status/scanned

import axios from 'axios';
import { getDb } from './lib/firebase-admin.js';
import { withMiddleware, requireAdmin } from './lib/middleware.js';
import { validateOrder, clean } from './lib/validators.js';

async function handler(req, res) {

    // ---- Create order (after payment) ----
    if (req.method === 'POST') {
        const errors = validateOrder(req.body);
        if (errors.length) {
            return res.status(400).json({ error: errors.join(', ') });
        }

        try {
            // Verify payment with Flutterwave
            const flwRes = await axios.get(
                `https://api.flutterwave.com/v3/transactions/${req.body.paymentRef}/verify`,
                { headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` } }
            );

            const tx = flwRes.data;
            if (tx.status !== 'success' || tx.data.status !== 'successful' || tx.data.amount < req.body.total) {
                return res.status(400).json({ error: 'Payment verification failed' });
            }

            const doc = {
                customer: {
                    name: clean(req.body.customer.name, 100),
                    email: req.body.customer.email,
                    phone: clean(req.body.customer.phone || '', 20),
                },
                items: req.body.items.map(item => ({
                    id: item.id,
                    name: clean(item.name, 200),
                    price: Number(item.price),
                    image_url: item.image_url || '',
                    description: clean(item.description || '', 500),
                })),
                total: Number(req.body.total),
                paymentRef: req.body.paymentRef,
                flwRef: req.body.flwRef || '',
                date: new Date().toISOString(),
                status: 'Paid',
                scanned: false,
            };

            const ref = await getDb().collection('orders').add(doc);
            return res.status(201).json({ id: ref.id, ...doc });
        } catch (err) {
            console.error('[orders] POST error:', err.message);
            return res.status(500).json({ error: 'Failed to create order' });
        }
    }

    // ---- Get order by ID (public receipt) ----
    if (req.method === 'GET') {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'Order ID required' });

        try {
            // Check orders first
            const orderDoc = await getDb().collection('orders').doc(id).get();
            if (orderDoc.exists) {
                return res.status(200).json({ type: 'order', id: orderDoc.id, ...orderDoc.data() });
            }

            // Check layaways
            const layDoc = await getDb().collection('layaways').doc(id).get();
            if (layDoc.exists) {
                return res.status(200).json({ type: 'layaway', id: layDoc.id, ...layDoc.data() });
            }

            return res.status(404).json({ error: 'Order not found' });
        } catch (err) {
            console.error('[orders] GET error:', err.message);
            return res.status(500).json({ error: 'Failed to fetch order' });
        }
    }

    // ---- ADMIN: Update order ----
    if (req.method === 'PUT') {
        if (!requireAdmin(req, res)) return;

        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'Missing id' });

        const { scanned, status } = req.body;
        const update = {};
        if (scanned !== undefined) update.scanned = Boolean(scanned);
        if (status) update.status = clean(status, 50);

        if (Object.keys(update).length === 0) {
            return res.status(400).json({ error: 'Nothing to update' });
        }

        try {
            // Try orders first
            const orderDoc = await getDb().collection('orders').doc(id).get();
            if (orderDoc.exists) {
                await getDb().collection('orders').doc(id).update(update);
                return res.status(200).json({ success: true });
            }

            // Try layaways
            const layDoc = await getDb().collection('layaways').doc(id).get();
            if (layDoc.exists) {
                await getDb().collection('layaways').doc(id).update(update);
                return res.status(200).json({ success: true });
            }

            return res.status(404).json({ error: 'Order not found' });
        } catch (err) {
            console.error('[orders] PUT error:', err.message);
            return res.status(500).json({ error: 'Failed to update order' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

export default withMiddleware(handler);
