import { View } from 'react-native';

import { LineaDeTiempoCargando } from '@/componentes/ui/linea-de-tiempo';

/** El detalle vacío, con el mismo orden y alto de cada sección, mientras carga. */
export function DetalleCargando() {
  return (
    <View
      className="gap-8"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <View className="gap-4">
        <View className="h-8 w-3/5 rounded-md bg-superficie-alt" />
        <View className="flex-row items-center gap-4">
          <View className="h-12 w-12 rounded-full bg-superficie-alt" />
          <View className="h-8 w-2/5 rounded-md bg-superficie-alt" />
        </View>
        <View className="h-6 w-4/5 rounded-md bg-superficie-alt" />
        <View className="h-8 w-1/2 rounded-full bg-superficie-alt" />
      </View>
      <View className="w-full rounded-lg bg-superficie-alt" style={{ aspectRatio: 4 / 3 }} />
      <View className="gap-2">
        <View className="h-6 w-full rounded-md bg-superficie-alt" />
        <View className="h-6 w-3/4 rounded-md bg-superficie-alt" />
      </View>
      <View className="gap-3">
        <View className="h-8 w-1/2 rounded-md bg-superficie-alt" />
        <LineaDeTiempoCargando />
      </View>
    </View>
  );
}
