import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { Keyboard, KeyboardAvoidingView, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Ola } from '@/componentes/ui/encabezado';
import { Texto } from '@/componentes/ui/texto';

type Props = PropsWithChildren<{
  /** Debajo de «Reporte Ciudadano», en celeste. */
  bajada: string;
}>;

/**
 * El fondo celeste del ingreso (DS: celeste = entrar), con la ola abajo y el formulario en una
 * tarjeta. Lo comparten ingreso, registro y la pantalla de bloqueo. Con el teclado abierto se
 * esconde la ola y el formulario sube hasta el final, así el campo y el botón quedan a la vista.
 */
export function MarcoIngreso({ bajada, children }: Props) {
  const margenes = useSafeAreaInsets();
  const refDesplazable = useRef<ScrollView>(null);
  const [tecladoAbierto, setTecladoAbierto] = useState(false);

  useEffect(() => {
    const alAbrir = Keyboard.addListener('keyboardDidShow', () => setTecladoAbierto(true));
    const alCerrar = Keyboard.addListener('keyboardDidHide', () => setTecladoAbierto(false));
    return () => {
      alAbrir.remove();
      alCerrar.remove();
    };
  }, []);

  // Va después del render para que el desplazamiento ya no cuente la ola.
  useEffect(() => {
    if (tecladoAbierto) refDesplazable.current?.scrollToEnd({ animated: true });
  }, [tecladoAbierto]);

  return (
    <View className="flex-1 bg-bandera-celeste">
      {/* El fondo es celeste en los dos temas: los íconos de la barra de estado, oscuros. */}
      <StatusBar style="dark" />
      {/* `padding` también en Android: con edge-to-edge la ventana ya no se achica sola. */}
      <KeyboardAvoidingView className="flex-1" behavior="padding">
        <ScrollView
          ref={refDesplazable}
          contentContainerClassName="grow"
          contentContainerStyle={{ paddingTop: margenes.top }}
          keyboardShouldPersistTaps="handled">
          <View className="w-full max-w-lg flex-1 justify-center gap-8 self-center px-6 py-8">
            <View className="items-start gap-3">
              <Texto variante="etiqueta" color="sobre-celeste">
                Municipalidad de Gualeguaychú
              </Texto>
              <Texto variante="titulo-pantalla" color="sobre-celeste" accessibilityRole="header">
                Reporte Ciudadano
              </Texto>
              <Texto color="sobre-celeste">{bajada}</Texto>
            </View>

            <View className="gap-6 rounded-lg bg-superficie p-6">{children}</View>
          </View>
          {/* Llega hasta el borde inferior: la barra de navegación queda sobre la ola. */}
          {!tecladoAbierto && <Ola alto={88 + margenes.bottom} />}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
