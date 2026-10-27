import { router } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Boton } from './ui/boton';
import { Texto } from './ui/texto';

type Props = {
  titulo: string;
  /** Qué va a haber acá, en una frase. */
  descripcion: string;
  /** Para pantallas que se abren encima de las pestañas. */
  conVolver?: boolean;
};

/** Lugar reservado para una pantalla que todavía no está hecha. */
export function PantallaPendiente({ titulo, descripcion, conVolver = false }: Props) {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-fondo">
      <View className="w-full max-w-lg gap-4 self-center px-6 pt-12">
        <Texto variante="titulo-pantalla" accessibilityRole="header">
          {titulo}
        </Texto>
        <Texto>{descripcion}</Texto>
        <Texto variante="secundario">Esta parte todavía la estamos armando.</Texto>
        {conVolver && (
          <Boton
            texto="Volver"
            variante="secundario"
            icono="arrow-back"
            onPress={() => router.back()}
            className="mt-4"
          />
        )}
      </View>
    </SafeAreaView>
  );
}
