# Ejemplos de Problemas del Examen

## Ejemplo 1: Problema del Disco (Tema 4-9-10)

### Datos del Problema:
- **Disco**: 10 sectores por pista, 100 cilindros, 2 caras
- **Tamaño sector**: 512 bytes
- **Tamaño bloque**: 1 Kbyte (1024 bytes)
- **Pista inicial**: 50
- **Sentido**: Ascendente
- **Peticiones de bloques**: 754, 433, 285, 176, 667, 827

### Configuración en el Simulador:

1. **Especificaciones del Disco:**
   - Sectores por pista: 10
   - Cilindros: 100
   - Caras: 2
   - Tamaño sector: 512 bytes
   - Tamaño bloque: 1024 bytes

2. **Calcular bloques por cilindro:**
   - Haz clic en "Calcular Bloques por Cilindro"
   - Resultado esperado: 10 bloques por cilindro

3. **Convertir bloques a pistas:**
   - Bloque 754 → Pista 75
   - Bloque 433 → Pista 43
   - Bloque 285 → Pista 28
   - Bloque 176 → Pista 17
   - Bloque 667 → Pista 66
   - Bloque 827 → Pista 82

4. **Configuración del Algoritmo:**
   - Algoritmo: SSTF (o SCAN, LOOK según se pida)
   - Pista inicial: 50
   - Peticiones: 75, 43, 28, 17, 66, 82
   - Pista máxima: 99 (para SCAN)
   - Dirección: Ascendente

5. **Especificaciones de Tiempo:**
   - Tiempo de búsqueda por pista: 1 ms
   - RPM: 1000
   - Sectores por bloque: 2

### Resultados Esperados:

**SSTF:**
- Secuencia: 50 → 43 → 28 → 17 → 66 → 75 → 82
- Total pistas: 98

**SCAN:**
- Secuencia: 50 → 66 → 75 → 82 → 99 → 43 → 28 → 17
- Total pistas: 131

**LOOK:**
- Secuencia: 50 → 66 → 75 → 82 → 43 → 28 → 17
- Total pistas: 97

**Tiempo Total (SSTF):**
- Tiempo de búsqueda: 98 ms
- Tiempo de latencia: 180 ms (30 ms × 6 peticiones)
- Tiempo de transferencia: 36 ms (6 ms × 6 peticiones)
- **Total: 314 ms**

---

## Ejemplo 2: Problema PKIOTO 2010 (Tema 4-4-6)

### Datos del Problema:
- **Total de pistas**: 512 (numeradas 1-512)
- **Pista inicial**: 300
- **Sentido**: Ascendente (hacia pistas mayores)
- **Peticiones**: 45, 90, 130, 200, 223, 415, 133, 22, 50, 160

### Configuración en el Simulador:

1. **Configuración del Algoritmo:**
   - Algoritmo: SSTF, LOOK o C-SCAN
   - Pista inicial: 300
   - Peticiones: 45, 90, 130, 200, 223, 415, 133, 22, 50, 160
   - Pista máxima: 512 (para SCAN y C-SCAN)
   - Dirección: Ascendente

### Resultados Esperados:

**SSTF:**
- Total pistas: 671

**LOOK:**
- Total pistas: 508

**C-SCAN:**
- Total pistas: 945

---

## Ejemplo 3: Problema UHUTUBE (Tema 4-7-8)

### Datos del Problema:
- **Disco antiguo**: 60801 cilindros, 255 sectores por pista, 63 caras, 4 KB por sector
- **Peticiones con tiempos de llegada**:
  - Instante 0: Pista 10
  - Instante 1: Pista 19
  - Instante 2: Pista 3
  - Instante 3: Pista 14
  - Instante 6: Pista 12
  - Instante 7: Pista 9
- **Pista inicial**: 10
- **Dirección**: Ascendente
- **Tiempo por solicitud**: 5 unidades

### Configuración en el Simulador:

1. **Especificaciones del Disco:**
   - Sectores por pista: 255
   - Cilindros: 60801
   - Caras: 63
   - Tamaño sector: 4096 bytes (4 KB)
   - Tamaño bloque: 4096 bytes

2. **Para F-LOOK:**
   - Algoritmo: F-LOOK
   - Pista inicial: 10
   - Peticiones con tiempos: (debe implementarse manualmente o usar el algoritmo)
   - Dirección: Ascendente

### Resultados Esperados:

**LOOK:**
- Total pistas: 25

**F-LOOK:**
- Total pistas: 34

---

## Consejos de Uso

1. **Conversión de Bloques a Pistas:**
   - Si tienes bloques, primero calcula los bloques por cilindro
   - Divide el número de bloque entre bloques por cilindro para obtener la pista

2. **Algoritmos que requieren dirección:**
   - SCAN, LOOK, C-SCAN, F-LOOK necesitan dirección inicial
   - SSTF no necesita dirección

3. **Algoritmos que requieren pista máxima:**
   - SCAN y C-SCAN necesitan la pista máxima del disco
   - LOOK y F-LOOK no la necesitan

4. **Cálculo de Tiempos:**
   - Asegúrate de ingresar todas las especificaciones del disco
   - El tiempo de latencia se calcula como media vuelta
   - El tiempo de transferencia depende de los sectores por bloque

