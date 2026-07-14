import React from 'react'

export default function Sidebar({ active, onSelect, user, onLogout }) {
  const items = [
    { key: 'overview', label: 'Overview' },
    { key: 'employees', label: 'Employees' },
    { key: 'departments', label: 'Departments' },
    { key: 'positions', label: 'Positions' }
  ]

  return (
    <aside className="sidebar-panel">
      <div>
        <div className="brand">
          <div className="brand-logo">PCLU</div>
          <div className="brand-text">Basic Education<br />Employee IS</div>
        </div>

        <div className="profile">
          <div className="avatar">{(user?.name && user.name[0]) || 'A'}</div>
          <div>
            <div className="profile-name">{user?.name || 'Admin'}</div>
            <small className="profile-role">{user?.role || 'admin'}</small>
          </div>
        </div>

        <nav className="sidebar-nav">
          {items.map((item) => (
            <button
              key={item.key}
              className={'nav-item' + (active === item.key ? ' active' : '')}
              onClick={() => onSelect(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="sidebar-footer">
        <button className="nav-item logout-btn" onClick={onLogout}>
          Logout
        </button>
        <small>© {new Date().getFullYear()} PCLU</small>
      </div>
    </aside>
  )
}
