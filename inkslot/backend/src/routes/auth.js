import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';

const router = express.Router();

function slugify(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

router.post('/signup', async (req, res) => {
  const { studioName, email, password } = req.body;
  if (!studioName || !email || !password) {
    return res.status(400).json({ error: 'studioName, email, and password are required' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const baseSlug = slugify(studioName);

  try {
    const result = await pool.query(
      `INSERT INTO studios (name, slug, email, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, slug, email`,
      [studioName, baseSlug, email, passwordHash]
    );
    const studio = result.rows[0];
    const token = jwt.sign({ studioId: studio.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ studio, token });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A studio with that name or email already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Signup failed' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const result = await pool.query('SELECT * FROM studios WHERE email = $1', [email]);
  const studio = result.rows[0];
  if (!studio || !(await bcrypt.compare(password, studio.password_hash))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const token = jwt.sign({ studioId: studio.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ studio: { id: studio.id, name: studio.name, slug: studio.slug, email: studio.email }, token });
});

export default router;
