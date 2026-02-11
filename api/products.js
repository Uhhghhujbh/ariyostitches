// ===================================
// /api/products — Catalogue CRUD
// ===================================
// GET    (public) → list all products
// POST   (admin)  → add product (image via URL, no file upload)
// DELETE (admin)  → remove product

import { getDb } from './lib/firebase-admin.js';
import { withMiddleware, requireAdmin } from './lib/middleware.js';
import { validateProduct, clean } from './lib/validators.js';

async function handler(req, res) {

    // ---- PUBLIC: List products ----
    if (req.method === 'GET') {
        try {
            const snap = await getDb().collection('products').orderBy('created_at', 'desc').get();
            const list = [];
            snap.forEach(d => list.push({ id: d.id, ...d.data() }));
            return res.status(200).json(list);
        } catch (err) {
            console.error('[products] GET error:', err);
            return res.status(500).json({ error: 'Failed to fetch products' });
        }
    }

    // ---- ADMIN ONLY from here ----
    if (!requireAdmin(req, res)) return;

    // ---- ADMIN: Add product ----
    if (req.method === 'POST') {
        const errors = validateProduct(req.body);
        if (errors.length) {
            return res.status(400).json({ error: errors.join(', ') });
        }

        try {
            const doc = {
                name: clean(req.body.name, 200),
                price: Number(req.body.price),
                description: clean(req.body.description || '', 1000),
                image_url: req.body.image_url.trim(),
                created_at: new Date().toISOString(),
            };

            const ref = await getDb().collection('products').add(doc);
            return res.status(201).json({ id: ref.id, ...doc });
        } catch (err) {
            console.error('[products] POST error:', err);
            return res.status(500).json({ error: 'Failed to add product' });
        }
    }

    // ---- ADMIN: Delete product ----
    if (req.method === 'DELETE') {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'Missing product id' });

        try {
            await getDb().collection('products').doc(id).delete();
            return res.status(200).json({ success: true });
        } catch (err) {
            console.error('[products] DELETE error:', err);
            return res.status(500).json({ error: 'Failed to delete product' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

export default withMiddleware(handler);
