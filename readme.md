# Scientific Roller Tape Calculator (rtcalc)

Una calculadora científica de escritorio orientada a la educación, desarrollada con **Electron**, **MathJS** y **Plotly.js**. Cuenta con una interfaz limpia basada en una "cinta" de papel histórica y notación matemática tipográfica.

## Características Principales

* **Cinta de Historial Inteligente**: Registro de operaciones con formato tipográfico automático para fracciones, potencias, integrales, derivadas, límites y matrices.
* **Sistema de Ayuda Interactivo (`man`)**: Escribí `man` para abrir una ventana modal con comandos organizados y funciones **hacer clic para insertar**, o `man [función]` para ver ejemplos detallados.
* **Gráficas 2D y 3D en línea**: Visualización de curvas múltiples con dominio simétrico y superficies tridimensionales con paletas de colores vibrantes (`Turbo` / `Plasma`).
* **Cálculo Avanzado**: Soporte para derivadas analíticas y numéricas, integrales definidas (regla de Simpson) y cálculo de límites con detección de discontinuidades y divergencias (`∄`, `+∞`, `-∞`).
* **Álgebra y Matemática Discreta**: Resolución de ecuaciones lineales, cuadráticas (con raíces complejas) y ecuaciones diofánticas lineales mediante el algoritmo de Euclides extendido.
* **Álgebra Lineal**: Operaciones completas con matrices (determinantes, matriz inversa, transpuesta y multiplicación) renderizadas con corchetes y formato matricial tradicional.

## Tecnologías Utilizadas

* **Electron**: Framework para aplicaciones de escritorio multiplataforma.
* **MathJS**: Motor de análisis y computación matemática.
* **Plotly.js**: Librería de gráficos interactivos.
* **electron-builder**: Empaquetado y distribución de la aplicación.

## Instalación y Ejecución

Cloná el repositorio e instalá las dependencias:

```bash
git clone <url-del-repositorio>
cd rtcalc
npm install

```

Para ejecutar la aplicación en modo de desarrollo:

```bash
npm start

```

Para empaquetar y generar el instalador de distribución para tu sistema operativo:

```bash
npm run build

```

## Guía rápida de uso

* **Aritmética y potencias**: `2 + 2`, `x^2` (se renderiza como `x²`).
* **Fracciones**: `4/5` (se renderiza como fracción vertical).
* **Ayuda**: `man` (menú general) o `man derivative` (ayuda específica).
* **Cálculo**:
* Derivada: `derivative('x^3 + 2*x', 'x')`
* Integral: `integral('x^2', 'x', 0, 3)`
* Límite: `limit('1/x', 'x', 0)`

* **Gráficos**: `f(x) = x^2 - 4` (2D) o `f(x, y) = x^2 - y^2` (3D).
* **Matrices**: `inv([[4, 7], [2, 6]])` o `det([[1, 2], [3, 4]])`.

## Licencia

Este proyecto está bajo la licencia MIT.
