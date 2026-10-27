import '@/global.css';

import { AtkinsonHyperlegibleMono_700Bold } from '@expo-google-fonts/atkinson-hyperlegible-mono/700Bold';
import { AtkinsonHyperlegibleNext_400Regular } from '@expo-google-fonts/atkinson-hyperlegible-next/400Regular';
import { AtkinsonHyperlegibleNext_700Bold } from '@expo-google-fonts/atkinson-hyperlegible-next/700Bold';
import { AtkinsonHyperlegibleNext_800ExtraBold } from '@expo-google-fonts/atkinson-hyperlegible-next/800ExtraBold';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  // Sólo los pesos que usa el design system. Si una fuente falla, se sigue con la del sistema.
  const [fuentesListas, errorFuentes] = useFonts({
    AtkinsonHyperlegibleNext_400Regular,
    AtkinsonHyperlegibleNext_700Bold,
    AtkinsonHyperlegibleNext_800ExtraBold,
    AtkinsonHyperlegibleMono_700Bold,
  });

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {/* El splash se esconde recién cuando están las fuentes. */}
      {(fuentesListas || !!errorFuentes) && <AnimatedSplashOverlay />}
      <AppTabs />
    </ThemeProvider>
  );
}
