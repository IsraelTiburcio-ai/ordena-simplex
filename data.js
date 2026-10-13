/*
 * ORDENA EL SIMPLEX · banco de rondas
 * Fuente: cuadernillo "Gimnasio 3" (Optimización 1), sección 3.3 Método Simplex,
 * pp. 9–16, 20 y 26. Vocabulario: forma estándar, variable de entrada/salida,
 * columna pivote, renglón pivote, elemento pivote, criterio de la razón, zj − cj.
 *
 * Cada ronda guarda sus pasos YA en orden correcto. El juego los mezcla al empezar la ronda.
 *   fase:      "prep" (preparación) · "ciclo" (ciclo general) · "iter" (mini-iteración)
 *   conflicto: rondas que no deben salir en la misma partida (variantes muy parecidas)
 */
window.ORDENA_SIMPLEX = {
  version: "1.0.0",
  rondas: [
    /* ---------- FASE 1 · PREPARACIÓN (forma adecuada, variables y tabla inicial) ---------- */
    {
      id: "P1",
      fase: "prep",
      consigna: "Prepara un modelo con restricciones ≤ para empezar el simplex.",
      pasos: [
        "Revisar que las restricciones sean ≤ con b ≥ 0",
        "Sumar una variable de holgura en cada una",
        "Hallar la solución inicial en el origen",
        "Construir la tabla inicial con las holguras"
      ],
      retro: "Correcto: primero se revisa la forma; luego se agregan holguras, se halla la solución inicial y se arma la tabla.",
      pista: "Con x = 0, cada holgura vale su b: esa es la base inicial.",
      ref: "pp. 9 y 14"
    },
    {
      id: "P2",
      fase: "prep",
      consigna: "Prepara el modelo cuando una restricción es ≥ (no tiene holgura).",
      pasos: [
        "Restar una variable de exceso en la restricción ≥",
        "Ver que el origen no es factible",
        "Agregar una variable artificial en esa restricción",
        "Construir la tabla con la artificial en la base"
      ],
      retro: "Correcto: la ≥ resta exceso; como no tiene holgura, el origen no sirve y se agrega una artificial antes de la tabla.",
      pista: "Una restricción ≥ no trae holgura, así que no hay base inicial de holguras.",
      ref: "pp. 9 y 26"
    },
    {
      id: "P3",
      fase: "prep",
      consigna: "Ordena los pasos del Ejemplo 1 hasta llegar a la tabla inicial.",
      pasos: [
        "Escribir el modelo en forma estándar",
        "Identificar la solución inicial en el origen",
        "Escribir la f.o. en la forma Z − cx = 0",
        "Construir la tabla inicial"
      ],
      retro: "Correcto: primero la forma estándar; luego la solución inicial, la f.o. como fila zj − cj y, al final, la tabla.",
      pista: "La tabla va al final: necesita las holguras y la fila zj − cj.",
      ref: "p. 15"
    },
    {
      id: "P4",
      fase: "prep",
      consigna: "Ordena los requisitos para aplicar el método simplex.",
      pasos: [
        "Tener el modelo en forma estándar",
        "Que todas las variables sean ≥ 0",
        "Restricciones ≤ con b ≥ 0",
        "Que el origen pertenezca a la región factible"
      ],
      retro: "Correcto: forma estándar, variables ≥ 0 y restricciones ≤ con b ≥ 0; así el origen queda dentro de la región factible.",
      pista: "El origen es factible solo si las restricciones ya están en forma ≤ con b ≥ 0.",
      ref: "p. 9"
    },
    {
      id: "P5",
      fase: "prep",
      consigna: "Prepara un modelo con restricciones ≤, ≥ y =.",
      pasos: [
        "Clasificar cada restricción: ≤, ≥ o =",
        "Sumar holgura a las ≤ y restar exceso a las ≥",
        "Agregar artificiales donde falte holgura",
        "Construir la tabla inicial"
      ],
      retro: "Correcto: primero se clasifica cada restricción; luego se agregan holguras, excesos y artificiales; al final, la tabla.",
      pista: "Las artificiales solo van en las restricciones que no tienen holgura.",
      ref: "pp. 9 y 26"
    },
    {
      id: "P6",
      fase: "prep",
      consigna: "Ordena la preparación de un modelo antes de iterar.",
      pasos: [
        "Identificar si el problema es de max o de min",
        "Agregar las variables necesarias",
        "Escribir la f.o. en la forma Z − cx = 0",
        "Construir la tabla inicial"
      ],
      retro: "Correcto: se identifica el tipo de problema, se agregan variables, se escribe la f.o. y se construye la tabla.",
      pista: "El tipo de problema define los criterios de las iteraciones; la tabla siempre va al final.",
      ref: "pp. 14 y 15"
    },

    /* ---------- FASE 2 · CICLO GENERAL (pasos del método y del pivoteo) ---------- */
    {
      id: "C1",
      fase: "ciclo",
      consigna: "Ordena los pasos generales de una iteración (maximización).",
      pasos: [
        "Elegir la columna pivote (zj − cj más negativo)",
        "Elegir el renglón pivote (criterio de la razón)",
        "Identificar el elemento pivote",
        "Transformar la tabla con Gauss-Jordan",
        "Revisar optimalidad (todo zj − cj ≥ 0)"
      ],
      retro: "Correcto: primero se elige la columna pivote; después el renglón, el elemento pivote y la transformación; al final se revisa la optimalidad.",
      pista: "La columna sale del renglón zj − cj; el renglón sale del criterio de la razón.",
      ref: "pp. 14 y 16",
      conflicto: ["C6"]
    },
    {
      id: "C2",
      fase: "ciclo",
      consigna: "Ordena los 4 pasos generales del método simplex.",
      pasos: [
        "Determinar una solución inicial en el origen",
        "Seleccionar la variable de entrada (no básica)",
        "Seleccionar la variable de salida (básica)",
        "Actualizar la solución (cambio de base)"
      ],
      retro: "Correcto: se parte del origen y se repite entrada, salida y actualización hasta que no quede variable de entrada.",
      pista: "Cuando no existe variable de entrada, la solución actual es la óptima.",
      ref: "p. 14"
    },
    {
      id: "C3",
      fase: "ciclo",
      consigna: "Ordena una iteración completa, incluida la repetición.",
      pasos: [
        "Elegir la variable de entrada (columna pivote)",
        "Elegir la variable de salida (renglón pivote)",
        "Transformar la tabla (operación pivote)",
        "Actualizar la tabla: nueva base y solución",
        "Revisar optimalidad y repetir si no es óptima"
      ],
      retro: "Correcto: la iteración cierra con la tabla actualizada; si la solución no es óptima, se vuelve a empezar.",
      pista: "La repetición depende de la revisión de optimalidad al final.",
      ref: "pp. 14 y 16"
    },
    {
      id: "C4",
      fase: "ciclo",
      consigna: "Ordena los pasos del criterio de la razón y el pivoteo.",
      pasos: [
        "Elegir la columna pivote (zj − cj más negativo)",
        "Calcular θ = xB / yi solo con yi > 0",
        "Tomar el renglón con el menor θ",
        "Identificar el elemento pivote (cruce)",
        "Pivotear: pivote = 1 y resto de la columna = 0"
      ],
      retro: "Correcto: la columna sale de zj − cj; la razón usa solo yi > 0 y decide el renglón; luego se pivotea.",
      pista: "Los yi de 0 o negativos se descartan en la razón.",
      ref: "pp. 14 y 16"
    },
    {
      id: "C5",
      fase: "ciclo",
      consigna: "Ordena el cierre del método cuando ya no hay variable de entrada.",
      pasos: [
        "Aplicar la última operación pivote",
        "Actualizar la base y la solución",
        "Revisar optimalidad: todo zj − cj ≥ 0",
        "Leer la solución óptima en la columna Sol."
      ],
      retro: "Correcto: la óptima se lee al final, cuando ya no hay zj − cj negativos en un problema de maximización.",
      pista: "La solución óptima se lee en la última tabla, no en la inicial.",
      ref: "pp. 14, 15 y 16"
    },
    {
      id: "C6",
      fase: "ciclo",
      consigna: "Ordena una iteración de un modelo de minimización.",
      pasos: [
        "Elegir la columna pivote (zj − cj más positivo)",
        "Elegir el renglón pivote (criterio de la razón)",
        "Identificar el elemento pivote",
        "Transformar la tabla con Gauss-Jordan",
        "Revisar optimalidad (todo zj − cj ≤ 0)"
      ],
      retro: "Correcto: en minimización la columna se elige con zj − cj más positivo; el orden de los pasos no cambia.",
      pista: "Cambian los criterios de entrada y de optimalidad; el orden del ciclo se mantiene.",
      ref: "p. 14",
      conflicto: ["C1"]
    },

    /* ---------- FASE 3 · MINI-ITERACIÓN (entrada, razón, salida, pivoteo, base) ---------- */
    {
      id: "M1",
      fase: "iter",
      consigna: "Ordena la mini-iteración, desde la variable de entrada hasta la base nueva.",
      pasos: [
        "Identificar la variable de entrada (columna pivote)",
        "Aplicar el criterio de la razón (θ mínimo)",
        "Determinar la variable de salida (renglón pivote)",
        "Hacer el pivoteo con Gauss-Jordan",
        "Actualizar la base: entra la de entrada"
      ],
      retro: "Correcto: primero entra la variable de la columna pivote; la razón decide qué variable sale.",
      pista: "No se decide la variable de salida antes de calcular θ con los yi > 0.",
      ref: "p. 16"
    },
    {
      id: "M2",
      fase: "iter",
      consigna: "Ordena la mini-iteración con cocientes y elemento pivote.",
      pasos: [
        "Elegir la columna pivote (variable de entrada)",
        "Calcular cocientes solo con yi > 0",
        "Elegir el renglón con el menor cociente",
        "Ubicar el elemento pivote (cruce renglón–columna)",
        "Pivotear: columna pivote como vector unitario"
      ],
      retro: "Correcto: la columna va primero; el menor cociente define el renglón, y el elemento pivote queda en el cruce.",
      pista: "Los cocientes con yi de 0 o negativo se descartan.",
      ref: "pp. 14 y 16"
    },
    {
      id: "M3",
      fase: "iter",
      consigna: "Ordena la mini-iteración con la revisión de la columna.",
      pasos: [
        "Elegir la columna pivote (variable de entrada)",
        "Revisar que exista algún yi > 0 en la columna",
        "Aplicar el criterio de la razón con yi > 0",
        "Identificar el elemento pivote",
        "Pivotear y actualizar la base"
      ],
      retro: "Correcto: si no hay yi > 0 la solución es no acotada; si los hay, la razón elige el renglón.",
      pista: "Sin yi > 0 en la columna no hay variable de salida.",
      ref: "pp. 16 y 20"
    },
    {
      id: "M4",
      fase: "iter",
      consigna: "Ordena los pasos para elegir bien la variable de salida.",
      pasos: [
        "Calcular θ en los renglones con yi > 0",
        "Tomar el menor θ como renglón pivote",
        "Pivotear con ese renglón",
        "Verificar que la columna Sol. siga ≥ 0"
      ],
      retro: "Correcto: el menor θ conserva la factibilidad; con un θ mayor, una variable básica quedaría negativa.",
      pista: "Si se elige un θ mayor, la variable básica de ese renglón se vuelve negativa.",
      ref: "p. 16"
    },
    {
      id: "M5",
      fase: "iter",
      consigna: "La columna pivote ya está elegida. Ordena lo que sigue.",
      pasos: [
        "Seleccionar la variable de salida (renglón pivote)",
        "Pivotear: la columna pivote pasa a vector unitario",
        "Hacer básica la de entrada y no básica la de salida",
        "Volver a seleccionar la variable de entrada"
      ],
      retro: "Correcto: primero sale la variable, luego se pivotea y se cambia la base; el método vuelve a elegir la entrada.",
      pista: "Después del cambio de base, el método regresa al paso de la variable de entrada.",
      ref: "p. 14"
    },
    {
      id: "M6",
      fase: "iter",
      consigna: "Ordena lo que se hace justo después de pivotear.",
      pasos: [
        "Hacer el pivoteo (pivote = 1, resto = 0)",
        "Actualizar la columna de variables básicas",
        "Leer la nueva solución en la columna Sol.",
        "Revisar optimalidad (zj − cj)"
      ],
      retro: "Correcto: primero el pivoteo; luego la nueva base, la lectura de la solución y la revisión de optimalidad.",
      pista: "La optimalidad se revisa con la tabla ya actualizada.",
      ref: "p. 16"
    }
  ]
};
