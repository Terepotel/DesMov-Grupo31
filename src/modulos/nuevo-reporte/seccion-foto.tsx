import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Aviso } from '@/componentes/ui/aviso';
import { Boton } from '@/componentes/ui/boton';
import { HojaInferior } from '@/componentes/ui/hoja-inferior';
import { Icono } from '@/componentes/ui/icono';
import { Texto } from '@/componentes/ui/texto';
import {
  elegirFotoDeLaGaleria,
  MAX_FOTOS_DEL_PROBLEMA,
  pedirPermisoDeCamara,
  type ResultadoPermiso,
} from '@/servicios/fotos';

import { AvisoSinCamara } from './aviso-sin-camara';
import {
  ponerFotoDelReporte,
  quitarFotoDelReporte,
  type FotoDelReporte,
} from './fotos-del-reporte';

type Props = {
  fotos: FotoDelReporte[];
};

type Problema = Exclude<ResultadoPermiso, { estado: 'ok' }>;

/**
 * Las fotos del problema: una obligatoria (R1.2) y una segunda opcional (R1.3, P16), de la cámara
 * («Sacar la foto», con `CameraView`) o de la galería (P1). Las dos piden antes el permiso de
 * cámara (NF3). Sin fotos, los dos botones a la vista; después, cambiar o agregar abre una hoja
 * para elegir de dónde.
 */
export function SeccionFoto({ fotos }: Props) {
  const [abriendo, setAbriendo] = useState<'camara' | 'galeria' | null>(null);
  const [problema, setProblema] = useState<Problema | null>(null);
  /** Para qué lugar se abrió la hoja: el de una foto que se cambia o el siguiente, para agregar. */
  const [lugarDeLaHoja, setLugarDeLaHoja] = useState<number | null>(null);

  async function abrirCamara(lugar: number) {
    setLugarDeLaHoja(null);
    setAbriendo('camara');
    setProblema(null);
    const permiso = await pedirPermisoDeCamara();
    setAbriendo(null);
    if (permiso.estado === 'ok') {
      router.push({ pathname: '/sacar-foto', params: { lugar: String(lugar) } });
    } else setProblema(permiso);
  }

  async function abrirGaleria(lugar: number) {
    setLugarDeLaHoja(null);
    setAbriendo('galeria');
    setProblema(null);
    const resultado = await elegirFotoDeLaGaleria();
    setAbriendo(null);
    if (resultado.estado === 'ok') ponerFotoDelReporte(lugar, resultado.foto);
    else if (resultado.estado !== 'cancelado') setProblema(resultado);
  }

  const avisos = (
    <>
      {problema?.estado === 'sin_permiso' && (
        <AvisoSinCamara puedePreguntar={problema.puedePreguntar} />
      )}
      {problema?.estado === 'no_disponible' && (
        <Aviso
          tono="error"
          titulo="No pudimos abrir la cámara ni la galería."
          detalle="Probá de nuevo."
        />
      )}
    </>
  );

  if (fotos.length === 0) {
    return (
      <View className="gap-3">
        <View
          className="w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-borde-control bg-superficie"
          style={{ aspectRatio: 4 / 3 }}>
          <Icono nombre="camera-outline" tamano={40} className="text-texto-secundario" />
          <Texto variante="secundario">Todavía no hay foto</Texto>
        </View>
        {avisos}
        <Boton
          texto="Sacar una foto"
          variante="secundario"
          icono="camera-outline"
          cargando={abriendo === 'camara'}
          disabled={abriendo !== null}
          onPress={() => abrirCamara(0)}
        />
        <Boton
          texto="Elegir de la galería"
          variante="secundario"
          icono="images-outline"
          cargando={abriendo === 'galeria'}
          disabled={abriendo !== null}
          onPress={() => abrirGaleria(0)}
        />
      </View>
    );
  }

  return (
    <View className="gap-3">
      {fotos.map((foto, indice) => (
        <View key={foto.id} className="gap-3">
          {/* En Android, el recuadro con la foto no puede ser la misma vista que el recuadro vacío
              (borde punteado): si React la reusa, la foto no se dibuja. `key` por foto lo evita. */}
          <View
            className="w-full overflow-hidden rounded-lg bg-superficie-alt"
            style={{ aspectRatio: 4 / 3 }}>
            <Image
              source={{ uri: foto.uri }}
              contentFit="cover"
              style={StyleSheet.absoluteFill}
              accessible
              accessibilityRole="image"
              accessibilityLabel={
                fotos.length === 1 ? 'Foto del problema' : `Foto ${indice + 1} de ${fotos.length}`
              }
            />
          </View>
          <Boton
            texto={fotos.length === 1 ? 'Cambiar la foto' : `Cambiar la foto ${indice + 1}`}
            variante="secundario"
            icono="sync-outline"
            disabled={abriendo !== null}
            onPress={() => setLugarDeLaHoja(indice)}
          />
          {/* La primera sólo se quita si queda otra: sin foto no hay reporte. */}
          {fotos.length > 1 && (
            <Boton
              texto={`Quitar la foto ${indice + 1}`}
              variante="peligro"
              icono="trash-outline"
              disabled={abriendo !== null}
              onPress={() => quitarFotoDelReporte(foto.id)}
            />
          )}
        </View>
      ))}

      {avisos}

      {fotos.length < MAX_FOTOS_DEL_PROBLEMA && (
        <View className="gap-3">
          <Texto variante="secundario">
            Si ayuda, sumá otra foto: de más lejos, o desde otro lado.
          </Texto>
          <Boton
            texto="Agregar otra foto"
            variante="secundario"
            icono="add-outline"
            disabled={abriendo !== null}
            onPress={() => setLugarDeLaHoja(fotos.length)}
          />
        </View>
      )}

      <HojaInferior
        abierta={lugarDeLaHoja !== null}
        titulo={
          lugarDeLaHoja !== null && lugarDeLaHoja < fotos.length
            ? 'Cambiar la foto'
            : 'Agregar otra foto'
        }
        alCerrar={() => setLugarDeLaHoja(null)}>
        <Boton
          texto="Sacar una foto"
          icono="camera-outline"
          onPress={() => lugarDeLaHoja !== null && abrirCamara(lugarDeLaHoja)}
        />
        <Boton
          texto="Elegir de la galería"
          variante="secundario"
          icono="images-outline"
          onPress={() => lugarDeLaHoja !== null && abrirGaleria(lugarDeLaHoja)}
        />
        <Boton
          texto="Dejar como está"
          variante="secundario"
          icono="arrow-back-outline"
          onPress={() => setLugarDeLaHoja(null)}
        />
      </HojaInferior>
    </View>
  );
}
