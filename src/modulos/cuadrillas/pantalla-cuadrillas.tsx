import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Aviso } from '@/componentes/ui/aviso';
import { Boton } from '@/componentes/ui/boton';
import { Icono } from '@/componentes/ui/icono';
import { Texto } from '@/componentes/ui/texto';
import { useSesion } from '@/modulos/autenticacion/contexto';
import { obtenerCuadrillas, obtenerZonas } from '@/servicios/catalogos';
import type { Cuadrilla, Zona } from '@/tipos';
import { useCarga } from '@/utilidades/use-carga';

async function cargarCuadrillasPorZona() {
  const [zonas, cuadrillas] = await Promise.all([obtenerZonas(), obtenerCuadrillas()]);
  return { zonas: zonas.datos, cuadrillas: cuadrillas.datos };
}

/**
 * Pestaña Cuadrillas del operador (R6.1, R6.3): las cuadrillas de cada zona, con su especialidad y
 * si está activa. La zona del operador va primera. Es sólo para mirar: asignar se hace desde el
 * detalle del reporte (R4.3).
 */
export function PantallaCuadrillas() {
  const { usuario } = useSesion();
  const { carga, reintentar } = useCarga(cargarCuadrillasPorZona);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-fondo">
      <ScrollView contentContainerClassName="w-full max-w-lg gap-8 self-center px-6 pb-12 pt-12">
        <View className="gap-2">
          <Texto variante="titulo-pantalla" accessibilityRole="header">
            Cuadrillas
          </Texto>
          <Texto variante="secundario">
            Las de cada zona, con lo que hacen y si están activas.
          </Texto>
        </View>

        {carga.tipo === 'cargando' && (
          <View className="gap-3">
            <TarjetaCuadrillaCargando />
            <TarjetaCuadrillaCargando />
            <TarjetaCuadrillaCargando />
          </View>
        )}
        {carga.tipo === 'error' && (
          <View className="gap-3">
            <Aviso tono="error" titulo={carga.mensaje} />
            <Boton
              texto="Probar de nuevo"
              variante="secundario"
              icono="refresh-outline"
              onPress={reintentar}
            />
          </View>
        )}
        {carga.tipo === 'listo' &&
          ordenarZonas(carga.datos.zonas, usuario?.zonaId ?? null).map((zona) => (
            <SeccionZona
              key={zona.id}
              zona={zona}
              esLaDelOperador={zona.id === usuario?.zonaId}
              cuadrillas={carga.datos.cuadrillas.filter((c) => c.zonaId === zona.id)}
            />
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

/** La zona del operador primero; el resto, en el orden de la API. */
function ordenarZonas(zonas: Zona[], zonaDelOperador: string | null) {
  if (!zonaDelOperador) return zonas;
  return [
    ...zonas.filter((z) => z.id === zonaDelOperador),
    ...zonas.filter((z) => z.id !== zonaDelOperador),
  ];
}

type PropsSeccion = { zona: Zona; esLaDelOperador: boolean; cuadrillas: Cuadrilla[] };

function SeccionZona({ zona, esLaDelOperador, cuadrillas }: PropsSeccion) {
  return (
    <View className="gap-3">
      <View className="gap-1">
        <Texto variante="titulo-seccion" accessibilityRole="header">
          {zona.nombre}
        </Texto>
        <Texto variante="secundario">
          {esLaDelOperador ? 'Tu zona. ' : ''}
          {describirCantidad(cuadrillas)}
        </Texto>
      </View>
      {cuadrillas.map((cuadrilla) => (
        <TarjetaCuadrilla key={cuadrilla.id} cuadrilla={cuadrilla} />
      ))}
    </View>
  );
}

/** «2 cuadrillas, 1 activa», «1 cuadrilla activa», «Sin cuadrillas». */
function describirCantidad(cuadrillas: Cuadrilla[]) {
  const total = cuadrillas.length;
  const activas = cuadrillas.filter((c) => c.activa).length;
  if (total === 0) return 'Sin cuadrillas.';
  if (total === 1) return activas === 1 ? '1 cuadrilla activa.' : '1 cuadrilla, no está activa.';
  if (activas === total) return `${total} cuadrillas, todas activas.`;
  return `${total} cuadrillas, ${activas === 1 ? '1 activa' : `${activas} activas`}.`;
}

function TarjetaCuadrilla({ cuadrilla }: { cuadrilla: Cuadrilla }) {
  return (
    <View
      className="flex-row items-center gap-4 rounded-lg border border-borde bg-superficie p-4"
      accessibilityLabel={`${cuadrilla.nombre}, ${cuadrilla.especialidad}, ${
        cuadrilla.activa ? 'activa' : 'no está activa'
      }`}>
      <View className="h-12 w-12 items-center justify-center rounded-full bg-superficie-alt">
        <Icono
          nombre="people-outline"
          className={cuadrilla.activa ? 'text-primario' : 'text-texto-secundario'}
        />
      </View>
      <View className="flex-1 gap-1">
        <Texto variante="titulo-tarjeta">{cuadrilla.nombre}</Texto>
        <Texto variante="secundario">{cuadrilla.especialidad}</Texto>
        <View className="flex-row items-center gap-2">
          <Icono
            nombre={cuadrilla.activa ? 'checkmark-circle-outline' : 'pause-circle-outline'}
            className={cuadrilla.activa ? 'text-estado-resuelto' : 'text-texto-secundario'}
          />
          <Texto
            variante="etiqueta"
            color={cuadrilla.activa ? 'estado-resuelto' : 'texto-secundario'}>
            {cuadrilla.activa ? 'Activa' : 'No está activa'}
          </Texto>
        </View>
      </View>
    </View>
  );
}

function TarjetaCuadrillaCargando() {
  return (
    <View
      className="h-28 rounded-lg border border-borde bg-superficie-alt"
      accessibilityLabel="Cargando las cuadrillas"
    />
  );
}
