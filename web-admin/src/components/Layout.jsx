import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useAlarmStore } from '../stores/alarmStore';
import socketService from '../services/socket';
import { 
  LayoutDashboard, 
  Bell, 
  Gauge, 
  Cpu, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Droplets
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/alarms', icon: Bell, label: 'Alarmas' },
  { to: '/valves', icon: Droplets, label: 'Válvulas' },
  { to: '/devices', icon: Cpu, label: 'Dispositivos' },
  { to: '/users', icon: Users, label: 'Usuarios' },
  { to: '/settings', icon: Settings, label: 'Configuración' },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { activeAlarms, fetchActiveAlarms } = useAlarmStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Conectar socket
    socketService.connect();
    
    // Cargar alarmas activas
    fetchActiveAlarms();

    // Solicitar permiso de notificaciones
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      socketService.disconnect();
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-surface-950 flex">
      {/* Sidebar Desktop */}
      <aside className={clsx(
        'hidden lg:flex flex-col fixed left-0 top-0 h-full bg-surface-900/80 backdrop-blur-xl border-r border-surface-800 transition-all duration-300 z-50',
        sidebarOpen ? 'w-64' : 'w-20'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 p-6 border-b border-surface-800">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <Gauge className="w-6 h-6 text-white" />
          </div>
          {sidebarOpen && (
            <span className="font-semibold text-xl gradient-text">FlowSight</span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                isActive 
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' 
                  : 'text-surface-400 hover:bg-surface-800 hover:text-surface-200'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">{label}</span>}
              {to === '/alarms' && activeAlarms.length > 0 && (
                <span className={clsx(
                  'ml-auto bg-red-500 text-white text-xs font-bold rounded-full',
                  sidebarOpen ? 'px-2 py-0.5' : 'w-2 h-2'
                )}>
                  {sidebarOpen ? activeAlarms.length : ''}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-surface-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center text-white font-semibold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-surface-200 truncate">{user?.name}</p>
                <p className="text-xs text-surface-500 truncate">{user?.role}</p>
              </div>
            )}
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-surface-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>Cerrar Sesión</span>}
          </button>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-8 w-6 h-6 bg-surface-800 border border-surface-700 rounded-full flex items-center justify-center text-surface-400 hover:text-surface-200 transition-colors"
        >
          {sidebarOpen ? '‹' : '›'}
        </button>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-surface-900/80 backdrop-blur-xl border-b border-surface-800 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <Gauge className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold gradient-text">FlowSight</span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-surface-400"
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-surface-950/95 backdrop-blur-xl z-40 pt-16">
          <nav className="p-4 space-y-2">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                  isActive 
                    ? 'bg-primary-500/20 text-primary-400' 
                    : 'text-surface-400'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{label}</span>
              </NavLink>
            ))}
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-red-400 rounded-xl"
            >
              <LogOut className="w-5 h-5" />
              <span>Cerrar Sesión</span>
            </button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className={clsx(
        'flex-1 min-h-screen transition-all duration-300 pt-16 lg:pt-0',
        sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
      )}>
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

