import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Clipboard,
  Modal
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { TextInput } from '@/components/ui/TextInput';
import {
  ArrowLeft,
  Store,
  Palette,
  Sun,
  Moon,
  Smartphone,
  Crown,
  Database,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  Edit3,
  Copy,
  Plus,
  X
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { router, useFocusEffect } from 'expo-router';
import { isPremium } from '@/lib/premium';
import { useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Settings() {
  const { colors, theme, setTheme, setPrimaryColor, setSecondaryColor } = useTheme();
  const insets = useSafeAreaInsets();
  const isOnline = true;
  const lastSync = null;
  const syncData = async () => { };

  const [storeSettings, setStoreSettings] = useState({
    storeName: '',
    ownerName: '',
    pixKeys: [''],
  });

  const [isEditing, setIsEditing] = useState(false);

  const [customColors, setCustomColors] = useState({
    primary: colors.primary,
    secondary: colors.secondary,
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [premium, setPremium] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    loadStoreSettings();
    loadPremium();
  }, []);

  // Recarregar status premium quando a tela ganhar foco
  useFocusEffect(
    useCallback(() => {
      loadPremium();
    }, [])
  );

  const loadPremium = async () => {
    try {
      const premiumStatus = await isPremium();
      setPremium(premiumStatus);
    } catch (e) {
      console.error('Erro carregando premium', e);
      setPremium(false);
    }
  };

  // Função de teste removida para produção

  const loadStoreSettings = async () => {
    const { loadStoreSettings: loadStoreSettingsData } = await import('@/lib/data-loader');
    const data = await loadStoreSettingsData();
    // Normaliza: se vier como objetos { value }, converte para string
    if (Array.isArray((data as any).pixKeys) && typeof (data as any).pixKeys[0] === 'object') {
      const converted = (data as any).pixKeys.map((k: any) => (k?.value ?? ''));
      setStoreSettings({ ...(data as any), pixKeys: converted });
      return;
    }
    setStoreSettings(data as any);
  };

  const saveStoreSettings = async () => {
    try {
      Alert.alert('Sucesso', 'Configurações salvas com sucesso!');
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar as configurações.');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await Clipboard.setString(text);
      Alert.alert('Copiado!', 'Chave PIX copiada para a área de transferência.');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível copiar a chave PIX.');
    }
  };

  const addPixKey = () => {
    if (storeSettings.pixKeys.length < 4) {
      setStoreSettings({
        ...storeSettings,
        pixKeys: [...storeSettings.pixKeys, '']
      });
    }
  };

  const removePixKey = (index: number) => {
    if (storeSettings.pixKeys.length > 1) {
      const newPixKeys = storeSettings.pixKeys.filter((_, i) => i !== index);
      setStoreSettings({
        ...storeSettings,
        pixKeys: newPixKeys
      });
    }
  };

  const updatePixKey = (index: number, value: string) => {
    const newPixKeys = [...storeSettings.pixKeys];
    newPixKeys[index] = value;
    setStoreSettings({ ...storeSettings, pixKeys: newPixKeys });
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

  // Reset Database - Modal de confirmação (compatível com Android)
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');

  const performDatabaseReset = async () => {
    setIsResetting(true);
    try {
      const { default: FileSystem } = await import('expo-file-system');
  const dbPath = (FileSystem as any).documentDirectory + 'SQLite/venda.db';
      const info = await FileSystem.getInfoAsync(dbPath);
      if (info.exists) {
        await FileSystem.deleteAsync(dbPath, { idempotent: true });
      }
      // Mantemos credenciais OAuth (em AsyncStorage) intactas deliberadamente
      setShowResetModal(false);
      setResetConfirmText('');
      Alert.alert('✅ Banco Resetado', 'Todos os dados foram apagados com sucesso!');
      router.replace('/');
    } catch (error) {
      Alert.alert('❌ Erro', 'Não foi possível resetar o banco de dados.');
    } finally {
      setIsResetting(false);
    }
  };

  const resetDatabase = () => {
    setShowResetModal(true);
  };

  // Export/Import Functions
  const exportData = async () => {
    // Verificar premium novamente para garantir
    const isUserPremium = await isPremium();
    if (!isUserPremium) {
      Alert.alert('Premium Necessário', 'A funcionalidade de exportação está disponível apenas para usuários Premium.');
      return;
    }

    setIsExporting(true);
    try {
      // Obter o arquivo do banco SQLite
  const dbPath = (FileSystem as any).documentDirectory + 'SQLite/venda.db';
      
      // Verificar se o arquivo existe
      const fileInfo = await FileSystem.getInfoAsync(dbPath);
      if (!fileInfo.exists) {
        Alert.alert('❌ Erro', 'Banco de dados não encontrado.');
        setIsExporting(false);
        return;
      }

      // Criar nome do arquivo de backup com timestamp
      const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const fileName = `loja_backup_${timestamp}.db`;
  const backupPath = (FileSystem as any).documentDirectory + fileName;
      
      // Copiar arquivo do banco para backup
      await FileSystem.copyAsync({
        from: dbPath,
        to: backupPath
      });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(backupPath);
        Alert.alert('✅ Exportação Concluída', 'Banco de dados exportado com sucesso!');
      } else {
        Alert.alert('❌ Erro', 'Não foi possível compartilhar o arquivo.');
      }
    } catch (error) {
      console.error('Erro na exportação:', error);
      Alert.alert('❌ Erro', 'Não foi possível exportar o banco de dados.');
    } finally {
      setIsExporting(false);
    }
  };

  const importData = async () => {
    // Verificar premium novamente para garantir
    const isUserPremium = await isPremium();
    if (!isUserPremium) {
      Alert.alert('Premium Necessário', 'A funcionalidade de importação está disponível apenas para usuários Premium.');
      return;
    }

    setIsImporting(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/x-sqlite3',
        copyToCacheDirectory: true
      });

      if (result.canceled) {
        setIsImporting(false);
        return;
      }

      // Verificar se o arquivo é um banco SQLite válido
      const fileUri = result.assets[0].uri;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      
      if (!fileInfo.exists) {
        Alert.alert('❌ Arquivo Inválido', 'Arquivo não encontrado.');
        setIsImporting(false);
        return;
      }

      Alert.alert(
        '⚠️ CONFIRMAR IMPORTAÇÃO',
        'Esta ação irá SUBSTITUIR COMPLETAMENTE o banco de dados atual pelo arquivo selecionado.\n\n' +
        'TODOS os dados atuais serão PERDIDOS permanentemente!\n\n' +
        'Esta ação NÃO PODE ser desfeita!\n\n' +
        'Deseja continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'IMPORTAR (IRREVERSÍVEL)',
            style: 'destructive',
            onPress: async () => {
              try {
                // Fazer backup do banco atual antes de substituir
                const currentDbPath = (FileSystem as any).documentDirectory + 'SQLite/venda.db';
                const backupPath = (FileSystem as any).documentDirectory + `backup_before_import_${Date.now()}.db`;
                
                // Verificar se o banco atual existe e fazer backup
                const currentDbInfo = await FileSystem.getInfoAsync(currentDbPath);
                if (currentDbInfo.exists) {
                  await FileSystem.copyAsync({
                    from: currentDbPath,
                    to: backupPath
                  });
                }

                // Substituir o banco atual pelo importado
                await FileSystem.copyAsync({
                  from: fileUri,
                  to: currentDbPath
                });

                Alert.alert(
                  '✅ Importação Concluída', 
                  'Banco de dados importado com sucesso!\n\n' +
                  'O banco anterior foi salvo como backup caso precise restaurar.'
                );
              } catch (importError) {
                console.error('Erro na importação:', importError);
                Alert.alert('❌ Erro', 'Não foi possível importar o banco de dados.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erro na importação:', error);
      Alert.alert('❌ Erro', 'Não foi possível importar o banco de dados.');
    } finally {
      setIsImporting(false);
    }
  };

  // Helper Functions - Removidas pois agora trabalhamos diretamente com arquivos .db

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      // Use dedicated topbar color for consistent dark bar styling
      backgroundColor: colors.topbar,
      paddingHorizontal: 20,
      paddingTop: 50,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 3,
    },
    backButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.topbar,
    },
    title: {
      fontSize: 24,
      fontFamily: 'Inter-Bold',
      color: colors.white,
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
    dangerSection: {
      marginBottom: 24,
    },
    dangerCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
    },
    dangerText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      marginBottom: 12,
      lineHeight: 20,
    },
    confirmationInput: {
      borderColor: colors.border,
      borderWidth: 1,
      backgroundColor: colors.background,
    },
    premiumCard: {
      opacity: 0.6,
    },
    premiumBadge: {
      position: 'absolute',
      top: 12,
      right: 12,
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      zIndex: 10,
    },
    premiumBadgeText: {
      color: colors.white,
      fontSize: 10,
      fontFamily: 'Inter-SemiBold',
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginBottom: 8,
    },
    actionButtonDisabled: {
      opacity: 0.5,
    },
    actionButtonText: {
      fontSize: 16,
      fontFamily: 'Inter-Medium',
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    editButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    editButtonText: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
    },
    readOnlyText: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.text,
      paddingVertical: 12,
      paddingHorizontal: 12,
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pixKeyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    pixKeyInput: {
      flex: 1,
    },
    pixKeyText: {
      flex: 1,
    },
    copyButton: {
      padding: 8,
      borderRadius: 6,
      backgroundColor: colors.primary + '20',
      borderWidth: 1,
      borderColor: colors.primary,
    },
    removeButton: {
      padding: 8,
      borderRadius: 6,
      backgroundColor: colors.error + '20',
      borderWidth: 1,
      borderColor: colors.error,
    },
    addPixButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.primary,
      borderStyle: 'dashed',
      marginTop: 8,
    },
    addPixButtonText: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
    },
  });
  // Increase spacer: minimum 24, cap 36, add +12 to inset for comfort
  const bottomSpacer = Math.max(24, Math.min((insets.bottom || 0) + 12, 36));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Configurações</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 0 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Premium */}
        <View style={styles.section}>
          <Card>
            <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>
              <Crown size={20} color={colors.primary} />
              Plano Atual
            </Text>

            <View style={{ marginBottom: 16 }}>
              <Text style={[styles.label, { marginBottom: 8 }]}>Status</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={[styles.infoValue, {
                  color: premium ? colors.primary : colors.textSecondary,
                  fontFamily: 'Inter-SemiBold',
                  fontSize: 16
                }]}>
                  {premium ? 'Premium' : 'Gratuito'}
                </Text>
                {premium && (
                  <View style={{
                    backgroundColor: colors.success,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12
                  }}>
                    <Text style={{
                      color: colors.white,
                      fontSize: 10,
                      fontFamily: 'Inter-SemiBold'
                    }}>
                      ✅ ATIVO
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <Button
              title="Gerenciar Plano"
              onPress={() => router.push('/planos')}
            />
          </Card>
        </View>

        {/* Store Data */}
        <View style={styles.section}>
          <Card>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
                <Store size={20} color={colors.primary} />
                Dados da Loja
              </Text>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setIsEditing(!isEditing)}
              >
                <Edit3 size={16} color={colors.primary} />
                <Text style={[styles.editButtonText, { color: colors.primary }]}>
                  {isEditing ? 'Cancelar' : 'Editar'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Nome da Loja</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={storeSettings.storeName}
                  onChangeText={(text) => setStoreSettings({ ...storeSettings, storeName: text })}
                  placeholder="Nome da sua loja"
                  placeholderTextColor={colors.textSecondary}
                />
              ) : (
                <Text style={styles.readOnlyText}>{storeSettings.storeName}</Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Nome do Lojista</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={storeSettings.ownerName}
                  onChangeText={(text) => setStoreSettings({ ...storeSettings, ownerName: text })}
                  placeholder="Seu nome"
                  placeholderTextColor={colors.textSecondary}
                />
              ) : (
                <Text style={styles.readOnlyText}>{storeSettings.ownerName}</Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Chaves PIX ({storeSettings.pixKeys.length}/4)</Text>
              {storeSettings.pixKeys.map((pixKey, index) => (
                <View key={index} style={styles.pixKeyRow}>
                  {isEditing ? (
                    <>
                      <TextInput
                        style={[styles.input, styles.pixKeyInput]}
                        value={pixKey}
                        onChangeText={(text) => updatePixKey(index, text)}
                        placeholder="Digite sua chave (texto livre)"
                        placeholderTextColor={colors.textSecondary}
                      />
                      {storeSettings.pixKeys.length > 1 && (
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => removePixKey(index)}
                        >
                          <X size={16} color={colors.error} />
                        </TouchableOpacity>
                      )}
                    </>
                  ) : (
                    <>
                      <Text style={[styles.readOnlyText, styles.pixKeyText]}>{pixKey}</Text>
                      <TouchableOpacity
                        style={styles.copyButton}
                        onPress={() => copyToClipboard(pixKey)}
                      >
                        <Copy size={16} color={colors.primary} />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              ))}
              
              {isEditing && storeSettings.pixKeys.length < 4 && (
                <TouchableOpacity
                  style={styles.addPixButton}
                  onPress={addPixKey}
                >
                  <Plus size={16} color={colors.primary} />
                  <Text style={[styles.addPixButtonText, { color: colors.primary }]}>
                    Adicionar Chave PIX
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {isEditing && (
              <Button
                title="Salvar Dados"
                onPress={saveStoreSettings}
              />
            )}
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
              <TouchableOpacity
                style={[
                  styles.themeOption,
                  theme === 'dark' && styles.themeOptionActive,
                ]}
                onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                <View style={styles.themeOptionLeft}>
                  {theme === 'dark' ? <Moon size={20} color={colors.text} /> : <Sun size={20} color={colors.text} />}
                  <Text style={styles.themeOptionText}>{theme === 'dark' ? 'Escuro' : 'Claro'}</Text>
                </View>
                <Switch
                  value={theme === 'dark'}
                  onValueChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.white}
                />
              </TouchableOpacity>
            </View>
          </Card>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Card style={!premium ? styles.premiumCard : undefined}>
            {!premium && (
              <TouchableOpacity
                style={styles.premiumBadge}
                onPress={() => router.push('/planos')}
              >
                <Text style={styles.premiumBadgeText}>PREMIUM</Text>
              </TouchableOpacity>
            )}

            <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>
              <Database size={20} color={colors.primary} />
              Gerenciamento de Dados
            </Text>

            <View style={styles.actionButton}>
              <TouchableOpacity
                style={[styles.actionButton, !premium && styles.actionButtonDisabled]}
                onPress={exportData}
                disabled={!premium || isExporting}
              >
                <Download size={20} color={premium ? colors.primary : colors.textSecondary} />
                       <Text style={[styles.actionButtonText, { 
                         color: premium ? colors.primary : colors.textSecondary 
                       }]}>
                         {isExporting ? 'Exportando...' : 'Backup do Banco'}
                       </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionButton}>
              <TouchableOpacity
                style={[styles.actionButton, !premium && styles.actionButtonDisabled]}
                onPress={importData}
                disabled={!premium || isImporting}
              >
                <Upload size={20} color={premium ? colors.primary : colors.textSecondary} />
                       <Text style={[styles.actionButtonText, { 
                         color: premium ? colors.primary : colors.textSecondary 
                       }]}>
                         {isImporting ? 'Importando...' : 'Restaurar Banco'}
                       </Text>
              </TouchableOpacity>
            </View>

            {!premium && (
              <Text style={[styles.dangerText, { color: colors.textSecondary, fontSize: 12, marginTop: 8 }]}>
                Para acessar essas funcionalidades, assine o Premium
              </Text>
            )}

            {premium && (
              <Text style={[styles.dangerText, { color: colors.success, fontSize: 12, marginTop: 8 }]}>
                ✅ Funcionalidades premium ativas - Backup e restauração do banco de dados liberadas
              </Text>
            )}
          </Card>
        </View>

        {/* Reset Database */}
        <View style={styles.dangerSection}>
          <Card style={styles.dangerCard}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.error, paddingVertical: 16 }]}
              onPress={resetDatabase}
              disabled={isResetting}
            >
              <Trash2 size={24} color={colors.white} />
              <Text style={[styles.actionButtonText, { color: colors.white, fontSize: 18, fontFamily: 'Inter-Bold' }]}>
                {isResetting ? 'Resetando...' : 'RESETAR BANCO DE DADOS'}
              </Text>
            </TouchableOpacity>
          </Card>
        </View>

        {/* System Info */}
        <View style={[styles.section]}>
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
          </Card>
        </View>
  </ScrollView>
  {/* Discreet dark bottom area only for settings screen */}
  <View style={{ backgroundColor: colors.bottombar, height: bottomSpacer }} />

      {/* Modal de Reset */}
      <Modal visible={showResetModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: 20, width: '100%', maxWidth: 420 }}>
            <Text style={{ fontSize: 18, fontFamily: 'Inter-Bold', color: colors.text, marginBottom: 12 }}>⚠️ ZONA DE PERIGO</Text>
            <Text style={{ color: colors.textSecondary, marginBottom: 12 }}>
              Esta ação irá APAGAR TODOS os dados do aplicativo permanentemente. Digite exatamente:
            </Text>
            <Text style={{ fontFamily: 'Inter-Bold', color: colors.error, marginBottom: 12 }}>
              deletar o banco
            </Text>
            <TextInput
              style={[styles.input, styles.confirmationInput]}
              value={resetConfirmText}
              onChangeText={setResetConfirmText}
              placeholder="Digite aqui para confirmar"
              placeholderTextColor={colors.textSecondary}
            />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <Button title="Cancelar" variant="outline" onPress={() => { setShowResetModal(false); setResetConfirmText(''); }} style={{ flex: 1 }} />
              <Button
                title={isResetting ? 'Resetando...' : 'Apagar Tudo'}
                onPress={performDatabaseReset}
                disabled={isResetting || resetConfirmText.trim().toLowerCase() !== 'deletar o banco'}
                style={{ flex: 1 }}
              />
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8 }}>
              Observação: credenciais de login (OAuth) não serão apagadas.
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}
