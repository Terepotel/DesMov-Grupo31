import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Aviso } from '@/componentes/ui/aviso';
import { Boton } from '@/componentes/ui/boton';
import { CampoTexto } from '@/componentes/ui/campo-texto';
import { EstadoReporte as InsigniaEstado, estadosReporte } from '@/componentes/ui/estado-reporte';
import { HojaInferior } from '@/componentes/ui/hoja-inferior';
import { Icono } from '@/componentes/ui/icono';
import { Texto } from '@/componentes/ui/texto';
import { ErrorApi, mensajeDeError } from '@/servicios/api';
import { cambiarEstado, LARGO_MAXIMO_COMENTARIO, limpiarComentario } from '@/servicios/reportes';
import type { Reporte } from '@/tipos';

import type { AccionDeEstado } from './acciones-de-estado';

type Props = {
  reporte: Reporte;
  /** Los pasos válidos desde el estado actual, en el orden en que se ofrecen. */
  acciones: AccionDeEstado[];
  abierta: boolean;
  alCerrar: () => void;
  alCambiar: (reporte: Reporte) => void;
  /** La API dijo que ese paso ya no vale (`TRANSICION_INVALIDA`): el reporte cambió por otro lado. */
  alDesactualizarse: (mensaje: string) => void;
};

/**
 * R4.2: elegir el estado nuevo, dejar escrito por qué y confirmar, todo en una hoja. Un solo botón
 * la abre, para que no se cambie el estado por un toque de más. El comentario es obligatorio sólo al
 * rechazar (consignas P6, API `MOTIVO_REQUERIDO`): se avisa junto al campo antes de mandar.
 * Quien la usa cambia la `key` en cada apertura, así que siempre arranca en blanco.
 */
export function HojaCambioDeEstado({
  reporte,
  acciones,
  abierta,
  alCerrar,
  alCambiar,
  alDesactualizarse,
}: Props) {
  const [elegida, setElegida] = useState<AccionDeEstado | null>(null);
  const [comentario, setComentario] = useState('');
  const [errorDelCampo, setErrorDelCampo] = useState<string | null>(null);
  const [errorDelEnvio, setErrorDelEnvio] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const esRechazo = elegida?.estado === 'rechazado';

  async function confirmar() {
    if (!elegida || enviando) return;
    const texto = limpiarComentario(comentario);
    if (esRechazo && texto === null) {
      setErrorDelCampo('Contá por qué se rechaza el reporte.');
      return;
    }
    if (texto && texto.length > LARGO_MAXIMO_COMENTARIO) {
      setErrorDelCampo(`Acortá el comentario: el máximo es ${LARGO_MAXIMO_COMENTARIO} letras.`);
      return;
    }
    setErrorDelCampo(null);
    setErrorDelEnvio(null);
    setEnviando(true);
    try {
      alCambiar(await cambiarEstado(reporte.id, { estado: elegida.estado, comentario: texto }));
    } catch (error) {
      if (error instanceof ErrorApi && error.codigo === 'MOTIVO_REQUERIDO') {
        setErrorDelCampo(error.message);
      } else if (error instanceof ErrorApi && error.codigo === 'TRANSICION_INVALIDA') {
        alDesactualizarse(error.message);
      } else {
        setErrorDelEnvio(mensajeDeError(error));
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <HojaInferior
      abierta={abierta}
      titulo="Cambiar el estado"
      alCerrar={enviando ? undefined : alCerrar}>
      <View className="gap-6">
        <View className="gap-3">
          <View className="flex-row flex-wrap items-center gap-3">
            <Texto>Hoy está en</Texto>
            <InsigniaEstado estado={reporte.estado} />
          </View>
          <Texto variante="cuerpo-fuerte">A qué estado pasa</Texto>
          <View className="gap-2" accessibilityRole="radiogroup">
            {acciones.map((accion) => {
              const marcada = elegida?.estado === accion.estado;
              return (
                <Pressable
                  key={accion.estado}
                  onPress={() => {
                    setElegida(accion);
                    setErrorDelCampo(null);
                  }}
                  disabled={enviando}
                  className={`min-h-toque flex-row items-center gap-3 rounded-lg px-4 py-2 active:opacity-70 ${
                    marcada
                      ? 'border-[3px] border-primario bg-superficie-alt'
                      : 'border-2 border-borde-control bg-superficie'
                  }`}
                  accessibilityRole="radio"
                  accessibilityLabel={accion.texto}
                  accessibilityState={{ checked: marcada, selected: marcada }}>
                  <Icono
                    nombre={accion.icono}
                    className={
                      accion.estado === 'rechazado'
                        ? 'text-peligro'
                        : estadosReporte[accion.estado].claseIcono
                    }
                  />
                  <Texto
                    variante="cuerpo-fuerte"
                    color={marcada ? 'primario' : 'texto'}
                    className="flex-1">
                    {accion.texto}
                  </Texto>
                  <Icono
                    nombre={marcada ? 'radio-button-on' : 'radio-button-off'}
                    className={marcada ? 'text-primario' : 'text-borde-control'}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>

        {elegida && (
          <>
            <CampoTexto
              etiqueta={esRechazo ? 'Por qué se rechaza' : 'Comentario (opcional)'}
              ayuda={
                esRechazo
                  ? 'El vecino lo va a leer en el detalle de su reporte.'
                  : 'Queda en el historial del reporte, a la vista del vecino.'
              }
              error={errorDelCampo}
              value={comentario}
              onChangeText={(texto) => {
                setComentario(texto);
                if (errorDelCampo) setErrorDelCampo(null);
              }}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="min-h-32 py-3"
              maxLength={LARGO_MAXIMO_COMENTARIO}
              editable={!enviando}
            />

            {errorDelEnvio && <Aviso tono="error" titulo={errorDelEnvio} />}

            <Boton
              texto={esRechazo ? 'Confirmar el rechazo' : 'Confirmar el cambio'}
              variante={esRechazo ? 'peligro' : 'primario'}
              icono={elegida.icono}
              cargando={enviando}
              onPress={confirmar}
            />
          </>
        )}

        <Boton
          texto="Dejar como está"
          variante="secundario"
          icono="arrow-back-outline"
          disabled={enviando}
          onPress={alCerrar}
        />
      </View>
    </HojaInferior>
  );
}
