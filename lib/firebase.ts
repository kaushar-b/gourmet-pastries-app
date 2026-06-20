import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyDrNRm208szSvHzb7iXPBuZUqm5RutfnVg',
  authDomain: 'gourmet-pastries.firebaseapp.com',
  projectId: 'gourmet-pastries',
  storageBucket: 'gourmet-pastries.firebasestorage.app',
  messagingSenderId: '1037415120401',
  appId: '1:1037415120401:web:ea5f744dbc800646ffbbb0',
  databaseURL: 'https://gourmet-pastries-default-rtdb.firebaseio.com',
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getDatabase(app);
