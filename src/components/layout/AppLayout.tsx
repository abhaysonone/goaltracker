import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Award,
  LayoutDashboard,
  Target,
  ClipboardList,
  Users,
  History,
  LogOut,
  ChevronDown,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import clsx from 'clsx'
import { useAuthStore } from '../../store/authStore'
import { useDataStore } from '../../store/dataStore'
import { ThemeToggle } from './ThemeToggle'
import { NotificationsPanel } from './NotificationsPanel'
import { Avatar } from '../ui/Avatar'

const adminNav = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/goals', label: 'Goals', icon: Target },
  { to: '/admin/assignments', label: 'Assignments', icon: ClipboardList },
  { to: '/admin/employees', label: 'Employees', icon: Users },
]

const employeeNav = [
  { to: '/employee/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/employee/goals', label: 'My Goals', icon: Target },
  { to: '/employee/history', label: 'History', icon: History },
]

export function AppLayout({ role }: { role: 'admin' | 'employee' }) {
  const navigate = useNavigate()
  const currentUserId = useAuthStore((s) => s.currentUserId)
  const logout = useAuthStore((s) => s.logout)
  const user = useDataStore((s) => s.users.find((u) => u.id === currentUserId))
  const nav = role === 'admin' ? adminNav : employeeNav
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  if (!user) return null

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border/10 bg-bg-elevated">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white">
            <Award size={17} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text-primary leading-tight">Goal Tracker</p>
            <p className="truncate text-[11px] text-text-muted leading-tight">{role === 'admin' ? 'Admin Portal' : 'Employee Portal'}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent/12 text-accent-text'
                    : 'text-text-secondary hover:bg-bg-raised hover:text-text-primary',
                )
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border/10 p-3">
          <button
            onClick={() => {
              logout()
              navigate('/login')
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-raised hover:text-text-primary"
          >
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-end gap-2 border-b border-border/10 px-6">
          <ThemeToggle />
          <NotificationsPanel userId={user.id} />
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-bg-raised transition-colors"
            >
              <Avatar name={user.name} color={user.avatarColor} size={30} />
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-medium text-text-primary leading-tight">{user.name}</span>
                <span className="block text-xs text-text-muted leading-tight">{user.department}</span>
              </span>
              <ChevronDown size={14} className="text-text-muted" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-40 mt-2 w-44 rounded-lg border border-border/10 bg-bg-elevated shadow-2xl py-1">
                <button
                  onClick={() => {
                    logout()
                    navigate('/login')
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-bg-raised hover:text-text-primary"
                >
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
