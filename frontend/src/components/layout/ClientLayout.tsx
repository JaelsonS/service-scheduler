import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'

export function ClientLayout() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
