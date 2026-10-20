# Design

Sistema heredado de la guía de marca de La Segunda (GUIA_ESTILO_LA_SEGUNDA.md), aplicado a una herramienta de mostrador y a su PDF. Registrado desde lo construido.

## Color

| Token | Valor | Uso |
|---|---|---|
| rojo | #e20039 | Franja de marca, acción principal, opción recomendada, tildes de cobertura |
| rojo-oscuro | #b91f38 | Hover de la acción principal, mosaico |
| rojo-vivo | #f42c4b | Mosaico |
| rojo-claro | #ff4c60 | Mosaico |
| rosa | #fdf0f3 | Fila de plan elegido, columna de la opción recomendada en la tabla |
| tinta | #231a1d | Texto principal |
| suave | #6b5f63 | Texto secundario (contraste 6:1 sobre blanco) |
| linea | #ece3e6 | Bordes y separadores |
| fondo | #f6f2f3 | Fondo de página |

Placeholders y botones desactivados usan #7d7175 (4,7:1). Sobre rojo, el texto secundario va en #ffdbe3, nunca en gris.

Estrategia: blanco con el rojo como dueño de las zonas de marca (franja superior y tarjeta recomendada). Modo claro únicamente: se usa en la oficina, de día.

## Tipografía

Solo Sora (300 a 700), en la pantalla y en el PDF. Títulos en 700 con tracking negativo leve. Etiquetas en 500. Precios en 700 con cifras tabulares.

## Firma visual

- **Mosaico rojo:** grilla de 5×10 en rojos análogos que sube en escalera hacia la derecha. Va en el encabezado de la app, en la franja del PDF y en el estado vacío.
- **Crédito AGENCIA WINIFREDA:** blanco, 700, mayúsculas, tracking de 2 px, en una sola línea, con barra blanca de 3 px a la izquierda (2 pt en el PDF).
- **Escalera de planes:** lista de los 8 planes de mayor a menor cobertura. Cada uno muestra 20 barritas: roja si el plan tiene esa cobertura, gris si no. Al tocar un plan, la fila se despliega con el editor de la opción (animación de 360 ms con curva de salida exponencial).

## Componentes

- Inputs: 44 px de alto, radio de 8 px, borde `linea`. El foco pasa el borde a rojo y suma un anillo rojo al 15%.
- Acción principal: fondo rojo, sombra roja desplazada hacia abajo, hover en rojo-oscuro. Desactivada se ve en `linea` con texto #7d7175.
- Chips (franquicia, Recomendada): forma de píldora. Activos (`aria-pressed`), van en rojo con texto blanco.

## PDF (A4)

1. Franja roja de 82 pt con el logo blanco, el crédito y el mosaico.
2. "Cotización para {cliente}", vehículo, fecha y número.
3. Hasta 3 tarjetas de opción con precio. La recomendada va en rojo lleno. Los planes que no son Todo Riesgo llevan una advertencia en rojo oscuro con ícono de atención, en 2 líneas como máximo: "No cubre daños parciales por choque, como chocar un perro."
4. Tabla comparativa agrupada, con tildes, notas en rojo ("Hasta 10%") y guion gris donde no cubre. Accidente total y Accidente parcial se muestran siempre y, donde faltan, dicen "No cubre". La columna recomendada lleva fondo rosa. Con 3 opciones entra entera en la hoja 1.
5. Hoja 2: glosario en dos columnas parejas con los textos oficiales de La Segunda (Accidente parcial suma el ejemplo del perro), más la aclaración legal.
6. Pie fijo con el isotipo, la agencia, los datos de contacto y la numeración de página.
