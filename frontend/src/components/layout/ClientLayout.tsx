import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'

export function ClientLayout() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-3 py-5 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  )
}
