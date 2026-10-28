import { Pressable, View } from 'react-native';

import { DiscoTipo } from '@/componentes/ui/disco-tipo';
import { EstadoReporte } from '@/componentes/ui/estado-reporte';
import { Icono } from '@/componentes/ui/icono';
import { Texto } from '@/componentes/ui/texto';
import type { Coordenadas, Reporte, TipoDeReporte } from '@/tipos';
import { distanciaEnMetros } from '@/utilidades/geo';
import { textoAdhesiones } from '@/utilidades/reportes';

type Props = {
  reporte: Reporte;
  /** `null` si el catálogo todavía no llegó. */
  tipo: TipoDeReporte | null;
  /** Desde dónde se mide la distancia: el reporte que se marca o el lugar del que se va a crear. */
  desde: Coordenadas;
  marcada: boolean;
  bloqueada: boolean;
  alElegir: () => void;
  /** Junto al nombre: «Bache · mismo tipo», «Bache · lo reportaste vos». */
  nota?: string;
};

/**
 * Un reporte cercano para elegir de una lista (`accessibilityRole="radiogroup"` en quien la arma):
 * el operador elige el original de un duplicado (R4.4) y el vecino, al que sumarse antes de crear
 * otro (R3.5). Nunca dice quién lo hizo (NF6).
 */
export function OpcionReporteCercano({
  reporte,
  tipo,
  desde,
  marcada,
  bloqueada,
  alElegir,
  nota,
}: Props) {
  const metros = Math.round(distanciaEnMetros(desde, reporte.coordenadas));
  const detalle = `${reporte.direccion} · a ${metros} m`;
  const nombre = tipo?.nombre ?? 'Reporte';
  return (
    <Pressable
      onPress={alElegir}
      disabled={bloqueada}
      className={`min-h-toque flex-row items-center gap-3 rounded-lg px-4 py-3 active:opacity-70 ${
        marcada
          ? 'border-[3px] border-primario bg-superficie-alt'
          : 'border-2 border-borde-control bg-superficie'
      }`}
      accessibilityRole="radio"
      accessibilityLabel={[
        `${nombre} ${reporte.codigo}`,
        nota,
        detalle,
        textoAdhesiones(reporte.adhesiones),
      ]
        .filter(Boolean)
        .join(', ')}
      accessibilityState={{ checked: marcada, selected: marcada }}>
      <DiscoTipo tipo={tipo} />
      <View className="flex-1 items-start gap-1">
        <Texto variante="cuerpo-fuerte" color={marcada ? 'primario' : 'texto'}>
          {nombre}
          {nota ? ` · ${nota}` : ''}
        </Texto>
        <Texto variante="secundario">{reporte.codigo}</Texto>
        <Texto variante="secundario">{detalle}</Texto>
        <View className="mt-1 flex-row flex-wrap items-center gap-2">
          <EstadoReporte estado={reporte.estado} />
          <Texto variante="secundario">{textoAdhesiones(reporte.adhesiones)}</Texto>
        </View>
      </View>
      <Icono
        nombre={marcada ? 'radio-button-on' : 'radio-button-off'}
        className={marcada ? 'text-primario' : 'text-borde-control'}
      />
    </Pressable>
  );
}
