import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  Linking
} from 'react-native';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users,
  Phone,
  Mail,
  MessageCircle
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  whatsapp: boolean;
  created_at: string;
  updated_at: string;
}

export default function Clientes() {
  const { colors } = useTheme();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    whatsapp: false,
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    // TODO: Load from local storage and sync with Supabase
    const mockCustomers: Customer[] = [
      {
        id: '1',
        name: 'Maria Silva',
        phone: '(11) 99999-9999',
        email: 'maria@email.com',
        whatsapp: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'João Santos',
        phone: '(11) 88888-8888',
        email: 'joao@email.com',
        whatsapp: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '3',
        name: 'Ana Costa',
        phone: '(11) 77777-7777',
        whatsapp: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    setCustomers(mockCustomers);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.includes(searchQuery) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openCustomerModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        phone: customer.phone || '',
        email: customer.email || '',
        whatsapp: customer.whatsapp,
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        whatsapp: false,
      });
    }
    setShowCustomerModal(true);
  };

  const closeCustomerModal = () => {
    setShowCustomerModal(false);
    setEditingCustomer(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      whatsapp: false,
    });
  };

  const saveCustomer = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Erro', 'O nome é obrigatório.');
      return;
    }

    try {
      const customerData = {
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        whatsapp: formData.whatsapp,
      };

      if (editingCustomer) {
        // Update existing customer
        const updatedCustomer: Customer = {
          ...editingCustomer,
          ...customerData,
          updated_at: new Date().toISOString(),
        };
        setCustomers(customers.map(c => c.id === editingCustomer.id ? updatedCustomer : c));
      } else {
        // Create new customer
        const newCustomer: Customer = {
          id: Date.now().toString(),
          ...customerData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setCustomers([...customers, newCustomer]);
      }

      closeCustomerModal();
      Alert.alert('Sucesso', 'Cliente salvo com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar o cliente.');
    }
  };

  const deleteCustomer = (customer: Customer) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente excluir o cliente "${customer.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            setCustomers(customers.filter(c => c.id !== customer.id));
          },
        },
      ]
    );
  };

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const url = `https://wa.me/55${cleanPhone}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Erro', 'Não foi possível abrir o WhatsApp.');
    });
  };

  const makePhoneCall = (phone: string) => {
    const url = `tel:${phone}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Erro', 'Não foi possível fazer a ligação.');
    });
  };

  const sendEmail = (email: string) => {
    const url = `mailto:${email}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Erro', 'Não foi possível abrir o aplicativo de email.');
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    controls: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 20,
    },
    searchContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 8,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.text,
      marginLeft: 8,
    },
    addButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    customerCard: {
      marginBottom: 12,
    },
    customerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    customerIcon: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: colors.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
    },
    customerInfo: {
      flex: 1,
    },
    customerName: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 4,
    },
    contactInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 2,
    },
    contactText: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    contactButton: {
      padding: 4,
      borderRadius: 4,
    },
    whatsappButton: {
      backgroundColor: '#25D366',
    },
    actions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      padding: 8,
      borderRadius: 6,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 20,
      width: '100%',
      maxWidth: 400,
    },
    modalTitle: {
      fontSize: 20,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      marginBottom: 20,
      textAlign: 'center',
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
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    checkboxText: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.text,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },
    modalButton: {
      flex: 1,
    },
  });

  const CustomerModal = () => (
    <Modal visible={showCustomerModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
          </Text>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nome *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Nome completo"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Telefone</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="(11) 99999-9999"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="email@exemplo.com"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setFormData({ ...formData, whatsapp: !formData.whatsapp })}
              >
                <View style={[styles.checkbox, formData.whatsapp && styles.checkboxChecked]}>
                  {formData.whatsapp && <MessageCircle size={12} color={colors.white} />}
                </View>
                <Text style={styles.checkboxText}>Tem WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.modalButtons}>
            <Button
              title="Cancelar"
              onPress={closeCustomerModal}
              variant="outline"
              style={styles.modalButton}
            />
            <Button
              title="Salvar"
              onPress={saveCustomer}
              style={styles.modalButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Header title="Clientes" />
      
      <View style={styles.content}>
        {/* Controls */}
        <View style={styles.controls}>
          <View style={styles.searchContainer}>
            <Search size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar clientes..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => openCustomerModal()}
          >
            <Plus size={20} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Customers List */}
        <FlatList
          data={filteredCustomers}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: customer }) => (
            <Card style={styles.customerCard}>
              <View style={styles.customerItem}>
                <View style={styles.customerIcon}>
                  <Users size={24} color={colors.primary} />
                </View>
                
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>
                    {customer.name}
                  </Text>
                  
                  {customer.phone && (
                    <View style={styles.contactInfo}>
                      <Phone size={12} color={colors.textSecondary} />
                      <TouchableOpacity onPress={() => makePhoneCall(customer.phone!)}>
                        <Text style={[styles.contactText, { color: colors.primary }]}>
                          {customer.phone}
                        </Text>
                      </TouchableOpacity>
                      {customer.whatsapp && (
                        <TouchableOpacity
                          style={[styles.contactButton, styles.whatsappButton]}
                          onPress={() => openWhatsApp(customer.phone!)}
                        >
                          <MessageCircle size={12} color="white" />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                  
                  {customer.email && (
                    <View style={styles.contactInfo}>
                      <Mail size={12} color={colors.textSecondary} />
                      <TouchableOpacity onPress={() => sendEmail(customer.email!)}>
                        <Text style={[styles.contactText, { color: colors.primary }]}>
                          {customer.email}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => openCustomerModal(customer)}
                  >
                    <Edit size={16} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => deleteCustomer(customer)}
                  >
                    <Trash2 size={16} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          )}
        />
      </View>

      <CustomerModal />
    </View>
  );
}