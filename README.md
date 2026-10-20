# Cotizador La Segunda · Agencia Winifreda

Arma cotizaciones de seguro de auto en PDF para mandarle al cliente. Se cargan el cliente y el vehículo, se eligen hasta 3 planes de La Segunda, se pone el precio de cada uno y se descarga o comparte el PDF. No usa base de datos: todo pasa en el navegador.

## Usarlo en la compu

```bash
npm install
npm run dev
```

Abrí http://localhost:3000. En desarrollo, http://localhost:3000/?demo precarga una cotización de ejemplo.

## Qué editar

| Qué | Dónde |
|---|---|
| Datos de la agencia que salen en el pie del PDF (productor, matrícula SSN, teléfono, WhatsApp, email, dirección) | `src/config/agencia.ts` |
| Planes, coberturas, textos explicativos y límites de RC | `datos/planes-auto.json` |
| Orden y agrupado de las coberturas en la tabla, notas como "Hasta 10%" | `src/lib/planes.ts` |
| Diseño del PDF | `src/pdf/CotizacionPDF.tsx` |
| Pantalla de carga | `src/components/Cotizador.tsx` |

Los planes se relevaron de la web pública de La Segunda (lasegunda.com.ar/seguros-para-autos) el 20/10/2026. Si La Segunda cambia planes, coberturas o límites de Responsabilidad Civil, hay que actualizar `datos/planes-auto.json`.

## Publicarlo en GitHub Pages

El sitio es 100% estático: `npm run build` genera la carpeta `out/`. El workflow `.github/workflows/pages.yml` lo compila y lo publica en cada push a `main`.

1. En el repo, entrá a **Settings → Pages** y, en **Build and deployment → Source**, elegí **GitHub Actions**.
2. Hacé un push a `main` o corré el workflow a mano desde **Actions → Publicar en GitHub Pages → Run workflow**.
3. Queda en https://tomasbasso.github.io/CotizadorAutomoviles/

El prefijo `/CotizadorAutomoviles` lo pone el workflow con `NEXT_PUBLIC_BASE_PATH`, así que en local no hace falta configurar nada.

## Stack

Next.js 16 (App Router), Tailwind 4, @react-pdf/renderer (el PDF se genera en el navegador) y tipografía Sora. Los logos son los oficiales de `Recursos_Marca`.
