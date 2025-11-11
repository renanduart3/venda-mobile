import React from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Button } from './ui/Button';
import { TextInput } from './ui/TextInput';
import { CheckCircle, RotateCcw } from 'lucide-react-native';

interface ExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
  formData: {
    name: string;
    amount: string;
    due_date: string;
    paid: boolean;
    recurring: boolean;
    customer_id: string;
  };
  setFormData: any;
  customers: any[];
  customerSearchQuery: string;
  setCustomerSearchQuery: (query: string) => void;
  editingExpense: any;
  styles: any;
  colors: any;
}

// Recebe props para controlar visibilidade, dados do formulário, handlers, estilos, etc
export default function ExpenseModal({
  visible,
  onClose,
  onSave,
  formData,
  setFormData,
  customers,
  customerSearchQuery,
  setCustomerSearchQuery,
  editingExpense,
  styles,
  colors,
}: ExpenseModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {editingExpense ? 'Editar Despesa' : 'Nova Despesa'}
          </Text>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nome da Despesa *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text: string) => setFormData({ ...formData, name: text })}
                placeholder="Ex: Aluguel, Conta de Luz..."
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Valor *</Text>
              <TextInput
                style={styles.input}
                value={formData.amount}
                onChangeText={(text: string) => setFormData({ ...formData, amount: text })}
                placeholder="0,00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Data de Vencimento (opcional)</Text>
              <View style={styles.dateInputContainer}>
                <TextInput
                  style={[styles.input, styles.dateInput]}
                  value={formData.due_date}
                  onChangeText={(text: string) => {
                    let formatted = text.replace(/\D/g, '');
                    if (formatted.length >= 2) {
                      formatted = formatted.substring(0, 2) + '/' + formatted.substring(2);
                    }
                    if (formatted.length >= 5) {
                      formatted = formatted.substring(0, 5) + '/' + formatted.substring(5, 9);
                    }
                    setFormData({ ...formData, due_date: formatted });
                  }}
                  placeholder="DD/MM/AAAA (ex: 25/12/2024)"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  maxLength={10}
                />
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => {
                    const today = new Date();
                    const day = String(today.getDate()).padStart(2, '0');
                    const month = String(today.getMonth() + 1).padStart(2, '0');
                    const year = today.getFullYear();
                    setFormData({ ...formData, due_date: `${day}/${month}/${year}` });
                  }}
                >
                  <Text style={styles.dateButtonText}>Hoje</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Cliente (opcional)</Text>
              <View style={styles.customerSelector}>
                <TextInput
                  style={styles.input}
                  value={formData.customer_id ? (customers.find((c: any) => c.id === formData.customer_id)?.name || '') : customerSearchQuery}
                  onChangeText={(text: string) => {
                    setCustomerSearchQuery(text);
                    if (!text) {
                      setFormData({ ...formData, customer_id: '' });
                    }
                  }}
                  placeholder="Digite o nome do cliente..."
                  placeholderTextColor={colors.textSecondary}
                />
                {formData.customer_id && (
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => {
                      setFormData({ ...formData, customer_id: '' });
                      setCustomerSearchQuery('');
                    }}
                  >
                    <Text style={styles.clearButtonText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              {customerSearchQuery && customerSearchQuery.length > 0 && (
                <View style={styles.customerSuggestions}>
                  {customers
                    .filter((customer: any) =>
                      customer.name.toLowerCase().includes(customerSearchQuery.toLowerCase())
                    )
                    .slice(0, 5)
                    .map((customer: any) => (
                      <TouchableOpacity
                        key={customer.id}
                        style={styles.customerSuggestion}
                        onPress={() => {
                          setFormData({ ...formData, customer_id: customer.id });
                          setCustomerSearchQuery('');
                        }}
                      >
                        <Text style={styles.customerSuggestionName}>{customer.name}</Text>
                        {customer.email && (
                          <Text style={styles.customerSuggestionEmail}>{customer.email}</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                </View>
              )}
            </View>

            <View style={styles.formGroup}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setFormData({ ...formData, paid: !formData.paid })}
              >
                <View style={[styles.checkbox, formData.paid && styles.checkboxChecked]}>
                  {formData.paid && <CheckCircle size={12} color={colors.white} />}
                </View>
                <Text style={styles.checkboxText}>Pago</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setFormData({ ...formData, recurring: !formData.recurring })}
              >
                <View style={[styles.checkbox, formData.recurring && styles.checkboxChecked]}>
                  {formData.recurring && <RotateCcw size={12} color={colors.white} />}
                </View>
                <Text style={styles.checkboxText}>Recorrente</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.modalButtons}>
            <Button
              title="Cancelar"
              onPress={onClose}
              variant="outline"
              style={styles.modalButton}
            />
            <Button
              title="Salvar"
              onPress={onSave}
              style={styles.modalButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
