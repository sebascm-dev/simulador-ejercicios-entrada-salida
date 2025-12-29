# Simulador de Planificación de Discos

Simulador interactivo y moderno para resolver problemas de planificación de discos en sistemas operativos. Implementa los algoritmos más comunes: SSTF, SCAN, LOOK, C-SCAN y F-LOOK.

## Características

- ✅ **5 Algoritmos de Planificación**: SSTF, SCAN, LOOK, C-SCAN, F-LOOK
- 📊 **Visualización Interactiva**: Gráfico del recorrido del cabezal
- 📈 **Tabla Detallada**: Paso a paso del algoritmo
- ⏱️ **Cálculo de Tiempos**: Búsqueda, latencia y transferencia
- 🎨 **Interfaz Moderna**: Diseño minimalista con Tailwind CSS
- 📱 **Responsive**: Funciona en todos los dispositivos

## Tecnologías

- **Next.js 14** - Framework React
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos modernos
- **React** - Interfaz de usuario

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Ejecutar en modo desarrollo:
```bash
npm run dev
```

3. Abrir en el navegador:
```
http://localhost:3000
```

## Uso

1. Selecciona el algoritmo de planificación
2. Ingresa la pista inicial
3. Ingresa las peticiones de pistas (separadas por comas)
4. Configura parámetros adicionales según el algoritmo
5. Haz clic en "Calcular"
6. Visualiza los resultados y el recorrido del cabezal

## Ejemplo

**Problema del examen:**
- Pista inicial: 50
- Peticiones: 754, 433, 285, 176, 667, 827
- Algoritmo: SSTF

El simulador calculará automáticamente:
- La secuencia de pistas visitadas
- El total de pistas recorridas
- El tiempo de acceso (si se proporcionan las especificaciones del disco)

## Algoritmos Implementados

### SSTF (Shortest Seek Time First)
Selecciona siempre la petición más cercana a la posición actual del cabezal.

### SCAN (Elevator)
El cabezal se mueve en una dirección hasta el final del disco, luego invierte la dirección.

### LOOK
Similar a SCAN pero no llega hasta el final, cambia de dirección cuando no hay más peticiones.

### C-SCAN (Circular SCAN)
Similar a SCAN pero cuando llega al final, vuelve al inicio sin procesar peticiones.

### F-LOOK
Variante de LOOK que mantiene dos colas: activa y pendiente.

## Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta el linter

## Licencia

Este proyecto es de uso educativo.

