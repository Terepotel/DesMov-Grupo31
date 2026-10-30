// P20: mientras el vecino encuadra, si el teléfono se mueve, la foto puede salir movida. Esto sólo
// avisa (con DeviceMotion de expo-sensors); nunca frena el disparo. Si el teléfono no tiene el
// sensor o no da permiso, no avisa y la cámara anda igual.

import { DeviceMotion, type DeviceMotionMeasurement } from 'expo-sensors';
import { useEffect, useState } from 'react';

/** Cada cuánto llega una medida. Más seguido no cambia nada para un aviso. */
const INTERVALO_MS = 100;
/** Giro, en grados por segundo: el pulso de una mano quieta queda por debajo. */
const GIRO_MAXIMO = 25;
/** Sacudida, en m/s² sin la gravedad. */
const SACUDIDA_MAXIMA = 1.2;
/** Cuánto tiene que quedarse quieto para que el aviso se vaya: así no parpadea. */
const QUIETO_MS = 600;

function seMueve({ rotationRate, acceleration }: DeviceMotionMeasurement) {
  const giro = rotationRate
    ? Math.hypot(rotationRate.alpha, rotationRate.beta, rotationRate.gamma)
    : 0;
  const sacudida = acceleration ? Math.hypot(acceleration.x, acceleration.y, acceleration.z) : 0;
  return giro > GIRO_MAXIMO || sacudida > SACUDIDA_MAXIMA;
}

/** `true` mientras el teléfono se mueve. Con `activo` en `false` no escucha el sensor. */
export function useFotoMovida(activo: boolean) {
  const [movida, setMovida] = useState(false);

  useEffect(() => {
    if (!activo) return;
    let cancelado = false;
    let suscripcion: { remove: () => void } | null = null;
    let ultimoMovimiento = 0;

    void (async () => {
      try {
        if (!(await DeviceMotion.isAvailableAsync()) || cancelado) return;
        DeviceMotion.setUpdateInterval(INTERVALO_MS);
        suscripcion = DeviceMotion.addListener((medida) => {
          const ahora = Date.now();
          if (seMueve(medida)) ultimoMovimiento = ahora;
          setMovida(ahora - ultimoMovimiento < QUIETO_MS);
        });
      } catch {
        // Sin sensor no hay aviso: la foto se saca igual.
      }
    })();

    return () => {
      cancelado = true;
      suscripcion?.remove();
    };
  }, [activo]);

  // Apagado, no avisa aunque la última medida haya sido de movimiento.
  return activo && movida;
}
