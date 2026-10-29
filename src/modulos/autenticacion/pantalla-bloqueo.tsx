import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Aviso } from '@/componentes/ui/aviso';
import { Boton } from '@/componentes/ui/boton';
import { Texto } from '@/componentes/ui/texto';
import { hayHuella, pedirHuella } from '@/servicios/huella';
import type { Usuario } from '@/tipos';

import { CampoContrasena } from './campo-contrasena';
import { useSesion } from './contexto';
import { MarcoIngreso } from './marco-ingreso';

type Props = { usuario: Usuario };

/**
 * R4.7: al volver a la app con sesión guardada, se pide la huella antes de mostrar nada (los dos
 * roles). Si el teléfono no tiene huella, o no la reconoce, se entra con la contraseña de la cuenta
 * (que además renueva la sesión). Va encima de la app, así lo que había queda como estaba.
 */
export function PantallaBloqueo({ usuario }: Props) {
  const { ingresar, desbloquear, salir } = useSesion();
  const [huella, setHuella] = useState<'viendo' | 'si' | 'no'>('viendo');
  const [pidiendo, setPidiendo] = useState(false);
  const [contrasena, setContrasena] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pedir() {
    if (pidiendo) return;
    setPidiendo(true);
    setError(null);
    const resultado = await pedirHuella();
    setPidiendo(false);
    if (resultado.estado === 'ok') desbloquear();
    else if (resultado.estado === 'no_disponible') setHuella('no');
    else if (resultado.estado === 'fallo') setError(resultado.mensaje);
  }

  // Al aparecer, se pide la huella sola si el teléfono tiene; si no, directo a la contraseña.
  useEffect(() => {
    let vigente = true;
    hayHuella().then((tiene) => {
      if (!vigente) return;
      setHuella(tiene ? 'si' : 'no');
      if (tiene) void pedir();
    });
    return () => {
      vigente = false;
    };
    // Sólo al montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function entrarConContrasena() {
    if (enviando) return;
    if (!contrasena) return setError('Escribí tu contraseña.');
    setError(null);
    setEnviando(true);
    try {
      await ingresar(usuario.email, contrasena);
      desbloquear();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Algo salió mal. Probá de nuevo.');
      setEnviando(false);
    }
  }

  const ocupado = pidiendo || enviando;

  return (
    <View style={StyleSheet.absoluteFill}>
      <MarcoIngreso bajada={`Hola de nuevo, ${usuario.nombre}.`}>
        <Texto variante="titulo-seccion" accessibilityRole="header">
          Volvé a entrar
        </Texto>

        {huella === 'si' && (
          <Boton
            texto="Entrar con la huella"
            icono="finger-print-outline"
            cargando={pidiendo}
            disabled={ocupado}
            onPress={pedir}
          />
        )}

        <Texto variante="secundario">
          {huella === 'si'
            ? 'O escribí la contraseña de tu cuenta.'
            : 'Escribí la contraseña de tu cuenta.'}
        </Texto>
        <CampoContrasena
          etiqueta="Contraseña"
          value={contrasena}
          onChangeText={(valor) => {
            setContrasena(valor);
            if (error) setError(null);
          }}
          autoComplete="current-password"
          returnKeyType="go"
          onSubmitEditing={entrarConContrasena}
          editable={!ocupado}
        />

        {error && <Aviso tono="error" titulo={error} />}

        <Boton
          texto="Entrar con la contraseña"
          variante={huella === 'si' ? 'secundario' : 'primario'}
          icono="key-outline"
          cargando={enviando}
          disabled={ocupado}
          onPress={entrarConContrasena}
        />
        <Boton
          texto="Cerrar sesión"
          variante="secundario"
          icono="log-out-outline"
          disabled={ocupado}
          onPress={salir}
        />
      </MarcoIngreso>
    </View>
  );
}
