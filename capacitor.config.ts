import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.d4c17a8e4e114b4caebd031b0a7536d2',
  appName: 'Oppdretterhjelpen',
  webDir: 'dist',
  server: {
    url: 'https://feline-breeder-buddy.lovable.app?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
