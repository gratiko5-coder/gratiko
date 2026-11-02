import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gratiko.app',
  appName: 'GRATIKO',
  webDir: 'public',
  server: {
    // L'application native Android pointe directement sur votre plateforme déployée
    // Permet les mises à jour instantanées sans recompiler l'APK à chaque modification
    url: 'https://gratiko.vercel.app',
    cleartext: false,
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    backgroundColor: '#0b0f19',
  },
};

export default config;
