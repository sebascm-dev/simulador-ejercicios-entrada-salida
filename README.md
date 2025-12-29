# Simulador de Ejercicios de E/S (UHU)

Simulador interactivo diseñado para la asignatura **"Diseño y Estructura de los Sistemas Operativos"** de la **Universidad de Huelva (UHU)**. Esta herramienta permite visualizar y calcular el rendimiento de diversos algoritmos de planificación de discos.

![Simulador Preview](/public/logoUHU.webp) *(Nota: El logo es referencial)*

## 🚀 Características

*   **Algoritmos Soportados:** Implementación completa de algoritmos clásicos y avanzados:
    *   **SSTF** (Shortest Seek Time First)
    *   **SCAN** (Elevator)
    *   **C-SCAN** (Circular SCAN)
    *   **LOOK**
    *   **C-LOOK** (Circular LOOK)
    *   **F-LOOK**
    *   **SCAN-N** (N-step SCAN)
*   **Visualización Interactiva:** Gráfico dinámico que muestra el movimiento del cabezal del disco paso a paso.
*   **Cálculos de Tiempo:** Estimación precisa de tiempos de acceso incluyendo:
    *   Tiempo de Búsqueda (Seek Time)
    *   Tiempo de Latencia (Rotacional)
    *   Tiempo de Transferencia
*   **Simulación Avanzada:** Soporte para dirección inicial, tiempos de llegada de peticiones y configuración detallada del disco (sectores, cilindros, RPM, etc.).

## 🛠️ Tecnologías Utilizadas

Este proyecto ha sido desarrollado utilizando tecnologías web modernas para asegurar rendimiento y facilidad de uso:

*   **[Next.js](https://nextjs.org/)**: Framework de React para producción.
*   **[TypeScript](https://www.typescriptlang.org/)**: Tipado estático robusto.
*   **[Tailwind CSS](https://tailwindcss.com/)**: Estilizado moderno y responsivo.
*   **Recharts**: Librería de gráficos para la visualización de pistas.

## 📋 Requisitos Previos

Para ejecutar este proyecto localmente, necesitas tener instalado:

*   [Node.js](https://nodejs.org/) (versión 18 o superior recomendada)
*   NPM (viene instalado con Node.js)

## 🔧 Instalación y Despliegue

1.  **Clonar el repositorio (o descargar los archivos):**
    ```bash
    git clone <tu-repositorio>
    cd simulador-planificacion-discos
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Ejecutar servidor de desarrollo:**
    ```bash
    npm run dev
    ```
    Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

4.  **Compilar para producción:**
    ```bash
    npm run build
    npm start
    ```

## 👨‍💻 Créditos

Desarrollado por:
**Sebastián Contreras Marín**
Ingeniería Informática
**Universidad de Huelva (UHU)**
Escuela Técnica Superior de Ingeniería (ETSI)

---
*Este software fue desarrollado con fines educativos para facilitar la comprensión de la gestión de entrada/salida en sistemas operativos.*
