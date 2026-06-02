import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.nightlife.app',
  appName: 'Nightlife Generation',
  webDir: 'dist',
  // Versioning wird in Xcode gesetzt (Marketing Version + Build Number),
  // nicht hier. Aktuell im Store: 1.0.1 (Build 1.2.0).
  // Nächstes Update MUSS höher sein, z.B. Version 1.1.0, Build 1.2.1.
  plugins: {
    App: {
      url: 'nightlife',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#0a0a0f',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#0a0a0f',
  },
};

export default config;
