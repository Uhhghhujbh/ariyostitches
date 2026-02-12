import { withMiddleware, requireAdmin } from './lib/middleware.js';
import { getDb } from './lib/firebase-admin.js';
import { clean, validateProduct, isValidImageUrl } from './lib/validators.js';

export default withMiddleware(async (req, res) => {
    const db = getDb();

    if (req.method === 'GET') {
        const snap = await db.collection('products').orderBy('createdAt', 'desc').get();
        const products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        return res.status(200).json(products);
    }

    if (req.method === 'POST') {
        if (!requireAdmin(req, res)) return;

        const errors = validateProduct(req.body);
        if (errors.length) return res.status(400).json({ error: errors.join(', ') });

        await db.collection('products').add({
            name: clean(req.body.name, 200),
            price: Number(req.body.price),
            description: clean(req.body.description || '', 1000),
            image_url: req.body.image_url.trim(),
            createdAt: Date.now(),
        });
        return res.status(201).json({ success: true });
    }

    if (req.method === 'DELETE') {
        if (!requireAdmin(req, res)) return;
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'Product ID required' });
        await db.collection('products').doc(id).delete();
        return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
});
