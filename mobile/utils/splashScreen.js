/**
 * Splashscreen Configuração
 * Este arquivo define o comportamento da splash screen
 */
import * as SplashScreen from 'expo-splash-screen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export const hideSplash = async () => {
  try {
    await SplashScreen.hideAsync();
  } catch (e) {
    console.warn(e);
  }
};
