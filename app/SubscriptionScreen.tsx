import React from 'react';
import { View, Text, Button, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import useIAP from '../hooks/useIAP';
import { useTheme } from '@/contexts/ThemeContext';

const SubscriptionScreen = () => {
  const { loading, error, products, isPremium, requestSubscription, restorePurchases } = useIAP();
  const { colors } = useTheme();

  if (loading) {
    return <ActivityIndicator size="large" style={styles.center} />;
  }

  if (error) {
    Alert.alert('Error', error);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        {isPremium ? 'You are a Premium User!' : 'Choose a Plan'}
      </Text>

      {!isPremium &&
        products.map((product) => (
          <View key={product.productId} style={styles.product}>
            <Text style={[styles.productTitle, { color: colors.text }]}>{product.title}</Text>
            <Text style={[styles.productPrice, { color: colors.textSecondary }]}>{product.localizedPrice}</Text>
            <Button
              title="Subscribe"
              onPress={() => requestSubscription(product.productId)}
              color={colors.primary}
            />
          </View>
        ))}

      <View style={styles.restoreButton}>
        <Button
          title="Restore Purchases"
          onPress={restorePurchases}
          color={colors.primary}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  product: {
    marginBottom: 15,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  productTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  productPrice: {
    fontSize: 16,
    marginVertical: 5,
  },
  restoreButton: {
    marginTop: 20,
  },
});

export default SubscriptionScreen;