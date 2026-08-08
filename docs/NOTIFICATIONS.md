# Notification Capability

## Implemented locally

- Native notification permission status and request flow through Expo Notifications
- Granular iOS authorized, provisional, ephemeral, denied, and not-determined states
- Android emergency-alert channel creation before the permission request
- Explicit unsupported behavior on web
- Deterministic hazard, active-status, severity, urgency, and demo filtering
- Duplicate fingerprints based on provider ID and issue time
- Bounded local receipt storage

An alert qualifies only when notifications are enabled, the alert is active, the user selected its hazard, and the alert is severe, extreme, or immediate. Simulated alerts never qualify.

## Required external configuration

Remote push delivery is not active. Completing it requires:

- An EAS project ID
- Apple Push Notification service credentials for iOS
- Firebase Cloud Messaging credentials for Android
- Physical-device development builds
- A backend endpoint that registers and revokes Expo push tokens
- A backend delivery job with server-side geographic matching and a durable uniqueness constraint

Expo Go cannot be used for remote push notifications on Android. The settings screen therefore describes device permission separately from remote delivery readiness. Web remains a demonstration surface and does not claim native push capability.
