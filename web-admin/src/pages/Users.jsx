import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { 
  Users as UsersIcon, 
  Plus, 
  Edit, 
  Trash2,
  Key,
  Shield,
  Eye,
  UserCog,
  X
} from 'lucide-react';
import clsx from 'clsx';

const roleConfig = {
  admin: { icon: Shield, label: 'Administrador', color: 'text-red-400 bg-red-500/20' },
  operator: { icon: UserCog, label: 'Operador', color: 'text-amber-400 bg-amber-500/20' },
  viewer: { icon: Eye, label: 'Visualizador', color: 'text-blue-400 bg-blue-500/20' }
};

function UserModal({ user, onClose, onSave }) {
  const [formData, setFormData] = useState({
    email: user?.email || '',
    name: user?.name || '',
    password: '',
    role: user?.role || 'viewer',
    is_active: user?.is_active ?? true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (user) {
        await api.put(`/users/${user.id}`, formData);
      } else {
        await api.post('/users', formData);
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-surface-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-md p-6 animate-slide-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-surface-200">
            {user ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h2>
          <button onClick={onClose} className="text-surface-500 hover:text-surface-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-surface-400 mb-2">Nombre</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-surface-400 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input-field"
              required
            />
          </div>

          {!user && (
            <div>
              <label className="block text-sm text-surface-400 mb-2">Contraseña</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input-field"
                required
                minLength={6}
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-surface-400 mb-2">Rol</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="input-field"
            >
              <option value="viewer">Visualizador</option>
              <option value="operator">Operador</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          {user && (
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 rounded border-surface-600 bg-surface-800 text-primary-500 focus:ring-primary-500"
              />
              <label htmlFor="is_active" className="text-sm text-surface-400">
                Usuario activo
              </label>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const { user: currentUser } = useAuthStore();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const handleDelete = async (user) => {
    if (user.id === currentUser.id) {
      alert('No puedes eliminar tu propia cuenta');
      return;
    }
    
    if (confirm(`¿Estás seguro de eliminar al usuario "${user.name}"?`)) {
      try {
        await api.delete(`/users/${user.id}`);
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleResetPassword = async (user) => {
    const newPassword = prompt('Ingresa la nueva contraseña (mínimo 6 caracteres):');
    if (newPassword && newPassword.length >= 6) {
      try {
        await api.post(`/users/${user.id}/reset-password`, { newPassword });
        alert('Contraseña actualizada correctamente');
      } catch (error) {
        alert('Error al actualizar la contraseña');
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-surface-100">Usuarios</h1>
          <p className="text-surface-500 mt-1">Gestión de usuarios del sistema</p>
        </div>
        <button
          onClick={() => { setEditingUser(null); setShowModal(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Agregar Usuario
        </button>
      </div>

      {/* Users Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-800">
                <th className="text-left px-6 py-4 text-surface-400 font-medium">Usuario</th>
                <th className="text-left px-6 py-4 text-surface-400 font-medium">Email</th>
                <th className="text-left px-6 py-4 text-surface-400 font-medium">Rol</th>
                <th className="text-left px-6 py-4 text-surface-400 font-medium">Estado</th>
                <th className="text-right px-6 py-4 text-surface-400 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-surface-500">
                    Cargando usuarios...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-surface-500">
                    No hay usuarios registrados
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const role = roleConfig[user.role];
                  const RoleIcon = role.icon;
                  
                  return (
                    <tr key={user.id} className="border-b border-surface-800/50 hover:bg-surface-800/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center text-white font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-surface-200">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-surface-400">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={clsx('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium', role.color)}>
                          <RoleIcon className="w-3 h-3" />
                          {role.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.is_active ? (
                          <span className="status-online">Activo</span>
                        ) : (
                          <span className="status-offline">Inactivo</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleResetPassword(user)}
                            className="p-2 text-surface-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all"
                            title="Restablecer contraseña"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 text-surface-500 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-all"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            className="p-2 text-surface-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Eliminar"
                            disabled={user.id === currentUser.id}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <UserModal
          user={editingUser}
          onClose={() => { setShowModal(false); setEditingUser(null); }}
          onSave={() => { setShowModal(false); setEditingUser(null); fetchUsers(); }}
        />
      )}
    </div>
  );
}

