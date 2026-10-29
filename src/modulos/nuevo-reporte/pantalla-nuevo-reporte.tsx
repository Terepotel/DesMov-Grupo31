import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Aviso } from '@/componentes/ui/aviso';
import { Boton } from '@/componentes/ui/boton';
import { CampoTexto } from '@/componentes/ui/campo-texto';
import { FichaTipo, FichaTipoCargando } from '@/componentes/ui/ficha-tipo';
import { Icono } from '@/componentes/ui/icono';
import { Texto } from '@/componentes/ui/texto';
import { useSesion } from '@/modulos/autenticacion/contexto';
import { mensajeDeError } from '@/servicios/api';
import { obtenerTiposDeReporte } from '@/servicios/catalogos';
import { borrarNotaDeVoz, type NotaGrabada } from '@/servicios/notas-de-voz';
import { crearReporte } from '@/servicios/reportes';
import { direccionDesdeCoordenadas } from '@/servicios/ubicacion';
import type { Coordenadas, Reporte, TipoDeReporte } from '@/tipos';
import { ahoraIso } from '@/utilidades/fechas';
import { nuevoId } from '@/utilidades/reportes';
import { useCarga } from '@/utilidades/use-carga';

import { limpiarFotosDelReporte, useFotosDelReporte } from './fotos-del-reporte';
import { HojaDuplicados } from './hoja-duplicados';
import { ReporteEnviado } from './reporte-enviado';
import { revisarUbicacion } from './revisar-ubicacion';
import { SeccionFoto } from './seccion-foto';
import { SeccionNotaDeVoz } from './seccion-nota-de-voz';
import { SeccionUbicacion } from './seccion-ubicacion';
import {
  limpiarUbicacionDelReporte,
  tomarUbicacionDelGps,
  useUbicacionDelReporte,
  type UbicacionDelReporte,
} from './ubicacion-del-reporte';
import { useCercanos, type Cercanos } from './use-cercanos';
import {
  CAMPOS,
  MAX_DESCRIPCION,
  resumirErrores,
  validarReporte,
  type CampoDelReporte,
  type ErroresDelReporte,
} from './validar';

const cargarTipos = async () => (await obtenerTiposDeReporte()).datos;

/**
 * Nuevo reporte (R1): todo en una pantalla, para que lleve menos de un minuto (NF2). Tipo, foto,
 * ubicación y descripción son obligatorios; al enviar se muestra el número de seguimiento (R1.6).
 */
export function PantallaNuevoReporte() {
  const margenes = useSafeAreaInsets();
  const ubicacion = useUbicacionDelReporte();
  const fotos = useFotosDelReporte();
  const { carga: tipos, reintentar: reintentarTipos } = useCarga(cargarTipos);

  // El mismo id en cada reintento: si el primer envío llegó pero se cortó la respuesta, la API
  // devuelve el que ya tiene en vez de crear otro.
  const [id] = useState(() => nuevoId('rep'));
  const [tipoId, setTipoId] = useState<string | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [nota, setNota] = useState<NotaGrabada | null>(null);
  const [grabando, setGrabando] = useState(false);
  const [mostrarErrores, setMostrarErrores] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorDeEnvio, setErrorDeEnvio] = useState<string | null>(null);
  const [enviado, setEnviado] = useState<Reporte | null>(null);
  const [sumado, setSumado] = useState<{ reporte: Reporte; yaEstaba: boolean } | null>(null);
  const { usuario } = useSesion();
  const cercanos = useCercanos(ubicacion.coordenadas, tipoId);
  // Lo que muestra la hoja: se cierra sin borrarlo, así la animación de salida tiene qué mostrar.
  const [enLaHoja, setEnLaHoja] = useState<Cercanos | null>(null);
  const [hojaAbierta, setHojaAbierta] = useState(false);
  const [vecesHoja, setVecesHoja] = useState(0);
  // Los que ya se le mostraron: si dijo que es otro problema, no se le vuelve a abrir la hoja por
  // los mismos (por ejemplo, al elegir el tipo después del lugar).
  const yaMostrados = useRef(new Set<string>());
  // Fue a mirar el detalle de uno: al volver, la hoja sigue donde estaba.
  const volverALaHoja = useRef(false);
  const [lugarRevisado, setLugarRevisado] = useState<{
    para: UbicacionDelReporte;
    error: string;
  } | null>(null);

  const scroll = useRef<ScrollView>(null);
  const posiciones = useRef<Partial<Record<CampoDelReporte, number>>>({});

  // R1.4: la ubicación sale sola del GPS apenas se abre el formulario.
  useEffect(() => {
    limpiarUbicacionDelReporte();
    limpiarFotosDelReporte();
    void tomarUbicacionDelGps();
  }, []);

  // R1.8 y R3.4: apenas hay un punto con reportes cerca, vibra y pregunta si es el mismo.
  useEffect(() => {
    if (!cercanos) return;
    const nuevos = cercanos.reportes.filter((r) => !yaMostrados.current.has(r.id));
    if (nuevos.length === 0) return;
    for (const reporte of cercanos.reportes) yaMostrados.current.add(reporte.id);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    setEnLaHoja(cercanos);
    setVecesHoja((n) => n + 1);
    setHojaAbierta(true);
  }, [cercanos]);

  useFocusEffect(
    useCallback(() => {
      if (!volverALaHoja.current) return;
      volverALaHoja.current = false;
      setHojaAbierta(true);
    }, []),
  );

  const faltantes = validarReporte({
    tipoId,
    fotos,
    coordenadas: ubicacion.coordenadas,
    direccionEscrita: ubicacion.direccionEscrita ?? '',
    descripcion,
    conNotaDeVoz: nota !== null,
    grabando,
  });
  // El error de la revisión vale mientras la ubicación siga igual: al tocarla, se va.
  const errorDelLugar = lugarRevisado?.para === ubicacion ? lugarRevisado.error : null;
  const errores = errorDelLugar ? { ...faltantes, ubicacion: errorDelLugar } : faltantes;
  const visibles = mostrarErrores ? errores : {};
  const resumen = mostrarErrores ? resumirErrores(errores) : null;

  function llevarAlPrimerError(todos: ErroresDelReporte) {
    const primero = CAMPOS.find((campo) => todos[campo]);
    if (!primero) return false;
    // `onLayout` da la posición dentro del contenedor, que empieza después del margen de arriba.
    const y = (posiciones.current[primero] ?? 0) + margenes.top + 8 - 16;
    scroll.current?.scrollTo({ y: Math.max(0, y) });
    const texto = resumirErrores(todos);
    if (texto) AccessibilityInfo.announceForAccessibility(texto);
    return true;
  }

  async function enviar() {
    setMostrarErrores(true);
    setErrorDeEnvio(null);
    const escrita = (ubicacion.direccionEscrita ?? '').trim();

    setEnviando(true);
    try {
      // Además de lo que falta, si la calle existe y el lugar queda en la ciudad: todo en un solo
      // aviso. Sin punto, la API igual pide coordenadas: salen de la calle escrita (P3).
      const lugar = await revisarUbicacion(ubicacion.coordenadas, escrita);
      setLugarRevisado(lugar.error ? { para: ubicacion, error: lugar.error } : null);
      if (llevarAlPrimerError(lugar.error ? { ...faltantes, ubicacion: lugar.error } : faltantes)) {
        return;
      }
      // Ya validado: ni el tipo ni el punto son `null`.
      const coordenadas = lugar.coordenadas as Coordenadas;
      const reporte = await crearReporte({
        id,
        tipoId: tipoId as string,
        descripcion: descripcion.trim() || null,
        fotos,
        audio: nota,
        coordenadas,
        direccion: escrita || (await direccionParaEnviar(ubicacion.direccion, coordenadas)),
        creadoEn: ahoraIso(),
      });
      // R1.9: la confirmación es táctil antes que visual.
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      limpiar();
      setEnviado(reporte);
    } catch (error) {
      setErrorDeEnvio(mensajeDeError(error));
    } finally {
      setEnviando(false);
    }
  }

  function borrarNota() {
    if (nota) borrarNotaDeVoz(nota);
    setNota(null);
  }

  function limpiar() {
    limpiarUbicacionDelReporte();
    limpiarFotosDelReporte();
    borrarNota();
  }

  function descartar() {
    limpiar();
    router.back();
  }

  function verCercanos(lista: Cercanos) {
    setEnLaHoja(lista);
    setVecesHoja((n) => n + 1);
    setHojaAbierta(true);
  }

  function verDetalle(reporte: Reporte) {
    // Misma `key`: al volver, la hoja conserva el que estaba elegido.
    volverALaHoja.current = true;
    setHojaAbierta(false);
    router.push({ pathname: '/reporte/[id]', params: { id: reporte.id } });
  }

  function alSumarse(reporte: Reporte, yaEstaba: boolean) {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    // El reporte nuevo no se manda: la foto y la nota ya no hacen falta.
    limpiar();
    setHojaAbierta(false);
    setSumado({ reporte, yaEstaba });
  }

  if (enviado) return <ReporteEnviado reporte={enviado} />;
  if (sumado) return <ReporteEnviado reporte={sumado.reporte} sumado={sumado} />;

  return (
    <ScrollView
      ref={scroll}
      className="flex-1 bg-fondo"
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      contentContainerStyle={{ paddingTop: margenes.top + 8, paddingBottom: margenes.bottom + 48 }}>
      <View className="w-full max-w-lg gap-8 self-center px-6">
        <View className="items-start gap-2">
          <Pressable
            onPress={descartar}
            className="-ml-2 min-h-toque flex-row items-center gap-2 px-2 active:opacity-70"
            accessibilityRole="button"
            accessibilityLabel="Volver sin enviar">
            <Icono nombre="arrow-back-outline" className="text-primario" />
            <Texto variante="cuerpo-fuerte" color="primario">
              Volver
            </Texto>
          </Pressable>
          <Texto variante="titulo-pantalla" accessibilityRole="header">
            Nuevo reporte
          </Texto>
        </View>

        <Seccion
          titulo="¿Qué pasa?"
          error={visibles.tipo}
          alUbicar={(y) => (posiciones.current.tipo = y)}>
          {tipos.tipo === 'error' ? (
            <View className="gap-3">
              <Aviso tono="error" titulo={tipos.mensaje} />
              <Boton
                texto="Probar de nuevo"
                variante="secundario"
                icono="refresh-outline"
                onPress={reintentarTipos}
              />
            </View>
          ) : (
            <GrillaDeTipos
              tipos={tipos.tipo === 'listo' ? tipos.datos : null}
              elegido={tipoId}
              alElegir={setTipoId}
            />
          )}
        </Seccion>

        <Seccion
          titulo="Foto"
          error={visibles.foto}
          alUbicar={(y) => (posiciones.current.foto = y)}>
          <SeccionFoto fotos={fotos} />
        </Seccion>

        <Seccion
          titulo="¿Dónde?"
          error={visibles.ubicacion}
          alUbicar={(y) => (posiciones.current.ubicacion = y)}>
          <SeccionUbicacion ubicacion={ubicacion} />
          {cercanos && cercanos.reportes.length > 0 && (
            <View className="gap-3">
              <Aviso
                tono="atencion"
                icono="git-merge-outline"
                titulo={
                  cercanos.reportes.length === 1
                    ? 'Hay un reporte abierto muy cerca.'
                    : `Hay ${cercanos.reportes.length} reportes abiertos muy cerca.`
                }
                detalle="Si es el mismo problema, sumate en vez de hacer otro."
              />
              <Boton
                texto="Ver los reportes cercanos"
                variante="secundario"
                icono="list-outline"
                onPress={() => verCercanos(cercanos)}
              />
            </View>
          )}
        </Seccion>

        <Seccion
          titulo="Contanos qué pasa"
          error={visibles.descripcion}
          alUbicar={(y) => (posiciones.current.descripcion = y)}>
          <CampoTexto
            etiqueta="Descripción"
            placeholder="Por ejemplo: pozo grande, cuando llueve se llena de agua."
            value={descripcion}
            onChangeText={setDescripcion}
            multiline
            maxLength={MAX_DESCRIPCION}
            textAlignVertical="top"
            className="min-h-[128px] py-3"
          />
          <SeccionNotaDeVoz
            nota={nota}
            alGrabar={setNota}
            alCambiarGrabando={setGrabando}
            alBorrar={borrarNota}
          />
        </Seccion>

        <View className="gap-3">
          {resumen && <Aviso tono="error" titulo="Todavía no se puede enviar." detalle={resumen} />}
          {errorDeEnvio && <Aviso tono="error" titulo={errorDeEnvio} />}
          <Boton
            texto={errorDeEnvio ? 'Probar de nuevo' : 'Enviar reporte'}
            icono={errorDeEnvio ? 'refresh-outline' : 'send-outline'}
            cargando={enviando}
            onPress={enviar}
          />
        </View>
      </View>

      {enLaHoja && (
        <HojaDuplicados
          key={`cercanos-${vecesHoja}`}
          abierta={hojaAbierta}
          cercanos={enLaHoja.reportes}
          tipos={tipos.tipo === 'listo' ? tipos.datos : null}
          mismoTipo={tipoId !== null}
          desde={enLaHoja.desde}
          usuarioId={usuario?.id ?? ''}
          alCerrar={() => setHojaAbierta(false)}
          alSumarse={alSumarse}
          alVerDetalle={verDetalle}
        />
      )}
    </ScrollView>
  );
}

/**
 * La API pide la calle (`direccion`). Si al abrir el formulario no se pudo calcular, se prueba otra
 * vez; si sigue sin salir, van las coordenadas para que el reporte no quede sin lugar.
 */
async function direccionParaEnviar(direccion: string | null, coordenadas: Coordenadas) {
  if (direccion) return direccion;
  const calculada = await direccionDesdeCoordenadas(coordenadas);
  return (
    calculada ?? `Cerca de ${coordenadas.latitud.toFixed(5)}, ${coordenadas.longitud.toFixed(5)}`
  );
}

function Seccion({
  titulo,
  error,
  alUbicar,
  children,
}: {
  titulo: string;
  error?: string;
  /** Dónde quedó la sección en el scroll, para llevar al vecino al primer error. */
  alUbicar: (y: number) => void;
  children: ReactNode;
}) {
  return (
    <View className="gap-3" onLayout={(evento) => alUbicar(evento.nativeEvent.layout.y)}>
      <Texto variante="titulo-seccion" accessibilityRole="header">
        {titulo}
      </Texto>
      {error && (
        <View className="flex-row items-start gap-2">
          <Icono nombre="alert-circle-outline" className="text-peligro" />
          <Texto color="peligro" className="flex-1">
            {error}
          </Texto>
        </View>
      )}
      {children}
    </View>
  );
}

/** Los ocho tipos en dos columnas (FichaTipo). Mientras llegan, fichas vacías del mismo tamaño. */
function GrillaDeTipos({
  tipos,
  elegido,
  alElegir,
}: {
  tipos: TipoDeReporte[] | null;
  elegido: string | null;
  alElegir: (id: string) => void;
}) {
  const filas: (TipoDeReporte | null)[][] = [];
  const lista = tipos ?? Array<null>(8).fill(null);
  for (let i = 0; i < lista.length; i += 2) filas.push(lista.slice(i, i + 2));

  return (
    <View className="gap-3">
      {filas.map((fila, indice) => (
        <View key={indice} className="flex-row gap-3">
          {fila.map((tipo, columna) =>
            tipo ? (
              <FichaTipo
                key={tipo.id}
                tipo={tipo}
                elegida={tipo.id === elegido}
                alElegir={() => alElegir(tipo.id)}
              />
            ) : (
              <FichaTipoCargando key={columna} />
            ),
          )}
          {/* Con un número impar de tipos, la última ficha no se estira a todo el ancho. */}
          {fila.length === 1 && <View className="flex-1" />}
        </View>
      ))}
    </View>
  );
}
