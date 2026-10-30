// El aviso del teléfono cuando la cola sube un reporte sin que el vecino esté mirando (P2, R5.3).
// Es local, sin servidor: lo arma la app con el número que devolvió la API. Las push de la API
// (`/dispositivos`) son otra cosa y siguen en espera.

import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import type { Reporte } from '@/tipos';

import { alSubirDeLaCola } from './cola';

const CANAL = 'reportes';

// Con la app abierta también se ve: el vecino puede estar en otra pantalla.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function prepararCanal() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CANAL, {
    name: 'Tus reportes',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/**
 * Cuando el reporte queda en la cola: es el momento en que se entiende para qué es el permiso.
 * Si ya dijo que no, no se vuelve a preguntar. Nunca lanza.
 */
export async function pedirPermisoDeAvisos() {
  try {
    await prepararCanal();
    const actual = await Notifications.getPermissionsAsync();
    if (actual.granted || !actual.canAskAgain) return;
    await Notifications.requestPermissionsAsync();
  } catch {
    // Sin avisos el reporte se sube igual; el vecino lo ve en «Mis reportes».
  }
}

async function avisarReporteSubido(reporte: Reporte) {
  try {
    if (!(await Notifications.getPermissionsAsync()).granted) return;
    await prepararCanal();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Tu reporte se envió',
        body: `Tu reporte en ${reporte.direccion} se envió con el número ${reporte.codigo}.`,
        data: { reporteId: reporte.id },
      },
      trigger: Platform.OS === 'android' ? { channelId: CANAL } : null,
    });
  } catch {
    // El número igual aparece en «Mis reportes».
  }
}

/**
 * En el layout con sesión: avisa cada reporte que sube la cola, si el vecino tiene los avisos
 * activos en su cuenta, y al tocar el aviso abre el reporte.
 */
export function useAvisosDeLaCola(avisosActivos: boolean) {
  useEffect(() => {
    if (!avisosActivos) return;
    return alSubirDeLaCola((reporte) => void avisarReporteSubido(reporte));
  }, [avisosActivos]);

  useEffect(() => {
    const toque = Notifications.addNotificationResponseReceivedListener((respuesta) => {
      const id = respuesta.notification.request.content.data?.reporteId;
      if (typeof id === 'string') router.push({ pathname: '/reporte/[id]', params: { id } });
    });
    return () => toque.remove();
  }, []);
}
