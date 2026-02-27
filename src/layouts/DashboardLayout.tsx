import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Package, User, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/products', label: 'Produtos', icon: Package, end: false },
  { to: '/dashboard/profile', label: 'Perfil', icon: User, end: false },
]

export function DashboardLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 flex-col border-r bg-card">
        <div className="border-b px-4 py-5">
          <p className="text-sm font-semibold">Dashboard</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground',
                )
              }
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </NavLink>
          ))}

          <div className="mt-auto pt-3 border-t">
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/50 hover:text-accent-foreground"
            >
              <LogOut className="size-4 shrink-0" />
              Sair
            </button>
          </div>
        </nav>
      </aside>

      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  )
}
