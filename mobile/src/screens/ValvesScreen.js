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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useValveStore } from '../stores/valveStore';

function ValveCard({ valve, onOpen, onClose, onSetPosition }) {
  const [showSlider, setShowSlider] = useState(false);
  const [targetPosition, setTargetPosition] = useState(valve.current_position);

  const statusColors = {
    open: ['#22c55e', '#16a34a'],
    closed: ['#64748b', '#475569'],
    partial: ['#f59e0b', '#d97706'],
    error: ['#ef4444', '#dc2626'],
  };

  const handleSetPosition = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await onSetPosition(valve.id, targetPosition);
    if (result.success) {
      setShowSlider(false);
    } else {
      Alert.alert('Error', result.message);
    }
  };

  return (
    <View style={styles.valveCard}>
      <View style={styles.valveHeader}>
        <LinearGradient
          colors={statusColors[valve.status] || statusColors.closed}
          style={styles.valveIcon}
        >
          <Ionicons name="water" size={24} color="white" />
        </LinearGradient>
        <View style={styles.valveInfo}>
          <Text style={styles.valveName}>{valve.name}</Text>
          <Text style={styles.valveDevice}>{valve.device_name}</Text>
        </View>
        <View style={[styles.statusBadge, { 
          backgroundColor: valve.status === 'open' ? '#22c55e20' : 
                          valve.status === 'error' ? '#ef444420' : 
                          valve.status === 'partial' ? '#f59e0b20' : '#64748b20' 
        }]}>
          <Text style={[styles.statusText, { 
            color: valve.status === 'open' ? '#22c55e' : 
                   valve.status === 'error' ? '#ef4444' : 
                   valve.status === 'partial' ? '#f59e0b' : '#94a3b8' 
          }]}>
            {valve.status === 'open' ? 'Abierta' : 
             valve.status === 'closed' ? 'Cerrada' : 
             valve.status === 'partial' ? 'Parcial' : 'Error'}
          </Text>
        </View>
      </View>

      {/* Position Bar */}
      <View style={styles.positionContainer}>
        <View style={styles.positionHeader}>
          <Text style={styles.positionLabel}>Posición</Text>
          <Text style={styles.positionValue}>{valve.current_position}%</Text>
        </View>
        <View style={styles.positionBar}>
          <View 
            style={[
              styles.positionFill, 
              { 
                width: `${valve.current_position}%`,
                backgroundColor: statusColors[valve.status]?.[0] || '#64748b'
              }
            ]} 
          />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.quickButton, valve.status === 'open' && styles.quickButtonActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onOpen(valve.id);
          }}
          disabled={valve.status === 'open'}
        >
          <Ionicons name="power" size={18} color={valve.status === 'open' ? '#22c55e' : '#94a3b8'} />
          <Text style={[styles.quickButtonText, valve.status === 'open' && { color: '#22c55e' }]}>
            Abrir
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.quickButton, valve.status === 'closed' && styles.quickButtonActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onClose(valve.id);
          }}
          disabled={valve.status === 'closed'}
        >
          <Ionicons name="power-outline" size={18} color={valve.status === 'closed' ? '#ef4444' : '#94a3b8'} />
          <Text style={[styles.quickButtonText, valve.status === 'closed' && { color: '#ef4444' }]}>
            Cerrar
          </Text>
        </TouchableOpacity>
      </View>

      {/* Slider Toggle */}
      <TouchableOpacity
        style={styles.adjustButton}
        onPress={() => {
          setTargetPosition(valve.current_position);
          setShowSlider(!showSlider);
        }}
      >
        <Ionicons name="options-outline" size={18} color="#0ca1eb" />
        <Text style={styles.adjustButtonText}>
          {showSlider ? 'Cancelar' : 'Ajustar Posición'}
        </Text>
      </TouchableOpacity>

      {/* Position Slider */}
      {showSlider && (
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>Nueva posición: {Math.round(targetPosition)}%</Text>
          <Slider
            style={styles.slider}
            minimumValue={valve.min_position}
            maximumValue={valve.max_position}
            value={targetPosition}
            onValueChange={setTargetPosition}
            minimumTrackTintColor="#0ca1eb"
            maximumTrackTintColor="#334155"
            thumbTintColor="#0ca1eb"
          />
          <TouchableOpacity style={styles.applyButton} onPress={handleSetPosition}>
            <Text style={styles.applyButtonText}>Aplicar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Meta */}
      <View style={styles.valveMeta}>
        <Text style={styles.metaText}>Tipo: {valve.type}</Text>
        <Text style={styles.metaText}>Rango: {valve.min_position}% - {valve.max_position}%</Text>
      </View>
    </View>
  );
}

export default function ValvesScreen() {
  const insets = useSafeAreaInsets();
  const { valves, statistics, loading, fetchValves, fetchStatistics, openValve, closeValve, setPosition } = useValveStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      fetchValves(),
      fetchStatistics(),
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleOpen = async (id) => {
    const result = await openValve(id);
    if (!result.success) {
      Alert.alert('Error', result.message);
    }
  };

  const handleClose = async (id) => {
    const result = await closeValve(id);
    if (!result.success) {
      Alert.alert('Error', result.message);
    }
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
            <Text style={[styles.statValue, { color: '#22c55e' }]}>{statistics.open}</Text>
            <Text style={styles.statLabel}>Abiertas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#94a3b8' }]}>{statistics.closed}</Text>
            <Text style={styles.statLabel}>Cerradas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#f59e0b' }]}>{statistics.partial}</Text>
            <Text style={styles.statLabel}>Parcial</Text>
          </View>
        </View>
      )}

      {/* Valve List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom, 80) }
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0ca1eb" />
        }
      >
        {valves.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="water-outline" size={64} color="#64748b" />
            <Text style={styles.emptyTitle}>No hay válvulas</Text>
            <Text style={styles.emptySubtitle}>Agrega válvulas desde el panel web</Text>
          </View>
        ) : (
          valves.map(valve => (
            <ValveCard
              key={valve.id}
              valve={valve}
              onOpen={handleOpen}
              onClose={handleClose}
              onSetPosition={setPosition}
            />
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
  valveCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
  },
  valveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  valveIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  valveInfo: {
    flex: 1,
  },
  valveName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f1f5f9',
  },
  valveDevice: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
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
  positionContainer: {
    marginBottom: 16,
  },
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  positionLabel: {
    fontSize: 13,
    color: '#94a3b8',
  },
  positionValue: {
    fontSize: 13,
    color: '#f1f5f9',
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  positionBar: {
    height: 8,
    backgroundColor: '#1e293b',
    borderRadius: 4,
    overflow: 'hidden',
  },
  positionFill: {
    height: '100%',
    borderRadius: 4,
  },
  quickActions: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  quickButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    marginHorizontal: 4,
  },
  quickButtonActive: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
  },
  quickButtonText: {
    fontSize: 14,
    color: '#94a3b8',
    marginLeft: 6,
  },
  adjustButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#0ca1eb15',
    marginBottom: 12,
  },
  adjustButtonText: {
    fontSize: 14,
    color: '#0ca1eb',
    marginLeft: 6,
  },
  sliderContainer: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 12,
    textAlign: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  applyButton: {
    backgroundColor: '#0ca1eb',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  applyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  valveMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  metaText: {
    fontSize: 11,
    color: '#64748b',
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

