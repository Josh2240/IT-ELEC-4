import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Login from './components/Login'
import Dashboard from './components/Dashboard'

const API = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api'

export default function App() {
  const [auth, setAuth] = useState(() => {
    try {
      const token = localStorage.getItem('token')
      const user = JSON.parse(localStorage.getItem('user'))
      return { token, user }
    } catch {
      return { token: null, user: null }
    }
  })

  useEffect(() => {
    if (auth.token) {
      axios.defaults.headers.common['Authorization'] = 'Bearer ' + auth.token
    } else {
      delete axios.defaults.headers.common['Authorization']
    }
  }, [auth.token])

  function handleLogin(data) {
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setAuth({ token: data.token, user: data.user })
  }

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setAuth({ token: null, user: null })
  }

  return (
    <div className="container">
      <main>
        {!auth.user ? (
          <Login apiBase={API} onLogin={handleLogin} />
        ) : (
          <Dashboard apiBase={API} user={auth.user} onLogout={handleLogout} />
        )}
      </main>
    </div>
  )
}
