import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SelectorUbicacion } from '@/componentes/mapa/selector-ubicacion';
import { Aviso } from '@/componentes/ui/aviso';
import { Boton } from '@/componentes/ui/boton';
import { Texto } from '@/componentes/ui/texto';
import {
  elegirUbicacionAMano,
  tomarUbicacionDelGps,
  useUbicacionDelReporte,
} from '@/modulos/nuevo-reporte/ubicacion-del-reporte';
import type { Coordenadas } from '@/tipos';

/**
 * «Corregir en el mapa» del nuevo reporte (R1.4, NF4): el vecino arrastra el punto o lo pone a
 * mano si no hay GPS. Al confirmar, la ubicación queda en `ubicacion-del-reporte` y se vuelve al
 * formulario.
 */
export default function PantallaCorregirUbicacion() {
  const guardada = useUbicacionDelReporte();
  const [coordenadas, setCoordenadas] = useState<Coordenadas | null>(guardada.coordenadas);
  const [buscandoGps, setBuscandoGps] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  async function usarMiUbicacion() {
    setBuscandoGps(true);
    setAviso(null);
    const resultado = await tomarUbicacionDelGps();
    setBuscandoGps(false);
    if (resultado.estado === 'ok') {
      setCoordenadas(resultado.coordenadas);
      return;
    }
    setAviso(
      resultado.estado === 'sin_permiso'
        ? 'No tenemos permiso para ver dónde estás. Tocá en el mapa el lugar del problema.'
        : 'No pudimos saber dónde estás. Tocá en el mapa el lugar del problema.',
    );
  }

  function confirmar() {
    if (!coordenadas) return;
    // Si el punto es el mismo que trajo el GPS, no se pisa el origen.
    if (coordenadas !== guardada.coordenadas) void elegirUbicacionAMano(coordenadas);
    router.back();
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-fondo">
      <View className="w-full max-w-lg flex-1 gap-4 self-center px-6 pt-4">
        <View className="gap-1">
          <Texto variante="titulo-pantalla" accessibilityRole="header">
            ¿Dónde está el problema?
          </Texto>
          <Texto variante="secundario">
            Arrastrá el punto hasta el lugar exacto. Si no está, tocá el mapa.
          </Texto>
        </View>

        {aviso && <Aviso tono="atencion" titulo={aviso} icono="location-outline" />}

        <SelectorUbicacion
          coordenadas={coordenadas}
          alCambiar={setCoordenadas}
          mostrarMiUbicacion={guardada.gps === 'ok'}
        />

        <View className="gap-3 pb-4">
          <Boton
            texto="Usar mi ubicación"
            variante="secundario"
            icono="locate-outline"
            cargando={buscandoGps}
            onPress={usarMiUbicacion}
          />
          <Boton
            texto="Confirmar ubicación"
            icono="checkmark"
            disabled={!coordenadas}
            onPress={confirmar}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
