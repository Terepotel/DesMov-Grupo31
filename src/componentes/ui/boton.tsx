import { ActivityIndicator, Pressable, View, type PressableProps } from 'react-native';

import { Icono, type NombreIcono } from './icono';
import { Texto, type ColorTexto } from './texto';

type Props = Omit<PressableProps, 'children'> & {
  texto: string;
  /** Un solo `primario` por pantalla; `sobre-verde` sólo dentro del encabezado verde. */
  variante?: keyof typeof estilos;
  /** A la izquierda del texto; nunca lo reemplaza. */
  icono?: NombreIcono;
  /** Muestra un indicador en lugar del texto y bloquea el botón. */
  cargando?: boolean;
  className?: string;
};

const estilos: Record<
  'primario' | 'secundario' | 'peligro' | 'sobre-verde',
  { boton: string; color: ColorTexto; claseColor: string }
> = {
  primario: {
    boton: 'min-h-toque-principal bg-primario',
    color: 'sobre-primario',
    claseColor: 'text-sobre-primario',
  },
  secundario: {
    boton: 'min-h-toque border-2 border-borde-control bg-superficie',
    color: 'primario',
    claseColor: 'text-primario',
  },
  peligro: {
    boton: 'min-h-toque border-2 border-peligro bg-superficie',
    color: 'peligro',
    claseColor: 'text-peligro',
  },
  'sobre-verde': {
    boton: 'min-h-toque bg-sobre-verde',
    color: 'bandera-verde',
    claseColor: 'text-bandera-verde',
  },
};

export function Boton({
  texto,
  variante = 'primario',
  icono,
  cargando = false,
  disabled,
  className,
  ...props
}: Props) {
  const estilo = estilos[variante];
  const bloqueado = cargando || !!disabled;

  return (
    <Pressable
      className={`items-center justify-center rounded-lg px-6 active:opacity-70 disabled:opacity-50 ${estilo.boton} ${className ?? ''}`}
      disabled={bloqueado}
      accessibilityRole="button"
      accessibilityLabel={texto}
      accessibilityState={{ disabled: bloqueado, busy: cargando }}
      {...props}>
      {cargando ? (
        <ActivityIndicator className={estilo.claseColor} />
      ) : (
        <View className="flex-row items-center gap-2">
          {icono && <Icono nombre={icono} className={estilo.claseColor} />}
          <Texto variante="boton" color={estilo.color}>
            {texto}
          </Texto>
        </View>
      )}
    </Pressable>
  );
}
