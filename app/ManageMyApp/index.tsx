import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase';

const MANAGER_EMAIL = 'gourmetpastries.bw@gmail.com';
// Keep this in sync with app/_layout.tsx DRIVER_EMAIL
const DRIVER_EMAIL  = 'REPLACE_WITH_DRIVER_EMAIL@example.com';

export default function ManageMyAppIndex() {
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      if (!user) { router.replace('/auth/sign-in'); return; }
      const email = user.email ?? '';
      if (email === MANAGER_EMAIL) {
        router.replace('/ManageMyApp/dashboard');
      } else if (email === DRIVER_EMAIL) {
        router.replace('/ManageMyApp/driver');
      } else {
        router.replace('/auth/sign-in');
      }
    });
    return unsub;
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FADAD9' }}>
      <ActivityIndicator size="large" color="#CE6F79" />
    </View>
  );
}
