import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch
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
  AlertTriangle
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { router } from 'expo-router';

export default function Settings() {
  const { colors, theme, setTheme, setPrimaryColor, setSecondaryColor } = useTheme();
  const isOnline = true;
  const lastSync = null;
  const syncData = async () => { };

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
  const [premium, setPremium] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    loadStoreSettings();
    loadPremium();
  }, []);

  const loadPremium = async () => {
    try {
      setPremium(false); // Temporariamente false para teste
    } catch (e) {
      console.error('Erro carregando premium', e);
    }
  };

  const loadStoreSettings = async () => {
    setStoreSettings({
      storeName: 'Minha Loja',
      ownerName: 'João Silva',
      pixKey: 'joao@email.com',
    });
  };

  const saveStoreSettings = async () => {
    try {
      Alert.alert('Sucesso', 'Configurações salvas com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar as configurações.');
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

  // Reset Database Functions
  const resetDatabase = async () => {
    Alert.prompt(
      '⚠️ ZONA DE PERIGO - AÇÃO IRREVERSÍVEL',
      'Esta ação irá APAGAR TODOS os dados do aplicativo permanentemente:\n\n• Todos os clientes\n• Todos os produtos\n• Todas as vendas\n• Todas as despesas\n• Todas as configurações\n\nEsta ação NÃO PODE ser desfeita!\n\nPara confirmar, digite exatamente:\n"eu tenho certeza que quero deletar o banco"',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'APAGAR TUDO',
          style: 'destructive',
          onPress: async (confirmationText) => {
            if (confirmationText !== 'eu tenho certeza que quero deletar o banco') {
              Alert.alert('Confirmação Incorreta', 'Digite exatamente: "eu tenho certeza que quero deletar o banco"');
              return;
            }
            
            setIsResetting(true);
            try {
              // Aqui você implementaria a limpeza real do banco
              // Por enquanto, apenas simular
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              Alert.alert('✅ Banco Resetado', 'Todos os dados foram apagados com sucesso!');
            } catch (error) {
              Alert.alert('❌ Erro', 'Não foi possível resetar o banco de dados.');
            } finally {
              setIsResetting(false);
            }
          }
        }
      ],
      'plain-text',
      '',
      'default'
    );
  };

  // Export/Import Functions
  const exportData = async () => {
    if (!premium) {
      Alert.alert('Premium Necessário', 'A funcionalidade de exportação está disponível apenas para usuários Premium.');
      return;
    }

    setIsExporting(true);
    try {
      // Simular coleta de dados do banco
      const exportData = {
        customers: [],
        products: [],
        sales: [],
        expenses: [],
        settings: storeSettings,
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };

      const csvContent = convertToCSV(exportData);
      const fileName = `loja_backup_${new Date().toISOString().split('T')[0]}.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, csvContent);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
        Alert.alert('✅ Exportação Concluída', 'Dados exportados com sucesso!');
      } else {
        Alert.alert('❌ Erro', 'Não foi possível compartilhar o arquivo.');
      }
    } catch (error) {
      Alert.alert('❌ Erro', 'Não foi possível exportar os dados.');
    } finally {
      setIsExporting(false);
    }
  };

  const importData = async () => {
    if (!premium) {
      Alert.alert('Premium Necessário', 'A funcionalidade de importação está disponível apenas para usuários Premium.');
      return;
    }

    setIsImporting(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true
      });

      if (result.canceled) {
        setIsImporting(false);
        return;
      }

      const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
      const importedData = parseCSV(fileContent);

      if (!validateImportData(importedData)) {
        Alert.alert('❌ Arquivo Inválido', 'O arquivo não possui a estrutura correta para importação.');
        setIsImporting(false);
        return;
      }

      Alert.alert(
        'Confirmar Importação',
        'Esta ação irá substituir todos os dados atuais pelos dados do arquivo. Deseja continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Importar',
            onPress: async () => {
              // Aqui você implementaria a importação real
              Alert.alert('✅ Importação Concluída', 'Dados importados com sucesso!');
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('❌ Erro', 'Não foi possível importar os dados.');
    } finally {
      setIsImporting(false);
    }
  };

  // Helper Functions
  const convertToCSV = (data: any) => {
    const headers = ['type', 'id', 'name', 'value', 'date', 'metadata'];
    const rows = [headers.join(',')];
    
    // Simular dados para CSV
    Object.entries(data).forEach(([type, items]: [string, any]) => {
      if (Array.isArray(items)) {
        items.forEach((item: any) => {
          const row = [
            type,
            item.id || '',
            item.name || '',
            item.value || '',
            item.date || '',
            JSON.stringify(item)
          ];
          rows.push(row.join(','));
        });
      }
    });
    
    return rows.join('\n');
  };

  const parseCSV = (csvContent: string) => {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',');
    const data: any = {};
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length === headers.length) {
        const type = values[0];
        if (!data[type]) data[type] = [];
        data[type].push({
          id: values[1],
          name: values[2],
          value: values[3],
          date: values[4],
          metadata: JSON.parse(values[5] || '{}')
        });
      }
    }
    
    return data;
  };

  const validateImportData = (data: any) => {
    const requiredTypes = ['customers', 'products', 'sales', 'expenses'];
    return requiredTypes.every(type => data[type] && Array.isArray(data[type]));
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

      <ScrollView style={[styles.content, { marginBottom: 30 }]} showsVerticalScrollIndicator={false}>
        {/* Premium */}
        <View style={styles.section}>
          <Card>
            <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>
              <Crown size={20} color={colors.primary} />
              Premium
            </Text>

            <View style={{ marginBottom: 12 }}>
              <Text style={styles.label}>Plano Atual</Text>
              <Text style={[styles.infoValue, {
                color: premium ? colors.primary : colors.textSecondary,
                fontFamily: 'Inter-SemiBold'
              }]}>
                {premium ? 'Premium Ativo' : 'Gratuito'}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <Button
                title={premium ? "Gerenciar Plano" : "Fazer Upgrade"}
                onPress={() => router.push('/planos')}
                style={{ flex: 1 }}
              />
            </View>
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
                <Download size={20} color={colors.primary} />
                <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                  {isExporting ? 'Exportando...' : 'Exportar Dados'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionButton}>
              <TouchableOpacity
                style={[styles.actionButton, !premium && styles.actionButtonDisabled]}
                onPress={importData}
                disabled={!premium || isImporting}
              >
                <Upload size={20} color={colors.primary} />
                <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                  {isImporting ? 'Importando...' : 'Importar Dados'}
                </Text>
              </TouchableOpacity>
            </View>

            {!premium && (
              <Text style={[styles.dangerText, { color: colors.textSecondary, fontSize: 12, marginTop: 8 }]}>
                Para acessar essas funcionalidades, assine o Premium
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
    </View>
  );
}
