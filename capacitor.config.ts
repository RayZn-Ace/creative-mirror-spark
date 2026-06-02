import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'de.nightlifegeneration.app',
  appName: 'Nightlife Generation',
  webDir: 'dist',
  // Production build: lädt den lokal gebauten Web-Code (kein Hot-Reload aus Sandbox).
  // Für lokales Testing mit Live-Preview kannst du temporär ein "server"-Objekt einfügen.
  plugins: {
    App: {
      // Deep Linking (z.B. nightlife://payment-return)
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
