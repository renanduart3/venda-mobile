
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { usePremium } from '../../contexts/PremiumContext'; // Supondo que o contexto premium exista

const premiumReports = [
  { id: '1', title: 'Relatório de Produtos Mais Vendidos', description: 'Descubra quais produtos seus clientes mais amam.', icon: 'trophy' },
  { id: '2', title: 'Curva ABC de Produtos', description: 'Classifique seus produtos pela importância nas vendas.', icon: 'chart-pie' },
  { id: '3', title: 'Análise de Vendas por Período', description: 'Compare o desempenho de vendas ao longo do tempo.', icon: 'chart-line' },
  { id: '4', title: 'Performance de Meios de Pagamento', description: 'Entenda como seus clientes preferem pagar.', icon: 'cash-register' },
  { id: '5', title: 'Horários de Pico de Vendas', description: 'Saiba os horários de maior movimento na sua loja.', icon: 'clock' },
  { id: '6', title: 'Ranking de Clientes (RFV)', description: 'Identifique seus clientes mais valiosos.', icon: 'users' },
  { id: '7', title: 'Clientes Inativos', description: 'Crie campanhas para reativar clientes que não compram há algum tempo.', icon: 'user-slash' },
  { id: '8', title: 'Análise de Margem de Lucro', description: 'Descubra quais produtos são mais lucrativos.', icon: 'dollar-sign' },
];

export default function AnalisesScreen() {
  const router = useRouter();
  const { isPremium, showPremiumDialog } = usePremium(); // Supondo que o contexto premium exista

  const handleReportPress = (report) => {
    if (!isPremium) {
      showPremiumDialog();
    } else {
      // Navegaria para a tela do relatório específico
      router.push(`/relatorios/${report.id}`);
    }
  };

  const renderReportItem = ({ item }) => (
    <TouchableOpacity style={styles.reportItem} onPress={() => handleReportPress(item)}>
      <FontAwesome5 name={item.icon} size={24} color="#3498db" style={styles.icon} />
      <View style={styles.reportTextContainer}>
        <Text style={styles.reportTitle}>{item.title}</Text>
        <Text style={styles.reportDescription}>{item.description}</Text>
      </View>
      {!isPremium && <FontAwesome5 name="lock" size={20} color="#e74c3c" />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Análises Premium</Text>
      <FlatList
        data={premiumReports}
        renderItem={renderReportItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#333',
  },
  listContainer: {
    paddingHorizontal: 15,
  },
  reportItem: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  icon: {
    marginRight: 15,
  },
  reportTextContainer: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  reportDescription: {
    fontSize: 13,
    color: '#7f8c8d',
    marginTop: 3,
  },
});
