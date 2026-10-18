import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.sellora.app",
  appName: "Sellora",
  webDir: "dist",
  plugins: {
    // Las peticiones salen por el cliente HTTP nativo: sin CORS ni contenido mixto en dispositivo.
    CapacitorHttp: { enabled: true },
  },
};

export default config;
