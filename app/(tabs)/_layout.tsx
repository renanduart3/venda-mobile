import { Tabs } from 'expo-router';
import { 
  BarChart3, 
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
  tabBarInactiveTintColor: 'rgba(255,255,255,0.7)',
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
          tabBarIcon: ({ size, color }) => {
            console.log('Dashboard icon - size:', size, 'color:', color);
            return <Home size={24} color={color} />;
          },
        }}
      />
      <Tabs.Screen
        name="vendas"
        options={{
          title: 'Vendas',
          tabBarIcon: ({ size, color }) => (
            <ShoppingCart size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="produtos"
        options={{
          title: 'Produtos',
          tabBarIcon: ({ size, color }) => (
            <Package size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="clientes"
        options={{
          title: 'Clientes',
          tabBarIcon: ({ size, color }) => (
            <Users size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="financas"
        options={{
          title: 'Finanças',
          tabBarIcon: ({ size, color }) => (
            <Wallet size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}