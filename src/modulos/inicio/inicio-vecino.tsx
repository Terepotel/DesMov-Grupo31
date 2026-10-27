import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Aviso } from '@/componentes/ui/aviso';
import { Boton } from '@/componentes/ui/boton';
import { Encabezado } from '@/componentes/ui/encabezado';
import {
  estadoVisible,
  ORDEN_ESTADOS_VISIBLES,
  type EstadoVisible,
} from '@/componentes/ui/estado-reporte';
import { TarjetaReporte, TarjetaReporteCargando } from '@/componentes/ui/tarjeta-reporte';
import { Texto } from '@/componentes/ui/texto';
import { obtenerTiposDeReporte } from '@/servicios/catalogos';
import { obtenerMisReportes } from '@/servicios/reportes';
import type { Reporte, TipoDeReporte, Usuario } from '@/tipos';
import { useCarga } from '@/utilidades/use-carga';

import { useBarraDeEstadoClara } from './barra-de-estado';
import { FilaAcceso } from './fila-acceso';
import { ResumenEstados, ResumenEstadosCargando } from './resumen-estados';

// La API devuelve hasta 100 por página: alcanza para el resumen de un vecino.
async function cargarInicioVecino() {
  const [reportes, tipos] = await Promise.all([
    obtenerMisReportes({ porPagina: 100 }),
    obtenerTiposDeReporte(),
  ]);
  return { reportes: reportes.datos, total: reportes.meta.total, tipos: tipos.datos };
}

/** Inicio del vecino: reportar algo nuevo, cómo van sus reportes y acceso a todo lo demás. */
export function InicioVecino({ usuario }: { usuario: Usuario }) {
  const margenes = useSafeAreaInsets();
  const { carga, reintentar } = useCarga(cargarInicioVecino);
  useBarraDeEstadoClara();

  return (
    <ScrollView className="flex-1 bg-fondo" contentContainerClassName="pb-12">
      <Encabezado tono="verde" margenSuperior={margenes.top}>
        <Texto variante="etiqueta" color="sobre-verde">
          Hola, {usuario.nombre.split(' ')[0]}
        </Texto>
        <Texto variante="titulo-pantalla" color="sobre-verde" accessibilityRole="header">
          ¿Viste algo que necesita atención?
        </Texto>
        <Texto color="sobre-verde">Sacale una foto y contanos. Te lleva menos de un minuto.</Texto>
        <Boton
          texto="Hacer un reporte"
          variante="sobre-verde"
          icono="camera-outline"
          onPress={() => router.push('/nuevo-reporte')}
          className="mt-2 self-stretch"
        />
      </Encabezado>

      <View className="w-full max-w-lg gap-8 self-center px-6 pt-8">
        <View className="gap-3">
          <Texto variante="titulo-seccion" accessibilityRole="header">
            Tus reportes
          </Texto>
          {carga.tipo === 'cargando' && (
            <>
              <ResumenEstadosCargando filas={2} />
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
          {carga.tipo === 'listo' && <MisReportes {...carga.datos} />}
        </View>

        <View className="gap-3">
          <Texto variante="titulo-seccion" accessibilityRole="header">
            También podés
          </Texto>
          <FilaAcceso
            icono="map-outline"
            titulo="Ver el mapa de la ciudad"
            detalle="Fijate si ya lo reportaron y sumate."
            alTocar={() => router.navigate('/mapa')}
          />
          <FilaAcceso
            icono="notifications-outline"
            titulo="Ver tus avisos"
            detalle="Cada cambio en tus reportes."
            alTocar={() => router.navigate('/avisos')}
          />
          <FilaAcceso
            icono="person-circle-outline"
            titulo="Ir a tu cuenta"
            detalle="Tus datos y los avisos."
            alTocar={() => router.navigate('/cuenta')}
          />
        </View>
      </View>
    </ScrollView>
  );
}

function MisReportes({
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
        <Texto variante="cuerpo-fuerte">Todavía no hiciste ningún reporte.</Texto>
        <Texto variante="secundario">Cuando hagas uno, acá vas a ver cómo avanza.</Texto>
      </View>
    );
  }

  const cantidades = new Map<EstadoVisible, number>();
  for (const reporte of reportes) {
    const estado = estadoVisible(reporte);
    cantidades.set(estado, (cantidades.get(estado) ?? 0) + 1);
  }
  const sinEnviar = cantidades.get('sin_enviar') ?? 0;
  const ultimos = reportes.slice(0, 2);

  return (
    <>
      {sinEnviar > 0 && (
        <Aviso
          tono="atencion"
          titulo={
            sinEnviar === 1
              ? 'Tenés un reporte sin enviar.'
              : `Tenés ${sinEnviar} reportes sin enviar.`
          }
          detalle="Se envían solos cuando vuelva la señal."
        />
      )}
      <ResumenEstados
        filas={ORDEN_ESTADOS_VISIBLES.filter((estado) => cantidades.has(estado)).map((estado) => ({
          estado,
          cantidad: cantidades.get(estado)!,
        }))}
      />
      <Texto variante="secundario" className="mt-3">
        Los últimos que hiciste
      </Texto>
      {ultimos.map((reporte) => (
        <TarjetaReporte
          key={reporte.id}
          reporte={reporte}
          tipo={tipos.find((t) => t.id === reporte.tipoId) ?? null}
          onPress={() => router.push({ pathname: '/reporte/[id]', params: { id: reporte.id } })}
        />
      ))}
      <Boton
        texto={total === 1 ? 'Ver tu reporte' : `Ver tus ${total} reportes`}
        variante="secundario"
        icono="list-outline"
        onPress={() => router.navigate('/mis-reportes')}
      />
    </>
  );
}
