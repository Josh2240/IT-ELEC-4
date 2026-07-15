import React, { useEffect, useState } from 'react'
import axios from 'axios'

const emptyForm = {
  name: '',
  description: ''
}

export default function Departments({ apiBase }) {
  const [departments, setDepartments] = useState([])
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
      const res = await axios.get(`${apiBase}/departments`)
      setDepartments(res.data)
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

  function openEdit(dept) {
    setForm({
      name: dept.name,
      description: dept.description || ''
    })
    setEditingId(dept.id)
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
      if (editingId) {
        await axios.put(`${apiBase}/departments/${editingId}`, form)
      } else {
        await axios.post(`${apiBase}/departments`, form)
      }

      closeModal()
      await loadData()
    } catch (e) {
      setError(e.response?.data?.error || e.message)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this department?')) return
    try {
      await axios.delete(`${apiBase}/departments/${id}`)
      await loadData()
    } catch (e) {
      setError(e.response?.data?.error || e.message)
    }
  }

  if (loading) {
    return <div className="loading">Loading departments...</div>
  }

  return (
    <section>
      <div className="section-toolbar">
        <button className="btn btn-primary" onClick={openAdd}>Add Department</button>
      </div>

      {error && !showModal && <div className="error-message">{error}</div>}

      <div className="panel-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Department Name</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {departments.length === 0 ? (
              <tr>
                <td colSpan="3" className="empty-cell">No departments found.</td>
              </tr>
            ) : (
              departments.map((dept) => (
                <tr key={dept.id}>
                  <td>{dept.name}</td>
                  <td>{dept.description || '—'}</td>
                  <td className="actions-cell">
                    <button className="btn btn-small" onClick={() => openEdit(dept)}>Edit</button>
                    <button className="btn btn-small btn-danger" onClick={() => handleDelete(dept.id)}>Delete</button>
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
            <h3>{editingId ? 'Edit Department' : 'Add Department'}</h3>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit} className="form-grid">
              <label className="full-width">
                Department Name
                <input name="name" value={form.name} onChange={handleChange} required />
              </label>
              <label className="full-width">
                Description
                <textarea name="description" value={form.description} onChange={handleChange} rows="3" />
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
