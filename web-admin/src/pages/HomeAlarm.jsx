import { useEffect, useState } from 'react';
import { useHomeAlarmStore } from '../stores/homeAlarmStore';
import { useAuthStore } from '../stores/authStore';
import socketService from '../services/socket';
import {
  Shield,
  ShieldOff,
  AlertTriangle,
  Volume2,
  VolumeX,
  Lock,
  Unlock,
  Clock,
  Calendar,
  Settings,
  History,
  Power,
  PowerOff,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Trash2,
  RefreshCw
} from 'lucide-react';
import clsx from 'clsx';

export default function HomeAlarm() {
  const { user } = useAuthStore();
  const {
    status,
    sensors,
    schedules,
    history,
    loading,
    error,
    fetchStatus,
    arm,
    disarm,
    activateSiren,
    deactivateSiren,
    resetTamper,
    toggleSensor,
    fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    toggleSchedule,
    setAutoArm,
    fetchHistory
  } = useHomeAlarmStore();

  const [actionLoading, setActionLoading] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    name: '',
    action: 'arm',
    days_of_week: [],
    time: '',
    is_enabled: true
  });

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchStatus();
    fetchHistory(50);

    // Escuchar eventos de Socket.IO
    const handleStatusUpdate = (newStatus) => {
      useHomeAlarmStore.getState().updateStatus(newStatus);
    };

    const handleEvent = (event) => {
      fetchStatus();
      fetchHistory(50);
    };

    socketService.socket?.on('home_alarm:status', handleStatusUpdate);
    socketService.socket?.on('home_alarm:event', handleEvent);

    // Actualizar cada 5 segundos
    const interval = setInterval(() => {
      fetchStatus();
    }, 5000);

    return () => {
      socketService.socket?.off('home_alarm:status', handleStatusUpdate);
      socketService.socket?.off('home_alarm:event', handleEvent);
      clearInterval(interval);
    };
  }, []);

  const handleArm = async () => {
    if (!isAdmin) return;
    setActionLoading(true);
    const result = await arm();
    setActionLoading(false);
    if (result.success) {
      fetchStatus();
    } else {
      alert(result.message);
    }
  };

  const handleDisarm = async () => {
    if (!isAdmin) return;
    setActionLoading(true);
    const result = await disarm();
    setActionLoading(false);
    if (result.success) {
      fetchStatus();
    } else {
      alert(result.message);
    }
  };

  const handleSiren = async () => {
    if (!isAdmin) return;
    setActionLoading(true);
    const result = status?.siren_status === 'on' || status?.siren_status === 'manual'
      ? await deactivateSiren()
      : await activateSiren();
    setActionLoading(false);
    if (result.success) {
      fetchStatus();
    } else {
      alert(result.message);
    }
  };

  const handleResetTamper = async () => {
    if (!isAdmin) return;
    if (!confirm('¿Estás seguro de resetear el estado de tamper?')) return;
    setActionLoading(true);
    const result = await resetTamper();
    setActionLoading(false);
    if (result.success) {
      fetchStatus();
    } else {
      alert(result.message);
    }
  };

  const handleToggleSensor = async (id, enabled) => {
    if (!isAdmin) return;
    const result = await toggleSensor(id, enabled);
    if (result.success) {
      fetchStatus();
    } else {
      alert(result.message);
    }
  };

  const handleSaveSchedule = async () => {
    if (!isAdmin) return;
    const result = editingSchedule
      ? await updateSchedule(editingSchedule.id, scheduleForm)
      : await createSchedule(scheduleForm);
    
    if (result.success) {
      setShowScheduleModal(false);
      setEditingSchedule(null);
      setScheduleForm({
        name: '',
        action: 'arm',
        days_of_week: [],
        time: '',
        is_enabled: true
      });
      fetchStatus();
    } else {
      alert(result.message);
    }
  };

  const handleDeleteSchedule = async (id) => {
    if (!isAdmin) return;
    if (!confirm('¿Estás seguro de eliminar este horario?')) return;
    const result = await deleteSchedule(id);
    if (result.success) {
      fetchStatus();
    } else {
      alert(result.message);
    }
  };

  const handleToggleAutoArm = async (enabled) => {
    if (!isAdmin) return;
    const result = await setAutoArm(enabled);
    if (result.success) {
      fetchStatus();
    } else {
      alert(result.message);
    }
  };

  const alarmStatus = status?.status || 'disarmed';
  const isArmed = alarmStatus === 'armed';
  const isTriggered = alarmStatus === 'triggered';
  const sirenActive = status?.siren_status === 'on' || status?.siren_status === 'manual';
  const tamperTriggered = status?.tamper_triggered;

  const daysOfWeek = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  if (loading && !status) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-primary-400 mx-auto mb-4" />
          <p className="text-surface-400">Cargando estado de alarma...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Alarma del Hogar</h1>
          <p className="text-surface-500 mt-1">Control completo del sistema de seguridad</p>
        </div>
        <button
          onClick={() => fetchStatus()}
          className="glass-card-hover p-3 rounded-xl text-surface-400 hover:text-surface-200 transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Estado Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de Control Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Estado y Controles */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-surface-200">Estado del Sistema</h2>
              <div className={clsx(
                'px-4 py-2 rounded-full font-semibold text-sm',
                isArmed ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                isTriggered ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              )}>
                {isArmed ? '🔴 ARMADA' : isTriggered ? '⚠️ DISPARADA' : '🟢 DESARMADA'}
              </div>
            </div>

            {/* Controles Principales */}
            {isAdmin && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  onClick={handleArm}
                  disabled={actionLoading || isArmed}
                  className={clsx(
                    'flex items-center justify-center gap-3 p-4 rounded-xl font-semibold transition-all',
                    isArmed || actionLoading
                      ? 'bg-surface-800 text-surface-500 cursor-not-allowed'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                  )}
                >
                  <Shield className="w-5 h-5" />
                  Activar Alarma
                </button>
                <button
                  onClick={handleDisarm}
                  disabled={actionLoading || !isArmed}
                  className={clsx(
                    'flex items-center justify-center gap-3 p-4 rounded-xl font-semibold transition-all',
                    !isArmed || actionLoading
                      ? 'bg-surface-800 text-surface-500 cursor-not-allowed'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                  )}
                >
                  <ShieldOff className="w-5 h-5" />
                  Desactivar Alarma
                </button>
              </div>
            )}

            {/* Estado de Sirena y Tamper */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card-hover p-4 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-surface-400">Sirena</span>
                  {isAdmin && (
                    <button
                      onClick={handleSiren}
                      disabled={actionLoading}
                      className={clsx(
                        'p-2 rounded-lg transition-colors',
                        sirenActive
                          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                          : 'bg-surface-800 text-surface-400 hover:bg-surface-700'
                      )}
                    >
                      {sirenActive ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  )}
                </div>
                <div className={clsx(
                  'flex items-center gap-2',
                  sirenActive ? 'text-red-400' : 'text-surface-500'
                )}>
                  {sirenActive ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  <span className="font-semibold">{sirenActive ? 'Activa' : 'Inactiva'}</span>
                </div>
              </div>

              <div className="glass-card-hover p-4 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-surface-400">Tamper</span>
                  {isAdmin && tamperTriggered && (
                    <button
                      onClick={handleResetTamper}
                      disabled={actionLoading}
                      className="p-2 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className={clsx(
                  'flex items-center gap-2',
                  tamperTriggered ? 'text-amber-400' : 'text-emerald-400'
                )}>
                  {tamperTriggered ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                  <span className="font-semibold">{tamperTriggered ? 'Activado' : 'Normal'}</span>
                </div>
              </div>
            </div>

            {/* Configuración Automática */}
            {isAdmin && (
              <div className="mt-6 p-4 bg-surface-800/50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-surface-200">Activación Automática</p>
                    <p className="text-sm text-surface-500">Activar alarma según horarios programados</p>
                  </div>
                  <button
                    onClick={() => handleToggleAutoArm(!status?.auto_arm_enabled)}
                    className={clsx(
                      'relative w-14 h-8 rounded-full transition-colors',
                      status?.auto_arm_enabled ? 'bg-primary-500' : 'bg-surface-700'
                    )}
                  >
                    <span className={clsx(
                      'absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform',
                      status?.auto_arm_enabled ? 'translate-x-6' : 'translate-x-0'
                    )} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sensores */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-surface-200">Sensores</h2>
              <span className="text-sm text-surface-500">
                {sensors?.filter(s => s.is_enabled).length || 0} activos
              </span>
            </div>
            <div className="space-y-3">
              {sensors?.map((sensor) => (
                <div
                  key={sensor.id}
                  className="glass-card-hover p-4 rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={clsx(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      sensor.is_triggered
                        ? 'bg-red-500/20 text-red-400'
                        : sensor.is_enabled
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-surface-700 text-surface-500'
                    )}>
                      {sensor.is_triggered ? (
                        <AlertTriangle className="w-5 h-5" />
                      ) : (
                        <CheckCircle className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-surface-200">{sensor.name}</p>
                      <p className="text-sm text-surface-500">{sensor.location || 'Sin ubicación'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={clsx(
                      'text-xs px-2 py-1 rounded-full',
                      sensor.is_triggered
                        ? 'bg-red-500/20 text-red-400'
                        : sensor.is_enabled
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-surface-700 text-surface-500'
                    )}>
                      {sensor.is_triggered ? 'Disparado' : sensor.is_enabled ? 'Activo' : 'Inactivo'}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => handleToggleSensor(sensor.id, !sensor.is_enabled)}
                        className={clsx(
                          'p-2 rounded-lg transition-colors',
                          sensor.is_enabled
                            ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                            : 'bg-surface-700 text-surface-500 hover:bg-surface-600'
                        )}
                      >
                        {sensor.is_enabled ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {(!sensors || sensors.length === 0) && (
                <p className="text-center text-surface-500 py-8">No hay sensores configurados</p>
              )}
            </div>
          </div>
        </div>

        {/* Panel Lateral */}
        <div className="space-y-6">
          {/* Horarios */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-surface-200">Horarios</h2>
              {isAdmin && (
                <button
                  onClick={() => {
                    setEditingSchedule(null);
                    setScheduleForm({
                      name: '',
                      action: 'arm',
                      days_of_week: [],
                      time: '',
                      is_enabled: true
                    });
                    setShowScheduleModal(true);
                  }}
                  className="p-2 rounded-lg bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="space-y-2">
              {schedules?.slice(0, 5).map((schedule) => (
                <div
                  key={schedule.id}
                  className="glass-card-hover p-3 rounded-xl flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-surface-200 text-sm truncate">{schedule.name}</p>
                    <p className="text-xs text-surface-500">
                      {schedule.days_of_week?.join(', ')} a las {schedule.time}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => {
                            setEditingSchedule(schedule);
                            setScheduleForm({
                              name: schedule.name,
                              action: schedule.action,
                              days_of_week: schedule.days_of_week || [],
                              time: schedule.time,
                              is_enabled: schedule.is_enabled
                            });
                            setShowScheduleModal(true);
                          }}
                          className="p-1.5 rounded-lg text-surface-400 hover:text-primary-400 hover:bg-primary-500/20 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          className="p-1.5 rounded-lg text-surface-400 hover:text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    {isAdmin && (
                      <button
                        onClick={async () => {
                          const result = await toggleSchedule(schedule.id, !schedule.is_enabled);
                          if (!result.success) {
                            alert(result.message);
                          }
                        }}
                        className={clsx(
                          'p-1.5 rounded-lg transition-colors',
                          schedule.is_enabled
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-surface-700 text-surface-500'
                        )}
                      >
                        {schedule.is_enabled ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {(!schedules || schedules.length === 0) && (
                <p className="text-center text-surface-500 py-4 text-sm">No hay horarios configurados</p>
              )}
            </div>
          </div>

          {/* Historial Reciente */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-surface-200">Historial</h2>
              <History className="w-5 h-5 text-surface-500" />
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {history?.slice(0, 10).map((event, idx) => (
                <div key={idx} className="flex items-start gap-3 p-2 rounded-lg hover:bg-surface-800/50 transition-colors">
                  <div className={clsx(
                    'w-2 h-2 rounded-full mt-2',
                    event.event_type === 'armed' ? 'bg-red-400' :
                    event.event_type === 'disarmed' ? 'bg-emerald-400' :
                    event.event_type === 'triggered' ? 'bg-orange-400' :
                    'bg-primary-400'
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-surface-200">{event.message || event.event_type}</p>
                    <p className="text-xs text-surface-500">
                      {new Date(event.created_at).toLocaleString('es-AR')}
                    </p>
                  </div>
                </div>
              ))}
              {(!history || history.length === 0) && (
                <p className="text-center text-surface-500 py-4 text-sm">No hay eventos registrados</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Horario */}
      {showScheduleModal && isAdmin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-surface-200">
                {editingSchedule ? 'Editar Horario' : 'Nuevo Horario'}
              </h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="p-2 rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-800 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-2">Nombre</label>
                <input
                  type="text"
                  value={scheduleForm.name}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })}
                  className="w-full px-4 py-2 bg-surface-800 border border-surface-700 rounded-xl text-surface-200 focus:outline-none focus:border-primary-500"
                  placeholder="Ej: Activar al salir"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-300 mb-2">Acción</label>
                <select
                  value={scheduleForm.action}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, action: e.target.value })}
                  className="w-full px-4 py-2 bg-surface-800 border border-surface-700 rounded-xl text-surface-200 focus:outline-none focus:border-primary-500"
                >
                  <option value="arm">Activar Alarma</option>
                  <option value="disarm">Desactivar Alarma</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-300 mb-2">Días de la Semana</label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map((day, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        const days = scheduleForm.days_of_week || [];
                        const dayNum = idx + 1;
                        if (days.includes(dayNum)) {
                          setScheduleForm({
                            ...scheduleForm,
                            days_of_week: days.filter(d => d !== dayNum)
                          });
                        } else {
                          setScheduleForm({
                            ...scheduleForm,
                            days_of_week: [...days, dayNum]
                          });
                        }
                      }}
                      className={clsx(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                        scheduleForm.days_of_week?.includes(idx + 1)
                          ? 'bg-primary-500 text-white'
                          : 'bg-surface-800 text-surface-400 hover:bg-surface-700'
                      )}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-300 mb-2">Hora</label>
                <input
                  type="time"
                  value={scheduleForm.time}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                  className="w-full px-4 py-2 bg-surface-800 border border-surface-700 rounded-xl text-surface-200 focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-surface-300">Habilitado</label>
                <button
                  onClick={() => setScheduleForm({ ...scheduleForm, is_enabled: !scheduleForm.is_enabled })}
                  className={clsx(
                    'relative w-14 h-8 rounded-full transition-colors',
                    scheduleForm.is_enabled ? 'bg-primary-500' : 'bg-surface-700'
                  )}
                >
                  <span className={clsx(
                    'absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform',
                    scheduleForm.is_enabled ? 'translate-x-6' : 'translate-x-0'
                  )} />
                </button>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveSchedule}
                  className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors"
                >
                  Guardar
                </button>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 bg-surface-800 text-surface-400 rounded-xl font-semibold hover:bg-surface-700 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
