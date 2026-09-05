const { create, all } = require('mathjs');
const Plotly = require('plotly.js-dist-min');
const math = create(all);

const inputField = document.getElementById('calc-input');
const tapeContainer = document.getElementById('tape-container');
let memory = 0;
let graphCounter = 0;

let history = [];
let historyIndex = -1;
let tempInput = '';

const vibrantColors = ['#007aff', '#ff3b30', '#34c759', '#af52de', '#ff9500', '#5ac8fa', '#ff2d55', '#5856d6'];

function formatLocalNumber(value) {
    if (typeof value !== 'number' || isNaN(value)) return value;
    const rounded = Number(value.toFixed(10));
    return new Intl.NumberFormat('es-AR', {
        maximumFractionDigits: 10
    }).format(rounded);
}

const customScope = {
    ln: function(x) {
        return math.log(x);
    },
    derivative: function(expr, variable) {
        return math.derivative(expr, variable).toString();
    },
    deriv: function(expr, variable, x0) {
        const node = math.parse(expr);
        const compiled = node.compile();
        const h = 1e-7;
        const evalAt = (val) => compiled.evaluate({ [variable]: val });
        return (evalAt(x0 + h) - evalAt(x0 - h)) / (2 * h);
    },
    integral: function(expr, variable, a, b, n = 1000) {
        const node = math.parse(expr);
        const compiled = node.compile();
        const h = (b - a) / n;
        let sum = 0;
        for (let i = 0; i <= n; i++) {
            const x = a + i * h;
            const val = compiled.evaluate({ [variable]: x });
            if (i === 0 || i === n) sum += val;
            else if (i % 2 === 1) sum += 4 * val;
            else sum += 2 * val;
        }
        return (h / 3) * sum;
    },
    limit: function(expr, variable, target) {
        const node = math.parse(expr);
        const compiled = node.compile();
        const h = 1e-7;
        const evalAt = (val) => compiled.evaluate({ [variable]: val });
        
        const valLeft = evalAt(target - h);
        const valRight = evalAt(target + h);

        // Si los valores crecen enormemente y tienen signos opuestos (ej: 1/x en 0)
        if (Math.abs(valLeft) > 1e5 && Math.abs(valRight) > 1e5) {
            if (Math.sign(valLeft) !== Math.sign(valRight)) {
                return "∄"; // Símbolo de "No existe"
            }
            return valLeft > 0 ? "+∞" : "-∞";
        }

        const avg = (valLeft + valRight) / 2;
        return isNaN(avg) ? "∄" : avg;
    },
    ans: () => memory
};

inputField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const rawInput = inputField.value.trim();
        if (!rawInput) return;

        history.push(rawInput);
        historyIndex = history.length;
        tempInput = '';

        appendTape(rawInput);
        inputField.value = '';
    } 
    else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (history.length === 0) return;
        if (historyIndex === history.length) tempInput = inputField.value;
        if (historyIndex > 0) {
            historyIndex--;
            inputField.value = history[historyIndex];
        }
    } 
    else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (history.length === 0) return;
        if (historyIndex < history.length - 1) {
            historyIndex++;
            inputField.value = history[historyIndex];
        } else {
            historyIndex = history.length;
            inputField.value = tempInput;
        }
    }
});

function formatExpressionForTape(expr) {
    let formatted = expr;

    // 1. Formatear integrales: integral('expr', 'var', a, b) -> ∫_a^b expr d(var)
    formatted = formatted.replace(/integral\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/gi, (match, body, v, a, b) => {
        const bodyClean = body.replace(/([a-zA-Z0-9\)]+)\^(\d+)/g, (m, base, exp) => {
            const superscripts = {'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
            return `${base}${exp.split('').map(d => superscripts[d] || d).join('')}`;
        });
        return `<span class="math-integral"><span class="math-limits"><span class="math-sup">${b}</span><span class="math-symbol">∫</span><span class="math-sub">${a}</span></span><span class="math-body">${bodyClean}</span><span class="math-diff">d${v}</span></span>`;
    });

    // 2. Formatear derivadas analíticas: derivative('expr', 'var') -> d/d(var) [expr]
    formatted = formatted.replace(/derivative\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\)/gi, (match, body, v) => {
        const bodyClean = body.replace(/([a-zA-Z0-9\)]+)\^(\d+)/g, (m, base, exp) => {
            const superscripts = {'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
            return `${base}${exp.split('').map(d => superscripts[d] || d).join('')}`;
        });
        return `<span class="math-derivative"><span class="math-frac-deriv"><span class="math-num">d</span><span class="math-den">d${v}</span></span><span class="math-bracket">[${bodyClean}]</span></span>`;
    });

    // 3. Formatear potencias y multiplicaciones estándar
    formatted = formatted
        .replace(/([a-zA-Z0-9\)]+)\^(\d+)/g, (match, base, exp) => {
            const superscripts = {'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
            return `${base}${exp.split('').map(digit => superscripts[digit] || digit).join('')}`;
        })
        .replace(/\*/g, ' · ');

    // 4. Formatear fracciones simples (ej: 4/5)
    formatted = formatted.replace(/(\b\w+|\d+)\s*\/\s*(\b\w+|\d+\b)/g, (match, num, den) => {
        return `<span class="math-fraction"><span class="math-num">${num}</span><span class="math-den">${den}</span></span>`;
    });

    // Formatear límites: limit('expr', 'var', val) -> lim_(var→val) expr
    formatted = formatted.replace(/limit\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*,\s*([^)]+)\s*\)/gi, (match, body, v, target) => {
        const bodyClean = body.replace(/([a-zA-Z0-9\)]+)\^(\d+)/g, (m, base, exp) => {
            const superscripts = {'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
            return `${base}${exp.split('').map(d => superscripts[d] || d).join('')}`;
        });
        return `<span class="math-limit"><span class="math-lim-text">lim</span><span class="math-lim-sub">${v}→${target}</span><span class="math-body">${bodyClean}</span></span>`;
    });

    return formatted;
}

function appendTape(expr) {
    const lineDiv = document.createElement('div');
    lineDiv.className = 'tape-line';

    const headerDiv = document.createElement('div');
    headerDiv.className = 'tape-header';

    const exprSpan = document.createElement('span');
    exprSpan.className = 'tape-expression';
    
    // Usamos innerHTML para que renderice correctamente las fracciones HTML
    exprSpan.innerHTML = formatExpressionForTape(expr);

    const rightContainer = document.createElement('div');
    rightContainer.style.display = 'flex';
    rightContainer.style.alignItems = 'center';

    const resultSpan = document.createElement('span');
    resultSpan.className = 'tape-result';

    let graphDataToRender = null;
    const manMatch = expr.match(/^man(\s+(.+))?$/i);
    const funcMatch = expr.match(/^f\s*\(([^)]+)\)\s*=\s*(.+)$/i);

    try {
        if (manMatch) {
            const topic = manMatch[2] ? manMatch[2].trim().toLowerCase() : '';
            openHelpModal(topic);
            resultSpan.textContent = `= ventana ayuda`;
            rightContainer.appendChild(resultSpan);
            headerDiv.appendChild(exprSpan);
            headerDiv.appendChild(rightContainer);
            lineDiv.appendChild(headerDiv);
        } 
        else if (funcMatch) {
            const vars = funcMatch[1].split(',').map(v => v.trim());
            const body = funcMatch[2].trim();
            resultSpan.textContent = `= f(${vars.join(', ')})`;
            rightContainer.appendChild(resultSpan);
            headerDiv.appendChild(exprSpan);
            headerDiv.appendChild(rightContainer);
            lineDiv.appendChild(headerDiv);

            graphDataToRender = { vars, body };
        } else {
            const evaluated = math.evaluate(expr, customScope);
            let resultVal = (typeof evaluated === 'object' && evaluated?.entries) 
                ? evaluated.entries[evaluated.entries.length - 1] 
                : evaluated;

            if (typeof resultVal === 'function') throw new Error("Expresión incompleta");

            if (typeof resultVal === 'number') {
                memory = resultVal;
                resultSpan.textContent = `= ${formatLocalNumber(resultVal)}`;
            } else {
                resultSpan.textContent = `= ${resultVal}`;
            }

            rightContainer.appendChild(resultSpan);
            headerDiv.appendChild(exprSpan);
            headerDiv.appendChild(rightContainer);
            lineDiv.appendChild(headerDiv);
        }
    } catch (err) {
        resultSpan.className = 'tape-result tape-error';
        resultSpan.textContent = `= Error`;
        headerDiv.appendChild(exprSpan);
        rightContainer.appendChild(resultSpan);
        headerDiv.appendChild(rightContainer);
        lineDiv.appendChild(headerDiv);
    }

    if (graphDataToRender) {
        const graphDivId = `graph-plot-${graphCounter++}`;
        const plotContainer = document.createElement('div');
        plotContainer.id = graphDivId;
        plotContainer.style.width = '100%';
        plotContainer.style.height = '260px';
        plotContainer.style.marginTop = '4px';
        lineDiv.appendChild(plotContainer);

        setTimeout(() => renderInlineGraph(graphDataToRender.vars, graphDataToRender.body, graphDivId), 50);
    }

    tapeContainer.appendChild(lineDiv);
    tapeContainer.scrollTop = tapeContainer.scrollHeight;
}

// Ventana Modal de Ayuda Independiente con funciones clickeables
function openHelpModal(topic) {
    // Eliminar modal anterior si existía
    const existingModal = document.getElementById('help-modal');
    if (existingModal) existingModal.remove();

    const overlay = document.createElement('div');
    overlay.id = 'help-modal';
    overlay.className = 'help-modal-overlay';

    let contentHTML = '';

    if (!topic) {
        contentHTML = `
            <div style="font-weight:bold; margin-bottom:8px; color:#0066cc;">--- MANUAL DE COMANDOS Y FUNCIONES ---</div>
            <p style="color:#86868b; margin-top:0;">Hacé clic en cualquier función para insertarla automáticamente en la calculadora.</p>
            <table style="width:100%; border-collapse:collapse; font-size:13px;">
              <tr><td style="padding:4px 0; width:35%;"><b>Aritmética básica</b></td><td>+ , - , * , / , <span class="help-clickable-item" onclick="insertCommand('^')">^</span> (potencia), <span class="help-clickable-item" onclick="insertCommand('sqrt(x)')">sqrt</span></td></tr>
              <tr><td style="padding:4px 0;"><b>Trigonometría</b></td><td><span class="help-clickable-item" onclick="insertCommand('sin(x)')">sin</span>, <span class="help-clickable-item" onclick="insertCommand('cos(x)')">cos</span>, <span class="help-clickable-item" onclick="insertCommand('tan(x)')">tan</span></td></tr>
              <tr><td style="padding:4px 0;"><b>Logaritmos</b></td><td><span class="help-clickable-item" onclick="insertCommand('ln(x)')">ln</span>, <span class="help-clickable-item" onclick="insertCommand('log(x)')">log</span></td></tr>
              <tr><td style="padding:4px 0;"><b>Estadística</b></td><td><span class="help-clickable-item" onclick="insertCommand('mean([1, 2, 3])')">mean</span>, <span class="help-clickable-item" onclick="insertCommand('median([1, 2, 3])')">median</span>, <span class="help-clickable-item" onclick="insertCommand('std([1, 2, 3])')">std</span>, <span class="help-clickable-item" onclick="insertCommand('variance([1, 2, 3])')">variance</span>, <span class="help-clickable-item" onclick="insertCommand('min([1, 2, 3])')">min</span>, <span class="help-clickable-item" onclick="insertCommand('max([1, 2, 3])')">max</span></td></tr>
              <tr><td style="padding:4px 0;"><b>Cálculo</b></td><td><span class="help-clickable-item" onclick="insertCommand('derivative(\'x^2\', \'x\')')">derivative</span>, <span class="help-clickable-item" onclick="insertCommand('deriv(\'x^2\', \'x\', 2)')">deriv</span>, <span class="help-clickable-item" onclick="insertCommand('integral(\'x^2\', \'x\', 0, 3)')">integral</span></td></tr>
              <tr><td style="padding:4px 0;"><b>Gráficas 2D/3D</b></td><td><span class="help-clickable-item" onclick="insertCommand('f(x) = x^2 - 4')">f(x) = ...</span>, <span class="help-clickable-item" onclick="insertCommand('f(x, y) = x^2 - y^2')">f(x, y) = ...</span></td></tr>
            </table>
        `;
    } else {
        const detailedManuals = {
            'sqrt': `<b>[sqrt] Raíz cuadrada</b><br>Sintaxis: <code>sqrt(número)</code><br>Ejemplo: <span class="help-clickable-item" onclick="insertCommand('sqrt(25)')">sqrt(25)</span> -> 5`,
            'log': `<b>[log] Logaritmo base 10</b><br>Sintaxis: <code>log(número)</code><br>Ejemplo: <span class="help-clickable-item" onclick="insertCommand('log(100)')">log(100)</span> -> 2`,
            'ln': `<b>[ln] Logaritmo natural</b><br>Sintaxis: <code>ln(número)</code><br>Ejemplo: <span class="help-clickable-item" onclick="insertCommand('ln(2.71828)')">ln(2.71828)</span> -> 1`,
            'derivative': `<b>[derivative] Derivada simbólica</b><br>Sintaxis: <code>derivative('expresión', 'variable')</code><br>Ejemplo: <span class="help-clickable-item" onclick="insertCommand('derivative(\'x^3 + 2*x\', \'x\')')">derivative('x^3 + 2*x', 'x')</span>`,
            'deriv': `<b>[deriv] Derivada numérica puntual</b><br>Sintaxis: <code>deriv('expresión', 'variable', valor)</code><br>Ejemplo: <span class="help-clickable-item" onclick="insertCommand('deriv(\'x^2\', \'x\', 3)')">deriv('x^2', 'x', 3)</span>`,
            'integral': `<b>[integral] Integral definida</b><br>Sintaxis: <code>integral('expresión', 'variable', a, b)</code><br>Ejemplo: <span class="help-clickable-item" onclick="insertCommand('integral(\'x^2\', \'x\', 0, 3)')">integral('x^2', 'x', 0, 3)</span>`,
            'mean': `<b>[mean] Promedio estadístico</b><br>Sintaxis: <code>mean([lista])</code><br>Ejemplo: <span class="help-clickable-item" onclick="insertCommand('mean([10, 20, 30])')">mean([10, 20, 30])</span>`
        };
        contentHTML = detailedManuals[topic] || `No hay detalles específicos para "<b>${topic}</b>".`;
    }

    overlay.innerHTML = `
        <div class="help-modal-card">
            <div class="help-modal-header">
                <span>MANUAL DE AYUDA // RTFCALC</span>
                <button class="help-modal-close" onclick="document.getElementById('help-modal').remove()">[ X ]</button>
            </div>
            <div class="help-modal-body">
                ${contentHTML}
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
}

// Función global accesible desde el HTML generado para insertar comandos al hacer clic
window.insertCommand = function(cmd) {
    inputField.value = cmd;
    inputField.focus();
    const modal = document.getElementById('help-modal');
    if (modal) modal.remove();
};

function renderInlineGraph(vars, bodyExpr, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const is3D = vars.length >= 2 || vars.includes('y');

    if (is3D) {
        const node = math.parse(bodyExpr);
        const compiled = node.compile();

        const xValues = [];
        const yValues = [];
        const zValues = [];

        for (let i = -5; i <= 5; i += 0.4) xValues.push(i);
        for (let j = -5; j <= 5; j += 0.4) yValues.push(j);

        for (let y of yValues) {
            const row = [];
            for (let x of xValues) {
                try {
                    const val = compiled.evaluate({ x: x, y: y, ...customScope });
                    row.push(typeof val === 'number' && !isNaN(val) && isFinite(val) ? val : null);
                } catch {
                    row.push(null);
                }
            }
            zValues.push(row);
        }

        const data = [{
            z: zValues,
            x: xValues,
            y: yValues,
            type: 'surface',
            colorscale: 'Turbo'
        }];

        const layout = {
            margin: { t: 10, b: 10, l: 10, r: 10 },
            font: { family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', size: 11, color: '#1d1d1f' },
            scene: {
                xaxis: { title: vars[0] || 'X' },
                yaxis: { title: vars[1] || 'Y' },
                zaxis: { title: 'Z' }
            },
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent'
        };

        Plotly.newPlot(container, data, layout, { responsive: true, displayModeBar: false });

    } else {
        const expressions = bodyExpr.split(',').map(e => e.trim());
        const traces = [];
        const xValues = [];
        
        // Rango simétrico de -10 a 10 con paso de 0.1
        for (let x = -10; x <= 10; x += 0.1) {
            xValues.push(Number(x.toFixed(2)));
        }

        expressions.forEach((expr, index) => {
            try {
                const node = math.parse(expr);
                const compiled = node.compile();
                const yValues = xValues.map(x => {
                    try {
                        const y = compiled.evaluate({ [vars[0]]: x, ...customScope });
                        return (typeof y === 'number' && !isNaN(y) && isFinite(y)) ? y : null;
                    } catch {
                        return null;
                    }
                });

                const color = vibrantColors[index % vibrantColors.length];

                traces.push({
                    x: xValues,
                    y: yValues,
                    type: 'scatter',
                    mode: 'lines',
                    name: expr,
                    line: { color: color, width: 3 }
                });
            } catch (e) {
                console.error(`Error evaluando ${expr}`, e);
            }
        });

        const layout = {
            margin: { t: 10, b: 30, l: 30, r: 10 },
            font: { family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', size: 11, color: '#1d1d1f' },
            xaxis: { title: vars[0] || 'x', gridcolor: '#e5e5ea' },
            yaxis: { title: 'y', gridcolor: '#e5e5ea' },
            legend: { orientation: 'h', y: 1.2, x: 0 },
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent'
        };

        Plotly.newPlot(container, traces, layout, { responsive: true, displayModeBar: false });
    }
}