import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

export type Carga<T> =
  { tipo: 'cargando' } | { tipo: 'error'; mensaje: string } | { tipo: 'listo'; datos: T };

/**
 * Carga datos de un servicio cada vez que la pantalla vuelve a verse. Si al volver falla, se
 * quedan los datos que ya había. `cargar` tiene que ser estable (una función de módulo).
 */
export function useCarga<T>(cargar: () => Promise<T>) {
  const [carga, setCarga] = useState<Carga<T>>({ tipo: 'cargando' });
  const [intento, setIntento] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      cargar()
        .then((datos) => vigente && setCarga({ tipo: 'listo', datos }))
        .catch((error: unknown) => {
          if (!vigente) return;
          // Los mensajes de `ErrorApi` están escritos para mostrarse tal cual.
          const mensaje =
            error instanceof Error ? error.message : 'Algo salió mal. Probá de nuevo.';
          setCarga((anterior) =>
            anterior.tipo === 'listo' ? anterior : { tipo: 'error', mensaje },
          );
        });
      return () => {
        vigente = false;
      };
      // `intento` vuelve a disparar la carga al reintentar.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cargar, intento]),
  );

  function reintentar() {
    setCarga({ tipo: 'cargando' });
    setIntento((n) => n + 1);
  }

  return { carga, reintentar };
}
