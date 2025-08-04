import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.fe1de34847614da489ff5b621d7706c8',
  appName: 'AutoGest - Gestão de Oficina',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    url: 'https://fe1de348-4761-4da4-89ff-5b621d7706c8.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#2563eb",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;