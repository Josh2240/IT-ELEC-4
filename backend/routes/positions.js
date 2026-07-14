const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, title, description, created_at FROM positions ORDER BY title'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Position title is required' });
    }

    const [result] = await db.query(
      'INSERT INTO positions (title, description) VALUES (?, ?)',
      [title, description || '']
    );

    res.status(201).json({ id: result.insertId, title, description: description || '' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Position title already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Position title is required' });
    }

    const [result] = await db.query(
      'UPDATE positions SET title = ?, description = ? WHERE id = ?',
      [title, description || '', req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Position not found' });
    }

    res.json({ id: Number(req.params.id), title, description: description || '' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Position title already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const [linked] = await db.query(
      'SELECT COUNT(*) as count FROM employees WHERE position_id = ?',
      [req.params.id]
    );

    if (linked[0].count > 0) {
      return res.status(400).json({
        error: 'Cannot delete position with assigned employees'
      });
    }

    const [result] = await db.query('DELETE FROM positions WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Position not found' });
    }

    res.json({ message: 'Position deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
