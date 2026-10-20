# Guía de Estilo y Manual de Publicidades — La Segunda PUBLIS

Este documento consolida toda la inteligencia y reglas de diseño almacenadas en la memoria de Antigravity (Engram) para asegurar la consistencia total en las piezas publicitarias de La Segunda Seguros.

---

## 1. Identidad de Marca (Brandbook)

### Paleta de Colores Oficial
- **Rojo Principal (Obligatorio):** `#e20039` (Dominante en todas las piezas)
- **Rojos de Apoyo (Mosaicos/Fondos):**
  - Rojo Oscuro: `#b91f38`
  - Rojo Vibrante: `#f42c4b`
  - Rojo Claro: `#ff4c60`
- **Acentos Secundarios (Uso mínimo):** Amarillo (`#f8cc59`), Naranja (`#ff593e`), Azul (`#4183ca`).

### Tipografía
- **Fuente:** `Sora` (Google Fonts).
- **Jerarquía:**
  - **Bold (700):** Títulos y mensajes de impacto.
  - **Medium (500):** Subtítulos y CTAs.
  - **Regular (400):** Cuerpo de texto.
  - **Light (300):** Información técnica o secundaria.

### Prohibiciones
- 🚫 **NUNCA** usar tipografías distintas a Sora.
- 🚫 **NUNCA** usar colores fuera de la paleta oficial (especialmente azules o verdes como protagonistas).
- 🚫 **NUNCA** deformar o aplicar efectos de sombra/perspectiva al logo oficial.

---

## 2. Crédito Obligatorio: "Agencia Winifreda"

Toda pieza publicitaria **DEBE** incluir el pie de agencia con este estilo exacto:

### CSS de Referencia
```css
.agencia-texto {
    color: #FFFFFF;
    font-family: 'Sora', sans-serif;
    font-weight: 700;
    font-size: 1rem;
    letter-spacing: 2px;
    text-transform: uppercase;
    white-space: nowrap;
    border-left: 3px solid #FFFFFF; /* Barra separadora blanca */
    padding-left: 12px;
}
```
- **Regla:** El texto debe estar en una sola línea y en mayúsculas.

---

## 3. Recursos y Logos (Rutas Locales)

Para evitar imágenes rotas, usar siempre estas rutas relativas desde la subcarpeta de la campaña (ej: `publicidades/campaña/index.html` usa `../../`):

| Recurso | Ruta Sugerida | Uso |
| :--- | :--- | :--- |
| **Logo Blanco** | `../../Recursos_Marca/LaSegunda_Negativizada.png` | Sobre fondos rojos o fotos oscuras. |
| **Logo Rojo** | `../../Recursos_Marca/LaSegunda_Color_RGB.png` | Sobre fondos blancos o claros. |
| **Isotipo (G) solo** | `../../Recursos_Marca/Logo La segunda.png` | Para perfiles de redes sociales o íconos pequeños. |

---

## 4. Flujo de Trabajo (Workflow)

1.  **Copywriting:** Definir Hook (impacto), Mensaje Central y CTA (Llamado a la acción). Usar tono argentino ("vos").
2.  **Aprobación:** Validar el texto con el usuario antes de codificar.
3.  **Implementación HTML/CSS:** 
    - Formato Historia: `1080x1920px`.
    - Formato Post: `1080x1080px`.
    - Incluir siempre el **Mosaico Rojo** (bloques de rojos análogos).

---

## 5. Tono y Lenguaje
- **Profesional, optimista y cercano.**
- **Localismo:** Hablarle al cliente de Winifreda y zona de influencia con cercanía, pero con el respaldo de una gran compañía.

---

> [!IMPORTANT]
> Consultar este manual antes de iniciar cualquier nueva pieza publicitaria para garantizar que el "ADN" de La Segunda se mantenga intacto.
