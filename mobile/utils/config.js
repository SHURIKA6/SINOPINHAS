import Constants from 'expo-constants';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://backend.fernandoriaddasilvaribeiro.workers.dev';
export const APP_NAME = process.env.EXPO_PUBLIC_APP_NAME || 'SINOPINHAS';
export const APP_SCHEME = process.env.EXPO_PUBLIC_APP_SCHEME || 'sinopinhas';
export const API_TIMEOUT = 30000; // 30 seconds
export const REQUEST_RETRY_COUNT = 3;
export const REQUEST_RETRY_DELAY = 1000; // 1 second

// Deep link configuration
export const linking = {
  prefixes: [`${APP_SCHEME}://`, 'https://sinopinhas.vercel.app'],
  config: {
    screens: {
      '(tabs)': {
        screens: {
          index: 'feed',
          search: 'explore',
          upload: 'upload',
          profile: 'profile/:username',
        },
      },
      '(auth)': {
        screens: {
          login: 'login',
          register: 'register',
        },
      },
    },
  },
};
