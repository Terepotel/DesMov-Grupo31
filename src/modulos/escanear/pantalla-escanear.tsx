import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Aviso } from '@/componentes/ui/aviso';
import { Boton } from '@/componentes/ui/boton';
import { CampoTexto } from '@/componentes/ui/campo-texto';
import { Icono } from '@/componentes/ui/icono';
import { Texto } from '@/componentes/ui/texto';
import { codigoDesdeQr, esCodigoDeSeguimiento } from '@/utilidades/reportes';

/**
 * La pestaña Escanear del operador (R2.6, P17): la cámara lee el QR que el vecino muestra en el
 * mostrador y abre el reporte. Acepta el enlace del QR y el código pelado (D2 de la API). Si el QR
 * no se puede leer, el código se escribe a mano.
 */
export function PantallaEscanear() {
  const margenes = useSafeAreaInsets();
  const [permiso, pedirPermiso] = useCameraPermissions();
  const [enfocada, setEnfocada] = useState(false);
  const [leido, setLeido] = useState(false);
  const [avisoQr, setAvisoQr] = useState<string | null>(null);
  // Las lecturas llegan varias veces por segundo: con esto se abre un solo reporte por QR.
  const ultimaLectura = useRef<string | null>(null);

  // La cámara sólo trabaja mientras la pestaña se ve; al volver, lee de nuevo.
  useFocusEffect(
    useCallback(() => {
      setEnfocada(true);
      setLeido(false);
      ultimaLectura.current = null;
      return () => setEnfocada(false);
    }, []),
  );

  const abrir = (codigo: string) => {
    setLeido(true);
    setAvisoQr(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    router.push({ pathname: '/reporte/[id]', params: { id: codigo } });
  };

  const alLeerQr = ({ data }: BarcodeScanningResult) => {
    if (ultimaLectura.current === data) return;
    ultimaLectura.current = data;
    const codigo = codigoDesdeQr(data);
    if (codigo) abrir(codigo);
    else setAvisoQr('Ese QR no es de un reporte. Pedile al vecino el que muestra la app.');
  };

  return (
    <ScrollView
      className="flex-1 bg-fondo"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingTop: margenes.top + 48, paddingBottom: 48 }}>
      <View className="w-full max-w-lg gap-8 self-center px-6">
        <View className="gap-2">
          <Texto variante="titulo-pantalla" accessibilityRole="header">
            Escanear un QR
          </Texto>
          <Texto>Apuntá al QR que muestra el vecino. El reporte se abre solo.</Texto>
        </View>

        <View className="gap-3">
          <Camara
            permiso={permiso}
            activa={enfocada && !leido}
            alLeer={leido ? undefined : alLeerQr}
            pedirPermiso={pedirPermiso}
          />
          {avisoQr && <Aviso tono="error" titulo={avisoQr} />}
        </View>

        <CodigoAMano alAbrir={abrir} />
      </View>
    </ScrollView>
  );
}

type PropsCamara = {
  permiso: ReturnType<typeof useCameraPermissions>[0];
  activa: boolean;
  alLeer?: (resultado: BarcodeScanningResult) => void;
  pedirPermiso: () => void;
};

function Camara({ permiso, activa, alLeer, pedirPermiso }: PropsCamara) {
  if (!permiso) {
    // Todavía no se sabe si hay permiso: el cuadro vacío, del mismo tamaño.
    return <View className="aspect-square w-full rounded-xl bg-superficie-alt" />;
  }

  if (!permiso.granted) {
    return (
      <View className="gap-3">
        <Aviso
          tono="atencion"
          icono="camera-outline"
          titulo="Sin la cámara no se puede escanear."
          detalle={
            permiso.canAskAgain
              ? 'Se usa sólo para leer el QR del reporte.'
              : 'Está bloqueada para esta app: activala desde la configuración del teléfono.'
          }
        />
        {permiso.canAskAgain ? (
          <Boton texto="Permitir la cámara" icono="camera-outline" onPress={pedirPermiso} />
        ) : (
          <Boton
            texto="Abrir la configuración"
            icono="settings-outline"
            onPress={() => Linking.openSettings()}
          />
        )}
      </View>
    );
  }

  return (
    <View
      className="aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-superficie-alt"
      accessible
      accessibilityLabel="Cámara buscando un código QR">
      <Icono nombre="qr-code-outline" tamano={64} className="text-texto-secundario" />
      <CameraView
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
        facing="back"
        active={activa}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={alLeer}
      />
    </View>
  );
}

/** Si el QR no se lee (pantalla rota, brillo bajo), el número de seguimiento se escribe. */
function CodigoAMano({ alAbrir }: { alAbrir: (codigo: string) => void }) {
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState<string | null>(null);

  const abrir = () => {
    if (!esCodigoDeSeguimiento(codigo)) {
      setError('Escribilo como GCHU-2026-00412.');
      return;
    }
    setError(null);
    alAbrir(codigo.trim().toUpperCase());
  };

  return (
    <View className="gap-3">
      <Texto variante="titulo-seccion" accessibilityRole="header">
        O escribí el número
      </Texto>
      <CampoTexto
        etiqueta="Número de seguimiento"
        placeholder="GCHU-2026-00412"
        value={codigo}
        onChangeText={(texto) => {
          setCodigo(texto);
          if (error) setError(null);
        }}
        autoCapitalize="characters"
        autoCorrect={false}
        returnKeyType="go"
        onSubmitEditing={abrir}
        ayuda="Está en el detalle del reporte, arriba de todo."
        error={error}
      />
      <Boton
        texto="Abrir el reporte"
        variante="secundario"
        icono="search-outline"
        onPress={abrir}
        disabled={codigo.trim() === ''}
      />
    </View>
  );
}
