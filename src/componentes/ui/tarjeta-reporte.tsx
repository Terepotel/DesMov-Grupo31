import { Image } from 'expo-image';
import { Pressable, View, type PressableProps } from 'react-native';

import type { Reporte, TipoDeReporte } from '@/tipos';
import { formatearFecha } from '@/utilidades/fechas';

import { DiscoTipo } from './disco-tipo';
import { EstadoReporte, estadosReporte, estadoVisible } from './estado-reporte';
import { Icono } from './icono';
import { useSombra } from './sombras';
import { Texto } from './texto';

type Props = Omit<PressableProps, 'children'> & {
  reporte: Reporte;
  /** `null` si el catálogo todavía no llegó. */
  tipo: TipoDeReporte | null;
  /** En la bandeja del operador: «12 vecinos se sumaron». */
  mostrarAdhesiones?: boolean;
};

/** Un reporte en una lista. Toda la tarjeta es un botón que abre el detalle. Nunca dice quién lo hizo. */
export function TarjetaReporte({ reporte, tipo, mostrarAdhesiones = false, ...props }: Props) {
  const sombra = useSombra('tarjeta');
  const estado = estadoVisible(reporte);
  const foto = reporte.fotos.find((f) => f.momento === 'problema');
  const nombre = tipo?.nombre ?? 'Reporte';
  const fecha = formatearFecha(reporte.creadoEn);
  const adhesiones =
    reporte.adhesiones === 1 ? '1 vecino se sumó' : `${reporte.adhesiones} vecinos se sumaron`;

  return (
    <Pressable
      className="flex-row items-center gap-4 rounded-lg border border-borde bg-superficie p-4 active:opacity-70"
      style={sombra}
      accessibilityRole="button"
      accessibilityLabel={[
        nombre,
        reporte.direccion,
        fecha,
        estadosReporte[estado].texto,
        mostrarAdhesiones ? adhesiones : null,
      ]
        .filter(Boolean)
        .join(', ')}
      accessibilityHint="Abre el detalle del reporte"
      {...props}>
      {/* El disco queda debajo: se ve mientras la foto carga o si no carga. */}
      <View className="h-20 w-20 items-center justify-center overflow-hidden rounded-sm bg-superficie-alt">
        <DiscoTipo tipo={tipo} />
        {foto && (
          <Image
            source={{ uri: foto.url }}
            contentFit="cover"
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
            accessible={false}
          />
        )}
      </View>

      <View className="flex-1 items-start gap-1">
        <Texto variante="titulo-tarjeta">{nombre}</Texto>
        <Texto variante="secundario">
          {reporte.direccion} · {fecha}
        </Texto>
        {mostrarAdhesiones && <Texto variante="secundario">{adhesiones}</Texto>}
        <View className="mt-1">
          <EstadoReporte estado={estado} />
        </View>
      </View>

      <Icono nombre="chevron-forward" className="text-texto-secundario" />
    </Pressable>
  );
}

/** Mismo tamaño que una tarjeta, vacía, mientras la lista carga. */
export function TarjetaReporteCargando() {
  return (
    <View
      className="flex-row items-center gap-4 rounded-lg border border-borde bg-superficie p-4"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <View className="h-20 w-20 rounded-sm bg-superficie-alt" />
      <View className="flex-1 gap-2">
        <View className="h-6 w-2/5 rounded-md bg-superficie-alt" />
        <View className="h-5 w-4/5 rounded-md bg-superficie-alt" />
        <View className="h-8 w-1/2 rounded-full bg-superficie-alt" />
      </View>
    </View>
  );
}
