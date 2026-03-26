import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Constants from 'expo-constants';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Clipboard,
  Modal,
  Platform,
  ActivityIndicator, // Added ActivityIndicator
  StyleSheet, // Added StyleSheet
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { TextInput } from '@/components/ui/TextInput';
import { LogOut, Save, Download, Upload, User as UserIcon, Crown, Settings as SettingsIcon, Bell, Shield, Database, Trash2, ArrowLeft, Store, Edit3, Smartphone, Wifi, RefreshCw, X, Copy, Plus, Palette, Moon, Sun, AlertTriangle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { router, useFocusEffect } from 'expo-router';
import { isPremium, getPremiumStatus, PremiumStatus } from '@/lib/premium';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createSettingsStyles } from './settings.styles';
import { useAuth } from '@/contexts/AuthContext';
import db from '@/lib/db';

export default function Settings() {
  const { colors, theme, setTheme, setPrimaryColor, setSecondaryColor } = useTheme();
  const insets = useSafeAreaInsets();

  // Cor de contraste para textos informativos no card de plano
  const featureTextColor = theme === 'dark' ? '#cccccc' : '#2a2a2a';
  const { user, signOut } = useAuth();
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
  const [premiumDetails, setPremiumDetails] = useState<PremiumStatus | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isCheckingPremium, setIsCheckingPremium] = useState(false);

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
      const isUserPremium = await isPremium();
      const details = await getPremiumStatus();
      setPremium(isUserPremium);
      setPremiumDetails(details);
    } catch (e) {
      console.error('Erro carregando premium', e);
      setPremium(false);
      setPremiumDetails(null);
    }
  };

  const checkPremiumStatus = async () => {
    setIsCheckingPremium(true);
    try {
      const isUserPremium = await isPremium(true); // Force refresh
      setPremium(isUserPremium);
      Alert.alert('Status Premium Atualizado', isUserPremium ? 'Você é um usuário Premium!' : 'Você não é um usuário Premium.');
    } catch (error) {
      console.error('Erro ao verificar plano:', error);
      Alert.alert('Erro', 'Não foi possível verificar o status Premium.');
    } finally {
      setIsCheckingPremium(false);
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
      // Formata a lista de PIX removendo as vazias
      const validKeys = storeSettings.pixKeys.filter(k => k.trim());
      const pixKeyJson = JSON.stringify(validKeys.length > 0 ? validKeys : ['']);
      const timestamp = new Date().toISOString();

      await db.query(
        `INSERT INTO store_settings 
          (id, store_name, owner_name, pix_key, created_at, updated_at) 
        VALUES ('1', ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET 
          store_name = excluded.store_name,
          owner_name = excluded.owner_name,
          pix_key = excluded.pix_key,
          updated_at = excluded.updated_at;`,
        [
          storeSettings.storeName.trim(),
          storeSettings.ownerName.trim(),
          pixKeyJson,
          timestamp,
          timestamp
        ]
      );
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

  // Detecta o tipo de chave PIX baseado no formato
  const detectPixKeyType = (key: string): string => {
    if (!key || key.trim() === '') return 'Tipo da chave';

    const original = key.trim();
    const digits = original.replace(/\D/g, '');

    // Email antes de números longos que possam coincidir com telefones
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(original)) {
      return 'Email';
    }

    // CNPJ: 14 dígitos puros
    if (/^\d{14}$/.test(digits)) {
      return 'CNPJ';
    }

    // CPF ou Telefone (11 dígitos) – ambíguo sem validação completa
    if (/^\d{11}$/.test(digits)) {
      return 'CPF ou Telefone';
    }

    // Telefone brasileiro: 10 a 13 dígitos (incluindo DDI 55), ou formatos com +55, parênteses, hífens
    const phoneDigits = digits;
    if (/^\d{10,13}$/.test(phoneDigits)) {
      // Se começa com 55 e tem 12-13 dígitos, tratar como telefone
      if (phoneDigits.startsWith('55') && phoneDigits.length >= 12) {
        return 'Telefone';
      }
      if (phoneDigits.length === 10) {
        return 'Telefone';
      }
    }

    // Chave aleatória: UUID hifenizado ou 32 hex/alfanum
    if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(original)) {
      return 'Chave Aleatória';
    }
    const stripped = original.replace(/[^a-zA-Z0-9]/g, '');
    if (stripped.length === 32) {
      return 'Chave Aleatória';
    }

    return 'Chave Aleatória';
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
      // Caminho original do banco dentro do sandbox
      const dbPath = (FileSystem as any).documentDirectory + 'SQLite/venda.db';

      const info = await FileSystem.getInfoAsync(dbPath);
      if (!info.exists) {
        Alert.alert('❌ Erro', 'Banco de dados não encontrado. Abra o app e gere algum dado primeiro.');
        return;
      }

      // Criar cópia temporária com extensão amigável
      const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const fileName = `loja_backup_${timestamp}.sqlite3`;
      const tempDir = (FileSystem as any).cacheDirectory + 'db-export/';
      try { await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true }); } catch { }
      const tempPath = tempDir + fileName;
      try { await FileSystem.deleteAsync(tempPath, { idempotent: true }); } catch { }
      await FileSystem.copyAsync({ from: dbPath, to: tempPath });

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Compartilhar indisponível', 'O recurso de compartilhamento não está disponível neste dispositivo.');
        return;
      }

      await Sharing.shareAsync(tempPath, {
        dialogTitle: 'Salvar backup do Banco de Dados',
        mimeType: 'application/octet-stream', // Tipo genérico para arquivos binários
        UTI: 'public.database', // Ajuda o iOS a entender o tipo de arquivo
      });

      // (Opcional) Não mostramos Alert de sucesso extra para não duplicar UI após Share Sheet
    } catch (error) {
      console.error('Erro na exportação:', error);
      Alert.alert('❌ Erro', `Não foi possível exportar o banco de dados.\n\nDetalhes: ${String(error)}`);
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
        type: '*/*', // Permitindo qualquer tipo para não travar no Android 
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
                const sqliteDir = (FileSystem as any).documentDirectory + 'SQLite';
                // Garante que a pasta SQLite exista (caso o app ainda não tenha inicializado o DB)
                try {
                  await FileSystem.makeDirectoryAsync(sqliteDir, { intermediates: true });
                } catch { }

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
                Alert.alert('❌ Erro', `Não foi possível importar o banco de dados.\n\nDetalhes: ${String(importError)}`);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erro na importação:', error);
      Alert.alert('❌ Erro', `Não foi possível importar o banco de dados.\n\nDetalhes: ${String(error)}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Helper Functions - Removidas pois agora trabalhamos diretamente com arquivos .db

  // Usar estilos do arquivo externo
  const styles = useMemo(() => createSettingsStyles(colors), [colors]);

  // Espaço igual ao das abas de navegação: safe area + folgão confortável
  const bottomSpacer = Math.max(32, (insets.bottom || 0) + 24);

  return (
    <View style={styles.container}>

      {/* Overlay de loading durante o signOut */}
      {isSigningOut && (
        <View style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: 'rgba(0,0,0,0.55)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 999,
        }}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={{ color: '#F8FAFC', marginTop: 16, fontFamily: 'Inter-Regular', fontSize: 15 }}>
            Desconectando...
          </Text>
        </View>
      )}

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
        contentContainerStyle={{ paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >


        {/* Premium */}
        <View style={styles.section}>
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontFamily: 'Inter-SemiBold', color: colors.text, flexDirection: 'row', alignItems: 'center' }}>
                <Crown size={20} color={colors.primary} style={{ marginRight: 8 }} />
                Plano Atual
              </Text>

              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 20,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  opacity: isCheckingPremium ? 0.6 : 1,
                }}
                disabled={isCheckingPremium}
                onPress={async () => {
                  setIsCheckingPremium(true);
                  try {
                    const hasPremium = await isPremium(true);
                    const details = await getPremiumStatus();
                    setPremium(hasPremium);
                    setPremiumDetails(details);
                  } catch (e) {
                    console.error('Failed to verify premium quietly', e);
                  } finally {
                    setIsCheckingPremium(false);
                  }
                }}
              >
                {isCheckingPremium ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <RefreshCw size={14} color={colors.textSecondary} />
                )}
                <Text style={{ fontSize: 12, fontFamily: 'Inter-Medium', color: colors.textSecondary }}>
                  {isCheckingPremium ? 'Verificando' : 'Atualizar'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.premiumContainer}>
              <View style={styles.statusRow}>
                <Text style={premium ? styles.premiumStatusText : styles.freeStatusText}>
                  {premium
                    ? (premiumDetails?.hasLifetimeAccess ? 'Premium (Vitalício)' : 'Premium')
                    : 'Gratuito'}
                </Text>
                {premium && (
                  <View style={styles.premiumBadgeContainer}>
                    <Text style={styles.premiumBadgeText}>
                      ✅ ATIVO
                    </Text>
                  </View>
                )}
              </View>

              {premium && premiumDetails && (
                <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 }}>
                  {!premiumDetails.hasLifetimeAccess && premiumDetails.productId && (
                    <Text style={{ fontSize: 13, fontFamily: 'Inter-Medium', color: colors.text, marginBottom: 4 }}>
                      Periodicidade: <Text style={{ color: colors.textSecondary }}>{premiumDetails.productId.includes('monthly') ? 'Mensal' : 'Anual'}</Text>
                    </Text>
                  )}
                  {!premiumDetails.hasLifetimeAccess && premiumDetails.expiryDate && (
                    <Text style={{ fontSize: 13, fontFamily: 'Inter-Medium', color: colors.text }}>
                      Próx. vencimento: <Text style={{ color: colors.textSecondary }}>{new Date(premiumDetails.expiryDate).toLocaleDateString('pt-BR')}</Text>
                    </Text>
                  )}
                  <Text style={{ fontSize: 13, fontFamily: 'Inter-Medium', color: featureTextColor, marginTop: 8 }}>
                    ✓ Backup manual dos dados (exportação)
                  </Text>
                  <Text style={{ fontSize: 13, fontFamily: 'Inter-Medium', color: featureTextColor, marginTop: 4 }}>
                    ✓ Restauração de dados (importação)
                  </Text>
                  <Text style={{ fontSize: 13, fontFamily: 'Inter-Medium', color: featureTextColor, marginTop: 4 }}>
                    ✓ Relatórios detalhados em PDF
                  </Text>
                  <Text style={{ fontSize: 13, fontFamily: 'Inter-Medium', color: featureTextColor, marginTop: 4 }}>
                    ✓ Relatórios de inteligência de negócio
                  </Text>
                </View>
              )}
            </View>

            <View style={{ marginTop: 12 }}>
              <Button
                title="Gerenciar Plano"
                onPress={() => router.push('/planos')}
              />
            </View>
          </Card>
        </View>

        {/* Store Data */}
        <View style={styles.section}>
          <Card>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitleNoMargin}>
                <Store size={20} color={colors.primary} />
                Dados da Loja
              </Text>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setIsEditing(!isEditing)}
              >
                <Edit3 size={16} color={colors.primary} />
                <Text style={styles.editButtonText}>
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
                      <View style={styles.pixKeyInputContainer}>
                        <Text style={styles.pixKeyTypeLabel}>
                          {detectPixKeyType(pixKey)}
                        </Text>
                        <TextInput
                          style={[styles.input, styles.pixKeyInput]}
                          value={pixKey}
                          onChangeText={(text) => updatePixKey(index, text)}
                          placeholder="Digite sua chave (texto livre)"
                          placeholderTextColor={colors.textSecondary}
                        />
                      </View>
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
                      <View style={styles.pixKeyReadOnlyContainer}>
                        {pixKey.trim() !== '' && (
                          <Text style={styles.pixKeyTypeLabel}>
                            {detectPixKeyType(pixKey)}
                          </Text>
                        )}
                        <Text style={[styles.readOnlyText, styles.pixKeyText]}>{pixKey}</Text>
                      </View>
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
                  <Text style={styles.addPixButtonText}>
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
            <Text style={styles.sectionTitleWithMargin}>
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
                <Text style={styles.premiumBadgeOverlayText}>PREMIUM</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.sectionTitleWithMargin}>
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
                <Text style={premium ? styles.actionButtonTextPrimary : styles.actionButtonTextSecondary}>
                  {isExporting ? 'Exportando...' : 'Exportar Backup'}
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
                <Text style={premium ? styles.actionButtonTextPrimary : styles.actionButtonTextSecondary}>
                  {isImporting ? 'Importando...' : 'Importar Backup'}
                </Text>
              </TouchableOpacity>
            </View>

            {!premium && (
              <Text style={styles.dangerTextSmall}>
                Para acessar essas funcionalidades, assine o Premium
              </Text>
            )}

            {premium && (
              <Text style={styles.dangerTextSuccess}>
                ✅ Funcionalidades premium ativas - Backup e restauração do banco de dados liberadas
              </Text>
            )}
          </Card>
        </View>

        {/* Reset Database */}
        <View style={styles.dangerSection}>
          <Card style={styles.dangerCard}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetDatabase}
              disabled={isResetting}
            >
              <Trash2 size={24} color={colors.white} />
              <Text style={styles.resetButtonText}>
                {isResetting ? 'Resetando...' : 'RESETAR BANCO DE DADOS'}
              </Text>
            </TouchableOpacity>
          </Card>
        </View>

        {/* System Info */}
        <View style={styles.section}>
          <Card>
            <Text style={styles.sectionTitleWithMargin}>
              Informações do Sistema
            </Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Versão do App</Text>
              <Text style={styles.infoValue}>{Constants?.expoConfig?.version || '1.0.0'}</Text>
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

        {/* Perfil e Sair da conta */}
        <View style={styles.section}>
          <Card>
            <Text style={styles.sectionTitleWithMargin}>
              <UserIcon size={20} color={colors.primary} />
              Seu Perfil
            </Text>

            {user ? (
              <View style={{ marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
                  <Text style={{ color: colors.primary, fontSize: 18, fontFamily: 'Inter-Bold' }}>
                    {user.email?.charAt(0).toUpperCase() || '?'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: 14, fontFamily: 'Inter-SemiBold' }}>
                    Conta Conectada
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: 'Inter-Regular' }} numberOfLines={1}>
                    {user.email}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 14, fontFamily: 'Inter-Regular' }}>Nenhum usuário logado</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.resetButton, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
              disabled={isSigningOut}
              onPress={() =>
                Alert.alert(
                  'Sair da conta',
                  'Deseja desconectar sua conta? Você poderá entrar novamente quando quiser.',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Sair e Voltar para Login',
                      style: 'destructive',
                      onPress: async () => {
                        console.log('[Settings][SIGNOUT] Usuário confirmou desconectar conta.');
                        setIsSigningOut(true);
                        try {
                          await signOut();
                          console.log('[Settings][SIGNOUT] signOut concluído — AuthGate vai redirecionar para /login automaticamente.');
                          // NÃO chama router.replace('/login') aqui:
                          // AuthGate detecta isAuthenticated=false e já navega,
                          // chamar de novo causaria o erro REPLACE unhandled.
                        } catch (e) {
                          console.error('[Settings][SIGNOUT] Erro inesperado no signOut:', e);
                          setIsSigningOut(false);
                        }
                      },
                    },
                  ]
                )
              }
            >
              {isSigningOut ? (
                <ActivityIndicator size="small" color={colors.error} />
              ) : (
                <LogOut size={20} color={colors.error} />
              )}
              <Text style={[styles.resetButtonText, { color: colors.error }]}>
                {isSigningOut ? 'Desconectando...' : 'Desconectar Conta'}
              </Text>
            </TouchableOpacity>
          </Card>
        </View>
      </ScrollView>

      {/* Faixa colorida cobrindo a barra de gestos */}
      <View style={[styles.bottomSpacer, { height: bottomSpacer }]} />

      {/* Modal de Reset */}
      <Modal visible={showResetModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>⚠️ ZONA DE PERIGO</Text>
            <Text style={styles.modalText}>
              Esta ação irá APAGAR TODOS os dados do aplicativo permanentemente. Digite exatamente:
            </Text>
            <Text style={styles.modalTextBold}>
              deletar o banco
            </Text>
            <TextInput
              style={[styles.input, styles.confirmationInput]}
              value={resetConfirmText}
              onChangeText={setResetConfirmText}
              placeholder="Digite aqui para confirmar"
              placeholderTextColor={colors.textSecondary}
            />
            <View style={styles.modalButtonRow}>
              <Button title="Cancelar" variant="outline" onPress={() => { setShowResetModal(false); setResetConfirmText(''); }} style={styles.modalButtonFlex} />
              <Button
                title={isResetting ? 'Resetando...' : 'Apagar Tudo'}
                onPress={performDatabaseReset}
                disabled={isResetting || resetConfirmText.trim().toLowerCase() !== 'deletar o banco'}
                style={styles.modalButtonFlex}
              />
            </View>
            <Text style={styles.modalNote}>
              Observação: credenciais de login (OAuth) não serão apagadas.
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}
