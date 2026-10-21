# Cotizador La Segunda (agencia Winifreda)
Tipo: propio (agencia La Segunda en Winifreda)
Tamaño: chico (validación corta y construcción directa; /gsd-quick pide un roadmap GSD)
Etapa actual: 6. Publicar (publicado en https://tomasbasso.github.io/CotizadorAutomoviles/; falta cargar los datos de la agencia)

## Decisiones
- 2026-10-20 GO: herramienta interna para armar cotizaciones de auto en PDF y mandarlas al cliente. Valor claro, sin backend.
- 2026-10-20 Cada PDF compara hasta 3 opciones, cada una con su precio cargado a mano. Se puede repetir un plan con otra franquicia.
- 2026-10-20 Solo autos y pick-ups (los 8 planes de la web pública). Motos y camiones quedan afuera por ahora.
- 2026-10-20 Datos a mano: cliente, vehículo, año, plan(es), precio y franquicia (solo Plan 30 / Todo Riesgo). Se agregan el período del precio (mes por defecto) y la marca de "Recomendada".
- 2026-10-20 Sin historial ni login. Se puede sumar después con Supabase.
- 2026-10-20 Stack: Next.js 16 + @react-pdf/renderer, con el PDF generado en el navegador.
- 2026-10-20 Publicación en GitHub Pages (repo tomasbasso/CotizadorAutomoviles): export estático, basePath por NEXT_PUBLIC_BASE_PATH y workflow .github/workflows/pages.yml. Se sacó cacheComponents porque PPR no funciona con output "export".
- 2026-10-20 Franquicia del Plan 30: porcentaje y monto en pesos.
- 2026-10-20 Diseño: guía de marca La Segunda (rojo #e20039, Sora, mosaico rojo, crédito AGENCIA WINIFREDA). Detalle en DESIGN.md.
- 2026-10-20 Planes y coberturas relevados de lasegunda.com.ar → datos/planes-auto.json. Si cambian planes o límites de RC, hay que actualizar ese archivo.
- 2026-10-20 Se suma Retiro: ingeniería inversa del cotizador público (el cálculo corre en el navegador; verificado contra el sitio con coincidencia exacta). Fórmula y parámetros en src/lib/retiro.ts y datos/retiro.json. Pestaña /retiro con hasta 3 opciones de ahorro (moneda única por PDF) y PDF de una hoja.
- 2026-10-20 Pantallas y PDF comparten encabezado, barra de acciones, vista previa, franja y pie (src/components/comun.tsx, src/pdf/comun.tsx). El PDF de autos quedó idéntico píxel por píxel.
- 2026-10-20 Retiro sigue las condiciones de Futuro Protegido de la hoja para agencias: descuenta gastos administrativos además de la tasa SSN (los montos dan ~1 % por debajo del sitio), contratación hasta 65 años, y el PDF suma mínimo garantizado, rescates, formas de cobro, beneficios y el rendimiento real de la cartera (informe mensual). El PDF pasa a 2 hojas.
- 2026-10-21 Simulador de retiro para clientes en /simulador-retiro/: misma pantalla con modo "cliente" (textos en segunda persona, dólares por defecto, nombre opcional, sin Auto ni Recomendada). Pensado para que los amigos del productor (27-28 años, trabajan en el campo) jueguen con el link que les llega por WhatsApp.
- 2026-10-20 trailingSlash en next.config: cada página se exporta como carpeta/index.html para que GitHub Pages sirva /retiro/ sin ambigüedad.

## Etapas
- [x] 1. Validar: GO. Herramienta interna chica, uso claro, sin base de datos.
- [x] 2. Definir y planificar: alcance en PRODUCT.md (se salteó GSD por el tamaño).
- [x] 3. Identidad y diseño: se heredó la marca; dirección en .impeccable/surfaces y DESIGN.md.
- [x] 4. Construir: pantalla de carga con vista previa en vivo y PDF de 2 hojas.
- [x] 5. Verificar: tsc, lint y build OK; probado en navegador en escritorio y celular; detector de impeccable sin hallazgos. No guarda datos, así que no requiere revisión de seguridad.
- [x] 6. Publicar: en GitHub Pages desde el 2026-10-20 (https://tomasbasso.github.io/CotizadorAutomoviles/). Pendiente: completar src/config/agencia.ts.
- [ ] 7. Lanzar y vender: no aplica, es de uso interno.
- [ ] 8. Mantener: revisar cada tanto los planes y límites en la web de La Segunda, actualizar cada mes el rendimiento de la cartera de retiro (datos/retiro.json) con el informe mensual, y revisar tasas, topes y gastos de retiro.
