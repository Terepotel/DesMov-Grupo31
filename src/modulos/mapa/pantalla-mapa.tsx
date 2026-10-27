import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import type MapView from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapaBase } from '@/componentes/mapa/mapa-base';
import { MarcadorReporte } from '@/componentes/mapa/marcador-reporte';
import { Aviso } from '@/componentes/ui/aviso';
import { Boton } from '@/componentes/ui/boton';
import { Icono } from '@/componentes/ui/icono';
import { useSombra } from '@/componentes/ui/sombras';
import { TarjetaReporte } from '@/componentes/ui/tarjeta-reporte';
import { Texto } from '@/componentes/ui/texto';
import { obtenerTiposDeReporte } from '@/servicios/catalogos';
import { obtenerUbicacion } from '@/servicios/ubicacion';
import { regionAlrededorDe } from '@/utilidades/geo';
import { useCarga } from '@/utilidades/use-carga';

import { FILTROS_INICIALES, FiltrosMapa } from './filtros-mapa';
import { useReportesDelMapa, type FiltrosDelMapa } from './use-reportes-del-mapa';

async function cargarTipos() {
  return (await obtenerTiposDeReporte()).datos;
}

/** El mapa de la ciudad (R3): todos los reportes, un color por estado, con filtros y «dónde estoy». */
export function PantallaMapa() {
  const margenes = useSafeAreaInsets();
  const mapa = useRef<MapView>(null);
  const sombra = useSombra('flotante');

  const [filtros, setFiltros] = useState<FiltrosDelMapa>(FILTROS_INICIALES);
  const [elegidoId, setElegidoId] = useState<string | null>(null);
  const [avisoUbicacion, setAvisoUbicacion] = useState<string | null>(null);
  const [mostrarMiUbicacion, setMostrarMiUbicacion] = useState(false);
  const [buscandoUbicacion, setBuscandoUbicacion] = useState(false);

  const { carga: tipos } = useCarga(cargarTipos);
  const { reportes, cargando, error, alCambiarRegion, reintentar } = useReportesDelMapa(filtros);

  const catalogo = tipos.tipo === 'listo' ? tipos.datos : null;
  const elegido = reportes.find((r) => r.id === elegidoId) ?? null;

  function cambiarFiltros(nuevos: FiltrosDelMapa) {
    setFiltros(nuevos);
    setElegidoId(null);
  }

  // R3.3: ver qué hay cerca de la persona.
  async function irAMiUbicacion() {
    setBuscandoUbicacion(true);
    setAvisoUbicacion(null);
    const resultado = await obtenerUbicacion();
    setBuscandoUbicacion(false);
    if (resultado.estado === 'ok') {
      setMostrarMiUbicacion(true);
      mapa.current?.animateToRegion(regionAlrededorDe(resultado.coordenadas, 0.012));
      return;
    }
    setAvisoUbicacion(
      resultado.estado === 'sin_permiso'
        ? 'No tenemos permiso para ver dónde estás. Podés moverte por el mapa igual.'
        : 'No pudimos saber dónde estás. Fijate que el GPS esté prendido y probá de nuevo.',
    );
  }

  const resumen =
    filtros.estados.length === 0
      ? 'Elegí al menos un estado para ver reportes.'
      : reportes.length === 1
        ? '1 reporte en esta parte del mapa.'
        : `${reportes.length} reportes en esta parte del mapa.`;

  return (
    <View className="flex-1 bg-fondo" style={{ paddingTop: margenes.top }}>
      <View className="gap-3 pb-3 pt-4">
        <View className="px-6">
          <Texto variante="titulo-pantalla" accessibilityRole="header">
            Mapa de la ciudad
          </Texto>
          <Texto variante="secundario" accessibilityLiveRegion="polite">
            {cargando ? 'Buscando reportes en esta parte del mapa.' : resumen}
          </Texto>
        </View>
        <FiltrosMapa filtros={filtros} alCambiar={cambiarFiltros} tipos={catalogo} />
      </View>

      <View className="flex-1">
        <MapaBase
          ref={mapa}
          onRegionChangeComplete={alCambiarRegion}
          // En Android, tocar un marcador dispara también el `onPress` del mapa (con
          // `action: 'marker-press'`): si no se lo ignora, deselecciona lo que el marcador acaba de elegir.
          onPress={(evento) => {
            if (evento.nativeEvent.action !== 'marker-press') setElegidoId(null);
          }}
          showsUserLocation={mostrarMiUbicacion}>
          {reportes.map((reporte) => {
            const tipo = catalogo?.find((t) => t.id === reporte.tipoId) ?? null;
            const elegido = reporte.id === elegidoId;
            return (
              <MarcadorReporte
                // Sólo el id: volver a montar el marcador hace aparecer el pin rojo de Google.
                key={reporte.id}
                reporte={reporte}
                tipo={tipo}
                elegido={elegido}
                onPress={() => setElegidoId(reporte.id)}
              />
            );
          })}
        </MapaBase>

        {/* Sobre el mapa: «dónde estoy» arriba a la derecha; avisos y el reporte elegido abajo. */}
        <Pressable
          onPress={irAMiUbicacion}
          disabled={buscandoUbicacion}
          className="absolute right-4 top-4 min-h-toque flex-row items-center gap-2 rounded-lg bg-superficie px-4 active:opacity-70 disabled:opacity-50"
          style={sombra}
          accessibilityRole="button"
          accessibilityLabel="Dónde estoy"
          accessibilityHint="Lleva el mapa a tu ubicación"
          accessibilityState={{ disabled: buscandoUbicacion, busy: buscandoUbicacion }}>
          <Icono nombre="locate-outline" className="text-primario" />
          <Texto variante="cuerpo-fuerte" color="primario">
            Dónde estoy
          </Texto>
        </Pressable>

        <View className="absolute bottom-4 left-0 right-0 gap-3 px-6">
          {avisoUbicacion && (
            <Pressable onPress={() => setAvisoUbicacion(null)} accessibilityLabel="Cerrar el aviso">
              <Aviso tono="atencion" titulo={avisoUbicacion} icono="location-outline" />
            </Pressable>
          )}
          {error && (
            <View className="gap-3 rounded-lg bg-superficie p-3" style={sombra}>
              <Aviso tono="error" titulo={error} />
              <Boton
                texto="Probar de nuevo"
                variante="secundario"
                icono="refresh-outline"
                onPress={reintentar}
              />
            </View>
          )}
          {elegido && (
            <TarjetaReporte
              reporte={elegido}
              tipo={catalogo?.find((t) => t.id === elegido.tipoId) ?? null}
              mostrarAdhesiones
              style={sombra}
              onPress={() => router.push({ pathname: '/reporte/[id]', params: { id: elegido.id } })}
            />
          )}
        </View>
      </View>
    </View>
  );
}
