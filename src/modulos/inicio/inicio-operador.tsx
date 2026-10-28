import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Aviso } from '@/componentes/ui/aviso';
import { Boton } from '@/componentes/ui/boton';
import { Encabezado } from '@/componentes/ui/encabezado';
import { TarjetaReporte, TarjetaReporteCargando } from '@/componentes/ui/tarjeta-reporte';
import { Texto } from '@/componentes/ui/texto';
import {
  ESTADOS_DE_LA_BANDEJA,
  filtrosIniciales,
  FiltrosBandeja,
  TODAS_LAS_ZONAS,
  type FiltrosDeLaBandeja,
} from '@/modulos/bandeja/filtros-bandeja';
import { useBandeja } from '@/modulos/bandeja/use-bandeja';
import type { Usuario } from '@/tipos';

import { useBarraDeEstadoClara } from './barra-de-estado';
import { FilaAcceso } from './fila-acceso';
import { ResumenEstados, ResumenEstadosCargando } from './resumen-estados';

/**
 * Inicio del operador = la bandeja (R4.1): los reportes abiertos, los más apoyados primero, con
 * filtros por estado, tipo y zona (la suya al abrir, P12). Abajo, el acceso a sus herramientas.
 */
export function InicioOperador({ usuario }: { usuario: Usuario }) {
  const margenes = useSafeAreaInsets();
  const [filtros, setFiltros] = useState(() => filtrosIniciales(usuario.zonaId));
  const {
    carga,
    reintentar,
    reportes,
    total,
    tipos,
    zonas,
    hayMas,
    verMas,
    cargandoMas,
    errorMas,
  } = useBandeja(filtros);
  useBarraDeEstadoClara();

  const listo = carga.tipo === 'listo';
  const zona = zonas?.find((z) => z.id === filtros.zonaId) ?? null;
  const sinFiltrar = esLaBandejaDeSiempre(filtros, usuario.zonaId);

  return (
    <FlatList
      className="flex-1 bg-fondo"
      data={reportes}
      keyExtractor={(reporte) => reporte.id}
      renderItem={({ item }) => (
        <Columna>
          <TarjetaReporte
            reporte={item}
            tipo={tipos?.find((t) => t.id === item.tipoId) ?? null}
            mostrarAdhesiones
            onPress={() => router.push({ pathname: '/reporte/[id]', params: { id: item.id } })}
          />
        </Columna>
      )}
      ItemSeparatorComponent={Separador}
      contentContainerClassName="pb-8"
      ListHeaderComponent={
        <View className="pb-3">
          <Encabezado tono="verde" margenSuperior={margenes.top}>
            <Texto variante="etiqueta" color="sobre-verde">
              Centro de Atención al Vecino
            </Texto>
            <Texto variante="titulo-pantalla" color="sobre-verde" accessibilityRole="header">
              Bandeja de reportes
            </Texto>
            <Texto color="sobre-verde">
              {filtros.zonaId === TODAS_LAS_ZONAS
                ? 'Toda la ciudad. '
                : zona
                  ? `${zona.nombre}. `
                  : ''}
              Los más apoyados por los vecinos van primero.
            </Texto>
          </Encabezado>

          <Columna className="gap-8 pt-8">
            <FiltrosBandeja filtros={filtros} alCambiar={setFiltros} tipos={tipos} zonas={zonas} />

            <View className="gap-3">
              <Texto variante="titulo-seccion" accessibilityRole="header">
                Abiertos
              </Texto>
              {carga.tipo === 'cargando' && (
                <>
                  <ResumenEstadosCargando filas={filtros.estados.length || 1} />
                  <TarjetaReporteCargando />
                  <TarjetaReporteCargando />
                </>
              )}
              {carga.tipo === 'error' && (
                <>
                  <Aviso tono="error" titulo={carga.mensaje} />
                  <Boton
                    texto="Probar de nuevo"
                    variante="secundario"
                    icono="refresh-outline"
                    onPress={reintentar}
                  />
                </>
              )}
              {listo && total === 0 && (
                <View className="gap-1 rounded-lg border border-borde bg-superficie p-4">
                  <Texto variante="cuerpo-fuerte">
                    {sinFiltrar
                      ? 'No hay reportes abiertos en tu zona.'
                      : 'No hay reportes abiertos con esos filtros.'}
                  </Texto>
                  <Texto variante="secundario">
                    {sinFiltrar
                      ? 'Cuando entre uno nuevo, aparece acá.'
                      : 'Probá con otro estado, tipo o zona.'}
                  </Texto>
                </View>
              )}
              {listo && total > 0 && (
                <>
                  <ResumenEstados
                    filas={ESTADOS_DE_LA_BANDEJA.filter((e) => filtros.estados.includes(e)).map(
                      (estado) => ({
                        estado,
                        cantidad: reportes.filter((r) => r.estado === estado).length,
                      }),
                    )}
                  />
                  <Texto variante="secundario" className="mt-3" accessibilityLiveRegion="polite">
                    {describirConteo(reportes.length, total)}
                  </Texto>
                </>
              )}
            </View>
          </Columna>
        </View>
      }
      ListFooterComponent={
        <Columna className="gap-8 pt-8">
          {hayMas && (
            <View className="gap-3">
              {errorMas && <Aviso tono="error" titulo={errorMas} />}
              <Boton
                texto="Ver más reportes"
                variante="secundario"
                icono="list-outline"
                cargando={cargandoMas}
                onPress={verMas}
              />
            </View>
          )}
          <View className="gap-3">
            <Texto variante="titulo-seccion" accessibilityRole="header">
              Herramientas
            </Texto>
            <FilaAcceso
              icono="qr-code-outline"
              titulo="Escanear un QR"
              detalle="Abrí el reporte que muestra un vecino en el mostrador."
              alTocar={() => router.navigate('/escanear')}
            />
            <FilaAcceso
              icono="people-outline"
              titulo="Ver las cuadrillas"
              detalle="Qué cuadrillas hay en cada zona."
              alTocar={() => router.navigate('/cuadrillas')}
            />
            <FilaAcceso
              icono="map-outline"
              titulo="Ver el mapa de la ciudad"
              detalle="Todos los reportes, por estado y tipo."
              alTocar={() => router.navigate('/mapa')}
            />
          </View>
        </Columna>
      }
    />
  );
}

/** El ancho de lectura de la pantalla: margen lateral y tope en pantallas grandes. */
function Columna({ children, className }: { children: ReactNode; className?: string }) {
  return <View className={`w-full max-w-lg self-center px-6 ${className ?? ''}`}>{children}</View>;
}

function Separador() {
  return <View className="h-3" />;
}

/** Sin tocar los filtros: todos los estados abiertos, todos los tipos y la zona del operador. */
function esLaBandejaDeSiempre(filtros: FiltrosDeLaBandeja, zonaDelOperador: string | null) {
  return (
    filtros.estados.length === ESTADOS_DE_LA_BANDEJA.length &&
    filtros.tipoId === null &&
    filtros.zonaId === (zonaDelOperador ?? TODAS_LAS_ZONAS)
  );
}

/** «1 reporte», «4 reportes»; si faltan páginas, «100 de 140 reportes». */
function describirConteo(cargados: number, total: number) {
  if (cargados >= total) return total === 1 ? '1 reporte' : `${total} reportes`;
  return `${cargados} de ${total} reportes`;
}
