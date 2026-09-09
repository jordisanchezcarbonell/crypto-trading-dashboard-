# Resultados research locales

Las rutas `/research` y `/research/compare?asset=BTC%2FUSDT` leen `data/research/measured.json`. Research tiene layout independiente y no consulta el snapshot de RUN-3.

## Regenerar

Desde la raíz del dashboard, con Python + numpy, polars y pyarrow del entorno research:

```sh
PYTHONDONTWRITEBYTECODE=1 ../../research-lab-live/.venv/bin/python scripts/research_export.py --research-root ../../worktrees/research-platform
```

El comando verifica los gates y los hashes del dataset, ejecuta seis estrategias dos veces sobre nueve activos, compara hashes, persiste en `research_data/runs`, relee los resultados mediante el reader validado y reemplaza el bundle solo al terminar. Una repetición fallida no sustituye el bundle anterior. No accede a SQLite, exchange, Supabase o claves. Un solo proceso escritor a la vez.

Necesita los snapshots congelados y `research_data/datasets.local.toml`. No descarga datos implícitamente. Las fuentes y licencia de las señales externas están archivadas en `research/specs/external`; estas son adaptaciones, no reproducciones completas de Freqtrade.

## Ver frontend

Node >=20.9 (se verificó con Node 22):

```sh
npm run dev -- --hostname 127.0.0.1 --port 3100
```

Abrir http://127.0.0.1:3100/research. El servidor iniciado durante esta entrega usa `DASHBOARD_DATA_SOURCE=mock` para las rutas operacionales; los resultados de Research son calculados, no mock. Research no usa ese provider.

## Verificar

```sh
npm test
npm run typecheck
npm run build
../../research-lab-live/.venv/bin/python -m pytest -p no:cacheprovider scripts/test_research_export.py
```

El bundle contiene todas las curvas resumidas, pero el servidor solo envía al cliente las del activo seleccionado. Métricas y correlaciones se calculan antes de reducir las curvas. La correlación exige timestamps idénticos. Las ventanas entre estrategias se validan en el loader.

Los valores no finitos se exportan como null. Las unidades porcentuales se convierten explícitamente desde las fracciones del motor, incluida la exposición. No hay métricas de cartera agregada ni etiquetas OOS inventadas.

## Vista fuera de muestra

`/research/out-of-sample` lee `data/research/export/`, un contrato distinto del bundle de
arriba: lo publica el exporter del repositorio de research (`crypto_trading_lab.research.export`),
no `scripts/research_export.py`.

La vista muestra **solo la reserva con costes duplicados**. Es un segmento fijo y no un
selector a propósito: un resultado de desarrollo y uno de reserva son idénticos como números
y significan lo contrario, así que un toggle respondería otra pregunta bajo el mismo titular.
Cada fila del contrato lleva `segment`, `partition_side` y `stressed`, y son campos
obligatorios del esquema, no decoración.

Los veredictos se derivan de los datos por una regla escrita en la propia página, y los
descartes se renderizan junto a las supervivientes: enseñar solo lo que pasó el filtro
metería sesgo de supervivencia en el propio informe.

### Por qué hay dos caminos de datos

Ninguno es superconjunto del otro. El bundle tiene curvas por activo y matriz de correlación
que el contrato no tiene; el contrato tiene segmentos y estrés que el bundle no puede
expresar. Unificarlos hoy significaría diseñar una forma común antes de saber qué necesita
la investigación que la usará.

Lo que sí está cubierto es el riesgo real: `__tests__/research-paths-agree.test.ts` comprueba
que los dos coinciden **exactamente** en todos los números que ambos publican. No elimina la
duplicación; elimina que pueda divergir en silencio.

## Contexto e interpretación

`docs/research-phase-closure.md` resume qué se midió, qué se descartó y qué no demuestran
estas vistas. Conviene leerlo antes de sacar conclusiones de un gráfico.

## Aviso sobre la magnitud de las cifras

Ambas vistas muestran el **universo de nueve activos**, elegido a mano. Medido después sobre
104 activos seleccionados por regla mecánica, comprar y mantener rinde un CAGR mediano del
**−11,1%** frente al **+65,9%** de esos nueve: aquellos activos subieron de forma
excepcional, y los retornos absolutos que se ven aquí son en buena parte una propiedad de esa
selección.

Lo que sí se sostiene fuera de ellos es la ventaja **relativa**: comparada de forma pareada
contra mantener el mismo activo en la misma ventana, EMA-v2-risk gana en 71 de 95 activos
que nunca vio. Pero su Sharpe pasa de 1,42 a 0,34.

Contexto completo en `docs/research-phase-closure.md`, sección 7.
