import React, { useState } from 'react'
import axios from 'axios'

export default function Login({ apiBase, onLogin }) {
  const [email, setEmail] = useState('admin@pclu.edu.ph')
  const [password, setPassword] = useState('Admin123')
  const [err, setErr] = useState(null)
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setErr(null)
    setLoading(true)
    try {
      const res = await axios.post(`${apiBase}/auth/login`, { email, password })
      if (res.data?.token) {
        onLogin(res.data)
      } else {
        setErr('Invalid response from server')
      }
    } catch (e) {
      setErr(e.response?.data?.error || e.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="logo-badge">PCLU</div>
        <h1 className="welcome-text">Employee Information System</h1>
        <p className="login-subtitle">Basic Education Department</p>
        <p className="login-subtitle">Polytechnic College of La Union</p>

        <form onSubmit={submit}>
          <div className="input-group">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="login-input"
              required
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
              required
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Signing in...' : 'Log In'}
          </button>

          {err && <div className="error-message">{err}</div>}
        </form>
      </div>
    </div>
  )
}
