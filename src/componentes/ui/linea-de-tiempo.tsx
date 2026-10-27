import { View } from 'react-native';

import { formatearFechaHora } from '@/utilidades/fechas';

import { estadosReporte, type EstadoVisible } from './estado-reporte';
import { Icono } from './icono';
import { Texto } from './texto';

export type PasoLineaDeTiempo = {
  clave: string;
  estado: EstadoVisible;
  /** ISO con zona, como la manda la API. */
  fechaHora: string;
  comentario: string | null;
};

type Props = {
  /** Ya en el orden a mostrar: el más nuevo (el estado actual) primero. */
  pasos: PasoLineaDeTiempo[];
};

/** «Qué fue pasando»: cada cambio de estado con su fecha y lo que dejó escrito el operador. */
export function LineaDeTiempo({ pasos }: Props) {
  return (
    <View>
      {pasos.map((paso, indice) => {
        const estilo = estadosReporte[paso.estado];
        const fecha = formatearFechaHora(paso.fechaHora);
        const ultimo = indice === pasos.length - 1;

        return (
          <View
            key={paso.clave}
            className="flex-row gap-4"
            accessible
            accessibilityLabel={[estilo.texto, fecha.replace(' · ', ' '), paso.comentario]
              .filter(Boolean)
              .join(', ')}>
            <Punto actual={indice === 0} ultimo={ultimo} />
            <View className={`flex-1 gap-1 ${ultimo ? '' : 'pb-6'}`}>
              <View className="flex-row items-center gap-2">
                <Icono nombre={estilo.icono} tamano={20} className={estilo.claseIcono} />
                <Texto variante="cuerpo-fuerte" className="shrink">
                  {estilo.texto}
                </Texto>
              </View>
              <Texto variante="secundario">{fecha}</Texto>
              {paso.comentario && <Texto>{paso.comentario}</Texto>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** El punto y, salvo en el último paso, la línea que baja hasta el siguiente. */
function Punto({ actual, ultimo }: { actual: boolean; ultimo: boolean }) {
  return (
    <View className="w-4 items-center">
      {/* 6px arriba: el punto queda a la altura de la primera línea de `cuerpo` (27px). */}
      <View
        className={`mt-[6px] h-4 w-4 rounded-full ${actual ? 'bg-primario' : 'bg-borde-control'}`}
      />
      {!ultimo && <View className="mt-1 w-[2px] flex-1 bg-borde" />}
    </View>
  );
}

/** Mismo alto que los pasos, vacíos, mientras cargan. */
export function LineaDeTiempoCargando({ pasos = 3 }: { pasos?: number }) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: pasos }, (_, indice) => {
        const ultimo = indice === pasos - 1;
        return (
          <View key={indice} className="flex-row gap-4">
            <View className="w-4 items-center">
              <View className="mt-[6px] h-4 w-4 rounded-full bg-superficie-alt" />
              {!ultimo && <View className="mt-1 w-[2px] flex-1 bg-borde" />}
            </View>
            <View className={`flex-1 gap-2 ${ultimo ? '' : 'pb-6'}`}>
              <View className="h-7 w-1/2 rounded-md bg-superficie-alt" />
              <View className="h-5 w-1/4 rounded-md bg-superficie-alt" />
              <View className="h-6 w-4/5 rounded-md bg-superficie-alt" />
            </View>
          </View>
        );
      })}
    </View>
  );
}
