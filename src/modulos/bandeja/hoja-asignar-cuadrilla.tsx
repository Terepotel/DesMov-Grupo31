import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Aviso } from '@/componentes/ui/aviso';
import { Boton } from '@/componentes/ui/boton';
import { CampoTexto } from '@/componentes/ui/campo-texto';
import { EstadoReporte as InsigniaEstado } from '@/componentes/ui/estado-reporte';
import { HojaInferior } from '@/componentes/ui/hoja-inferior';
import { Icono } from '@/componentes/ui/icono';
import { Texto } from '@/componentes/ui/texto';
import { ErrorApi, mensajeDeError } from '@/servicios/api';
import { obtenerCuadrillas } from '@/servicios/catalogos';
import { asignarCuadrilla, LARGO_MAXIMO_COMENTARIO, limpiarComentario } from '@/servicios/reportes';
import type { Cuadrilla, Reporte } from '@/tipos';
import { describirCuadrilla } from '@/utilidades/cuadrillas';
import { useCarga } from '@/utilidades/use-carga';

type Props = {
  reporte: Reporte;
  abierta: boolean;
  alCerrar: () => void;
  /** Con el reporte ya asignado y la cuadrilla elegida. */
  alAsignar: (reporte: Reporte, cuadrilla: Cuadrilla) => void;
  /** La API dijo que este reporte ya no se puede asignar (`TRANSICION_INVALIDA`). */
  alDesactualizarse: (mensaje: string) => void;
};

/** Lo que la API rechaza de la cuadrilla elegida: la lista estaba vieja. */
const ERRORES_DE_CUADRILLA = [
  'CUADRILLA_NO_ENCONTRADA',
  'CUADRILLA_INACTIVA',
  'CUADRILLA_DE_OTRA_ZONA',
];

/**
 * R4.3: elegir una cuadrilla de la zona del reporte y confirmar. Se ofrecen sólo las activas de esa
 * zona (P13, la API valida lo mismo); la especialidad se muestra, no filtra. Asignar pasa el reporte a
 * «Asignado a cuadrilla»; si ya estaba asignado, lo cambia de cuadrilla y queda en el historial.
 * Quien la usa cambia la `key` en cada apertura, así que siempre arranca en blanco.
 */
export function HojaAsignarCuadrilla({
  reporte,
  abierta,
  alCerrar,
  alAsignar,
  alDesactualizarse,
}: Props) {
  const [elegida, setElegida] = useState<Cuadrilla | null>(null);
  const [comentario, setComentario] = useState('');
  const [errorDeLaLista, setErrorDeLaLista] = useState<string | null>(null);
  const [errorDelCampo, setErrorDelCampo] = useState<string | null>(null);
  const [errorDelEnvio, setErrorDelEnvio] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  // Si la API rechaza la cuadrilla elegida, la lista se vuelve a pedir.
  const [vezDeLaLista, setVezDeLaLista] = useState(0);

  const reasigna = reporte.estado === 'asignado';

  async function confirmar() {
    if (enviando) return;
    if (!elegida) {
      setErrorDeLaLista('Elegí a qué cuadrilla va.');
      return;
    }
    const texto = limpiarComentario(comentario);
    if (texto && texto.length > LARGO_MAXIMO_COMENTARIO) {
      setErrorDelCampo(`Acortá el comentario: el máximo es ${LARGO_MAXIMO_COMENTARIO} letras.`);
      return;
    }
    setErrorDeLaLista(null);
    setErrorDelCampo(null);
    setErrorDelEnvio(null);
    setEnviando(true);
    try {
      const asignado = await asignarCuadrilla(reporte.id, {
        cuadrillaId: elegida.id,
        comentario: texto,
      });
      alAsignar(asignado, elegida);
    } catch (error) {
      if (error instanceof ErrorApi && error.codigo === 'TRANSICION_INVALIDA') {
        alDesactualizarse(error.message);
      } else if (error instanceof ErrorApi && ERRORES_DE_CUADRILLA.includes(error.codigo)) {
        setElegida(null);
        setErrorDeLaLista(`${error.message} Volvimos a cargar las cuadrillas.`);
        setVezDeLaLista((n) => n + 1);
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
      titulo={reasigna ? 'Cambiar la cuadrilla' : 'Asignar a una cuadrilla'}
      alCerrar={enviando ? undefined : alCerrar}>
      <View className="gap-6">
        <View className="gap-3">
          <View className="flex-row flex-wrap items-center gap-3">
            <Texto>Hoy está en</Texto>
            <InsigniaEstado estado={reporte.estado} />
          </View>
          <Texto>
            {reasigna
              ? 'El reporte sigue asignado, con la cuadrilla nueva. El cambio queda en el historial.'
              : 'El reporte pasa a Asignado a cuadrilla y el vecino lo ve así.'}
          </Texto>
        </View>

        <View className="gap-3">
          <Texto variante="cuerpo-fuerte">A qué cuadrilla va</Texto>
          {abierta && (
            <ListaDeCuadrillas
              key={vezDeLaLista}
              reporte={reporte}
              elegida={elegida}
              bloqueada={enviando}
              alElegir={(cuadrilla) => {
                setElegida(cuadrilla);
                setErrorDeLaLista(null);
              }}
            />
          )}
          {errorDeLaLista && <Aviso tono="error" titulo={errorDeLaLista} />}
        </View>

        {elegida && (
          <>
            <CampoTexto
              etiqueta="Comentario (opcional)"
              ayuda="Queda en el historial del reporte, a la vista del vecino."
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
              texto={reasigna ? 'Confirmar el cambio' : 'Confirmar la asignación'}
              icono="people-outline"
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

type PropsLista = {
  reporte: Reporte;
  elegida: Cuadrilla | null;
  bloqueada: boolean;
  alElegir: (cuadrilla: Cuadrilla) => void;
};

/** Las cuadrillas activas de la zona del reporte, como opciones de una sola elección. */
function ListaDeCuadrillas({ reporte, elegida, bloqueada, alElegir }: PropsLista) {
  const cargar = useCallback(
    () => obtenerCuadrillas({ zonaId: reporte.zonaId, activa: true }).then((r) => r.datos),
    [reporte.zonaId],
  );
  const { carga, reintentar } = useCarga(cargar);

  if (carga.tipo === 'cargando') {
    return (
      <View className="gap-2">
        <OpcionCargando />
        <OpcionCargando />
      </View>
    );
  }
  if (carga.tipo === 'error') {
    return (
      <View className="gap-3">
        <Aviso tono="error" titulo={carga.mensaje} />
        <Boton
          texto="Probar de nuevo"
          variante="secundario"
          icono="refresh-outline"
          onPress={reintentar}
        />
      </View>
    );
  }
  if (carga.datos.length === 0) {
    return (
      <Aviso
        tono="atencion"
        titulo="No hay cuadrillas activas en la zona del reporte."
        detalle="Cuando se active una, va a aparecer acá."
      />
    );
  }

  return (
    <View className="gap-2" accessibilityRole="radiogroup">
      {carga.datos.map((cuadrilla) => {
        const marcada = elegida?.id === cuadrilla.id;
        const esLaDeHoy = cuadrilla.id === reporte.cuadrillaId;
        return (
          <Pressable
            key={cuadrilla.id}
            onPress={() => alElegir(cuadrilla)}
            disabled={bloqueada}
            className={`min-h-toque flex-row items-center gap-3 rounded-lg px-4 py-2 active:opacity-70 ${
              marcada
                ? 'border-[3px] border-primario bg-superficie-alt'
                : 'border-2 border-borde-control bg-superficie'
            }`}
            accessibilityRole="radio"
            accessibilityLabel={`${describirCuadrilla(cuadrilla)}${esLaDeHoy ? ', asignada hoy' : ''}`}
            accessibilityState={{ checked: marcada, selected: marcada }}>
            <Icono nombre="people-outline" className={marcada ? 'text-primario' : 'text-texto'} />
            <View className="flex-1 gap-1">
              <Texto variante="cuerpo-fuerte" color={marcada ? 'primario' : 'texto'}>
                {cuadrilla.nombre}
              </Texto>
              <Texto variante="secundario">
                {cuadrilla.especialidad}
                {esLaDeHoy ? ' · asignada hoy' : ''}
              </Texto>
            </View>
            <Icono
              nombre={marcada ? 'radio-button-on' : 'radio-button-off'}
              className={marcada ? 'text-primario' : 'text-borde-control'}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

function OpcionCargando() {
  return (
    <View
      className="min-h-toque rounded-lg border-2 border-borde bg-superficie-alt"
      accessibilityLabel="Cargando las cuadrillas"
    />
  );
}
