import {
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
  type RecordingOptions,
} from 'expo-audio';
import { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';

import { formatearDuracion, ReproductorNota } from '@/componentes/reproductor-nota';
import { Aviso } from '@/componentes/ui/aviso';
import { Boton } from '@/componentes/ui/boton';
import { Texto } from '@/componentes/ui/texto';
import {
  guardarNotaDeVoz,
  MAX_SEGUNDOS_NOTA,
  pedirPermisoDeMicrofono,
  type NotaDeVoz,
  type ResultadoMicrofono,
} from '@/servicios/notas-de-voz';

// Una voz no necesita estéreo ni 128 kbps: así una nota de 60 s queda en medio mega.
const OPCIONES: RecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  numberOfChannels: 1,
  bitRate: 64000,
};

type Props = {
  nota: NotaDeVoz | null;
  /**
   * El grabador avisa que terminó desde un listener que se registra una sola vez: tienen que ser
   * funciones estables, como las de `useState`.
   */
  alGrabar: (nota: NotaDeVoz) => void;
  alCambiarGrabando: (grabando: boolean) => void;
  alBorrar: () => void;
};

type Problema = Exclude<ResultadoMicrofono, { estado: 'ok' }>;

/**
 * La nota de voz (R1.5, P15): en vez del texto, o además. Grabar, escuchar y borrar antes de enviar;
 * se corta sola a los 60 segundos. Botones grandes y letra grande (NF5).
 */
export function SeccionNotaDeVoz({ nota, alGrabar, alCambiarGrabando, alBorrar }: Props) {
  const [problema, setProblema] = useState<Problema | null>(null);
  const [empezando, setEmpezando] = useState(false);
  const grabador = useAudioRecorder(OPCIONES, (estado) => {
    if (!estado.isFinished) return;
    alCambiarGrabando(false);
    // Fuera de la grabación, el sonido vuelve al parlante (en iOS, grabando sale por el auricular).
    // `playsInSilentMode` va siempre: si falta, Android lo apaga y con el timbre en silencio la nota
    // no suena, aunque el volumen multimedia esté al máximo. Escucharla es algo que pide el vecino.
    void setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
    try {
      if (!estado.url) throw new Error('Sin archivo');
      alGrabar(guardarNotaDeVoz(estado.url));
    } catch {
      setProblema({ estado: 'no_disponible' });
    }
  });
  const { isRecording: grabando, durationMillis } = useAudioRecorderState(grabador, 250);

  async function empezar() {
    setProblema(null);
    setEmpezando(true);
    const permiso = await pedirPermisoDeMicrofono();
    if (permiso.estado !== 'ok') {
      setProblema(permiso);
      setEmpezando(false);
      return;
    }
    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await grabador.prepareToRecordAsync();
      grabador.record({ forDuration: MAX_SEGUNDOS_NOTA });
      alCambiarGrabando(true);
    } catch {
      setProblema({ estado: 'no_disponible' });
    } finally {
      setEmpezando(false);
    }
  }

  const avisos = (
    <>
      {problema?.estado === 'sin_permiso' && (
        <View className="gap-3">
          <Aviso
            tono="atencion"
            icono="mic-off-outline"
            titulo="Necesitamos el micrófono para grabar la nota."
            detalle={
              problema.puedePreguntar
                ? 'Si no querés darlo, escribí lo que pasa.'
                : 'Lo podés activar en la configuración del teléfono, o escribir lo que pasa.'
            }
          />
          {!problema.puedePreguntar && (
            <Boton
              texto="Abrir la configuración"
              variante="secundario"
              icono="settings-outline"
              onPress={() => void Linking.openSettings()}
            />
          )}
        </View>
      )}
      {problema?.estado === 'no_disponible' && (
        <Aviso tono="error" titulo="No pudimos grabar la nota." detalle="Probá de nuevo." />
      )}
    </>
  );

  if (grabando) {
    const segundos = Math.min(durationMillis / 1000, MAX_SEGUNDOS_NOTA);
    return (
      // Como cualquier grabador: el punto rojo dice que está grabando y el botón redondo la corta.
      // El rojo queda en esas dos cosas; el resto es la superficie de siempre.
      <View className="gap-4 rounded-lg border-2 border-borde bg-superficie p-4">
        <View className="flex-row items-center gap-3" accessibilityLiveRegion="polite">
          <View className="h-3 w-3 rounded-full bg-peligro" />
          <Texto variante="cuerpo-fuerte" className="flex-1">
            Grabando
          </Texto>
          <Texto variante="codigo" accessibilityLabel={`${Math.round(segundos)} segundos`}>
            {formatearDuracion(segundos)}
          </Texto>
        </View>

        <View className="gap-2">
          <View className="h-2 overflow-hidden rounded-full bg-superficie-alt">
            <View
              className="h-full rounded-full bg-primario"
              style={{ width: `${(segundos / MAX_SEGUNDOS_NOTA) * 100}%` }}
            />
          </View>
          <Texto variante="secundario">Se corta sola al llegar al minuto.</Texto>
        </View>

        <Pressable
          onPress={() => void grabador.stop().catch(() => {})}
          className="min-h-toque-principal flex-row items-center gap-4 active:opacity-70"
          accessibilityRole="button"
          accessibilityLabel="Terminar la grabación">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-peligro">
            <View className="h-5 w-5 rounded-sm bg-superficie" />
          </View>
          <Texto variante="boton">Terminar la grabación</Texto>
        </Pressable>
      </View>
    );
  }

  if (nota) {
    return (
      <View className="gap-3">
        <ReproductorNota uri={nota.uri} />
        <Boton texto="Borrar la nota" variante="peligro" icono="trash-outline" onPress={alBorrar} />
      </View>
    );
  }

  return (
    <View className="gap-3">
      {avisos}
      <Boton
        texto="Grabar una nota de voz"
        variante="secundario"
        icono="mic-outline"
        cargando={empezando}
        onPress={empezar}
      />
      <Texto variante="secundario">Hasta un minuto. La podés escuchar antes de enviar.</Texto>
    </View>
  );
}
