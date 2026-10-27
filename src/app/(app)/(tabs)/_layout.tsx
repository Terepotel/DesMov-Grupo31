import { router } from 'expo-router';
import { Tabs, type BottomTabBarProps } from 'expo-router/js-tabs';

import { BarraInferior } from '@/componentes/ui/barra-inferior';
import type { NombreIcono } from '@/componentes/ui/icono';
import { useSesion } from '@/modulos/autenticacion/contexto';

type Pestana = { nombre: string; rotulo: string; icono: NombreIcono };

// El vecino tiene además el botón «Nuevo» al centro; el operador, no.
const pestanasVecino: Pestana[] = [
  { nombre: 'index', rotulo: 'Inicio', icono: 'home-outline' },
  { nombre: 'mis-reportes', rotulo: 'Mis reportes', icono: 'list-outline' },
  { nombre: 'mapa', rotulo: 'Mapa', icono: 'map-outline' },
  { nombre: 'avisos', rotulo: 'Avisos', icono: 'notifications-outline' },
];

const pestanasOperador: Pestana[] = [
  { nombre: 'index', rotulo: 'Bandeja', icono: 'file-tray-full-outline' },
  { nombre: 'mapa', rotulo: 'Mapa', icono: 'map-outline' },
  { nombre: 'escanear', rotulo: 'Escanear', icono: 'qr-code-outline' },
  { nombre: 'cuadrillas', rotulo: 'Cuadrillas', icono: 'people-outline' },
  { nombre: 'cuenta', rotulo: 'Cuenta', icono: 'person-circle-outline' },
];

export default function LayoutPestanas() {
  const { usuario } = useSesion();
  const esOperador = usuario?.rol === 'operador';

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <Barra {...props} esOperador={esOperador} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="mapa" />
      {/* El vecino llega a su cuenta desde el inicio: no tiene pestaña propia. */}
      <Tabs.Screen name="cuenta" />
      <Tabs.Protected guard={!esOperador}>
        <Tabs.Screen name="mis-reportes" />
        <Tabs.Screen name="avisos" />
      </Tabs.Protected>
      <Tabs.Protected guard={esOperador}>
        <Tabs.Screen name="escanear" />
        <Tabs.Screen name="cuadrillas" />
      </Tabs.Protected>
    </Tabs>
  );
}

function Barra({
  state,
  navigation,
  insets,
  esOperador,
}: BottomTabBarProps & { esOperador: boolean }) {
  const actual = state.routes[state.index]?.name;

  const items = (esOperador ? pestanasOperador : pestanasVecino).flatMap((pestana) => {
    const ruta = state.routes.find((r) => r.name === pestana.nombre);
    if (!ruta) return [];
    const activa = ruta.name === actual;
    return {
      clave: ruta.key,
      rotulo: pestana.rotulo,
      icono: pestana.icono,
      activa,
      alTocar: () => {
        const evento = navigation.emit({
          type: 'tabPress',
          target: ruta.key,
          canPreventDefault: true,
        });
        if (!activa && !evento.defaultPrevented) navigation.navigate(ruta.name, ruta.params);
      },
    };
  });

  return (
    <BarraInferior
      items={items}
      alTocarNuevo={esOperador ? undefined : () => router.push('/nuevo-reporte')}
      margenInferior={insets.bottom}
    />
  );
}
