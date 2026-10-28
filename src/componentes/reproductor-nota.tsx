import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { View } from 'react-native';

import { Boton } from '@/componentes/ui/boton';
import { Icono } from '@/componentes/ui/icono';
import { Texto } from '@/componentes/ui/texto';

/** «0:42». */
export function formatearDuracion(segundos: number) {
  const total = Math.max(0, Math.round(segundos));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/**
 * Escuchar una nota de voz (R1.5): la recién grabada en el formulario o la de un reporte en el
 * detalle. Un solo botón, grande, que alterna entre escuchar y pausar (NF5).
 */
export function ReproductorNota({ uri }: { uri: string }) {
  const reproductor = useAudioPlayer(uri);
  const estado = useAudioPlayerStatus(reproductor);
  const sonando = estado.playing;

  async function alternar() {
    if (sonando) {
      reproductor.pause();
      return;
    }
    // La pidió el vecino: suena aunque el timbre esté en silencio (el volumen es el multimedia).
    await setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    // Al terminar queda en el final: se vuelve al principio para escucharla otra vez.
    if (estado.duration > 0 && estado.currentTime >= estado.duration - 0.25) {
      await reproductor.seekTo(0);
    }
    reproductor.play();
  }

  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-3 rounded-lg border-2 border-borde bg-superficie p-4">
        <Icono nombre="mic-outline" className="text-texto" />
        <View className="flex-1 gap-1">
          <Texto variante="cuerpo-fuerte">Nota de voz</Texto>
          <Texto variante="secundario">
            {sonando
              ? `${formatearDuracion(estado.currentTime)} de ${formatearDuracion(estado.duration)}`
              : estado.isLoaded
                ? `Dura ${formatearDuracion(estado.duration)}`
                : 'Cargando…'}
          </Texto>
        </View>
      </View>
      <Boton
        texto={sonando ? 'Pausar la nota' : 'Escuchar la nota'}
        variante="secundario"
        icono={sonando ? 'pause-outline' : 'play-outline'}
        disabled={!estado.isLoaded}
        onPress={alternar}
      />
    </View>
  );
}
