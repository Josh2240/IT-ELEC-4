const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/stats', async (req, res) => {
  try {
    const [[totals]] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM employees) AS totalEmployees,
        (SELECT COUNT(*) FROM departments) AS totalDepartments,
        (SELECT COUNT(*) FROM positions) AS totalPositions,
        (SELECT COUNT(*) FROM employees WHERE employment_status = 'Permanent') AS permanentStaff
    `);

    const [byDepartment] = await db.query(`
      SELECT d.name AS department, COUNT(e.id) AS count
      FROM departments d
      LEFT JOIN employees e ON e.department_id = d.id
      GROUP BY d.id, d.name
      ORDER BY d.name
    `);

    const [byStatus] = await db.query(`
      SELECT employment_status AS status, COUNT(*) AS count
      FROM employees
      GROUP BY employment_status
      ORDER BY employment_status
    `);

    res.json({
      totals,
      byDepartment,
      byStatus
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
