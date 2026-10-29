import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { type TextInput } from 'react-native';

import { Aviso } from '@/componentes/ui/aviso';
import { Boton } from '@/componentes/ui/boton';
import { CampoTexto } from '@/componentes/ui/campo-texto';
import { Texto } from '@/componentes/ui/texto';

import { CampoContrasena } from './campo-contrasena';
import { useSesion } from './contexto';
import { MarcoIngreso } from './marco-ingreso';

export function PantallaIngreso() {
  const { ingresar } = useSesion();
  const refContrasena = useRef<TextInput>(null);

  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <MarcoIngreso bajada="Contanos qué pasa en tu calle y seguí cómo se resuelve.">
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

      <CampoContrasena
        ref={refContrasena}
        etiqueta="Contraseña"
        value={contrasena}
        onChangeText={setContrasena}
        autoComplete="current-password"
        returnKeyType="go"
        onSubmitEditing={enviar}
        editable={!enviando}
      />

      {error && <Aviso tono="error" titulo={error} />}

      <Boton texto="Ingresar" onPress={enviar} cargando={enviando} className="mt-2" />

      <Texto variante="secundario">Si es la primera vez que entrás, creá tu cuenta.</Texto>
      <Boton
        texto="Crear una cuenta"
        variante="secundario"
        icono="person-add-outline"
        disabled={enviando}
        onPress={() => router.push('/registro')}
      />
    </MarcoIngreso>
  );
}
