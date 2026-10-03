# Plataforma de test para oposiciones

Primera oposición: Auxiliar Administrativo del Estado. Plan y diseño en `docs/propuesta-fase-1.md`.

## Puesta en marcha

```bash
npm install
cp .env.example .env.local      # rellena las claves
npx supabase start              # base de datos y auth en local (Docker)
npx supabase db reset           # aplica migraciones y semilla
npm run dev
```
