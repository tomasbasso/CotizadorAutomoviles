# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: Next.js (App Router) + @react-pdf/renderer, sin backend, deploy en Vercel. Es el stack que el usuario ya domina; el PDF se genera en el navegador.

## Users

El productor/a de la agencia La Segunda en Winifreda (La Pampa). Arma cotizaciones de seguro de auto en la PC de la agencia, muchas veces mientras habla con el cliente por teléfono o WhatsApp. El PDF lo recibe el cliente, que casi siempre lo abre en el celular desde WhatsApp.

## Product Purpose

Pasar de "cuánto me sale asegurar el auto" a un PDF prolijo y comparativo en un par de minutos. El productor carga cliente y vehículo, elige hasta 3 planes de La Segunda, pone el precio de cada uno a mano y descarga o comparte el PDF. Funciona bien si el cliente entiende de un vistazo qué opción conviene y qué cubre cada una.

## Positioning

No es el cotizador de la compañía: los precios los pone el productor, que conoce a su cliente. El valor está en la presentación: las coberturas oficiales de cada plan, explicadas y comparadas lado a lado, con la cara de la agencia local.

## Operating Context

- Precios: los saca el productor del sistema de La Segunda y los carga a mano.
- Planes y coberturas: relevados de la web pública de La Segunda (datos/planes-auto.json, 20-10-2026). Hay que actualizarlos si cambian.
- Entrega: descarga de PDF o el menú de compartir del celular (WhatsApp).

## Capabilities and Constraints

- Hasta 3 opciones por PDF. Se puede repetir el mismo plan con distinto precio o franquicia.
- Datos por cotización: nombre del cliente, vehículo (marca, modelo, versión), año, plan, precio y franquicia (solo Plan 30 / Todo Riesgo).
- Solo autos y pick-ups (8 planes). Motos y camiones fuera de alcance por ahora.
- Retiro (pestaña aparte): nombre, fecha de nacimiento (18 a 65 años, según la hoja de Retiro para agencias) y sexo del DNI, moneda (pesos o dólares) y hasta 3 opciones de ahorro mensual con su edad de retiro (de la edad actual + 5 a 85). La renta mensual y los fondos acumulados se calculan con la fórmula, tasas y tabla del cotizador online de La Segunda, descontando además los gastos del plan Futuro Protegido (`datos/retiro.json`). Son estimaciones: el PDF lo aclara con los textos oficiales, informa el mínimo garantizado y muestra el rendimiento real de la cartera del último informe mensual.
- Sin historial, login ni base de datos.
- Pendiente de confirmar: si el precio es mensual, y los datos de contacto de la agencia (productor, matrícula SSN, teléfono, dirección).

## Brand Commitments

Guía de estilo La Segunda (GUIA_ESTILO_LA_SEGUNDA.md): rojo #e20039 dominante; rojos de apoyo #b91f38, #f42c4b, #ff4c60; solo tipografía Sora; logos oficiales sin deformar ni agregarles efectos; crédito obligatorio "AGENCIA WINIFREDA" (mayúsculas, una línea, barra blanca a la izquierda); recurso del mosaico rojo; tono profesional, optimista y cercano, con voseo y localismo.

## Evidence on Hand

- Logos: public/marca (color, blanco, isotipo, agencia-winifreda).
- Coberturas oficiales y límites de RC: datos/planes-auto.json.
- No hay testimonios, descuentos ni promociones: no inventarlos.

## Product Principles

1. El precio y la diferencia entre opciones se ven primero.
2. Cada cobertura se explica en criollo, con el texto oficial de La Segunda.
3. Cargar una cotización lleva menos de un minuto.
4. El PDF tiene que leerse bien en el celular del cliente.
