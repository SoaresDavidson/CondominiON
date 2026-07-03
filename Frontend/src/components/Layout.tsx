import { Building2, LogOut } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { roleLabels } from '../utils/labels'

const navItems = [
  { to: '/condominios', label: 'Condominios', icon: Building2 },
]

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col lg:flex-row">
        <aside className="border-b border-slate-200 bg-white px-4 py-4 lg:w-72 lg:border-b-0 lg:border-r lg:px-5">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-lg bg-emerald-600 text-white">
              <Building2 size={24} />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-950">CondominiON</p>
              <p className="text-sm text-slate-500">Assembleias e votacoes</p>
            </div>
          </div>

          <nav className="mt-6 grid grid-cols-2 gap-2 lg:grid-cols-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex h-11 items-center gap-3 rounded-md px-3 text-left text-sm font-semibold transition ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </nav>

          {user && (
            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-950">{user.name}</p>
              <p className="mt-1 text-sm text-slate-600">{user.email}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Perfil {roleLabels[user.role]}
              </p>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-4 flex h-9 w-full items-center justify-center gap-2 rounded-md text-sm font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50"
              >
                <LogOut size={16} /> Sair
              </button>
            </div>
          )}
        </aside>

        <section className="flex-1 px-4 py-5 sm:px-6 lg:px-8">
          <Outlet />
        </section>
      </div>
    </main>
  )
}
