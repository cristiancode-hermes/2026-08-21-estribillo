# API — Estribillo

Prefix `/api`. Auth: `POST /auth/login` `{ identifier|login, password }`.

Hold: `POST /bookings/hold` `{ slotId, partySize, menuItemIds?, extraHour? }` → 409 `SLOT_TAKEN` | `ALREADY_HELD`.

Confirm: `POST /bookings/:id/confirm` → `{ booking, qrSvg }`.

Queue: `PUT /bookings/:id/queue` `{ songIds }`.

Staff: `GET /stats/occupancy`, `GET /stats/revenue?days=7`.
