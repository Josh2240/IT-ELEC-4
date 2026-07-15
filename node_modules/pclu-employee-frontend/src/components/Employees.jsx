import React, { useEffect, useState } from 'react'
import axios from 'axios'

const emptyForm = {
  employee_id: '',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  address: '',
  department_id: '',
  position_id: '',
  employment_status: 'Permanent',
  date_hired: ''
}

export default function Employees({ apiBase }) {
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [positions, setPositions] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [empRes, deptRes, posRes] = await Promise.all([
        axios.get(`${apiBase}/employees`),
        axios.get(`${apiBase}/departments`),
        axios.get(`${apiBase}/positions`)
      ])
      setEmployees(empRes.data)
      setDepartments(deptRes.data)
      setPositions(posRes.data)
      setError(null)
    } catch (e) {
      setError(e.response?.data?.error || e.message)
    } finally {
      setLoading(false)
    }
  }

  function openAdd() {
    setForm(emptyForm)
    setEditingId(null)
    setShowModal(true)
    setError(null)
  }

  function openEdit(employee) {
    setForm({
      employee_id: employee.employee_id,
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email || '',
      phone: employee.phone || '',
      address: employee.address || '',
      department_id: employee.department_id || '',
      position_id: employee.position_id || '',
      employment_status: employee.employment_status || 'Permanent',
      date_hired: employee.date_hired ? employee.date_hired.slice(0, 10) : ''
    })
    setEditingId(employee.id)
    setShowModal(true)
    setError(null)
  }

  function closeModal() {
    setShowModal(false)
    setForm(emptyForm)
    setEditingId(null)
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const payload = {
        ...form,
        department_id: form.department_id ? Number(form.department_id) : null,
        position_id: form.position_id ? Number(form.position_id) : null
      }

      if (editingId) {
        await axios.put(`${apiBase}/employees/${editingId}`, payload)
      } else {
        await axios.post(`${apiBase}/employees`, payload)
      }

      closeModal()
      await loadData()
    } catch (e) {
      setError(e.response?.data?.error || e.message)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this employee record?')) return
    try {
      await axios.delete(`${apiBase}/employees/${id}`)
      await loadData()
    } catch (e) {
      setError(e.response?.data?.error || e.message)
    }
  }

  if (loading) {
    return <div className="loading">Loading employees...</div>
  }

  return (
    <section>
      <div className="section-toolbar">
        <button className="btn btn-primary" onClick={openAdd}>Add Employee</button>
      </div>

      {error && !showModal && <div className="error-message">{error}</div>}

      <div className="panel-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Name</th>
              <th>Department</th>
              <th>Position</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-cell">No employees found.</td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.id}>
                  <td>{emp.employee_id}</td>
                  <td>{emp.first_name} {emp.last_name}</td>
                  <td>{emp.department_name || '—'}</td>
                  <td>{emp.position_title || '—'}</td>
                  <td><span className={`status-badge status-${emp.employment_status?.toLowerCase()}`}>{emp.employment_status}</span></td>
                  <td className="actions-cell">
                    <button className="btn btn-small" onClick={() => openEdit(emp)}>Edit</button>
                    <button className="btn btn-small btn-danger" onClick={() => handleDelete(emp.id)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingId ? 'Edit Employee' : 'Add Employee'}</h3>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit} className="form-grid">
              <label>
                Employee ID
                <input name="employee_id" value={form.employee_id} onChange={handleChange} required />
              </label>
              <label>
                First Name
                <input name="first_name" value={form.first_name} onChange={handleChange} required />
              </label>
              <label>
                Last Name
                <input name="last_name" value={form.last_name} onChange={handleChange} required />
              </label>
              <label>
                Email
                <input type="email" name="email" value={form.email} onChange={handleChange} />
              </label>
              <label>
                Phone
                <input name="phone" value={form.phone} onChange={handleChange} />
              </label>
              <label>
                Date Hired
                <input type="date" name="date_hired" value={form.date_hired} onChange={handleChange} />
              </label>
              <label>
                Department
                <select name="department_id" value={form.department_id} onChange={handleChange}>
                  <option value="">Select department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Position
                <select name="position_id" value={form.position_id} onChange={handleChange}>
                  <option value="">Select position</option>
                  {positions.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </label>
              <label>
                Employment Status
                <select name="employment_status" value={form.employment_status} onChange={handleChange}>
                  <option value="Permanent">Permanent</option>
                  <option value="Temporary">Temporary</option>
                  <option value="Contractual">Contractual</option>
                </select>
              </label>
              <label className="full-width">
                Address
                <textarea name="address" value={form.address} onChange={handleChange} rows="2" />
              </label>
              <div className="modal-actions full-width">
                <button type="button" className="btn" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
