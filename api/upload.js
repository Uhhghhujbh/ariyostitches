import { storage } from './lib/firebase-admin.js';
import { withMiddleware, requireAdmin } from './lib/middleware.js';
import Busboy from 'busboy';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export const config = {
    api: {
        bodyParser: false,
    },
};

const handler = async (req, res) => {
    // Only POST allowed
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // AUTH: Admin Only
    if (!requireAdmin(req, res)) return;

    const busboy = Busboy({ headers: req.headers });
    const uploads = [];
    const fields = {};

    return new Promise((resolve, reject) => {
        busboy.on('field', (fieldname, val) => {
            fields[fieldname] = val;
        });

        busboy.on('file', (fieldname, file, { filename, mimeType }) => {
            const ext = path.extname(filename).toLowerCase();
            // Validate file type
            if (!['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
                file.resume(); // Drain stream
                return;
            }

            const newFilename = `${uuidv4()}${ext}`;
            const bucket = storage.bucket();
            const fileUpload = bucket.file(`products/${newFilename}`);
            const blobStream = fileUpload.createWriteStream({
                metadata: {
                    contentType: mimeType,
                },
            });

            const uploadPromise = new Promise((resolveUpload, rejectUpload) => {
                blobStream.on('error', (err) => {
                    console.error('Blob stream error:', err);
                    rejectUpload(err);
                });

                blobStream.on('finish', async () => {
                    // Make the file public (since it's a product image)
                    try {
                        await fileUpload.makePublic();
                        const publicUrl = `https://storage.googleapis.com/${bucket.name}/products/${newFilename}`;
                        resolveUpload(publicUrl);
                    } catch (err) {
                        rejectUpload(err);
                    }
                });

                file.pipe(blobStream);
            });

            uploads.push(uploadPromise);
        });

        busboy.on('finish', async () => {
            try {
                const results = await Promise.all(uploads);
                if (results.length === 0) {
                    // If no file, check if image_url string was provided in fields
                    if (fields.image_url) {
                        return resolve(res.status(200).json({ url: fields.image_url }));
                    }
                    return resolve(res.status(400).json({ error: 'No file uploaded' }));
                }
                // Return the first file url (assuming single upload for now)
                return resolve(res.status(201).json({ url: results[0] }));
            } catch (error) {
                console.error('Upload processing error:', error);
                return resolve(res.status(500).json({ error: 'Upload failed' }));
            }
        });

        busboy.on('error', (error) => {
            console.error('Busboy error:', error);
            resolve(res.status(500).json({ error: 'Parsing failed' }));
        });

        req.pipe(busboy);
    });
};

export default withMiddleware(handler);
