import AsyncStorage from '@react-native-async-storage/async-storage';

const PREMIUM_KEY = 'is_premium_v1';

export async function isPremium(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(PREMIUM_KEY);
    return v === '1';
  } catch (e) {
    console.error('Error reading premium flag', e);
    return false;
  }
}

export async function enablePremium() {
  try {
    await AsyncStorage.setItem(PREMIUM_KEY, '1');
    return true;
  } catch (e) {
    console.error('Error enabling premium', e);
    return false;
  }
}

export async function disablePremium() {
  try {
    await AsyncStorage.removeItem(PREMIUM_KEY);
    return true;
  } catch (e) {
    console.error('Error disabling premium', e);
    return false;
  }
}
