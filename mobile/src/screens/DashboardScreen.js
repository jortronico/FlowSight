import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAlarmStore } from '../stores/alarmStore';
import { useValveStore } from '../stores/valveStore';
import api from '../services/api';

function StatCard({ icon, label, value, subValue, colors }) {
  return (
    <View style={styles.statCard}>
      <LinearGradient
        colors={colors}
        style={styles.statIcon}
      >
        <Ionicons name={icon} size={24} color="white" />
      </LinearGradient>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {subValue && <Text style={styles.statSubValue}>{subValue}</Text>}
    </View>
  );
}

function AlarmItem({ alarm }) {
  const priorityColors = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#f59e0b',
    low: '#3b82f6',
  };

  return (
    <View style={[styles.alarmItem, { borderLeftColor: priorityColors[alarm.priority] }]}>
      <View style={styles.alarmHeader}>
        <Text style={styles.alarmMessage} numberOfLines={2}>{alarm.message}</Text>
        <View style={[styles.priorityBadge, { backgroundColor: priorityColors[alarm.priority] + '20' }]}>
          <Text style={[styles.priorityText, { color: priorityColors[alarm.priority] }]}>
            {alarm.priority}
          </Text>
        </View>
      </View>
      <Text style={styles.alarmDevice}>{alarm.device_name || 'Dispositivo'}</Text>
      <Text style={styles.alarmTime}>
        {new Date(alarm.triggered_at).toLocaleString()}
      </Text>
    </View>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { activeAlarms, statistics: alarmStats, fetchActiveAlarms, fetchStatistics: fetchAlarmStats } = useAlarmStore();
  const { statistics: valveStats, fetchStatistics: fetchValveStats } = useValveStore();
  const [deviceStats, setDeviceStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    await Promise.all([
      fetchActiveAlarms(),
      fetchAlarmStats(),
      fetchValveStats(),
      fetchDeviceStats(),
    ]);
  };

  const fetchDeviceStats = async () => {
    try {
      const response = await api.get('/devices/statistics');
      setDeviceStats(response.data.data);
    } catch (error) {
      console.error('Error fetching device stats:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: Math.max(insets.bottom, 80) }
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#0ca1eb"
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Bienvenido</Text>
        <Text style={styles.title}>Panel de Control</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          icon="notifications"
          label="Alarmas Activas"
          value={alarmStats?.active || 0}
          subValue={`${alarmStats?.critical_active || 0} críticas`}
          colors={['#ef4444', '#dc2626']}
        />
        <StatCard
          icon="water"
          label="Válvulas"
          value={valveStats?.total || 0}
          subValue={`${valveStats?.open || 0} abiertas`}
          colors={['#0ca1eb', '#0080c9']}
        />
        <StatCard
          icon="hardware-chip"
          label="Dispositivos"
          value={deviceStats?.total || 0}
          subValue={`${deviceStats?.online || 0} en línea`}
          colors={['#22c55e', '#16a34a']}
        />
        <StatCard
          icon="pulse"
          label="Sistema"
          value="OK"
          subValue="Funcionando"
          colors={['#d946ef', '#c026d3']}
        />
      </View>

      {/* Active Alarms */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Alarmas Activas</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>Ver todas</Text>
          </TouchableOpacity>
        </View>

        {activeAlarms.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={48} color="#22c55e" />
            <Text style={styles.emptyTitle}>Sin alarmas activas</Text>
            <Text style={styles.emptySubtitle}>El sistema funciona correctamente</Text>
          </View>
        ) : (
          activeAlarms.slice(0, 5).map(alarm => (
            <AlarmItem key={alarm.id} alarm={alarm} />
          ))
        )}
      </View>

      {/* Quick Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resumen 24h</Text>
        <View style={styles.quickStats}>
          <View style={styles.quickStat}>
            <Text style={styles.quickStatValue}>{alarmStats?.total || 0}</Text>
            <Text style={styles.quickStatLabel}>Alarmas totales</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStat}>
            <Text style={styles.quickStatValue}>{alarmStats?.resolved || 0}</Text>
            <Text style={styles.quickStatLabel}>Resueltas</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStat}>
            <Text style={styles.quickStatValue}>{alarmStats?.acknowledged || 0}</Text>
            <Text style={styles.quickStatLabel}>Reconocidas</Text>
          </View>
        </View>
      </View>
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
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: '#64748b',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f1f5f9',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 24,
  },
  statCard: {
    width: '50%',
    padding: 6,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f1f5f9',
  },
  statLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  statSubValue: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
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
  seeAll: {
    fontSize: 14,
    color: '#0ca1eb',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f1f5f9',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  alarmItem: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  alarmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  alarmMessage: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#f1f5f9',
    marginRight: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  alarmDevice: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  alarmTime: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
  },
  quickStat: {
    alignItems: 'center',
    flex: 1,
  },
  quickStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f1f5f9',
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: '#334155',
  },
});

