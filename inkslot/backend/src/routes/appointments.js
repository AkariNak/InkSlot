import express from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

// Artist dashboard: list appointments for the logged-in studio
router.get('/', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT a.*, c.name AS client_name, ar.name AS artist_name
     FROM appointments a
     JOIN clients c ON c.id = a.client_id
     JOIN artists ar ON ar.id = a.artist_id
     WHERE a.studio_id = $1
     ORDER BY a.start_time ASC`,
    [req.studioId]
  );
  res.json(result.rows);
});

// Artist approves a pending request
router.patch('/:id/status', requireAuth, async (req, res) => {
  const { status } = req.body; // confirmed, cancelled, completed, no_show
  const allowed = ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const result = await pool.query(
    `UPDATE appointments SET status = $1
     WHERE id = $2 AND studio_id = $3
     RETURNING *`,
    [status, req.params.id, req.studioId]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(result.rows[0]);
});

// Public: client requests a slot on the studio's booking page
// Stripe deposit collection happens client-side against the returned appointment id
router.post('/public/:studioSlug/request', async (req, res) => {
  const { artistId, clientName, clientEmail, clientPhone, startTime, endTime, depositAmountCents } = req.body;

  const studioResult = await pool.query('SELECT id FROM studios WHERE slug = $1', [req.params.studioSlug]);
  const studio = studioResult.rows[0];
  if (!studio) return res.status(404).json({ error: 'Studio not found' });

  const clientResult = await pool.query(
    `INSERT INTO clients (studio_id, name, email, phone)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [studio.id, clientName, clientEmail, clientPhone]
  );
  const clientId = clientResult.rows[0].id;

  const apptResult = await pool.query(
    `INSERT INTO appointments (studio_id, artist_id, client_id, start_time, end_time, deposit_amount_cents, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'pending')
     RETURNING *`,
    [studio.id, artistId, clientId, startTime, endTime, depositAmountCents]
  );

  res.status(201).json(apptResult.rows[0]);
});

export default router;
