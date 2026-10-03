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

# Project decisions

- Keep shimeji frames and editable profile media in the existing browser-local site settings; this preserves the current editing workflow without implying files are shared across visitors.
- Use multiple individual image uploads instead of executable JAR or ZIP packages for shimeji animations; browsers cannot safely execute desktop shimeji programs and explicit ordered frames are easier to manage.
- Use Pointer Events for the custom cursor and hide it on touch; this supports Apple Pencil and mouse without showing a cursor for finger navigation.- Site settings chosen in the admin panel (profile, images, emojis, portfolio, Spotify, social flip, shimeji frames) are shared with all visitors via the public.site_settings table: reads are public, writes go through the saveSiteSetting server function (password-checked, supabaseAdmin); localStorage is only a local cache.
