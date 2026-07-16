const mysql = require('mysql2');
const bcrypt = require('bcrypt');
require('dotenv').config();

let dbStatus = { connected: false, message: 'Database not initialized yet.' };
let fallbackMode = false;
let fallbackData = null;

const DB_PASSWORD = process.env.DB_PASS || process.env.MYSQL_ROOT_PASSWORD || process.env.MYSQL_PASSWORD || '';
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: DB_PASSWORD,
  database: process.env.DB_NAME || 'pclu_employee_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}).promise();

function getDatabaseStatus() {
  return dbStatus;
}

function createFallbackData() {
  const hashedPassword = bcrypt.hashSync('Admin123', 10);
  return {
    users: [
      {
        id: 1,
        name: 'System Administrator',
        email: 'admin@pclu.edu.ph',
        password: hashedPassword,
        role: 'admin',
        created_at: new Date().toISOString()
      }
    ],
    departments: [
      { id: 1, name: 'Basic Education', description: 'Handles elementary and secondary education programs', created_at: new Date().toISOString() },
      { id: 2, name: 'Administration', description: 'Administrative and support services', created_at: new Date().toISOString() },
      { id: 3, name: 'Guidance Office', description: 'Student guidance and counseling services', created_at: new Date().toISOString() }
    ],
    positions: [
      { id: 1, title: 'Teacher I', description: 'Entry-level teaching position', created_at: new Date().toISOString() },
      { id: 2, title: 'Teacher II', description: 'Intermediate teaching position', created_at: new Date().toISOString() },
      { id: 3, title: 'School Head', description: 'Head of school unit', created_at: new Date().toISOString() },
      { id: 4, title: 'Administrative Aide', description: 'Administrative support staff', created_at: new Date().toISOString() }
    ],
    employees: [
      {
        id: 1,
        employee_id: 'EMP-001',
        first_name: 'Maria',
        last_name: 'Santos',
        email: 'maria.santos@pclu.edu.ph',
        phone: '09171234567',
        address: 'San Fernando, La Union',
        department_id: 1,
        position_id: 1,
        employment_status: 'Permanent',
        date_hired: '2018-06-01',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        employee_id: 'EMP-002',
        first_name: 'Juan',
        last_name: 'Reyes',
        email: 'juan.reyes@pclu.edu.ph',
        phone: '09181234567',
        address: 'Bauang, La Union',
        department_id: 1,
        position_id: 2,
        employment_status: 'Permanent',
        date_hired: '2019-08-15',
        created_at: new Date().toISOString()
      },
      {
        id: 3,
        employee_id: 'EMP-003',
        first_name: 'Ana',
        last_name: 'Cruz',
        email: 'ana.cruz@pclu.edu.ph',
        phone: '09191234567',
        address: 'San Juan, La Union',
        department_id: 2,
        position_id: 4,
        employment_status: 'Contractual',
        date_hired: '2022-01-10',
        created_at: new Date().toISOString()
      }
    ]
  };
}

function ensureFallbackData() {
  if (!fallbackData) {
    fallbackData = createFallbackData();
  }
  return fallbackData;
}

function isConnectionError(err) {
  const msg = (err && err.message ? err.message : String(err)).toLowerCase();
  return ['econnrefused', 'enotfound', 'etimedout', 'access denied', 'password authentication failed', 'connect econnrefused'].some((token) => msg.includes(token));
}

function executeFallbackQuery(sql, params = []) {
  const normalized = String(sql).trim().toLowerCase();
  const data = ensureFallbackData();

  if (normalized.startsWith('select 1')) {
    return [[{ '1': 1 }]];
  }

  if (normalized.includes('from users') && normalized.includes('where email')) {
    const [email] = params;
    const rows = data.users.filter((user) => user.email === email);
    return [rows];
  }

  if (normalized.includes('count(*)') && normalized.includes('from users')) {
    return [[{ count: data.users.length }]];
  }

  if (normalized.includes('from departments') && normalized.includes('order by name')) {
    return [data.departments.slice().sort((a, b) => a.name.localeCompare(b.name))];
  }

  if (normalized.includes('insert into departments')) {
    const [name, description = ''] = params;
    const nextId = data.departments.reduce((max, item) => Math.max(max, item.id), 0) + 1;
    const row = { id: nextId, name, description, created_at: new Date().toISOString() };
    data.departments.push(row);
    return [{ insertId: nextId, affectedRows: 1 }];
  }

  if (normalized.includes('update departments')) {
    const [name, description = '', id] = params;
    const row = data.departments.find((item) => item.id === Number(id));
    if (!row) {
      return [{ affectedRows: 0 }];
    }
    row.name = name;
    row.description = description;
    return [{ affectedRows: 1 }];
  }

  if (normalized.includes('delete from departments')) {
    const [id] = params;
    const index = data.departments.findIndex((item) => item.id === Number(id));
    if (index === -1) {
      return [{ affectedRows: 0 }];
    }
    data.departments.splice(index, 1);
    return [{ affectedRows: 1 }];
  }

  if (normalized.includes('count(*)') && normalized.includes('from employees') && normalized.includes('department_id')) {
    const [id] = params;
    const count = data.employees.filter((employee) => employee.department_id === Number(id)).length;
    return [[{ count }]];
  }

  if (normalized.includes('count(*)') && normalized.includes('from employees') && normalized.includes('position_id')) {
    const [id] = params;
    const count = data.employees.filter((employee) => employee.position_id === Number(id)).length;
    return [[{ count }]];
  }

  if (normalized.includes('from positions') && normalized.includes('order by title')) {
    return [data.positions.slice().sort((a, b) => a.title.localeCompare(b.title))];
  }

  if (normalized.includes('insert into positions')) {
    const [title, description = ''] = params;
    const nextId = data.positions.reduce((max, item) => Math.max(max, item.id), 0) + 1;
    const row = { id: nextId, title, description, created_at: new Date().toISOString() };
    data.positions.push(row);
    return [{ insertId: nextId, affectedRows: 1 }];
  }

  if (normalized.includes('update positions')) {
    const [title, description = '', id] = params;
    const row = data.positions.find((item) => item.id === Number(id));
    if (!row) {
      return [{ affectedRows: 0 }];
    }
    row.title = title;
    row.description = description;
    return [{ affectedRows: 1 }];
  }

  if (normalized.includes('delete from positions')) {
    const [id] = params;
    const index = data.positions.findIndex((item) => item.id === Number(id));
    if (index === -1) {
      return [{ affectedRows: 0 }];
    }
    data.positions.splice(index, 1);
    return [{ affectedRows: 1 }];
  }

  if (normalized.includes('from employees') && normalized.includes('left join')) {
    const rows = data.employees.map((employee) => ({
      ...employee,
      department_name: data.departments.find((dept) => dept.id === employee.department_id)?.name || null,
      position_title: data.positions.find((position) => position.id === employee.position_id)?.title || null
    }));
    return [rows.sort((a, b) => `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`))];
  }

  if (normalized.includes('from employees') && normalized.includes('where e.id')) {
    const [id] = params;
    const row = data.employees.find((employee) => employee.id === Number(id));
    if (!row) {
      return [[]];
    }
    return [[{
      ...row,
      department_name: data.departments.find((dept) => dept.id === row.department_id)?.name || null,
      position_title: data.positions.find((position) => position.id === row.position_id)?.title || null
    }]];
  }

  if (normalized.includes('insert into employees')) {
    const [employeeId, firstName, lastName, email, phone, address, departmentId, positionId, employmentStatus, dateHired] = params;
    const nextId = data.employees.reduce((max, item) => Math.max(max, item.id), 0) + 1;
    const row = {
      id: nextId,
      employee_id: employeeId,
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      address,
      department_id: departmentId || null,
      position_id: positionId || null,
      employment_status: employmentStatus || 'Permanent',
      date_hired: dateHired || null,
      created_at: new Date().toISOString()
    };
    data.employees.push(row);
    return [{ insertId: nextId, affectedRows: 1 }];
  }

  if (normalized.includes('update employees')) {
    const [employeeId, firstName, lastName, email, phone, address, departmentId, positionId, employmentStatus, dateHired, id] = params;
    const row = data.employees.find((item) => item.id === Number(id));
    if (!row) {
      return [{ affectedRows: 0 }];
    }
    row.employee_id = employeeId;
    row.first_name = firstName;
    row.last_name = lastName;
    row.email = email;
    row.phone = phone;
    row.address = address;
    row.department_id = departmentId || null;
    row.position_id = positionId || null;
    row.employment_status = employmentStatus || 'Permanent';
    row.date_hired = dateHired || null;
    return [{ affectedRows: 1 }];
  }

  if (normalized.includes('delete from employees')) {
    const [id] = params;
    const index = data.employees.findIndex((item) => item.id === Number(id));
    if (index === -1) {
      return [{ affectedRows: 0 }];
    }
    data.employees.splice(index, 1);
    return [{ affectedRows: 1 }];
  }

  if (normalized.includes('select') && normalized.includes('from employees') && normalized.includes('employment_status')) {
    const rows = data.employees.reduce((acc, employee) => {
      const current = acc.find((item) => item.status === employee.employment_status);
      if (current) {
        current.count += 1;
      } else {
        acc.push({ status: employee.employment_status, count: 1 });
      }
      return acc;
    }, []);
    return [rows.sort((a, b) => a.status.localeCompare(b.status))];
  }

  if (normalized.includes('select') && normalized.includes('from departments') && normalized.includes('left join employees')) {
    const rows = data.departments.map((department) => ({
      department: department.name,
      count: data.employees.filter((employee) => employee.department_id === department.id).length
    }));
    return [rows];
  }

  if (normalized.includes('select') && normalized.includes('count(*)') && normalized.includes('from departments')) {
    return [[{ count: data.departments.length }]];
  }

  if (normalized.includes('select') && normalized.includes('count(*)') && normalized.includes('from positions')) {
    return [[{ count: data.positions.length }]];
  }

  if (normalized.includes('select') && normalized.includes('count(*)') && normalized.includes('from employees')) {
    return [[{ count: data.employees.length }]];
  }

  if (normalized.includes('select') && normalized.includes('from employees') && normalized.includes('employment_status =')) {
    const rows = data.employees.filter((employee) => employee.employment_status === 'Permanent');
    return [[{ totalemployees: data.employees.length, totaldepartments: data.departments.length, totalpositions: data.positions.length, permanentstaff: rows.length }]];
  }

  return [[]];
}

async function query(sql, params = []) {
  if (fallbackMode) {
    return executeFallbackQuery(sql, params);
  }
  try {
    return await pool.query(sql, params);
  } catch (err) {
    if (isConnectionError(err)) {
      fallbackMode = true;
      dbStatus = { connected: false, message: 'Database unavailable. Using built-in fallback data.' };
      console.warn('Database unavailable; continuing with built-in fallback data.');
      return executeFallbackQuery(sql, params);
    }
    throw err;
  }
}

async function initDatabase() {
  try {
    const maxRetries = 6;
    const retryDelayMs = 1500;
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        await query('SELECT 1');
        dbStatus = { connected: true, message: 'Connected to database.' };
        break;
      } catch (err) {
        attempt += 1;
        dbStatus = { connected: false, message: `DB not ready (attempt ${attempt}/${maxRetries})` };
        if (attempt >= maxRetries) {
          const msg = err && err.message ? err.message : String(err);
          console.warn('Database did not become ready after retries. Continuing with fallback data.', msg);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }

    if (fallbackMode) {
      return;
    }

    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin') DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS departments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS positions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
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

    const [users] = await query('SELECT COUNT(*) as count FROM users');
    if (users[0].count === 0) {
      const password = await bcrypt.hash('Admin123', 10);
      await query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['System Administrator', 'admin@pclu.edu.ph', password, 'admin']
      );
    }

    const [depts] = await query('SELECT COUNT(*) as count FROM departments');
    if (depts[0].count === 0) {
      await query(
        'INSERT INTO departments (name, description) VALUES (?, ?), (?, ?), (?, ?)',
        [
          'Basic Education', 'Handles elementary and secondary education programs',
          'Administration', 'Administrative and support services',
          'Guidance Office', 'Student guidance and counseling services'
        ]
      );
    }

    const [positions] = await query('SELECT COUNT(*) as count FROM positions');
    if (positions[0].count === 0) {
      await query(
        'INSERT INTO positions (title, description) VALUES (?, ?), (?, ?), (?, ?), (?, ?)',
        [
          'Teacher I', 'Entry-level teaching position',
          'Teacher II', 'Intermediate teaching position',
          'School Head', 'Head of school unit',
          'Administrative Aide', 'Administrative support staff'
        ]
      );
    }

    const [employees] = await query('SELECT COUNT(*) as count FROM employees');
    if (employees[0].count === 0) {
      await query(
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
    dbStatus = {
      connected: false,
      message: err.message || 'Database connection failed.'
    };
    console.error('Database initialization error:', err.message || err);
  }
}

initDatabase().catch(() => {});

module.exports = Object.assign(pool, { getDatabaseStatus, query });
