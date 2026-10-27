import { Pressable, View } from 'react-native';

import { Icono, type NombreIcono } from './icono';
import { useSombra } from './sombras';
import { Texto } from './texto';

export type ItemBarra = {
  clave: string;
  rotulo: string;
  icono: NombreIcono;
  activa: boolean;
  alTocar: () => void;
};

type Props = {
  items: ItemBarra[];
  /** Sólo el vecino: el disco «Nuevo» al centro. */
  alTocarNuevo?: () => void;
  /** Área segura inferior del teléfono. */
  margenInferior: number;
};

/** La navegación principal. Los rótulos no se ocultan nunca. */
export function BarraInferior({ items, alTocarNuevo, margenInferior }: Props) {
  const mitad = Math.ceil(items.length / 2);
  const conNuevo = alTocarNuevo ? [...items.slice(0, mitad), null, ...items.slice(mitad)] : items;

  return (
    <View
      className="flex-row border-t border-borde bg-superficie px-1"
      style={{ paddingBottom: margenInferior }}
      accessibilityRole="tablist">
      {conNuevo.map((item) =>
        item ? (
          <Pressable
            key={item.clave}
            onPress={item.alTocar}
            className="min-h-toque flex-1 items-center justify-center gap-1 px-1 py-2 active:opacity-70"
            accessibilityRole="tab"
            accessibilityLabel={item.rotulo}
            accessibilityState={{ selected: item.activa }}>
            <Icono
              nombre={item.icono}
              tamano={28}
              className={item.activa ? 'text-primario' : 'text-texto-secundario'}
            />
            <Texto
              variante="rotulo"
              color={item.activa ? 'primario' : 'texto-secundario'}
              className="text-center">
              {item.rotulo}
            </Texto>
          </Pressable>
        ) : (
          <BotonNuevo key="nuevo" alTocar={alTocarNuevo!} />
        ),
      )}
    </View>
  );
}

function BotonNuevo({ alTocar }: { alTocar: () => void }) {
  const sombra = useSombra('flotante');

  return (
    <Pressable
      onPress={alTocar}
      className="flex-1 items-center gap-1 px-1 pb-2 active:opacity-70"
      accessibilityRole="button"
      accessibilityLabel="Nuevo reporte">
      {/* Levantado 32px sobre la barra. */}
      <View
        className="-mt-8 h-16 w-16 items-center justify-center rounded-full bg-primario"
        style={sombra}>
        <Icono nombre="add" tamano={36} className="text-sobre-primario" />
      </View>
      <Texto variante="rotulo" color="texto-secundario" className="text-center">
        Nuevo
      </Texto>
    </Pressable>
  );
}
