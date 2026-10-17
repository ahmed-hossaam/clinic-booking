import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition-colors ${
    isActive ? "text-clinic-700" : "text-slate-600 hover:text-clinic-600"
  }`;

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-clinic-600 text-sm font-bold text-white">
              +
            </span>
            <span className="text-lg font-semibold text-slate-900">
              MediBook Clinic
            </span>
          </Link>
          {user && (
            <nav className="flex flex-wrap items-center gap-4 md:gap-6">
              {user.role === "patient" && (
                <>
                  <NavLink to="/doctors" className={linkClass}>
                    Doctors
                  </NavLink>
                  <NavLink to="/appointments" className={linkClass}>
                    My Appointments
                  </NavLink>
                </>
              )}
              {user.role === "admin" && (
                <NavLink to="/admin" className={linkClass}>
                  Admin Dashboard
                </NavLink>
              )}
              <span className="hidden text-sm text-slate-500 sm:inline">
                {user.name}
              </span>
              <button
                type="button"
                onClick={() => logout()}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-clinic-500 hover:text-clinic-700"
              >
                Log out
              </button>
            </nav>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        Clinic Appointment Booking System
      </footer>
    </div>
  );
}
