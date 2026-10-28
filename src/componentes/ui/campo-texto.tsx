import { cssInterop } from 'nativewind';
import { useState, type ReactNode, type Ref } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { Icono } from './icono';
import { Texto } from './texto';

// NativeWind no mapea `placeholderTextColor`: con esto sale de `placeholderClassName` (`text-*`).
cssInterop(TextInput, {
  className: { target: 'style', nativeStyleToProp: { textAlign: true } },
  placeholderClassName: { target: false, nativeStyleToProp: { color: 'placeholderTextColor' } },
});

declare module 'react-native' {
  interface TextInputProps {
    placeholderClassName?: string;
  }
}

type Props = TextInputProps & {
  etiqueta: string;
  /** Va dentro del borde, a la derecha; por ejemplo, el botón para mostrar la contraseña. */
  accesorio?: ReactNode;
  /** Debajo del campo, en `secundario`: qué va acá o quién lo va a leer. */
  ayuda?: string;
  /** Qué hacer para corregirlo (o el mensaje de la API tal cual); pinta el borde en `peligro`. */
  error?: string | null;
  ref?: Ref<TextInput>;
};

export function CampoTexto({
  etiqueta,
  accesorio,
  ayuda,
  error,
  className,
  onFocus,
  onBlur,
  ...props
}: Props) {
  const [conFoco, setConFoco] = useState(false);

  return (
    <View className="gap-2">
      <Texto variante="cuerpo-fuerte">{etiqueta}</Texto>
      <View
        className={`min-h-toque flex-row items-center rounded-md border-2 bg-superficie ${
          error ? 'border-peligro' : conFoco ? 'border-primario' : 'border-borde-control'
        }`}>
        <TextInput
          className={`min-h-toque min-w-0 flex-1 px-4 font-sans text-campo text-texto ${className ?? ''}`}
          placeholderClassName="text-texto-secundario"
          accessibilityLabel={etiqueta}
          accessibilityHint={error ?? ayuda}
          onFocus={(evento) => {
            setConFoco(true);
            onFocus?.(evento);
          }}
          onBlur={(evento) => {
            setConFoco(false);
            onBlur?.(evento);
          }}
          {...props}
        />
        {accesorio}
      </View>
      {error ? (
        <View className="flex-row items-start gap-2" accessibilityRole="alert">
          <Icono nombre="alert-circle-outline" tamano={20} className="text-peligro" />
          <Texto variante="secundario" color="peligro" className="flex-1">
            {error}
          </Texto>
        </View>
      ) : (
        ayuda && <Texto variante="secundario">{ayuda}</Texto>
      )}
    </View>
  );
}
