import type { ConfigContext, ExpoConfig } from 'expo/config';

// La configuración vive en app.json; acá se suma sólo lo que sale de variables de entorno.
// Expo carga `.env` antes de leer este archivo. En EAS Build, `.env` no se sube: la variable
// tiene que estar cargada en EAS (`eas env:create`).
export default ({ config }: ConfigContext): ExpoConfig =>
  ({
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      // En Android, react-native-maps sólo funciona con Google Maps. En iOS usa Apple Maps: sin clave.
      ['react-native-maps', { androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY }],
    ],
  }) as ExpoConfig;
