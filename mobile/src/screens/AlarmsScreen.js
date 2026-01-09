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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAlarmStore } from '../stores/alarmStore';

const priorityColors = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#3b82f6',
};

function FilterButton({ label, active, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.filterButton, active && styles.filterButtonActive]}
      onPress={onPress}
    >
      <Text style={[styles.filterText, active && styles.filterTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function AlarmCard({ alarm, onAcknowledge, onResolve }) {
  const color = priorityColors[alarm.priority];

  return (
    <View style={[styles.alarmCard, { borderLeftColor: color }]}>
      <View style={styles.alarmHeader}>
        <View style={[styles.priorityIcon, { backgroundColor: color + '20' }]}>
          <Ionicons
            name={alarm.priority === 'critical' ? 'warning' : 'notifications'}
            size={20}
            color={color}
          />
        </View>
        <View style={styles.alarmInfo}>
          <Text style={styles.alarmMessage}>{alarm.message}</Text>
          <Text style={styles.alarmDevice}>
            {alarm.device_name} • {alarm.device_location}
          </Text>
        </View>
      </View>

      {alarm.value !== null && (
        <View style={styles.alarmValues}>
          <Text style={styles.valueLabel}>
            Valor: <Text style={styles.valueText}>{alarm.value}</Text>
          </Text>
          {alarm.threshold && (
            <Text style={styles.valueLabel}>
              Umbral: <Text style={styles.valueText}>{alarm.threshold}</Text>
            </Text>
          )}
        </View>
      )}

      <View style={styles.alarmMeta}>
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={14} color="#64748b" />
          <Text style={styles.metaText}>
            {new Date(alarm.triggered_at).toLocaleString()}
          </Text>
        </View>
        <View style={[styles.statusBadge, { 
          backgroundColor: alarm.status === 'active' ? '#ef444420' : 
                          alarm.status === 'acknowledged' ? '#f59e0b20' : '#22c55e20' 
        }]}>
          <Text style={[styles.statusText, { 
            color: alarm.status === 'active' ? '#ef4444' : 
                   alarm.status === 'acknowledged' ? '#f59e0b' : '#22c55e' 
          }]}>
            {alarm.status === 'active' ? 'Activa' : 
             alarm.status === 'acknowledged' ? 'Reconocida' : 'Resuelta'}
          </Text>
        </View>
      </View>

      {alarm.status !== 'resolved' && (
        <View style={styles.alarmActions}>
          {alarm.status === 'active' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onAcknowledge(alarm.id)}
            >
              <Ionicons name="checkmark" size={18} color="#f59e0b" />
              <Text style={[styles.actionText, { color: '#f59e0b' }]}>Reconocer</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonPrimary]}
            onPress={() => onResolve(alarm)}
          >
            <Ionicons name="checkmark-done" size={18} color="#0ca1eb" />
            <Text style={[styles.actionText, { color: '#0ca1eb' }]}>Resolver</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function AlarmsScreen() {
  const { alarms, statistics, loading, fetchAlarms, fetchStatistics, acknowledgeAlarm, resolveAlarm } = useAlarmStore();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [resolveModal, setResolveModal] = useState(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      fetchAlarms(),
      fetchStatistics(),
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAcknowledge = async (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await acknowledgeAlarm(id);
    if (result.success) {
      Alert.alert('Éxito', 'Alarma reconocida');
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const handleResolve = async () => {
    if (!resolveModal) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await resolveAlarm(resolveModal.id, notes);
    
    if (result.success) {
      Alert.alert('Éxito', 'Alarma resuelta');
      setResolveModal(null);
      setNotes('');
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const filteredAlarms = alarms.filter(alarm => {
    if (filter === 'all') return true;
    return alarm.status === filter;
  });

  return (
    <View style={styles.container}>
      {/* Stats */}
      {statistics && (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#ef4444' }]}>{statistics.active}</Text>
            <Text style={styles.statLabel}>Activas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#f59e0b' }]}>{statistics.acknowledged}</Text>
            <Text style={styles.statLabel}>Reconocidas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#22c55e' }]}>{statistics.resolved}</Text>
            <Text style={styles.statLabel}>Resueltas</Text>
          </View>
        </View>
      )}

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
        <FilterButton label="Todas" active={filter === 'all'} onPress={() => setFilter('all')} />
        <FilterButton label="Activas" active={filter === 'active'} onPress={() => setFilter('active')} />
        <FilterButton label="Reconocidas" active={filter === 'acknowledged'} onPress={() => setFilter('acknowledged')} />
        <FilterButton label="Resueltas" active={filter === 'resolved'} onPress={() => setFilter('resolved')} />
      </ScrollView>

      {/* Alarm List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0ca1eb" />
        }
      >
        {filteredAlarms.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={64} color="#22c55e" />
            <Text style={styles.emptyTitle}>No hay alarmas</Text>
            <Text style={styles.emptySubtitle}>Ajusta los filtros o espera nuevas alarmas</Text>
          </View>
        ) : (
          filteredAlarms.map(alarm => (
            <AlarmCard
              key={alarm.id}
              alarm={alarm}
              onAcknowledge={handleAcknowledge}
              onResolve={(alarm) => setResolveModal(alarm)}
            />
          ))
        )}
      </ScrollView>

      {/* Resolve Modal */}
      <Modal
        visible={!!resolveModal}
        transparent
        animationType="fade"
        onRequestClose={() => setResolveModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Resolver Alarma</Text>
            <Text style={styles.modalSubtitle}>{resolveModal?.message}</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Notas de resolución (opcional)"
              placeholderTextColor="#64748b"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => { setResolveModal(null); setNotes(''); }}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={handleResolve}
              >
                <Text style={styles.modalButtonPrimaryText}>Resolver</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  filters: {
    flexGrow: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#0ca1eb20',
    borderWidth: 1,
    borderColor: '#0ca1eb50',
  },
  filterText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  filterTextActive: {
    color: '#0ca1eb',
    fontWeight: '500',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  alarmCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
    borderLeftWidth: 4,
  },
  alarmHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  priorityIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alarmInfo: {
    flex: 1,
  },
  alarmMessage: {
    fontSize: 15,
    fontWeight: '500',
    color: '#f1f5f9',
    marginBottom: 4,
  },
  alarmDevice: {
    fontSize: 13,
    color: '#94a3b8',
  },
  alarmValues: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  valueLabel: {
    fontSize: 13,
    color: '#64748b',
    marginRight: 16,
  },
  valueText: {
    color: '#f1f5f9',
    fontWeight: '500',
  },
  alarmMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  alarmActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  actionButtonPrimary: {
    backgroundColor: '#0ca1eb10',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f1f5f9',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    color: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#334155',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 20,
  },
  modalButtonSecondary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#334155',
    marginRight: 8,
    alignItems: 'center',
  },
  modalButtonSecondaryText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '500',
  },
  modalButtonPrimary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#0ca1eb',
    marginLeft: 8,
    alignItems: 'center',
  },
  modalButtonPrimaryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

