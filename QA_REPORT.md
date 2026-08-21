# QA Report — 2026-08-21 Estribillo

**Project:** Karaoke B2C — reserva de cabinas privadas por franja de 60 min, cola de canciones, bar y ticket QR.
**Stack:** Angular 22 (zoneless, signals) + NestJS 11 + TypeORM + SQLite (Neon-ready)
**Author:** Hermes Daily Builder
**Design lock:** DESIGN_FREE (`isFinalDesign.true` ausente)

## ✅ 1. Build Verification

| Target | Status | Details |
|--------|--------|---------|
| API `tsc --incremental false` | ✅ | `apps/api/dist/main.js` presente |
| Web `ng build` production | ✅ | `apps/web/dist/web/browser/index.html` + `baseHref: "/"` |
| Jest | ✅ | 23/23 |

## ✅ 2. Test Results

23 test cases — ALL PASSED (`booking-rules.spec.ts`: transiciones, 409 same-user, puntos 8×, suma de líneas, cancel 24h, partySize, QR, hold 15 min, sweeper helpers, mutex).

| Suite | Cases |
|-------|-------|
| transitions | 4 |
| duplicate user slot | 4 |
| points / totals / cancel / partySize | 5 |
| QR / hold / pending expiry / mutex | 10 |

New tests: existing coverage adequate (23 ≥ 16).

## ✅ 3. Binary / Runtime Verification

| Mode | Output | Status |
|------|--------|--------|
| API :3070 | Seed `demo@estribillo.dev` / `staff@estribillo.dev` · 7 cabinas · 26 canciones | ✅ |
| Endpoint smoke | 24/24 | ✅ |
| Hold 15 min `expiresAt` server | pending + 15 min | ✅ |
| 409 same-user + other-user | HTTP 409 | ✅ |
| Lista ↔ detalle `totalCents` | 2400 = 2400 | ✅ |
| QR en confirmación | SVG + código `EST-*` | ✅ |
| Staff stats 403 para player | 403 | ✅ |
| Gráfico staff | ejes X/Y + fechas + tooltips | ✅ |

Auth: `RegisterDto` = username+email+password; login identifier **o** login alias; respuesta `{ accessToken, user }`. HTTP 201 en POST = PASS.

## ✅ 4. Quality Audit

| Criterion | Verdict | Notes |
|-----------|---------|-------|
| Auth routes antes de `**` | PASS | `/login` `/registro` top-level |
| Creds demo debajo, inputs vacíos | PASS | `autocomplete="off"` / `new-password` |
| JWT namespaced + dual-write `token` | PASS | `estribillo_token` y `token` |
| Interceptor lee localStorage (no AuthService) | PASS | Bearer real (no `***`) |
| `provideZonelessChangeDetection` | PASS | |
| Rutas dinámicas `ngOnInit` | PASS | cabinas/:id, confirmacion, mis-noches/:id |
| Capa de valor de verdad | PASS | mutex cabina×franja + sweeper + 409 |
| Contraste botones AA | PASS | light primary 8.68, hover 11.12; dark 5.33 / 7.69 |
| contraste-hover (2026-08-19) | PASS | `a:hover:not(.btn)` + `color: on-primary` en hover/focus/active |
| Home = catálogo `freeSlotsToday` | PASS | misma API rooms |

### Minor Issues

| Issue | Severity | Suggestion |
|-------|----------|------------|
| Screenshots portafolio `/assets/estribillo.png` | baja | Capture cron posterior (normal) |
| Browser headless no disponible en este run | info | Smoke funcional cubierto por curl + API |

## ✅ 5. Security Scan

| Check | Result |
|-------|--------|
| JWT secret default solo dev | OK (env `JWT_SECRET`) |
| Passwords bcrypt | OK |
| Guards JWT en bookings | OK |
| StaffGuard tras JwtAuthGuard | OK |
| ValidationPipe whitelist + forbidNonWhitelisted | OK |

## ✅ 6. Deployment

| Target | Result | Details |
|--------|--------|---------|
| Caddy | ✅ | `estribillo.proyectos.cristiancode.dev` → dist + `/api*` :3070 |
| API | ✅ | puerto **3070**, `manage-apis.sh` alineado 55/55 |
| Excel | ✅ | fila 87 · `#86` |
| Landing | ✅ | `name:'estribillo'` en proyectos.cristiancode.dev |
| GitHub | ✅ | https://github.com/cristiancode-hermes/2026-08-21-estribillo |
| Portfolio es/en/pt | ✅ | slug `estribillo`, id accordion 206, `date: 2026-08-21` |
| Capture config | ✅ | tokenField `accessToken`, loginField `identifier`, `estribillo_token` |

### Link check

| Link | HTTP |
|------|------|
| href https://estribillo.proyectos.cristiancode.dev | 200 |
| /login /cabinas /cabinas/1 | 200 |
| /api/health (prod) | 200 |
| prod login demo | 201 |
| link2 README | 200 |
| link3 repo | 200 |

## Summary

**OVERALL: PASS ✅**

Live: https://estribillo.proyectos.cristiancode.dev  
Demo: `demo@estribillo.dev` / `demo1234` (staff: `staff@estribillo.dev`)
