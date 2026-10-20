# Cotizador La Segunda · Agencia Winifreda

Arma PDFs para mandarle al cliente, en dos pestañas:

- **Auto**: se cargan el cliente y el vehículo, se eligen hasta 3 planes de La Segunda, se pone el precio de cada uno y se descarga o comparte el PDF.
- **Retiro**: se cargan nombre, fecha de nacimiento y sexo del cliente, y hasta 3 opciones de ahorro mensual con su edad de retiro. La renta mensual y los fondos acumulados se calculan como en el cotizador online de La Segunda, descontando además los gastos del plan Futuro Protegido.

No usa base de datos: todo pasa en el navegador.

## Usarlo en la compu

```bash
npm install
npm run dev
```

Abrí http://localhost:3000. En desarrollo, http://localhost:3000/?demo precarga una cotización de auto de ejemplo y http://localhost:3000/retiro/?demo una proyección de retiro (con `?demo=1`, de una sola opción).

## Qué editar

| Qué | Dónde |
|---|---|
| Datos de la agencia que salen en el pie del PDF (productor, matrícula SSN, teléfono, WhatsApp, email, dirección) | `src/config/agencia.ts` |
| Planes, coberturas, textos explicativos y límites de RC | `datos/planes-auto.json` |
| Orden y agrupado de las coberturas en la tabla, notas como "Hasta 10%" | `src/lib/planes.ts` |
| Diseño del PDF | `src/pdf/CotizacionPDF.tsx` (auto), `src/pdf/RetiroPDF.tsx` (retiro); franja, mosaico y pie compartidos en `src/pdf/comun.tsx` |
| Pantalla de carga | `src/components/Cotizador.tsx` (auto), `src/components/CotizadorRetiro.tsx` (retiro); piezas compartidas en `src/components/comun.tsx` |
| Retiro: tasas de proyección y garantizada, aportes, edades, gastos, rescates, rendimiento de la cartera, textos oficiales y tabla de factores de renta | `datos/retiro.json` (el cálculo está en `src/lib/retiro.ts`) |

Los planes se relevaron de la web pública de La Segunda (lasegunda.com.ar/seguros-para-autos) el 20/10/2026. Si La Segunda cambia planes, coberturas o límites de Responsabilidad Civil, hay que actualizar `datos/planes-auto.json`.

El cálculo de retiro se sacó del código público de lasegundaonline.com.ar/cotizacion-online/retiro el 20/10/2026. El sitio solo descuenta de cada aporte la tasa SSN (0,6 %); acá también se descuentan los gastos administrativos (1 % en pesos, 0,5 % en dólares) y el sellado que informa la hoja de Retiro para agencias, así que los montos dan un poco por debajo de los del sitio. Edad de contratación, tasa garantizada, rescates y gastos salen de esa hoja.

Qué revisar en `datos/retiro.json`:

- **Cada mes:** `rendimientoCartera`, con el Informe Mensual de Rendimientos de La Segunda Retiro (sale en la hoja 2 del PDF con el mes del informe).
- **Si cambian:** las tasas de proyección (20 % y 5 %) y los topes de aporte del cotizador online, y los gastos, quitas y edades de la hoja para agencias.
- **Pendiente:** `gastosSobreAporte.sellado` está en 0; cargá el sellado de La Pampa si corresponde.

## Publicarlo en GitHub Pages

El sitio es 100% estático: `npm run build` genera la carpeta `out/`. El workflow `.github/workflows/pages.yml` lo compila y lo publica en cada push a `main`.

1. En el repo, entrá a **Settings → Pages** y, en **Build and deployment → Source**, elegí **GitHub Actions**.
2. Hacé un push a `main` o corré el workflow a mano desde **Actions → Publicar en GitHub Pages → Run workflow**.
3. Queda en https://tomasbasso.github.io/CotizadorAutomoviles/ (auto) y https://tomasbasso.github.io/CotizadorAutomoviles/retiro/ (retiro).

El prefijo `/CotizadorAutomoviles` lo pone el workflow con `NEXT_PUBLIC_BASE_PATH`, así que en local no hace falta configurar nada.

## Stack

Next.js 16 (App Router), Tailwind 4, @react-pdf/renderer (el PDF se genera en el navegador) y tipografía Sora. Los logos son los oficiales de `Recursos_Marca`.
