import { Text, type TextProps } from 'react-native';

// Estilos tipográficos del design system. La familia ya trae el peso: no usar `font-bold`.
const variantes = {
  'titulo-pantalla': 'font-sans-extrabold text-titulo-pantalla',
  'titulo-seccion': 'font-sans-bold text-titulo-seccion',
  'titulo-tarjeta': 'font-sans-bold text-titulo-tarjeta',
  cuerpo: 'font-sans text-cuerpo',
  'cuerpo-fuerte': 'font-sans-bold text-cuerpo',
  secundario: 'font-sans text-secundario',
  etiqueta: 'font-sans-bold text-etiqueta uppercase',
  rotulo: 'font-sans-bold text-rotulo',
  /** 12px negrita: sólo los rótulos de la barra inferior. */
  'rotulo-barra': 'font-sans-bold text-rotulo-barra',
  boton: 'font-sans-bold text-boton',
  /** 16px negrita: insignias de estado. */
  insignia: 'font-sans-bold text-secundario',
  codigo: 'font-mono text-codigo',
};

// El color va aparte de `className` para que no compita con el de la variante.
const colores = {
  texto: 'text-texto',
  'texto-secundario': 'text-texto-secundario',
  primario: 'text-primario',
  'sobre-primario': 'text-sobre-primario',
  'sobre-celeste': 'text-sobre-celeste',
  'sobre-verde': 'text-sobre-verde',
  'bandera-verde': 'text-bandera-verde',
  peligro: 'text-peligro',
  'estado-recibido': 'text-estado-recibido',
  'estado-revision': 'text-estado-revision',
  'estado-asignado': 'text-estado-asignado',
  'estado-resuelto': 'text-estado-resuelto',
  'estado-rechazado': 'text-estado-rechazado',
};

export type VarianteTexto = keyof typeof variantes;
export type ColorTexto = keyof typeof colores;

type Props = TextProps & {
  variante?: VarianteTexto;
  color?: ColorTexto;
  className?: string;
};

export function Texto({ variante = 'cuerpo', color, className, ...props }: Props) {
  const colorPorDefecto: ColorTexto =
    variante === 'secundario' || variante === 'etiqueta' ? 'texto-secundario' : 'texto';

  return (
    <Text
      className={`${variantes[variante]} ${colores[color ?? colorPorDefecto]} ${className ?? ''}`}
      {...props}
    />
  );
}
