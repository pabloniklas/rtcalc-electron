const { create, all } = require('mathjs');
const Plotly = require('plotly.js-dist-min');
const math = create(all);
const { t, currentLang } = require('./i18n.js');

const inputField = document.getElementById('calc-input');
const tapeContainer = document.getElementById('tape-container');
const helpBtn = document.getElementById('help-btn');
const clearTapeBtn = document.getElementById('clear-tape-btn');
const submitBtn = document.getElementById('submit-btn');

let memory = 0;
let graphCounter = 0;
let history = [];
let historyIndex = -1;
let tempInput = '';

const vibrantColors = ['#007aff', '#ff3b30', '#34c759', '#af52de', '#ff9500', '#5ac8fa', '#ff2d55', '#5856d6'];

// Formateo numérico automático basado en el idioma activo
function formatLocalNumber(value) {
    if (typeof value !== 'number' || isNaN(value)) return value;
    const rounded = Number(value.toFixed(10));
    
    // Asignar el locale correspondiente para la representación decimal/miles
    const localeMap = {
        'es': 'es-AR',
        'en': 'en-US',
        'fr': 'fr-FR',
        'it': 'it-IT'
    };
    
    return new Intl.NumberFormat(localeMap[currentLang] || 'es-AR', {
        maximumFractionDigits: 10
    }).format(rounded);
}

// Cargar cadenas traducidas en la UI al iniciar
document.addEventListener('DOMContentLoaded', () => {
    if (inputField) inputField.placeholder = t('placeholder');
    if (helpBtn) helpBtn.title = t('btnHelpTitle');
    if (clearTapeBtn) clearTapeBtn.title = t('btnClearTitle');
    if (submitBtn) submitBtn.title = t('btnSubmitTitle');

    // Desvanecer splash modal automáticamente
    const splashModal = document.getElementById('about-splash');
    if (splashModal) {
        setTimeout(() => splashModal.remove(), 3500);
    }
});

// Procesamiento de comandos y entrada
function processInput() {
    const rawInput = inputField.value.trim();
    if (!rawInput) return;

    if (rawInput.toLowerCase() === 'man' || rawInput.toLowerCase() === 'help') {
        openHelpModal();
        inputField.value = '';
        return;
    }

    history.push(rawInput);
    historyIndex = history.length;
    tempInput = '';

    appendTape(rawInput);
    inputField.value = '';
    inputField.focus();
}

if (submitBtn) {
    submitBtn.addEventListener('click', processInput);
}

if (clearTapeBtn) {
    clearTapeBtn.addEventListener('click', () => {
        tapeContainer.innerHTML = '';
        history = [];
        historyIndex = -1;
        tempInput = '';
        memory = 0;
        inputField.focus();
    });
}

if (helpBtn) {
    helpBtn.addEventListener('click', openHelpModal);
}

// Navegación de historial y Enter
inputField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        processInput();
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (history.length === 0) return;
        if (historyIndex === history.length) tempInput = inputField.value;
        if (historyIndex > 0) {
            historyIndex--;
            inputField.value = history[historyIndex];
        }
    } else if (e.key === 'ArrowDown') {
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

function formatResultForTape(resultStr) {
    if (typeof resultStr !== 'string') return resultStr;

    const superscripts = {
        '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
        '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
    };

    return resultStr
        .replace(/([a-zA-Z0-9\)]+)\^(\d+)/g, (match, base, exp) => {
            return `${base}${exp.split('').map(digit => superscripts[digit] || digit).join('')}`;
        })
        .replace(/\*/g, ' · ');
}

const customScope = {
    ln: function (x) {
        return math.log(x);
    },
    derivative: function (expr, variable) {
        return math.derivative(expr, variable).toString();
    },
    deriv: function (expr, variable, x0) {
        const node = math.parse(expr);
        const compiled = node.compile();
        const h = 1e-7;
        const evalAt = (val) => compiled.evaluate({ [variable]: val });
        return (evalAt(x0 + h) - evalAt(x0 - h)) / (2 * h);
    },
    integral: function (expr, variable, a, b, n = 1000) {
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
    factor: function (exprOrNode) {
        try {
            let exprStr = typeof exprOrNode === 'string' ? exprOrNode : exprOrNode.toString();
            exprStr = exprStr.replace(/\s+/g, '').toLowerCase();

            const groupMatch = exprStr.match(/^([a-z0-9]+)([a-z])\+([a-z0-9]+)\2\+([a-z0-9]+)([a-z])\+([a-z0-9]+)\5$/);
            if (groupMatch) {
                const [_, t1, v1, t2, t3, v2, t4] = groupMatch;
                if (t1 === t3 && t2 === t4) {
                    return `(${t1} + ${t2}) * (${v1} + ${v2})`;
                }
            }

            const terms = exprStr.split(/(?=[+-])/);
            if (terms.length > 1) {
                const gcd = (a, b) => b === 0 ? Math.abs(a) : gcd(b, a % b);
                const coeffs = terms.map(t => {
                    const m = t.match(/^[+-]?\d+/);
                    if (m) return parseInt(m[0]);
                    return t.startsWith('-') ? -1 : 1;
                });

                const commonNum = coeffs.reduce((acc, val) => gcd(acc, val));
                let minExp = Infinity;
                terms.forEach(t => {
                    if (!t.includes('x')) minExp = 0;
                    else {
                        const expMatch = t.match(/x\^(\d+)/);
                        if (expMatch) minExp = Math.min(minExp, parseInt(expMatch[1]));
                        else minExp = Math.min(minExp, 1);
                    }
                });

                if (commonNum > 1 || minExp > 0) {
                    const factorStr = `${commonNum > 1 ? commonNum : ''}${minExp > 0 ? (minExp === 1 ? 'x' : `x^${minExp}`) : ''}`;
                    const rest = terms.map(t => {
                        let c = (coeffs[terms.indexOf(t)] / commonNum);
                        let expMatch = t.match(/x\^(\d+)/);
                        let exp = t.includes('x') ? (expMatch ? parseInt(expMatch[1]) : 1) : 0;
                        let newExp = exp - minExp;

                        let cStr = c === 1 && newExp > 0 ? '' : (c === -1 && newExp > 0 ? '-' : c.toString());
                        let xStr = newExp === 0 ? '' : (newExp === 1 ? 'x' : `x^${newExp}`);
                        return `${cStr}${xStr}`;
                    }).join(' + ').replace(/\+ -/g, '- ');

                    return `${factorStr} * (${rest})`;
                }
            }

            const diffSquares = exprStr.match(/^([a-z0-9\*]+)\^2\-([a-z0-9\*]+)\^2$/);
            if (diffSquares) {
                return `(${diffSquares[1]} - ${diffSquares[2]}) * (${diffSquares[1]} + ${diffSquares[2]})`;
            }

            const match = exprStr.match(/([+-]?\d*)\*?x\^2([+-]?\d*\*?x)?([+-]?\d+)?/);
            if (match) {
                let a = match[1] === '' || match[1] === '+' ? 1 : (match[1] === '-' ? -1 : parseFloat(match[1]));
                let b = parseFloat((match[2] || '0').replace('x', '').replace('*', '')) || 0;
                let c = parseFloat(match[3]) || 0;

                const discriminant = b * b - 4 * a * c;
                if (discriminant >= 0) {
                    const x1 = (-b + Math.sqrt(discriminant)) / (2 * a);
                    const x2 = (-b - Math.sqrt(discriminant)) / (2 * a);
                    const formatRoot = (r) => r === 0 ? 'x' : (r > 0 ? `(x - ${r})` : `(x + ${Math.abs(r)})`);
                    let coeffStr = (a !== 1) ? a : '';
                    if (x1 === x2) return `${coeffStr}${formatRoot(x1)}²`;
                    return `${coeffStr}${formatRoot(x1)} * ${formatRoot(x2)}`;
                }
            }

            return math.simplify(exprStr).toString();
        } catch (e) {
            return t('errUnresolved');
        }
    },
    limit: function (expr, variable, target) {
        const node = math.parse(expr);
        const compiled = node.compile();
        const h = 1e-7;
        const evalAt = (val) => compiled.evaluate({ [variable]: val });

        const valLeft = evalAt(target - h);
        const valRight = evalAt(target + h);

        if (Math.abs(valLeft) > 1e5 && Math.abs(valRight) > 1e5) {
            if (Math.sign(valLeft) !== Math.sign(valRight)) {
                return "∄";
            }
            return valLeft > 0 ? "+∞" : "-∞";
        }

        const avg = (valLeft + valRight) / 2;
        return isNaN(avg) ? "∄" : avg;
    },
    solveLinear: function (a, b, c) {
        return (c - b) / a;
    },
    mcd: function (...args) {
        return args.reduce((acc, val) => math.gcd(acc, val));
    },
    mcm: function (...args) {
        return args.reduce((acc, val) => math.lcm(acc, val));
    },
    factors: function (n) {
        let num = Math.abs(parseInt(n));
        if (isNaN(num) || num < 2) return t('errEnterPrime');

        const factors = {};
        let d = 2;

        while (num >= 2) {
            while (num % d === 0) {
                factors[d] = (factors[d] || 0) + 1;
                num /= d;
            }
            d++;
            if (d * d > num) {
                if (num > 1) {
                    factors[num] = (factors[num] || 0) + 1;
                    break;
                }
            }
        }

        return Object.entries(factors)
            .map(([prime, exp]) => exp > 1 ? `${prime}^${exp}` : `${prime}`)
            .join(' * ');
    },
    congruent: function (a, b, m) {
        if (m === 0) return t('errDivZero');
        const modA = math.mod(a, m);
        const modB = math.mod(b, m);
        const isEquivalent = Math.abs(modA - modB) < 1e-9;

        return isEquivalent ? `true (${a} ≡ ${b} mod ${m})` : `false (${a} ≢ ${b} mod ${m})`;
    },
    laplace: function (expr) {
        let e = expr.replace(/\s+/g, '').toLowerCase();

        if (!isNaN(e)) return `${e}/s`;

        const tPowMatch = e.match(/^t\^(\d+)$/);
        if (tPowMatch) {
            const n = parseInt(tPowMatch[1]);
            const fact = (num) => num <= 1 ? 1 : num * fact(num - 1);
            return `${fact(n)} / s^${n + 1}`;
        }
        if (e === 't') return '1 / s^2';

        const expMatch = e.match(/^exp\(([+-]?\d*)\*?t\)$/) || e.match(/^e\^\(([+-]?\d*)\*?t\)$/);
        if (expMatch) {
            let a = expMatch[1] === '' || expMatch[1] === '+' ? 1 : (expMatch[1] === '-' ? -1 : parseFloat(expMatch[1]));
            return a > 0 ? `1 / (s - ${a})` : `1 / (s + ${Math.abs(a)})`;
        }

        const sinMatch = e.match(/^sin\(([+-]?\d*)\*?t\)$/);
        if (sinMatch) {
            let w = sinMatch[1] === '' || sinMatch[1] === '+' ? 1 : parseFloat(sinMatch[1]);
            return `${w} / (s^2 + ${w * w})`;
        }

        const cosMatch = e.match(/^cos\(([+-]?\d*)\*?t\)$/);
        if (cosMatch) {
            let w = cosMatch[1] === '' || cosMatch[1] === '+' ? 1 : parseFloat(cosMatch[1]);
            return `s / (s^2 + ${w * w})`;
        }

        return t('errUnresolved');
    },
    fourierTerm: function (expr, n, L = Math.PI) {
        return `a_${n}*cos(${n}*x) + b_${n}*sin(${n}*x)`;
    },
    fourier: function (expr, N = 3) {
        const L = Math.PI;
        const a0 = (1 / L) * customScope.integral(expr, 'x', -L, L);

        let sumTerms = [`${(a0 / 2).toFixed(4)}`];

        for (let n = 1; n <= N; n++) {
            const an = (1 / L) * customScope.integral(`(${expr}) * cos(${n}*x)`, 'x', -L, L);
            const bn = (1 / L) * customScope.integral(`(${expr}) * sin(${n}*x)`, 'x', -L, L);

            const termA = Math.abs(an) > 1e-4 ? `${an.toFixed(4)} * cos(${n}*x)` : '';
            const termB = Math.abs(bn) > 1e-4 ? `${bn.toFixed(4)} * sin(${n}*x)` : '';

            if (termA) sumTerms.push(an >= 0 ? `+ ${termA}` : `- ${termA.replace('-', '')}`);
            if (termB) sumTerms.push(bn >= 0 ? `+ ${termB}` : `- ${termB.replace('-', '')}`);
        }

        const reconstructedExpr = sumTerms.join(' ');
        return `f(x) = ${expr}, ${reconstructedExpr}`;
    },
    solveQuad: function (a, b, c) {
        const discriminant = b * b - 4 * a * c;
        if (discriminant > 0) {
            const x1 = (-b + Math.sqrt(discriminant)) / (2 * a);
            const x2 = (-b - Math.sqrt(discriminant)) / (2 * a);
            return [`x₁ = ${formatLocalNumber(x1)}`, `x₂ = ${formatLocalNumber(x2)}`];
        } else if (discriminant === 0) {
            const x = -b / (2 * a);
            return [`x = ${formatLocalNumber(x)}`];
        } else {
            const real = formatLocalNumber(-b / (2 * a));
            const imag = formatLocalNumber(Math.sqrt(-discriminant) / (2 * a));
            return [`x₁ = ${real} + ${imag}i`, `x₂ = ${real} - ${imag}i`];
        }
    },
    diophantine: function (a, b, c) {
        function extendedGCD(a, b) {
            if (b === 0) return [1, 0, a];
            const [x1, y1, gcd] = extendedGCD(b, a % b);
            const x = y1;
            const y = x1 - Math.floor(a / b) * y1;
            return [x, y, gcd];
        }

        const [x0_base, y0_base, gcd] = extendedGCD(a, b);
        if (c % gcd !== 0) {
            return t('errNoDiophantine');
        }

        const factor = c / gcd;
        const x0 = x0_base * factor;
        const y0 = y0_base * factor;
        const stepX = b / gcd;
        const stepY = a / gcd;

        return `x = ${x0} + ${stepX}k,  y = ${y0} - ${stepY}k  (k ∈ ℤ)`;
    },
    ans: () => memory
};

function formatMatrixAsHTML(mat) {
    if (!Array.isArray(mat) || !Array.isArray(mat[0])) return mat;

    let rowsHTML = mat.map(row => {
        let cols = row.map(val => `<span class="mat-cell">${typeof val === 'number' ? formatLocalNumber(val) : val}</span>`).join('');
        return `<span class="mat-row">${cols}</span>`;
    }).join('');

    return `<span class="math-matrix"><span class="mat-bracket">[</span><span class="mat-rows">${rowsHTML}</span><span class="mat-bracket">]</span></span>`;
}

function formatExpressionForTape(expr) {
    let formatted = expr;

    const cleanMatrixInString = (matStr) => {
        try {
            const parsed = JSON.parse(matStr.replace(/'/g, '"'));
            if (Array.isArray(parsed) && Array.isArray(parsed[0])) {
                let rowsHTML = parsed.map(row => {
                    let cols = row.map(val => `<span class="mat-cell">${val}</span>`).join('');
                    return `<span class="mat-row">${cols}</span>`;
                }).join('');
                return `<span class="math-matrix"><span class="mat-bracket">[</span><span class="mat-rows">${rowsHTML}</span><span class="mat-bracket">]</span></span>`;
            }
        } catch (e) {}
        return matStr;
    };

    formatted = formatted.replace(/(inv|det|transpose|eigenvalues)\s*\(\s*(\[[\s\S]*?\])\s*\)/gi, (match, func, matContent) => {
        const formattedMat = cleanMatrixInString(matContent);
        return `<span class="math-func-op">${func}</span>(${formattedMat})`;
    });

    formatted = formatted.replace(/laplace\s*\(\s*['"]([^'"]+)['"]\s*\)/gi, (match, body) => {
        return `<span class="math-func-op">ℒ</span>{<span class="math-body">${body}</span>}`;
    });

    formatted = formatted.replace(/integral\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/gi, (match, body, v, a, b) => {
        const superscripts = {'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
        const bodyClean = body.replace(/([a-zA-Z0-9\)]+)\^(\d+)/g, (m, base, exp) => `${base}${exp.split('').map(d => superscripts[d] || d).join('')}`);
        return `<span class="math-integral"><span class="math-limits"><span class="math-sup">${b}</span><span class="math-symbol">∫</span><span class="math-sub">${a}</span></span><span class="math-body">${bodyClean}</span><span class="math-diff">d${v}</span></span>`;
    });

    formatted = formatted.replace(/derivative\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\)/gi, (match, body, v) => {
        const superscripts = {'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
        const bodyClean = body.replace(/([a-zA-Z0-9\)]+)\^(\d+)/g, (m, base, exp) => `${base}${exp.split('').map(d => superscripts[d] || d).join('')}`);
        return `<span class="math-derivative"><span class="math-frac-deriv"><span class="math-num">d</span><span class="math-den">d${v}</span></span><span class="math-bracket-custom">[${bodyClean}]</span></span>`;
    });

    formatted = formatted.replace(/limit\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*,\s*([^)]+)\s*\)/gi, (match, body, v, target) => {
        const superscripts = {'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
        const bodyClean = body.replace(/([a-zA-Z0-9\)]+)\^(\d+)/g, (m, base, exp) => `${base}${exp.split('').map(d => superscripts[d] || d).join('')}`);
        return `<span class="math-limit"><span class="math-lim-text">lim</span><span class="math-lim-sub">${v}→${target}</span><span class="math-body">${bodyClean}</span></span>`;
    });

    formatted = formatted
        .replace(/([a-zA-Z0-9\)]+)\^(\d+)/g, (match, base, exp) => {
            const superscripts = {'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
            return `${base}${exp.split('').map(digit => superscripts[digit] || digit).join('')}`;
        })
        .replace(/\*/g, ' · ');

    formatted = formatted.replace(/(\b\w+|\d+)\s*\/\s*(\b\w+|\d+\b)/g, (match, num, den) => {
        return `<span class="math-fraction"><span class="math-num">${num}</span><span class="math-den">${den}</span></span>`;
    });

    formatted = formatted.replace(/fourier\s*\(\s*['"]([^'"]+)['"]\s*,\s*(\d+)\s*\)/gi, (match, body, n) => {
        return `<span class="math-func-op">Fourier</span>(<span class="math-body">${body}</span>, N=${n})`;
    });

    formatted = formatted.replace(/congruent\s*\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/gi, (match, a, b, m) => {
        return `<span class="math-func-op">${a.trim()}</span> ≡ <span class="math-func-op">${b.trim()}</span> (mod ${m.trim()})`;
    });

    formatted = formatted.replace(/factors\s*\(\s*(\d+)\s*\)/gi, (match, num) => {
        return `<span class="math-func-op">factors</span>(${num})`;
    });

    formatted = formatted.replace(/factor\s*\(\s*['"]([^'"]+)['"]\s*\)/gi, (match, body) => {
        const superscripts = {'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
        const bodyClean = body.replace(/([a-zA-Z0-9\)]+)\^(\d+)/g, (m, base, exp) => `${base}${exp.split('').map(d => superscripts[d] || d).join('')}`);
        return `<span class="math-factor-op">factor</span>(${bodyClean})`;
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
    exprSpan.innerHTML = formatExpressionForTape(expr);

    const rightContainer = document.createElement('div');
    rightContainer.style.display = 'flex';
    rightContainer.style.alignItems = 'center';

    const resultSpan = document.createElement('span');
    resultSpan.className = 'tape-result';

    let graphDataToRender = null;
    const funcMatch = expr.match(/^f\s*\(([^)]+)\)\s*=\s*(.+)$/i);

    const fourierMatch = expr.match(/^fourier\s*\(\s*['"]([^'"]+)['"]\s*,\s*(\d+)\s*\)/i);
    if (fourierMatch) {
        const body = fourierMatch[1];
        const nTerms = parseInt(fourierMatch[2]);

        const plotCmd = customScope.fourier(body, nTerms);
        const varsAndBody = plotCmd.match(/^f\s*\(([^)]+)\)\s*=\s*(.+)$/i);

        resultSpan.textContent = `= ${t('fourierTitle')} (N=${nTerms})`;
        rightContainer.appendChild(resultSpan);
        headerDiv.appendChild(exprSpan);
        headerDiv.appendChild(rightContainer);
        lineDiv.appendChild(headerDiv);

        graphDataToRender = {
            vars: [varsAndBody[1].trim()],
            body: varsAndBody[2].trim()
        };
    }

    try {
        if (funcMatch) {
            const vars = funcMatch[1].split(',').map(v => v.trim());
            const body = funcMatch[2].trim();
            resultSpan.textContent = `= f(${vars.join(', ')})`;
            rightContainer.appendChild(resultSpan);
            headerDiv.appendChild(exprSpan);
            headerDiv.appendChild(rightContainer);
            lineDiv.appendChild(headerDiv);

            graphDataToRender = { vars, body };
        } else if (!fourierMatch) {
            const hasFractions = /\d+\s*\/\s*\d+/.test(expr);
            let evaluated;

            if (hasFractions) {
                try {
                    evaluated = math.evaluate(expr, customScope);
                    if (typeof evaluated === 'number') {
                        const frac = math.fraction(evaluated);
                        evaluated = `${frac.n}/${frac.d}`;
                    }
                } catch (e) {
                    evaluated = math.evaluate(expr, customScope);
                }
            } else {
                evaluated = math.evaluate(expr, customScope);
            }

            let resultVal = (typeof evaluated === 'object' && evaluated?.entries) ?
                evaluated.entries[evaluated.entries.length - 1] : evaluated;

            if (typeof resultVal === 'function') throw new Error(t('errIncomplete'));

            if (resultVal && typeof resultVal.toArray === 'function') {
                resultVal = resultVal.toArray();
            }

            if (typeof resultVal === 'string' && /^\d+\/\d+$/.test(resultVal)) {
                const [num, den] = resultVal.split('/');
                resultVal = `<span class="math-fraction"><span class="math-num">${num}</span><span class="math-den">${den}</span></span>`;
                resultSpan.innerHTML = `= ${resultVal}`;
            } else if (Array.isArray(resultVal) && Array.isArray(resultVal[0])) {
                resultSpan.innerHTML = `= ${formatMatrixAsHTML(resultVal)}`;
            } else if (Array.isArray(resultVal)) {
                resultSpan.textContent = `= [${resultVal.map(formatLocalNumber).join(', ')}]`;
            } else if (typeof resultVal === 'number') {
                memory = resultVal;
                resultSpan.textContent = `= ${formatLocalNumber(resultVal)}`;
            } else {
                resultSpan.textContent = `= ${formatResultForTape(String(resultVal))}`;
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

// Diccionario de documentación para la etapa 2 traducido dinámicamente
const HELP_DOCS = {
    'arithmetic': {
        title: 'Aritmética Exacta',
        syntax: 'a / b + c / d',
        description: 'RTCalc procesa operaciones fraccionarias manteniendo precisión matemática mediante notación de fracción vertical.',
        example: '4/5 + 3/4',
        graphType: null
    },
    'factor': {
        title: 'Factorización Algebraica (factor)',
        syntax: "factor('expresión')",
        description: 'Factoriza polinomios detectando patrones de factor común, grupos, diferencia de cuadrados y trinomios.',
        example: "factor('x^2 - 9')",
        graphType: null
    },
    'factors': {
        title: 'Descomposición en Factores Primos (factors)',
        syntax: 'factors(entero)',
        description: 'Descompone un número entero mayor a 1 en sus factores primos expresados con sus potencias.',
        example: 'factors(360)',
        graphType: null
    },
    'mcd_mcm': {
        title: 'Máximo Común Divisor y Mínimo Común Múltiplo',
        syntax: 'mcd(a, b, ...) / mcm(a, b, ...)',
        description: 'Calcula el MCD o MCM para dos o más números enteros pasados como argumentos.',
        example: 'mcd(24, 36, 60)',
        graphType: null
    },
    'solveLinear': {
        title: 'Ecuaciones Lineales (solveLinear)',
        syntax: 'solveLinear(a, b, c)',
        description: 'Resuelve la ecuación de primer grado de la forma ax + b = c despejando x.',
        example: 'solveLinear(2, 4, 10)',
        graphType: null
    },
    'solveQuad': {
        title: 'Ecuaciones Cuadráticas (solveQuad)',
        syntax: 'solveQuad(a, b, c)',
        description: 'Obtiene las raíces de la ecuación ax² + bx + c = 0 mediante la fórmula de Bhaskara (raíces reales o complejas).',
        example: 'solveQuad(1, -5, 6)',
        graphType: null
    },
    'diophantine': {
        title: 'Ecuaciones Diofánticas (diophantine)',
        syntax: 'diophantine(a, b, c)',
        description: 'Resuelve ecuaciones ax + by = c obteniendo la solución paramétrica entera mediante Euclides extendido.',
        example: 'diophantine(35, 15, 50)',
        graphType: null
    },
    'laplace': {
        title: 'Transformada de Laplace (laplace)',
        syntax: "laplace('f(t)')",
        description: 'Obtiene la transformada analítica ℒ{f(t)} = F(s) utilizando la tabla fundamental de transformadas.',
        example: "laplace('t^2')",
        graphType: null
    },
    'congruent': {
        title: 'Congruencia Modular (congruent)',
        syntax: 'congruent(a, b, m)',
        description: 'Evalúa la relación a ≡ b (mod m). Retorna verdadero si a y b dejan el mismo resto al dividirse por m.',
        example: 'congruent(17, 5, 12)',
        graphType: null
    },
    'derivative': {
        title: 'Derivada Analítica (derivative)',
        syntax: "derivative('expresión', 'variable')",
        description: 'Calcula la derivada simbólica/analítica de una función respecto a la variable especificada.',
        example: "derivative('x^3 + 2*x', 'x')",
        graphType: null
    },
    'integral': {
        title: 'Integral Definida (integral)',
        syntax: "integral('expresión', 'variable', a, b)",
        description: 'Calcula la integral definida ∫_a^b f(x)dx mediante la regla numérica de Simpson.',
        example: "integral('x^2', 'x', 0, 3)",
        graphType: null
    },
    'limit': {
        title: 'Límites Analíticos (limit)',
        syntax: "limit('expresión', 'variable', punto)",
        description: 'Evalúa el límite lateral de una función en un punto dado. Detecta límites inexistentes (∄) o infinitos.',
        example: "limit('1/x', 'x', 0)",
        graphType: null
    },
    'fourier': {
        title: 'Análisis y Serie de Fourier (fourier)',
        syntax: "fourier('f(x)', N)",
        description: 'Reconstruye f(x) en [-π, π] mediante la suma parcial de sus armónicos hasta el grado N y grafica el resultado.',
        example: "fourier('x', 5)",
        graphType: '2d',
        graphData: {
            vars: ['x'],
            body: 'x, 2*sin(x) - sin(2*x) + (2/3)*sin(3*x) - (1/2)*sin(4*x) + (2/5)*sin(5*x)'
        }
    },
    'matrices': {
        title: 'Álgebra Matricial (inv, det)',
        syntax: 'inv(matriz) / det(matriz)',
        description: 'Resuelve operaciones matriciales utilizando corchetes anidados [[a,b],[c,d]].',
        example: 'inv([[4, 7], [2, 6]])',
        graphType: null
    },
    'plots': {
        title: 'Gráficos 2D y 3D f(x)',
        syntax: 'f(x) = ... / f(x, y) = ...',
        description: 'Trazado automático interactivo de curvas o superficies 3D en la cinta con Plotly.js.',
        example: 'f(x, y) = x^2 - y^2',
        graphType: '3d',
        graphData: {
            vars: ['x', 'y'],
            body: 'x^2 - y^2'
        }
    }
};

// ETAPA 1: Modal Principal Traducido
function openHelpModal() {
    const existingModal = document.getElementById('man-help-modal');
    if (existingModal) existingModal.remove();

    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'man-help-modal';
    modalOverlay.className = 'help-modal-overlay';

    modalOverlay.innerHTML = `
        <div class="help-modal-content">
            <div class="help-modal-header">
                <h2>${t('manTitle')}</h2>
                <button class="help-close-btn" id="close-help-btn">&times;</button>
            </div>
            <div class="help-modal-body">
                <table class="help-table">
                    <thead>
                        <tr><th>${t('tableCategory')}</th><th>${t('tableSyntax')}</th><th>${t('tableDetails')}</th></tr>
                    </thead>
                    <tbody>
                        <tr><td><b>Aritmética</b></td><td><span class="help-clickable-item" data-cmd="4/5 + 3/4">4/5 + 3/4</span></td><td><button class="help-doc-btn" data-key="arithmetic">${t('seeMore')}</button></td></tr>
                        <tr><td><b>Factoreo</b></td><td><span class="help-clickable-item" data-cmd="factor('x^2 - 9')">factor('expr')</span></td><td><button class="help-doc-btn" data-key="factor">${t('seeMore')}</button></td></tr>
                        <tr><td><b>Primos</b></td><td><span class="help-clickable-item" data-cmd="factors(360)">factors(n)</span></td><td><button class="help-doc-btn" data-key="factors">${t('seeMore')}</button></td></tr>
                        <tr><td><b>MCD / MCM</b></td><td><span class="help-clickable-item" data-cmd="mcd(24, 36, 60)">mcd(...) / mcm(...)</span></td><td><button class="help-doc-btn" data-key="mcd_mcm">${t('seeMore')}</button></td></tr>
                        <tr><td><b>Ecuaciones</b></td><td><span class="help-clickable-item" data-cmd="solveLinear(2, 4, 10)">solveLinear(a, b, c)</span></td><td><button class="help-doc-btn" data-key="solveLinear">${t('seeMore')}</button></td></tr>
                        <tr><td><b>Transformadas</b></td><td><span class="help-clickable-item" data-cmd="laplace('t^2')">laplace('expr')</span></td><td><button class="help-doc-btn" data-key="laplace">${t('seeMore')}</button></td></tr>
                        <tr><td><b>Mat. Discreta</b></td><td><span class="help-clickable-item" data-cmd="congruent(17, 5, 12)">congruent(a, b, m)</span></td><td><button class="help-doc-btn" data-key="congruent">${t('seeMore')}</button></td></tr>
                        <tr><td><b>Cuadráticas</b></td><td><span class="help-clickable-item" data-cmd="solveQuad(1, -5, 6)">solveQuad(a, b, c)</span></td><td><button class="help-doc-btn" data-key="solveQuad">${t('seeMore')}</button></td></tr>
                        <tr><td><b>Diofánticas</b></td><td><span class="help-clickable-item" data-cmd="diophantine(35, 15, 50)">diophantine(a, b, c)</span></td><td><button class="help-doc-btn" data-key="diophantine">${t('seeMore')}</button></td></tr>
                        <tr><td><b>Cálculo</b></td><td><span class="help-clickable-item" data-cmd="derivative('x^3 + 2*x', 'x')">derivative('expr', 'var')</span></td><td><button class="help-doc-btn" data-key="derivative">${t('seeMore')}</button></td></tr>
                        <tr><td><b>Integrales</b></td><td><span class="help-clickable-item" data-cmd="integral('x^2', 'x', 0, 3)">integral('expr', 'v', a, b)</span></td><td><button class="help-doc-btn" data-key="integral">${t('seeMore')}</button></td></tr>
                        <tr><td><b>Límites</b></td><td><span class="help-clickable-item" data-cmd="limit('1/x', 'x', 0)">limit('expr', 'v', target)</span></td><td><button class="help-doc-btn" data-key="limit">${t('seeMore')}</button></td></tr>
                        <tr><td><b>Fourier</b></td><td><span class="help-clickable-item" data-cmd="fourier('x', 5)">fourier('expr', N)</span></td><td><button class="help-doc-btn" data-key="fourier">${t('seeMore')}</button></td></tr>
                        <tr><td><b>Matrices</b></td><td><span class="help-clickable-item" data-cmd="inv([[4, 7], [2, 6]])">inv(...) / det(...)</span></td><td><button class="help-doc-btn" data-key="matrices">${t('seeMore')}</button></td></tr>
                        <tr><td><b>Gráficos</b></td><td><span class="help-clickable-item" data-cmd="f(x) = x^2 - 4">f(x) = ... / f(x, y) = ...</span></td><td><button class="help-doc-btn" data-key="plots">${t('seeMore')}</button></td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    document.body.appendChild(modalOverlay);

    document.getElementById('close-help-btn').addEventListener('click', () => modalOverlay.remove());

    modalOverlay.querySelectorAll('.help-clickable-item').forEach(item => {
        item.addEventListener('click', () => {
            const cmd = item.getAttribute('data-cmd');
            if (inputField) {
                inputField.value = cmd;
                inputField.focus();
            }
            modalOverlay.remove();
        });
    });

    modalOverlay.querySelectorAll('.help-doc-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const key = btn.getAttribute('data-key');
            openCommandDetailModal(key);
        });
    });
}

// ETAPA 2: Modal Secundario Traducido
function openCommandDetailModal(key) {
    const doc = HELP_DOCS[key];
    if (!doc) return;

    const detailOverlay = document.createElement('div');
    detailOverlay.id = 'man-detail-modal';
    detailOverlay.className = 'help-modal-overlay';
    detailOverlay.style.zIndex = '100000';

    detailOverlay.innerHTML = `
        <div class="help-modal-content help-detail-content">
            <div class="help-modal-header">
                <h2>${doc.title}</h2>
                <button class="help-close-btn" id="close-detail-btn">&times;</button>
            </div>
            <div class="help-modal-body">
                <p><b>${t('syntaxLabel')}</b> <code>${doc.syntax}</code></p>
                <p>${doc.description}</p>
                <hr style="border:0; border-top:1px solid #e5e5ea; margin: 12px 0;">
                <p><b>${t('exampleLabel')}</b></p>
                <div class="help-example-box" id="insert-example-btn">
                    <code>${doc.example}</code> <span>${t('clickToTest')}</span>
                </div>
                ${doc.graphType ? '<div id="help-doc-plot" style="width:100%; height:220px; margin-top:12px;"></div>' : ''}
            </div>
        </div>
    `;

    document.body.appendChild(detailOverlay);

    document.getElementById('close-detail-btn').addEventListener('click', () => detailOverlay.remove());

    document.getElementById('insert-example-btn').addEventListener('click', () => {
        if (inputField) {
            inputField.value = doc.example;
            inputField.focus();
        }
        detailOverlay.remove();
        const mainModal = document.getElementById('man-help-modal');
        if (mainModal) mainModal.remove();
    });

    if (doc.graphType && doc.graphData) {
        setTimeout(() => {
            renderInlineGraph(doc.graphData.vars, doc.graphData.body, 'help-doc-plot');
        }, 100);
    }
}

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
                    const val = compiled.evaluate({ x, y, ...customScope });
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
            font: { family: 'IBM Plex Sans Condensed, sans-serif', size: 11, color: '#1d1d1f' },
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

                traces.push({
                    x: xValues,
                    y: yValues,
                    type: 'scatter',
                    mode: 'lines',
                    name: expr,
                    line: { color: vibrantColors[index % vibrantColors.length], width: 3 }
                });
            } catch (e) {
                console.error(`Error evaluando ${expr}`, e);
            }
        });

        const layout = {
            margin: { t: 10, b: 30, l: 30, r: 10 },
            font: { family: 'IBM Plex Sans Condensed, sans-serif', size: 11, color: '#1d1d1f' },
            xaxis: { title: vars[0] || 'x', gridcolor: '#e5e5ea' },
            yaxis: { title: 'y', gridcolor: '#e5e5ea' },
            legend: { orientation: 'h', y: 1.2, x: 0 },
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent'
        };

        Plotly.newPlot(container, traces, layout, { responsive: true, displayModeBar: false });
    }
}