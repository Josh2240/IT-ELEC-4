import React, { useState } from 'react'
import Sidebar from './Sidebar'
import Overview from './Overview'
import Employees from './Employees'
import Departments from './Departments'
import Positions from './Positions'

const sectionTitles = {
  overview: 'Dashboard Overview',
  employees: 'Employee Records',
  departments: 'Departments',
  positions: 'Positions'
}

export default function Dashboard({ apiBase, user, onLogout }) {
  const [active, setActive] = useState('overview')

  function renderContent() {
    switch (active) {
      case 'overview':
        return <Overview apiBase={apiBase} />
      case 'employees':
        return <Employees apiBase={apiBase} />
      case 'departments':
        return <Departments apiBase={apiBase} />
      case 'positions':
        return <Positions apiBase={apiBase} />
      default:
        return <Overview apiBase={apiBase} />
    }
  }

  return (
    <div className="dashboard">
      <Sidebar
        active={active}
        onSelect={setActive}
        user={user}
        onLogout={onLogout}
      />
      <main className="dash-content">
        <header className="dash-header">
          <div className="dash-title">{sectionTitles[active]}</div>
          <div className="dash-meta">{user?.name} • {user?.role}</div>
        </header>
        {renderContent()}
      </main>
    </div>
  )
}
