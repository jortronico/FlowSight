import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from './src/stores/authStore';
import { socketService } from './src/services/socket';
import { notificationService } from './src/services/notifications';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import AlarmsScreen from './src/screens/AlarmsScreen';
import ValvesScreen from './src/screens/ValvesScreen';
import DevicesScreen from './src/screens/DevicesScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const theme = {
  dark: true,
  colors: {
    primary: '#0ca1eb',
    background: '#0f172a',
    card: '#1e293b',
    text: '#f1f5f9',
    border: '#334155',
    notification: '#ef4444',
  },
};

function TabNavigator() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'grid' : 'grid-outline';
              break;
            case 'Alarmas':
              iconName = focused ? 'notifications' : 'notifications-outline';
              break;
            case 'Válvulas':
              iconName = focused ? 'water' : 'water-outline';
              break;
            case 'Dispositivos':
              iconName = focused ? 'hardware-chip' : 'hardware-chip-outline';
              break;
            case 'Ajustes':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            default:
              iconName = 'ellipse';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#0ca1eb',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#1e293b',
          borderTopColor: '#334155',
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 8),
          height: 60 + Math.max(insets.bottom - 8, 0),
          position: 'absolute',
          elevation: 0,
          borderTopWidth: 1,
        },
        headerStyle: {
          backgroundColor: '#1e293b',
        },
        headerTintColor: '#f1f5f9',
        headerTitleStyle: {
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen 
        name="Alarmas" 
        component={AlarmsScreen}
        options={{
          tabBarBadge: undefined, // Se actualizará dinámicamente
        }}
      />
      <Tab.Screen name="Válvulas" component={ValvesScreen} />
      <Tab.Screen name="Dispositivos" component={DevicesScreen} />
      <Tab.Screen name="Ajustes" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const { isAuthenticated, initAuth } = useAuthStore();
  const notificationListener = useRef(null);
  const responseListener = useRef(null);

  useEffect(() => {
    initAuth();
    
    // Solicitar permisos de notificaciones al iniciar
    notificationService.requestPermissions();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      socketService.connect();
      
      // Configurar listeners de notificaciones
      notificationService.setupNotificationListeners(
        (notification) => {
          console.log('📬 Notificación recibida:', notification);
        },
        (response) => {
          console.log('👆 Usuario tocó notificación:', response);
          // Aquí podrías navegar a una pantalla específica
        }
      );
    }
    
    return () => {
      socketService.disconnect();
      notificationService.removeNotificationListeners();
    };
  }, [isAuthenticated]);

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={theme}>
        <StatusBar style="light" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isAuthenticated ? (
            <Stack.Screen name="Login" component={LoginScreen} />
          ) : (
            <Stack.Screen name="Main" component={TabNavigator} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

