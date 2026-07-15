const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

router.use(auth);

const employeeSelect = `
  SELECT e.*,
         d.name AS department_name,
         p.title AS position_title
  FROM employees e
  LEFT JOIN departments d ON e.department_id = d.id
  LEFT JOIN positions p ON e.position_id = p.id
`;

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`${employeeSelect} ORDER BY e.last_name, e.first_name`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(`${employeeSelect} WHERE e.id = ?`, [req.params.id]);
    if (!rows[0]) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      employee_id,
      first_name,
      last_name,
      email,
      phone,
      address,
      department_id,
      position_id,
      employment_status,
      date_hired
    } = req.body;

    if (!employee_id || !first_name || !last_name) {
      return res.status(400).json({ error: 'Employee ID, first name, and last name are required' });
    }

    const [result] = await db.query(
      `INSERT INTO employees
        (employee_id, first_name, last_name, email, phone, address, department_id, position_id, employment_status, date_hired)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        employee_id,
        first_name,
        last_name,
        email || null,
        phone || null,
        address || null,
        department_id || null,
        position_id || null,
        employment_status || 'Permanent',
        date_hired || null
      ]
    );

    const [rows] = await db.query(`${employeeSelect} WHERE e.id = ?`, [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Employee ID already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const {
      employee_id,
      first_name,
      last_name,
      email,
      phone,
      address,
      department_id,
      position_id,
      employment_status,
      date_hired
    } = req.body;

    if (!employee_id || !first_name || !last_name) {
      return res.status(400).json({ error: 'Employee ID, first name, and last name are required' });
    }

    const [result] = await db.query(
      `UPDATE employees SET
        employee_id = ?, first_name = ?, last_name = ?, email = ?, phone = ?,
        address = ?, department_id = ?, position_id = ?, employment_status = ?, date_hired = ?
       WHERE id = ?`,
      [
        employee_id,
        first_name,
        last_name,
        email || null,
        phone || null,
        address || null,
        department_id || null,
        position_id || null,
        employment_status || 'Permanent',
        date_hired || null,
        req.params.id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const [rows] = await db.query(`${employeeSelect} WHERE e.id = ?`, [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Employee ID already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM employees WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json({ message: 'Employee deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
