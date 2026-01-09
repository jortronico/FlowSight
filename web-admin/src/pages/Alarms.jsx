import { useEffect, useState } from 'react';
import { useAlarmStore } from '../stores/alarmStore';
import { 
  Bell, 
  Check, 
  CheckCircle, 
  Filter, 
  Clock,
  AlertTriangle,
  AlertOctagon,
  Info,
  X
} from 'lucide-react';
import clsx from 'clsx';

const priorityConfig = {
  critical: { icon: AlertOctagon, color: 'text-red-400', bg: 'bg-red-500/20' },
  high: { icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/20' },
  medium: { icon: Bell, color: 'text-amber-400', bg: 'bg-amber-500/20' },
  low: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/20' }
};

function AlarmCard({ alarm, onAcknowledge, onResolve }) {
  const [resolving, setResolving] = useState(false);
  const [notes, setNotes] = useState('');
  const config = priorityConfig[alarm.priority];
  const Icon = config.icon;

  const handleResolve = async () => {
    const result = await onResolve(alarm.id, notes);
    if (result.success) {
      setResolving(false);
      setNotes('');
    }
  };

  return (
    <div className={clsx(
      'glass-card p-6 transition-all duration-300',
      alarm.status === 'active' && 'border-l-4 border-l-red-500',
      alarm.status === 'acknowledged' && 'border-l-4 border-l-amber-500'
    )}>
      <div className="flex items-start gap-4">
        <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center', config.bg)}>
          <Icon className={clsx('w-6 h-6', config.color)} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-surface-200">{alarm.message}</h3>
              <p className="text-sm text-surface-500 mt-1">
                {alarm.device_name} • {alarm.device_location}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={clsx('status-badge', `priority-${alarm.priority}`)}>
                {alarm.priority}
              </span>
              <span className={clsx(
                'status-badge',
                alarm.status === 'active' && 'status-error',
                alarm.status === 'acknowledged' && 'status-warning',
                alarm.status === 'resolved' && 'status-online'
              )}>
                {alarm.status === 'active' ? 'Activa' : alarm.status === 'acknowledged' ? 'Reconocida' : 'Resuelta'}
              </span>
            </div>
          </div>

          {alarm.value !== null && (
            <div className="flex items-center gap-4 mt-3 text-sm">
              <span className="text-surface-400">
                Valor: <span className="text-surface-200 font-medium">{alarm.value}</span>
              </span>
              {alarm.threshold && (
                <span className="text-surface-400">
                  Umbral: <span className="text-surface-200 font-medium">{alarm.threshold}</span>
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-4 mt-3 text-xs text-surface-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(alarm.triggered_at).toLocaleString()}
            </span>
            {alarm.acknowledged_at && (
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3" />
                Reconocida: {new Date(alarm.acknowledged_at).toLocaleString()}
              </span>
            )}
          </div>

          {/* Actions */}
          {alarm.status !== 'resolved' && (
            <div className="mt-4 pt-4 border-t border-surface-800">
              {resolving ? (
                <div className="space-y-3">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notas de resolución (opcional)"
                    className="input-field text-sm h-20 resize-none"
                  />
                  <div className="flex items-center gap-2">
                    <button onClick={handleResolve} className="btn-primary text-sm py-2">
                      Confirmar Resolución
                    </button>
                    <button onClick={() => setResolving(false)} className="btn-secondary text-sm py-2">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {alarm.status === 'active' && (
                    <button 
                      onClick={() => onAcknowledge(alarm.id)}
                      className="btn-secondary text-sm py-2"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Reconocer
                    </button>
                  )}
                  <button 
                    onClick={() => setResolving(true)}
                    className="btn-primary text-sm py-2"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Resolver
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Alarms() {
  const { alarms, statistics, loading, fetchAlarms, fetchStatistics, acknowledgeAlarm, resolveAlarm } = useAlarmStore();
  const [filter, setFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    fetchAlarms();
    fetchStatistics();
  }, []);

  const filteredAlarms = alarms.filter(alarm => {
    if (filter !== 'all' && alarm.status !== filter) return false;
    if (priorityFilter !== 'all' && alarm.priority !== priorityFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-surface-100">Alarmas</h1>
          <p className="text-surface-500 mt-1">Gestión y monitoreo de alarmas del sistema</p>
        </div>
      </div>

      {/* Stats */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-red-400">{statistics.active}</p>
            <p className="text-surface-500 text-sm">Activas</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-amber-400">{statistics.acknowledged}</p>
            <p className="text-surface-500 text-sm">Reconocidas</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{statistics.resolved}</p>
            <p className="text-surface-500 text-sm">Resueltas (24h)</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-surface-200">{statistics.total}</p>
            <p className="text-surface-500 text-sm">Total (24h)</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-surface-500" />
          <span className="text-surface-400 text-sm">Estado:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {['all', 'active', 'acknowledged', 'resolved'].map(status => (
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
              {status === 'all' ? 'Todas' : status === 'active' ? 'Activas' : status === 'acknowledged' ? 'Reconocidas' : 'Resueltas'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-surface-400 text-sm">Prioridad:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="input-field py-2 px-3 text-sm w-auto"
          >
            <option value="all">Todas</option>
            <option value="critical">Crítica</option>
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Baja</option>
          </select>
        </div>
      </div>

      {/* Alarm List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto" />
          <p className="text-surface-500 mt-4">Cargando alarmas...</p>
        </div>
      ) : filteredAlarms.length === 0 ? (
        <div className="text-center py-12 glass-card">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <p className="text-surface-300 text-lg">No hay alarmas que mostrar</p>
          <p className="text-surface-500">Ajusta los filtros o espera nuevas alarmas</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlarms.map(alarm => (
            <AlarmCard 
              key={alarm.id} 
              alarm={alarm} 
              onAcknowledge={acknowledgeAlarm}
              onResolve={resolveAlarm}
            />
          ))}
        </div>
      )}
    </div>
  );
}

