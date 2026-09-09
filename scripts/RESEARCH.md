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
