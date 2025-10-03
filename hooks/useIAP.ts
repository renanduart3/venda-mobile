import { useEffect, useState } from 'react';
import {
  initConnection,
  endConnection,
  getAvailablePurchases,
  getProducts,
  requestSubscription,
  purchaseErrorListener,
  purchaseUpdatedListener,
  Product,
  SubscriptionPurchase,
} from 'react-native-iap';
import { Platform } from 'react-native';

const SKUS = Platform.select({
  ios: ['monthly_plan', 'yearly_plan'],
  android: ['monthly_plan', 'yearly_plan'],
});

const useIAP = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const initializeIAP = async () => {
      try {
        await initConnection();
        if (SKUS) {
          const fetchedProducts = await getProducts({ skus: SKUS });
          setProducts(fetchedProducts);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    initializeIAP();

    const purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase: SubscriptionPurchase) => {
      const receipt = purchase.transactionReceipt;
      if (receipt) {
        try {
          // Send receipt to backend for validation
          const response = await fetch('http://localhost:3000/validate-receipt', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              receipt,
              platform: Platform.OS,
            }),
          });

          const data = await response.json();
          if (data.success) {
            setIsPremium(true);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred');
        }
      }
    });

    const purchaseErrorSubscription = purchaseErrorListener((err) => {
      setError(err.message);
    });

    return () => {
      purchaseUpdateSubscription.remove();
      purchaseErrorSubscription.remove();
      endConnection();
    };
  }, []);

  const handleRequestSubscription = async (sku: string) => {
    try {
      await requestSubscription({ sku });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  const handleRestorePurchases = async () => {
    try {
      const availablePurchases = await getAvailablePurchases();
      if (availablePurchases.length > 0) {
        // Here you would typically validate the restored purchases with your backend
        // For now, we'll just assume the user is premium if they have any restored purchases
        setIsPremium(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  return {
    loading,
    error,
    products,
    isPremium,
    requestSubscription: handleRequestSubscription,
    restorePurchases: handleRestorePurchases,
  };
};

export default useIAP;