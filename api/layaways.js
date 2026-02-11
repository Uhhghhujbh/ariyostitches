// ===================================
// /api/layaways — Layaway Plan Management
// ===================================
// GET  (public) → lookup by phone/email/id
// POST (public) → create layaway
// PUT  (public) → record a payment

import { getDb } from './lib/firebase-admin.js';
import { withMiddleware } from './lib/middleware.js';
import { clean } from './lib/validators.js';

async function handler(req, res) {

    // ---- GET: Lookup layaway ----
    if (req.method === 'GET') {
        const { phone, email, id } = req.query;

        // By ID
        if (id) {
            try {
                const doc = await getDb().collection('layaways').doc(id).get();
                if (!doc.exists) return res.status(404).json({ error: 'Layaway not found' });
                return res.status(200).json({ id: doc.id, ...doc.data() });
            } catch (err) {
                console.error('[layaways] GET by ID error:', err.message);
                return res.status(500).json({ error: 'Failed to fetch layaway' });
            }
        }

        // By phone or email
        if (!phone && !email) {
            return res.status(400).json({ error: 'Phone, email, or ID required' });
        }

        try {
            let query = getDb().collection('layaways');
            if (phone) query = query.where('customer.phone', '==', phone);
            else query = query.where('customer.email', '==', email);

            const snap = await query.get();
            const list = [];
            snap.forEach(d => list.push({ id: d.id, ...d.data() }));
            list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            return res.status(200).json(list);
        } catch (err) {
            console.error('[layaways] GET error:', err.message);
            return res.status(500).json({ error: 'Failed to fetch layaways' });
        }
    }

    // ---- POST: Create layaway ----
    if (req.method === 'POST') {
        const { totalAmount, customer, service } = req.body;
        if (!totalAmount || !customer || !service) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        try {
            const doc = {
                service: {
                    name: clean(service.name, 200),
                    description: clean(service.description || '', 500),
                },
                customer: {
                    name: clean(customer.name, 100),
                    email: customer.email,
                    phone: customer.phone || '',
                },
                totalAmount: Number(totalAmount),
                paidAmount: 0,
                remainingAmount: Number(totalAmount),
                payments: [],
                status: 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const ref = await getDb().collection('layaways').add(doc);
            return res.status(201).json({ id: ref.id, ...doc });
        } catch (err) {
            console.error('[layaways] POST error:', err.message);
            return res.status(500).json({ error: 'Failed to create layaway' });
        }
    }

    // ---- PUT: Record payment ----
    if (req.method === 'PUT') {
        const { id } = req.query;
        const { amount, paymentRef } = req.body;

        if (!id || !amount || !paymentRef) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        try {
            const docRef = getDb().collection('layaways').doc(id);
            const doc = await docRef.get();
            if (!doc.exists) return res.status(404).json({ error: 'Layaway not found' });

            const data = doc.data();
            const newPaid = data.paidAmount + Number(amount);
            const newRemaining = data.totalAmount - newPaid;
            const completed = newRemaining <= 0;

            await docRef.update({
                paidAmount: newPaid,
                remainingAmount: Math.max(0, newRemaining),
                payments: [...(data.payments || []), {
                    amount: Number(amount),
                    paymentRef,
                    date: new Date().toISOString(),
                }],
                status: completed ? 'completed' : 'active',
                updatedAt: new Date().toISOString(),
            });

            return res.status(200).json({ success: true, completed });
        } catch (err) {
            console.error('[layaways] PUT error:', err.message);
            return res.status(500).json({ error: 'Failed to record payment' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

export default withMiddleware(handler);
