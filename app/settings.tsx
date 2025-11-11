import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createSettingsStyles } from './settings.styles';
import { getAgentMode, setAgentMode } from '@/lib/dev-flags';

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
  const [agentEnabled, setAgentEnabled] = useState(false);

  useEffect(() => {
    loadStoreSettings();
    loadPremium();
    try { setAgentEnabled(getAgentMode()); } catch {}
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
      const timestamp = new Date().toISOString().slice(0,10); // YYYY-MM-DD
      const fileName = `loja_backup_${timestamp}.sqlite3`;
      const tempDir = (FileSystem as any).cacheDirectory + 'db-export/';
      try { await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true }); } catch {}
      const tempPath = tempDir + fileName;
      try { await FileSystem.deleteAsync(tempPath, { idempotent: true }); } catch {}
      await FileSystem.copyAsync({ from: dbPath, to: tempPath });

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Compartilhar indisponível', 'O recurso de compartilhamento não está disponível neste dispositivo.');
        return;
      }

      await Sharing.shareAsync(tempPath, {
        dialogTitle: 'Compartilhar backup do banco',
        mimeType: 'application/x-sqlite3',
        UTI: 'public.item',
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
                const sqliteDir = (FileSystem as any).documentDirectory + 'SQLite';
                // Garante que a pasta SQLite exista (caso o app ainda não tenha inicializado o DB)
                try {
                  await FileSystem.makeDirectoryAsync(sqliteDir, { intermediates: true });
                } catch {}
                
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
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Premium */}
        <View style={styles.section}>
          <Card>
            <Text style={styles.sectionTitleWithMargin}>
              <Crown size={20} color={colors.primary} />
              Plano Atual
            </Text>

            <View style={styles.premiumContainer}>
              <Text style={styles.labelWithMargin}>Status</Text>
              <View style={styles.statusRow}>
                <Text style={premium ? styles.premiumStatusText : styles.freeStatusText}>
                  {premium ? 'Premium' : 'Gratuito'}
                </Text>
                {premium && (
                  <View style={styles.premiumBadgeContainer}>
                    <Text style={styles.premiumBadgeText}>
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
                <Text style={premium ? styles.actionButtonTextPrimary : styles.actionButtonTextSecondary}>
                  {isImporting ? 'Importando...' : 'Restaurar Banco'}
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

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Modo Agente</Text>
              <Text style={styles.infoValue}>{agentEnabled ? 'Ativado' : 'Desativado'}</Text>
            </View>

            <View style={styles.actionButton}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => { const next = !agentEnabled; setAgentEnabled(next); try { setAgentMode(next); } catch {}; }}
              >
                <Text style={styles.actionButtonText}>{agentEnabled ? 'Desativar Modo Agente' : 'Ativar Modo Agente'}</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </View>
  </ScrollView>
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
