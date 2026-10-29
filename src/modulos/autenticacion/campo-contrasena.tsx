import { useState, type ComponentProps } from 'react';
import { Pressable } from 'react-native';

import { CampoTexto } from '@/componentes/ui/campo-texto';
import { Icono } from '@/componentes/ui/icono';

type Props = Omit<ComponentProps<typeof CampoTexto>, 'secureTextEntry' | 'accesorio'>;

/** `CampoTexto` para una contraseña, con el botón para verla. */
export function CampoContrasena(props: Props) {
  const [mostrar, setMostrar] = useState(false);
  return (
    <CampoTexto
      autoCapitalize="none"
      autoCorrect={false}
      textContentType="password"
      {...props}
      secureTextEntry={!mostrar}
      accesorio={
        <Pressable
          onPress={() => setMostrar((valor) => !valor)}
          className="h-14 w-14 items-center justify-center active:opacity-70"
          accessibilityRole="button"
          accessibilityLabel={mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          accessibilityState={{ selected: mostrar }}>
          <Icono
            nombre={mostrar ? 'eye-outline' : 'eye-off-outline'}
            tamano={26}
            className="text-texto-secundario"
          />
        </Pressable>
      }
    />
  );
}
