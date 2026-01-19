import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useHomeAlarmStore } from '../stores/homeAlarmStore';
import { socketService } from '../services/socket';

function SensorCard({ sensor, onToggle }) {
  const getSensorIcon = () => {
    switch (sensor.sensor_type) {
      case 'stair':
        return 'footsteps';
      case 'motion':
        return 'radio';
      case 'door':
        return 'door';
      case 'window':
        return 'albums';
      default:
        return 'pulse';
    }
  };

  return (
    <View style={styles.sensorCard}>
      <View style={styles.sensorHeader}>
        <View style={[styles.sensorIcon, { 
          backgroundColor: sensor.is_enabled 
            ? (sensor.is_triggered ? '#ef444420' : '#22c55e20') 
            : '#64748b20' 
        }]}>
          <Ionicons 
            name={getSensorIcon()} 
            size={20} 
            color={sensor.is_enabled 
              ? (sensor.is_triggered ? '#ef4444' : '#22c55e') 
              : '#64748b'
            } 
          />
        </View>
        <View style={styles.sensorInfo}>
          <Text style={styles.sensorName}>{sensor.name}</Text>
          <Text style={styles.sensorLocation}>{sensor.location || 'Sin ubicación'}</Text>
        </View>
        <Switch
          value={sensor.is_enabled}
          onValueChange={(enabled) => onToggle(sensor.id, enabled)}
          trackColor={{ false: '#334155', true: '#22c55e50' }}
          thumbColor={sensor.is_enabled ? '#22c55e' : '#64748b'}
        />
      </View>
      {sensor.is_triggered && (
        <View style={styles.sensorAlert}>
          <Ionicons name="warning" size={14} color="#ef4444" />
          <Text style={styles.sensorAlertText}>Sensor activado</Text>
        </View>
      )}
    </View>
  );
}

function ScheduleCard({ schedule, onEdit, onDelete, onToggle }) {
  const daysNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const days = schedule.days_of_week.split(',').map(d => parseInt(d.trim()));

  return (
    <View style={styles.scheduleCard}>
      <View style={styles.scheduleHeader}>
        <View style={styles.scheduleInfo}>
          <Text style={styles.scheduleName}>{schedule.name}</Text>
          <View style={styles.scheduleTime}>
            <Ionicons name="time-outline" size={14} color="#64748b" />
            <Text style={styles.scheduleTimeText}>{schedule.time}</Text>
            <Text style={styles.scheduleAction}>
              {schedule.action === 'arm' ? 'Activar' : 'Desactivar'}
            </Text>
          </View>
          <View style={styles.scheduleDays}>
            {daysNames.map((day, idx) => (
              <View
                key={idx}
                style={[
                  styles.scheduleDay,
                  days.includes(idx + 1) && styles.scheduleDayActive
                ]}
              >
                <Text
                  style={[
                    styles.scheduleDayText,
                    days.includes(idx + 1) && styles.scheduleDayTextActive
                  ]}
                >
                  {day[0]}
                </Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.scheduleActions}>
          <Switch
            value={schedule.is_enabled}
            onValueChange={(enabled) => onToggle(schedule.id, enabled)}
            trackColor={{ false: '#334155', true: '#0ca1eb50' }}
            thumbColor={schedule.is_enabled ? '#0ca1eb' : '#64748b'}
          />
          <TouchableOpacity onPress={() => onEdit(schedule)} style={styles.scheduleEditBtn}>
            <Ionicons name="pencil" size={18} color="#0ca1eb" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(schedule.id)} style={styles.scheduleDeleteBtn}>
            <Ionicons name="trash" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function HomeAlarmScreen() {
  const insets = useSafeAreaInsets();
  const {
    status,
    sensors,
    schedules,
    loading,
    fetchStatus,
    arm,
    disarm,
    activateSiren,
    deactivateSiren,
    toggleSensor,
    fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    toggleSchedule,
    setAutoArm,
  } = useHomeAlarmStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    name: '',
    action: 'arm',
    time: '08:00',
    days_of_week: '1,2,3,4,5',
    is_enabled: true,
  });
  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5]);

  const daysNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  useEffect(() => {
    loadData();
    
    // Escuchar eventos de Socket.IO
    socketService.on('home_alarm:status', (data) => {
      useHomeAlarmStore.getState().updateStatus(data);
    });

    socketService.on('home_alarm:event', (data) => {
      // Recargar datos cuando hay un evento
      loadData();
    });

    socketService.on('home_alarm:sensor_updated', (data) => {
      useHomeAlarmStore.getState().updateSensor(data);
    });

    return () => {
      socketService.off('home_alarm:status');
      socketService.off('home_alarm:event');
      socketService.off('home_alarm:sensor_updated');
    };
  }, []);

  const loadData = async () => {
    await Promise.all([
      fetchStatus(),
      fetchSchedules(),
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleArm = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Activar Alarma',
      '¿Estás seguro de que deseas activar la alarma?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Activar',
          style: 'destructive',
          onPress: async () => {
            const result = await arm();
            if (result.success) {
              Alert.alert('Éxito', result.message);
            } else {
              Alert.alert('Error', result.message);
            }
          },
        },
      ]
    );
  };

  const handleDisarm = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await disarm();
    if (result.success) {
      Alert.alert('Éxito', result.message);
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const handleSiren = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (status?.siren_status === 'off') {
      Alert.alert(
        'Activar Sirena',
        '¿Activar la sirena manualmente?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Activar',
            style: 'destructive',
            onPress: async () => {
              const result = await activateSiren();
              if (!result.success) {
                Alert.alert('Error', result.message);
              }
            },
          },
        ]
      );
    } else {
      const result = await deactivateSiren();
      if (!result.success) {
        Alert.alert('Error', result.message);
      }
    }
  };

  const handleToggleSensor = async (id, enabled) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await toggleSensor(id, enabled);
    if (!result.success) {
      Alert.alert('Error', result.message);
    }
  };

  const handleSaveSchedule = async () => {
    if (!scheduleForm.name.trim()) {
      Alert.alert('Error', 'El nombre es requerido');
      return;
    }

    const daysStr = selectedDays.sort((a, b) => a - b).join(',');

    const result = editingSchedule
      ? await updateSchedule(editingSchedule.id, {
          ...scheduleForm,
          days_of_week: daysStr,
        })
      : await createSchedule({
          ...scheduleForm,
          days_of_week: daysStr,
        });

    if (result.success) {
      setShowScheduleModal(false);
      setEditingSchedule(null);
      setScheduleForm({
        name: '',
        action: 'arm',
        time: '08:00',
        days_of_week: '1,2,3,4,5',
        is_enabled: true,
      });
      setSelectedDays([1, 2, 3, 4, 5]);
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const handleEditSchedule = (schedule) => {
    setEditingSchedule(schedule);
    setScheduleForm({
      name: schedule.name,
      action: schedule.action,
      time: schedule.time.substring(0, 5),
      days_of_week: schedule.days_of_week,
      is_enabled: schedule.is_enabled,
    });
    setSelectedDays(schedule.days_of_week.split(',').map(d => parseInt(d.trim())));
    setShowScheduleModal(true);
  };

  const handleDeleteSchedule = (id) => {
    Alert.alert(
      'Eliminar Horario',
      '¿Estás seguro de que deseas eliminar este horario?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteSchedule(id);
            if (!result.success) {
              Alert.alert('Error', result.message);
            }
          },
        },
      ]
    );
  };

  const toggleDay = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day].sort((a, b) => a - b)
    );
  };

  const getStatusColor = () => {
    if (!status) return ['#64748b', '#475569'];
    switch (status.status) {
      case 'armed':
        return ['#ef4444', '#dc2626'];
      case 'triggered':
        return ['#f97316', '#ea580c'];
      case 'arming':
      case 'disarming':
        return ['#f59e0b', '#d97706'];
      default:
        return ['#22c55e', '#16a34a'];
    }
  };

  const getStatusText = () => {
    if (!status) return 'Desconocido';
    switch (status.status) {
      case 'armed':
        return 'Activada';
      case 'triggered':
        return 'Activada';
      case 'arming':
        return 'Activando...';
      case 'disarming':
        return 'Desactivando...';
      default:
        return 'Desactivada';
    }
  };

  if (!status) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: Math.max(insets.bottom, 80) }
      ]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0ca1eb" />
      }
    >
      {/* Estado Principal */}
      <View style={styles.mainStatusCard}>
        <LinearGradient colors={getStatusColor()} style={styles.statusGradient}>
          <Ionicons
            name={status.status === 'armed' || status.status === 'triggered' ? 'shield' : 'shield-outline'}
            size={48}
            color="white"
          />
          <Text style={styles.statusTitle}>{getStatusText()}</Text>
          {status.last_armed_at && (
            <Text style={styles.statusSubtitle}>
              Activada: {new Date(status.last_armed_at).toLocaleString()}
            </Text>
          )}
        </LinearGradient>

        <View style={styles.statusActions}>
          {status.status === 'armed' || status.status === 'triggered' ? (
            <TouchableOpacity style={styles.disarmButton} onPress={handleDisarm}>
              <Ionicons name="lock-open" size={24} color="white" />
              <Text style={styles.disarmButtonText}>Desactivar</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.armButton} onPress={handleArm}>
              <Ionicons name="lock-closed" size={24} color="white" />
              <Text style={styles.armButtonText}>Activar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Control de Sirena */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sirena</Text>
          <TouchableOpacity
            style={[
              styles.sirenButton,
              status.siren_status !== 'off' && styles.sirenButtonActive
            ]}
            onPress={handleSiren}
          >
            <Ionicons
              name={status.siren_status !== 'off' ? 'volume-high' : 'volume-mute'}
              size={20}
              color={status.siren_status !== 'off' ? '#ef4444' : '#64748b'}
            />
            <Text
              style={[
                styles.sirenButtonText,
                status.siren_status !== 'off' && styles.sirenButtonTextActive
              ]}
            >
              {status.siren_status !== 'off' ? 'Desactivar' : 'Activar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sensores */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sensores</Text>
        </View>
        {sensors.length === 0 ? (
          <Text style={styles.emptyText}>No hay sensores configurados</Text>
        ) : (
          sensors.map((sensor) => (
            <SensorCard
              key={sensor.id}
              sensor={sensor}
              onToggle={handleToggleSensor}
            />
          ))
        )}
      </View>

      {/* Horarios Automáticos */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Horarios Automáticos</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setEditingSchedule(null);
              setScheduleForm({
                name: '',
                action: 'arm',
                time: '08:00',
                days_of_week: '1,2,3,4,5',
                is_enabled: true,
              });
              setSelectedDays([1, 2, 3, 4, 5]);
              setShowScheduleModal(true);
            }}
          >
            <Ionicons name="add" size={20} color="#0ca1eb" />
          </TouchableOpacity>
        </View>

        <View style={styles.autoArmToggle}>
          <View style={styles.autoArmInfo}>
            <Text style={styles.autoArmLabel}>Activación Automática</Text>
            <Text style={styles.autoArmDescription}>
              Permite activar/desactivar según horarios
            </Text>
          </View>
          <Switch
            value={status.auto_arm_enabled}
            onValueChange={async (enabled) => {
              const result = await setAutoArm(enabled);
              if (!result.success) {
                Alert.alert('Error', result.message);
              }
            }}
            trackColor={{ false: '#334155', true: '#0ca1eb50' }}
            thumbColor={status.auto_arm_enabled ? '#0ca1eb' : '#64748b'}
          />
        </View>

        {schedules.length === 0 ? (
          <Text style={styles.emptyText}>No hay horarios configurados</Text>
        ) : (
          schedules.map((schedule) => (
            <ScheduleCard
              key={schedule.id}
              schedule={schedule}
              onEdit={handleEditSchedule}
              onDelete={handleDeleteSchedule}
              onToggle={async (id, enabled) => {
                const result = await toggleSchedule(id, enabled);
                if (!result.success) {
                  Alert.alert('Error', result.message);
                }
              }}
            />
          ))
        )}
      </View>

      {/* Modal de Horario */}
      <Modal
        visible={showScheduleModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowScheduleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingSchedule ? 'Editar Horario' : 'Nuevo Horario'}
              </Text>
              <TouchableOpacity onPress={() => setShowScheduleModal(false)}>
                <Ionicons name="close" size={24} color="#f1f5f9" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Nombre del horario"
              placeholderTextColor="#64748b"
              value={scheduleForm.name}
              onChangeText={(text) => setScheduleForm({ ...scheduleForm, name: text })}
            />

            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, styles.timeInput]}
                placeholder="HH:MM"
                placeholderTextColor="#64748b"
                value={scheduleForm.time}
                onChangeText={(text) => setScheduleForm({ ...scheduleForm, time: text })}
              />

              <View style={styles.actionSelector}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    scheduleForm.action === 'arm' && styles.actionButtonActive
                  ]}
                  onPress={() => setScheduleForm({ ...scheduleForm, action: 'arm' })}
                >
                  <Text
                    style={[
                      styles.actionButtonText,
                      scheduleForm.action === 'arm' && styles.actionButtonTextActive
                    ]}
                  >
                    Activar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    scheduleForm.action === 'disarm' && styles.actionButtonActive
                  ]}
                  onPress={() => setScheduleForm({ ...scheduleForm, action: 'disarm' })}
                >
                  <Text
                    style={[
                      styles.actionButtonText,
                      scheduleForm.action === 'disarm' && styles.actionButtonTextActive
                    ]}
                  >
                    Desactivar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.daysLabel}>Días de la semana:</Text>
            <View style={styles.daysSelector}>
              {daysNames.map((day, idx) => {
                const dayNum = idx + 1;
                const isSelected = selectedDays.includes(dayNum);
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.dayButton,
                      isSelected && styles.dayButtonActive
                    ]}
                    onPress={() => toggleDay(dayNum)}
                  >
                    <Text
                      style={[
                        styles.dayButtonText,
                        isSelected && styles.dayButtonTextActive
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowScheduleModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveSchedule}>
                <Text style={styles.saveButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    padding: 16,
  },
  loadingText: {
    color: '#f1f5f9',
    textAlign: 'center',
    marginTop: 50,
  },
  mainStatusCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  statusGradient: {
    padding: 24,
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 12,
  },
  statusSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
  },
  statusActions: {
    padding: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
  },
  armButton: {
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  armButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  disarmButton: {
    backgroundColor: '#22c55e',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disarmButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  section: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f1f5f9',
  },
  sirenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sirenButtonActive: {
    borderColor: '#ef4444',
    backgroundColor: '#ef444420',
  },
  sirenButtonText: {
    color: '#64748b',
    marginLeft: 6,
    fontSize: 14,
  },
  sirenButtonTextActive: {
    color: '#ef4444',
  },
  sensorCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  sensorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sensorIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sensorInfo: {
    flex: 1,
  },
  sensorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f1f5f9',
  },
  sensorLocation: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  sensorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  sensorAlertText: {
    fontSize: 12,
    color: '#ef4444',
    marginLeft: 6,
  },
  autoArmToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 12,
    marginBottom: 16,
  },
  autoArmInfo: {
    flex: 1,
  },
  autoArmLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f1f5f9',
  },
  autoArmDescription: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  scheduleCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 8,
  },
  scheduleTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  scheduleTimeText: {
    fontSize: 14,
    color: '#f1f5f9',
    marginLeft: 6,
    marginRight: 8,
    fontWeight: '500',
  },
  scheduleAction: {
    fontSize: 12,
    color: '#64748b',
  },
  scheduleDays: {
    flexDirection: 'row',
    gap: 4,
  },
  scheduleDay: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scheduleDayActive: {
    backgroundColor: '#0ca1eb',
  },
  scheduleDayText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  scheduleDayTextActive: {
    color: 'white',
  },
  scheduleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scheduleEditBtn: {
    padding: 8,
  },
  scheduleDeleteBtn: {
    padding: 8,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#0ca1eb20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
    padding: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f1f5f9',
  },
  input: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 12,
    padding: 14,
    color: '#f1f5f9',
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  timeInput: {
    flex: 1,
  },
  actionSelector: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  actionButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  actionButtonActive: {
    backgroundColor: '#0ca1eb20',
    borderColor: '#0ca1eb',
  },
  actionButtonText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtonTextActive: {
    color: '#0ca1eb',
  },
  daysLabel: {
    fontSize: 14,
    color: '#f1f5f9',
    marginBottom: 12,
    fontWeight: '500',
  },
  daysSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  dayButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: '#0ca1eb20',
    borderColor: '#0ca1eb',
  },
  dayButtonText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  dayButtonTextActive: {
    color: '#0ca1eb',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#0ca1eb',
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
