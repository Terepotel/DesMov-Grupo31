import { useLocalSearchParams } from 'expo-router';

import { PantallaDetalleReporte } from '@/modulos/detalle-reporte/pantalla-detalle-reporte';

// `id` es un id (`rep-…`) o un número de seguimiento (`GCHU-…`): así abre también el enlace del QR
// `desmovgrupo31://reporte/GCHU-2026-00412` (P17) sin otra ruta.
export default function RutaDetalleReporte() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PantallaDetalleReporte id={id} />;
}
