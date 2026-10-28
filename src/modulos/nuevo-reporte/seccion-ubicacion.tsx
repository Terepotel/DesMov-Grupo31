import { router } from 'expo-router';
import { View } from 'react-native';

import { Aviso } from '@/componentes/ui/aviso';
import { Boton } from '@/componentes/ui/boton';
import { Icono } from '@/componentes/ui/icono';
import { Texto } from '@/componentes/ui/texto';

import type { UbicacionDelReporte } from './ubicacion-del-reporte';

/**
 * Dónde está el problema (R1.4): sale sola del GPS y se corrige en el mapa. Sin GPS o sin permiso,
 * el vecino la marca a mano (NF4).
 */
export function SeccionUbicacion({ ubicacion }: { ubicacion: UbicacionDelReporte }) {
  const { coordenadas, direccion, origen, gps } = ubicacion;

  return (
    <View className="gap-3">
      {coordenadas ? (
        <View className="flex-row items-start gap-3 rounded-lg border-2 border-borde bg-superficie p-4">
          <Icono nombre="location-outline" className="text-texto" />
          <View className="flex-1 gap-1">
            {/* Sin señal no se puede calcular la calle (consignas §8.1 P3). */}
            <Texto variante="cuerpo-fuerte">{direccion ?? 'Cerca de tu ubicación'}</Texto>
            <Texto variante="secundario">
              {origen === 'manual' ? 'Lo marcaste en el mapa.' : 'Lo tomamos de tu GPS.'}
            </Texto>
          </View>
        </View>
      ) : gps === 'pendiente' || gps === 'buscando' ? (
        <View className="flex-row items-center gap-3 rounded-lg border-2 border-borde bg-superficie p-4">
          <Icono nombre="locate-outline" className="text-texto-secundario" />
          <Texto variante="secundario" accessibilityLiveRegion="polite">
            Buscando dónde estás…
          </Texto>
        </View>
      ) : (
        <Aviso
          tono="atencion"
          icono="location-outline"
          titulo={
            gps === 'sin_permiso'
              ? 'No tenemos permiso para ver dónde estás.'
              : 'No pudimos saber dónde estás.'
          }
          detalle="Marcá en el mapa el lugar del problema."
        />
      )}

      <Boton
        texto={coordenadas ? 'Corregir en el mapa' : 'Marcar en el mapa'}
        variante="secundario"
        icono="map-outline"
        onPress={() => router.push('/corregir-ubicacion')}
      />
    </View>
  );
}
