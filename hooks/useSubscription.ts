import { useState, useEffect } from 'react';
import * as RNIap from 'react-native-iap';
import { Platform } from 'react-native';

const itemSkus = Platform.select({
  ios: ['sub_premium_mensal'],
  android: ['sub_premium_mensal'],
}) as string[];

export const useSubscription = () => {
  const [products, setProducts] = useState<RNIap.Product[]>([]);
  const [subscriptions, setSubscriptions] = useState<RNIap.Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initIAP = async () => {
      try {
        await RNIap.initConnection();
        // Buscar inscrições
        if (itemSkus.length > 0) {
          const subs = await RNIap.getSubscriptions({ skus: itemSkus });
          if (isMounted) setSubscriptions(subs);
        }
      } catch (err) {
        console.error('Erro ao inicializar o IAP:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initIAP();

    return () => {
      isMounted = false;
      RNIap.endConnection();
    };
  }, []);

  const purchaseSubscription = async (sku: string) => {
    try {
      await RNIap.requestSubscription({ sku });
    } catch (err) {
      console.warn('Erro na compra:', err);
      throw err;
    }
  };

  return {
    subscriptions,
    products,
    loading,
    purchaseSubscription,
  };
};

/* 
 * Uso no componente (Exemplo):
 * 
 * const { subscriptions } = useSubscription();
 * const premiumSub = subscriptions.find(sub => sub.productId === 'sub_premium_mensal');
 * 
 * // O RNIap já retorna a string formatada na variável `localizedPrice` contendo a moeda + valor local (ex: "R$ 20,00" ou "$ 10.00")
 * const precoFormatado = premiumSub?.subscriptionOfferDetails?.[0]?.pricingPhases?.pricingPhaseList?.[0]?.formattedPrice || 'Preço indisponível';
 * 
 * <Text>{precoFormatado}</Text>
 */
