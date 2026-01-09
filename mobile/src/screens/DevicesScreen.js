import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';

const deviceTypeIcons = {
  controller: 'server',
  sensor: 'speedometer',
  actuator: 'radio',
  gateway: 'wifi',
};

function DeviceCard({ device }) {
  const isOnline = device.status === 'online';
  const Icon = deviceTypeIcons[device.type] || 'hardware-chip';

  return (
    <View style={styles.deviceCard}>
      <View style={styles.deviceHeader}>
        <LinearGradient
          colors={isOnline ? ['#22c55e', '#16a34a'] : ['#64748b', '#475569']}
          style={styles.deviceIcon}
        >
          <Ionicons name={Icon} size={24} color="white" />
        </LinearGradient>
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>{device.name}</Text>
          <Text style={styles.deviceSerial}>{device.serial_number}</Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: isOnline ? '#22c55e' : '#64748b' }]} />
      </View>

      <View style={styles.deviceDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color="#64748b" />
          <Text style={styles.detailText}>{device.location || 'Sin ubicación'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color="#64748b" />
          <Text style={styles.detailText}>
            {device.last_seen 
              ? `Última vez: ${new Date(device.last_seen).toLocaleString()}`
              : 'Sin conexión previa'}
          </Text>
        </View>
      </View>

      <View style={styles.deviceMeta}>
        <Text style={styles.metaText}>{device.type}</Text>
        {device.firmware_version && (
          <Text style={styles.metaText}>v{device.firmware_version}</Text>
        )}
      </View>
    </View>
  );
}

export default function DevicesScreen() {
  const [devices, setDevices] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [devicesRes, statsRes] = await Promise.all([
        api.get('/devices'),
        api.get('/devices/statistics'),
      ]);
      setDevices(devicesRes.data.data);
      setStatistics(statsRes.data.data);
    } catch (error) {
      console.error('Error loading devices:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      {/* Stats */}
      {statistics && (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{statistics.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#22c55e' }]}>{statistics.online}</Text>
            <Text style={styles.statLabel}>En línea</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#94a3b8' }]}>{statistics.offline}</Text>
            <Text style={styles.statLabel}>Sin conexión</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#ef4444' }]}>{statistics.error}</Text>
            <Text style={styles.statLabel}>Error</Text>
          </View>
        </View>
      )}

      {/* Device List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0ca1eb" />
        }
      >
        {devices.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="hardware-chip-outline" size={64} color="#64748b" />
            <Text style={styles.emptyTitle}>No hay dispositivos</Text>
            <Text style={styles.emptySubtitle}>Agrega dispositivos desde el panel web</Text>
          </View>
        ) : (
          devices.map(device => (
            <DeviceCard key={device.id} device={device} />
          ))
        )}
      </ScrollView>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f1f5f9',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  deviceCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f1f5f9',
  },
  deviceSerial: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  deviceDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#94a3b8',
    marginLeft: 8,
  },
  deviceMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  metaText: {
    fontSize: 11,
    color: '#64748b',
    textTransform: 'capitalize',
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
});

