// Tapa la pantalla con el mismo dibujo que el splash nativo (fondo celeste y el pin) hasta que la
// app sabe si hay sesión, y después se desvanece. Así no hay salto entre el splash y la primera
// pantalla.

import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const DURACION_MS = 600;

export function AnimatedSplashOverlay() {
  const [animar, setAnimar] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const desvanecer = new Keyframe({
    0: { opacity: 1 },
    20: { opacity: 1 },
    100: { opacity: 0, easing: Easing.out(Easing.quad) },
  });

  const imagen = (
    <Image style={estilos.imagen} source={require('@/assets/images/splash-icon.png')} />
  );

  return animar ? (
    <Animated.View
      entering={desvanecer.duration(DURACION_MS).withCallback((termino) => {
        'worklet';
        if (termino) scheduleOnRN(setVisible, false);
      })}
      style={estilos.velo}>
      {imagen}
    </Animated.View>
  ) : (
    <View
      onLayout={() => {
        SplashScreen.hideAsync().finally(() => setAnimar(true));
      }}
      style={estilos.velo}>
      {imagen}
    </View>
  );
}

const estilos = StyleSheet.create({
  velo: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#3F99D5',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  // Igual que `imageWidth` del plugin expo-splash-screen en app.json.
  imagen: { width: 140, height: 140 },
});
