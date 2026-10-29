import '@/global.css';

import { AtkinsonHyperlegibleMono_700Bold } from '@expo-google-fonts/atkinson-hyperlegible-mono/700Bold';
import { AtkinsonHyperlegibleNext_400Regular } from '@expo-google-fonts/atkinson-hyperlegible-next/400Regular';
import { AtkinsonHyperlegibleNext_700Bold } from '@expo-google-fonts/atkinson-hyperlegible-next/700Bold';
import { AtkinsonHyperlegibleNext_800ExtraBold } from '@expo-google-fonts/atkinson-hyperlegible-next/800ExtraBold';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/componentes/animated-icon';
import { ProveedorSesion, useSesion } from '@/modulos/autenticacion/contexto';
import { PantallaBloqueo } from '@/modulos/autenticacion/pantalla-bloqueo';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ProveedorSesion>
        <NavegadorRaiz />
      </ProveedorSesion>
    </ThemeProvider>
  );
}

// Sin sesión sólo se pueden ver `ingreso` y `registro`; con sesión, sólo la app.
function NavegadorRaiz() {
  const { cargando, usuario, bloqueada } = useSesion();
  // Sólo los pesos que usa el design system. Si una fuente falla, se sigue con la del sistema.
  const [fuentesListas, errorFuentes] = useFonts({
    AtkinsonHyperlegibleNext_400Regular,
    AtkinsonHyperlegibleNext_700Bold,
    AtkinsonHyperlegibleNext_800ExtraBold,
    AtkinsonHyperlegibleMono_700Bold,
  });
  const listo = !cargando && (fuentesListas || !!errorFuentes);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!!usuario}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={!usuario}>
          <Stack.Screen name="ingreso" />
          <Stack.Screen name="registro" />
        </Stack.Protected>
      </Stack>
      {/* R4.7: con sesión guardada, la huella (o la contraseña) antes de ver la app. */}
      {usuario && bloqueada && <PantallaBloqueo usuario={usuario} />}
      {/* El splash se esconde recién cuando se sabe si hay sesión guardada y están las fuentes. */}
      {listo && <AnimatedSplashOverlay />}
    </>
  );
}
