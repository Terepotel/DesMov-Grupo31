import { useLocalSearchParams } from 'expo-router';

import { useSesion } from '@/modulos/autenticacion/contexto';
import { AccionesOperador } from '@/modulos/bandeja/acciones-operador';
import { PantallaDetalleReporte } from '@/modulos/detalle-reporte/pantalla-detalle-reporte';

// `id` es un id (`rep-…`) o un número de seguimiento (`GCHU-…`): así abre también el enlace del QR
// `desmovgrupo31://reporte/GCHU-2026-00412` (P17) sin otra ruta.
export default function RutaDetalleReporte() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { usuario } = useSesion();

  return (
    <PantallaDetalleReporte
      id={id}
      // Al vecino no se le muestran los botones de gestión (API R17): sólo el operador los recibe.
      acciones={
        usuario?.rol === 'operador'
          ? (reporte, recargar) => <AccionesOperador reporte={reporte} alCambiar={recargar} />
          : undefined
      }
    />
  );
}
