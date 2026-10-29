import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { type TextInput } from 'react-native';

import { Aviso } from '@/componentes/ui/aviso';
import { Boton } from '@/componentes/ui/boton';
import { CampoTexto } from '@/componentes/ui/campo-texto';
import { Texto } from '@/componentes/ui/texto';
import { ErrorApi, mensajeDeError } from '@/servicios/api';
import { LARGO_MINIMO_CONTRASENA } from '@/servicios/autenticacion';

import { CampoContrasena } from './campo-contrasena';
import { useSesion } from './contexto';
import { MarcoIngreso } from './marco-ingreso';
import {
  validarRegistro,
  type ErroresDeRegistro,
  type FormularioDeRegistro,
} from './validar-registro';

/**
 * Crear la cuenta del vecino (P14): nombre, email, contraseña y teléfono opcional. La API siempre
 * crea un vecino; las cuentas de operador no se crean desde la app. Si sale bien, queda ingresado.
 */
export function PantallaRegistro() {
  const { registrar } = useSesion();
  const refEmail = useRef<TextInput>(null);
  const refContrasena = useRef<TextInput>(null);
  const refTelefono = useRef<TextInput>(null);

  const [formulario, setFormulario] = useState<FormularioDeRegistro>({
    nombre: '',
    email: '',
    contrasena: '',
    telefono: '',
  });
  const [errores, setErrores] = useState<ErroresDeRegistro>({});
  const [errorDelEnvio, setErrorDelEnvio] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function cambiar(campo: keyof FormularioDeRegistro) {
    return (valor: string) => {
      setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
      if (errores[campo]) setErrores((anterior) => ({ ...anterior, [campo]: undefined }));
    };
  }

  async function enviar() {
    if (enviando) return;
    const resultado = validarRegistro(formulario);
    if (resultado.errores) return setErrores(resultado.errores);

    setErrores({});
    setErrorDelEnvio(null);
    setEnviando(true);
    try {
      // Si sale bien, el guard de `_layout.tsx` lleva solo a la app.
      await registrar(resultado.registro);
    } catch (error) {
      if (error instanceof ErrorApi && error.codigo === 'EMAIL_YA_REGISTRADO') {
        setErrores({ email: error.message });
      } else {
        setErrorDelEnvio(mensajeDeError(error));
      }
      setEnviando(false);
    }
  }

  return (
    <MarcoIngreso bajada="Con una cuenta podés reportar y seguir cómo se resuelve.">
      <Texto variante="titulo-seccion" accessibilityRole="header">
        Creá tu cuenta
      </Texto>

      <CampoTexto
        etiqueta="Nombre y apellido"
        value={formulario.nombre}
        onChangeText={cambiar('nombre')}
        error={errores.nombre}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => refEmail.current?.focus()}
        editable={!enviando}
      />

      <CampoTexto
        ref={refEmail}
        etiqueta="Correo electrónico"
        value={formulario.email}
        onChangeText={cambiar('email')}
        error={errores.email}
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
        ayuda={`Por lo menos ${LARGO_MINIMO_CONTRASENA} caracteres.`}
        value={formulario.contrasena}
        onChangeText={cambiar('contrasena')}
        error={errores.contrasena}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => refTelefono.current?.focus()}
        editable={!enviando}
      />

      <CampoTexto
        ref={refTelefono}
        etiqueta="Teléfono (opcional)"
        ayuda="Por si el municipio necesita contactarte por un reporte."
        value={formulario.telefono}
        onChangeText={cambiar('telefono')}
        error={errores.telefono}
        placeholder="3446 412233"
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        returnKeyType="go"
        onSubmitEditing={enviar}
        editable={!enviando}
      />

      {errorDelEnvio && <Aviso tono="error" titulo={errorDelEnvio} />}

      <Boton
        texto="Crear mi cuenta"
        icono="person-add-outline"
        onPress={enviar}
        cargando={enviando}
        className="mt-2"
      />
      <Boton
        texto="Ya tengo cuenta"
        variante="secundario"
        icono="arrow-back-outline"
        disabled={enviando}
        onPress={() => router.back()}
      />
    </MarcoIngreso>
  );
}
