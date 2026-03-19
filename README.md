# Frontend - SiempreDeLocal

Aplicación web en React (Vite) para consumir la API de SiempreDeLocal.

## Requisitos
- Node.js 18+

## Configuración
Define la URL del backend en `.env`:
```
VITE_API_URL=http://localhost:8000
```

## Desarrollo
```bash
cd frontend
npm install
npm run dev
```

## Build de producción
```bash
cd frontend
npm run build
npm run preview
```

## Scripts
- `npm run dev` servidor de desarrollo
- `npm run build` build de producción
- `npm run preview` vista previa del build
- `npm run lint` linting
