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