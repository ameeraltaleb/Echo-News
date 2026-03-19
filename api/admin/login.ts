import { generateToken } from '../_lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body;
  const expectedPassword = (process.env.ADMIN_PASSWORD || 'admin123').trim();
  
  if ((password || '').trim() === expectedPassword) {
    const token = await generateToken({ role: 'admin' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
}
