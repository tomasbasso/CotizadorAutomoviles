/** Prefijo del sitio publicado (por ejemplo "/CotizadorAutomoviles" en GitHub Pages). Vacío en local. */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Ruta a un archivo de public/ que funciona con o sin prefijo. */
export const conBase = (ruta: string) => `${BASE_PATH}${ruta}`;
