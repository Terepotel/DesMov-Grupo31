import { useLocalSearchParams } from 'expo-router';

import { PantallaPendiente } from '@/componentes/pantalla-pendiente';

export default function PantallaDetalleReporte() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <PantallaPendiente
      titulo="Detalle del reporte"
      descripcion={`Estado, fotos y «Qué fue pasando» del reporte ${id}.`}
      conVolver
    />
  );
}
