import multer from 'multer';
import { verifyAuthHeader } from '../_lib/auth.js';
import { supabase } from '../_lib/supabase.js';

// Disable default Vercel body parser to handle multipart/form-data stream manually
export const config = {
  api: {
    bodyParser: false,
  },
};

const upload = multer({ storage: multer.memoryStorage() });

function runMiddleware(req: any, res: any, fn: any) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = await verifyAuthHeader(req.headers.authorization);
    if (!payload || payload.role !== 'admin') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await runMiddleware(req, res, upload.single('file')); // Most editors send the image via 'file' field or 'image' field

    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileExt = file.originalname.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('images') // Assumes the user created an 'images' public bucket in Supabase
      .upload(`public/${fileName}`, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return res.status(500).json({ error: `Supabase Error: ${error.message}` });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(`public/${fileName}`);

    res.json({ url: publicUrl });
  } catch (err: any) {
    console.error('Upload handler error:', err);
    res.status(500).json({ error: 'Internal server error during upload.' });
  }
}
