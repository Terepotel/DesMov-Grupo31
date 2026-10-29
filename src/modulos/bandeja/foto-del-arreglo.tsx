import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Aviso } from '@/componentes/ui/aviso';
import { Boton } from '@/componentes/ui/boton';
import { HojaInferior } from '@/componentes/ui/hoja-inferior';
import { Texto } from '@/componentes/ui/texto';
import { AvisoSinCamara } from '@/modulos/nuevo-reporte/aviso-sin-camara';
import { ErrorApi, mensajeDeError } from '@/servicios/api';
import {
  borrarFoto,
  elegirFotoDeLaGaleria,
  MAX_FOTOS_DEL_ARREGLO,
  pedirPermisoDeCamara,
  type FotoElegida,
  type ResultadoPermiso,
} from '@/servicios/fotos';
import {
  ESTADOS_CON_FOTO_DEL_ARREGLO,
  subirFotoDelArreglo,
  type NuevaFotoDelArreglo,
} from '@/servicios/reportes';
import type { Reporte } from '@/tipos';
import { nuevoId } from '@/utilidades/reportes';

import { retirarFotoDelArreglo, useFotoDelArregloPendiente } from './foto-del-arreglo-pendiente';

type Props = {
  reporte: Reporte;
  alSubir: (reporte: Reporte) => void;
  /** La API ya no acepta la foto (cambió el estado o alguien llegó a tres): el reporte cambió por otro lado. */
  alDesactualizarse: (mensaje: string) => void;
};

type Problema = Exclude<ResultadoPermiso, { estado: 'ok' }>;

/** Una foto elegida que no se pudo subir: se reintenta con el mismo `id` o se descarta. */
type Pendiente = { foto: NuevaFotoDelArreglo; error: string };

export function cuentaFotosDelArreglo(reporte: Reporte) {
  return reporte.fotos.filter((f) => f.momento === 'arreglo').length;
}

/** Si la API aceptaría una foto más del arreglo (R15): se ofrece sólo ahí. */
export function admiteFotoDelArreglo(reporte: Reporte) {
  return (
    reporte.sincronizado &&
    ESTADOS_CON_FOTO_DEL_ARREGLO.includes(reporte.estado) &&
    cuentaFotosDelArreglo(reporte) < MAX_FOTOS_DEL_ARREGLO
  );
}

/**
 * R4.5: la foto de cómo quedó el arreglo, de la cámara («Sacar la foto», la misma pantalla del nuevo
 * reporte) o de la galería. Se sube apenas se elige; si falla, queda guardada en el teléfono y se
 * ofrece probar de nuevo con el mismo id (la API no la duplica) o descartarla.
 */
export function FotoDelArreglo({ reporte, alSubir, alDesactualizarse }: Props) {
  const [eligiendo, setEligiendo] = useState(false);
  const [abriendo, setAbriendo] = useState<'camara' | 'galeria' | null>(null);
  const [problema, setProblema] = useState<Problema | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [pendiente, setPendiente] = useState<Pendiente | null>(null);
  const entregada = useFotoDelArregloPendiente();

  // Al volver de «Sacar la foto», la foto está en el store: se retira y se sube.
  useEffect(() => {
    if (!entregada) return;
    const foto = retirarFotoDelArreglo();
    if (foto) void subir({ ...foto, id: nuevoId('fot') });
    // `subir` cambia en cada render; lo que importa es que llegue una foto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entregada]);

  async function subir(foto: NuevaFotoDelArreglo) {
    setSubiendo(true);
    setPendiente(null);
    try {
      const actualizado = await subirFotoDelArreglo(reporte.id, foto);
      borrarFoto(foto);
      alSubir(actualizado);
    } catch (error) {
      if (
        error instanceof ErrorApi &&
        (error.codigo === 'ESTADO_NO_ADMITE_FOTO' || error.codigo === 'VALIDACION_FALLIDA')
      ) {
        borrarFoto(foto);
        alDesactualizarse(error.message);
      } else {
        setPendiente({ foto, error: mensajeDeError(error) });
      }
    } finally {
      setSubiendo(false);
    }
  }

  async function abrirCamara() {
    setEligiendo(false);
    setAbriendo('camara');
    setProblema(null);
    const permiso = await pedirPermisoDeCamara();
    setAbriendo(null);
    if (permiso.estado === 'ok') {
      router.push({ pathname: '/sacar-foto', params: { destino: 'arreglo' } });
    } else setProblema(permiso);
  }

  async function abrirGaleria() {
    setEligiendo(false);
    setAbriendo('galeria');
    setProblema(null);
    const resultado = await elegirFotoDeLaGaleria();
    setAbriendo(null);
    if (resultado.estado === 'ok') await subir(elegida(resultado.foto));
    else if (resultado.estado !== 'cancelado') setProblema(resultado);
  }

  function descartar() {
    if (!pendiente) return;
    borrarFoto(pendiente.foto);
    setPendiente(null);
  }

  const cuantas = cuentaFotosDelArreglo(reporte);
  const ocupado = abriendo !== null || subiendo;

  return (
    <View className="gap-3">
      {problema?.estado === 'sin_permiso' && (
        <AvisoSinCamara puedePreguntar={problema.puedePreguntar} motivo="arreglo" />
      )}
      {problema?.estado === 'no_disponible' && (
        <Aviso
          tono="error"
          titulo="No pudimos abrir la cámara ni la galería."
          detalle="Probá de nuevo."
        />
      )}

      {pendiente ? (
        <>
          <Aviso
            tono="error"
            titulo={pendiente.error}
            detalle="La foto quedó guardada en el teléfono. Podés probar de nuevo o descartarla."
          />
          <Boton
            texto="Probar de nuevo"
            variante="secundario"
            icono="refresh-outline"
            cargando={subiendo}
            disabled={ocupado}
            onPress={() => void subir(pendiente.foto)}
          />
          <Boton
            texto="Descartar la foto"
            variante="peligro"
            icono="trash-outline"
            disabled={ocupado}
            onPress={descartar}
          />
        </>
      ) : (
        <Boton
          texto={cuantas === 0 ? 'Subir la foto del arreglo' : 'Agregar otra foto del arreglo'}
          variante="secundario"
          icono="camera-outline"
          cargando={subiendo}
          disabled={ocupado}
          onPress={() => setEligiendo(true)}
        />
      )}

      <HojaInferior
        abierta={eligiendo}
        titulo={cuantas === 0 ? 'Foto del arreglo' : `Foto ${cuantas + 1} del arreglo`}
        alCerrar={() => setEligiendo(false)}>
        <Texto variante="secundario">
          {`Se sube apenas la elegís. ${
            MAX_FOTOS_DEL_ARREGLO - cuantas === 1
              ? 'Es la última: la API acepta hasta tres.'
              : `Podés subir ${MAX_FOTOS_DEL_ARREGLO - cuantas} más.`
          }`}
        </Texto>
        <Boton texto="Sacar una foto" icono="camera-outline" onPress={() => void abrirCamara()} />
        <Boton
          texto="Elegir de la galería"
          variante="secundario"
          icono="images-outline"
          onPress={() => void abrirGaleria()}
        />
        <Boton
          texto="Dejar como está"
          variante="secundario"
          icono="arrow-back-outline"
          onPress={() => setEligiendo(false)}
        />
      </HojaInferior>
    </View>
  );
}

function elegida(foto: FotoElegida): NuevaFotoDelArreglo {
  return { ...foto, id: nuevoId('fot') };
}
