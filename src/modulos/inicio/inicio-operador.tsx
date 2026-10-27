import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Aviso } from '@/componentes/ui/aviso';
import { Boton } from '@/componentes/ui/boton';
import { Encabezado } from '@/componentes/ui/encabezado';
import { TarjetaReporte, TarjetaReporteCargando } from '@/componentes/ui/tarjeta-reporte';
import { Texto } from '@/componentes/ui/texto';
import { obtenerTiposDeReporte, obtenerZonas } from '@/servicios/catalogos';
import { obtenerBandeja } from '@/servicios/reportes';
import type { EstadoReporte, Reporte, TipoDeReporte, Usuario } from '@/tipos';
import { useCarga } from '@/utilidades/use-carga';

import { useBarraDeEstadoClara } from './barra-de-estado';
import { FilaAcceso } from './fila-acceso';
import { ResumenEstados, ResumenEstadosCargando } from './resumen-estados';

// Sin `zonaId`, la bandeja trae la zona del operador.
async function cargarInicioOperador() {
  const [bandeja, tipos, zonas] = await Promise.all([
    obtenerBandeja({ porPagina: 100 }),
    obtenerTiposDeReporte(),
    obtenerZonas(),
  ]);
  return {
    reportes: bandeja.datos,
    total: bandeja.meta.total,
    tipos: tipos.datos,
    zonas: zonas.datos,
  };
}

const ABIERTOS: EstadoReporte[] = ['recibido', 'en_revision', 'asignado'];
const MAS_APOYADOS = 3;

/** Inicio del operador: lo abierto en su zona, lo más apoyado primero, y acceso a sus herramientas. */
export function InicioOperador({ usuario }: { usuario: Usuario }) {
  const margenes = useSafeAreaInsets();
  const { carga, reintentar } = useCarga(cargarInicioOperador);
  useBarraDeEstadoClara();

  const zona =
    carga.tipo === 'listo' ? carga.datos.zonas.find((z) => z.id === usuario.zonaId) : undefined;

  return (
    <ScrollView className="flex-1 bg-fondo" contentContainerClassName="pb-8">
      <Encabezado tono="verde" margenSuperior={margenes.top}>
        <Texto variante="etiqueta" color="sobre-verde">
          Centro de Atención al Vecino
        </Texto>
        <Texto variante="titulo-pantalla" color="sobre-verde" accessibilityRole="header">
          Bandeja de reportes
        </Texto>
        <Texto color="sobre-verde">
          {zona ? `${zona.nombre}. ` : ''}Los más apoyados por los vecinos van primero.
        </Texto>
      </Encabezado>

      <View className="w-full max-w-lg gap-8 self-center px-6 pt-8">
        <View className="gap-3">
          <Texto variante="titulo-seccion" accessibilityRole="header">
            Abiertos
          </Texto>
          {carga.tipo === 'cargando' && (
            <>
              <ResumenEstadosCargando filas={ABIERTOS.length} />
              <TarjetaReporteCargando />
              <TarjetaReporteCargando />
            </>
          )}
          {carga.tipo === 'error' && (
            <>
              <Aviso tono="error" titulo={carga.mensaje} />
              <Boton
                texto="Probar de nuevo"
                variante="secundario"
                icono="refresh-outline"
                onPress={reintentar}
              />
            </>
          )}
          {carga.tipo === 'listo' && <Bandeja {...carga.datos} />}
        </View>

        <View className="gap-3">
          <Texto variante="titulo-seccion" accessibilityRole="header">
            Herramientas
          </Texto>
          <FilaAcceso
            icono="qr-code-outline"
            titulo="Escanear un QR"
            detalle="Abrí el reporte que muestra un vecino en el mostrador."
            alTocar={() => router.navigate('/escanear')}
          />
          <FilaAcceso
            icono="people-outline"
            titulo="Ver las cuadrillas"
            detalle="Qué cuadrillas hay en cada zona."
            alTocar={() => router.navigate('/cuadrillas')}
          />
          <FilaAcceso
            icono="map-outline"
            titulo="Ver el mapa de la ciudad"
            detalle="Todos los reportes, por estado y tipo."
            alTocar={() => router.navigate('/mapa')}
          />
        </View>
      </View>
    </ScrollView>
  );
}

function Bandeja({
  reportes,
  total,
  tipos,
}: {
  reportes: Reporte[];
  total: number;
  tipos: TipoDeReporte[];
}) {
  if (total === 0) {
    return (
      <View className="gap-1 rounded-lg border border-borde bg-superficie p-4">
        <Texto variante="cuerpo-fuerte">No hay reportes abiertos en tu zona.</Texto>
        <Texto variante="secundario">Cuando entre uno nuevo, aparece acá.</Texto>
      </View>
    );
  }

  return (
    <>
      <ResumenEstados
        filas={ABIERTOS.map((estado) => ({
          estado,
          cantidad: reportes.filter((r) => r.estado === estado).length,
        }))}
      />
      <Texto variante="secundario" className="mt-3">
        Los más apoyados
      </Texto>
      {reportes.slice(0, MAS_APOYADOS).map((reporte) => (
        <TarjetaReporte
          key={reporte.id}
          reporte={reporte}
          tipo={tipos.find((t) => t.id === reporte.tipoId) ?? null}
          mostrarAdhesiones
          onPress={() => router.push({ pathname: '/reporte/[id]', params: { id: reporte.id } })}
        />
      ))}
    </>
  );
}
