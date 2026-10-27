import { StatusBar } from 'expo-status-bar';

import AppTabs from '@/components/app-tabs';

// Todo lo que está en (app) requiere sesión: el guard está en el _layout.tsx raíz.
export default function AppLayout() {
  return (
    <>
      {/* El ingreso fuerza íconos oscuros; acá vuelven a seguir el tema. */}
      <StatusBar style="auto" />
      <AppTabs />
    </>
  );
}
