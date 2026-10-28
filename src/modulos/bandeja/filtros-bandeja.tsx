import { View } from 'react-native';

import { describirElegidos, Desplegable } from '@/componentes/ui/desplegable';
import { DiscoTipo } from '@/componentes/ui/disco-tipo';
import { estadosReporte } from '@/componentes/ui/estado-reporte';
import type { EstadoReporte, TipoDeReporte, Zona } from '@/tipos';

/** La bandeja son los reportes abiertos: la API no acepta otros estados (DECISIONS P18). */
export const ESTADOS_DE_LA_BANDEJA: EstadoReporte[] = ['recibido', 'en_revision', 'asignado'];

/** Lo que la API entiende por «todas las zonas» en `zonaId`. */
export const TODAS_LAS_ZONAS = 'todas';

export interface FiltrosDeLaBandeja {
  estados: EstadoReporte[];
  /** `null` = todos los tipos (la API acepta uno solo). */
  tipoId: string | null;
  /** Un id de zona o `TODAS_LAS_ZONAS`. */
  zonaId: string;
}

/** Al abrir: los tres estados abiertos, todos los tipos y la zona del operador (P12). */
export function filtrosIniciales(zonaDelOperador: string | null): FiltrosDeLaBandeja {
  return {
    estados: ESTADOS_DE_LA_BANDEJA,
    tipoId: null,
    zonaId: zonaDelOperador ?? TODAS_LAS_ZONAS,
  };
}

const TODOS_LOS_TIPOS = 'todos';

const OPCIONES_DE_ESTADO = ESTADOS_DE_LA_BANDEJA.map((estado) => ({
  clave: estado,
  texto: estadosReporte[estado].texto,
  icono: estadosReporte[estado].icono,
  claseIcono: estadosReporte[estado].claseIcono,
}));

type Props = {
  filtros: FiltrosDeLaBandeja;
  alCambiar: (filtros: FiltrosDeLaBandeja) => void;
  /** `null` mientras no llegaron los catálogos: los desplegables se muestran sin opciones. */
  tipos: TipoDeReporte[] | null;
  zonas: Zona[] | null;
};

/** Filtros de la bandeja (R4.1, R6.4): estado (varios), tipo (uno o todos) y zona (una o todas). */
export function FiltrosBandeja({ filtros, alCambiar, tipos, zonas }: Props) {
  function alternarEstado(clave: string) {
    const estado = clave as EstadoReporte;
    const estados = filtros.estados.includes(estado)
      ? filtros.estados.filter((e) => e !== estado)
      : ESTADOS_DE_LA_BANDEJA.filter((e) => e === estado || filtros.estados.includes(e));
    alCambiar({ ...filtros, estados });
  }

  const tipoElegido = tipos?.find((t) => t.id === filtros.tipoId) ?? null;
  const zonaElegida = zonas?.find((z) => z.id === filtros.zonaId) ?? null;

  return (
    <View className="gap-3">
      <View className="flex-row gap-3">
        <Desplegable
          rotulo="Estado"
          valor={describirElegidos(OPCIONES_DE_ESTADO, filtros.estados)}
          multiple
          opciones={OPCIONES_DE_ESTADO}
          elegidas={filtros.estados}
          alElegir={alternarEstado}
          className="flex-1"
        />
        <Desplegable
          rotulo="Tipo"
          valor={tipoElegido?.nombre ?? 'Todos'}
          opciones={[
            { clave: TODOS_LOS_TIPOS, texto: 'Todos los tipos', icono: 'apps-outline' },
            ...(tipos ?? []).map((tipo) => ({
              clave: tipo.id,
              texto: tipo.nombre,
              adorno: <DiscoTipo tipo={tipo} tamano={32} />,
            })),
          ]}
          elegidas={[filtros.tipoId ?? TODOS_LOS_TIPOS]}
          alElegir={(clave) =>
            alCambiar({ ...filtros, tipoId: clave === TODOS_LOS_TIPOS ? null : clave })
          }
          className="flex-1"
        />
      </View>
      <Desplegable
        rotulo="Zona"
        valor={
          filtros.zonaId === TODAS_LAS_ZONAS ? 'Todas las zonas' : (zonaElegida?.nombre ?? 'Zona')
        }
        opciones={[
          { clave: TODAS_LAS_ZONAS, texto: 'Todas las zonas', icono: 'earth-outline' },
          ...(zonas ?? []).map((zona) => ({
            clave: zona.id,
            texto: zona.nombre,
            icono: 'location-outline' as const,
          })),
        ]}
        elegidas={[filtros.zonaId]}
        alElegir={(clave) => alCambiar({ ...filtros, zonaId: clave })}
      />
    </View>
  );
}
