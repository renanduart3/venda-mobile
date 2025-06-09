import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch
} from 'react-native';
import { 
  ArrowLeft,
  RefreshCw,
  Wifi,
  WifiOff,
  Store,
  User,
  Palette,
  Sun,
  Moon,
  Smartphone
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import {useOffline } from '@/contexts/OfflineContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { router } from 'expo-router';

export default function Settings() {
  const { colors, theme, setTheme, setPrimaryColor, setSecondaryColor } = useTheme();
  const { isOnline, lastSync, syncData } = useOffline();
  
  const [storeSettings, setStoreSettings] = useState({
    storeName: '',
    ownerName: '',
    pixKey: '',
  });
  
  const [customColors, setCustomColors] = useState({
    primary: colors.primary,
    secondary: colors.secondary,
  });

  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadStoreSettings();
  }, []);

  const loadStoreSettings = async () => {
    // TODO: Load from local storage
    setStoreSettings({
      storeName: 'Minha Loja',
      ownerName: 'João Silva',
      pixKey: 'joao@email.com',
    });
  };

  const saveStoreSettings = async () => {
    try {
      // TODO: Save to local storage and queue for sync
      Alert.alert('Sucesso', 'Configurações salvas com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar as configurações.');
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await syncData();
      Alert.alert('Sucesso', 'Sincronização concluída!');
    } catch (error) {
      Alert.alert('Erro', 'Falha na sincronização.');
    } finally {
      setIsSyncing(false);
    }
  };

  const applyCustomColors = () => {
    setPrimaryColor(customColors.primary);
    setSecondaryColor(customColors.secondary);
    Alert.alert('Sucesso', 'Cores aplicadas com sucesso!');
  };

  const resetColors = () => {
    const defaultPrimary = '#4f46e5';
    const defaultSecondary = '#7c3aed';
    setCustomColors({
      primary: defaultPrimary,
      secondary: defaultSecondary,
    });
    setPrimaryColor(defaultPrimary);
    setSecondaryColor(defaultSecondary);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.surface,
      paddingHorizontal: 20,
      paddingTop: 50,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    backButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.card,
    },
    title: {
      fontSize: 24,
      fontFamily: 'Inter-Bold',
      color: colors.text,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    
    // Sync Section
    syncStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    statusText: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
    },
    lastSyncText: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginBottom: 16,
    },
    
    // Form Fields
    formGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.text,
      marginBottom: 6,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.text,
      backgroundColor: colors.surface,
    },
    
    // Theme Section
    themeOptions: {
      gap: 12,
    },
    themeOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    themeOptionActive: {
      backgroundColor: colors.primary + '20',
      borderColor: colors.primary,
    },
    themeOptionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    themeOptionText: {
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      color: colors.text,
    },
    
    // Color Customization
    colorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    colorPreview: {
      width: 40,
      height: 40,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: colors.border,
    },
    colorButtons: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 16,
    },
    
    // System Info
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    infoLabel: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.text,
    },
    infoValue: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Configurações</Text>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Synchronization */}
        <View style={styles.section}>
          <Card>
            <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>
              <RefreshCw size={20} color={colors.primary} />
              Sincronização
            </Text>
            
            <View style={styles.syncStatus}>
              {isOnline ? (
                <Wifi size={16} color={colors.success} />
              ) : (
                <WifiOff size={16} color={colors.error} />
              )}
              <Text style={[styles.statusText, { 
                color: isOnline ? colors.success : colors.error 
              }]}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
            
            {lastSync && (
              <Text style={styles.lastSyncText}>
                Última sincronização: {lastSync.toLocaleString('pt-BR')}
              </Text>
            )}
            
            <Button
              title={isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}
              onPress={handleManualSync}
              disabled={!isOnline || isSyncing}
              variant="outline"
            />
          </Card>
        </View>

        {/* Store Data */}
        <View style={styles.section}>
          <Card>
            <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>
              <Store size={20} color={colors.primary} />
              Dados da Loja
            </Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nome da Loja</Text>
              <TextInput
                style={styles.input}
                value={storeSettings.storeName}
                onChangeText={(text) => setStoreSettings({ ...storeSettings, storeName: text })}
                placeholder="Nome da sua loja"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Nome do Lojista</Text>
              <TextInput
                style={styles.input}
                value={storeSettings.ownerName}
                onChangeText={(text) => setStoreSettings({ ...storeSettings, ownerName: text })}
                placeholder="Seu nome"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Chave PIX</Text>
              <TextInput
                style={styles.input}
                value={storeSettings.pixKey}
                onChangeText={(text) => setStoreSettings({ ...storeSettings, pixKey: text })}
                placeholder="email@exemplo.com ou telefone"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <Button
              title="Salvar Dados"
              onPress={saveStoreSettings}
            />
          </Card>
        </View>

        {/* Theme */}
        <View style={styles.section}>
          <Card>
            <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>
              <Palette size={20} color={colors.primary} />
              Tema
            </Text>
            
            <View style={styles.themeOptions}>
              {[
                { key: 'light', label: 'Claro', icon: <Sun size={20} color={colors.text} /> },
                { key: 'dark', label: 'Escuro', icon: <Moon size={20} color={colors.text} /> },
                { key: 'system', label: 'Sistema', icon: <Smartphone size={20} color={colors.text} /> },
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.themeOption,
                    theme === option.key && styles.themeOptionActive,
                  ]}
                  onPress={() => setTheme(option.key as any)}
                >
                  <View style={styles.themeOptionLeft}>
                    {option.icon}
                    <Text style={styles.themeOptionText}>{option.label}</Text>
                  </View>
                  <Switch
                    value={theme === option.key}
                    onValueChange={() => setTheme(option.key as any)}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={colors.white}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        </View>

        {/* Color Customization */}
        <View style={styles.section}>
          <Card>
            <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>
              Personalização de Cores
            </Text>
            
            <View style={styles.colorRow}>
              <Text style={styles.label}>Cor Primária</Text>
              <View style={[styles.colorPreview, { backgroundColor: customColors.primary }]} />
            </View>
            
            <TextInput
              style={styles.input}
              value={customColors.primary}
              onChangeText={(text) => setCustomColors({ ...customColors, primary: text })}
              placeholder="#4f46e5"
              placeholderTextColor={colors.textSecondary}
            />

            <View style={styles.colorRow}>
              <Text style={styles.label}>Cor Secundária</Text>
              <View style={[styles.colorPreview, { backgroundColor: customColors.secondary }]} />
            </View>
            
            <TextInput
              style={styles.input}
              value={customColors.secondary}
              onChangeText={(text) => setCustomColors({ ...customColors, secondary: text })}
              placeholder="#7c3aed"
              placeholderTextColor={colors.textSecondary}
            />

            <View style={styles.colorButtons}>
              <Button
                title="Aplicar"
                onPress={applyCustomColors}
                style={{ flex: 1 }}
              />
              <Button
                title="Resetar"
                onPress={resetColors}
                variant="outline"
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        </View>

        {/* System Info */}
        <View style={styles.section}>
          <Card>
            <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>
              Informações do Sistema
            </Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Versão do App</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status da Conexão</Text>
              <Text style={[styles.infoValue, { 
                color: isOnline ? colors.success : colors.error 
              }]}>
                {isOnline ? 'Conectado' : 'Desconectado'}
              </Text>
            </View>
            
            {lastSync && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Última Sincronização</Text>
                <Text style={styles.infoValue}>
                  {lastSync.toLocaleDateString('pt-BR')}
                </Text>
              </View>
            )}
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}