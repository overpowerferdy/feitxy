<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project decisions
- Store the light/dark theme choice in localStorage and follow the device theme until the user picks one, so it works without sign-in.

## Project rules
- The opening splash lives in the root route component, so it plays only on a full app load and never on in-app navigation.
- User-facing app name comes from copy, not code identifiers; internal `FitTrack*` names and `fittrack-*` storage keys stay unchanged so saved data keeps loading.
- App state lives in one `FeitProvider` (src/lib/feit-store.tsx) mounted in the root route; pages read it with `useFeit()` so data isn't re-read on every navigation.
- Logs live in browser localStorage and, when signed in, are mirrored to the `user_data` table (one JSON row per user, newest copy wins, first sign-in on a device merges both) so every device gets them; photos stay on the device.
- Routine reminders: a managed 15-minute schedule calls /api/public/jobs/routine-reminders, which sends web push signed by a server-generated key kept in a service-role-only table; routine times use quarter hours to match that cadence.
- The push worker (public/push-sw.js) uses scope /push/ and never caches pages, so it can't serve stale app files.
- Workout photos are stored in IndexedDB (src/lib/photo-store.ts), not localStorage, because images exceed its size limit.
- Lesson code boxes block paste/drop and large single-step insertions so practice answers are typed by hand.
