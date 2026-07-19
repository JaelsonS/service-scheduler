import { Outlet } from 'react-router-dom'
import { AdminSidebar } from './AdminSidebar'
import { Navbar } from './Navbar'

export function AdminLayout() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto flex max-w-6xl gap-0 md:min-h-[calc(100vh-4rem)]">
        <AdminSidebar />
        <main className="flex-1 px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
