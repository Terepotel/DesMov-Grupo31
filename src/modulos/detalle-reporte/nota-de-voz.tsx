import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect } from 'react';
import { View } from 'react-native';

import { Aviso } from '@/componentes/ui/aviso';
import { Boton } from '@/componentes/ui/boton';
import { Texto } from '@/componentes/ui/texto';

type Props = {
  /** La `audioUrl` del reporte: una URL de `/archivos` o, sin enviar, un archivo del teléfono. */
  url: string;
};

/**
 * La nota de voz del reporte (R1.5): un botón grande para escucharla o pausarla, cuánto va y cuánto
 * dura. Nada se oculta detrás de un gesto: el avance se ve, no se arrastra.
 */
export function NotaDeVoz({ url }: Props) {
  const reproductor = useAudioPlayer({ uri: url }, { updateInterval: 250 });
  const estado = useAudioPlayerStatus(reproductor);

  // En iOS, con el interruptor de silencio puesto no sonaría nada: la nota es lo que se vino a oír.
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  if (estado.error) {
    return (
      <Aviso
        tono="error"
        icono="mic-off-outline"
        titulo="No pudimos cargar la nota de voz."
        detalle="Revisá tu conexión y volvé a abrir el reporte."
      />
    );
  }

  const duracion = estado.duration > 0 ? estado.duration : null;
  const terminada = duracion !== null && estado.currentTime >= duracion - 0.25;
  const avance = duracion ? Math.min(1, estado.currentTime / duracion) : 0;

  const alternar = async () => {
    if (estado.playing) {
      reproductor.pause();
      return;
    }
    if (terminada || estado.didJustFinish) await reproductor.seekTo(0);
    reproductor.play();
  };

  const tiempo = duracion
    ? `${formatearDuracion(terminada && !estado.playing ? duracion : estado.currentTime)} de ${formatearDuracion(duracion)}`
    : estado.isLoaded
      ? 'Nota de voz'
      : 'Cargando la nota de voz';

  return (
    <View className="gap-3 rounded-lg border border-borde bg-superficie p-4">
      <Boton
        texto={estado.playing ? 'Pausar la nota' : 'Escuchar la nota'}
        variante="secundario"
        icono={estado.playing ? 'pause-outline' : 'play-outline'}
        onPress={alternar}
      />
      <View
        className="gap-2"
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={tiempo}
        accessibilityValue={{ min: 0, max: 100, now: Math.round(avance * 100) }}>
        <View className="h-2 overflow-hidden rounded-full bg-superficie-alt">
          <View className="h-full rounded-full bg-primario" style={{ width: `${avance * 100}%` }} />
        </View>
        <Texto variante="secundario">{tiempo}</Texto>
      </View>
    </View>
  );
}

/** `0:07`, `1:00`. Las notas duran un minuto como máximo (P15). */
function formatearDuracion(segundos: number) {
  const total = Math.max(0, Math.round(segundos));
  const minutos = Math.floor(total / 60);
  const resto = total % 60;
  return `${minutos}:${String(resto).padStart(2, '0')}`;
}
