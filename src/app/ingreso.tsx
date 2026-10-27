import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Aviso } from '@/componentes/ui/aviso';
import { Boton } from '@/componentes/ui/boton';
import { CampoTexto } from '@/componentes/ui/campo-texto';
import { Encabezado } from '@/componentes/ui/encabezado';
import { Icono } from '@/componentes/ui/icono';
import { Texto } from '@/componentes/ui/texto';
import { useSesion } from '@/modulos/autenticacion/contexto';

export default function PantallaIngreso() {
  const { ingresar } = useSesion();
  const margenes = useSafeAreaInsets();
  const refContrasena = useRef<TextInput>(null);
  const refDesplazable = useRef<ScrollView>(null);

  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Con el teclado abierto, el formulario sube hasta el final: el campo y «Ingresar» a la vista.
  useEffect(() => {
    const suscripcion = Keyboard.addListener('keyboardDidShow', () =>
      refDesplazable.current?.scrollToEnd({ animated: true }),
    );
    return () => suscripcion.remove();
  }, []);

  async function enviar() {
    if (enviando) return;
    const emailLimpio = email.trim();
    if (!emailLimpio) return setError('Escribí tu email.');
    if (!contrasena) return setError('Escribí tu contraseña.');

    setError(null);
    setEnviando(true);
    try {
      // Si sale bien, el guard de `_layout.tsx` lleva solo a la app.
      await ingresar(emailLimpio, contrasena);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Algo salió mal. Probá de nuevo.');
      setEnviando(false);
    }
  }

  return (
    <View className="flex-1 bg-fondo">
      {/* El encabezado es celeste en los dos temas: los íconos de la barra de estado, oscuros. */}
      <StatusBar style="dark" />
      {/* `padding` también en Android: con edge-to-edge la ventana ya no se achica sola. */}
      <KeyboardAvoidingView className="flex-1" behavior="padding">
        <ScrollView
          ref={refDesplazable}
          contentContainerClassName="grow"
          contentContainerStyle={{ paddingBottom: margenes.bottom }}
          keyboardShouldPersistTaps="handled">
          <Encabezado tono="celeste" margenSuperior={margenes.top} className="rounded-b-xl">
            <Texto variante="etiqueta" color="sobre-celeste">
              Municipalidad de Gualeguaychú
            </Texto>
            <Texto variante="titulo-pantalla" color="sobre-celeste" accessibilityRole="header">
              Reporte Ciudadano
            </Texto>
            <Texto color="sobre-celeste">
              Contanos qué pasa en tu calle y seguí cómo se resuelve.
            </Texto>
          </Encabezado>

          <View className="w-full max-w-lg gap-6 self-center px-6 py-8">
            <Texto variante="titulo-seccion" accessibilityRole="header">
              Ingresá con tu cuenta
            </Texto>

            <CampoTexto
              etiqueta="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              placeholder="tunombre@mail.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => refContrasena.current?.focus()}
              editable={!enviando}
            />

            <CampoTexto
              ref={refContrasena}
              etiqueta="Contraseña"
              value={contrasena}
              onChangeText={setContrasena}
              secureTextEntry={!mostrarContrasena}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={enviar}
              editable={!enviando}
              accesorio={
                <Pressable
                  onPress={() => setMostrarContrasena((valor) => !valor)}
                  className="h-14 w-14 items-center justify-center active:opacity-70"
                  accessibilityRole="button"
                  accessibilityLabel={
                    mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'
                  }
                  accessibilityState={{ selected: mostrarContrasena }}>
                  <Icono
                    nombre={mostrarContrasena ? 'eye-outline' : 'eye-off-outline'}
                    tamano={26}
                    className="text-texto-secundario"
                  />
                </Pressable>
              }
            />

            {error && <Aviso tono="error" titulo={error} />}

            <Boton texto="Ingresar" onPress={enviar} cargando={enviando} className="mt-2" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
