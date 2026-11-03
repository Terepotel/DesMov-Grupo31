# Reporte Ciudadano — DesMov Grupo 31

App móvil para que los vecinos de Gualeguaychú reporten problemas en la vía pública (baches,
luminarias, basura, etc.) y los sigan hasta que se resuelven, y para que los operadores del
municipio los gestionen desde la bandeja. Trabajo integrador de Desarrollo para Móviles (UNER,
Tecnicatura Universitaria en Desarrollo Web, 2026).

Hecha con **Expo SDK 57**, **Expo Router**, **NativeWind 4** y la API de la cátedra. Android es
la plataforma de entrega; el código también compila para iOS.

## Cómo correrla

Requisitos: Node 22.13 o más nuevo, npm, Git, y un teléfono Android con el **build de desarrollo**
instalado (el APK lo comparte el equipo; no sirve Expo Go, ver más abajo).

```bash
git clone git@github.com:Terepotel/DesMov-Grupo31.git
cd DesMov-Grupo31
npm install
cp .env.example .env     # completá GOOGLE_MAPS_API_KEY; la URL de la API ya viene
npx expo start
```

En el teléfono se abre la app **Reporte Ciudadano** (no Expo Go) y se escanea el QR. Fast
Refresh, menú de desarrollo y logs funcionan igual que siempre. Si cambia `tailwind.config.js` o
`src/global.css`, `npx expo start --clear`.

Para probar sin la API: `EXPO_PUBLIC_USAR_MOCKS=true` en `.env`. Cuentas y contraseñas en
`.env.example`.

### Por qué un build de desarrollo y no Expo Go

La app usa módulos nativos que Expo Go no trae (mapa con clave propia, cámara, audio, SQLite,
huella, notificaciones, sensores) y la clave de Google Maps de Expo Go para Android venció. El
build de desarrollo es «Expo Go con nuestros módulos y nuestra clave»: se instala una vez y se
programa igual.

Hay que compilar un APK nuevo cuando cambia la parte nativa: un paquete con código nativo, algo
de `app.json` o `app.config.ts` que vaya al manifiesto (permisos, plugins, ícono, splash), o el
SDK de Expo. Quien hace ese cambio compila, comparte el APK y avisa **antes de mergear**.

```bash
npx expo prebuild --platform android --clean      # regenera android/ (no se versiona)
npx expo run:android                              # compila e instala por USB
# o en la nube:
npx eas-cli@latest build --platform android --profile development
```

### Build de entrega

El APK de release, sin Metro ni computadora, sale del perfil `preview` de EAS. Las variables
(`EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_USAR_MOCKS`, `GOOGLE_MAPS_API_KEY`) ya están cargadas en el
entorno `preview` de EAS.

```bash
npx eas-cli@latest build --platform android --profile preview
```

## Instalar paquetes

Siempre con la CLI de Expo, que elige la versión compatible con el SDK:

```bash
npx expo install <paquete>         # nunca npm install <paquete>
npx expo install --check           # revisar versiones
npx expo install --fix             # corregirlas
npm uninstall <paquete>            # quitar
```

## Antes de cerrar una rama

```bash
npx expo lint
npx tsc --noEmit
npx expo-doctor
```

## Estructura

```
app.json / app.config.ts   # configuración de Expo; app.config.ts sólo suma lo que sale del .env
eas.json                   # perfiles development, preview y production
assets/images/             # ícono, capas del ícono adaptativo y splash
assets/mapa/               # teselas del mapa de la ciudad para usarlo sin señal
scripts/teselas/           # cómo se generan esas teselas (Docker + OpenStreetMap)
src/
  app/                     # rutas de Expo Router: cada archivo es una pantalla
    _layout.tsx            # sesión y bloqueo con huella
    ingreso.tsx, registro.tsx
    (app)/(tabs)/          # pestañas según el rol: vecino u operador
    (app)/nuevo-reporte, reporte/[id], sacar-foto, corregir-ubicacion
  modulos/<feature>/       # lógica y pantallas por feature (inicio, nuevo-reporte, bandeja…)
  componentes/ui/          # componentes del design system (Texto, Boton, Aviso, HojaInferior…)
  componentes/mapa/        # MapaBase, MarcadorReporte, SelectorUbicacion
  servicios/               # único acceso a la API y al teléfono (red, cola offline, archivos…)
  mocks/                   # datos para EXPO_PUBLIC_USAR_MOCKS=true
  tipos/                   # entidades de la API
  utilidades/              # fechas, geografía, useCarga
  global.css               # tokens de color del design system (claro y oscuro)
```

Las reglas de trabajo para personas y agentes están en `AGENTS.md`.
