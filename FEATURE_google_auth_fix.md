# FEATURE: Fix Google Authentication — Real Emails Only

## Context for the Coding Agent

The current build's Google sign-in is accepting emails that should not be possible to get through real Google OAuth — including, per the product owner, emails that don't actually exist. This should be architecturally impossible if Google OAuth is correctly implemented, because Google itself verifies the email ownership before ever returning it to us. **This means the current implementation is not doing real Google OAuth correctly**, not that Google OAuth itself is insufficient. Do not "fix" this by adding email-regex validation or a verification-email step — that treats the symptom, not the cause, and contradicts the Google-OAuth-only decision already locked in ARCHITECTURE.md and SECURITY.md.

## Task 1: Diagnose Before Fixing

Before writing any fix, confirm and report back which of the following is actually happening — these require different fixes:

1. **Stub/mocked auth path:** Check whether the "Sign in with Google" button is wired to NextAuth's real `GoogleProvider` with a genuine Google Cloud OAuth Client ID/Secret, or whether it's calling a placeholder/mocked auth function that accepts arbitrary input. Report the actual code path used.
2. **Leftover Credentials provider:** Check `pages/api/auth/[...nextauth].ts` (or the App Router equivalent) for whether a `CredentialsProvider` (email/password) is still registered alongside or instead of `GoogleProvider`. This was supposed to be removed entirely in v2 (see ARCHITECTURE.md §1: "No Credentials provider, no password storage... removed entirely from v2 scope"). If it's still present and reachable, that is very likely the actual bug — a leftover password/email form that never talks to Google at all.
3. **Misconfigured OAuth consent screen:** Check whether the Google Cloud project's OAuth consent screen is in "Testing" mode with fake/unverified test users added, which can create the appearance of accepting arbitrary accounts.
4. **Client-side-only "looks like Google" UI:** Check whether the button is a styled UI component that was never actually connected to the OAuth flow — i.e., it just accepts a typed email string and treats it as logged in, cosmetically resembling a Google button but performing no real authentication.

Report which of these (or what else) is the actual root cause before proceeding to Task 2.

## Task 2: Implement Real Google OAuth Correctly

Once root cause is confirmed, implement (or repair) the flow to match this exact spec:

- **Provider:** NextAuth.js `GoogleProvider`, configured with a real `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from a properly configured Google Cloud OAuth consent screen (Production/Published status, not stuck in Testing mode restricted to a manual allowlist).
- **No other auth provider** may exist in the NextAuth config. Confirm `CredentialsProvider`, `EmailProvider` (magic link), or any other provider is fully removed — one provider only: Google.
- **Email comes from Google's verified profile claim, never from user input.** The `email` field on our `User` model must be populated from the OAuth callback's Google profile data (`profile.email`), never from a form field the user typed.
- **Use Google's `email_verified` claim as a hard gate.** Google's OAuth response includes an `email_verified` boolean on the profile. If `email_verified` is `false` (rare, but possible for some Google Workspace configurations), reject the sign-in with a clear error rather than silently allowing it — do not assume all Google accounts are pre-verified.
- **Account matching uses Google's `sub` (subject/googleId), not email alone,** for returning-user lookups — this was already specified in ARCHITECTURE.md's `User` model (`googleId String @unique`). Confirm this field is actually being populated and used in the sign-in callback, not just present in the schema unused.

## Task 3: Redirect URI / Environment Configuration Check

A common cause of "it lets weird stuff through" is a redirect URI misconfiguration. Confirm:
- The Google Cloud OAuth Client has the correct **Authorized redirect URIs** for both the production Vercel domain and any preview/staging domains — wildcard or overly permissive redirect URIs are a security risk and can also cause unpredictable auth behavior.
- `NEXTAUTH_URL` environment variable is correctly set per environment (not left pointing at `localhost` in production).
- `NEXTAUTH_SECRET` is set and is a real random value, not a placeholder.

## Verification Plan (must pass before this is considered fixed)

1. Attempt to sign in with a real, valid Google account — confirm success and confirm the stored `email` matches that account's actual Gmail/Workspace address exactly.
2. Attempt to sign in by typing an arbitrary/fake email into any input field on the login page — confirm there is no such input field at all. The only interactive element on the login page should be the "Sign in with Google" button; if a text input for email exists anywhere in the auth flow, that is itself the bug.
3. Attempt to inspect network requests during sign-in and confirm the flow actually redirects to `accounts.google.com` and back — if it does not leave our domain at any point, it is not real OAuth.
4. Confirm in the database that a new `User` row's `email` and `googleId` fields match the real values returned by Google's `/userinfo` or ID token — not client-supplied values.
5. Report back explicitly: "Root cause was X, fix applied was Y, verified via steps 1–4."
