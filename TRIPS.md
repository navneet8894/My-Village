# Dashboard and village trips

The web dashboard now shares a cream/green theme across admin and villager accounts, including dark mode and mobile bottom navigation. Existing family, functions, invitations, news and MapLibre routes remain available. The Expo app is unchanged.

## Run locally

1. Configure the existing backend environment (`MONGODB_URI`, `JWT_SECRET`, and the other settings in `backend/.env.example`).
2. In `backend`, run `npm run dev`.
3. In `web`, run `npm run dev`, then open the displayed local URL and sign in.
4. Open `/dashboard/trips`. Villagers must join a village first; admins select a target village when creating a trip.

MongoDB creates the new `trips` and `tripparticipations` collections. Startup waits for the participation model's indexes, including the unique `(trip, user)` index, before accepting requests. No existing records require a migration.

## Trip behavior

- Required: title, destination, meeting point and departure time. Optional: return time, description, HTTPS cover image and estimated cost per person. Form dates use IST regardless of the device timezone; API timestamps require an explicit offset and are stored in UTC.
- A confirmation includes the signed-in user plus a nonnegative integer number of additional family members. Included family members should not also confirm separately; this version does not identify individual guests or collect payments.
- Confirmation updates replace the same trip/account record. Cancelling a confirmation deactivates it, preserving history. Rejoining reactivates that record.
- A cancelled trip keeps its attendance and cannot reopen. Confirmations close at departure or cancellation. The organizer and admins can view participant names and party sizes; other villagers see totals and their own confirmation only.
- Admins can manage trips across villages, but can only participate as members of the trip's village.

## API

All routes require the existing bearer-token authentication. Banned accounts are rejected by the existing authentication middleware.

| Method and route | Behavior |
| --- | --- |
| `GET /api/trips` | Same-village trips; admins can see all villages |
| `POST /api/trips` | Create; server derives organizer and villagers' village |
| `GET /api/trips/:id` | Details, attendance total, own confirmation and permission flags |
| `PATCH /api/trips/:id` | Organizer/admin detail changes or `{ "status": "cancelled" }` |
| `PUT /api/trips/:id/participation` | `{ "additionalFamilyCount": 2 }` confirms three people |
| `DELETE /api/trips/:id/participation` | Deactivate the signed-in user's confirmation |
| `GET /api/trips/:id/participants` | Organizer/admin-only participant names and party counts |
| `GET /api/notifications/unread-count` | Actual unread total, independent of notification-list pagination |

Trip responses include `totalConfirmed`, `myParticipation`, `canManage` and `canParticipate`. Mutation responses may include `notificationWarning`: the trip has been saved, so clients should display the warning without retrying creation.

## Notifications and uploads

Trip publication writes in-app notifications to members of the target village. Edits and cancellation notify active participants. Existing event reminder scheduling is unchanged.

- Set `FIREBASE_SERVICE_ACCOUNT` to the existing Firebase service-account JSON or its file path to enable server-side push delivery. Push also requires the recipient's client to have registered a valid FCM token using the existing registration endpoint. The web shell polls unread counts every 60 seconds; this change does not add a browser service worker or background push registration.
- Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` for cover-photo upload. The trip form accepts images up to 10 MB and can publish without an image.
- Notification failures do not undo a saved trip. The UI reports partial delivery where the provider reports failures; no delivery retries or outbox are introduced in this version.

## Verification

- `cd backend` then `npm test`: isolated, in-process trip controller and schema tests. These verify access restrictions, identity injection, family totals, repeat confirmations, duplicate-key recovery, cancellation history, validation and notification failure handling. Database and notification services are test doubles; this suite does not prove live MongoDB concurrency or FCM delivery.
- `cd web` then `npm run build`: production bundle verification.
- With a development database, create two villagers in one village and an outsider in another. Create a trip, confirm self plus two guests, refresh, change the count, cancel and rejoin. Verify organizer-only participants, outsider rejection and retained attendance after trip cancellation.
- Check dashboard, trip list, detail and dialogs at 360px, 768px and 1440px, plus dark mode, Hindi selection, keyboard focus, loading, empty and API-error states. Check photo/video/audio news previews and map rendering where village coordinates exist.

In the implementation session, controller/schema tests and JS/JSX syntax checks passed. Full Vite build was blocked by sandbox `spawn EPERM`; permission to run it outside the sandbox was declined. Browser layout and live MongoDB/FCM verification remain manual checks.
