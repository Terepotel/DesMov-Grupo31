import { SafeAreaView } from 'react-native-safe-area-context';

import { Boton } from '@/componentes/ui/boton';
import { Texto } from '@/componentes/ui/texto';
import { useSesion } from '@/modulos/autenticacion/contexto';

// Provisoria: confirma la sesión hasta que estén las pantallas de vecino y operador.
export default function PantallaInicio() {
  const { usuario, salir } = useSesion();

  if (!usuario) return null;

  return (
    <SafeAreaView className="flex-1 justify-center gap-4 bg-fondo px-6 pb-24">
      <Texto variante="titulo-pantalla" accessibilityRole="header">
        Hola, {usuario.nombre.split(' ')[0]}
      </Texto>
      <Texto variante="secundario">
        Entraste como {usuario.rol === 'operador' ? 'operador' : 'vecino'} con {usuario.email}.
      </Texto>
      <Boton texto="Cerrar sesión" variante="secundario" onPress={salir} className="mt-4" />
    </SafeAreaView>
  );
}
