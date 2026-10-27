import { View } from 'react-native';

import { describirElegidos, Desplegable } from '@/componentes/ui/desplegable';
import { DiscoTipo } from '@/componentes/ui/disco-tipo';
import { estadosReporte } from '@/componentes/ui/estado-reporte';
import type { EstadoReporte, TipoDeReporte } from '@/tipos';

import type { FiltrosDelMapa } from './use-reportes-del-mapa';

/** Los cinco, en el orden en que avanza un reporte. */
export const ESTADOS_DEL_MAPA: EstadoReporte[] = [
  'recibido',
  'en_revision',
  'asignado',
  'resuelto',
  'rechazado',
];

/** Al abrir el mapa vienen marcados todos menos «Rechazado» (consignas P9). */
export const FILTROS_INICIALES: FiltrosDelMapa = {
  estados: ESTADOS_DEL_MAPA.filter((e) => e !== 'rechazado'),
  tipoId: null,
};

const TODOS = 'todos';

type Props = {
  filtros: FiltrosDelMapa;
  alCambiar: (filtros: FiltrosDelMapa) => void;
  /** `null` mientras no llegó el catálogo: el de tipo se muestra sin opciones. */
  tipos: TipoDeReporte[] | null;
};

/** Filtros por estado (varios a la vez) y por tipo (uno o todos), R3.2: dos desplegables, uno al lado del otro. */
export function FiltrosMapa({ filtros, alCambiar, tipos }: Props) {
  function alternarEstado(estado: string) {
    const clave = estado as EstadoReporte;
    const estados = filtros.estados.includes(clave)
      ? filtros.estados.filter((e) => e !== clave)
      : ESTADOS_DEL_MAPA.filter((e) => e === clave || filtros.estados.includes(e));
    alCambiar({ ...filtros, estados });
  }

  const tipoElegido = tipos?.find((t) => t.id === filtros.tipoId) ?? null;
  const opcionesDeEstado = ESTADOS_DEL_MAPA.map((estado) => ({
    clave: estado,
    texto: estadosReporte[estado].texto,
    icono: estadosReporte[estado].icono,
    claseIcono: estadosReporte[estado].claseIcono,
  }));

  return (
    <View className="flex-row gap-3 px-6">
      <Desplegable
        rotulo="Estado"
        valor={describirElegidos(opcionesDeEstado, filtros.estados)}
        multiple
        opciones={opcionesDeEstado}
        elegidas={filtros.estados}
        alElegir={alternarEstado}
        className="flex-1"
      />
      <Desplegable
        rotulo="Tipo"
        valor={tipoElegido?.nombre ?? 'Todos'}
        opciones={[
          { clave: TODOS, texto: 'Todos los tipos', icono: 'apps-outline' },
          ...(tipos ?? []).map((tipo) => ({
            clave: tipo.id,
            texto: tipo.nombre,
            adorno: <DiscoTipo tipo={tipo} tamano={32} />,
          })),
        ]}
        elegidas={[filtros.tipoId ?? TODOS]}
        alElegir={(clave) => alCambiar({ ...filtros, tipoId: clave === TODOS ? null : clave })}
        className="flex-1"
      />
    </View>
  );
}
