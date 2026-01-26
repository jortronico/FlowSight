import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../stores/authStore';
import { API_BASE_URL } from '../config/api';

function SettingItem({ icon, label, description, children }) {
  return (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={20} color="#0ca1eb" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description && <Text style={styles.settingDescription}>{description}</Text>}
      </View>
      {children}
    </View>
  );
}

function SettingToggle({ icon, label, description, value, onValueChange }) {
  return (
    <SettingItem icon={icon} label={label} description={description}>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#334155', true: '#0ca1eb50' }}
        thumbColor={value ? '#0ca1eb' : '#64748b'}
      />
    </SettingItem>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const [settings, setSettings] = useState({
    notifications: true,
    sound: true,
    vibration: true,
    autoRefresh: true,
  });

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesión', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={[
        styles.content,
        { paddingBottom: Math.max(insets.bottom, 80) }
      ]}
    >
      {/* User Profile */}
      <View style={styles.profileCard}>
        <LinearGradient
          colors={['#0ca1eb', '#d946ef']}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </LinearGradient>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.name}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role}</Text>
          </View>
        </View>
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notificaciones</Text>
        
        <SettingToggle
          icon="notifications"
          label="Notificaciones Push"
          description="Recibir alertas de alarmas"
          value={settings.notifications}
          onValueChange={(v) => updateSetting('notifications', v)}
        />
        
        <SettingToggle
          icon="volume-high"
          label="Sonido"
          description="Reproducir sonido en alertas"
          value={settings.sound}
          onValueChange={(v) => updateSetting('sound', v)}
        />
        
        <SettingToggle
          icon="phone-portrait"
          label="Vibración"
          description="Vibrar en alertas críticas"
          value={settings.vibration}
          onValueChange={(v) => updateSetting('vibration', v)}
        />
      </View>

      {/* App Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Aplicación</Text>
        
        <SettingToggle
          icon="refresh"
          label="Actualización Automática"
          description="Refrescar datos en tiempo real"
          value={settings.autoRefresh}
          onValueChange={(v) => updateSetting('autoRefresh', v)}
        />

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingIcon}>
            <Ionicons name="server" size={20} color="#0ca1eb" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Servidor API</Text>
            <Text style={styles.settingDescription}>
              {API_BASE_URL.replace(/^https?:\/\//, '')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Connection Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estado de Conexión</Text>
        
        <View style={styles.connectionGrid}>
          <View style={styles.connectionItem}>
            <View style={[styles.connectionDot, { backgroundColor: '#22c55e' }]} />
            <Text style={styles.connectionLabel}>API</Text>
          </View>
          <View style={styles.connectionItem}>
            <View style={[styles.connectionDot, { backgroundColor: '#22c55e' }]} />
            <Text style={styles.connectionLabel}>WebSocket</Text>
          </View>
          <View style={styles.connectionItem}>
            <View style={[styles.connectionDot, { backgroundColor: '#22c55e' }]} />
            <Text style={styles.connectionLabel}>MQTT</Text>
          </View>
        </View>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acerca de</Text>
        
        <SettingItem icon="information-circle" label="Versión" description="1.0.0" />
        <SettingItem icon="code-slash" label="Build" description="2024.01.001" />
        
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingIcon}>
            <Ionicons name="document-text" size={20} color="#0ca1eb" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Términos y Condiciones</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#64748b" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingIcon}>
            <Ionicons name="shield-checkmark" size={20} color="#0ca1eb" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Política de Privacidad</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out" size={20} color="#ef4444" />
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>

      {/* Footer */}
      <Text style={styles.footer}>
        FlowSight © 2024{'\n'}
        Sistema de Monitoreo IoT
      </Text>
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f1f5f9',
  },
  profileEmail: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#0ca1eb20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  roleText: {
    fontSize: 12,
    color: '#0ca1eb',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  section: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.3)',
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#0ca1eb15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    color: '#f1f5f9',
  },
  settingDescription: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  connectionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  connectionItem: {
    alignItems: 'center',
  },
  connectionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 6,
  },
  connectionLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ef4444',
    marginLeft: 8,
  },
  footer: {
    textAlign: 'center',
    color: '#475569',
    fontSize: 12,
    marginBottom: 32,
    lineHeight: 18,
  },
});

