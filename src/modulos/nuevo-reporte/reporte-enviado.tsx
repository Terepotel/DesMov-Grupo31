import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Boton } from '@/componentes/ui/boton';
import { EstadoReporte } from '@/componentes/ui/estado-reporte';
import { Icono } from '@/componentes/ui/icono';
import { Texto } from '@/componentes/ui/texto';
import type { Reporte } from '@/tipos';

type Props = {
  reporte: Reporte;
  /** Si el vecino se sumó a uno que ya existía en vez de crear otro (R3.5). */
  sumado?: { yaEstaba: boolean };
};

/**
 * Después de enviar: el número de seguimiento bien visible (R1.6) y qué hacer ahora. Si se sumó a
 * uno que ya existía, el número es el de ese reporte.
 */
export function ReporteEnviado({ reporte, sumado }: Props) {
  const margenes = useSafeAreaInsets();
  const titulo = !sumado
    ? 'Recibimos tu reporte'
    : sumado.yaEstaba
      ? 'Ya estabas sumado a este reporte'
      : 'Te sumaste al reporte';

  return (
    <ScrollView
      className="flex-1 bg-fondo"
      contentContainerStyle={{
        paddingTop: margenes.top + 48,
        paddingBottom: margenes.bottom + 48,
      }}>
      <View className="w-full max-w-lg gap-8 self-center px-6">
        <View className="items-start gap-4">
          <Icono nombre="checkmark-circle" tamano={64} className="text-estado-resuelto" />
          <Texto variante="titulo-pantalla" accessibilityRole="header">
            {titulo}
          </Texto>
          <EstadoReporte estado={sumado ? reporte.estado : 'recibido'} />
          {sumado && (
            <Texto>
              No mandamos uno nuevo: el reporte sigue con su foto y su descripción. Cuanta más gente
              se suma, más arriba queda en la lista de Obras.
            </Texto>
          )}
        </View>

        <View className="gap-2 rounded-lg border-2 border-borde bg-superficie p-4">
          <Texto variante="etiqueta" accessibilityElementsHidden importantForAccessibility="no">
            Número de seguimiento
          </Texto>
          <Texto
            variante="codigo"
            selectable
            accessibilityLabel={`Número de seguimiento ${reporte.codigo}`}>
            {reporte.codigo}
          </Texto>
          <Texto variante="secundario">
            {sumado
              ? 'No aparece en «Mis reportes» porque no es tuyo. Guardá el número para buscarlo o mostrarlo en el Centro de Atención al Vecino.'
              : 'Con este número lo seguís en «Mis reportes» o lo mostrás en el Centro de Atención al Vecino.'}
          </Texto>
        </View>

        <View className="gap-3">
          <Boton
            texto={sumado ? 'Ver el reporte' : 'Ver mi reporte'}
            icono="document-text-outline"
            onPress={() =>
              router.replace({ pathname: '/reporte/[id]', params: { id: reporte.id } })
            }
          />
          <Boton
            texto="Volver al inicio"
            variante="secundario"
            icono="home-outline"
            onPress={() => router.back()}
          />
        </View>
      </View>
    </ScrollView>
  );
}
