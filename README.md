# SYNCO - React App with Material-UI

Una aplicación React moderna construida con Vite y Material-UI que incluye un menú lateral y tres páginas principales.

## Características

- ⚡ **Vite** - Herramienta de construcción rápida
- 🎨 **Material-UI** - Componentes de interfaz moderna
- 📱 **Responsive Design** - Diseño adaptable a diferentes pantallas
- 🧭 **React Router** - Navegación entre páginas
- 📅 **Calendario Interactivo** - Vista de calendario funcional
- 📞 **Página de Contacto** - Información de contacto con acciones

## Páginas

### 🏠 Home
Página de bienvenida con mensaje "Hola Mundo" y información sobre la aplicación.

### 📅 Calendar
Calendario interactivo que permite:
- Navegar entre meses
- Ver el día actual resaltado
- Interfaz moderna y responsive

### 📞 Contact
Página de contacto que incluye:
- Información de teléfono con acción de llamada
- Email con acción de envío
- Dirección física
- Diseño con tarjetas interactivas

## Instalación y Uso

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Iniciar servidor de desarrollo:**
   ```bash
   npm run dev
   ```

3. **Abrir en el navegador:**
   ```
   http://localhost:5173
   ```

## Tecnologías Utilizadas

- React 19.1.1
- Vite 4.5.3
- Material-UI 7.3.4
- React Router DOM 6.28.0
- Emotion (para estilos CSS-in-JS)

## Estructura del Proyecto

```
src/
├── App.jsx          # Componente principal con layout y routing
├── main.jsx         # Punto de entrada de la aplicación
├── pages/
│   ├── Home.jsx     # Página de inicio
│   ├── Calendar.jsx # Página del calendario
│   └── Contact.jsx  # Página de contacto
└── assets/          # Recursos estáticos
```

## Características del Diseño

- **Sidebar Moderno**: Menú lateral fijo con iconos Material-UI
- **Responsive**: Se adapta a dispositivos móviles con menú colapsable
- **Tema Consistente**: Paleta de colores y tipografía uniforme
- **Interactividad**: Hover effects y transiciones suaves
- **Accesibilidad**: Componentes accesibles con ARIA labels

## Scripts Disponibles

- `npm start` - Inicia el servidor de desarrollo en puerto 3003
- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run build:gh-pages` - Construye para GitHub Pages con redirecciones
- `npm run preview` - Previsualiza la build de producción
- `npm run lint` - Ejecuta el linter de código

## Deploy y Configuración

### Problema de Rutas (404 en recarga)
Este proyecto está configurado para solucionar el problema común de las SPA donde recargar páginas como `/calendar` resulta en error 404.

### Archivos de Configuración Incluidos:
- **`vercel.json`** - Para deploy en Vercel
- **`public/_redirects`** - Para deploy en Netlify  
- **`gh-pages-redirect.sh`** - Script para GitHub Pages

### Instrucciones de Deploy:

#### Vercel (Recomendado)
1. Conecta tu repositorio a Vercel
2. El archivo `vercel.json` ya está configurado
3. Deploy automático en cada push

#### Netlify
1. Conecta tu repositorio a Netlify
2. El archivo `public/_redirects` ya está configurado
3. Deploy automático en cada push

#### GitHub Pages
1. Ejecuta `npm run build:gh-pages`
2. Sube el contenido de la carpeta `dist/` a tu repositorio
3. Configura GitHub Pages para servir desde la rama `gh-pages`

### Solución del Error 404
El problema ocurre porque los servidores estáticos buscan archivos físicos en rutas como `/calendar`, pero en una SPA todas las rutas son manejadas por JavaScript. Los archivos de configuración redirigen todas las rutas a `index.html` para que React Router pueda manejar la navegación.