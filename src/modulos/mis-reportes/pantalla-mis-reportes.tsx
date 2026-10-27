import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Aviso } from '@/componentes/ui/aviso';
import { Boton } from '@/componentes/ui/boton';
import { estadoVisible, type EstadoVisible } from '@/componentes/ui/estado-reporte';
import { TarjetaReporte, TarjetaReporteCargando } from '@/componentes/ui/tarjeta-reporte';
import { Texto } from '@/componentes/ui/texto';

import { ESTADOS_DEL_HISTORIAL, FiltroEstados } from './filtro-estados';
import { useMisReportes } from './use-mis-reportes';

/**
 * Historial del vecino (R2.1): todos sus reportes, del más nuevo al más viejo, con filtro por estado.
 * La API no filtra `/yo/reportes` por estado: se filtra acá, sobre lo que ya llegó.
 */
export function PantallaMisReportes() {
  const { carga, reintentar, reportes, total, tipos, hayMas, verMas, cargandoMas, errorMas } =
    useMisReportes();
  const [elegidos, setElegidos] = useState<EstadoVisible[]>(ESTADOS_DEL_HISTORIAL);

  const listo = carga.tipo === 'listo';
  const visibles = reportes.filter((r) => elegidos.includes(estadoVisible(r)));
  const conReportes = listo && total > 0;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-fondo">
      <FlatList
        data={visibles}
        keyExtractor={(reporte) => reporte.id}
        renderItem={({ item }) => (
          <TarjetaReporte
            reporte={item}
            tipo={tipos.find((t) => t.id === item.tipoId) ?? null}
            onPress={() => router.push({ pathname: '/reporte/[id]', params: { id: item.id } })}
          />
        )}
        ItemSeparatorComponent={Separador}
        contentContainerClassName="w-full max-w-lg self-center px-6 pb-12 pt-12"
        ListHeaderComponent={
          <View className="gap-8 pb-3">
            <View className="gap-2">
              <Texto variante="titulo-pantalla" accessibilityRole="header">
                Mis reportes
              </Texto>
              <Texto variante="secundario">Del más nuevo al más viejo.</Texto>
            </View>
            {conReportes && (
              <View className="gap-3">
                <FiltroEstados elegidos={elegidos} alCambiar={setElegidos} />
                {visibles.length > 0 && (
                  <Texto variante="secundario" accessibilityLiveRegion="polite">
                    {describirConteo(visibles.length, total)}
                  </Texto>
                )}
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View className="gap-3">
            {carga.tipo === 'cargando' && (
              <>
                <TarjetaReporteCargando />
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
                <Texto variante="cuerpo-fuerte">Todavía no hiciste ningún reporte.</Texto>
                <Texto variante="secundario">
                  Cuando veas un problema en la calle, tocá Nuevo.
                </Texto>
              </View>
            )}
            {conReportes && (
              <View
                className="rounded-lg border border-borde bg-superficie p-4"
                accessibilityLiveRegion="polite">
                <Texto variante="cuerpo-fuerte">No hay reportes con ese estado.</Texto>
              </View>
            )}
          </View>
        }
        ListFooterComponent={
          hayMas ? (
            <View className="gap-3 pt-3">
              {errorMas && <Aviso tono="error" titulo={errorMas} />}
              <Boton
                texto="Ver más reportes"
                variante="secundario"
                icono="list-outline"
                cargando={cargandoMas}
                onPress={verMas}
              />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

function Separador() {
  return <View className="h-3" />;
}

/** «1 reporte», «4 reportes»; con algo filtrado o sin cargar, «2 de 4 reportes». */
function describirConteo(visibles: number, total: number) {
  if (visibles === total) return visibles === 1 ? '1 reporte' : `${total} reportes`;
  return `${visibles} de ${total} ${total === 1 ? 'reporte' : 'reportes'}`;
}
