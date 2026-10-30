"use strict";

// ==========================================
// MK-5: SIMPLIFICADOR DE FUNCIONES BOOLEANAS
// Mapas de Karnaugh de 2 a 5 variables
// ==========================================

const variables = document.getElementById("variables");
const mintermsInput = document.getElementById("minterms");
const mapas = document.getElementById("mapas");
const mensaje = document.getElementById("mensaje");
const resultado = document.getElementById("resultado");
const circuito = document.getElementById("circuito");

const botonGenerar = document.getElementById("generar");
const botonImprimir = document.getElementById("imprimir");

const GRAY = [0, 1, 3, 2];
const LETRAS = ["A", "B", "C", "D", "E"];

const COLORES = [
    "#bbf7d0",
    "#bfdbfe",
    "#fde68a",
    "#f5d0fe",
    "#fed7aa",
    "#a5f3fc",
    "#fecaca",
    "#ddd6fe"
];

// ==========================================
// 1. VALIDAR LOS MINTERMS
// ==========================================

function obtenerMinterms() {
    const texto = mintermsInput.value.trim();
    const n = Number(variables.value);

    if (!Number.isInteger(n) || n < 2 || n > 5) {
        throw new Error("Selecciona entre 2 y 5 variables.");
    }

    if (!texto) {
        throw new Error("Ingresa al menos un minterm.");
    }

    const partes = texto.split(",");

    if (partes.some(p => !/^\d+$/.test(p.trim()))) {
        throw new Error(
            "Ingresa números enteros separados por comas."
        );
    }

    const numeros = partes.map(p => Number(p.trim()));
    const limite = 2 ** n;

    if (numeros.some(m => m < 0 || m >= limite)) {
        throw new Error(
            `Los minterms deben estar entre 0 y ${limite - 1}.`
        );
    }

    if (new Set(numeros).size !== numeros.length) {
        throw new Error("No repitas los minterms.");
    }

    return numeros.sort((a, b) => a - b);
}

// ==========================================
// 2. CREAR IMPLICANTES
// ==========================================

function crearImplicante(minterm, n) {
    return {
        bits: minterm.toString(2).padStart(n, "0"),
        minterms: [minterm]
    };
}

// ==========================================
// 3. COMBINAR IMPLICANTES
// ==========================================

function combinar(a, b) {
    let diferencias = 0;
    let posicion = -1;

    for (let i = 0; i < a.bits.length; i++) {
        if (a.bits[i] !== b.bits[i]) {
            if (a.bits[i] === "-" || b.bits[i] === "-") {
                return null;
            }

            diferencias++;
            posicion = i;
        }
    }

    if (diferencias !== 1) {
        return null;
    }

    const bits =
        a.bits.substring(0, posicion) +
        "-" +
        a.bits.substring(posicion + 1);

    return {
        bits,
        minterms: [...new Set([
            ...a.minterms,
            ...b.minterms
        ])].sort((x, y) => x - y)
    };
}

// ==========================================
// 4. ENCONTRAR IMPLICANTES PRIMOS
// ==========================================

function encontrarImplicantesPrimos(minterms, n) {
    let actuales = minterms.map(m => crearImplicante(m, n));
    const primos = new Map();

    while (actuales.length > 0) {
        const usados = new Set();
        const siguientes = new Map();

        for (let i = 0; i < actuales.length; i++) {
            for (let j = i + 1; j < actuales.length; j++) {
                const combinado = combinar(actuales[i], actuales[j]);

                if (!combinado) continue;

                usados.add(i);
                usados.add(j);

                const clave = combinado.bits;

                if (!siguientes.has(clave)) {
                    siguientes.set(clave, combinado);
                } else {
                    const existente = siguientes.get(clave);

                    existente.minterms = [...new Set([
                        ...existente.minterms,
                        ...combinado.minterms
                    ])].sort((a, b) => a - b);
                }
            }
        }

        actuales.forEach((implicante, i) => {
            if (!usados.has(i)) {
                primos.set(implicante.bits, implicante);
            }
        });

        actuales = [...siguientes.values()];
    }

    return [...primos.values()];
}

// ==========================================
// 5. CONVERTIR IMPLICANTES EN EXPRESIONES
// ==========================================

function implicanteAExpresion(bits) {
    const terminos = [];

    for (let i = 0; i < bits.length; i++) {
        if (bits[i] === "1") {
            terminos.push(LETRAS[i]);
        } else if (bits[i] === "0") {
            terminos.push("¬" + LETRAS[i]);
        }
    }

    return terminos.length ? terminos.join(" · ") : "1";
}

// ==========================================
// 6. SELECCIONAR LA MEJOR COBERTURA
// ==========================================

function seleccionarCobertura(primos, minterms) {
    const objetivos = new Set(minterms);

    const candidatos = primos.filter(p =>
        p.minterms.some(m => objetivos.has(m))
    );

    let mejor = null;
    let mejorLiterales = Infinity;
    let mejorCantidad = Infinity;

    function buscar(seleccionados, cubiertos) {
        if (cubiertos.size === objetivos.size) {
            const literales = seleccionados.reduce(
                (suma, indice) =>
                    suma +
                    candidatos[indice].bits
                        .split("")
                        .filter(bit => bit !== "-").length,
                0
            );

            const cantidad = seleccionados.length;

            if (
                literales < mejorLiterales ||
                (
                    literales === mejorLiterales &&
                    cantidad < mejorCantidad
                )
            ) {
                mejorLiterales = literales;
                mejorCantidad = cantidad;
                mejor = [...seleccionados];
            }

            return;
        }

        let opcionesMejor = null;

        for (const m of objetivos) {
            if (cubiertos.has(m)) continue;

            const opciones = candidatos
                .map((p, i) => ({ p, i }))
                .filter(({ p, i }) =>
                    !seleccionados.includes(i) &&
                    p.minterms.includes(m)
                );

            if (
                opcionesMejor === null ||
                opciones.length < opcionesMejor.length
            ) {
                opcionesMejor = opciones;
            }
        }

        if (!opcionesMejor || opcionesMejor.length === 0) {
            return;
        }

        for (const opcion of opcionesMejor) {
            const nuevosSeleccionados = [
                ...seleccionados,
                opcion.i
            ];

            const nuevosCubiertos = new Set(cubiertos);

            candidatos[opcion.i].minterms.forEach(m => {
                if (objetivos.has(m)) {
                    nuevosCubiertos.add(m);
                }
            });

            buscar(nuevosSeleccionados, nuevosCubiertos);
        }
    }

    buscar([], new Set());

    if (!mejor) {
        throw new Error("No se encontró una cobertura válida.");
    }

    return mejor.map(i => candidatos[i]);
}

// ==========================================
// 7. SIMPLIFICAR LA FUNCIÓN
// ==========================================

function simplificar(minterms, n) {
    const limite = 2 ** n;

    if (minterms.length === limite) {
        const grupoTotal = {
            bits: "-".repeat(n),
            minterms: [...minterms]
        };

        return {
            primos: [grupoTotal],
            seleccionados: [grupoTotal],
            expresion: "1"
        };
    }

    const primos = encontrarImplicantesPrimos(minterms, n);

    const seleccionados = seleccionarCobertura(
        primos,
        minterms
    );

    const expresion = seleccionados
        .map(p => `(${implicanteAExpresion(p.bits)})`)
        .join(" + ");

    return {
        primos,
        seleccionados,
        expresion
    };
}

// ==========================================
// 8. CREAR MAPAS DE KARNAUGH
// ==========================================

function crearMapa(valorA, minterms, n, grupos) {
    const bitsFila = n === 2 ? 1 : 2;
    const bitsColumna = n - bitsFila;

    const filas = bitsFila === 1 ? [0, 1] : GRAY;
    const columnas = bitsColumna === 1 ? [0, 1] : GRAY;

    const mintermsDelMapa = n === 5
        ? minterms.filter(m => Math.floor(m / 16) === valorA)
        : minterms;

    const gruposPorMinterm = new Map();

    grupos.forEach((grupo, indiceGrupo) => {
        grupo.minterms.forEach(m => {
            if (!gruposPorMinterm.has(m)) {
                gruposPorMinterm.set(m, []);
            }

            gruposPorMinterm.get(m).push(indiceGrupo);
        });
    });

    let html = `
        <div class="mapa">
            <h3>
                ${n === 5
                    ? `Mapa A = ${valorA}`
                    : "Mapa de Karnaugh"}
            </h3>

            <table>
                <thead>
                    <tr>
                        <th>Fila / Columna</th>
    `;

    columnas.forEach(c => {
        html += `
            <th>${c.toString(2).padStart(bitsColumna, "0")}</th>
        `;
    });

    html += "</tr></thead><tbody>";

    filas.forEach(f => {
        html += `
            <tr>
                <th>${f.toString(2).padStart(bitsFila, "0")}</th>
        `;

        columnas.forEach(c => {
            const indice = n === 5
                ? valorA * 16 + f * 4 + c
                : f * (2 ** bitsColumna) + c;

            const esUno = minterms.includes(indice);
            const membresias = gruposPorMinterm.get(indice) || [];

            const coloresCelda = membresias.map(
                g => COLORES[g % COLORES.length]
            );

            let fondo = esUno ? "#dcfce7" : "#f8fafc";
            let borde = "#cbd5e1";
            let etiquetaGrupo = "";

            if (membresias.length === 1) {
                fondo = coloresCelda[0];
                borde = coloresCelda[0];
                etiquetaGrupo = `G${membresias[0] + 1}`;
            } else if (membresias.length > 1) {
                const franjas = coloresCelda.map((color, i) => {
                    const inicio = i * 100 / coloresCelda.length;
                    const fin = (i + 1) * 100 / coloresCelda.length;

                    return `${color} ${inicio}% ${fin}%`;
                });

                fondo = `linear-gradient(135deg, ${franjas.join(", ")})`;
                borde = "#475569";

                etiquetaGrupo = membresias
                    .map(g => `G${g + 1}`)
                    .join(" / ");
            }

            const titulo = membresias.length
                ? `Minterm ${indice}; pertenece a ${etiquetaGrupo}`
                : `Minterm ${indice}; sin grupo seleccionado`;

            html += `
                <td
                    class="${esUno ? "uno" : "cero"} ${membresias.length ? "celda-grupo" : ""}"
                    style="background:${fondo}; border-color:${borde}"
                    title="${titulo}"
                >
                    <span class="valor-celda">
                        ${esUno ? "1" : "0"}
                    </span>

                    <small class="numero-minterm">
                        m(${indice})
                    </small>

                    ${
                        etiquetaGrupo
                            ? `<small class="etiqueta-grupo">${etiquetaGrupo}</small>`
                            : ""
                    }
                </td>
            `;
        });

        html += "</tr>";
    });

    html += "</tbody></table>";

    const gruposVisibles = grupos
        .map((grupo, indiceOriginal) => ({
            ...grupo,
            indiceOriginal
        }))
        .filter(grupo =>
            grupo.minterms.some(m => mintermsDelMapa.includes(m))
        );

    html += `
        <div class="leyenda-grupos">
            <h4>Grupos seleccionados</h4>
    `;

    if (gruposVisibles.length === 0) {
        html += "<p>No hay grupos en este mapa.</p>";
    } else {
        gruposVisibles.forEach(grupo => {
            const i = grupo.indiceOriginal;
            const color = COLORES[i % COLORES.length];
            const expresion = implicanteAExpresion(grupo.bits);

            const mintermsVisibles = grupo.minterms.filter(
                m => mintermsDelMapa.includes(m)
            );

            html += `
                <div class="item-grupo">
                    <span
                        class="muestra-color"
                        style="background:${color}; border-color:${color}"
                    ></span>

                    <div class="detalle-grupo">
                        <strong>G${i + 1}</strong>

                        <span class="expresion-grupo">
                            ${expresion}
                        </span>

                        <small>
                            Minterms: ${mintermsVisibles.join(", ")}
                        </small>
                    </div>
                </div>
            `;
        });
    }

    html += "</div></div>";

    return html;
}

// ==========================================
// 9. GENERAR CIRCUITO LÓGICO CON CONEXIONES
// ==========================================

function generarCircuito(grupos) {
    if (!grupos.length) {
        return "<p>No hay grupos para representar.</p>";
    }

    if (grupos.some(g => g.bits.split("").every(b => b === "-"))) {
        return `
            <div class="circuito-constante">
                <div class="constante-bloque">1</div>
                <p>Salida constante: <strong>F = 1</strong></p>
            </div>
        `;
    }

    const productos = grupos.map((grupo, indice) => ({
        nombre: `G${indice + 1}`,
        bits: grupo.bits,
        literales: grupo.bits
            .split("")
            .map((bit, i) => ({
                variable: LETRAS[i],
                bit
            }))
            .filter(l => l.bit !== "-"),
        expresion: implicanteAExpresion(grupo.bits),
        color: COLORES[indice % COLORES.length]
    }));

    const xEntrada = 28;
    const xNot = 115;
    const xAnd = 310;
    const xOr = 535;
    const xSalida = 700;

    const espacioLiteral = 30;
    const espacioGrupo = 42;
    let siguienteY = 75;

    productos.forEach(producto => {
        producto.alto = Math.max(
            85,
            producto.literales.length * espacioLiteral + 30
        );

        producto.yInicio = siguienteY;
        producto.centro = siguienteY + producto.alto / 2;

        siguienteY += producto.alto + espacioGrupo;
    });

    const alto = Math.max(200, siguienteY + 20);
    const centroOR = (
        productos[0].centro +
        productos[productos.length - 1].centro
    ) / 2;

    const altoOR = Math.max(
        65,
        productos[productos.length - 1].centro -
        productos[0].centro + 65
    );

    const arribaOR = centroOR - altoOR / 2;
    const abajoOR = centroOR + altoOR / 2;

    let svg = `
        <svg
            class="diagrama-circuito"
            viewBox="0 0 780 ${alto}"
            role="img"
            aria-label="Circuito lógico con compuertas NOT, AND y OR"
            xmlns="http://www.w3.org/2000/svg"
        >
            <text x="20" y="28" class="titulo-svg">Entradas</text>
            <text x="105" y="28" class="titulo-svg">NOT</text>
            <text x="320" y="28" class="titulo-svg">AND</text>
            <text x="555" y="28" class="titulo-svg">OR</text>
            <text x="700" y="28" class="titulo-svg">Salida</text>
    `;

    // Dibujar cada producto lógico.
    productos.forEach(producto => {
        const literales = producto.literales;
        const cantidad = literales.length;

        const primerY = producto.centro -
            ((cantidad - 1) * espacioLiteral) / 2;

        const altoGate = Math.max(
            54,
            cantidad * espacioLiteral + 12
        );

        const arribaGate = producto.centro - altoGate / 2;
        const abajoGate = producto.centro + altoGate / 2;

        svg += `
            <text
                x="20"
                y="${producto.yInicio + 14}"
                class="etiqueta-svg"
            >${producto.nombre}</text>

            <rect
                x="${xAnd - 12}"
                y="${arribaGate - 8}"
                width="115"
                height="${altoGate + 16}"
                rx="10"
                fill="${producto.color}"
                opacity="0.25"
            />
        `;

        // Dibujar cada entrada y, si corresponde, su NOT.
        literales.forEach((literal, i) => {
            const y = primerY + i * espacioLiteral;
            const negado = literal.bit === "0";

            svg += `
                <text
                    x="${xEntrada}"
                    y="${y + 5}"
                    class="literal-svg"
                >${literal.variable}</text>
            `;

            if (negado) {
                // Cable de entrada a NOT.
                svg += `
                    <line
                        x1="45" y1="${y}"
                        x2="${xNot}" y2="${y}"
                        class="cable-svg"
                    />

                    <!-- Triángulo de la compuerta NOT -->
                    <path
                        d="M ${xNot} ${y - 12}
                           L ${xNot + 24} ${y}
                           L ${xNot} ${y + 12} Z"
                        class="not-triangulo"
                    />

                    <!-- Círculo de inversión -->
                    <circle
                        cx="${xNot + 30}"
                        cy="${y}"
                        r="6"
                        class="not-burbuja"
                    />

                    <!-- Salida NOT hacia la entrada AND -->
                    <line
                        x1="${xNot + 36}" y1="${y}"
                        x2="${xAnd}" y2="${y}"
                        class="cable-svg"
                    />
                `;
            } else {
                // Entrada directa a AND, sin negación.
                svg += `
                    <line
                        x1="45" y1="${y}"
                        x2="${xAnd}" y2="${y}"
                        class="cable-svg"
                    />
                `;
            }
        });

        // Dibujar el símbolo AND.
        svg += `
            <path
                d="
                    M ${xAnd} ${arribaGate}
                    L ${xAnd + 32} ${arribaGate}
                    A 32 ${altoGate / 2} 0 0 1
                      ${xAnd + 32} ${abajoGate}
                    L ${xAnd} ${abajoGate}
                    Z
                "
                class="and-gate"
                fill="${producto.color}"
            />

            <text
                x="${xAnd + 20}"
                y="${producto.centro + 5}"
                text-anchor="middle"
                class="compuerta-svg"
            >AND</text>

            <!-- Salida del producto hacia la OR -->
            <line
                x1="${xAnd + 64}"
                y1="${producto.centro}"
                x2="${xOr}"
                y2="${producto.centro}"
                class="cable-svg"
            />
        `;
    });

    // Dibujar la compuerta OR con una entrada por producto.
    const xFormaOR = xOr + 12;
    const anchoFormaOR = 95;

    svg += `
        <path
            d="
                M ${xFormaOR} ${arribaOR}
                Q ${xFormaOR + 34} ${centroOR}
                  ${xFormaOR} ${abajoOR}
                Q ${xFormaOR + 52} ${abajoOR - 10}
                  ${xFormaOR + anchoFormaOR} ${centroOR}
                Q ${xFormaOR + 52} ${arribaOR + 10}
                  ${xFormaOR} ${arribaOR}
                Z
            "
            class="or-gate"
        />

        <text
            x="${xFormaOR + 44}"
            y="${centroOR + 5}"
            text-anchor="middle"
            class="compuerta-svg"
        >OR</text>
    `;

    // Conectar cada producto con su propia entrada de OR.
    productos.forEach(producto => {
        svg += `
            <line
                x1="${xOr}"
                y1="${producto.centro}"
                x2="${xFormaOR + 5}"
                y2="${producto.centro}"
                class="cable-svg"
            />
        `;
    });

    // Conectar la salida de OR con F.
    svg += `
        <line
            x1="${xFormaOR + anchoFormaOR}"
            y1="${centroOR}"
            x2="${xSalida}"
            y2="${centroOR}"
            class="cable-svg"
        />

        <circle
            cx="${xSalida}"
            cy="${centroOR}"
            r="5"
            fill="#16a34a"
        />

        <text
            x="${xSalida + 10}"
            y="${centroOR + 5}"
            class="salida-svg"
        >F</text>

        </svg>

        <div class="formula-circuito">
            <strong>Función simplificada:</strong>
            F = ${productos.map(p => `(${p.expresion})`).join(" + ")}
        </div>

        <div class="leyenda-circuito">
            <p><strong>NOT:</strong> invierte una entrada.</p>
            <p><strong>AND:</strong> produce 1 cuando todas sus entradas son 1.</p>
            <p><strong>OR:</strong> produce 1 cuando al menos una entrada es 1.</p>
        </div>
    `;

    return `<div class="circuito-contenedor">${svg}</div>`;
}

// ==========================================
// 10. VERIFICAR EQUIVALENCIA BOOLEANA
// ==========================================

function verificarEquivalencia(minterms, n, grupos) {
    const originales = new Set(minterms);
    const totalCombinaciones = 2 ** n;
    const errores = [];
    let coincidencias = 0;

    for (let numero = 0; numero < totalCombinaciones; numero++) {
        const bitsEntrada = numero.toString(2).padStart(n, "0");
        const resultadoOriginal = originales.has(numero);

        // La función simplificada vale 1 si al menos un grupo
        // seleccionado coincide con las entradas.
        const resultadoSimplificado = grupos.some(grupo =>
            grupo.bits.split("").every((bit, indice) =>
                bit === "-" || bit === bitsEntrada[indice]
            )
        );

        if (resultadoOriginal === resultadoSimplificado) {
            coincidencias++;
        } else {
            errores.push({
                minterm: numero,
                entrada: bitsEntrada,
                original: resultadoOriginal ? 1 : 0,
                simplificada: resultadoSimplificado ? 1 : 0
            });
        }
    }

    return {
        correcta: errores.length === 0,
        total: totalCombinaciones,
        coincidencias,
        errores
    };
}

// ==========================================
// 11. GENERAR RESULTADOS
// ==========================================

function generarMapa() {
    try {
        const minterms = obtenerMinterms();
        const n = Number(variables.value);

        const solucion = simplificar(minterms, n);

        const verificacion = verificarEquivalencia(
            minterms,
            n,
            solucion.seleccionados
        );

        mensaje.textContent = "";
        mensaje.className = "";

        if (n === 5) {
            mapas.innerHTML =
                crearMapa(0, minterms, n, solucion.seleccionados) +
                crearMapa(1, minterms, n, solucion.seleccionados);
        } else {
            mapas.innerHTML =
                crearMapa(0, minterms, n, solucion.seleccionados);
        }

        resultado.innerHTML = `
            <div class="resultado-funcion">
                <p>
                    <strong>Función original:</strong>
                    F = Σm(${minterms.join(", ")})
                </p>

                <p><strong>Expresión simplificada:</strong></p>

                <div class="expresion-final">
                    F = ${solucion.expresion}
                </div>

                <p>
                    <strong>Implicantes primos:</strong>
                    ${solucion.primos.length}
                </p>

                <p>
                    <strong>Grupos seleccionados:</strong>
                    ${solucion.seleccionados.length}
                </p>

                <div class="verificacion-equivalencia ${
                    verificacion.correcta
                        ? "verificacion-correcta"
                        : "verificacion-error"
                }">
                    <h3>
                        ${verificacion.correcta
                            ? "✓ Verificación superada"
                            : "✗ Se detectaron diferencias"}
                    </h3>

                    <p>
                        ${verificacion.correcta
                            ? "La función original y la simplificada son equivalentes."
                            : "La función original y la simplificada no coinciden en todas las entradas."}
                    </p>

                    <p>
                        <strong>Combinaciones comprobadas:</strong>
                        ${verificacion.total}
                    </p>

                    <p>
                        <strong>Coincidencias:</strong>
                        ${verificacion.coincidencias} de ${verificacion.total}
                    </p>

                    ${
                        verificacion.errores.length > 0
                            ? `
                                <h4>Combinaciones con diferencias</h4>
                                <ul>
                                    ${verificacion.errores.map(error => `
                                        <li>
                                            Entrada ${error.entrada}:
                                            original = ${error.original},
                                            simplificada = ${error.simplificada}
                                        </li>
                                    `).join("")}
                                </ul>
                            `
                            : ""
                    }
                </div>
            </div>
        `;

        circuito.innerHTML = generarCircuito(
            solucion.seleccionados
        );

    } catch (error) {
        mapas.innerHTML = "";
        resultado.textContent = "";
        circuito.textContent = "";

        mensaje.textContent = error.message;
        mensaje.className = "error";

        console.error("Error en MK-5:", error);
    }
}

// ==========================================
// 12. BOTONES
// ==========================================

botonGenerar.addEventListener("click", generarMapa);

botonImprimir.addEventListener("click", () => {
    window.print();
});