// ===================================
// /api/messages — Contact Form + Admin CRUD
// ===================================
// POST   (public)  → submit a contact message
// GET    (admin)   → list all messages
// PUT    (admin)   → mark message as read
// DELETE (admin)   → delete a message

import { getDb } from './lib/firebase-admin.js';
import { withMiddleware, requireAdmin } from './lib/middleware.js';
import { validateMessage, clean } from './lib/validators.js';

async function handler(req, res) {

    // ---- PUBLIC: Submit message ----
    if (req.method === 'POST') {
        const errors = validateMessage(req.body);
        if (errors.length) {
            return res.status(400).json({ error: errors.join(', ') });
        }

        try {
            const doc = {
                name: clean(req.body.name, 100),
                email: req.body.email.trim().toLowerCase(),
                phone: clean(req.body.phone || '', 20),
                message: clean(req.body.message, 2000),
                createdAt: new Date().toISOString(),
                read: false,
            };

            const ref = await getDb().collection('messages').add(doc);
            return res.status(201).json({ id: ref.id, success: true });
        } catch (err) {
            console.error('[messages] POST error:', err);
            return res.status(500).json({ error: 'Failed to send message' });
        }
    }

    // ---- ADMIN ONLY from here ----
    if (!requireAdmin(req, res)) return;

    // ---- ADMIN: List messages ----
    if (req.method === 'GET') {
        try {
            const snap = await getDb().collection('messages').orderBy('createdAt', 'desc').get();
            const list = [];
            snap.forEach(d => list.push({ id: d.id, ...d.data() }));
            return res.status(200).json(list);
        } catch (err) {
            console.error('[messages] GET error:', err);
            return res.status(500).json({ error: 'Failed to fetch messages' });
        }
    }

    // ---- ADMIN: Mark as read ----
    if (req.method === 'PUT') {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'Missing id' });

        try {
            await getDb().collection('messages').doc(id).update({ read: true });
            return res.status(200).json({ success: true });
        } catch (err) {
            console.error('[messages] PUT error:', err);
            return res.status(500).json({ error: 'Failed to update' });
        }
    }

    // ---- ADMIN: Delete message ----
    if (req.method === 'DELETE') {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'Missing id' });

        try {
            await getDb().collection('messages').doc(id).delete();
            return res.status(200).json({ success: true });
        } catch (err) {
            console.error('[messages] DELETE error:', err);
            return res.status(500).json({ error: 'Failed to delete' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

export default withMiddleware(handler);
