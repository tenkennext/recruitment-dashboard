<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/dff9a043-e32e-4c48-8ac7-f524214cfa06

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Start the backend server:
   `npm run dev:server`
3. Start the frontend client:
   `npm run dev:client`

Also available as a combined command:

   `npm run dev`

### Arquitectura cliente-servidor

Este proyecto ahora tiene una API backend en `server/index.ts` que expone los endpoints:

- `GET /api/status`
- `GET /api/job-requirements`
- `GET /api/candidates`
- `GET /api/candidates/:id`

El frontend React en `src/App.tsx` consume esos endpoints a través de `src/api.ts`, respetando la separación de responsabilidades entre cliente, API y servidor.
