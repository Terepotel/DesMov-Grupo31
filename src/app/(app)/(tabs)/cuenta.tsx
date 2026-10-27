import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Boton } from '@/componentes/ui/boton';
import { Texto } from '@/componentes/ui/texto';
import { useSesion } from '@/modulos/autenticacion/contexto';

export default function PantallaCuenta() {
  const { usuario, salir } = useSesion();

  if (!usuario) return null;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-fondo">
      <View className="w-full max-w-lg gap-8 self-center px-6 pt-12">
        <Texto variante="titulo-pantalla" accessibilityRole="header">
          Tu cuenta
        </Texto>

        <View className="gap-1 rounded-lg border border-borde bg-superficie p-4">
          <Texto variante="titulo-tarjeta">{usuario.nombre}</Texto>
          <Texto variante="secundario">{usuario.email}</Texto>
          <Texto variante="secundario">
            {usuario.rol === 'operador' ? 'Operador del Centro de Atención' : 'Vecino'}
          </Texto>
        </View>

        <Boton
          texto="Cerrar sesión"
          variante="secundario"
          icono="log-out-outline"
          onPress={salir}
        />
      </View>
    </SafeAreaView>
  );
}
