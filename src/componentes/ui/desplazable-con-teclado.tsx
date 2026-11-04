import { useEffect, useImperativeHandle, useRef, type Ref, type RefObject } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  TextInput,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewProps,
} from 'react-native';

type ConVistaInterna = ScrollView & {
  getInnerViewRef: () => Parameters<TextInput['measureLayout']>[0] | null;
};

/** Lo que queda libre entre el campo y el teclado, para que se vea el borde y algo de aire. */
const MARGEN_SOBRE_EL_TECLADO = 24;

/**
 * Con el teclado abierto, lleva el campo enfocado a la parte visible del `ScrollView`. Hace falta en
 * Android: con edge-to-edge la ventana no se achica, y al tocar un campo de abajo el teclado lo tapa.
 * Cuando se pasa de un campo a otro con el teclado ya abierto, el `ScrollView` de Android lo
 * acomoda solo. `desplazamiento` es el `contentOffset.y` actual, que se lleva desde `onScroll`.
 */
export function useCampoALaVista(
  scroll: RefObject<ScrollView | null>,
  desplazamiento: RefObject<number>,
) {
  useEffect(() => {
    let espera: ReturnType<typeof setTimeout> | undefined;
    const suscripcion = Keyboard.addListener('keyboardDidShow', (evento) => {
      clearTimeout(espera);
      // Se espera a que `KeyboardAvoidingView` termine de achicar la vista.
      espera = setTimeout(
        () => mostrarCampoEnfocado(scroll, desplazamiento, evento.endCoordinates.screenY),
        120,
      );
    });
    return () => {
      clearTimeout(espera);
      suscripcion.remove();
    };
  }, [scroll, desplazamiento]);
}

function mostrarCampoEnfocado(
  scroll: RefObject<ScrollView | null>,
  desplazamiento: RefObject<number>,
  tecladoY: number,
) {
  const campo = TextInput.State.currentlyFocusedInput();
  const vista = scroll.current;
  // Existe en `ScrollView` (es la vista del contenido), pero los tipos de React Native no lo listan.
  const contenido = (vista as ConVistaInterna | null)?.getInnerViewRef();
  const nativa = vista?.getNativeScrollRef();
  if (!campo || !vista || !contenido || !nativa) return;

  // Si el campo enfocado es de otra pantalla o de una hoja, no está dentro de este `ScrollView`: la
  // medida falla y no se mueve nada.
  campo.measureLayout(
    contenido,
    (_x, campoY, _ancho, campoAlto) => {
      nativa.measureInWindow((_vx, vistaY, _vAncho, vistaAlto) => {
        const visible = Math.min(vistaY + vistaAlto, tecladoY) - vistaY - MARGEN_SOBRE_EL_TECLADO;
        const actual = desplazamiento.current;
        if (campoY + campoAlto - actual > visible) {
          vista.scrollTo({ y: Math.max(0, campoY + campoAlto - visible), animated: true });
        } else if (campoY < actual) {
          vista.scrollTo({ y: campoY, animated: true });
        }
      });
    },
    () => {},
  );
}

type Props = ScrollViewProps & { ref?: Ref<ScrollView> };

/**
 * Un `ScrollView` de pantalla con campos de texto: se achica con el teclado (`KeyboardAvoidingView`
 * con `padding`, el que pide Expo con edge-to-edge) y deja a la vista el campo que se está
 * completando.
 */
export function DesplazableConTeclado({ ref, onScroll, ...props }: Props) {
  const scroll = useRef<ScrollView>(null);
  const desplazamiento = useRef(0);
  useImperativeHandle(ref, () => scroll.current as ScrollView, []);
  useCampoALaVista(scroll, desplazamiento);

  function alDesplazar(evento: NativeSyntheticEvent<NativeScrollEvent>) {
    desplazamiento.current = evento.nativeEvent.contentOffset.y;
    onScroll?.(evento);
  }

  return (
    <KeyboardAvoidingView className="flex-1" behavior="padding">
      <ScrollView
        ref={scroll}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        onScroll={alDesplazar}
        {...props}
      />
    </KeyboardAvoidingView>
  );
}
