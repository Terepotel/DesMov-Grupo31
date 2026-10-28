import { useRef, useState } from 'react';
import { View } from 'react-native';

import { OpcionReporteCercano } from '@/componentes/opcion-reporte-cercano';
import { Aviso } from '@/componentes/ui/aviso';
import { Boton } from '@/componentes/ui/boton';
import { HojaInferior } from '@/componentes/ui/hoja-inferior';
import { Texto } from '@/componentes/ui/texto';
import { mensajeDeError } from '@/servicios/api';
import { RADIO_CERCANOS_M, sumarseAReporte } from '@/servicios/reportes';
import type { Coordenadas, Reporte, TipoDeReporte } from '@/tipos';

type Props = {
  abierta: boolean;
  /** Los abiertos a menos de 50 m, del más cercano al más lejano. */
  cercanos: Reporte[];
  tipos: TipoDeReporte[] | null;
  /** Si ya eligió el tipo, son todos de ese tipo; si no, de cualquiera. */
  mismoTipo: boolean;
  /** Donde el vecino marcó el problema. */
  desde: Coordenadas;
  usuarioId: string;
  /** «Es otro problema»: vuelve al formulario para seguir con el suyo. */
  alCerrar: () => void;
  alSumarse: (reporte: Reporte, yaEstaba: boolean) => void;
  /** Abre el detalle para mirar las fotos y la descripción antes de decidir. */
  alVerDetalle: (reporte: Reporte) => void;
};

/**
 * R1.8, R3.4 y R3.5: apenas el reporte tiene lugar, los abiertos a menos de 50 m. Si es el mismo
 * problema, el vecino se suma en vez de hacer otro; si no, sigue con el suyo. Uno propio no se puede
 * sumar (la API lo rechaza): se ofrece verlo. Quien la usa cambia la `key` en cada apertura.
 */
export function HojaDuplicados({
  abierta,
  cercanos,
  tipos,
  mismoTipo,
  desde,
  usuarioId,
  alCerrar,
  alSumarse,
  alVerDetalle,
}: Props) {
  // Con uno solo, ya viene elegido: es un toque menos (NF2).
  const [elegido, setElegido] = useState<Reporte | null>(
    cercanos.length === 1 ? cercanos[0] : null,
  );
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Un doble toque no manda dos pedidos: el estado tarda un render en bloquear el botón.
  const enUso = useRef(false);

  const propio = elegido !== null && elegido.autorId === usuarioId;

  async function sumarme() {
    if (!elegido || enUso.current) return;
    enUso.current = true;
    setEnviando(true);
    setError(null);
    try {
      const respuesta = await sumarseAReporte(elegido.id);
      alSumarse(respuesta.reporte, respuesta.yaEstaba);
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      enUso.current = false;
      setEnviando(false);
    }
  }

  const igual = mismoTipo ? ' igual' : '';
  const titulo =
    cercanos.length === 1
      ? `Ya hay un reporte${igual} muy cerca`
      : `Ya hay ${cercanos.length} reportes${mismoTipo ? ' iguales' : ''} muy cerca`;

  return (
    <HojaInferior abierta={abierta} titulo={titulo} alCerrar={enviando ? undefined : alCerrar}>
      <View className="gap-6">
        <Texto>
          Si es el mismo problema, sumate: no hace falta otro reporte y cuanta más gente se suma,
          más arriba queda en la lista de Obras.
        </Texto>

        <View className="gap-2" accessibilityRole="radiogroup">
          {cercanos.map((reporte) => (
            <OpcionReporteCercano
              key={reporte.id}
              reporte={reporte}
              tipo={tipos?.find((t) => t.id === reporte.tipoId) ?? null}
              desde={desde}
              marcada={elegido?.id === reporte.id}
              bloqueada={enviando}
              alElegir={() => {
                setElegido(reporte);
                setError(null);
              }}
              nota={reporte.autorId === usuarioId ? 'lo reportaste vos' : undefined}
            />
          ))}
        </View>

        {error && <Aviso tono="error" titulo={error} />}

        {propio ? (
          <Boton
            texto="Ver mi reporte"
            icono="document-text-outline"
            onPress={() => alVerDetalle(elegido)}
          />
        ) : (
          <>
            <Boton
              texto="Sumarme a este reporte"
              icono="add-circle-outline"
              cargando={enviando}
              disabled={!elegido}
              onPress={sumarme}
            />
            {elegido && (
              <Boton
                texto="Ver el reporte"
                variante="secundario"
                icono="document-text-outline"
                disabled={enviando}
                onPress={() => alVerDetalle(elegido)}
              />
            )}
          </>
        )}
        <Boton
          texto="Seguir con mi reporte"
          variante="secundario"
          icono="create-outline"
          disabled={enviando}
          onPress={alCerrar}
        />
        <Texto variante="secundario">
          {`Mostramos los abiertos${mismoTipo ? ' del mismo tipo' : ''} a menos de ${RADIO_CERCANOS_M} m.`}
        </Texto>
      </View>
    </HojaInferior>
  );
}
