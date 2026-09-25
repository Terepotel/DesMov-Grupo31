# DesMov - Grupo 31

Aplicación móvil multiplataforma (iOS, Android y web) construida con **Expo** y **React Native**, del proyecto DesMov.

---

## 📌 IMPORTANTE: Cómo se instalan los paquetes

> ### ⚠️ NUNCA usa `npm install <paquete>` para agregar dependencias
>
> **Regla del proyecto:** todo paquete nuevo se instala con `npx expo install <nombrePaquete>`.
>
> React Native **no es retrocompatible** entre versiones. Si instalas un paquete con
> `npm install`, se descarga la última versión de npm, que probablemente **no sea compatible**
> con tu versión de `react-native` / Expo SDK y rompa el proyecto.
>
> **Siempre usa el comando de Expo, que resuelve automáticamente la versión correcta:**
>
> ```bash
> npx expo install <nombrePaquete>
> ```
>
> Ejemplos:
>
> ```bash
> npx expo install expo-camera          # agregar un paquete del SDK de Expo
> npx expo install typescript -- -D     # agregar un paquete de desarrollo
> npx expo install --fix                # corregir versiones incompatibles
> npx expo install --check              # solo revisar, sin modificar nada
> ```
>
> Descargar paquetes no significa lo mismo que **instalar dependencias**. Al clonar el
> proyecto por primera vez sí se ejecuta `npm install` (o `npm ci`), porque lo que hace es
> instalar lo que **ya está definido** en `package.json` / `package-lock.json`. La regla de
> arriba aplica para **agregar o cambiar** paquetes.

---

## 🛠️ Tecnologías utilizadas

| Tecnología | Versión | Descripción |
| --- | --- | --- |
| [Expo](https://expo.dev) | `~57.0.24` | Framework y CLI principal del proyecto (Expo SDK 57) |
| [React Native](https://reactnative.dev) | `0.86.3` | Base de la aplicación nativa |
| [React](https://react.dev) | `19.2.3` | Biblioteca de UI |
| [Expo Router](https://docs.expo.dev/router/introduction) | `~57.0.22` | Navegación por rutas basadas en archivos |
| [TypeScript](https://www.typescriptlang.org/) | `~6.0.3` | Tipado estático (`strict: true`) |
| [React Native Web](https://necolas.github.io/react-native-web/) | `~0.21.0` | Soporte para web |
| [React Native Reanimated](https://docs.expo.dev/versions/latest/sdk/reanimated/) | `4.5.1` | Animaciones de alto rendimiento |
| [React Native Worklets](https://docs.expo.dev/versions/latest/sdk/reanimated/) | `0.10.1` | Motor de worklets requerido por Reanimated 4 |
| [React Native Gesture Handler](https://docs.expo.dev/versions/latest/sdk/gesture-handler/) | `~2.32.0` | Manejo de gestos |
| [React Native Screens](https://docs.expo.dev/versions/latest/sdk/screens/) | `~4.26.0` | Navegación nativa y transiciones |
| [React Native Safe Area Context](https://docs.expo.dev/versions/latest/sdk/safe-area-context/) | `~5.7.0` | Zonas seguras (notch, barra de gestos) |
| [@expo/ui](https://docs.expo.dev/versions/latest/sdk/ui/) | `~57.0.19` | Componentes nativos (SwiftUI / Jetpack Compose) |
| [expo-glass-effect](https://docs.expo.dev/versions/latest/sdk/glass-effect/) | `~57.0.3` | Efecto "Liquid Glass" (iOS 26+) |
| [expo-image](https://docs.expo.dev/versions/latest/sdk/image/) | `~57.0.5` | Componente de imágenes optimizado |
| [expo-splash-screen](https://docs.expo.dev/versions/latest/sdk/splash-screen/) | `~57.0.9` | Pantalla de splash animada |
| [expo-constants](https://docs.expo.dev/versions/latest/sdk/constants/) | `~57.0.19` | Constantes de la app |
| [expo-device](https://docs.expo.dev/versions/latest/sdk/device/) | `~57.0.2` | Información del dispositivo |
| [expo-linking](https://docs.expo.dev/versions/latest/sdk/linking/) | `~57.0.10` | Deep links |
| [expo-font](https://docs.expo.dev/versions/latest/sdk/font/) | `~57.0.4` | Carga de fuentes |
| [expo-symbols](https://docs.expo.dev/versions/latest/sdk/symbols/) | `~57.0.3` | SF Symbols de Apple |
| [expo-status-bar](https://docs.expo.dev/versions/latest/sdk/status-bar/) | `~57.0.1` | Barra de estado |
| [expo-system-ui](https://docs.expo.dev/versions/latest/sdk/system-ui/) | `~57.0.4` | Colores del sistema |
| [expo-web-browser](https://docs.expo.dev/versions/latest/sdk/webbrowser/) | `~57.0.3` | Apertura de enlaces externos |
| Metro | (incluido) | Bundler de desarrollo |
| Hermes | (incluido) | Motor de JavaScript por defecto |

**Recursos adicionales del proyecto**

- **Navegación por tabs nativos** (`NativeTabs` de `expo-router/unstable-native-tabs`),
  con layout específico para web (`src/components/app-tabs.web.tsx`).
- **React Compiler** y **Typed Routes** habilitados en `app.json` (`experiments`).
- **CSS Modules** para estilos en web (`src/global.css`, `*.module.css`).
- Alias `@/` → `src/` configurado en `tsconfig.json`.

---

## ✅ Requisitos previos

### Obligatorio

| Requisito | Versión mínima | Notas |
| --- | --- | --- |
| [Node.js](https://nodejs.org/) | **22.13.0** | Requisito mínimo del Expo SDK 57. Verifica con `node -v` |
| npm | 9 o superior | Se distribuye con Node.js |
| [Git](https://git-scm.com/) | Cualquiera | Para clonar el repositorio |
| Un editor de código | — | Recomendado: [VS Code](https://code.visualstudio.com/) con la extensión [`expo.vscode-expo-tools`](https://marketplace.visualstudio.com/items?itemName=expo.vscode-expo-tools) |

### Opcional (solo si vas a compilar o probar en un dispositivo/emulador)

| Plataforma | Requisito | Notas |
| --- | --- | --- |
| **Android** | [Android Studio](https://developer.android.com/studio) + JDK + Android SDK (API 36) | Versión mínima de Android: **7.0** |
| **iOS** | [Xcode 26.4+](https://developer.apple.com/xcode/) (solo macOS) | Versión mínima de iOS: **16.4** |
| **Nube** | Cuenta de Expo + [EAS CLI](https://docs.expo.dev/eas/cli) | `npx eas-cli@latest login` — compila en la nube sin necesidad de Android Studio ni Xcode |

> **Expo Go vs. Development Build**
>
> Este proyecto usa **módulos nativos** (tabs nativos, Reanimated + Worklets,
> `expo-glass-effect`), por lo que para trabajar en iOS/Android con todas las
> funcionalidades necesitas una **development build**:
>
> ```bash
> npx expo install expo-dev-client
> npx expo run:android      # o: npx expo run:ios  (solo macOS)
> ```
>
> En la **web** (`npx expo start --web`) no hace falta nada de esto.
> Expo Go sirve solo como vista previa rápida y tiene limitaciones.

---

## 🚀 Clonar el proyecto

### 1. Clona el repositorio

```bash
git clone https://github.com/Terepotel/DesMov-Grupo31.git
cd DesMov-Grupo31
```

### 2. Instala las dependencias del proyecto

Instala lo que ya está definido en `package.json` / `package-lock.json`:

```bash
npm install
```

> Alternativa reproducible (usa exactamente las versiones del lockfile):
>
> ```bash
> npm ci
> ```

### 3. (Opcional) Configura las variables de entorno

El repositorio incluye la plantilla **`.env.example`**, que ya viene documentada con
todas las variables disponibles y sus valores de ejemplo. Solo cópiala y rellénala:

```bash
cp .env.example .env      # Linux / macOS / Git Bash
copy .env.example .env    # Windows (CMD / PowerShell)
```

Después, reinicia el servidor para que los cambios se apliquen:

```bash
npx expo start --clear
```

> `.env` está en `.gitignore` y **nunca** se sube al repositorio; `.env.example` sí se
> versiona como plantilla.

Ver la sección [Variables de entorno](#variables-de-entorno).

### 4. Inicia el proyecto

```bash
npx expo start
```

Desde la terminal you'll ver un código QR y atajos de teclado:

| Atajo | Acción |
| --- | --- |
| `a` | Abre en un dispositivo Android conectado |
| `i` | Abre en el simulador de iOS |
| `w` | Abre en el navegador (web) |
| `r` | Recarga la app |
| `J` | Abre React Native DevTools |
| `m` | Abre el menú de desarrollador |
| `?` | Muestra todos los comandos disponibles |

También puedes iniciar directamente en una plataforma:

```bash
npm run android   # npx expo start --android
npm run ios       # npx expo start --ios  (solo macOS)
npm run web       # npx expo start --web
```

---

## 🔐 Variables de entorno

Expo carga automáticamente los archivos `.env` del proyecto y expone al código JavaScript
**todas las variables con prefijo `EXPO_PUBLIC_`**.

### Cómo crearlas

El proyecto incluye una plantilla lista en **`.env.example`**, con todas las variables
disponibles, comentadas y explicadas. Cópiala a `.env` y rellena los valores:

```bash
cp .env.example .env      # Linux / macOS / Git Bash
copy .env.example .env    # Windows (CMD / PowerShell)
```

**Variables incluidas en la plantilla:**

| Variable | Ejemplo | Para qué sirve |
| --- | --- | --- |
| `EXPO_PUBLIC_APP_ENV` | `development` | Entorno actual: `development`, `staging` o `production` |
| `EXPO_PUBLIC_API_URL` | `https://api.example.com` | URL base del backend |
| `EXPO_PUBLIC_API_KEY` | *(tu clave)* | Token de acceso a la API |
| `EXPO_PUBLIC_ENABLE_DEV_TOOLS` | `true` | Muestra herramientas de desarrollo |
| `EXPO_PUBLIC_API_TIMEOUT_MS` | `10000` | Timeout de las peticiones, en milisegundos |

Además, la plantilla trae **comentadas** las variables de servicios externos por si el
proyecto los necesita más adelante: Supabase, Firebase, Sentry, Google Maps, autenticación
y notificaciones push. Solo descomenta y rellena las que uses.

Y úsalas en el código así:

```tsx
const apiUrl = process.env.EXPO_PUBLIC_API_URL;
```

### Archivos de entorno admitidos

| Archivo | Uso |
| --- | --- |
| `.env` | Valores por defecto (se puede commitear) |
| `.env.local` | Valores locales de tu máquina (**no** commitear) |
| `.env.development` / `.env.production` | Valores por entorno |

Estos archivos ya están ignorados por Git en `.gitignore`, **excepto `.env.example`**,
que sí se versiona como plantilla. Recuerda: `.env` nunca se sube.

### Reglas importantes

- ✅ La variable debe referenciarse **de forma estática** y con notación de punto:
  `process.env.EXPO_PUBLIC_API_URL`.
- ❌ No funciona la destructuración ni el acceso con corchetes:
  `process.env['EXPO_PUBLIC_API_URL']` ni `const { EXPO_PUBLIC_API_URL } = process.env`.
- 🚨 **Nunca guardes datos sensibles** (claves privadas, tokens, contraseñas) en variables
  `EXPO_PUBLIC_` quedan en texto plano dentro del bundle de la app y cualquiera puede leerlas.
- Al cambiar una variable, reinicia con `npx expo start --clear` para refrescar la caché.

### Variables de entorno propias de la CLI de Expo

| Variable | Descripción |
| --- | --- |
| `EXPO_NO_TELEMETRY=1` | Desactiva el envío de datos de telemetría anónima |
| `EXPO_NO_DOTENV=1` | Desactiva la carga de archivos `.env` |
| `EXPO_NO_CLIENT_ENV_VARS=1` | Desactiva la inserción de variables `EXPO_PUBLIC_` en el bundle |
| `EXPO_OFFLINE=1` | Omite todas las peticiones de red (útil sin internet) |
| `EDITOR` / `EXPO_EDITOR` | Editor que se abre al presionar `o` en la terminal |

---

## 📦 Instalar paquetes (regla del proyecto)

Como se recuerda en [la sección inicial](#importante-cómo-se-instalan-los-paquetes)
de este documento:

```bash
# ✅ CORRECTO — siempre con la CLI de Expo
npx expo install <nombrePaquete>

# ❌ INCORRECTO — nunca así
npm install <nombrePaquete>
```

### Casos habituales

```bash
# Agregar un paquete del SDK de Expo
npx expo install expo-camera expo-image-picker

# Agregar un paquete de desarrollo
npx expo install eslint-config-expo -- -D

# Quitar un paquete
npm uninstall <nombrePaquete>      # (quitar sí se hace con npm)

# Revisar si alguna versión quedó desactualizada
npx expo install --check

# Corregir automáticamente todas las versiones incompatibles
npx expo install --fix
```

### Después de instalar un paquete con código nativo

Debes **reconstruir** la app nativa:

```bash
npx expo prebuild --clean
npx expo run:android    # o: npx expo run:ios
```

Los directorios `android/` e `ios/` **no están en el repositorio a propósito**: se generan
automáticamente (Continuous Native Generation). **Nunca los crees o edites a mano**; la
configuración nativa va en `app.json` y en los *config plugins*.

---

## 🩺 Solución de problemas

### `npx expo-doctor` — el primer comando que debes intentar

Si **algo no funciona**, si la app no carga, si ves errores de dependencias o de
configuración, ejecuta:

```bash
npx expo-doctor
```

Este comando revisa el proyecto y te dice exactamente qué está mal (versiones
incompatibles, paquetes faltantes, configuración inválida, etc.).

Agrega `--verbose` para ver también las verificaciones que pasaron:

```bash
npx expo-doctor --verbose
```

> **Nota:** `npx expo-doctor` descarga el paquete `expo-doctor` la primera vez; requiere
> conexión a internet.

Un resultado típico en este proyecto muestra advertencias de **parche** (patch) en algunos
paquetes. Se corrigen con:

```bash
npx expo install --fix
```

### Otros pasos de diagnóstico

```bash
# Ver la configuración final que resuelve Expo (app.json + plugins)
npx expo config --type public

# Limpiar la caché del bundler y reiniciar
npx expo start --clear

# Reiniciar el servidor Metro
npx expo start --reset-cache

# Si la app quedó en un mal estado en iOS
rm -rf ios && npx expo prebuild -p ios --clean

# Si la app quedó en un mal estado en Android
rm -rf android && npx expo prebuild -p android --clean
```

### Validación de código antes de hacer commit

```bash
npx expo lint            # ESLint (la primera vez instala la configuración)
npx expo lint --fix      # corrige automáticamente lo corregible
npx tsc --noEmit         # verificación de tipos sin generar archivos
```

---

## 📂 Estructura del proyecto

```
DesMov-Grupo31/
├── app.json            # Configuración de la app (Expo)
├── .env.example        # Plantilla de variables de entorno (copiar a .env)
├── .env                # Variables reales (NO se versiona, está en .gitignore)
├── assets/             # Imágenes, iconos y splash
├── src/
│   ├── app/            # 🛣️ RUTAS — cada archivo es una pantalla
│   │   ├── _layout.tsx     # Layout raíz (ThemeProvider + AppTabs)
│   │   ├── index.tsx       # Pantalla "Home"
│   │   └── explore.tsx     # Pantalla "Explore"
│   ├── components/     # Componentes reutilizables
│   │   ├── app-tabs.tsx        # Tabs nativos (iOS/Android)
│   │   ├── app-tabs.web.tsx    # Tabs para web
│   │   └── ...
│   ├── constants/      # Constantes (theme.ts)
│   ├── hooks/          # Custom hooks
│   └── global.css      # Estilos globales de web
├── scripts/            # Scripts de mantenimiento
├── .vscode/            # Configuración de VS Code
├── AGENTS.md           # Guía de trabajo para IA / agentes
├── package.json        # Dependencias y scripts
└── tsconfig.json       # Configuración de TypeScript
```

### Agregar una pantalla nueva

Crea un archivo dentro de `src/app/`:

```
src/app/perfil.tsx
```

Se convierte automáticamente en la ruta `/perfil`. Para mostrarla como tab, agrega su
trigger en `src/components/app-tabs.tsx`:

```tsx
<NativeTabs.Trigger name="perfil">
  <NativeTabs.Trigger.Label>Perfil</NativeTabs.Trigger.Label>
</NativeTabs.Trigger>
```

Los archivos `_layout.tsx` definen los navegadores. Los archivos fuera de `src/app/`
(componentes, hooks, utilidades) **no son pantallas**.

---

## 📜 Scripts disponibles

| Comando | Descripción |
| --- | --- |
| `npx expo start` | Inicia el servidor de desarrollo |
| `npm run android` | Inicia y abre en Android |
| `npm run ios` | Inicia y abre en iOS (solo macOS) |
| `npm run web` | Inicia y abre en el navegador |
| `npx expo lint` | Lint con ESLint |
| `npx tsc --noEmit` | Verificación de tipos |
| `npx expo-doctor` | Diagnóstico completo del proyecto |
| `npx expo install <pkg>` | **Única forma autorizada de instalar paquetes** |
| `npx expo install --fix` | Corrige versiones incompatibles |
| `npx expo config` | Muestra la configuración resuelta |
| `npx expo prebuild --clean` | Regenera `ios/` y `android/` |
| `npm run reset-project` | Mueve el starter a `app-example/` y crea un `app/` vacío |

---

## 📚 Recursos oficiales

- [Documentación de Expo](https://docs.expo.dev/) — fundamental y guías
- [Expo Router](https://docs.expo.dev/router/introduction) — navegación por archivos
- [Expo CLI](https://docs.expo.dev/more/expo-cli) — referencia de comandos
- [Variables de entorno](https://docs.expo.dev/guides/environment-variables/)
- [Usar librerías](https://docs.expo.dev/workflow/using-libraries)
- [Development builds](https://docs.expo.dev/develop/development-builds/introduction)
- [EAS Build](https://docs.expo.dev/build/setup) — compilar en la nube
- [Tutorial de Expo](https://docs.expo.dev/tutorial/introduction/) — paso a paso

---

## 📄 Licencia

Ver [LICENSE](./LICENSE).
