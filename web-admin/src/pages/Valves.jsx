import { useEffect, useState } from 'react';
import { useValveStore } from '../stores/valveStore';
import { 
  Droplets, 
  ChevronUp, 
  ChevronDown, 
  Power, 
  PowerOff,
  Settings,
  History,
  AlertCircle
} from 'lucide-react';
import clsx from 'clsx';

function ValveCard({ valve, onOpen, onClose, onSetPosition }) {
  const [showSlider, setShowSlider] = useState(false);
  const [targetPosition, setTargetPosition] = useState(valve.current_position);
  const [loading, setLoading] = useState(false);

  const statusColors = {
    open: 'bg-emerald-500',
    closed: 'bg-surface-600',
    partial: 'bg-amber-500',
    error: 'bg-red-500',
    unknown: 'bg-surface-500'
  };

  const handleSetPosition = async () => {
    setLoading(true);
    await onSetPosition(valve.id, targetPosition);
    setLoading(false);
    setShowSlider(false);
  };

  const handleOpen = async () => {
    setLoading(true);
    await onOpen(valve.id);
    setLoading(false);
  };

  const handleClose = async () => {
    setLoading(true);
    await onClose(valve.id);
    setLoading(false);
  };

  return (
    <div className="glass-card-hover p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={clsx(
            'w-12 h-12 rounded-xl flex items-center justify-center',
            valve.status === 'open' ? 'bg-emerald-500/20 text-emerald-400' :
            valve.status === 'error' ? 'bg-red-500/20 text-red-400' :
            'bg-primary-500/20 text-primary-400'
          )}>
            <Droplets className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-surface-200">{valve.name}</h3>
            <p className="text-sm text-surface-500">{valve.device_name}</p>
          </div>
        </div>
        <span className={clsx(
          'status-badge',
          valve.status === 'open' && 'status-online',
          valve.status === 'closed' && 'status-offline',
          valve.status === 'partial' && 'status-warning',
          valve.status === 'error' && 'status-error'
        )}>
          {valve.status === 'open' ? 'Abierta' : 
           valve.status === 'closed' ? 'Cerrada' : 
           valve.status === 'partial' ? 'Parcial' : 'Error'}
        </span>
      </div>

      {/* Position Indicator */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-surface-400">Posición</span>
          <span className="text-surface-200 font-mono">{valve.current_position}%</span>
        </div>
        <div className="h-3 bg-surface-800 rounded-full overflow-hidden">
          <div 
            className={clsx(
              'h-full rounded-full transition-all duration-500',
              statusColors[valve.status]
            )}
            style={{ width: `${valve.current_position}%` }}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={handleOpen}
          disabled={loading || valve.status === 'open'}
          className={clsx(
            'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all',
            valve.status === 'open'
              ? 'bg-emerald-500/20 text-emerald-400 cursor-not-allowed'
              : 'bg-surface-800 text-surface-300 hover:bg-emerald-500/20 hover:text-emerald-400'
          )}
        >
          <Power className="w-4 h-4" />
          <span className="text-sm">Abrir</span>
        </button>
        <button
          onClick={handleClose}
          disabled={loading || valve.status === 'closed'}
          className={clsx(
            'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all',
            valve.status === 'closed'
              ? 'bg-surface-700 text-surface-500 cursor-not-allowed'
              : 'bg-surface-800 text-surface-300 hover:bg-red-500/20 hover:text-red-400'
          )}
        >
          <PowerOff className="w-4 h-4" />
          <span className="text-sm">Cerrar</span>
        </button>
      </div>

      {/* Position Slider */}
      {showSlider ? (
        <div className="p-4 bg-surface-800/50 rounded-xl">
          <label className="block text-sm text-surface-400 mb-2">
            Establecer posición: {targetPosition}%
          </label>
          <input
            type="range"
            min={valve.min_position}
            max={valve.max_position}
            value={targetPosition}
            onChange={(e) => setTargetPosition(parseInt(e.target.value))}
            className="w-full h-2 bg-surface-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
          />
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleSetPosition}
              disabled={loading}
              className="btn-primary text-sm py-2 flex-1"
            >
              {loading ? 'Enviando...' : 'Aplicar'}
            </button>
            <button
              onClick={() => setShowSlider(false)}
              className="btn-secondary text-sm py-2"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowSlider(true)}
          className="w-full flex items-center justify-center gap-2 py-2 bg-surface-800 text-surface-400 rounded-lg hover:bg-surface-700 hover:text-surface-200 transition-all"
        >
          <Settings className="w-4 h-4" />
          <span className="text-sm">Ajustar Posición</span>
        </button>
      )}

      {/* Metadata */}
      <div className="mt-4 pt-4 border-t border-surface-800 text-xs text-surface-500">
        <div className="flex items-center justify-between">
          <span>Tipo: {valve.type}</span>
          <span>Rango: {valve.min_position}% - {valve.max_position}%</span>
        </div>
      </div>
    </div>
  );
}

export default function Valves() {
  const { valves, statistics, loading, fetchValves, fetchStatistics, openValve, closeValve, setPosition } = useValveStore();
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchValves();
    fetchStatistics();
  }, []);

  const filteredValves = valves.filter(valve => {
    if (filter === 'all') return true;
    return valve.status === filter;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-surface-100">Control de Válvulas</h1>
        <p className="text-surface-500 mt-1">Monitoreo y control de válvulas del sistema</p>
      </div>

      {/* Stats */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-surface-200">{statistics.total}</p>
            <p className="text-surface-500 text-sm">Total</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{statistics.open}</p>
            <p className="text-surface-500 text-sm">Abiertas</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-surface-400">{statistics.closed}</p>
            <p className="text-surface-500 text-sm">Cerradas</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-amber-400">{statistics.partial}</p>
            <p className="text-surface-500 text-sm">Parciales</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-red-400">{statistics.error}</p>
            <p className="text-surface-500 text-sm">Error</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['all', 'open', 'closed', 'partial', 'error'].map(status => (
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
            {status === 'all' ? 'Todas' : 
             status === 'open' ? 'Abiertas' : 
             status === 'closed' ? 'Cerradas' : 
             status === 'partial' ? 'Parciales' : 'Error'}
          </button>
        ))}
      </div>

      {/* Valve Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto" />
          <p className="text-surface-500 mt-4">Cargando válvulas...</p>
        </div>
      ) : filteredValves.length === 0 ? (
        <div className="text-center py-12 glass-card">
          <AlertCircle className="w-16 h-16 text-surface-600 mx-auto mb-4" />
          <p className="text-surface-300 text-lg">No hay válvulas que mostrar</p>
          <p className="text-surface-500">Ajusta los filtros o agrega nuevas válvulas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredValves.map(valve => (
            <ValveCard 
              key={valve.id} 
              valve={valve}
              onOpen={openValve}
              onClose={closeValve}
              onSetPosition={setPosition}
            />
          ))}
        </div>
      )}
    </div>
  );
}

