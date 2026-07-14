const mysql = require('mysql2');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'pclu_employee_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}).promise();

async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin') DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS positions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id INT PRIMARY KEY AUTO_INCREMENT,
        employee_id VARCHAR(20) UNIQUE NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        phone VARCHAR(20),
        address TEXT,
        department_id INT,
        position_id INT,
        employment_status ENUM('Permanent', 'Temporary', 'Contractual') DEFAULT 'Permanent',
        date_hired DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
        FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE SET NULL
      )
    `);

    const [users] = await pool.query('SELECT COUNT(*) as count FROM users');
    if (users[0].count === 0) {
      const password = await bcrypt.hash('Admin123', 10);
      await pool.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['System Administrator', 'admin@pclu.edu.ph', password, 'admin']
      );
    }

    const [depts] = await pool.query('SELECT COUNT(*) as count FROM departments');
    if (depts[0].count === 0) {
      await pool.query(
        'INSERT INTO departments (name, description) VALUES (?, ?), (?, ?), (?, ?)',
        [
          'Basic Education', 'Handles elementary and secondary education programs',
          'Administration', 'Administrative and support services',
          'Guidance Office', 'Student guidance and counseling services'
        ]
      );
    }

    const [positions] = await pool.query('SELECT COUNT(*) as count FROM positions');
    if (positions[0].count === 0) {
      await pool.query(
        'INSERT INTO positions (title, description) VALUES (?, ?), (?, ?), (?, ?), (?, ?)',
        [
          'Teacher I', 'Entry-level teaching position',
          'Teacher II', 'Intermediate teaching position',
          'School Head', 'Head of school unit',
          'Administrative Aide', 'Administrative support staff'
        ]
      );
    }

    const [employees] = await pool.query('SELECT COUNT(*) as count FROM employees');
    if (employees[0].count === 0) {
      await pool.query(
        `INSERT INTO employees
          (employee_id, first_name, last_name, email, phone, address, department_id, position_id, employment_status, date_hired)
         VALUES
          (?, ?, ?, ?, ?, ?, ?, ?, ?, ?),
          (?, ?, ?, ?, ?, ?, ?, ?, ?, ?),
          (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'EMP-001', 'Maria', 'Santos', 'maria.santos@pclu.edu.ph', '09171234567', 'San Fernando, La Union',
          1, 1, 'Permanent', '2018-06-01',
          'EMP-002', 'Juan', 'Reyes', 'juan.reyes@pclu.edu.ph', '09181234567', 'Bauang, La Union',
          1, 2, 'Permanent', '2019-08-15',
          'EMP-003', 'Ana', 'Cruz', 'ana.cruz@pclu.edu.ph', '09191234567', 'San Juan, La Union',
          2, 4, 'Contractual', '2022-01-10'
        ]
      );
      console.log('Database seeded with sample data');
    }
  } catch (err) {
    console.error('Database initialization error:', err);
    throw err;
  }
}

initDatabase().catch(console.error);

module.exports = pool;
