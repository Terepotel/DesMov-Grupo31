import { useState } from 'react';
import { View } from 'react-native';

import { Aviso } from '@/componentes/ui/aviso';
import { Boton } from '@/componentes/ui/boton';
import { DESTINOS_POR_ESTADO } from '@/servicios/reportes';
import type { Reporte } from '@/tipos';

import { accionesDeEstado, describirCambio } from './acciones-de-estado';
import { HojaCambioDeEstado } from './hoja-cambio-de-estado';
import { HojaMarcarDuplicado } from './hoja-marcar-duplicado';

type Props = {
  reporte: Reporte;
  /** Después de un cambio: el detalle vuelve a pedir el reporte y su historial. */
  alCambiar: () => void;
};

type Resultado =
  { tipo: 'nada' } | { tipo: 'cambiado'; mensaje: string } | { tipo: 'error'; mensaje: string };

type Hoja = 'estado' | 'duplicado' | null;

/**
 * Las acciones de gestión del operador al pie del detalle (R4.2, R4.4). Un botón por acción, y cada
 * una abre una hoja donde se elige, se explica y se confirma: así un toque de más no cambia nada.
 * «Cambiar el estado» va por `PATCH /estado`; «Marcar como duplicado» por `POST /duplicado`, que
 * también rechaza el reporte. Un reporte cerrado no tiene acciones.
 */
export function AccionesOperador({ reporte, alCambiar }: Props) {
  const [abierta, setAbierta] = useState<Hoja>(null);
  // Cada apertura monta la hoja de nuevo: lo elegido y escrito la vez anterior no queda.
  const [vez, setVez] = useState(0);
  const [resultado, setResultado] = useState<Resultado>({ tipo: 'nada' });
  const acciones = accionesDeEstado(reporte);
  // Marcar duplicado es un rechazo: se ofrece donde la API lo aceptaría.
  const puedeSerDuplicado =
    reporte.sincronizado &&
    reporte.duplicadoDe === null &&
    DESTINOS_POR_ESTADO[reporte.estado].includes('rechazado');

  if (acciones.length === 0 && !puedeSerDuplicado && resultado.tipo === 'nada') return null;

  function abrir(hoja: Exclude<Hoja, null>) {
    setVez((n) => n + 1);
    setAbierta(hoja);
  }
  function desactualizado(mensaje: string) {
    setAbierta(null);
    setResultado({ tipo: 'error', mensaje });
    alCambiar();
  }

  return (
    <View className="gap-3">
      {resultado.tipo === 'cambiado' && <Aviso tono="exito" titulo={resultado.mensaje} />}
      {resultado.tipo === 'error' && (
        <Aviso
          tono="error"
          titulo={resultado.mensaje}
          detalle="Volvimos a cargar el reporte con su estado de ahora."
        />
      )}
      {acciones.length > 0 && (
        <Boton
          texto="Cambiar el estado"
          icono="swap-horizontal-outline"
          onPress={() => abrir('estado')}
        />
      )}
      {puedeSerDuplicado && (
        <Boton
          texto="Marcar como duplicado"
          variante="secundario"
          icono="git-merge-outline"
          onPress={() => abrir('duplicado')}
        />
      )}
      <HojaCambioDeEstado
        key={`estado-${vez}`}
        reporte={reporte}
        acciones={acciones}
        abierta={abierta === 'estado'}
        alCerrar={() => setAbierta(null)}
        alCambiar={(actualizado) => {
          setAbierta(null);
          setResultado({ tipo: 'cambiado', mensaje: describirCambio(actualizado.estado) });
          alCambiar();
        }}
        alDesactualizarse={desactualizado}
      />
      <HojaMarcarDuplicado
        key={`duplicado-${vez}`}
        reporte={reporte}
        abierta={abierta === 'duplicado'}
        alCerrar={() => setAbierta(null)}
        alMarcar={(_, original) => {
          setAbierta(null);
          setResultado({
            tipo: 'cambiado',
            mensaje: `El reporte quedó rechazado como duplicado de ${original.codigo}. El vecino ya está sumado al original.`,
          });
          alCambiar();
        }}
        alDesactualizarse={desactualizado}
      />
    </View>
  );
}
