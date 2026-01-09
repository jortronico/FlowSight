import { useEffect, useState } from 'react';
import api from '../services/api';
import { 
  Cpu, 
  Wifi, 
  WifiOff, 
  Plus, 
  Edit, 
  Trash2,
  MapPin,
  Clock,
  Server,
  Radio,
  Gauge
} from 'lucide-react';
import clsx from 'clsx';

const deviceTypeIcons = {
  controller: Server,
  sensor: Gauge,
  actuator: Radio,
  gateway: Wifi
};

function DeviceCard({ device, onEdit, onDelete }) {
  const Icon = deviceTypeIcons[device.type] || Cpu;
  const isOnline = device.status === 'online';

  return (
    <div className="glass-card-hover p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={clsx(
            'w-12 h-12 rounded-xl flex items-center justify-center',
            isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-surface-700 text-surface-500'
          )}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-surface-200">{device.name}</h3>
            <p className="text-sm text-surface-500 font-mono">{device.serial_number}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <span className="status-online">
              <Wifi className="w-3 h-3" /> Online
            </span>
          ) : (
            <span className="status-offline">
              <WifiOff className="w-3 h-3" /> Offline
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-surface-400">
          <MapPin className="w-4 h-4" />
          <span>{device.location || 'Sin ubicación'}</span>
        </div>
        {device.last_seen && (
          <div className="flex items-center gap-2 text-sm text-surface-500">
            <Clock className="w-4 h-4" />
            <span>Última vez: {new Date(device.last_seen).toLocaleString()}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-surface-800">
        <span className="text-xs text-surface-500 capitalize">{device.type}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(device)}
            className="p-2 text-surface-500 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-all"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(device)}
            className="p-2 text-surface-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);

  useEffect(() => {
    fetchDevices();
    fetchStatistics();
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await api.get('/devices');
      setDevices(response.data.data);
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/devices/statistics');
      setStatistics(response.data.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleEdit = (device) => {
    setEditingDevice(device);
    setShowModal(true);
  };

  const handleDelete = async (device) => {
    if (confirm(`¿Estás seguro de eliminar el dispositivo "${device.name}"?`)) {
      try {
        await api.delete(`/devices/${device.id}`);
        fetchDevices();
        fetchStatistics();
      } catch (error) {
        console.error('Error deleting device:', error);
      }
    }
  };

  const filteredDevices = devices.filter(device => {
    if (filter === 'all') return true;
    return device.status === filter;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-surface-100">Dispositivos</h1>
          <p className="text-surface-500 mt-1">Gestión de dispositivos IoT del sistema</p>
        </div>
        <button
          onClick={() => { setEditingDevice(null); setShowModal(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Agregar Dispositivo
        </button>
      </div>

      {/* Stats */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-surface-200">{statistics.total}</p>
            <p className="text-surface-500 text-sm">Total</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{statistics.online}</p>
            <p className="text-surface-500 text-sm">En Línea</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-surface-400">{statistics.offline}</p>
            <p className="text-surface-500 text-sm">Sin Conexión</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-red-400">{statistics.error}</p>
            <p className="text-surface-500 text-sm">Con Error</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['all', 'online', 'offline', 'error'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              filter === status
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                : 'bg-surface-800 text-surface-400 hover:bg-surface-700'
            )}
          >
            {status === 'all' ? 'Todos' : 
             status === 'online' ? 'En Línea' : 
             status === 'offline' ? 'Sin Conexión' : 'Error'}
          </button>
        ))}
      </div>

      {/* Device Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto" />
          <p className="text-surface-500 mt-4">Cargando dispositivos...</p>
        </div>
      ) : filteredDevices.length === 0 ? (
        <div className="text-center py-12 glass-card">
          <Cpu className="w-16 h-16 text-surface-600 mx-auto mb-4" />
          <p className="text-surface-300 text-lg">No hay dispositivos</p>
          <p className="text-surface-500">Agrega tu primer dispositivo IoT</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDevices.map(device => (
            <DeviceCard 
              key={device.id} 
              device={device}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

