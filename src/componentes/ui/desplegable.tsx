import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Boton } from './boton';
import { HojaInferior } from './hoja-inferior';
import { Icono, type NombreIcono } from './icono';
import { Texto } from './texto';

export type OpcionDesplegable = {
  clave: string;
  texto: string;
  icono?: NombreIcono;
  /** Clase del ícono (por ejemplo, el color de un estado). */
  claseIcono?: string;
  /** Algo que va en lugar del ícono (un `DiscoTipo`). */
  adorno?: ReactNode;
};

/**
 * El `valor` de un desplegable `multiple`: «Todos», «Ninguno», «Recibido» o «Recibido y 2 más»
 * (la primera elegida en el orden de `opciones`).
 */
export function describirElegidos(
  opciones: Pick<OpcionDesplegable, 'clave' | 'texto'>[],
  elegidas: string[],
) {
  const enOrden = opciones.filter((opcion) => elegidas.includes(opcion.clave));
  if (enOrden.length === opciones.length) return 'Todos';
  if (enOrden.length === 0) return 'Ninguno';
  const [primera, ...resto] = enOrden;
  return resto.length === 0 ? primera.texto : `${primera.texto} y ${resto.length} más`;
}

type Props = {
  /** Qué se elige: «Estado», «Tipo». Es el título de la hoja y el nombre para el lector de pantalla. */
  rotulo: string;
  /** Lo elegido, en una frase corta: «Todos», «Recibido y 2 más». Es lo único que se ve en el botón. */
  valor: string;
  opciones: OpcionDesplegable[];
  elegidas: string[];
  /** Con `multiple`, cada opción se prende y apaga y la hoja se cierra con «Listo». */
  multiple?: boolean;
  alElegir: (clave: string) => void;
  className?: string;
};

/**
 * Un selector que muestra lo elegido y abre una `HojaInferior` con las opciones: lo que en la web
 * sería un `<select>`, a tamaño de dedo y con cada opción con palabra e ícono.
 */
export function Desplegable({
  rotulo,
  valor,
  opciones,
  elegidas,
  multiple = false,
  alElegir,
  className,
}: Props) {
  const [abierta, setAbierta] = useState(false);

  function elegir(clave: string) {
    alElegir(clave);
    if (!multiple) setAbierta(false);
  }

  return (
    <>
      <Pressable
        onPress={() => setAbierta(true)}
        className={`min-h-toque flex-row items-center gap-2 rounded-md border-2 border-borde-control bg-superficie px-4 py-2 active:opacity-70 ${className ?? ''}`}
        accessibilityRole="button"
        accessibilityLabel={`${rotulo}: ${valor}`}
        accessibilityHint="Abre las opciones"
        accessibilityState={{ expanded: abierta }}>
        <Texto variante="insignia" numberOfLines={1} className="flex-1">
          {valor}
        </Texto>
        <Icono nombre="chevron-down" className="text-texto-secundario" />
      </Pressable>

      <HojaInferior
        abierta={abierta}
        titulo={`Filtrar por ${rotulo.toLowerCase()}`}
        alCerrar={() => setAbierta(false)}>
        <View className="gap-2">
          {opciones.map((opcion) => {
            const elegida = elegidas.includes(opcion.clave);
            return (
              <Pressable
                key={opcion.clave}
                onPress={() => elegir(opcion.clave)}
                className={`min-h-toque flex-row items-center gap-3 rounded-lg px-4 py-2 active:opacity-70 ${
                  elegida
                    ? 'border-[3px] border-primario bg-superficie-alt'
                    : 'border-2 border-borde-control bg-superficie'
                }`}
                accessibilityRole={multiple ? 'checkbox' : 'radio'}
                accessibilityLabel={opcion.texto}
                accessibilityState={{ checked: elegida, selected: elegida }}>
                {opcion.adorno ??
                  (opcion.icono && (
                    <Icono nombre={opcion.icono} className={opcion.claseIcono ?? 'text-texto'} />
                  ))}
                <Texto
                  variante="cuerpo-fuerte"
                  color={elegida ? 'primario' : 'texto'}
                  className="flex-1">
                  {opcion.texto}
                </Texto>
                <Icono
                  nombre={
                    elegida
                      ? multiple
                        ? 'checkbox'
                        : 'radio-button-on'
                      : multiple
                        ? 'square-outline'
                        : 'radio-button-off'
                  }
                  className={elegida ? 'text-primario' : 'text-borde-control'}
                />
              </Pressable>
            );
          })}
        </View>
        {multiple && (
          <Boton
            texto="Listo"
            variante="secundario"
            icono="checkmark"
            onPress={() => setAbierta(false)}
            className="mt-2"
          />
        )}
      </HojaInferior>
    </>
  );
}
