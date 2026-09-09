# Cierre de fase — Plataforma de research y búsqueda de estrategias

> Copia del informe que vive en `crypto-trading-lab`, rama `research/platform`, en
> `docs/research_phase_closure.md`. Se duplica aquí para que quien lea solo el dashboard
> sepa qué muestran estas vistas y qué no. **El original manda**: si divergen, gana el del
> repositorio de research, que es donde están los datos y los tests.
>
> **Lee la sección 7 antes de interpretar cualquier gráfico de este dashboard.** Las vistas
> muestran el universo de nueve activos, y esos retornos absolutos están inflados por cómo
> se eligieron esos nueve.

Fecha: 2026-09-09. Rama `research/platform`. RUN-3 intacto: ni una línea de su código, sus
SQLite, sus runners o su exporter se ha tocado.

---

## 1. La respuesta

Se pidió identificar la mejor candidata entre las evaluadas bajo condiciones claras. La
respuesta es:

> **EMA-v2-risk**, que ya es lo que corre en RUN-3. Hasta esta fase se defendía por diseño;
> ahora se defiende por medición. **Ninguna de las candidatas nuevas la superó.**

No es el resultado que se buscaba, y es un resultado. Se evaluaron nueve reglas distintas
bajo un protocolo idéntico, dos de ellas públicas y cuatro diseñadas específicamente para
descorrelacionar. Ninguna sobrevivió a las cuatro condiciones.

### Las cuatro condiciones, medidas

| Condición | EMA-v2-risk |
|---|---|
| Rentabilidad neta fuera de muestra | Positiva en **9/9 activos**; con costes duplicados, también 9/9 |
| Caídas y estabilidad | Caída mediana **-31,5%** frente a -76,5% del control; la más pequeña en **los cuatro** subperiodos |
| Resistencia a fricciones | Conserva el **93,6%** al duplicar comisión, spread y slippage a la vez |
| Ventaja vs comprar y mantener | Mejor retorno/caída en **7/9 activos** fuera de muestra y con costes duplicados |

Y una quinta que no se pidió pero decidió el empate con EMA-v1: **robustez de parámetros**.
El peor punto de la familia EMA-v2-risk (Sharpe 1,215) supera al **83% del espacio de
parámetros de EMA-v1**, cuya cifra de titular es su único mejor punto de 41.

---

## 2. El hallazgo estructural

Lo más valioso de la fase no es cuál ganó, sino por qué no ganó nada nuevo.

| Candidata | Correlación con las EMA | ¿Ventaja fuera de muestra? |
|---|---:|---|
| Reversión a la media | 0,24 | no |
| Reversión con filtro de régimen | 0,30 | no |
| **Presión de funding** (señal no de precio) | **0,49** | no |
| Momentum transversal | 0,73–0,75 | no |
| Donchian | 0,79–0,82 | marginal |
| EMA-v1 | **0,96** | sí |

Cuatro candidatas estructuralmente distintas, por cuatro caminos distintos, al mismo sitio.
**Toda la descorrelación disponible está en el lado que no rinde.**

Y la versión precisa, que costó tres experimentos afinar:

> La correlación la manda el **solapamiento temporal** de la exposición, no su tamaño.

EMA-v2-risk tiene un 15,5% de exposición media —menos de la mitad que EMA-v1— y correlaciona
0,96 con ella, porque está dentro en los mismos momentos. Las candidatas que descorrelacionan
lo hacen estando dentro en momentos *distintos*, y en este universo los momentos distintos
son peores.

**corr(EMA-v1, EMA-v2-risk) = 0,96**: nuestras dos referencias son la misma apuesta. La
cartera actual no está diversificada, y combinarlas solo promedia — la caída de la
combinación (-44,6%) es el punto medio de las dos, y el Sharpe no mejora al de ninguna.

---

## 3. Lo que se construyó

| | |
|---|---:|
| Estrategias registradas | 11 |
| Experimentos en el store | 212 |
| Ejecuciones certificadas | 422 |
| Specs versionados | 185 |
| Tests de research | 1.430 |
| Ensayos acumulados declarados | 91 |

Piezas que no existían al empezar:

- **Control** `buy-and-hold-v1`, sin parámetros y sin stop. Sin él la cuarta condición no
  era medible.
- **Partición temporal pre-registrada**, con el corte en un único fichero fijado por digest.
  Un corte por estrategia es *insayable*, y el runner rechaza un spec que se declare fuera
  de muestra sin declarar la partición que lo respalda.
- **Variants componibles**, cerrados y ordenados por tipo, que hacen expresable la condición
  combinada: retorno neto fuera de muestra bajo costes duplicados.
- **Corrección por multiplicidad** (Sharpe deflactado), sin dependencias nuevas.
- **Exporter** del contrato read-only, con segmento, lado de partición y estrés en cada fila.
- **Vista de frontend** que muestra los descartes junto a las supervivientes y deriva los
  veredictos de los datos por una regla escrita en la página.
- **Adquisición de funding**, fuera del perímetro, con la unión causal congelada por hash.

---

## 4. Lo que se rompió y se arregló por el camino

Vale la pena registrarlo porque son fallos reales, no anécdotas.

- **Guardia de caja mal dimensionado.** Comparaba el residuo de coma flotante contra ULPs
  del capital *inicial*, cuando la aritmética que lo produce opera sobre el capital *actual*.
  El umbral era más estricto con el activo que más había crecido — al revés. El conteo de
  512 ULPs no se tocó; solo la magnitud contra la que se mide.
- **Store anidado.** 157 experimentos acabaron en `research_data/runs/runs/` por pasarle al
  writer una raíz que él ya completa. Fusionados; los `identity.json` de los solapados
  resultaron byte a byte idénticos, que es lo que el direccionamiento por contenido promete.
- **Docstring obsoleto** en el laboratorio de agentes, que afirmaba que nadie leía `variant`.
- **Una hipótesis mía refutada al revés.** El carry de funding predice lo contrario de lo
  que supuse. Sin el diagnóstico separado —medir la información sin operar— lo habría
  descartado por el motivo equivocado.

---

## 5. Lo que esta fase NO demuestra

- **Nada sobre rentabilidad futura.** Todo es histórico sobre datos congelados al
  2026-08-19.
- **El universo se eligió a posteriori.** Nueve activos que existen hoy; el sesgo de
  supervivencia no lo elimina el framework.
- **La reserva es un único periodo de 3,6 años.** Contiene un alcista fuerte y una caída
  sostenida, lo que ayuda, pero sigue siendo un corte.
- **EMA-v2-risk no protege siempre.** Pierde el 12,7% en 2026. El filtro de tendencia reduce
  el daño; no lo elimina.
- **Los 91 ensayos son los nuestros.** No corrigen la búsqueda implícita, mucho mayor, que
  puso «cruce de medias móviles» en la lista de candidatas. Nadie puede contar esos.

---

## 6. Recomendación

**No propongo un paper nuevo.** Montar uno separado para la misma estrategia con los mismos
parámetros duplicaría trabajo sin producir evidencia. RUN-3 ya la ejecuta.

Lo que la evidencia sí respalda, si en algún momento quieres más retorno: **el objetivo de
volatilidad es una preferencia, no un parámetro ajustado**. Mueve retorno y caída juntos y
deja el Sharpe entre 1,22 y 1,43 en toda la rejilla. Subirlo de 0,40 no cuesta eficiencia.
Pero elegir el nuevo valor mirando esa superficie sería selección sobre datos de desarrollo:
habría que pre-registrarlo justificándolo por apetito de riesgo y mirar la reserva **una
sola vez**.

Y si se quiere retomar la búsqueda, la conclusión estructural dice dónde **no** buscar. Más
reglas solo largas al contado sobre precio devolverán más de lo mismo. Las direcciones con
algo por encontrar son las que esta fase no pudo abrir: posiciones cortas —que exigen
semántica nueva de motor y un protocolo v2—, o una fuente de datos que aún no tenemos. El
funding era la barata de las tres y ya está probada y agotada para esta reserva.

---

## 7. Continuación posterior al cierre, y lo que corrige

Después de cerrar la fase el trabajo siguió, y dos hallazgos modifican lo de arriba lo
bastante como para que quede aquí y no en un anexo.

### El universo era el que estaba rindiendo (R7)

Los nueve activos se eligieron a mano. Sustituida esa elección por una regla mecánica, el
universo pasa a 104 activos, y comprar y mantener revela lo que estaba pasando:

| | CAGR mediano del control |
|---|---:|
| Los 9 originales | **+65,9%** |
| Los 95 nuevos | **-11,1%** |

**Todos los retornos absolutos que este proyecto ha citado están inflados por esa
selección.** El 6624% de EMA-v1 en BTC o el 19903% en BNB describen aquellos activos, no la
regla.

Pero la ventaja *relativa* sí generaliza, y mejor de lo que parecía. Comparada de forma
pareada contra mantener el mismo activo en la misma ventana, EMA-v2-risk gana en **71 de 95**
activos nuevos, frente a solo 2 de 7 en los originales. Y es la única con mediana positiva
fuera de los nueve: **+20,0%** donde el control da -35,8%, con una caída del -28,4% frente
al -94,9%.

La conclusión sobre EMA-v2-risk sale **reforzada**. Lo que cae es la magnitud esperable: el
Sharpe pasa de 1,42 a 0,34 en un activo cualquiera.

### Un banco de pruebas, y cuánto vale (R6)

Hay una criba de desarrollo que no puede leer la reserva —rechaza por excepción cualquier
spec que no sea del lado de desarrollo— y que juzga cinco puertas: amplitud, ventaja
corregida por multiplicidad, rotación, resistencia a fricciones y correlación con las
incumbentes.

Se pasó a las cuatro candidatas. Tres REJECT, y una ADVANCE: `funding-pressure-v1`, que era
justamente la única con resultado de reserva ya conocido, donde había sido **rechazada**.

Así que la criba aprobó algo que después falló, y eso calibra para qué sirve:

| Puerta | Desarrollo | Reserva | ¿Transfirió? |
|---|---|---|---|
| Diversificación | 0,50 | 0,49 | **sí** |
| Fricciones | 90,5% | ~93% | **sí** |
| Rotación | 17,6 | 30,4 | sí |
| Amplitud | 7/7 | 3/7 | **no** |
| Ventaja | 0,892 | 0,118 | **no** |

**Las propiedades estructurales de una regla transfieren; su rendimiento no.** El valor de
la criba está en sus REJECT: ahorró tres miradas a la reserva. Un ADVANCE solo dice que
ninguna razón barata para descartarla se cumple.

### Funding: descargado, probado, agotado

Dataset congelado de funding de perpetuos, unido a las velas con regla causal verificada
sobre 56.336 barras sin un solo desajuste. Dos candidatas, ambas rechazadas. La hipótesis de
carry salió **invertida**: el funding alto predice retornos más altos. Y aunque el funding
resultó ser la primera señal con información *e* independencia del régimen EMA
(concordancia 0,59), la regla construida sobre ella no sobrevivió a la reserva.

## 8. Estado

Fase **cerrada**. 11 estrategias, 222 experimentos, 200 specs versionados, 1.443 tests, 104
activos por regla, 95 ensayos declarados.

Nada promovido a paper, nada desplegado, nada operando con dinero real. RUN-3 sigue
exactamente como estaba, anclado a su tag.
