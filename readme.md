# RTCalc (Scientific Roller Tape Calculator)

**RTCalc** is a desktop scientific calculator built with Electron, designed for technical and educational environments. It combines the continuous workflow of an **interactive paper tape** with the power of an advanced analytical and numerical mathematical engine.

---

## 📸 Screenshots

| Welcome Screen | Calculation Tape & Typographic Notation |
| :---: | :---: |
| ![RTCalc Splash](screenshots/hero-splash.png) | ![Math Tape](screenshots/math-tape.png) |

| Fourier Analysis & 2D/3D Graphs | Interactive 2-Stage Manual (`man`) |
| :---: | :---: |
| ![Fourier Plots](screenshots/fourier-plot.png) | ![Help Manual](screenshots/help-detail.png) |

---

## 🚀 Key Features

* **Interactive Paper Tape:** Expression visualization in textbook format (vertical fractions, definite integrals with limits, analytical derivatives, limits, and matrix notation).
* **Integrated 2D and 3D Plotting:** Real-time plotting of 2D curves and 3D surface plots via Plotly.js directly on the tape for `f(x)` and `f(x, y)` functions.
* **Interactive 2-Stage Help System (`man`):** 
  * **Stage 1:** Summary table of commands organized by categories.
  * **Stage 2:** Detailed documentation modal featuring theoretical background, click-to-run interactive examples, and live plot previews.
* **Dual Typography System:**
  * **`IBM Plex Sans Condensed`:** Used across the entire user interface (modals, tables, buttons, and headers).
  * **`Iosevka Charon Mono`:** Reserved exclusively for the calculation tape, prompt, and input bar.
* **Extended Mathematical Engine (`mathjs` + `customScope`):**
  * **Exact Arithmetic:** Automatic handling and simplification of exact fractions.
  * **Algebra:** Symbolic polynomial factorization (common factor, grouping, difference of squares, and trinomials).
  * **Discrete Mathematics:** GCD, LCM, prime factor decomposition (`factors(n)`), and modular congruence ($a \equiv b \pmod m$).
  * **Equations:** Linear ($ax+b=c$), quadratic (real or complex roots), and Diophantine ($ax+by=c$) equation solvers.
  * **Infinitesimal Calculus:** Analytical derivatives, numerical definite integrals (Simpson's rule), and lateral limits.
  * **Transforms & Series:** Laplace transform ($\mathcal{L}$) and harmonic analysis/reconstruction using Fourier Series.
  * **Linear Algebra:** Visual matrix operations with bracket rendering (determinants, inverses, and transposes).

---

## ⌨️ Highlighted Commands & Syntax

| Category | Command / Example | Description |
| :--- | :--- | :--- |
| **Arithmetic** | `4/5 + 3/4` | Operations with exact fractions ($\frac{31}{20}$) |
| **Factoring** | `factor('x^2 - 9')` | Symbolic expression factorization |
| **Primes** | `factors(360)` | Prime factor power decomposition |
| **Congruence** | `congruent(17, 5, 12)` | Evaluates $a \equiv b \pmod m$ relationship |
| **Quadratics** | `solveQuad(1, -5, 6)` | Quadratic roots using the quadratic formula |
| **Diophantine** | `diophantine(35, 15, 50)` | Integer parametric solution for $ax + by = c$ |
| **Calculus** | `integral('x^2', 'x', 0, 3)` | Definite integration via Simpson's rule |
| **Laplace** | `laplace('t^2')` | Analytical Laplace transform $\mathcal{L}\{f(t)\}$ |
| **Fourier** | `fourier('x', 5)` | Fourier Series expansion and plot up to $N$ harmonics |
| **Plotting** | `f(x, y) = x^2 - y^2` | Interactive 3D plot rendering on tape |

---

## 🛠️ Installation & Development

### Prerequisites
* Node.js (v16+)
* npm

### Installation steps

1. **Clone the repository:**
```bash
   git clone https://github.com/pabloniklas/rtcalc-electron.git
   cd rtcalc-electron

```

2. **Install dependencies:**
```bash
npm install

```

3. **Run in development mode:**
```bash
npm start

```

---

## 📦 Packaging (Build)

To generate standalone distribution packages for Linux (`.AppImage`, `.deb`, `.rpm`) or Windows (`.exe`):

```bash
npm run dist

```

The compiled binaries will be generated inside the `dist/` folder.

---

## 📄 License

Developed by **Pablo Niklas** `<pablo.niklas@gmail.com>`.

MIT License
