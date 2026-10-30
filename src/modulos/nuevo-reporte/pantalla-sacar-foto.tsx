import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Aviso } from '@/componentes/ui/aviso';
import { Boton } from '@/componentes/ui/boton';
import { Icono } from '@/componentes/ui/icono';
import { Texto } from '@/componentes/ui/texto';
import { CALIDAD_FOTO, guardarFoto } from '@/servicios/fotos';

import { entregarFotoDelArreglo } from '@/modulos/bandeja/foto-del-arreglo-pendiente';

import { AvisoSinCamara } from './aviso-sin-camara';
import { ponerFotoDelReporte } from './fotos-del-reporte';
import { useFotoMovida } from './use-foto-movida';

export type ParametrosSacarFoto = {
  /** Del nuevo reporte: 0 la primera foto, 1 la segunda. */
  lugar?: string;
  /** `arreglo`: la foto del arreglo que sube el operador desde el detalle (R4.5). */
  destino?: 'arreglo';
};

/**
 * «Sacar la foto»: la cámara y un solo botón. En el nuevo reporte (R1.2) la foto queda en
 * `fotos-del-reporte`, en el `lugar` que manda el formulario (0 la primera, 1 la segunda). Con
 * `destino=arreglo`, queda en `foto-del-arreglo-pendiente` y la sube el detalle (R4.5). En los dos
 * casos se vuelve a la pantalla anterior. Si el teléfono se mueve mientras encuadra, avisa (P20).
 */
export function PantallaSacarFoto() {
  const { lugar, destino } = useLocalSearchParams<ParametrosSacarFoto>();
  const indice = lugar === '1' ? 1 : 0;
  const esArreglo = destino === 'arreglo';
  const [permiso, pedirPermiso, revisarPermiso] = useCameraPermissions();
  const camara = useRef<CameraView>(null);
  const [lista, setLista] = useState(false);
  const [sacando, setSacando] = useState(false);
  const [error, setError] = useState<'abrir' | 'sacar' | null>(null);
  // P20: sólo avisa, nunca frena el disparo.
  const movida = useFotoMovida(lista && !sacando && error !== 'abrir');

  // Si fue a la configuración a dar el permiso, al volver a la app se mira de nuevo.
  useEffect(() => {
    const suscripcion = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') void revisarPermiso();
    });
    return () => suscripcion.remove();
  }, [revisarPermiso]);

  async function sacar() {
    if (!camara.current || sacando) return;
    setSacando(true);
    setError(null);
    try {
      const foto = await camara.current.takePictureAsync({ quality: CALIDAD_FOTO });
      if (esArreglo) entregarFotoDelArreglo(guardarFoto(foto.uri));
      else ponerFotoDelReporte(indice, guardarFoto(foto.uri));
      router.back();
    } catch {
      setError('sacar');
      setSacando(false);
    }
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-fondo">
      <View className="w-full max-w-lg flex-1 gap-4 self-center px-6 pb-4 pt-2">
        <View className="items-start gap-2">
          <Pressable
            onPress={() => router.back()}
            className="-ml-2 min-h-toque flex-row items-center gap-2 px-2 active:opacity-70"
            accessibilityRole="button"
            accessibilityLabel="Volver sin sacar la foto">
            <Icono nombre="arrow-back-outline" className="text-primario" />
            <Texto variante="cuerpo-fuerte" color="primario">
              Volver
            </Texto>
          </Pressable>
          <Texto variante="titulo-pantalla" accessibilityRole="header">
            {esArreglo ? 'Foto del arreglo' : indice === 1 ? 'Segunda foto' : 'Foto del problema'}
          </Texto>
        </View>

        {!permiso ? (
          // Mientras el teléfono contesta si hay permiso: el lugar de la cámara, vacío.
          <View className="flex-1 rounded-lg bg-superficie-alt" />
        ) : !permiso.granted ? (
          <AvisoSinCamara
            puedePreguntar={permiso.canAskAgain}
            alPedirPermiso={() => void pedirPermiso()}
            motivo={esArreglo ? 'arreglo' : 'reporte'}
          />
        ) : (
          <>
            {/* Negro como el visor de cualquier cámara: con `ratio` 4:3 quedan franjas arriba y abajo. */}
            <View className="flex-1 overflow-hidden rounded-lg" style={{ backgroundColor: '#000' }}>
              <CameraView
                ref={camara}
                style={{ flex: 1 }}
                facing="back"
                flash="auto"
                // En Android la vista previa muestra lo mismo que va a salir en la foto.
                ratio="4:3"
                onCameraReady={() => setLista(true)}
                onMountError={() => setError('abrir')}
              />
              {/* Encima del visor, para que el botón no cambie de lugar cuando aparece. */}
              {movida && (
                <View className="absolute bottom-3 left-3 right-3">
                  <Aviso
                    tono="atencion"
                    icono="hand-left-outline"
                    titulo="El teléfono se está moviendo."
                    detalle="Quedate quieto un momento para que la foto no salga movida."
                  />
                </View>
              )}
            </View>

            <Texto variante="secundario">
              {esArreglo ? 'Que se vea cómo quedó.' : 'Que se vea bien el problema.'}
            </Texto>

            {error === 'sacar' && (
              <Aviso tono="error" titulo="No pudimos sacar la foto." detalle="Probá de nuevo." />
            )}
            {error === 'abrir' && (
              <Aviso
                tono="error"
                titulo="No pudimos abrir la cámara."
                detalle="Volvé y elegí una foto de la galería."
              />
            )}

            <Boton
              texto="Sacar la foto"
              icono="camera-outline"
              cargando={sacando}
              disabled={!lista || error === 'abrir'}
              onPress={sacar}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
