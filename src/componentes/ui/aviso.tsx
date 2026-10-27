import { View } from 'react-native';

import { Icono, type NombreIcono } from './icono';
import { Texto, type ColorTexto } from './texto';

const tonos: Record<
  'atencion' | 'exito' | 'error',
  { fondo: string; color: ColorTexto; icono: NombreIcono; claseIcono: string }
> = {
  atencion: {
    fondo: 'bg-estado-revision-fondo',
    color: 'estado-revision',
    icono: 'cloud-offline-outline',
    claseIcono: 'text-estado-revision',
  },
  exito: {
    fondo: 'bg-estado-resuelto-fondo',
    color: 'estado-resuelto',
    icono: 'checkmark-circle',
    claseIcono: 'text-estado-resuelto',
  },
  error: {
    fondo: 'bg-peligro-fondo',
    color: 'peligro',
    icono: 'alert-circle-outline',
    claseIcono: 'text-peligro',
  },
};

type Props = {
  tono: keyof typeof tonos;
  /** Qué pasa, en negrita. */
  titulo: string;
  /** Qué va a pasar o qué hacer. */
  detalle?: string;
  icono?: NombreIcono;
};

export function Aviso({ tono, titulo, detalle, icono }: Props) {
  const estilo = tonos[tono];

  return (
    <View
      className={`flex-row items-start gap-3 rounded-md p-4 ${estilo.fondo}`}
      accessibilityRole={tono === 'error' ? 'alert' : undefined}
      accessibilityLiveRegion={tono === 'error' ? 'assertive' : 'polite'}>
      <Icono nombre={icono ?? estilo.icono} className={estilo.claseIcono} />
      <Texto color={estilo.color} className="flex-1">
        <Texto variante="cuerpo-fuerte" color={estilo.color}>
          {titulo}
        </Texto>
        {detalle ? ` ${detalle}` : null}
      </Texto>
    </View>
  );
}
