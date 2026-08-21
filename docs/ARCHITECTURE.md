# Architecture — Estribillo

Monorepo `apps/api` (NestJS) + `apps/web` (Angular 22 zoneless).

Dominio: `Room` × `RoomSlot` (60 min, Europe/Madrid) → `Booking` (pending/confirmed/completed/cancelled/expired) + `BookingLine` + `QueueEntry`.

Auth JWT namespaced `estribillo_token`. Interceptor lee localStorage, no AuthService.

Puerto API 3070. SQLite `data/estribillo.db`; `DATABASE_TYPE=postgres` para Neon.
