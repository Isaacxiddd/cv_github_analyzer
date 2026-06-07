# Design Journey: Extracting GitHub URLs from React SPAs

Esta es la historia de cómo resolví el problema de extraer el link de GitHub de mi propio portfolio — un React SPA con Vite — para la extensión CV ↔ GitHub Analyzer.

---

## El problema

Mi portfolio (`isaacgarcia.vercel.app`) está hecho con Vite + React. El botón de GitHub no es un `<a href="...">` — es:

```jsx
<button onClick={() => window.open('https://github.com/isaacxiddd')}>
```

React no serializa `onClick` como atributo HTML. Lo guarda en un **closure de JavaScript**. Cuando la extensión pide la página con `fetch()`, solo recibe el HTML shell vacío (`<div id="root"></div>`). La URL de GitHub existe en el bundle de JavaScript, pero está mezclada con miles de líneas de código minificado.

Así que empecé a iterar.

---

## Iteración 1: Content script captura el DOM renderizado

Un content script que corre en todas las páginas, detecta si es un portfolio, y guarda `document.body.innerHTML` completo en `chrome.storage.session`. El popup lee del storage cuando necesita los datos.

**Problema:** Content scripts corren en `document_idle`, ANTES de que React termine de renderizar. El DOM que captura es el shell vacío.

**Fix:** `MutationObserver` espera cambios en el DOM y vuelve a ejecutar la captura. Ahora captura el DOM lleno de React.

**Problema persistente:** Incluso con el DOM lleno de React, `onClick` no aparece en `innerHTML`. No es un atributo HTML. La URL está en una closure de JavaScript.

---

## Iteración 2: Fetch del JS bundle

Ya que la URL está en el bundle de JavaScript, el content script fetchea los `<script src>` de la página y busca `github.com/usuario` con una regex.

```
document.querySelectorAll('script[src]')
  → fetch cada uno
  → code.matchAll(/github\.com\/([a-zA-Z0-9_-]+)/gi)
  → guardar en chrome.storage.session
```

**Funciona técnicamente.** La regex encuentra `https://github.com/isaacxiddd` en el bundle de Vite.

**Problema:** El bundle pesa ~294KB y el fetch tarda ~3 segundos. Si abrís el popup antes de que termine, el cache no tiene la URL.

Intenté solucionarlo de varias formas:
- Guardar el DOM primero, actualizar la URL después (fire-and-forget)
- Promise compartida entre detectAndStore() y onMessage
- Flag `scriptsFetched` para no repetir el fetch

Siempre quedaba una race condition.

---

## Iteración 3: Mensajería directa al content script

En vez de leer el cache, el popup le manda un mensaje al content script en vivo (`chrome.tabs.sendMessage`) pidiendo que escanee el DOM ahora mismo.

```typescript
// popup.ts
const resp = await chrome.tabs.sendMessage(tabId, { action: 'getGithubFromDOM' });
```

El content script buscaba:
1. `<a href="...github.com...">` — links normales
2. Atributos como `onclick`, `data-href` — atributos HTML serializados
3. `innerText` — URLs como texto visible

**Problema:** React no serializa `onClick` como atributo HTML. `querySelectorAll('[onclick*="github.com"]')` no encuentra nada porque React usa event delegation.

---

## Iteración 4 (la que funciona): React internals

React guarda las props (incluyendo `onClick`) como propiedades propias en los elementos del DOM, con nombres como `__reactProps$<hash>`. Son objetos JavaScript reales, accesibles desde el content script.

```typescript
// portfolio-detector.ts — findGitHubInReactProps()
for (const el of document.querySelectorAll('button, a, [role="button"]')) {
  for (const key of Object.keys(el)) {
    if (!key.startsWith('__reactProps$')) continue;
    const props = (el as any)[key];
    const handler = props.onClick;
    if (typeof handler !== 'function') continue;
    const src = handler.toString();
    // src = "() => window.open('https://github.com/isaacxiddd')"
    const m = src.match(/github\.com\/([^\s"'`]+)/i);
    if (m) return `https://github.com/${m[1]}`;
  }
}
```

Esto funciona sincrónicamente, desde el DOM vivo, sin esperar ningún fetch.

---

## Pipeline final

Cuando el usuario hace clic en **Scrape** en el popup:

```
getGithubFromDOM →
  1. <a href="github.com/...">                   SSR y SPAs con links normales
  2. __reactProps$.onClick.toString()            React SPAs con handlers en closures ← ESTA
  3. Atributos HTML con github.com               Casos borde (data-href, etc.)
  4. innerText                                   URLs como texto visible
  5. Fetch de JS bundles (async, con promesa)    Fallback para casos extremos
```

Cada paso es fallback del anterior.

---

## Design Decisions

### ¿Por qué no usé chrome.scripting.executeScript?

```typescript
chrome.scripting.executeScript({
  target: { tabId },
  func: () => document.querySelector('button')?.onclick?.toString(),
});
```

Lo consideré, pero:
- Requería permiso `scripting` + `activeTab`
- El content script ya estaba en la página via messaging
- `__reactProps$` es una propiedad del DOM element, accesible desde el isolated world

### ¿Por qué el fetch de JS bundle no es la solución principal?

Porque es inherentemente asíncrono. El usuario espera 3 segundos sin feedback visual. El método de React internals es instantáneo. Dejé el fetch como fallback por si aparece un portfolio que use Svelte, Solid, o una versión futura de React que cambie `__reactProps$`.

### ¿Por qué es experimental?

`__reactProps$` es un detalle interno de React sin API pública. Si React 19 cambia la estructura interna, el paso 2 falla silenciosamente (no encuentra la key) y el sistema cae al paso 5 (fetch de bundle). El usuario nota solo un delay de 3 segundos.

---

## Lecciones aprendidas

1. **No asumas que el DOM contiene todo.** React (y otros frameworks) pueden tener datos en closures que no se serializan a HTML.
2. **Los content scripts comparten el DOM con la página.** Las propiedades que React pone en los elementos DOM (`__reactProps$`) son accesibles desde el isolated world.
3. **Siempre tener un fallback.** La solución principal es rápida pero frágil (depende de internals de React); el fallback es lento pero robusto (fetch directo del bundle).
