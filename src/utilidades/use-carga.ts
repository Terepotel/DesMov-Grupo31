import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { mensajeDeError } from '@/servicios/api';

export type Carga<T> =
  { tipo: 'cargando' } | { tipo: 'error'; mensaje: string } | { tipo: 'listo'; datos: T };

/**
 * Carga datos de un servicio cada vez que la pantalla vuelve a verse. Si al volver falla, se
 * quedan los datos que ya había. `cargar` tiene que ser estable (una función de módulo, o un
 * `useCallback` si depende de un parámetro): si cambia (otro `id` en la misma pantalla), se
 * empieza de cero y los datos viejos no se conservan.
 */
export function useCarga<T>(cargar: () => Promise<T>) {
  const [carga, setCarga] = useState<Carga<T>>({ tipo: 'cargando' });
  const [intento, setIntento] = useState(0);
  const ultimoCargar = useRef(cargar);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      // Otra cosa que cargar: lo de antes ya no corresponde, ni para mostrar mientras carga.
      const esOtra = ultimoCargar.current !== cargar;
      ultimoCargar.current = cargar;
      if (esOtra) setCarga({ tipo: 'cargando' });
      cargar()
        .then((datos) => vigente && setCarga({ tipo: 'listo', datos }))
        .catch((error: unknown) => {
          if (!vigente) return;
          const mensaje = mensajeDeError(error);
          setCarga((anterior) =>
            anterior.tipo === 'listo' && !esOtra ? anterior : { tipo: 'error', mensaje },
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

  /** Vuelve a pedir sin vaciar la pantalla: lo que había se ve hasta que llega lo nuevo. */
  function recargar() {
    setIntento((n) => n + 1);
  }

  return { carga, reintentar, recargar };
}
