<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- RMACTS app lives in src/rmacts; the / route renders it client-only (ssr: false) because Firebase Auth is browser-only.
- RMACTS app lives in src/rmacts and uses Lovable Cloud (auth, database, private storage buckets via signed URLs) through src/rmacts/cloud.ts; Firebase was removed because Storage needed a paid plan.
