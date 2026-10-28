import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Boton } from '@/componentes/ui/boton';
import { EstadoReporte } from '@/componentes/ui/estado-reporte';
import { Icono } from '@/componentes/ui/icono';
import { Texto } from '@/componentes/ui/texto';
import type { Reporte } from '@/tipos';

/** Después de enviar: el número de seguimiento bien visible (R1.6) y qué hacer ahora. */
export function ReporteEnviado({ reporte }: { reporte: Reporte }) {
  const margenes = useSafeAreaInsets();

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
            Recibimos tu reporte
          </Texto>
          <EstadoReporte estado="recibido" />
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
            Con este número lo seguís en «Mis reportes» o lo mostrás en el Centro de Atención al
            Vecino.
          </Texto>
        </View>

        <View className="gap-3">
          <Boton
            texto="Ver mi reporte"
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
