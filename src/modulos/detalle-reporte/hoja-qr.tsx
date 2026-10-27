import { View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { Boton } from '@/componentes/ui/boton';
import { HojaInferior } from '@/componentes/ui/hoja-inferior';
import { Texto } from '@/componentes/ui/texto';
import { enlaceDelReporte } from '@/utilidades/reportes';

type Props = {
  abierta: boolean;
  codigo: string;
  alCerrar: () => void;
};

/**
 * El QR para el mostrador (R2.6, P17). Negro sobre blanco en los dos temas, como uno impreso: es lo
 * que mejor lee la cámara de la ventanilla.
 */
export function HojaQr({ abierta, codigo, alCerrar }: Props) {
  return (
    <HojaInferior abierta={abierta} titulo="Mostralo en el mostrador" alCerrar={alCerrar}>
      <View
        className="self-center rounded-md bg-white p-4"
        accessible
        accessibilityRole="image"
        accessibilityLabel={`Código QR del reporte ${codigo}`}>
        <QRCode
          value={enlaceDelReporte(codigo)}
          size={240}
          color="#111111"
          backgroundColor="#FFFFFF"
        />
      </View>
      <Texto
        variante="codigo"
        className="text-center"
        accessibilityLabel={`Número de seguimiento ${codigo}`}>
        {codigo}
      </Texto>
      <Texto variante="secundario" className="text-center">
        En Atención al Vecino lo escanean y abren el reporte sin tipear nada.
      </Texto>
      <Boton texto="Cerrar" variante="secundario" onPress={alCerrar} className="mt-2" />
    </HojaInferior>
  );
}
