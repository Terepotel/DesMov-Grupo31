import { useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { Animated, Modal, PanResponder, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Texto } from './texto';

type Props = PropsWithChildren<{
  abierta: boolean;
  /** Qué se pregunta o qué pasó: «Ya hay un reporte a 12 metros», «Filtrar por estado». */
  titulo: string;
  /** Al tocar el velo, deslizar hacia abajo o el botón atrás. Si no se pasa, la hoja es obligatoria. */
  alCerrar?: () => void;
}>;

// Cuánto hay que arrastrar (o qué tan rápido) para que la hoja se cierre en vez de volver.
const ARRASTRE_PARA_CERRAR = 96;
const VELOCIDAD_PARA_CERRAR = 0.6;

/**
 * Una pregunta o una elección que interrumpe un paso, desde abajo (DS: HojaInferior). Fondo
 * `superficie`, radio grande arriba, asa de 48×5. Se cierra deslizando hacia abajo desde el asa o
 * el título, tocando el velo o con el botón atrás. Las salidas van adentro, a todo el ancho.
 */
export function HojaInferior({ abierta, titulo, alCerrar, children }: Props) {
  const margenes = useSafeAreaInsets();
  const [desplazamiento] = useState(() => new Animated.Value(0));
  const [alto, setAlto] = useState(0);
  // Arrastrar hacia abajo sobre la lista sólo cierra si la lista está arriba de todo; si no, se
  // desplaza la lista.
  const [listaArriba, setListaArriba] = useState(true);

  useEffect(() => {
    if (abierta) desplazamiento.setValue(0);
  }, [abierta, desplazamiento]);

  const gesto = useMemo(() => {
    const puedeCerrar = !!alCerrar;
    const esArrastreHaciaAbajo = (g: { dy: number; dx: number }) =>
      puedeCerrar && g.dy > 8 && Math.abs(g.dy) > Math.abs(g.dx) * 1.5;
    const comunes = {
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_: unknown, g: { dy: number }) => {
        desplazamiento.setValue(Math.max(0, g.dy));
      },
      onPanResponderRelease: (_: unknown, g: { dy: number; vy: number }) => {
        const seCierra = g.dy > ARRASTRE_PARA_CERRAR || g.vy > VELOCIDAD_PARA_CERRAR;
        if (seCierra) {
          Animated.timing(desplazamiento, {
            toValue: alto || 600,
            duration: 180,
            useNativeDriver: true,
          }).start(() => alCerrar?.());
        } else {
          Animated.spring(desplazamiento, { toValue: 0, useNativeDriver: true }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(desplazamiento, { toValue: 0, useNativeDriver: true }).start();
      },
    };
    return {
      // Sobre la lista: se toma el gesto antes que ella (capture) cuando es un arrastre claro hacia
      // abajo y la lista está arriba de todo.
      hoja: PanResponder.create({
        ...comunes,
        onMoveShouldSetPanResponderCapture: (_, g) => listaArriba && esArrastreHaciaAbajo(g),
      }),
      // Sobre el asa y el título no hay nada más que tocar: se toma el toque desde que empieza.
      asa: PanResponder.create({
        ...comunes,
        onStartShouldSetPanResponder: () => puedeCerrar,
        onMoveShouldSetPanResponder: (_, g) => esArrastreHaciaAbajo(g),
      }),
    };
  }, [desplazamiento, alCerrar, alto, listaArriba]);

  return (
    <Modal
      visible={abierta}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={alCerrar}>
      <View className="flex-1 justify-end bg-sobre-celeste/60">
        {/* El velo: tocarlo cierra, igual que el botón atrás. */}
        <Pressable
          className="flex-1"
          onPress={alCerrar}
          disabled={!alCerrar}
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
        />
        <Animated.View
          className="max-h-[85%] rounded-t-xl bg-superficie"
          style={{
            paddingBottom: Math.max(margenes.bottom, 16),
            transform: [{ translateY: desplazamiento }],
          }}
          onLayout={(evento) => setAlto(evento.nativeEvent.layout.height)}
          accessibilityViewIsModal
          {...gesto.hoja.panHandlers}>
          <View className="gap-3 px-6 pb-3 pt-3" {...gesto.asa.panHandlers}>
            <View className="h-[5px] w-12 self-center rounded-full bg-borde-control" />
            <Texto variante="titulo-seccion" accessibilityRole="header">
              {titulo}
            </Texto>
          </View>
          <ScrollView
            contentContainerClassName="gap-3 px-6 pb-2"
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={32}
            onScroll={(evento) => {
              const arriba = evento.nativeEvent.contentOffset.y <= 0;
              if (arriba !== listaArriba) setListaArriba(arriba);
            }}>
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
