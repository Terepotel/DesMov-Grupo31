import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { OpcionReporteCercano } from '@/componentes/opcion-reporte-cercano';
import { Aviso } from '@/componentes/ui/aviso';
import { Boton } from '@/componentes/ui/boton';
import { CampoTexto } from '@/componentes/ui/campo-texto';
import { HojaInferior } from '@/componentes/ui/hoja-inferior';
import { TarjetaReporteCargando } from '@/componentes/ui/tarjeta-reporte';
import { Texto } from '@/componentes/ui/texto';
import { ErrorApi, mensajeDeError } from '@/servicios/api';
import { obtenerTiposDeReporte } from '@/servicios/catalogos';
import {
  marcarDuplicado,
  obtenerReportePorCodigo,
  obtenerReportesCercanos,
  RADIO_ORIGINALES_M,
} from '@/servicios/reportes';
import type { Reporte, TipoDeReporte } from '@/tipos';
import { esCodigoDeSeguimiento } from '@/utilidades/reportes';
import { useCarga } from '@/utilidades/use-carga';

type Props = {
  reporte: Reporte;
  abierta: boolean;
  alCerrar: () => void;
  /** Con el reporte ya rechazado como duplicado y el original elegido. */
  alMarcar: (duplicado: Reporte, original: Reporte) => void;
  /** La API dijo que este reporte ya no se puede cambiar (`TRANSICION_INVALIDA`). */
  alDesactualizarse: (mensaje: string) => void;
};

type Candidatos = { reportes: Reporte[]; tipos: TipoDeReporte[] | null };

/**
 * R4.4: elegir de cuál reporte es duplicado éste y confirmar. Se ofrecen los abiertos a menos de
 * 200 m (los mismos que ve el vecino al crear, más lejos), y si el original no está ahí, se escribe
 * su número. Marcarlo lo deja rechazado con «Duplicado de GCHU-…» y suma al vecino al original (P4),
 * así que se confirma con el botón de peligro. Quien la usa cambia la `key` en cada apertura.
 */
export function HojaMarcarDuplicado({
  reporte,
  abierta,
  alCerrar,
  alMarcar,
  alDesactualizarse,
}: Props) {
  const [elegido, setElegido] = useState<Reporte | null>(null);
  const [codigo, setCodigo] = useState('');
  const [errorDelCampo, setErrorDelCampo] = useState<string | null>(null);
  const [errorDelEnvio, setErrorDelEnvio] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const hayElegido = elegido !== null || codigo.trim() !== '';

  async function confirmar() {
    if (!hayElegido || enviando) return;
    setErrorDelCampo(null);
    setErrorDelEnvio(null);
    setEnviando(true);
    try {
      let original = elegido;
      if (!original) {
        if (!esCodigoDeSeguimiento(codigo)) {
          setErrorDelCampo('Escribilo como GCHU-2026-00412.');
          return;
        }
        try {
          original = await obtenerReportePorCodigo(codigo);
        } catch (error) {
          if (error instanceof ErrorApi && error.codigo === 'REPORTE_NO_ENCONTRADO') {
            setErrorDelCampo('No hay ningún reporte con ese número.');
            return;
          }
          throw error;
        }
      }
      const porQueNo = porQueNoEsOriginal(reporte, original);
      if (porQueNo) {
        if (elegido) setErrorDelEnvio(porQueNo);
        else setErrorDelCampo(porQueNo);
        return;
      }
      const duplicado = await marcarDuplicado(reporte.id, original.id);
      alMarcar(duplicado, original);
    } catch (error) {
      if (error instanceof ErrorApi && error.codigo === 'TRANSICION_INVALIDA') {
        alDesactualizarse(error.message);
      } else {
        setErrorDelEnvio(mensajeDeError(error));
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <HojaInferior
      abierta={abierta}
      titulo="Marcar como duplicado"
      alCerrar={enviando ? undefined : alCerrar}>
      <View className="gap-6">
        <Texto>
          Este reporte queda rechazado con «Duplicado de» y el número del original. El vecino pasa a
          estar sumado al original y lo sigue desde ahí.
        </Texto>

        <View className="gap-3">
          <Texto variante="cuerpo-fuerte">De cuál es duplicado</Texto>
          {abierta && (
            <ListaDeCercanos
              reporte={reporte}
              elegido={elegido}
              bloqueada={enviando}
              alElegir={(original) => {
                setElegido(original);
                setCodigo('');
                setErrorDelCampo(null);
                setErrorDelEnvio(null);
              }}
            />
          )}
        </View>

        <CampoTexto
          etiqueta="O escribí el número del original"
          placeholder="GCHU-2026-00412"
          value={codigo}
          onChangeText={(texto) => {
            setCodigo(texto);
            setElegido(null);
            if (errorDelCampo) setErrorDelCampo(null);
          }}
          autoCapitalize="characters"
          autoCorrect={false}
          ayuda="Si el original no está en la lista de arriba."
          error={errorDelCampo}
          editable={!enviando}
        />

        {errorDelEnvio && <Aviso tono="error" titulo={errorDelEnvio} />}

        <Boton
          texto="Confirmar el duplicado"
          variante="peligro"
          icono="git-merge-outline"
          cargando={enviando}
          disabled={!hayElegido}
          onPress={confirmar}
        />
        <Boton
          texto="Dejar como está"
          variante="secundario"
          icono="arrow-back-outline"
          disabled={enviando}
          onPress={alCerrar}
        />
      </View>
    </HojaInferior>
  );
}

/** Lo que la API rechazaría (`DUPLICADO_INVALIDO`), dicho antes de mandar. */
function porQueNoEsOriginal(reporte: Reporte, original: Reporte): string | null {
  if (original.id === reporte.id) return 'Es este mismo reporte. Elegí otro.';
  if (original.estado === 'resuelto' || original.estado === 'rechazado') {
    return 'El original tiene que estar abierto. Ese ya está cerrado.';
  }
  if (original.duplicadoDe !== null) {
    return 'Ese reporte ya es duplicado de otro. Elegí el original.';
  }
  return null;
}

function ListaDeCercanos({
  reporte,
  elegido,
  bloqueada,
  alElegir,
}: {
  reporte: Reporte;
  elegido: Reporte | null;
  bloqueada: boolean;
  alElegir: (original: Reporte) => void;
}) {
  const { id, coordenadas } = reporte;
  const { latitud, longitud } = coordenadas;
  const cargar = useCallback(
    (): Promise<Candidatos> =>
      Promise.all([
        obtenerReportesCercanos({ latitud, longitud }, { radioMetros: RADIO_ORIGINALES_M }),
        obtenerTiposDeReporte().catch(() => null),
      ]).then(([cercanos, tipos]) => ({
        // El mismo reporte también está cerca de sí mismo.
        reportes: cercanos.datos.filter((r) => r.id !== id),
        tipos: tipos?.datos ?? null,
      })),
    [id, latitud, longitud],
  );
  const { carga, reintentar } = useCarga(cargar);

  if (carga.tipo === 'cargando') {
    return (
      <View className="gap-3">
        <TarjetaReporteCargando />
        <TarjetaReporteCargando />
      </View>
    );
  }
  if (carga.tipo === 'error') {
    return (
      <View className="gap-3">
        <Aviso tono="error" titulo={carga.mensaje} />
        <Boton
          texto="Probar de nuevo"
          variante="secundario"
          icono="refresh-outline"
          onPress={reintentar}
        />
      </View>
    );
  }
  if (carga.datos.reportes.length === 0) {
    return (
      <Texto variante="secundario">
        No hay otros reportes abiertos a menos de {RADIO_ORIGINALES_M} m.
      </Texto>
    );
  }
  return (
    <View className="gap-2" accessibilityRole="radiogroup">
      {carga.datos.reportes.map((candidato) => {
        const tipo = carga.datos.tipos?.find((t) => t.id === candidato.tipoId) ?? null;
        return (
          <OpcionReporteCercano
            key={candidato.id}
            reporte={candidato}
            tipo={tipo}
            desde={reporte.coordenadas}
            marcada={elegido?.id === candidato.id}
            bloqueada={bloqueada}
            alElegir={() => alElegir(candidato)}
            nota={tipo && tipo.id === reporte.tipoId ? 'mismo tipo' : undefined}
          />
        );
      })}
    </View>
  );
}
