import { router } from 'expo-router';
import { View } from 'react-native';

import { Aviso } from '@/componentes/ui/aviso';
import { Boton } from '@/componentes/ui/boton';
import { CampoTexto } from '@/componentes/ui/campo-texto';
import { Icono } from '@/componentes/ui/icono';
import { Texto } from '@/componentes/ui/texto';

import { escribirDireccion, type UbicacionDelReporte } from './ubicacion-del-reporte';

/**
 * Dónde está el problema (R1.4): sale sola del GPS y se corrige en el mapa. Sin GPS o sin permiso,
 * el vecino la marca a mano (NF4) o escribe la calle y la altura (P3). La dirección siempre se
 * puede corregir: el campo arranca con la que salió del punto.
 */
export function SeccionUbicacion({ ubicacion }: { ubicacion: UbicacionDelReporte }) {
  const { coordenadas, direccion, gps, direccionEscrita } = ubicacion;
  const buscando = !coordenadas && (gps === 'pendiente' || gps === 'buscando');

  return (
    <View className="gap-3">
      {buscando ? (
        <View className="flex-row items-center gap-3 rounded-lg border-2 border-borde bg-superficie p-4">
          <Icono nombre="locate-outline" className="text-texto-secundario" />
          <Texto variante="secundario" accessibilityLiveRegion="polite">
            Buscando dónde estás…
          </Texto>
        </View>
      ) : (
        !coordenadas && (
          <Aviso
            tono="atencion"
            icono="location-outline"
            titulo={
              gps === 'sin_permiso'
                ? 'No tenemos permiso para ver dónde estás.'
                : 'No pudimos saber dónde estás.'
            }
            detalle="Marcá en el mapa el lugar del problema, o escribí la dirección."
          />
        )
      )}

      <CampoTexto
        etiqueta="Calle y altura"
        placeholder="Por ejemplo: Rocamora 1240"
        ayuda={ayudaDeLaDireccion(ubicacion)}
        value={direccionEscrita ?? direccion ?? ''}
        onChangeText={escribirDireccion}
        autoCapitalize="words"
        returnKeyType="done"
      />

      <Boton
        texto={coordenadas ? 'Corregir en el mapa' : 'Marcar en el mapa'}
        variante="secundario"
        icono="map-outline"
        onPress={() => router.push('/corregir-ubicacion')}
      />
    </View>
  );
}

function ayudaDeLaDireccion({ coordenadas, direccion, origen }: UbicacionDelReporte) {
  if (!coordenadas) return 'Al enviar, la buscamos en el mapa.';
  const deDonde = origen === 'manual' ? 'el punto que marcaste' : 'tu GPS';
  // Sin señal no se puede calcular la calle (consignas §8.1 P3).
  if (!direccion) return `Tenemos ${deDonde}, pero no la calle. Si la sabés, escribila.`;
  return `La sacamos de ${deDonde}. Si no es esa, corregila.`;
}
