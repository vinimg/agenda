import { Outlet, NavLink } from 'react-router-dom'
import { Calendar, CheckSquare, Repeat2, Home, Settings } from 'lucide-react'
import { cn } from '@/lib/cn'

const navItems = [
  { to: '/',         icon: Home,        label: 'Today' },
  { to: '/calendar', icon: Calendar,    label: 'Calendar' },
  { to: '/tasks',    icon: CheckSquare, label: 'Tasks' },
  { to: '/habits',   icon: Repeat2,     label: 'Habits' },
  { to: '/settings', icon: Settings,    label: 'Settings' },
]

function NavItem({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-3 rounded-full transition-colors text-[15px] font-medium',
          'hover:bg-[#1e2127] active:scale-95',
          isActive ? 'text-[#e7e9ea]' : 'text-[#71767b]',
        )
      }
    >
      <Icon size={22} />
      <span className="hidden xl:block">{label}</span>
    </NavLink>
  )
}

export function AppShell() {
  return (
    <div className="flex h-dvh bg-black overflow-hidden">
      {/* Sidebar — desktop */}
      <nav className="hidden md:flex flex-col w-16 xl:w-60 px-2 xl:px-3 py-4 border-r border-[#2f3336] shrink-0">
        <div className="flex flex-col gap-1 flex-1">
          {navItems.map(item => (
            <NavItem key={item.to} {...item} />
          ))}
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <Outlet />
      </main>

      {/* Bottom nav — mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 flex border-t border-[#2f3336] bg-black/95 backdrop-blur-sm z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center py-2.5 gap-0.5 text-[10px] transition-all min-h-[52px] active:scale-95',
                isActive ? 'text-[#e7e9ea]' : 'text-[#71767b]',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className={cn('p-1 rounded-xl transition-colors', isActive && 'bg-[#1d9bf0]/10')}>
                  <Icon size={22} />
                </span>
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
