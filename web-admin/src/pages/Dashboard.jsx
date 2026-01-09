import { useEffect, useState } from 'react';
import { useAlarmStore } from '../stores/alarmStore';
import { useValveStore } from '../stores/valveStore';
import api from '../services/api';
import { 
  Bell, 
  Droplets, 
  Cpu, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Activity
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import clsx from 'clsx';

const COLORS = ['#0ca1eb', '#d946ef', '#22c55e', '#f59e0b'];

function StatCard({ icon: Icon, label, value, subValue, color, trend }) {
  return (
    <div className="glass-card-hover p-6">
      <div className="flex items-start justify-between">
        <div className={clsx(
          'w-12 h-12 rounded-xl flex items-center justify-center',
          color === 'primary' && 'bg-primary-500/20 text-primary-400',
          color === 'accent' && 'bg-accent-500/20 text-accent-400',
          color === 'success' && 'bg-emerald-500/20 text-emerald-400',
          color === 'warning' && 'bg-amber-500/20 text-amber-400',
          color === 'danger' && 'bg-red-500/20 text-red-400'
        )}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <span className={clsx(
            'text-xs font-medium px-2 py-1 rounded-full',
            trend > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
          )}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold text-surface-100">{value}</p>
        <p className="text-surface-500 text-sm mt-1">{label}</p>
        {subValue && (
          <p className="text-surface-400 text-xs mt-2">{subValue}</p>
        )}
      </div>
    </div>
  );
}

function AlarmItem({ alarm }) {
  const priorityStyles = {
    critical: 'border-l-red-500 bg-red-500/5',
    high: 'border-l-orange-500 bg-orange-500/5',
    medium: 'border-l-amber-500 bg-amber-500/5',
    low: 'border-l-blue-500 bg-blue-500/5'
  };

  return (
    <div className={clsx(
      'p-4 rounded-xl border-l-4 transition-all duration-200 hover:bg-surface-800/50',
      priorityStyles[alarm.priority]
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-surface-200">{alarm.message}</p>
          <p className="text-sm text-surface-500 mt-1">
            {alarm.device_name || 'Dispositivo desconocido'} • {alarm.device_location}
          </p>
        </div>
        <span className={clsx(
          'status-badge',
          `priority-${alarm.priority}`
        )}>
          {alarm.priority}
        </span>
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs text-surface-500">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(alarm.triggered_at).toLocaleString()}
        </span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { activeAlarms, statistics: alarmStats, fetchActiveAlarms, fetchStatistics: fetchAlarmStats } = useAlarmStore();
  const { valves, statistics: valveStats, fetchValves, fetchStatistics: fetchValveStats } = useValveStore();
  const [deviceStats, setDeviceStats] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);

  useEffect(() => {
    fetchActiveAlarms();
    fetchAlarmStats();
    fetchValves();
    fetchValveStats();
    fetchDeviceStats();
    fetchSystemHealth();
  }, []);

  const fetchDeviceStats = async () => {
    try {
      const response = await api.get('/devices/statistics');
      setDeviceStats(response.data.data);
    } catch (error) {
      console.error('Error fetching device stats:', error);
    }
  };

  const fetchSystemHealth = async () => {
    try {
      const response = await api.get('/dashboard/health');
      setSystemHealth(response.data.data);
    } catch (error) {
      console.error('Error fetching system health:', error);
    }
  };

  const valveChartData = valveStats ? [
    { name: 'Abiertas', value: valveStats.open },
    { name: 'Cerradas', value: valveStats.closed },
    { name: 'Parcial', value: valveStats.partial },
    { name: 'Error', value: valveStats.error }
  ].filter(d => d.value > 0) : [];

  const activityData = [
    { time: '00:00', alarms: 2, valves: 5 },
    { time: '04:00', alarms: 1, valves: 8 },
    { time: '08:00', alarms: 5, valves: 12 },
    { time: '12:00', alarms: 3, valves: 15 },
    { time: '16:00', alarms: 4, valves: 10 },
    { time: '20:00', alarms: 2, valves: 7 },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-surface-100">Dashboard</h1>
        <p className="text-surface-500 mt-1">Resumen del sistema en tiempo real</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Bell}
          label="Alarmas Activas"
          value={alarmStats?.active || 0}
          subValue={`${alarmStats?.critical_active || 0} críticas`}
          color="danger"
        />
        <StatCard
          icon={Droplets}
          label="Válvulas"
          value={valveStats?.total || 0}
          subValue={`${valveStats?.open || 0} abiertas`}
          color="primary"
        />
        <StatCard
          icon={Cpu}
          label="Dispositivos"
          value={deviceStats?.total || 0}
          subValue={`${deviceStats?.online || 0} en línea`}
          color="success"
        />
        <StatCard
          icon={Activity}
          label="Salud del Sistema"
          value={`${systemHealth?.healthScore || 100}%`}
          subValue={systemHealth?.status === 'healthy' ? 'Funcionando correctamente' : 'Revisar alertas'}
          color={systemHealth?.status === 'healthy' ? 'success' : 'warning'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-lg font-semibold text-surface-200 mb-4">Actividad del Sistema</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={activityData}>
              <defs>
                <linearGradient id="colorAlarms" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorValves" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ca1eb" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0ca1eb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #334155',
                  borderRadius: '8px'
                }}
              />
              <Area type="monotone" dataKey="alarms" stroke="#ef4444" fillOpacity={1} fill="url(#colorAlarms)" />
              <Area type="monotone" dataKey="valves" stroke="#0ca1eb" fillOpacity={1} fill="url(#colorValves)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Valve Status Chart */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-surface-200 mb-4">Estado de Válvulas</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={valveChartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {valveChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #334155',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {valveChartData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                <span className="text-sm text-surface-400">{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Alarms */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-surface-200">Alarmas Activas</h3>
          <a href="/alarms" className="text-primary-400 hover:text-primary-300 text-sm font-medium">
            Ver todas →
          </a>
        </div>
        
        {activeAlarms.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <p className="text-surface-400">No hay alarmas activas</p>
            <p className="text-surface-500 text-sm">El sistema funciona correctamente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeAlarms.slice(0, 5).map(alarm => (
              <AlarmItem key={alarm.id} alarm={alarm} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

