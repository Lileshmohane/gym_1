# FitTrack — Mobile App (React Native / Expo)

Source implements gym admin and member flows from the **Technical Architecture Document**
and **UI/UX Design Document**, wired to the `/api/v1` backend contract. Gym admins register a gym,
then add members with profile photos; admins and members use role-specific login.

## Getting started

```bash
npm install
npx expo start --lan
```

For Expo Go on a physical device, keep the phone and computer on the same Wi-Fi network.
The local API defaults to `http://192.168.1.35:8080`; set `EXPO_PUBLIC_API_URL` if the
computer's LAN address changes or when using staging/production. The backend must listen
on the LAN interface, not only `localhost`.

## Structure

```
src/
├── api/            axios client + interceptors, react-query hooks per endpoint
├── components/      Button, Card, StatusBadge, EmptyState, Toast
├── navigation/       AuthStack (Welcome → Login / Register Gym), MainTabs, RootNavigator
├── notifications/    foreground listener and local test notification
├── screens/          auth/ (Welcome, Splash, Login, Register Gym) home/ members/ plans/ profile/
├── store/            authStore (zustand + expo-secure-store)
├── theme/            tokens.ts — colors/spacing/typography, single source of truth
└── utils/            date helpers
```

`WelcomeScreen` is the first screen a signed-out user sees, with links to admin registration and role-specific login.

## What's implemented vs. stubbed

- **Implemented**: gym admin registration, role-specific admin/member login, gym dashboard/profile,
  plan browsing and owner-only plan creation, owner/staff member listing and photo creation,
    owner/staff member editing, owner-only member deactivation and personal-data erasure, secure token
    storage, and local notification testing in an EAS development build.
- **Not implemented by the current backend**: subscription assignment/details, payments, attendance,
  remote device-token registration, and saved notification preferences. Their mobile tabs/actions are
  intentionally not shown until corresponding API controllers exist. Members can browse their gym's plans;
  enrollment still needs an admin workflow.
- **Separate project**: the web dashboard is not part of this mobile app.

## Building & releasing

See the **Deployment Document**, Section 5, for EAS build profiles (`eas.json` here matches
it), build/submit commands, and OTA update workflow.
