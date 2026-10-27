import { router } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Aviso } from '@/componentes/ui/aviso';
import { Boton } from '@/componentes/ui/boton';
import { DiscoTipo } from '@/componentes/ui/disco-tipo';
import { EstadoReporte, estadoVisible } from '@/componentes/ui/estado-reporte';
import { Icono } from '@/componentes/ui/icono';
import {
  LineaDeTiempo,
  LineaDeTiempoCargando,
  type PasoLineaDeTiempo,
} from '@/componentes/ui/linea-de-tiempo';
import { Texto } from '@/componentes/ui/texto';
import { useSesion } from '@/modulos/autenticacion/contexto';
import type { CambioDeEstado, Reporte, Usuario } from '@/tipos';
import { formatearFecha } from '@/utilidades/fechas';
import { textoAdhesiones } from '@/utilidades/reportes';
import { useCarga } from '@/utilidades/use-carga';

import {
  cargarDetalle,
  type CargaCambios,
  type DetalleReporte,
  type ParametroDeRuta,
} from './cargar-detalle';
import { DetalleCargando } from './detalle-cargando';
import { FotosDelReporte } from './fotos-del-reporte';
import { HojaQr } from './hoja-qr';
import { useCambios, useSumarse, type ResultadoSumarse } from './use-detalle';

type Props = {
  /** El de la ruta: un id (`rep-…`) o un número de seguimiento (`GCHU-…`, el enlace del QR). */
  id: ParametroDeRuta;
  /** Al pie, debajo de las acciones del vecino: acá van las de gestión del operador (R4.2–R4.5). */
  acciones?: ReactNode;
};

/** El detalle de un reporte (R2.2–R2.6): igual para los dos roles, salvo los datos de gestión. */
export function PantallaDetalleReporte({ id, acciones }: Props) {
  const margenes = useSafeAreaInsets();
  const { usuario } = useSesion();
  const esOperador = usuario?.rol === 'operador';
  const cargar = useCallback(() => cargarDetalle(id, esOperador), [id, esOperador]);
  const { carga, reintentar } = useCarga(cargar);

  return (
    <ScrollView
      className="flex-1 bg-fondo"
      contentContainerStyle={{ paddingTop: margenes.top + 8, paddingBottom: margenes.bottom + 48 }}>
      <View className="w-full max-w-lg gap-8 self-center px-6">
        <View className="items-start gap-2">
          <Pressable
            onPress={volver}
            className="-ml-2 min-h-toque flex-row items-center gap-2 px-2 active:opacity-70"
            accessibilityRole="button"
            accessibilityLabel="Volver">
            <Icono nombre="arrow-back-outline" className="text-primario" />
            <Texto variante="cuerpo-fuerte" color="primario">
              Volver
            </Texto>
          </Pressable>
          <Texto variante="titulo-pantalla" accessibilityRole="header">
            Reporte
          </Texto>
        </View>

        {carga.tipo === 'cargando' && <DetalleCargando />}
        {carga.tipo === 'error' && (
          <View className="gap-3">
            <Aviso tono="error" titulo={carga.mensaje} />
            <Boton
              texto="Probar de nuevo"
              variante="secundario"
              icono="refresh-outline"
              onPress={reintentar}
            />
          </View>
        )}
        {carga.tipo === 'listo' && usuario && (
          <Detalle datos={carga.datos} usuario={usuario} acciones={acciones} />
        )}
      </View>
    </ScrollView>
  );
}

// Abierto desde el enlace del QR puede no haber nada atrás: se va al inicio.
function volver() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

function Detalle({
  datos,
  usuario,
  acciones,
}: {
  datos: DetalleReporte;
  usuario: Usuario;
  acciones?: ReactNode;
}) {
  const { tipo, zona, cuadrillas } = datos;
  const { reporte, resultado, terminado, sumarme } = useSumarse(datos.reporte);
  const cambios = useCambios(datos);
  const [qrAbierto, setQrAbierto] = useState(false);

  const fotosProblema = reporte.fotos.filter((f) => f.momento === 'problema');
  const fotosArreglo = reporte.fotos.filter((f) => f.momento === 'arreglo');
  const cerrado = reporte.estado === 'resuelto' || reporte.estado === 'rechazado';
  // §8.2: «Sumarme» no se ofrece donde la API lo rechazaría. Se compara el autor sin mostrarlo (NF6).
  // Tampoco después de sumarse, ni si la API respondió que no se puede.
  const puedeSumarse =
    usuario.rol === 'vecino' &&
    reporte.sincronizado &&
    !cerrado &&
    reporte.autorId !== usuario.id &&
    !terminado;
  const original = reporte.duplicadoDe;
  const conQr = reporte.sincronizado && reporte.codigo !== '';

  return (
    <>
      <View className="gap-4">
        {reporte.sincronizado ? (
          <View className="gap-1">
            <Texto variante="etiqueta" accessibilityElementsHidden importantForAccessibility="no">
              Número de seguimiento
            </Texto>
            <Texto variante="codigo" accessibilityLabel={`Número de seguimiento ${reporte.codigo}`}>
              {reporte.codigo}
            </Texto>
          </View>
        ) : (
          // P2: sin enviar no hay número; el id local no se muestra.
          <Aviso
            tono="atencion"
            titulo="Todavía no se envió."
            detalle="Se va a subir solo cuando vuelva la conexión. Ahí te damos el número de seguimiento."
          />
        )}

        <View className="gap-1">
          <View className="flex-row items-center gap-4">
            <DiscoTipo tipo={tipo} tamano={48} />
            <Texto variante="titulo-seccion" className="flex-1" accessibilityRole="header">
              {tipo?.nombre ?? 'Reporte'}
            </Texto>
          </View>
          <Texto variante="secundario" className="mt-2">
            {[reporte.direccion, zona?.nombre].filter(Boolean).join(' · ')}
          </Texto>
          <Texto variante="secundario">Reportado el {formatearFecha(reporte.creadoEn)}</Texto>
        </View>

        <View className="gap-2">
          <EstadoReporte estado={estadoVisible(reporte)} />
          {reporte.sincronizado && <Texto>{textoAdhesiones(reporte.adhesiones)}</Texto>}
        </View>
      </View>

      {fotosProblema.length > 0 && (
        <FotosDelReporte fotos={fotosProblema} tipo={tipo} rotulo="Foto del problema" />
      )}

      <Descripcion reporte={reporte} />

      {reporte.estado === 'rechazado' && (
        <View className="gap-3">
          <Texto variante="titulo-seccion" accessibilityRole="header">
            Por qué se rechazó
          </Texto>
          <MotivoDeRechazo cambios={cambios.carga} />
          {original && (
            <Boton
              texto="Ver el reporte original"
              variante="secundario"
              icono="git-merge-outline"
              onPress={() => router.push({ pathname: '/reporte/[id]', params: { id: original } })}
            />
          )}
        </View>
      )}

      {(fotosArreglo.length > 0 || reporte.estado === 'resuelto') && (
        <View className="gap-3">
          <Texto variante="titulo-seccion" accessibilityRole="header">
            Trabajo realizado
          </Texto>
          {fotosArreglo.length > 0 ? (
            <FotosDelReporte fotos={fotosArreglo} tipo={tipo} rotulo="Foto del arreglo" />
          ) : (
            <Texto variante="secundario">La cuadrilla no subió foto del arreglo.</Texto>
          )}
        </View>
      )}

      {usuario.rol === 'operador' && (
        <View className="gap-2 rounded-lg border border-borde bg-superficie p-4">
          <Dato rotulo="Zona" valor={zona?.nombre ?? 'sin datos'} />
          <Dato rotulo="Cuadrilla" valor={nombreDeCuadrilla(reporte, cuadrillas)} />
          {tipo && <Dato rotulo="Área responsable" valor={tipo.areaResponsable} />}
        </View>
      )}

      {/* Son los cambios de estado de la API: uno sin enviar no tiene (el aviso ya lo dice). */}
      {reporte.sincronizado && (
        <View className="gap-3">
          <Texto variante="titulo-seccion" accessibilityRole="header">
            Qué fue pasando
          </Texto>
          <QueFuePasando cambios={cambios.carga} reintentar={cambios.reintentar} />
        </View>
      )}

      {(conQr || puedeSumarse || resultado.tipo !== 'nada' || acciones) && (
        <View className="gap-3">
          <ResultadoDeSumarse resultado={resultado} />
          {puedeSumarse && (
            <Boton
              texto="Sumarme a este reporte"
              icono="add-circle-outline"
              cargando={resultado.tipo === 'enviando'}
              onPress={sumarme}
            />
          )}
          {conQr && (
            <Boton
              texto="Mostrar el QR"
              variante="secundario"
              icono="qr-code-outline"
              onPress={() => setQrAbierto(true)}
            />
          )}
          {/* Las acciones de gestión del operador (R4.2–R4.5) entran por `acciones`. */}
          {acciones}
        </View>
      )}

      {conQr && (
        <HojaQr abierta={qrAbierto} codigo={reporte.codigo} alCerrar={() => setQrAbierto(false)} />
      )}
    </>
  );
}

/** Texto y audio pueden ir juntos (P15). El audio todavía no se reproduce: llega con `expo-audio`. */
function Descripcion({ reporte }: { reporte: Reporte }) {
  if (!reporte.descripcion && !reporte.audioUrl) {
    return <Texto variante="secundario">Sin descripción.</Texto>;
  }
  return (
    <View className="gap-3">
      {reporte.descripcion && <Texto>{reporte.descripcion}</Texto>}
      {reporte.audioUrl && (
        <View className="flex-row items-center gap-3">
          <Icono nombre="mic-outline" className="text-texto" />
          <Texto className="flex-1">Este reporte tiene una nota de voz.</Texto>
        </View>
      )}
    </View>
  );
}

/** R2.5: el comentario del último rechazo, completo. */
function MotivoDeRechazo({ cambios }: { cambios: CargaCambios }) {
  if (cambios.tipo === 'cargando') {
    return <View className="h-24 rounded-md bg-superficie-alt" />;
  }
  if (cambios.tipo === 'error') {
    return (
      <Texto variante="secundario">No pudimos cargar el motivo. Probá de nuevo más abajo.</Texto>
    );
  }
  const rechazo = cambios.datos.findLast((c) => c.estado === 'rechazado');
  return (
    <View className="rounded-md bg-peligro-fondo p-4">
      <Texto color="peligro">
        {rechazo?.comentario ?? 'El operador no dejó escrito el motivo.'}
      </Texto>
    </View>
  );
}

function QueFuePasando({ cambios, reintentar }: { cambios: CargaCambios; reintentar: () => void }) {
  if (cambios.tipo === 'cargando') return <LineaDeTiempoCargando />;
  if (cambios.tipo === 'error') {
    return (
      <>
        <Aviso tono="error" titulo={cambios.mensaje} />
        <Boton
          texto="Probar de nuevo"
          variante="secundario"
          icono="refresh-outline"
          onPress={reintentar}
        />
      </>
    );
  }
  return <LineaDeTiempo pasos={pasosDe(cambios.datos)} />;
}

// La API los da del más viejo al más nuevo; se muestran al revés.
function pasosDe(cambios: CambioDeEstado[]): PasoLineaDeTiempo[] {
  return [...cambios].reverse().map((cambio) => ({
    clave: cambio.id,
    estado: cambio.estado,
    fechaHora: cambio.fechaHora,
    comentario: cambio.comentario,
  }));
}

function ResultadoDeSumarse({ resultado }: { resultado: ResultadoSumarse }) {
  if (resultado.tipo === 'error') return <Aviso tono="error" titulo={resultado.mensaje} />;
  if (resultado.tipo !== 'sumado') return null;
  return (
    <Aviso
      tono="exito"
      titulo={
        resultado.yaEstaba ? 'Ya estabas sumado a este reporte.' : 'Te sumaste a este reporte.'
      }
      detalle="Cuanta más gente se suma, más arriba queda en la lista de Obras."
    />
  );
}

function Dato({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <Texto>
      <Texto variante="cuerpo-fuerte">{rotulo}:</Texto> {valor}
    </Texto>
  );
}

// «Cuadrilla 2 — Bacheo · pavimento» (P13). Nunca el id.
function nombreDeCuadrilla(reporte: Reporte, cuadrillas: DetalleReporte['cuadrillas']): string {
  if (!reporte.cuadrillaId) return 'sin asignar';
  const cuadrilla = cuadrillas?.find((c) => c.id === reporte.cuadrillaId);
  return cuadrilla ? `${cuadrilla.nombre} · ${cuadrilla.especialidad}` : 'asignada';
}
