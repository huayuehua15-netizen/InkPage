import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.inkpage.reader',
  appName: 'InkPage',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
};

export default config;
