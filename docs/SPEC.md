# Especificación de Requerimientos
## Gym Tracker – Temporada 2026

**Versión:** 1.0
**Fecha:** 12 de mayo de 2026
**Autor:** Omar Paché
**Asistente de diseño:** Claude

---

## 1. Resumen ejecutivo

**Gym Tracker** es una aplicación **web** personal, mobile-first, accesible desde Safari del iPhone XR y navegadores modernos. Tiene un único usuario (Omar) y un único método de acceso (contraseña). La fuente de verdad del plan de entrenamiento es una Google Sheet existente que la app **solo lee**; al finalizar cada sesión la app envía un resumen por email a `omar.pache@gmail.com` usando un webhook de Google Apps Script alojado en la cuenta Gmail del propio Omar. La app no escribe en la planilla ni guarda historial interno: el correo es el registro permanente.

El propósito es reemplazar el flujo manual actual (mirar la planilla en Drive, cronometrar con el reloj del teléfono y anotar pesos/repeticiones a mano) por una interfaz táctil optimizada para móvil con cronómetro general, descansos por serie y registro guiado de lo ejecutado. El usuario en algún momento del día pasará en limpio de forma manual en la planilla lo enviado al correo.

La unidad operativa de ejecución es la **serie**. La UI no debe usar la palabra inglesa `set`; debe mostrar `Serie 1`, `Serie 2`, etc. Cada serie muestra repeticiones, intensidad programada en formato `@ RPE N`, peso sugerido editable y descanso prescrito para esa serie.

La app no debe mostrar indicadores agregados de carga como volumen total, peso total, tonelaje diario o tonelaje semanal. El resumen se limita a: ejercicios del día, series ejecutadas, indicadores de bienestar, RPE general del día, comentario por ejercicio, comentario general y duración automática.

**No es una app nativa.** No hay Swift, no hay Xcode, no hay App Store. Es una web tradicional que el navegador puede opcionalmente "instalar" como ícono en el home.

## 2. Objetivos

### 2.1 Objetivo principal
Que Omar pueda llegar al gimnasio, abrir Gym Tracker en Safari de su iPhone XR, autenticarse con una contraseña, ver la sesión que le toca hoy según su planilla, ejecutarla con cronómetros integrados y enviar un resumen por correo al terminar — todo sin tocar la planilla original ni otra app.

### 2.2 Objetivos secundarios
- Operar a costo **estrictamente cero** al mes.
- Funcionar sobre tecnologías libres y estándares abiertos, desarrollables desde Linux.
- Ser instalable opcionalmente como Progressive Web App (PWA) en iPhone para abrirla desde el ícono de la pantalla de inicio.
- Mantener el estado del entreno en curso aunque la pestaña se cierre por accidente.
- Diseño moderno con identidad propia: tema oscuro de alto contraste con un acento verde neón.
- Registrar bienestar diario con una escala táctil de **1 a 5 estrellas**.
- Registrar duración real automáticamente desde que se completan/confirman los indicadores de bienestar y se presiona `Iniciar entrenamiento`, hasta `Finalizar entrenamiento y enviar`.

### 2.3 No-objetivos (fuera de alcance v1)
- Multiusuario, registro de cuentas, recuperación de password.
- Edición o escritura sobre la Google Sheet.
- Vista de historial de sesiones pasadas dentro de la app.
- Estadísticas, gráficos o analítica del progreso.
- Indicadores agregados de carga o volumen, incluyendo peso total diario, peso total semanal, tonelaje diario, tonelaje semanal o derivados equivalentes.
- Notificaciones push externas.
- Modo offline completo (la app necesita conexión para leer la planilla y enviar el email).
- Soporte para tablets, escritorio o navegadores antiguos.
- Registro de cardio/caminata complementaria; la planilla menciona "completar con caminata o trote suave", pero eso queda fuera del tracker.
- Aplicación nativa iOS o Android.
- RPE real por serie (si se muestra y es editable el RPE por ejercicio). La serie muestra la **intensidad programada** (`@ RPE 1–10`) y la sesión registra un único **RPE general del día** (sugerido y editable).

## 3. Actores

| Actor | Descripción | Permisos |
|-------|-------------|----------|
| **Omar (usuario único)** | Único humano que usa la app | Login con password, lectura de sesión del día, envío de resumen |
| **Worker backend** | Función serverless en Cloudflare | Lee Google Sheets, firma payload y llama al webhook de Apps Script |
| **Apps Script en Gmail de Omar** | Script alojado en la cuenta personal de Omar | Recibe POST firmado, envía email vía `MailApp.sendEmail()` |

---

## 4. Decisiones arquitectónicas confirmadas

| Decisión | Elección | Implicancia |
|----------|----------|-------------|
| Nombre del producto | **Gym Tracker** | Debe usarse en UI, README, título del proyecto y email automático |
| Naturaleza del producto | **Web app**, no nativa | Sin App Store, sin firma de código; deploy = push a Git |
| Escritura en la planilla | **No**, solo lectura | No requiere OAuth ni credenciales rotables; basta con una API key de Google |
| Pre-llenado de campos | **Sí**, valores del sheet como sugerencia editable | Reduce tecleo; usuario solo modifica lo que cambió |
| Terminología de ejecución | **Serie**, no `set` | UI, modelo de datos y email deben decir `serie` / `series` |
| Intensidad | `@ RPE 1–10` programado por serie | Se muestra como objetivo; no se pide RPE real por serie |
| Bienestar | 5 indicadores con escala de 1 a 5 estrellas | Sueño, energía, estrés, salud articular y recuperación muscular |
| RPE de sesión | Un único **RPE general del día** | Se solicita al cierre antes de enviar el email |
| Duración | Automática | Desde la confirmación de bienestar / `Iniciar entrenamiento` hasta `Finalizar entrenamiento y enviar` |
| Indicadores de carga agregada | **No se muestran** | Sin peso total, tonelaje, volumen diario/semanal ni sRPE |
| Historial en la app | **No**, el email es el archivo histórico | No requiere base de datos |
| Autenticación | Contraseña única, sin usuario | Hash bcrypt en variable de entorno; sesión con cookie firmada |
| Lectura de la planilla | Google Sheets API v4 con API key | El sheet debe permanecer compartido como "cualquiera con el enlace puede ver" |
| Envío de email | **Google Apps Script Web App** desde el Gmail de Omar | $0, sin OAuth en el worker, sin dominio propio, sin riesgo de spam |
| Hosting | Cloudflare Pages + Pages Functions | $0/mes |
| Dominio | Subdominio gratis `*.pages.dev` provisto por Cloudflare | $0/año |
| Sistema de diseño | Oscuro con acento verde neón (#39FF14) | Ver sección 8 |
| Controles del overlay de descanso | `Saltar`, `Pausa/Reanudar`, `+30s` | Sin `-30s` ni presets |

## 5. Stack técnico

### 5.1 Frontend
- **HTML + CSS + JavaScript** puro como base.
- **Preact** (3 KB) más **HTM** (sin build step) para reactividad. Alternativa: vanilla JS con un patrón de componentes manual.
- **CSS personalizado** con variables CSS y `safe-area-inset-*` para respetar el notch del iPhone XR. Sin frameworks de UI.
- **Vite** como bundler (genera un único `index.html` + assets minificados).
- **Web APIs:** Wake Lock API (mantener pantalla encendida), Vibration API, Web Audio API (beep al fin del descanso), localStorage (estado de la sesión en curso).
- **PWA:** manifest.json + service worker mínimo para shell + `apple-touch-icon` para iOS.

### 5.2 Backend
- **Cloudflare Pages Functions** (runtime Workers, V8 isolates).
- **Hono** como microframework de routing (~12 KB).
- **jose** para firmar/verificar el JWT de sesión.
- **bcryptjs** para validar el hash del password.
- **HMAC-SHA256 nativo** (Web Crypto API, ya disponible en Workers) para firmar el payload al Apps Script.

### 5.3 Apps Script (envío de email)
Pequeño script alojado en `script.google.com`, vinculado al Gmail personal de Omar. Publicado como Web App con:
- **Ejecutar como:** Yo (omar.pache@gmail.com)
- **Quién tiene acceso:** Cualquiera con el enlace

El script valida un HMAC compartido en cada request antes de enviar el mail. La URL del webhook actúa como secreto adicional (solo el worker la conoce).

### 5.4 Servicios externos
| Servicio | Uso | Cuota gratuita |
|----------|-----|----------------|
| Google Sheets API v4 | Leer la planilla | 300 lecturas/min/proyecto |
| Google Apps Script + MailApp | Enviar el email | 100 emails/día desde Gmail gratis |
| Cloudflare Pages | Hosting estático + funciones | 500 builds/mes, requests ilimitados |
| Cloudflare Workers (en Pages) | Backend serverless | 100.000 requests/día |

### 5.5 Costos esperados
| Concepto | Costo mensual estimado |
|----------|------------------------|
| Cloudflare Pages + Functions | USD 0 |
| Google Sheets API | USD 0 |
| Google Apps Script + Gmail | USD 0 |
| Dominio | USD 0 (subdominio `*.pages.dev`) |
| **Total** | **USD 0,00 / mes** |

---

## 6. Entorno de desarrollo (Linux)

Todo el stack es nativo en Linux. Asumimos una distribución reciente (Ubuntu/Fedora/Arch).

### 6.1 Herramientas obligatorias

| Herramienta | Instalación | Uso |
|-------------|-------------|-----|
| **Node.js LTS** (≥20) | Vía `nvm`: `nvm install --lts` | Runtime de scripts, Vite, Wrangler |
| **Git** | `apt install git` | Versionado |
| **Wrangler CLI** | `npm i -g wrangler` | Dev local + deploy a Cloudflare |
| **Editor** | VS Code | — |

### 6.2 Flujo local

```bash
# Setup inicial
git clone <repo>
cd gym-tracker
npm install
cp .env.example .env.local
# Editar .env.local con secrets de dev

# Dev server (recarga en caliente)
npm run dev
# Abre http://localhost:8788

# Build de producción
npm run build

# Deploy manual (alternativa al deploy automático por push)
wrangler pages deploy ./dist
```

### 6.3 Pruebas en el iPhone XR real
Cloudflare Pages genera una URL preview en cada push (`<hash>.<proyecto>.pages.dev`). Para probar en el iPhone:
1. Hacer commit + push de la rama de trabajo.
2. Esperar ~30 s a que el build termine.
3. Abrir la URL preview en Safari del iPhone (escaneando QR generado con `qrencode` desde la terminal, o copiándola).
4. Para debugging avanzado: usar `eruda` (consola embebida en el bundle solo en modo dev) ya que Safari de macOS no está disponible en Linux.

### 6.4 Repositorio
Repositorio público en GitHub. Estructura propuesta:

```
gym-tracker/
├── README.md
├── package.json
├── vite.config.js
├── wrangler.toml
├── .env.example
├── public/
│   ├── manifest.json
│   ├── icon-192.png
│   ├── icon-512.png
│   └── apple-touch-icon.png
├── src/
│   ├── main.js
│   ├── app.jsx
│   ├── components/
│   ├── styles.css
│   └── lib/
│       ├── timer.js
│       ├── storage.js
│       └── api.js
├── functions/
│   ├── _middleware.js
│   ├── api/
│   │   ├── auth/login.js
│   │   ├── auth/logout.js
│   │   ├── workout/today.js
│   │   ├── workout/by-date.js
│   │   ├── workout/submit.js
│   │   └── health.js
│   └── lib/
│       ├── sheets.js
│       ├── parser.js
│       ├── email.js
│       └── auth.js
└── apps-script/
    └── webhook.gs   # Para pegar manualmente en script.google.com
```

---

## 7. Modelo de datos

### 7.1 Estructura observada de la planilla origen

La planilla tiene una hoja por bloque de la periodización:

- `Contexto`, `Tablas de Referencia`, `Selección de Ejercicios` (no se consumen).
- `Mesociclo 1 Adaptación` … `Mesociclo 9 Mantención` (la app las recorre).
- `Semana de PR` (también se considera entrenable).

Dentro de cada hoja de mesociclo:
- **Fila 1:** etiqueta `Semana N` cada 11 columnas, empezando en la columna 4.
- **Fila 2:** encabezado del día con el patrón `Día N - Nombre: WeekdayName DD/MM/AAAA` (ej.: `Día 1 - Piernas A:  Lunes 11/05/2026`).
- **Fila 3:** texto de bienestar pre-entreno. Para Gym Tracker se consumen cinco indicadores: `Sueño`, `Energía`, `Estrés`, `Salud articular` y `Recuperación muscular`, más una nota libre opcional.
- **Fila 4:** encabezados de tabla esperados: `Orden | Ejercicio | Series | Repeticiones | RPE | Peso (kg) | Descanso entre series | Comentarios del ejercicio`. Si la planilla conserva columnas heredadas de agregados de carga, el parser debe ignorarlas.
- **Filas 5–10 (típico):** ejercicios del día.
- **Fila siguiente:** campos de cierre: duración prescrita opcional, RPE global sugerido opcional y comentario post-entreno. La duración real de Gym Tracker no se edita: se calcula automáticamente por cronómetro.

Los días dentro de una misma semana se repiten en bloques verticales de ~12 filas (Día 1 arriba, luego Día 2, Día 3, Día 4). Los ejercicios sin carga (abdominales, etc.) usan el carácter `-` en peso.

### 7.2 Algoritmo de resolución de "día de hoy"

```
1. Calcular fecha local en zona America/Santiago.
2. Para cada hoja cuyo nombre empieza con "Mesociclo" o sea "Semana de PR":
   a. Leer las filas 1 y 2 completas (todas las columnas usadas).
   b. Por cada bloque de "Semana N" (columnas 4, 15, 26, ...):
      - Iterar Día 1..4 (offsets verticales conocidos).
      - Extraer la fecha del encabezado del día con regex
        /(\d{2})\/(\d{2})\/(\d{4})/.
      - Si coincide con hoy → leer el bloque completo (bienestar,
        tabla de ejercicios, campos de cierre) y devolverlo.
3. Si no hay coincidencia → devolver { tipo: "descanso", proximo: <next match> }.
```

### 7.3 Tipos de datos internos (TypeScript)

```ts
type WorkoutDay = {
  fecha: string;             // ISO YYYY-MM-DD
  mesociclo: string;         // "Mesociclo 2 Volumen"
  semana: number;            // 1..N
  diaNumero: number;         // 1..4
  diaNombre: string;         // "Piernas A"
  bienestarSugerido: BienestarPre;
  ejercicios: Ejercicio[];
  rpeGlobalSugerido?: number;
};

type BienestarPre = {
  sueno: number;                 // 1..5 estrellas
  energia: number;               // 1..5 estrellas
  estres: number;                // 1..5 estrellas, 1 = muy alto, 5 = muy bajo
  saludArticular: number;        // 1..5 estrellas
  recuperacionMuscular: number;  // 1..5 estrellas
  nota?: string;
};

type Ejercicio = {
  orden: number;
  nombre: string;
  seriesProgramadas: SerieProgramada[];
  comentarioSugerido?: string;
};

type SerieProgramada = {
  numero: number;                    // 1, 2, 3...
  repeticionesProgramadas: number | string; // a veces "8-10"
  rpeProgramado: number | null;      // intensidad objetivo 1..10, null si "—"
  pesoSugeridoKg: number | null;     // editable; null si peso corporal / "—"
  descansoPrescritoSeg: number;      // parseado desde "1,5 min" → 90
};

type SesionCompletada = {
  fecha: string;
  inicioISO: string;          // capturado al confirmar bienestar e iniciar entrenamiento
  finISO: string;             // capturado al presionar "Finalizar entrenamiento y enviar"
  duracionTotalSeg: number;   // calculado automáticamente, no editable
  bienestarPre: BienestarPre;
  ejerciciosEjecutados: EjercicioEjecutado[];
  rpeGeneralDia: number;      // 1..10 obligatorio
  comentarioGeneralDia: string;
};

type EjercicioEjecutado = {
  orden: number;
  nombre: string;
  series: SerieEjecutada[];
  comentario: string;
};

type SerieEjecutada = {
  numero: number;
  reps: number;
  rpeProgramado: number | null;
  pesoKg: number | null;
  descansoPrescritoSeg: number;
  completadoEn: string;
};
```

### 7.4 Regla de expansión de series

Si la planilla entrega `Series = 4`, `Repeticiones = 8`, `RPE = 8`, `Peso = 60` y `Descanso = 2 min` a nivel de ejercicio, el parser debe expandirlo en cuatro objetos `SerieProgramada`:

```json
[
  { "numero": 1, "repeticionesProgramadas": 8, "rpeProgramado": 8, "pesoSugeridoKg": 60, "descansoPrescritoSeg": 120 },
  { "numero": 2, "repeticionesProgramadas": 8, "rpeProgramado": 8, "pesoSugeridoKg": 60, "descansoPrescritoSeg": 120 },
  { "numero": 3, "repeticionesProgramadas": 8, "rpeProgramado": 8, "pesoSugeridoKg": 60, "descansoPrescritoSeg": 120 },
  { "numero": 4, "repeticionesProgramadas": 8, "rpeProgramado": 8, "pesoSugeridoKg": 60, "descansoPrescritoSeg": 120 }
]
```

El usuario puede editar repeticiones y peso de cada serie. La intensidad `@ RPE` se muestra como objetivo programado y no se edita durante la sesión, salvo que el diseño futuro agregue explícitamente edición de programación.

## 8. Sistema de diseño visual

Identidad: oscuro, minimalista, alto contraste, con un único acento verde neón que se reserva para indicar acción y estado activo. Nada de gradientes recargados, sombras decorativas o efectos de glow exagerados; el contraste hace el trabajo.

### 8.1 Paleta de colores

| Token | Hex | Uso |
|-------|-----|-----|
| `--bg-base` | `#0A0A0A` | Fondo de pantalla |
| `--bg-elev-1` | `#141414` | Tarjetas de ejercicio |
| `--bg-elev-2` | `#1F1F1F` | Inputs, selectores de estrellas, overlays |
| `--bg-elev-3` | `#2A2A2A` | Hover sobre elementos elevados |
| `--accent` | `#39FF14` | Acción primaria, serie completada, cronómetros activos |
| `--accent-dim` | `#2BB80F` | Estado pressed / hover sobre acento |
| `--accent-soft` | `rgba(57,255,20,0.12)` | Fondo sutil de elementos activos |
| `--text-primary` | `#FFFFFF` | Texto principal |
| `--text-secondary` | `#A0A0A0` | Subtítulos, metadatos |
| `--text-tertiary` | `#6B6B6B` | Placeholders, deshabilitado |
| `--danger` | `#FF453A` | Errores, eliminar |
| `--warning` | `#FFD60A` | Advertencias |
| `--border-subtle` | `rgba(255,255,255,0.08)` | Bordes neutros |
| `--border-accent` | `rgba(57,255,20,0.4)` | Bordes de elementos enfocados/activos |

Regla de uso del acento: el verde neón se usa con moderación. En una pantalla cualquiera no debería ocupar más del 10–15% del área pintada. Botón primario, cronómetro corriendo, serie marcada como hecha, borde de foco.

### 8.2 Tipografía

- **Familia:** `-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif` (sistema en iOS; cae a SF Pro o Inter en otros).
- **Familia mono (cronómetros):** `"SF Mono", "JetBrains Mono", "Menlo", monospace`, con `font-variant-numeric: tabular-nums` para que los dígitos no salten.

| Rol | Tamaño | Peso |
|-----|--------|------|
| Display (cronómetro general) | 40 px | 600 |
| Display (cronómetro descanso) | 88 px | 700 |
| Title (encabezados de pantalla) | 22 px | 600 |
| Heading (nombre de ejercicio) | 18 px | 600 |
| Body | 16 px | 400 |
| Body emphasized | 16 px | 600 |
| Caption | 13 px | 400 |
| Number input (peso/reps) | 24 px | 600, tabular |

### 8.3 Espaciado y geometría
- Escala de spacing: 4, 8, 12, 16, 20, 24, 32, 48 px.
- Radios: `8px` chips, `12px` botones e inputs, `16px` cards, `24px` overlays grandes, `999px` pills.
- Padding de página: 16 px laterales, respetando `env(safe-area-inset-*)`.
- Tamaño táctil mínimo: 44×44 pt (Apple HIG).

### 8.4 Componentes clave

**Botón primario:** fondo `--accent`, texto `#0A0A0A` peso 600, altura 56 px, radio 12 px, ancho completo. En press: fondo `--accent-dim`. Sin sombras.

**Botón secundario:** fondo transparente, texto blanco, borde 1 px `--border-subtle`, altura 48 px, radio 12 px.

**Botón ghost:** sin borde, texto secundario, para acciones terciarias.

**Input numérico:** fondo `--bg-elev-2`, texto blanco 24 px tabular, borde 1 px transparente, foco → borde 1 px `--accent`. Sin spinners nativos; controles `−` / `+` propios a los costados.

**Selector de estrellas 1–5:** cinco botones táctiles de al menos 44×44 pt. Las estrellas seleccionadas usan `--accent`; las no seleccionadas usan `--text-tertiary`. Debe tener label visible y `aria-label` por valor. Para `estrés`, la escala es de bienestar: 1 estrella = estrés muy alto, 5 estrellas = estrés muy bajo.

**Slider 1–10 para RPE general:** track 4 px `--bg-elev-2`, parte llena `--accent`, thumb circular 24 px blanco, número grande al lado en `--accent` cuando se está arrastrando.

**Card de ejercicio:** fondo `--bg-elev-1`, radio 16 px, borde izquierdo 3 px `--accent` cuando el ejercicio está activo; borde izquierdo transparente cuando está colapsado.

**Fila de serie:**
- Pendiente: etiqueta `Serie N`, inputs visibles para repeticiones y peso, intensidad programada visible como `@ RPE N`, descanso visible, botón `Hecho` secundario.
- En progreso: highlight sutil con `--accent-soft` de fondo.
- Completada: `Serie N` y datos ejecutados en `--accent`, botón reemplazado por un check.

**Cronómetro general (header sticky):** fondo `--bg-base` con borde inferior `--border-subtle`, dígitos mono en `--accent` mientras corre. Permanece detenido durante la pantalla de bienestar y empieza solo cuando los indicadores de bienestar están completos y se presiona `Iniciar entrenamiento`. Se detiene al presionar `Finalizar entrenamiento y enviar`.

**Overlay de descanso:** fondo `--bg-base` a pantalla completa con padding 32 px, cuenta regresiva mono 88 px en `--accent`. Al llegar a 0 el número parpadea (alternar `--accent` / `--danger` a 1 Hz) hasta que se interactúe.

**Animaciones:** mínimas. Transiciones de 150 ms `ease-out` para hover/press. Cambios de color en 200 ms. Sin animaciones de entrada elaboradas.

## 9. Casos de uso

| ID | Caso de uso | Actor | Descripción breve |
|----|-------------|-------|-------------------|
| CU-01 | Iniciar sesión | Omar | Ingresa password, recibe cookie de sesión válida 2 días |
| CU-02 | Cerrar sesión | Omar | Invalida la cookie y vuelve al login |
| CU-03 | Ver entreno del día | Omar | La app consulta la planilla y muestra los ejercicios de hoy |
| CU-04 | Día de descanso | Omar | La app indica que hoy no toca y muestra el próximo entreno |
| CU-05 | Registrar bienestar pre-entreno | Omar | Califica sueño, energía, estrés, salud articular y recuperación muscular con 1–5 estrellas + comentario opcional |
| CU-06 | Iniciar el cronómetro general | Omar | Arranca solo después de completar los indicadores de bienestar y presionar `Iniciar entrenamiento`; corre hasta `Finalizar entrenamiento y enviar` |
| CU-07 | Ejecutar una serie | Omar | Anota repeticiones/peso reales, ve `@ RPE` programado, marca `Hecho`; se inicia descanso |
| CU-08 | Cronometrar descanso | Sistema | Cuenta regresiva desde el descanso prescrito para esa serie; vibra/suena al terminar |
| CU-09 | Saltar / extender / pausar descanso | Omar | Botones `Saltar`, `Pausa/Reanudar`, `+30s` |
| CU-10 | Comentar ejercicio | Omar | Ingresa comentario opcional por ejercicio, se muestra el RPE programado del ejercicio y se puede eitar |
| CU-11 | Finalizar sesión | Omar | se muesra el RPE programado general del día y se puede editar y se permite ingresar un comentario general |
| CU-12 | Enviar email | Sistema | Al presionar `Finalizar entrenamiento y enviar`, calcula duración, firma payload y despacha el email vía Apps Script |
| CU-13 | Recuperar sesión interrumpida | Omar | Al volver tras cierre accidental, la app restaura el estado desde localStorage |

## 10. Requisitos funcionales (RF)

**RF-01.** La app debe servirse exclusivamente por HTTPS.

**RF-02.** La pantalla de login debe pedir un único campo de password y no debe exponer ningún recurso protegido hasta que el password sea validado.

**RF-03.** Tras un login exitoso, el backend debe emitir una cookie `HttpOnly`, `Secure`, `SameSite=Strict` con un JWT firmado, con expiración de 30 días.

**RF-04.** Tras tres intentos fallidos consecutivos desde la misma IP en 10 minutos, el endpoint de login debe retornar 429 durante 5 minutos.

**RF-05.** La app debe consultar la planilla cada vez que se entre a la pantalla principal (sin caché persistente), garantizando que cualquier ajuste manual reciente en la planilla se refleje.

**RF-06.** La pantalla principal debe identificar la sesión de hoy resolviendo la fecha local del usuario (zona horaria America/Santiago) contra los encabezados de día de las hojas de mesociclo.

**RF-07.** Si hoy es un día sin entreno programado, la app debe mostrar el mensaje correspondiente y el próximo entreno previsto, con un botón secundario `Iniciar otro día` que permita elegir manualmente cualquier día programado dentro del mesociclo activo.

**RF-08.** La pantalla de bienestar pre-entreno debe mostrar 5 indicadores calificables de 1 a 5 estrellas: sueño, energía, estrés, salud articular y recuperación muscular. Debe incluir un campo de comentario libre opcional. Los valores deben venir preseleccionados desde la planilla cuando existan; si faltan, usar 3 estrellas como valor neutro.

**RF-09.** El cronómetro general no debe correr mientras se está completando la pantalla de bienestar. Debe arrancar únicamente cuando los 5 indicadores de bienestar estén completos y Omar presione `Iniciar entrenamiento`. Desde ese momento se muestra en formato `HH:MM:SS`, visible permanentemente en el header sticky, y solo se detiene al presionar `Finalizar entrenamiento y enviar`.

**RF-10.** Cada ejercicio debe renderizarse con su orden, nombre, comentario opcional y tantas filas de **serie** como indique la planilla. La interfaz debe usar `Serie 1`, `Serie 2`, etc.; nunca `Set 1` ni `set`.

**RF-11.** Cada serie debe mostrar, en este orden lógico: número de serie, repeticiones programadas/editables, intensidad programada en formato `@ RPE N` (1–10), peso sugerido editable y descanso prescrito para esa serie.

**RF-12.** Para ejercicios con peso `—` en la planilla (peso corporal), el input de peso debe ocultarse y la serie debe mostrar `peso corporal` o equivalente.

**RF-13.** El botón `Hecho` de cada serie debe: (a) bloquear los inputs de la serie, (b) registrar la marca de tiempo, (c) iniciar automáticamente la cuenta regresiva de descanso usando el valor prescrito convertido a segundos.

**RF-14.** El cronómetro de descanso debe mostrarse como un overlay grande con cuenta regresiva en `MM:SS`, y debe ofrecer exactamente tres acciones: `Saltar`, `Pausa/Reanudar`, `+30s`.

**RF-15.** Al llegar a 0, el cronómetro de descanso debe disparar: (a) vibración del dispositivo (patrón corto-largo-corto), (b) un beep audible breve generado con Web Audio API (puede silenciarse desde un toggle global), (c) un cambio visual evidente (parpadeo entre `--accent` y `--danger`).

**RF-16.** El cronómetro general no debe detenerse mientras corre el cronómetro de descanso.

**RF-17.** La app debe solicitar Wake Lock al iniciar el entreno para mantener la pantalla encendida, y liberarlo al finalizar la sesión o al cerrar la app.

**RF-18.** Al completar las series de un ejercicio, se debe permitir ingresar un comentario opcional para ese ejercicio. No se solicita RPE final por ejercicio.

**RF-19.** La pantalla de cierre debe mostrar duración calculada automáticamente, RPE general del día (slider 1–10 obligatorio), comentario general del día (textarea) y un resumen no agregado de los ejercicios ejecutados. No debe mostrar peso total, volumen total, indicadores diarios/semanales de carga ni sRPE.

**RF-20.** El botón primario de cierre debe llamarse `Finalizar entrenamiento y enviar`. Al presionarlo, la app debe capturar `finISO`, calcular `duracionTotalSeg`, llamar al endpoint del backend con el payload completo y disparar el envío del email.

**RF-21.** El backend debe firmar el payload con HMAC-SHA256 usando el secreto compartido con el Apps Script, hacer POST al webhook publicado, y traducir la respuesta JSON al cliente. El destinatario es `omar.pache@gmail.com` (hardcoded en el Apps Script o pasado en el payload).

**RF-22.** Si el envío del email falla (HTTP no-2xx desde el Apps Script, timeout, o JSON con `ok: false`), la app debe mostrar el error específico y permitir reintentar sin perder los datos ingresados ni recalcular el inicio de la sesión.

**RF-23.** El estado del entreno en curso (bienestar pre, series completadas, pesos/repeticiones, comentarios) debe persistirse en `localStorage` después de cada acción y restaurarse al abrir la app si la sesión no fue cerrada con éxito.

**RF-24.** Debe existir un botón `Cerrar sesión` accesible desde el menú/header de cualquier pantalla autenticada.

**RF-25.** Toda la interfaz debe respetar el sistema de diseño definido en la sección 8: tema oscuro `--bg-base`, acento `--accent`, tipografía sistema, geometría y componentes especificados.

## 11. Requisitos no funcionales (RNF)

**RNF-01 – Plataforma objetivo.** Debe funcionar sin defectos visuales o de interacción en Safari iOS 17+ sobre iPhone XR (414×896 pt, notch superior, gesto inferior). Otros navegadores son "best effort", pero no se invierte tiempo extra para soportarlos en v1. **El producto es una web app — no requiere distribución por App Store ni firma de código.**

**RNF-02 – Tamaño táctil.** Todos los controles interactivos deben tener al menos 44×44 pt de área tappable.

**RNF-03 – Tiempo de carga.** Time to interactive en 4G chileno ≤ 2 s desde el cold start del worker; bundle JS ≤ 80 KB minificado y comprimido.

**RNF-04 – Disponibilidad.** ≥ 99% mensual (limitado por SLA de Cloudflare y Google Apps Script). No requiere alta disponibilidad estricta porque el uso es solo a las ~6 am de lunes a viernes.

**RNF-05 – Seguridad.** Ver sección 15. Sin secretos en el bundle del cliente. CSP estricta. HSTS activo.

**RNF-06 – Privacidad.** No se persiste información del usuario fuera del email enviado y del localStorage del propio dispositivo. No hay analytics, ni cookies de terceros, ni tracking.

**RNF-07 – Mantenibilidad.** Código en un único repositorio, una sola persona como mantenedor. README con instrucciones de despliegue. Variables de entorno documentadas.

**RNF-08 – Internacionalización.** Español neutro latinoamericano. No se requiere multi-idioma. Sin "vos", "acá", "che" ni argentinismos.

**RNF-09 – Accesibilidad.** Labels asociados a inputs, contraste WCAG AA (el acento `#39FF14` sobre `#0A0A0A` da ratio de 17:1, sobre-cumple AAA), foco visible. Soporte de VoiceOver no es prioritario en v1 pero no debe romperse.

**RNF-10 – Robustez ante cambios en la planilla.** Si una hoja de mesociclo no tiene el formato esperado, el parser debe ignorarla silenciosamente y seguir buscando, en vez de hacer crashear la app.

**RNF-11 – Entorno de desarrollo libre.** Todo el flujo de desarrollo (editor, runtime, CLI, bundler, deploy) debe ejecutarse en Linux sin licencias propietarias.

---

## 12. Flujos UX por pantalla

Convención: el header sticky mide ~56 pt y respeta `safe-area-inset-top`. El contenido tiene padding lateral de 16 pt. Los botones primarios son del ancho completo menos 32 pt de padding. Las pantallas siguen el sistema de diseño de la sección 8.

### 12.1 Login

```
┌─────────────────────────────┐
│                              │
│         💪                   │
│       Gym Tracker            │
│                              │
│  ┌──────────────────────┐    │
│  │ Di amigo y entra     │    │
│  │ • • • • • • • •      │    │
│  └──────────────────────┘    │
│                              │
│  ┌──────────────────────┐    │
│  │       Entrar         │ ←  │ (verde neón)
│  └──────────────────────┘    │
│                              │
│  (mensaje de error si falla) │
└─────────────────────────────┘
```

### 12.2 Resumen del día (con entreno)

```
┌─────────────────────────────┐
│ Lun 11 May · Mes. 2 Volumen │ ← header sticky
│ Semana 7 · Día 1 - Piernas A │Contraseña
├─────────────────────────────┤
│  Ejercicios de hoy           │
│  1. Sentadilla libre         │
│     5 series · 6 reps @ RPE8 │
│     Peso sugerido: 60 kg     │
│  2. Peso muerto rumano       │
│     3 series · 9 reps @ RPE8 │
│     Peso sugerido: 50 kg     │
│  3. Prensa de piernas        │
│     3 series · 9 reps @ RPE8 │
│     Peso sugerido: 110 kg    │
│  4. Elevaciones de talón     │
│     3 series · 15 reps @ RPE8│
│     Peso sugerido: 60 kg     │
│  5. Crunch abdominal         │
│     3 series · 26 reps @ RPE7│
│     Peso corporal            │
│                              │
│  [  Comenzar entrenamiento ] │ ← verde neón
└─────────────────────────────┘
```

### 12.3 Resumen del día (día de descanso)

```
┌─────────────────────────────┐
│ Mié 13 May                   │
├─────────────────────────────┤
│  🛌 Hoy es día de descanso   │
│                              │
│  Próximo entreno:            │
│  Jue 14 May · Día 3 - TorsoB │
│                              │
│  [   Ver / iniciar otro día] │
└─────────────────────────────┘
```

### 12.4 Bienestar pre-entreno

```
┌─────────────────────────────┐
│ ◀ Bienestar pre-entreno      │
├─────────────────────────────┤
│  Sueño                       │
│  ★ ★ ★ ★ ☆   4/5            │
│                              │
│  Energía                     │
│  ★ ★ ★ ☆ ☆   3/5            │
│                              │
│  Estrés                      │
│  ★ ★ ★ ★ ☆   4/5            │
│  1 = muy alto · 5 = muy bajo │
│                              │
│  Salud articular             │
│  ★ ★ ★ ★ ★   5/5            │
│                              │
│  Recuperación muscular       │
│  ★ ★ ★ ★ ☆   4/5            │
│                              │
│  Comentario bienestar        │
│  [                         ] │
│                              │
│  [  Iniciar entrenamiento  ] │ ← habilitado al completar bienestar; dispara cronómetro
└─────────────────────────────┘
```

### 12.5 Entrenamiento en curso

```
┌─────────────────────────────┐
│ 🕒 00:14:32  ·  D1 Piernas A │ ← cronómetro en verde neón
├─────────────────────────────┤
│ ▌1. Sentadilla libre         │ ← borde izq. neón = activo
│  Objetivo: 5 series          │
│                              │
│  Serie 1 ✓ 6 reps @ RPE8     │ ← verde neón
│          60 kg · desc 3 min  │
│  Serie 2 ✓ 6 reps @ RPE8     │
│          60 kg · desc 3 min  │
│  Serie 3 ▸ [ 6 ] @ RPE8      │
│            Peso [ 60 kg ]    │
│            Descanso 3 min    │
│            [    Hecho     ]  │
│  Serie 4    6 reps @ RPE8    │
│            Peso sugerido 60  │
│  Serie 5    6 reps @ RPE8    │
│            Peso sugerido 60  │
│                              │
│  Comentario del ejercicio    │
│  [                         ] │
│                              │
│  [   Siguiente ejercicio   ] │
│                              │
│  2. Peso muerto rumano       │ ← colapsado
│  3. Prensa de piernas        │
│  4. Elevaciones de talón     │
│  5. Crunch abdominal         │
└─────────────────────────────┘
```

### 12.6 Overlay de descanso

```
┌─────────────────────────────┐
│                              │
│         Descanso              │
│                              │
│                              │
│                              │
│         02:14                │ ← mono 88px verde neón
│                              │
│                              │
│                              │
│  [Saltar] [Pausa] [+30s]     │
│                              │
└─────────────────────────────┘
```

### 12.7 Cierre y envío

```
┌─────────────────────────────┐
│ ◀ Finalizar sesión           │
├─────────────────────────────┤
│  Duración automática         │
│  01:18:42                    │
│                              │
│  RPE general del día         │
│  ○━○━○━○━○━○━○━●━○━○    8    │
│                              │
│  Comentario general del día  │
│  [                         ] │
│  [                         ] │
│                              │
│  Resumen de ejercicios       │
│  1. Sentadilla: 5 series     │
│  2. Peso muerto: 3 series    │
│  ...                         │
│                              │
│  [Finalizar entreno y enviar]│ ← verde neón
└─────────────────────────────┘
```

### 12.8 Confirmación

```
┌─────────────────────────────┐
│        ✓ Enviado             │
│                              │
│  Resumen enviado a           │
│  omar.pache@gmail.com        │
│                              │
│  [   Volver al inicio      ] │
└─────────────────────────────┘
```

## 13. Diseño del email de resumen

**De:** `Omar Paché <omar.pache@gmail.com>` (es Omar enviándose a sí mismo vía Apps Script)  
**Para:** `omar.pache@gmail.com`  
**Asunto:** `Gym Tracker · Lun 11/05 · Día 1 - Piernas A`

**Cuerpo HTML (mockup):**

```
┌────────────────────────────────────────────────┐
│  Gym Tracker                                    │
│  Resumen de entrenamiento                       │
│  Lunes 11 de mayo de 2026                       │
│  Mesociclo 2 (Volumen) · Semana 7 · Día 1      │
│                                                 │
│  Duración automática: 1h 18m 42s                │
│  Medida desde confirmar bienestar hasta envío    │
│  RPE general del día: 8                         │
│                                                 │
│  Bienestar pre-entreno                          │
│  Sueño ★★★★☆ · Energía ★★★☆☆                  │
│  Estrés ★★★★☆ · Articular ★★★★★               │
│  Recuperación muscular ★★★★☆                   │
│  Comentario bienestar: —                        │
│                                                 │
│  Ejercicios del día                             │
│  ┌───────────────────────────────────────────┐  │
│  │ 1. Sentadilla libre (barra baja)          │  │
│  │    Serie 1: 6 reps @ RPE8 · 60 kg · 3min  │  │
│  │    Serie 2: 6 reps @ RPE8 · 60 kg · 3min  │  │
│  │    Serie 3: 6 reps @ RPE8 · 60 kg · 3min  │  │
│  │    Serie 4: 5 reps @ RPE8 · 60 kg · 3min  │  │
│  │    Serie 5: 6 reps @ RPE8 · 57.5 kg · 3min│  │
│  │    Comentario: Última serie bajé peso...  │  │
│  └───────────────────────────────────────────┘  │
│  ... (un bloque por ejercicio) ...              │
│                                                 │
│  Comentario general del día                     │
│  "Buena sesión, terminé con energía."          │
│                                                 │
│  Enviado automáticamente por Gym Tracker.        │
└────────────────────────────────────────────────┘
```

El email debe ser inline-styled (sin CSS externo), responsive (max-width 600 px), legible en Gmail web y Gmail iOS. No debe incluir indicadores agregados de peso/carga, gráficos ni rankings. La duración informada corresponde al intervalo entre confirmar/completar bienestar e iniciar entrenamiento, y finalizar/enviar la sesión. Como es Gmail enviándose a sí mismo, **no hay riesgo de spam** y los estilos pasan los filtros sin problema.

## 14. Contrato de API

Todas las rutas viven bajo `/api/*`. Todas las respuestas son JSON. Todas requieren cookie de sesión válida excepto `POST /api/auth/login`.

| Método | Ruta | Body | Respuesta exitosa | Errores |
|--------|------|------|-------------------|---------|
| POST | `/api/auth/login` | `{ password: string }` | 200 + Set-Cookie | 401 password incorrecto, 429 rate-limit |
| POST | `/api/auth/logout` | — | 204 + cookie expirada | — |
| GET | `/api/workout/today` | — | `WorkoutDay` o `{ tipo: "descanso", proximo: ... }` | 502 si falla Sheets, 503 si la planilla no parsea |
| GET | `/api/workout/by-date?date=YYYY-MM-DD` | — | `WorkoutDay` | 404 si no hay entreno ese día |
| POST | `/api/workout/submit` | `SesionCompletada` | `{ enviado: true, messageId: string }` | 502 si falla Apps Script |
| GET | `/api/health` | — | `{ ok: true, version }` | — |

### 14.1 Flujo de envío de email (worker → Apps Script)

```
[Frontend]
   |  POST /api/workout/submit (cookie sesión + payload)
   v
[Worker]
   |  1. Verifica cookie
   |  2. Construye HTML del email
   |  3. Calcula HMAC-SHA256(payload, APPS_SCRIPT_SECRET)
   |  4. POST a APPS_SCRIPT_WEBHOOK con { payload, sig }
   v
[Apps Script en Gmail]
   |  1. Re-calcula HMAC y compara con sig recibida
   |  2. Si ok → MailApp.sendEmail(omar.pache@gmail.com, ...)
   |  3. Responde { ok: true } o { ok: false, error }
   v
[Worker]
   |  Traduce respuesta a 2xx/5xx según corresponda
   v
[Frontend]
   |  Muestra confirmación o error con opción de reintentar
```

### 14.2 Código del Apps Script (referencia)

```javascript
// Pegar en script.google.com, asociado al Gmail personal.
// Publicar como Web App: Ejecutar como Yo, Acceso Cualquiera con enlace.

const SHARED_SECRET = 'REEMPLAZAR_POR_SECRETO_LARGO';
const ALLOWED_RECIPIENT = 'omar.pache@gmail.com';

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const { payload, sig } = body;
    const expected = computeHmac(JSON.stringify(payload), SHARED_SECRET);
    if (sig !== expected) {
      return jsonResponse({ ok: false, error: 'unauthorized' });
    }
    if (payload.to !== ALLOWED_RECIPIENT) {
      return jsonResponse({ ok: false, error: 'recipient_not_allowed' });
    }
    MailApp.sendEmail({
      to: payload.to,
      subject: payload.subject,
      htmlBody: payload.htmlBody
    });
    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function computeHmac(message, secret) {
  const bytes = Utilities.computeHmacSha256Signature(message, secret);
  return bytes.map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

---

## 15. Seguridad

- **Password:** un único hash bcrypt (factor 12) en la variable `APP_PASSWORD_HASH`. Nunca en el bundle del cliente.
- **JWT de sesión:** firmado HS256 con `SESSION_SECRET` (32 bytes aleatorios). Claims: `iat`, `exp` (30 días), `v` (versión de credencial — incrementar `v` invalida todas las sesiones anteriores).
- **Cookie:** `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/`, sin `Domain` explícito.
- **Rate limit del login:** 3 intentos / 10 min / IP, luego 5 min de cooldown. Implementado con Cloudflare KV o Durable Objects.
- **CORS:** mismo origen únicamente; el frontend y la API están en el mismo dominio.
- **CSP:** `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'`.
- **Headers extra:** `Strict-Transport-Security: max-age=31536000; includeSubDomains`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: same-origin`, `Permissions-Policy: interest-cohort=()`.
- **API key de Google Sheets:** restringida en Google Cloud Console por API (solo Sheets API) y por dominio referrer; guardada en `GOOGLE_SHEETS_API_KEY` solo accesible desde el worker.
- **Secret del Apps Script:** valor aleatorio de 32 bytes, presente en dos lugares (Cloudflare env vars y dentro del Apps Script). Si se filtra, se regenera en ambos.
- **URL del Apps Script:** se trata como secreto adicional. Aunque su acceso es "cualquiera con el enlace", sin saber el HMAC nadie puede disparar envíos válidos. Si la URL se filtra, basta con re-deployar el Apps Script para obtener una URL nueva.
- **Apps Script valida el destinatario** (`ALLOWED_RECIPIENT`): incluso si alguien lograra firmar un payload, solo se puede mandar email a `omar.pache@gmail.com`.
- **Sin logging del password ni del contenido del email** en los logs del worker.

---

## 16. Despliegue y operación

### 16.1 Variables de entorno (en Cloudflare Pages → Settings → Environment Variables)

| Variable | Ejemplo | Notas |
|----------|---------|-------|
| `APP_PASSWORD_HASH` | `$2a$12$...` | bcrypt hash del password elegido |
| `SESSION_SECRET` | 64 hex chars | Generar con `openssl rand -hex 32` |
| `GOOGLE_SHEETS_API_KEY` | `AIza...` | API key restringida a Sheets API |
| `GOOGLE_SHEET_ID` | `1NGf1_fiDQYuajyJCuLOdcZDU2tVcd7i7RerdAbuNaaQ` | ID extraído de la URL |
| `APPS_SCRIPT_WEBHOOK` | `https://script.google.com/macros/s/AKfy.../exec` | URL del web app publicado |
| `APPS_SCRIPT_SECRET` | 64 hex chars | Secreto compartido con el script |
| `EMAIL_TO` | `omar.pache@gmail.com` | Destinatario único |
| `SESSION_VERSION` | `1` | Incrementar para invalidar todas las sesiones |
| `TZ` | `America/Santiago` | Zona horaria para resolver "hoy" |

### 16.2 Pasos de despliegue (primera vez)

1. Crear repositorio en GitHub (privado).
2. Crear cuenta en Cloudflare (gratis) y vincular el repo en Cloudflare Pages.
3. Crear proyecto en Google Cloud Console, habilitar Sheets API, generar API key restringida.
4. Confirmar que la planilla está compartida como "Cualquiera con el enlace puede ver".
5. Crear nuevo proyecto en script.google.com con el Gmail personal. Pegar el código de la sección 14.2. Generar `APPS_SCRIPT_SECRET` con `openssl rand -hex 32`. Reemplazar en el script. Publicar como Web App (Ejecutar como Yo, Acceso Cualquiera con enlace). Copiar la URL `/exec`.
6. Generar `APP_PASSWORD_HASH` localmente: `node -e "require('bcryptjs').hash('mi_password', 12).then(console.log)"`.
7. Generar `SESSION_SECRET`: `openssl rand -hex 32`.
8. Cargar todas las variables en Cloudflare Pages → Settings → Environment Variables.
9. Hacer push a la rama `main` → Cloudflare construye y despliega.
10. Probar login y carga del día actual.
11. Hacer una sesión de prueba y verificar que llegue el email a `omar.pache@gmail.com`.
12. En iPhone Safari: abrir la URL → compartir → "Agregar a pantalla de inicio" para instalarla como PWA (opcional).

### 16.3 Monitoreo y logs
- Cloudflare Pages provee logs en tiempo real de las Functions.
- Apps Script tiene su propio panel de ejecuciones (script.google.com → Executions) con errores y duración.
- No se requiere monitoreo externo dado el bajo tráfico esperado (~22 sesiones/mes).

---

## 17. Criterios de aceptación

Para considerar la v1 lista para producción, todos estos casos deben pasar:

1. Abrir la URL en iPhone XR muestra el login sin desbordes ni elementos cortados por el notch, con el tema oscuro, nombre `Gym Tracker` y el botón `Entrar` en verde neón.
2. Password correcto → entra; incorrecto → mensaje de error claro; 3 fallos → bloqueo de 5 min.
3. En lunes/martes/jueves/viernes a las 5:55 am, la pantalla principal muestra el día de hoy con todos los ejercicios y valores prellenados desde la planilla.
4. En miércoles/sábado/domingo, la app muestra mensaje de día de descanso y el próximo entreno calculado.
5. La pantalla de bienestar permite calificar con 1–5 estrellas: sueño, energía, estrés, salud articular y recuperación muscular, más un comentario opcional; no permite iniciar hasta tener los 5 indicadores completos.
6. Presionar `Iniciar entrenamiento` después de completar bienestar inicia el cronómetro general y registra `inicioISO`; navegar por la pantalla de resumen o bienestar no cuenta como tiempo de entrenamiento.
7. Marcar una serie como `Hecho` inicia el descanso con el tiempo correcto extraído del valor `"2 min"` / `"1,5 min"` / `"1 min"` de la planilla.
8. Cada fila usa la palabra `Serie`, muestra repeticiones, `@ RPE` programado, peso sugerido editable y descanso de esa serie.
9. El descanso vibra y suena al llegar a 0 (con el teléfono en modo normal).
10. El cronómetro general sigue corriendo durante los descansos y se ve siempre en el header.
11. Cerrar la pestaña a mitad de una serie y volver a abrir restaura el estado exacto.
12. La pantalla de cierre solicita RPE general del día y comentario general del día.
13. Presionar `Finalizar entrenamiento y enviar` registra `finISO`, calcula la duración real automáticamente y envía el resumen por email.
14. El correo llega a `omar.pache@gmail.com` en menos de 30 segundos, con duración, RPE general del día, bienestar, comentario general y desglose por ejercicio/serie. El remitente es el propio `omar.pache@gmail.com`.
15. La app no muestra peso total, volumen total, indicadores diarios/semanales de carga ni sRPE en ninguna pantalla ni en el email.
16. La app es instalable como PWA y al abrir desde el ícono no muestra la barra del navegador.
17. El bundle JS pesa menos de 80 KB minificado + gzip.
18. No hay errores de consola al recorrer todas las pantallas.
19. La paleta de colores aplicada coincide con la sección 8.1; el acento verde neón se ve en cronómetro, botón primario, series completadas, foco de inputs y borde izquierdo del ejercicio activo, y en ningún otro lugar.
20. Todo el flujo de desarrollo (instalar deps, dev server, build, deploy) corre sin errores en Linux.

## 18. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| El formato de la planilla cambia y el parser falla | Alto | El parser ignora hojas mal formadas; mensaje claro de error en UI; suite de tests con snapshot de cada mesociclo |
| Apps Script alcanza la cuota de 100 mails/día | Muy bajo | Sólo se envía 1 mail por sesión, máximo 4/semana |
| Alguien descubre la URL del Apps Script y la dispara | Bajo | HMAC bloquea cualquier payload no firmado; además el script solo envía a `omar.pache@gmail.com` |
| Apps Script tarda mucho (cold start) | Bajo | Timeout del worker en 30 s, mensaje de "reintentar" si excede |
| iOS Safari quita el Wake Lock | Bajo | Fallback: el cronómetro general sigue funcionando aunque la pantalla se apague (usa `performance.now()` y se reconcilia al volver) |
| Olvido del password | Bajo | Recrear hash y redeploy en 2 minutos |
| El sheet se hace privado por error | Medio | Mensaje claro de error en UI "no puedo leer la planilla", documentar en README |
| El día de hoy no existe en ningún mesociclo (vacaciones, hueco entre mesociclos) | Bajo | Tratar como día de descanso; permitir elegir manualmente cualquier día programado |
| Cambio de zona horaria por viaje | Muy bajo | Hardcodear `America/Santiago` con opción futura de override por query string |

---

## 19. Roadmap / fases

### Fase 0 – Setup (medio día)
Repo, cuenta Cloudflare, cuenta Google Cloud, Apps Script publicado, secretos generados, variables en Cloudflare.

### Fase 1 – Backend mínimo (1 día)
- Endpoint `/api/health`.
- Login + logout + cookie firmada + rate limit.
- Endpoint `/api/workout/today` con parser de la planilla. Tests con la planilla actual.
- Endpoint `/api/workout/submit` que firma con HMAC y postea al Apps Script.

### Fase 2 – Frontend mínimo (1 día)
- Sistema de diseño implementado (variables CSS, componentes base).
- Pantalla de login, pantalla resumen del día, pantalla bienestar, pantalla ejecución con un solo ejercicio.
- Cronómetros (general + descanso) con vibración/sonido.
- Persistencia localStorage.

### Fase 3 – Pulido y envío (medio día)
- Pantalla de cierre.
- Email HTML cuidado.
- Confirmación + reset.
- PWA manifest + service worker + apple-touch-icon.
- Pruebas en iPhone XR real.

### Fase 4 – Endurecimiento (medio día)
- CSP, HSTS, headers de seguridad.
- Rate limit con KV.
- Manejo de errores y mensajes amistosos.
- README + variables documentadas.

**Total estimado: 3,5 a 4 días de trabajo efectivo.**

---

## Apéndice A – Ejemplo de respuesta de `GET /api/workout/today`

```json
{
  "fecha": "2026-05-11",
  "mesociclo": "Mesociclo 2 Volumen",
  "semana": 7,
  "diaNumero": 1,
  "diaNombre": "Piernas A",
  "bienestarSugerido": {
    "sueno": 4,
    "energia": 4,
    "estres": 4,
    "saludArticular": 5,
    "recuperacionMuscular": 5,
    "nota": ""
  },
  "ejercicios": [
    {
      "orden": 1,
      "nombre": "Sentadilla libre (barra baja)",
      "seriesProgramadas": [
        {
          "numero": 1,
          "repeticionesProgramadas": 6,
          "rpeProgramado": 8,
          "pesoSugeridoKg": 60,
          "descansoPrescritoSeg": 180
        },
        {
          "numero": 2,
          "repeticionesProgramadas": 6,
          "rpeProgramado": 8,
          "pesoSugeridoKg": 60,
          "descansoPrescritoSeg": 180
        }
      ],
      "comentarioSugerido": ""
    },
    {
      "orden": 2,
      "nombre": "Peso muerto rumano",
      "seriesProgramadas": [
        {
          "numero": 1,
          "repeticionesProgramadas": 9,
          "rpeProgramado": 8,
          "pesoSugeridoKg": 50,
          "descansoPrescritoSeg": 120
        }
      ],
      "comentarioSugerido": ""
    }
  ],
  "rpeGlobalSugerido": 8
}
```

## Apéndice B – Ejemplo de payload de `POST /api/workout/submit`

```json
{
  "fecha": "2026-05-11",
  "inicioISO": "2026-05-11T09:02:14.000Z",
  "finISO": "2026-05-11T10:20:56.000Z",
  "duracionTotalSeg": 4722,
  "bienestarPre": {
    "sueno": 4,
    "energia": 4,
    "estres": 4,
    "saludArticular": 5,
    "recuperacionMuscular": 5,
    "nota": "Llegué bien despierto"
  },
  "ejerciciosEjecutados": [
    {
      "orden": 1,
      "nombre": "Sentadilla libre (barra baja)",
      "series": [
        {
          "numero": 1,
          "reps": 6,
          "rpeProgramado": 8,
          "pesoKg": 60,
          "descansoPrescritoSeg": 180,
          "completadoEn": "2026-05-11T09:08:00.000Z"
        },
        {
          "numero": 2,
          "reps": 6,
          "rpeProgramado": 8,
          "pesoKg": 60,
          "descansoPrescritoSeg": 180,
          "completadoEn": "2026-05-11T09:13:10.000Z"
        },
        {
          "numero": 3,
          "reps": 6,
          "rpeProgramado": 8,
          "pesoKg": 60,
          "descansoPrescritoSeg": 180,
          "completadoEn": "2026-05-11T09:18:20.000Z"
        },
        {
          "numero": 4,
          "reps": 5,
          "rpeProgramado": 8,
          "pesoKg": 60,
          "descansoPrescritoSeg": 180,
          "completadoEn": "2026-05-11T09:23:30.000Z"
        },
        {
          "numero": 5,
          "reps": 6,
          "rpeProgramado": 8,
          "pesoKg": 57.5,
          "descansoPrescritoSeg": 180,
          "completadoEn": "2026-05-11T09:28:40.000Z"
        }
      ],
      "comentario": "Última serie bajé el peso para mantener técnica"
    }
  ],
  "rpeGeneralDia": 8,
  "comentarioGeneralDia": "Buena sesión, terminé con energía."
}
```

---

**Fin del documento.**
