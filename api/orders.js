import { withMiddleware } from './lib/middleware.js';
import { getDb } from './lib/firebase-admin.js';
import { validateOrder } from './lib/validators.js';

export default withMiddleware(async (req, res) => {
    const db = getDb();

    if (req.method === 'POST') {
        const errors = validateOrder(req.body);
        if (errors.length) return res.status(400).json({ error: errors.join(', ') });

        const { customer, items, total, paymentRef, address, deliveryMethod } = req.body;

        const txResponse = await fetch(
            `https://api.flutterwave.com/v3/transactions/${paymentRef}/verify`,
            { headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` } }
        );
        const txData = await txResponse.json();

        if (txData.status !== 'success' || txData.data?.status !== 'successful') {
            return res.status(400).json({ error: 'Payment verification failed' });
        }

        const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

        await db.collection('orders').doc(orderId).set({
            orderId,
            customer,
            items,
            total: Number(total),
            paymentRef: String(paymentRef),
            paymentStatus: 'verified',
            address: address || null,
            deliveryMethod: deliveryMethod || 'pickup',
            status: 'confirmed',
            scanned: false,
            createdAt: Date.now(),
        });

        return res.status(201).json({ success: true, orderId });
    }

    if (req.method === 'GET') {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'Order ID required' });

        const doc = await db.collection('orders').doc(id).get();
        if (!doc.exists) return res.status(404).json({ error: 'Order not found' });

        return res.status(200).json({ id: doc.id, ...doc.data() });
    }

    if (req.method === 'PUT') {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'Order ID required' });

        const update = {};
        if (req.body.status) update.status = req.body.status;
        if (req.body.scanned !== undefined) update.scanned = Boolean(req.body.scanned);
        if (Object.keys(update).length === 0) return res.status(400).json({ error: 'Nothing to update' });

        await db.collection('orders').doc(id).update(update);
        return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
});
