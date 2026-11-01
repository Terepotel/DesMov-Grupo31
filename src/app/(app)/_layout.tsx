import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { useSesion } from '@/modulos/autenticacion/contexto';
import { useAvisosDeLaCola } from '@/servicios/avisos-locales';
import { useSincronizarCola } from '@/servicios/cola';
import { guardarReportesDeLaCiudad } from '@/servicios/reportes';

// Todo lo que está en (app) requiere sesión: el guard está en el _layout.tsx raíz.
// Las pestañas van en (tabs); lo que se abre encima de ellas, acá.
export default function AppLayout() {
  const { usuario } = useSesion();
  // R1.7: los reportes que quedaron sin subir se mandan solos, sin que el vecino haga nada.
  useSincronizarCola(usuario?.rol === 'vecino' ? usuario.id : null);
  // P2: el número llega en un aviso del teléfono, si el vecino los tiene activos en su cuenta.
  useAvisosDeLaCola(usuario?.rol === 'vecino' && usuario.avisosActivos);
  // Para que el mapa y los cercanos tengan qué mostrar sin señal.
  useEffect(() => {
    void guardarReportesDeLaCiudad();
  }, []);

  return (
    <>
      {/* El ingreso fuerza íconos oscuros; acá vuelven a seguir el tema. */}
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="reporte/[id]" />
        {/* La cámara la usan los dos: el vecino para el problema, el operador para el arreglo. */}
        <Stack.Screen name="sacar-foto" />
        <Stack.Protected guard={usuario?.rol === 'vecino'}>
          <Stack.Screen name="nuevo-reporte" />
          <Stack.Screen name="corregir-ubicacion" />
        </Stack.Protected>
      </Stack>
    </>
  );
}
