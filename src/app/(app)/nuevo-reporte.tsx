import { PantallaPendiente } from '@/componentes/pantalla-pendiente';

export default function PantallaNuevoReporte() {
  return (
    <PantallaPendiente
      titulo="Nuevo reporte"
      descripcion="Elegí qué pasa, sacale una foto y mandalo. Menos de un minuto."
      conVolver
    />
  );
}
