# Estribillo

Karaoke B2C: reserva de cabinas privadas por franja de 60 min, cola de canciones, bar y ticket QR.

## Demo

- `demo@estribillo.dev` / `demo1234` (cantante)
- `staff@estribillo.dev` / `demo1234` (staff)

Inputs de login vacíos. Credenciales debajo del formulario.

## Stack

Angular 22 (zoneless, signals) + NestJS 11 + TypeORM + SQLite (Neon-ready). API puerto **3070**.

## Ciclo transaccional

Hold 15 min (`expiresAt` server) → confirm → QR. Sweeper 30s. 409 si la franja está cogida o el mismo usuario ya tiene pending/confirmed.
Puntos: 8 × partySize al completar.

## Build

```
cd apps/api && npm run build
cd apps/web && npm run build
```
