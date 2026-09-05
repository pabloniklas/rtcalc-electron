
# RTCalc (Scientific Roller Tape Calculator)

**RTCalc** es una calculadora científica de escritorio construida con Electron, diseñada específicamente para el ámbito técnico y educativo. Combina el flujo de trabajo continuo de una **cinta de papel metálica/impresa** con el rigor numérico y simbólico de un motor matemático avanzado.

![RTCalc Splash & UI](assets/icon.png)

---

## 🚀 Características Principales

* **Cinta de Historial Interactiva:** Formateo matemático de nivel de libro de texto (fracciones verticales, integrales con límites, derivadas, límites y matrices tipográficas).
* **Entorno Gráfico 2D/3D:** Renderizado dinámico e interactivo integrado directamente en la cinta usando Plotly.js para funciones de la forma `f(x)` y `f(x, y)`.
* **Sistema de Ayuda Interactivo en 2 Etapas (`man`):** 
  * **Etapa 1:** Vista resumida de comandos agrupados por categoría.
  * **Etapa 2:** Modal de documentación detallada con explicación teórica, ejemplo ejecutable con un clic y previsualización gráfica en vivo.
* **Tipografía Dual de Alta Legibilidad:**
  * **`IBM Plex Sans Condensed`:** Para toda la interfaz de usuario (modales, ventanas de ayuda, tablas y botones).
  * **`Iosevka Charon Mono`:** Reservada exclusivamente para el panel de entrada, prompt y cinta de resultados de la calculadora.
* **Motor Matemático Extendido (`mathjs` + `customScope`):**
  * **Aritmética Exacta:** Manejo automático de fracciones simplificadas.
  * **Álgebra:** Factorización automática (factor común, por grupos, diferencia de cuadrados, trinomios).
  * **Matemática Discreta:** MCD, MCM, descomposición en factores primos (`factors(n)`) y congruencia modular ($a \equiv b \pmod m$).
  * **Ecuaciones:** Solucionador lineal ($ax+b=c$), cuadrático (raíces reales/complejas) y diofántico ($ax+by=c$).
  * **Cálculo Infinitesimal:** Derivada analítica, integral definida numérica y límites laterales.
  * **Transformadas & Series:** Transformada de Laplace ($\mathcal{L}$) y reconstrucción/análisis por Serie de Fourier con gráficos armónicos superpuestos.
  * **Álgebra Lineal:** Operaciones matriciales visuales con corchetes (determinante, inversa, transpuesta).

---

## ⌨️ Comandos y Sintaxis Destacados

| Categoría | Comando / Ejemplo | Descripción |
| :--- | :--- | :--- |
| **Aritmética** | `4/5 + 3/4` | Operaciones con fracciones exactas ($\frac{31}{20}$) |
| **Factoreo** | `factor('x^2 - 9')` | Factorización simbólica de expresiones |
| **Primos** | `factors(360)` | Descomposición en producto de potencias de primos |
| **Congruencia** | `congruent(17, 5, 12)` | Evalúa la relación comparativa $a \equiv b \pmod m$ |
| **Cuadráticas** | `solveQuad(1, -5, 6)` | Raíces mediante la fórmula de Bhaskara |
| **Diofánticas** | `diophantine(35, 15, 50)` | Solución paramétrica entera $ax + by = c$ |
| **Cálculo** | `integral('x^2', 'x', 0, 3)` | Integral definida por método de Simpson |
| **Laplace** | `laplace('t^2')` | Transformada analítica $\mathcal{L}\{f(t)\}$ |
| **Fourier** | `fourier('x', 5)` | Reconstrucción y gráfico de los primeros $N$ armónicos |
| **Gráficos** | `f(x, y) = x^2 - y^2` | Generación de gráfico 3D Plotly.js |

---

## 🛠️ Instalación y Desarrollo

### Requisitos previos
* Node.js (v16+)
* npm o yarn

### Pasos de instalación

1. **Clonar el repositorio:**
```bash
   git clone [https://github.com/pabloniklas/rtcalc-electron.git](https://github.com/pabloniklas/rtcalc-electron.git)
   cd rtcalc-electron
```

2. **Instalar dependencias:**
```bash
npm install
```


3. **Ejecutar en modo desarrollo:**
```bash
npm start

```



---

## 📦 Empaquetado (Build)

Para generar los ejecutables de distribución en Linux (`.AppImage`, `.deb`) o Windows (`.exe`):

```bash
# Generar paquetes de distribución
npm run dist

```

Los binarios generados se ubicarán en la carpeta `dist/`.

---

## 📄 Licencia

Desarrollado por **Pablo Niklas** `<pablo.niklas@gmail.com>`.

Licencia MIT.