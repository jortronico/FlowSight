import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  Database,
  Wifi,
  Save,
  User,
  Lock
} from 'lucide-react';
import clsx from 'clsx';

function SettingsSection({ icon: Icon, title, description, children }) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary-500/20 text-primary-400 flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-surface-200">{title}</h3>
          <p className="text-sm text-surface-500">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function ToggleSetting({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-surface-200">{label}</p>
        <p className="text-sm text-surface-500">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative w-12 h-6 rounded-full transition-colors',
          checked ? 'bg-primary-500' : 'bg-surface-700'
        )}
      >
        <span className={clsx(
          'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
          checked ? 'translate-x-7' : 'translate-x-1'
        )} />
      </button>
    </div>
  );
}

export default function Settings() {
  const { user } = useAuthStore();
  const [settings, setSettings] = useState({
    alarmSound: true,
    emailNotifications: true,
    pushNotifications: false,
    autoRefresh: true,
    darkMode: true
  });

  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    alert('Perfil actualizado (simulado)');
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      alert('Las contraseñas no coinciden');
      return;
    }
    alert('Contraseña actualizada (simulado)');
    setPasswords({ current: '', new: '', confirm: '' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-surface-100">Configuración</h1>
        <p className="text-surface-500 mt-1">Personaliza tu experiencia en FlowSight</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile */}
        <SettingsSection
          icon={User}
          title="Perfil"
          description="Información de tu cuenta"
        >
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-sm text-surface-400 mb-2">Nombre</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm text-surface-400 mb-2">Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="input-field"
              />
            </div>
            <button type="submit" className="btn-primary flex items-center gap-2">
              <Save className="w-4 h-4" />
              Guardar Cambios
            </button>
          </form>
        </SettingsSection>

        {/* Password */}
        <SettingsSection
          icon={Lock}
          title="Contraseña"
          description="Actualiza tu contraseña de acceso"
        >
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm text-surface-400 mb-2">Contraseña Actual</label>
              <input
                type="password"
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm text-surface-400 mb-2">Nueva Contraseña</label>
              <input
                type="password"
                value={passwords.new}
                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm text-surface-400 mb-2">Confirmar Contraseña</label>
              <input
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                className="input-field"
              />
            </div>
            <button type="submit" className="btn-primary flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Cambiar Contraseña
            </button>
          </form>
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection
          icon={Bell}
          title="Notificaciones"
          description="Configura cómo recibir alertas"
        >
          <div className="divide-y divide-surface-800">
            <ToggleSetting
              label="Sonido de alarmas"
              description="Reproducir sonido cuando lleguen alarmas"
              checked={settings.alarmSound}
              onChange={(v) => updateSetting('alarmSound', v)}
            />
            <ToggleSetting
              label="Notificaciones por email"
              description="Recibir alertas críticas por correo"
              checked={settings.emailNotifications}
              onChange={(v) => updateSetting('emailNotifications', v)}
            />
            <ToggleSetting
              label="Notificaciones push"
              description="Recibir notificaciones en el navegador"
              checked={settings.pushNotifications}
              onChange={(v) => updateSetting('pushNotifications', v)}
            />
          </div>
        </SettingsSection>

        {/* System */}
        <SettingsSection
          icon={SettingsIcon}
          title="Sistema"
          description="Preferencias generales"
        >
          <div className="divide-y divide-surface-800">
            <ToggleSetting
              label="Actualización automática"
              description="Refrescar datos en tiempo real"
              checked={settings.autoRefresh}
              onChange={(v) => updateSetting('autoRefresh', v)}
            />
            <ToggleSetting
              label="Modo oscuro"
              description="Usar tema oscuro en la interfaz"
              checked={settings.darkMode}
              onChange={(v) => updateSetting('darkMode', v)}
            />
          </div>
        </SettingsSection>

        {/* Connection Status */}
        <SettingsSection
          icon={Wifi}
          title="Estado de Conexión"
          description="Información de conectividad"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <span className="text-surface-400">API Backend</span>
              <span className="status-online">Conectado</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-surface-400">MQTT Broker</span>
              <span className="status-online">Conectado</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-surface-400">WebSocket</span>
              <span className="status-online">Conectado</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-surface-400">Base de Datos</span>
              <span className="status-online">Conectado</span>
            </div>
          </div>
        </SettingsSection>

        {/* About */}
        <SettingsSection
          icon={Database}
          title="Acerca de"
          description="Información del sistema"
        >
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-2">
              <span className="text-surface-400">Versión</span>
              <span className="text-surface-200 font-mono">1.0.0</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-surface-400">Licencia</span>
              <span className="text-surface-200">MIT</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-surface-400">Entorno</span>
              <span className="text-surface-200">Desarrollo</span>
            </div>
            <div className="pt-4 border-t border-surface-800">
              <p className="text-surface-500">
                FlowSight es un sistema de monitoreo y control IoT para gestión industrial.
              </p>
            </div>
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}

