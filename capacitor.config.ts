import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.f082f45ba1db4d218075e707c6f2e4d6',
  appName: 'Nightlife Generation',
  webDir: 'dist',
  server: {
    url: 'https://f082f45b-a1db-4d21-8075-e707c6f2e4d6.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    App: {
      // Custom URL scheme for deep linking (z.B. Payment Returns)
      url: 'nightlife',
    },
  },
};

export default config;
