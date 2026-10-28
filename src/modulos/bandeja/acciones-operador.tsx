import { useState } from 'react';
import { View } from 'react-native';

import { Aviso } from '@/componentes/ui/aviso';
import { Boton } from '@/componentes/ui/boton';
import type { Reporte } from '@/tipos';

import { accionesDeEstado, describirCambio } from './acciones-de-estado';
import { HojaCambioDeEstado } from './hoja-cambio-de-estado';

type Props = {
  reporte: Reporte;
  /** Después de un cambio: el detalle vuelve a pedir el reporte y su historial. */
  alCambiar: () => void;
};

type Resultado =
  { tipo: 'nada' } | { tipo: 'cambiado'; mensaje: string } | { tipo: 'error'; mensaje: string };

/**
 * Las acciones de gestión del operador al pie del detalle (R4.2). Un solo botón «Cambiar el estado»
 * abre la hoja donde se elige el paso, se deja escrito por qué y se confirma: así un toque de más no
 * cambia nada. Un reporte cerrado no tiene acciones.
 */
export function AccionesOperador({ reporte, alCambiar }: Props) {
  const [abierta, setAbierta] = useState(false);
  // Cada apertura monta la hoja de nuevo: lo elegido y escrito la vez anterior no queda.
  const [vez, setVez] = useState(0);
  const [resultado, setResultado] = useState<Resultado>({ tipo: 'nada' });
  const acciones = accionesDeEstado(reporte);

  if (acciones.length === 0 && resultado.tipo === 'nada') return null;

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
          onPress={() => {
            setVez((n) => n + 1);
            setAbierta(true);
          }}
        />
      )}
      <HojaCambioDeEstado
        key={vez}
        reporte={reporte}
        acciones={acciones}
        abierta={abierta}
        alCerrar={() => setAbierta(false)}
        alCambiar={(actualizado) => {
          setAbierta(false);
          setResultado({ tipo: 'cambiado', mensaje: describirCambio(actualizado.estado) });
          alCambiar();
        }}
        alDesactualizarse={(mensaje) => {
          setAbierta(false);
          setResultado({ tipo: 'error', mensaje });
          alCambiar();
        }}
      />
    </View>
  );
}
