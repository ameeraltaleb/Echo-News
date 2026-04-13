import { generateToken } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body;
  const expectedPassword = process.env.ADMIN_PASSWORD;

  // Require ADMIN_PASSWORD to be set in production
  if (!expectedPassword) {
    console.error('ADMIN_PASSWORD environment variable is not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  if ((password || '').trim() === expectedPassword.trim()) {
    const token = await generateToken({ role: 'admin' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
}
