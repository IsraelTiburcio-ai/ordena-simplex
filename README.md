# Ordena el Simplex

Microjuego educativo web (HTML, CSS y JavaScript vanilla, sin dependencias) para practicar la **secuencia de pasos del método simplex**. Forma parte de Gimnasio 3, sección **3.3 Método Simplex**.

**Objetivo académico:** que el alumno entienda el orden de las acciones al trabajar con una tabla simplex, no resolver problemas completos.

**Jugar:** https://israeltiburcio-ai.github.io/ordena-simplex/

## Cómo se juega

1. Cada ronda muestra una consigna y tarjetas desordenadas.
2. Toca una tarjeta de la bandeja y luego el hueco donde va en la línea de ensamblaje.
3. Puedes mover una tarjeta colocada (toca la tarjeta y después otro hueco) o devolverla a la bandeja (toca la tarjeta y luego un espacio de la bandeja).
4. Pulsa **Comprobar orden**. Si todo está bien, la ronda se supera y aparece la explicación breve. Si no, las tarjetas mal colocadas se marcan como *Fuera de lugar*; tras dos intentos fallidos aparece una pista.

Cada partida reparte **6 rondas** en tres fases, tomadas de un banco de **18 secuencias**:

| Fase | Contenido | Rondas por partida |
|---|---|---|
| 1 · Preparación | forma adecuada, holguras, excesos, variables artificiales, tabla inicial | 2 |
| 2 · Ciclo del simplex | pasos generales, criterio de entrada y de optimalidad, pivoteo | 2 |
| 3 · Mini-iteración | criterio de la razón, renglón pivote, elemento pivote, cambio de base | 2 |

Duración prevista: **1–2 minutos** por partida.

## Puntuación

- **Rondas superadas**: número de rondas completadas (de 6).
- **Tiempo**: duración de la partida (cronómetro que se pausa si la pestaña se oculta).
- **Errores**: tarjetas fuera de lugar detectadas al comprobar.
- **Precisión**: colocaciones correctas entre todas las colocaciones comprobadas.

## Vocabulario

Se usa el del cuadernillo Gimnasio 3, sección 3.3: *renglón pivote* (equivale a "fila pivote"), *variable de entrada* (columna pivote), *variable de salida* (renglón pivote), *criterio de la razón*, *elemento pivote*, *Gauss-Jordan*, *zj − cj*, *solución básica factible*, *forma estándar*, *forma ampliada*.

Referencias de página en cada ronda (`ref`) apuntan al cuadernillo: pp. 9, 14, 15, 16, 20 y 26.

## Accesibilidad

- Todo se puede hacer con toques grandes (mínimo 46 px de alto) y con teclado: Tab para moverse, Enter o Espacio para seleccionar y colocar, Escape para cancelar la selección.
- Foco visible en todos los controles.
- Estados con texto además de color (*En orden* / *Fuera de lugar*).
- Etiquetas `aria-label` en huecos y tarjetas; mensajes de estado en una región `aria-live`.
- `prefers-reduced-motion`: se desactivan animaciones.
- Sonidos con Web Audio (sin archivos). Botón de silencio que recuerda la preferencia en el navegador.

## Estructura

```
index.html                  pantallas: inicio, partida, resultados y diálogo de ronda
styles.css                  diseño móvil primero; ajustes para iPad y escritorio
script.js                   lógica: selección por toque, comprobación, puntuación, sonido
data.js                     banco de 18 rondas con sus pasos en orden correcto
.github/workflows/pages.yml despliegue automático a GitHub Pages
```

## Ejecutar en local

No requiere instalación. Abre `index.html` en el navegador o sirve la carpeta:

```bash
python3 -m http.server 8000
# luego visita http://localhost:8000
```

## Agregar o editar rondas

Edita `data.js`. Cada ronda tiene:

- `id`, `fase` (`prep`, `ciclo` o `iter`), `consigna`
- `pasos`: arreglo **en orden correcto** (el juego lo mezcla)
- `retro`: explicación breve que aparece al acertar
- `pista`: se muestra tras dos comprobaciones fallidas
- `ref`: página(s) del cuadernillo
- `conflicto` (opcional): ids de rondas que no deben salir en la misma partida

Si cambias los archivos del sitio, actualiza también la lista de `cp` en `.github/workflows/pages.yml`.

## Despliegue

Cada `push` a `main` ejecuta el flujo de GitHub Actions que publica `index.html`, `styles.css`, `script.js` y `data.js` en GitHub Pages. Requiere que en *Settings → Pages* la fuente sea **GitHub Actions**.

## Pendientes conocidos

- Arrastrar y soltar (drag & drop) es opcional y no está implementado; el juego se completa solo con toques o teclado.
- Las pruebas de este repositorio se hicieron en emulación de navegador; conviene una prueba final en un iPhone y un iPad reales.
