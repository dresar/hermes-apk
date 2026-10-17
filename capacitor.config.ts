import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ai.hermes.gateway',
  appName: 'Hermes',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_hermes',
      iconColor: '#ff6347'
    }
  }
};

export default config;
