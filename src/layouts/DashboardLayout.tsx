import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Package, Tag, User, LogOut, Menu } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/products', label: 'Produtos', icon: Package, end: false },
  { to: '/dashboard/categories', label: 'Categorias', icon: Tag, end: false },
  { to: '/dashboard/profile', label: 'Perfil', icon: User, end: false },
]

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth()

  return (
    <>
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
            onClick={onNavigate}
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

        <div className="mt-auto border-t pt-3">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/50 hover:text-accent-foreground"
          >
            <LogOut className="size-4 shrink-0" />
            Sair
          </button>
        </div>
      </nav>
    </>
  )
}

export function DashboardLayout() {
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <div className="flex h-screen">
      {/* Sidebar — visible on md+ */}
      <aside className="hidden w-56 flex-col border-r bg-card md:flex">
        <NavContent />
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center border-b bg-card px-4 gap-3 md:hidden">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Abrir menu"
            onClick={() => setSheetOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
          <SheetContent side="left" className="w-56 p-0" showCloseButton={false}>
            <SheetHeader className="sr-only">
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <NavContent onNavigate={() => setSheetOpen(false)} />
          </SheetContent>
        </Sheet>
        <span className="text-sm font-semibold">Dashboard</span>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6 pt-20 md:p-8 md:pt-8">
        <Outlet />
      </main>
    </div>
  )
}
