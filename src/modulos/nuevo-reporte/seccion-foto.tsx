import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Aviso } from '@/componentes/ui/aviso';
import { Boton } from '@/componentes/ui/boton';
import { Icono } from '@/componentes/ui/icono';
import { Texto } from '@/componentes/ui/texto';
import {
  elegirFotoDeLaGaleria,
  pedirPermisoDeCamara,
  type ResultadoPermiso,
} from '@/servicios/fotos';

import { AvisoSinCamara } from './aviso-sin-camara';
import { ponerFotoDelReporte, type FotoDelReporte } from './foto-del-reporte';

type Props = {
  foto: FotoDelReporte | null;
};

type Problema = Exclude<ResultadoPermiso, { estado: 'ok' }>;

/**
 * La foto del problema (R1.2): obligatoria, de la cámara («Sacar la foto», con `CameraView`) o de
 * la galería (P1). Las dos piden antes el permiso de cámara (NF3).
 */
export function SeccionFoto({ foto }: Props) {
  const [abriendo, setAbriendo] = useState<'camara' | 'galeria' | null>(null);
  const [problema, setProblema] = useState<Problema | null>(null);

  async function abrirCamara() {
    setAbriendo('camara');
    setProblema(null);
    const permiso = await pedirPermisoDeCamara();
    setAbriendo(null);
    if (permiso.estado === 'ok') router.push('/sacar-foto');
    else setProblema(permiso);
  }

  async function abrirGaleria() {
    setAbriendo('galeria');
    setProblema(null);
    const resultado = await elegirFotoDeLaGaleria();
    setAbriendo(null);
    if (resultado.estado === 'ok') ponerFotoDelReporte(resultado.foto);
    else if (resultado.estado !== 'cancelado') setProblema(resultado);
  }

  return (
    <View className="gap-3">
      {/* `key` distinto en los dos recuadros: en Android, si React reusa la vista del recuadro
          vacío (borde punteado) para el de la foto, la foto no se dibuja. */}
      {foto ? (
        <View
          key="con-foto"
          className="w-full overflow-hidden rounded-lg bg-superficie-alt"
          style={{ aspectRatio: 4 / 3 }}>
          <Image
            source={{ uri: foto.uri }}
            contentFit="cover"
            style={StyleSheet.absoluteFill}
            accessible
            accessibilityRole="image"
            accessibilityLabel="Foto del problema"
          />
        </View>
      ) : (
        <View
          key="sin-foto"
          className="w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-borde-control bg-superficie"
          style={{ aspectRatio: 4 / 3 }}>
          <Icono nombre="camera-outline" tamano={40} className="text-texto-secundario" />
          <Texto variante="secundario">Todavía no hay foto</Texto>
        </View>
      )}

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

      <Boton
        texto={foto ? 'Sacar otra foto' : 'Sacar una foto'}
        variante="secundario"
        icono="camera-outline"
        cargando={abriendo === 'camara'}
        disabled={abriendo !== null}
        onPress={abrirCamara}
      />
      <Boton
        texto={foto ? 'Elegir otra de la galería' : 'Elegir de la galería'}
        variante="secundario"
        icono="images-outline"
        cargando={abriendo === 'galeria'}
        disabled={abriendo !== null}
        onPress={abrirGaleria}
      />
    </View>
  );
}
