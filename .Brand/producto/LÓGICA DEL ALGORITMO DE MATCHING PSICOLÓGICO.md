# 🧠 LÓGICA DEL ALGORITMO DE MATCHING PSICOLÓGICO

*(Sexteo — Sistema MPN)*

---

# 1️⃣ Variables Principales del Matching

El algoritmo no compara personas.
Compara **perfiles narrativos dinámicos**.

Cada usuario tiene un vector compuesto por:

## A) Perfil de Deseo Narrativo (PDN)

* Estilo dominante (romántico, oscuro, lúdico, intenso)
* Ritmo preferido (lento, progresivo, directo)
* Nivel de iniciativa (lidera / responde / alterna)
* Tipo de tensión (emocional, psicológica, misterio)

---

## B) Perfil de Límites (PL)

* Temas excluidos
* Intensidad máxima
* Tipo de lenguaje permitido
* Nivel de improvisación

Este perfil funciona como **filtro duro** (hard filter).

Si hay conflicto → no hay match.

---

## C) Perfil de Energía Interactiva (PEI)

* Frecuencia de respuesta
* Longitud promedio de mensaje
* Uso narrativo vs diálogo
* Capacidad descriptiva

Esto afecta compatibilidad de ritmo.

---

## D) Arquetipo Psicológico Narrativo (APN)

No MBTI clásico, sino roles en narrativa:

* El Seductor Estratégico
* La Mente Misteriosa
* El Protector Intenso
* La Provocadora Lúdica
* El Observador Dominante
* etc.

Un usuario puede tener combinación ponderada.

---

# 2️⃣ Estructura Matemática Simplificada

Cada usuario se representa como:

U = { PDN, PL, PEI, APN }

---

# 3️⃣ Proceso de Matching

## Paso 1 — Filtro de Seguridad

Si:
PL(A) ∩ Deseos(B) = conflicto
→ descartar

---

## Paso 2 — Compatibilidad de Deseo

Se calcula distancia vectorial entre PDN_A y PDN_B.

Ejemplo:

* Si ambos buscan progresión lenta → +score
* Si uno quiere intensidad máxima inmediata y el otro lenta → -score

---

## Paso 3 — Complementariedad de Arquetipos

No siempre buscamos similitud.
A veces buscamos polaridad compatible.

Ejemplo:

* Estratega + Provocadora → alta química
* Dos Observadores pasivos → baja dinámica

Se usa una matriz de compatibilidad predefinida.

---

## Paso 4 — Sincronía de Ritmo

Comparación PEI:

* Diferencia de frecuencia > umbral → penalización
* Diferencia de longitud narrativa > umbral → penalización leve

---

## Paso 5 — Cálculo Final

Score final:

MatchScore =
(0.35 × Deseo) +
(0.30 × Arquetipo) +
(0.20 × Ritmo) +
(0.15 × Experiencia previa)

---

# 4️⃣ Matching Dinámico (Clave Diferencial)

El algoritmo aprende de:

* Duración promedio de historias exitosas
* Feedback posterior
* Pausas activadas
* Intensidad ajustada
* Repetición con mismo usuario

Se ajusta el perfil real vs declarado.

---

# 5️⃣ Tipos de Match

## 🔥 Match Fuerte (80–100%)

Alta compatibilidad narrativa.

## 🌙 Match Exploratorio (60–79%)

Puede funcionar con ajuste.

## 🎭 Match Experimental (40–59%)

Solo si usuario elige explorar.

---

# 6️⃣ Micro-Optimización Emocional

El sistema detecta:

* Abandono temprano → desajuste de ritmo
* Pausas frecuentes → intensidad mal calibrada
* Historias largas y repetidas → patrón ideal

Esto alimenta un sistema de refuerzo.

---

# 7️⃣ Ventaja Competitiva Real

Las apps tradicionales hacen:

* Match por foto
* Match por interés general

Vos harías:

> Match por compatibilidad narrativa + energía psicológica

Eso es mucho más adictivo y diferencial.

---

# 8️⃣ Evolución Futura (Nivel Avanzado)

* IA que simula compatibilidad antes de conectar usuarios
* Previa narrativa generada automáticamente
* Matching por estados emocionales del día
* Matching por "mood dinámico"

