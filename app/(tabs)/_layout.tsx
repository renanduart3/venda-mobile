import { Tabs } from 'expo-router';
import { View } from 'react-native';
import {
  ShoppingCart,
  Package,
  Users,
  Wallet,
  Home
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useSafeArea } from '@/hooks/useSafeArea';

export default function TabLayout() {
  const { colors } = useTheme();
  const { bottom, hasBottomBar } = useSafeArea();

  console.log('TabLayout colors:', colors);
  console.log('Safe area bottom:', bottom, 'hasBottomBar:', hasBottomBar);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.onBottombar,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
        tabBarStyle: {
          backgroundColor: colors.bottombar,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          // Revert global extra height; we'll handle screen-specific bottom spacing where needed
          paddingBottom: hasBottomBar ? bottom + 8 : 8,
          paddingTop: 8,
          height: hasBottomBar ? 65 + bottom : 65,
          // subtle elevation/shadow for separation from system nav area
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowOffset: { width: 0, height: -2 },
          shadowRadius: 6,
          elevation: 8,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Inter-Medium',
          marginTop: 4,
          color: colors.onBottombar,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused, size, color }) => {
            return (
              <View style={{
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 16,
                backgroundColor: focused ? 'rgba(255,255,255,0.2)' : 'transparent',
              }}>
                <Home size={24} color={color} />
              </View>
            );
          },
        }}
      />
      <Tabs.Screen
        name="vendas"
        options={{
          title: 'Vendas',
          tabBarIcon: ({ focused, size, color }) => (
            <View style={{
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 16,
              backgroundColor: focused ? 'rgba(255,255,255,0.2)' : 'transparent',
            }}>
              <ShoppingCart size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="produtos"
        options={{
          title: 'Produtos',
          tabBarIcon: ({ focused, size, color }) => (
            <View style={{
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 16,
              backgroundColor: focused ? 'rgba(255,255,255,0.2)' : 'transparent',
            }}>
              <Package size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="clientes"
        options={{
          title: 'Clientes',
          tabBarIcon: ({ focused, size, color }) => (
            <View style={{
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 16,
              backgroundColor: focused ? 'rgba(255,255,255,0.2)' : 'transparent',
            }}>
              <Users size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="financas"
        options={{
          title: 'Finanças',
          tabBarIcon: ({ focused, size, color }) => (
            <View style={{
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 16,
              backgroundColor: focused ? 'rgba(255,255,255,0.2)' : 'transparent',
            }}>
              <Wallet size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen name="Clientes.styles" options={{ href: null }} />
      <Tabs.Screen name="Financas.styles" options={{ href: null }} />
      <Tabs.Screen name="Produtos.styles" options={{ href: null }} />
      <Tabs.Screen name="Vendas.styles" options={{ href: null }} />
    </Tabs>
  );
}