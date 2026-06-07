# CV ↔ GitHub Analyzer

Chrome extension que cruza un CV en PDF contra un perfil de GitHub para detectar inconsistencias de skills, fechas y señales de calidad de código.

## Cómo lo usás

1. Subís tu CV (PDF) o pegás la URL de tu portfolio
2. Ponés tu usuario de GitHub
3. La extensión parsea, fetchea, cruza y te genera un reporte con findings rojos/amarillos

## El problema que más me costó resolver

Cuando armé el scraper de portfolos, todo funcionaba bien con páginas SSR normales: pedir la URL con `fetch()` y parsear el HTML. Pero mi portfolio (`isaacgarcia.vercel.app`) está hecho con Vite + React, y ahi empezaron los problemas.

El botón de GitHub en mi portfolio no es un `<a href="...">` — es un `<button onClick={() => window.open('https://github.com/isaacxiddd')}>`. React no serializa `onClick` como atributo HTML; lo guarda en un closure de JavaScript. Cuando la extensión pedía la página con `fetch()`, solo recibía el HTML shell vacío (`<div id="root"></div>`).

Así que me puse a iterar.

### Iteración 1: Content script que captura el DOM renderizado

Mi primera idea: un content script que corre en todas las páginas, detecta si es un portfolio, y guarda `document.body.innerHTML` completo en `chrome.storage.session`. Cuando el popup necesita los datos, los lee del storage.

**Problema:** Content scripts corren en `document_idle`, que es ANTES de que React termine de renderizar. El DOM que captura es el shell vacío.

**Solución rápida:** Un `MutationObserver` que espera cambios en el DOM y vuelve a ejecutar la captura. Esto funcionaba para portfolos que renderizan todo al montarse.

**Problema persistente:** Incluso con el DOM lleno de React, el botón de GitHub sigue sin aparecer en `innerHTML` porque `onClick` no es un atributo HTML. La URL está en una closure de JavaScript inaccesible desde el DOM.

### Iteración 2: Fetch del JS bundle

Mi segunda idea: ya que la URL está en el bundle de JavaScript (mezclada entre miles de líneas de código minificado de React), podía pedir el bundle con `fetch()` desde el content script y buscar `github.com/usuario` con una regex.

El content script:
1. Busca todos los `<script src="...">` en la página
2. Los fetchea uno por uno (con timeout de 3s)
3. Aplica una regex para encontrar URLs de GitHub
4. Guarda la URL encontrada en el storage

Esto FUNCIONABA técnicamente — la regex encontraba `https://github.com/isaacxiddd` en el bundle de Vite. Pero tenía un problema de timing: el fetch del bundle tarda ~3 segundos (son 294KB de código minificado). Si abrías el popup antes de que termine, el cache no tenía la URL.

Lo intenté solucionar de varias formas:
- Guardar el DOM primero, actualizar la URL después (fire-and-forget)
- Promise compartida para que el popup espere el mismo fetch
- Flag `scriptsFetched` para no repetir el fetch en cada MutationObserver

Pero siempre quedaba una ventana de race condition.

### Iteración 3: Mensajería directa al content script

Tercera idea: en vez de leer el cache, el popup le manda un mensaje al content script en vivo (`chrome.tabs.sendMessage`) pidiéndole que escanee el DOM ahora mismo.

El content script buscaba:
1. `<a href="...github.com...">` — para portfolos con links normales
2. Atributos HTML que contengan `github.com` — por si hay `data-href` o `onclick` serializado
3. `innerText` — por si la URL aparece como texto visible

**Problema:** React no pone el `onClick` en ningún atributo HTML. `querySelectorAll('[onclick*="github.com"]')` no encuentra nada porque React usa event delegation y almacena los handlers en una estructura interna, no en el DOM.

### Iteración 4 (la que funciona): React internals

Hablando con el dev tool me di cuenta de algo: React guarda las props (incluyendo `onClick`) como propiedades propias en los elementos del DOM, con nombres como `__reactProps$<hash>`. Son objetos JavaScript reales, no atributos HTML.

El truco:
1. Busco todos los `<button>`, `<a>`, `[role="button"]` en la página
2. En cada uno, itero sus keys con `Object.keys(el)` buscando `__reactProps$...`
3. Cuando encuentro la propiedad, accedo a `.onClick` — es una función JavaScript
4. Le hago `.toString()` a la función → obtengo `() => window.open('https://github.com/isaacxiddd')`
5. Regex la URL de GitHub

Esto funciona sincrónicamente, desde el DOM vivo, sin esperar ningún fetch. El popup manda el mensaje y recibe la respuesta al instante.

El método completo queda así (en `portfolio-detector.ts:94`):

```
getGithubFromDOM → 
  1. <a href="github.com/...">                    → rápido, SSR y SPAs con links normales
  2. __reactProps$.onClick.toString()             → rápido, React SPAs con handlers en closures
  3. Atributos HTML con github.com                → rápido, casos borde
  4. innerText                                    → rápido, URLs como texto visible
  5. Fetch de JS bundles (async, con promesa)     → lento, fallback para casos extremos
```

Cada paso es un fallback del anterior. El paso 2 cubre exactamente el caso de mi portfolio y el de cualquier SPA de React/Vue que use closures para event handlers.

## Design Decisions

### ¿Por qué no usé chrome.scripting.executeScript?

```
// Esto me hubiera ahorrado varias iteraciones:
chrome.scripting.executeScript({
  target: { tabId },
  func: () => document.querySelector('button')?.onclick?.toString(),
});
```

Lo consideré, pero requería permiso `scripting` + `activeTab` y el popup ya tenía acceso al content script via messaging. Además, `executeScript` inyecta una función anónima en el main world, pero el content script ya estaba corriendo en la página y podía hacer lo mismo desde su isolated world (gracias a que `__reactProps$` es una propiedad del DOM element, no una variable de página).

### ¿Por qué el fetch de JS bundle no es la solución principal?

Porque es inherentemente asíncrono y la UX sufre. El usuario espera 3 segundos sin feedback visual. En cambio, el método de React internals es instantáneo. Dejé el fetch de bundle como fallback por si aparece un portfolio que use una librería que no exponga sus props en el DOM (ejemplo: Svelte, Solid, o React en el futuro si cambian su implementación interna).

### ¿Por qué es experimental y qué fallbacks tiene?

Acceder a `__reactProps$` es un detalle interno de React que no tiene API pública y podría cambiar en cualquier versión. Por eso el orden del handler es: primero los métodos estándar del DOM, luego React internals, y solo al final el fetch de bundles. Si React 19 cambia la estructura interna, el paso 2 falla silenciosamente (no encuentra la key) y el sistema cae al paso 5 (fetch de bundle). El usuario nota solo un delay de 3 segundos en vez de respuesta instantánea.

## Stack

| Layer | Tech |
|---|---|
| Extension | TypeScript + esbuild + Manifest V3 |
| PDF parsing | pdf.js (browser, popup context) |
| GitHub data | GitHub REST API (no auth in v0.1) |
| Testing | Vitest + Node environment |
| Backend (v1) | Fastify + Drizzle + PostgreSQL + Redis/BullMQ |
| AI (v1) | Claude API via `@anthropic-ai/sdk` — backend only |
| Dashboard (v1.1) | Next.js 15 + Tailwind + TanStack Query |

## Estructura

```
extension/
  src/
    types/          index.ts — todas las interfaces compartidas
    parser/         pdf-parser.ts, cv-extractor.ts, tech-list.ts
    analyzer/       github-fetcher.ts, cross-checker.ts
    report/         report-generator.ts
    popup/          popup.html, popup.ts
    background/     background.ts (service worker)
    content/        content.ts, portfolio-detector.ts
  tests/
    fixtures/       cv-samples/*.txt, github-mocks/*.json
backend/            v1.0 SaaS (Fastify + DB + queue)
dashboard/          v1.1 recruiter UI (Next.js)
```

## Comandos

```bash
cd extension
npm install
npm run dev        # esbuild watch → dist/
npm run build      # production build
npm run test       # Vitest
npm run typecheck  # tsc --noEmit
```

**Cargar en Chrome:** `chrome://extensions` → Developer mode → Load unpacked → `extension/dist/`

## Reglas de arquitectura

1. **Pure functions primero** — `cv-extractor`, `cross-checker`, `report-generator` sin side effects
2. **Un solo archivo de tipos** — `extension/src/types/index.ts`
3. **Flujo unidireccional** — `pdf-parser → cv-extractor → github-fetcher → cross-checker → report-generator`
4. **Fetcher es la única capa I/O** — `github-fetcher.ts` es el único archivo que llama `fetch`
5. **background.ts es orquestador** — llama módulos, no contiene lógica
6. **300 líneas máx en entry/background** — si crece, extraer un service
7. **Claude API solo via backend** — nunca importar `@anthropic-ai/sdk` en la extension
