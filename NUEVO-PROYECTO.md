# Cotizador La Segunda (agencia Winifreda)
Tipo: propio (agencia La Segunda en Winifreda)
Tamaño: chico (validación corta y construcción directa; /gsd-quick pide un roadmap GSD)
Etapa actual: 6. Publicar (falta el OK para subir a Vercel y los datos de la agencia)

## Decisiones
- 2026-10-20 GO: herramienta interna para armar cotizaciones de auto en PDF y mandarlas al cliente. Valor claro, sin backend.
- 2026-10-20 Cada PDF compara hasta 3 opciones, cada una con su precio cargado a mano. Se puede repetir un plan con otra franquicia.
- 2026-10-20 Solo autos y pick-ups (los 8 planes de la web pública). Motos y camiones quedan afuera por ahora.
- 2026-10-20 Datos a mano: cliente, vehículo, año, plan(es), precio y franquicia (solo Plan 30 / Todo Riesgo). Se agregan el período del precio (mes por defecto) y la marca de "Recomendada".
- 2026-10-20 Sin historial ni login. Se puede sumar después con Supabase.
- 2026-10-20 Stack: Next.js 16 + @react-pdf/renderer, con el PDF generado en el navegador. Deploy previsto en Vercel.
- 2026-10-20 Diseño: guía de marca La Segunda (rojo #e20039, Sora, mosaico rojo, crédito AGENCIA WINIFREDA). Detalle en DESIGN.md.
- 2026-10-20 Planes y coberturas relevados de lasegunda.com.ar → datos/planes-auto.json. Si cambian planes o límites de RC, hay que actualizar ese archivo.

## Etapas
- [x] 1. Validar: GO. Herramienta interna chica, uso claro, sin base de datos.
- [x] 2. Definir y planificar: alcance en PRODUCT.md (se salteó GSD por el tamaño).
- [x] 3. Identidad y diseño: se heredó la marca; dirección en .impeccable/surfaces y DESIGN.md.
- [x] 4. Construir: pantalla de carga con vista previa en vivo y PDF de 2 hojas.
- [x] 5. Verificar: tsc, lint y build OK; probado en navegador en escritorio y celular; detector de impeccable sin hallazgos. No guarda datos, así que no requiere revisión de seguridad.
- [ ] 6. Publicar: completar src/config/agencia.ts y subir a Vercel.
- [ ] 7. Lanzar y vender: no aplica, es de uso interno.
- [ ] 8. Mantener: revisar cada tanto los planes y límites en la web de La Segunda.
