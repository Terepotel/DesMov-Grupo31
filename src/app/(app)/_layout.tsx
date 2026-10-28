import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useSesion } from '@/modulos/autenticacion/contexto';

// Todo lo que está en (app) requiere sesión: el guard está en el _layout.tsx raíz.
// Las pestañas van en (tabs); lo que se abre encima de ellas, acá.
export default function AppLayout() {
  const { usuario } = useSesion();

  return (
    <>
      {/* El ingreso fuerza íconos oscuros; acá vuelven a seguir el tema. */}
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="reporte/[id]" />
        <Stack.Protected guard={usuario?.rol === 'vecino'}>
          <Stack.Screen name="nuevo-reporte" />
          <Stack.Screen name="corregir-ubicacion" />
          <Stack.Screen name="sacar-foto" />
        </Stack.Protected>
      </Stack>
    </>
  );
}
