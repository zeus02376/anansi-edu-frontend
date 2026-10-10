import { useState } from 'react'
import PropTypes from 'prop-types'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

function DashboardLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#F5F7FB]">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="min-h-screen lg:pl-72">
        <Navbar onMenuClick={() => setMenuOpen(true)} />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-10">{children}</main>
      </div>
    </div>
  )
}

DashboardLayout.propTypes = {
  children: PropTypes.node.isRequired,
}

export default DashboardLayout
