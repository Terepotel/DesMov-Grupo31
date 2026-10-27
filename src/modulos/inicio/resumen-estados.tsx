import { View } from 'react-native';

import { estadosReporte, type EstadoVisible } from '@/componentes/ui/estado-reporte';
import { Icono } from '@/componentes/ui/icono';
import { useSombra } from '@/componentes/ui/sombras';
import { Texto } from '@/componentes/ui/texto';

type Props = {
  filas: { estado: EstadoVisible; cantidad: number }[];
};

/** Cuántos reportes hay en cada estado, con el mismo nombre e ícono que la insignia. */
export function ResumenEstados({ filas }: Props) {
  const sombra = useSombra('tarjeta');

  return (
    <View className="overflow-hidden rounded-lg border border-borde bg-superficie" style={sombra}>
      {filas.map(({ estado, cantidad }, indice) => {
        const estilo = estadosReporte[estado];
        return (
          <View
            key={estado}
            className={`min-h-toque flex-row items-center gap-4 px-4 py-3 ${indice > 0 ? 'border-t border-borde' : ''}`}
            accessible
            accessibilityLabel={`${estilo.texto}: ${cantidad}`}>
            <View className={`h-10 w-10 items-center justify-center rounded-full ${estilo.fondo}`}>
              <Icono nombre={estilo.icono} className={estilo.claseIcono} />
            </View>
            <Texto variante="cuerpo-fuerte" className="flex-1">
              {estilo.texto}
            </Texto>
            <Texto variante="titulo-seccion">{cantidad}</Texto>
          </View>
        );
      })}
    </View>
  );
}

/** Mismo alto que el resumen, vacío, mientras carga. */
export function ResumenEstadosCargando({ filas }: { filas: number }) {
  return (
    <View
      className="overflow-hidden rounded-lg border border-borde bg-superficie"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {Array.from({ length: filas }, (_, indice) => (
        <View
          key={indice}
          className={`min-h-toque flex-row items-center gap-4 px-4 py-3 ${indice > 0 ? 'border-t border-borde' : ''}`}>
          <View className="h-10 w-10 rounded-full bg-superficie-alt" />
          <View className="h-6 flex-1 rounded-md bg-superficie-alt" />
        </View>
      ))}
    </View>
  );
}
