# AGENTS.md

Instrucciones para agentes IA (Claude Code, Codex, etc.) y desarrolladores trabajando en este repositorio. Léelo completo antes de proponer cambios.

## Contexto del proyecto

Web app personal de un solo usuario (Omar). Gym Tracker que lee una Google Sheet existente y envía un resumen por email al finalizar cada sesión.

**Para entender qué debe hacer el sistema y por qué, leer `docs/SPEC.md`.** Este documento NO repite ese contenido — solo cubre cómo trabajar con el código.

## Stack

- Frontend: Preact + HTM (sin JSX build step), CSS plano con variables, Vite.
- Backend: Cloudflare Pages Functions + Hono.
- Email: webhook a Google Apps Script (NO usar Resend, SendGrid, ni otro servicio).
- Datos: Google Sheets API v4 con API key, SOLO lectura.

## Comandos

| Acción | Comando |
|--------|---------|
| Instalar dependencias | `npm install` |
| Servidor de desarrollo | `npm run dev` (puerto 8788) |
| Build de producción | `npm run build` |
| Lint | `npm run lint` |
| Tests | `npm test` |
| Deploy manual | `wrangler pages deploy ./dist` |
| Generar hash de password | `node -e "require('bcryptjs').hash('PWD', 12).then(console.log)"` |
| Generar secreto aleatorio | `openssl rand -hex 32` |

## Convenciones de código

- JavaScript moderno (ES2022+). Sin TypeScript en el bundle, pero anotaciones JSDoc bienvenidas.
- Preact con HTM: componentes como funciones, hooks (`useState`, `useEffect`). NO instalar React.
- CSS: variables definidas en `src/styles.css` siguiendo `docs/SPEC.md` §8. NO Tailwind, NO styled-components, NO CSS-in-JS.
- Nombres de archivos: kebab-case para CSS/HTML, camelCase para JS, PascalCase para componentes dentro del archivo.
- Texto de UI en español neutro latinoamericano.
- Indentación: 2 espacios. Comillas simples en JS, dobles en JSX/HTM solo cuando son necesarias.
- Cada función exportada del backend tiene comentario JSDoc con `@param` y `@returns`.
- Commits: usar Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`).

## Estructura de archivos

```
src/                    Frontend
  main.js               Entry point, monta la app
  app.jsx               Router de pantallas
  components/           Componentes Preact (un archivo por componente)
  lib/                  Lógica pura sin DOM (timers, storage, api client)
  styles.css            Sistema de diseño completo (todas las variables CSS)

functions/              Backend (Cloudflare Pages Functions)
  _middleware.js        Auth middleware aplicado a /api/* excepto login y health
  api/
    auth/login.js       POST: valida password, emite cookie de sesión
    auth/logout.js      POST: invalida cookie
    workout/today.js    GET: devuelve la sesión de hoy
    workout/by-date.js  GET: sesión de una fecha específica
    workout/submit.js   POST: recibe sesión completada, dispara email
    health.js           GET: probe de salud
  lib/
    sheets.js           Cliente Google Sheets API
    parser.js           Parser de la planilla a tipos internos
    email.js            Construye HTML + firma HMAC + POST a Apps Script
    auth.js             JWT + bcrypt + rate limit

apps-script/
  webhook.gs            Código del Apps Script (referencia, no se ejecuta acá)
```

## Reglas críticas (NO violar)

1. **NUNCA escribir en la Google Sheet.** La app solo lee. Si te piden agregar escritura, confirma con el humano antes — implica cambios mayores de arquitectura (OAuth, etc.) que están explícitamente fuera de alcance v1.
2. **NUNCA committear secretos.** Todo va en variables de entorno de Cloudflare. El archivo `.env.local` está en `.gitignore`.
3. **NUNCA cambiar el proveedor de email.** Es Apps Script por decisión arquitectónica (ver `docs/SPEC.md` §5.3 y §14). Resend, SendGrid, SMTP, etc. están descartados.
4. **Sigue el sistema de diseño** definido en `docs/SPEC.md` §8 al pie de la letra. El verde neón (`--accent`) se reserva para acción y estado activo, NO decora libremente.
5. **Mobile-first siempre.** El target es Safari iOS en iPhone XR (414×896 pt). Si algo se ve bien en desktop pero mal en móvil, se prioriza el móvil.
6. **El parser de la planilla es frágil.** Antes de modificar `functions/lib/parser.js`, correr los tests con el snapshot actual. Si cambia el formato de la planilla, agregar un nuevo snapshot — no romper los existentes.
7. **Pre-llenar campos desde la planilla.** Cuando se renderiza un día, los inputs de serie (reps, peso sugerido editable, RPE programado, descanso) deben venir con los valores que dice la planilla, no con defaults inventados.
8. **No reutilizar bibliotecas de componentes de UI.** Todos los componentes (botones, estrellas, sliders, inputs) son propios. NO instalar Material UI, Radix, Headless UI, shadcn, etc.
9. **No agregar tracking, analytics ni telemetría.** El único output del sistema es el email a `omar.pache@gmail.com`.

## Gotchas conocidos

- **Tiempo de descanso en la planilla:** viene como `" 2 min"`, `"1,5 min"`, `"1 min"`. Hay que trimmear, reemplazar coma por punto, parsear, multiplicar por 60. El parser ya lo hace; no inventes uno paralelo.
- **Peso `—` (em-dash) en la planilla:** indica ejercicios de peso corporal. El input de peso se oculta. No se calcula ni muestra ningún indicador agregado de carga para esa serie.
- **Wake Lock en iOS:** la API existe desde iOS 16.4, pero Safari la revoca al cambiar de tab. Manejar el evento `visibilitychange` y re-solicitar al volver al foreground.
- **Cronómetro general durante descanso:** debe seguir corriendo, NO pausarse cuando el overlay del descanso aparece encima.
- **Cookie de sesión:** `SameSite=Strict` rompe el login si se prueba la API desde un dominio distinto al del frontend. Para pruebas cross-origin usar `SameSite=Lax` solo en dev.
- **Fechas de la planilla:** vienen como `Lunes 11/05/2026` dentro del encabezado del día. El parser usa regex `/(\d{2})\/(\d{2})\/(\d{4})/`. La comparación con "hoy" se hace en zona horaria `America/Santiago`.
- **Cuota de Apps Script:** 100 mails/día con Gmail gratis. No agrupar envíos ni hacer reintentos automáticos agresivos.

## Antes de proponer un PR

1. `npm run lint` pasa sin warnings.
2. `npm test` pasa.
3. La feature está descrita en `docs/SPEC.md` o se agregó al SPEC en el mismo PR.
4. No hay secretos hardcodeados (revisar con `git diff` antes del commit).
5. Si tocaste el parser, agregaste/actualizaste el snapshot de tests.
6. Si tocaste algo del sistema de diseño, las pantallas afectadas se verificaron en iPhone XR (o emulador con viewport 414×896).
7. Si agregaste un endpoint nuevo en `/api/*`, está documentado en `docs/SPEC.md` §14.

## Cuando dudes, pregunta al humano antes de:

- Agregar una dependencia nueva (`package.json`).
- Cambiar el esquema o la firma de la cookie de sesión.
- Modificar el contrato de algún endpoint `/api/*` ya existente.
- Tocar el código del Apps Script en `apps-script/webhook.gs`.
- Cualquier cambio que envíe datos fuera del email (tracking, analytics, errores a Sentry, etc.).
- Cambios al modelo de datos en `docs/SPEC.md` §7.

En cualquier otro caso, procede con el cambio más pequeño posible que resuelva la tarea y deja al humano decidir si extenderlo.
