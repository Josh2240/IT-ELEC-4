import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function Overview({ apiBase }) {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      const res = await axios.get(`${apiBase}/dashboard/stats`)
      setStats(res.data)
      setError(null)
    } catch (e) {
      setError(e.response?.data?.error || e.message)
    }
  }

  if (error) {
    return <div className="error-message">{error}</div>
  }

  if (!stats) {
    return <div className="loading">Loading dashboard...</div>
  }

  const { totals, byDepartment, byStatus } = stats

  return (
    <section>
      <div className="overview-grid">
        <div className="stat-card">
          <div className="stat-title">Total Employees</div>
          <div className="stat-value">{totals.totalEmployees}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Departments</div>
          <div className="stat-value">{totals.totalDepartments}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Positions</div>
          <div className="stat-value">{totals.totalPositions}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Permanent Staff</div>
          <div className="stat-value">{totals.permanentStaff}</div>
        </div>
      </div>

      <div className="panel-grid">
        <div className="panel-card">
          <h3>Employees by Department</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {byDepartment.map((row) => (
                <tr key={row.department}>
                  <td>{row.department}</td>
                  <td>{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel-card">
          <h3>Employees by Status</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {byStatus.map((row) => (
                <tr key={row.status}>
                  <td>{row.status}</td>
                  <td>{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
