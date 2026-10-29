import { useState } from 'react';
import { View } from 'react-native';

import { Aviso } from '@/componentes/ui/aviso';
import { Boton } from '@/componentes/ui/boton';
import { DESTINOS_POR_ESTADO, ORIGENES_DE_ASIGNACION } from '@/servicios/reportes';
import type { Reporte } from '@/tipos';

import { accionesDeEstado, describirCambio } from './acciones-de-estado';
import { HojaAsignarCuadrilla } from './hoja-asignar-cuadrilla';
import { HojaCambioDeEstado } from './hoja-cambio-de-estado';
import { HojaMarcarDuplicado } from './hoja-marcar-duplicado';

type Props = {
  reporte: Reporte;
  /** Después de un cambio: el detalle vuelve a pedir el reporte y su historial. */
  alCambiar: () => void;
};

type Resultado =
  { tipo: 'nada' } | { tipo: 'cambiado'; mensaje: string } | { tipo: 'error'; mensaje: string };

type Hoja = 'estado' | 'cuadrilla' | 'duplicado' | null;

/**
 * Las acciones de gestión del operador al pie del detalle (R4.2 a R4.4). Un botón por acción, y
 * cada una abre una hoja donde se elige, se explica y se confirma: así un toque de más no cambia
 * nada. «Cambiar el estado» va por `PATCH /estado`; «Asignar a una cuadrilla» por `PATCH /cuadrilla`
 * (el único camino a «Asignado»); «Marcar como duplicado» por `POST /duplicado`, que también rechaza
 * el reporte. Un reporte cerrado no tiene acciones.
 */
export function AccionesOperador({ reporte, alCambiar }: Props) {
  const [abierta, setAbierta] = useState<Hoja>(null);
  // Cada apertura monta la hoja de nuevo: lo elegido y escrito la vez anterior no queda.
  const [vez, setVez] = useState(0);
  const [resultado, setResultado] = useState<Resultado>({ tipo: 'nada' });
  const acciones = accionesDeEstado(reporte);
  const puedeAsignarse = reporte.sincronizado && ORIGENES_DE_ASIGNACION.includes(reporte.estado);
  // Marcar duplicado es un rechazo: se ofrece donde la API lo aceptaría.
  const puedeSerDuplicado =
    reporte.sincronizado &&
    reporte.duplicadoDe === null &&
    DESTINOS_POR_ESTADO[reporte.estado].includes('rechazado');

  if (acciones.length === 0 && !puedeAsignarse && !puedeSerDuplicado && resultado.tipo === 'nada') {
    return null;
  }

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
      {puedeAsignarse && (
        <Boton
          texto={reporte.estado === 'asignado' ? 'Cambiar la cuadrilla' : 'Asignar a una cuadrilla'}
          variante="secundario"
          icono="people-outline"
          onPress={() => abrir('cuadrilla')}
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
      <HojaAsignarCuadrilla
        key={`cuadrilla-${vez}`}
        reporte={reporte}
        abierta={abierta === 'cuadrilla'}
        alCerrar={() => setAbierta(null)}
        alAsignar={(_, cuadrilla) => {
          setAbierta(null);
          setResultado({
            tipo: 'cambiado',
            mensaje: `El reporte quedó asignado a ${cuadrilla.nombre}. El vecino va a verlo así.`,
          });
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
