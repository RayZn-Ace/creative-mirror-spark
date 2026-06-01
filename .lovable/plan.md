## Übersicht

Zwei Großthemen: (1) Memberbereich für Kunden ausbauen, (2) native Push Notifications via Firebase Cloud Messaging (FCM) für iOS + Android. Gast-Checkout bleibt erhalten — Account ist optional, aber Tickets können nachträglich verknüpft werden.

---

## Teil 1: Memberbereich

### Datenbank (Migration)
- **`customer_profiles`** (separat von admin `profiles`): user_id, display_name, avatar_url, phone, birth_date, address, city, zip, country, push_token, push_enabled, push_preferences (jsonb: new_events, reminders, sales, waitlist), preferred_cities (text[])
- **`customer_favorites`**: user_id, event_id, created_at (Unique constraint)
- **Order-Verknüpfung**: orders.email wird per Trigger oder beim Login automatisch mit Account verknüpft → keine Schema-Änderung nötig, einfach im UI nach `email = auth.user.email` filtern
- RLS-Policies + GRANTs für authenticated

### Neue Pages (Kunden-Bereich)
- `/account` → Dashboard mit Übersicht (nächstes Ticket, Favoriten-Count, kürzliche Bestellungen)
- `/account/profile` → Profil-Editor (Name, Foto-Upload zu `customer-avatars` bucket, Geburtstag, Adresse)
- `/account/tickets` → Aufgehübschte Ticket-Galerie (große Karten, QR sichtbar, PDF-Download, Add-to-Wallet)
- `/account/orders` → Bestellhistorie + Rechnungs-PDF Download (nutzt existierende Invoice-Logik)
- `/account/favorites` → Gemerkte Events mit Countdown
- `/account/notifications` → Push-Einstellungen (Toggle pro Kategorie + Städte-Multi-Select)

### Auth-Flow
- Neue `/login` & `/register` für Kunden (separat von `/admin/login`)
- Google Sign-In aktivieren
- Bei Login: Bestehende Orders mit gleicher E-Mail werden automatisch angezeigt
- BottomNav um "Konto" Tab erweitern (Avatar wenn eingeloggt, sonst Login-Icon)

### Favoriten
- Herz-Button auf Event-Karten überall (CityPage, Termine, Index)
- Optimistic UI, bei Klick ohne Login → Login-Prompt

---

## Teil 2: Push Notifications (Capacitor + Firebase)

### Setup
- Installation: `@capacitor/push-notifications`, `@capacitor-firebase/messaging`
- `capacitor.config.ts` um PushNotifications-Plugin erweitern
- User muss lokal Firebase-Projekt anlegen + `google-services.json` (Android) und `GoogleService-Info.plist` (iOS) ablegen → wird in der Anleitung erklärt
- iOS: Apple Push Notification Service Key (.p8) im Apple Developer Account erstellen, in Firebase hochladen

### Push-Token Erfassung
- Beim App-Start (nur native, nicht web): Permission anfragen, Token holen, in `customer_profiles.push_token` speichern
- Bei Logout: Token löschen
- Auch ohne Account: anonymer Token in neuer Tabelle `push_subscribers` (token, preferred_cities, preferences, created_at)

### Notification Triggers (Edge Functions)
- **`send-push`** (zentrale Funktion): nimmt user_ids oder filter (city, preference), holt FCM tokens, sendet via Firebase Admin SDK
- **Trigger 1 – Neue Events**: DB-Trigger oder cron → wenn neues Event published wird, push an alle mit `new_events: true` UND passender Stadt
- **Trigger 2 – Reminders**: Cron-Job (pg_cron, täglich 10:00) → findet Tickets für übermorgen → sendet Reminder
- **Trigger 3 – Sales/Last-Minute**: Admin-UI in `/admin/push` zum manuellen Broadcast erstellen
- **Trigger 4 – Waitlist**: Wenn sold_out → false wechselt, alle Waitlist-Einträge benachrichtigen

### Admin Push-Manager
- Neue Admin-Seite `/admin/push` mit:
  - Broadcast erstellen (Titel, Body, Bild, Deep-Link, Zielgruppe-Filter)
  - Historie aller gesendeten Pushes
  - Statistik (Delivered, Opened)
- Tabelle `push_campaigns`: title, body, image, deep_link, target_filter, sent_count, created_at

### Secrets nötig
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
(aus Firebase Service Account JSON)

---

## Technische Details

```
src/
  pages/account/
    AccountLayout.tsx       (Sidebar + Outlet)
    Dashboard.tsx
    Profile.tsx
    MyTickets.tsx           (ersetzt MeineTickets.tsx für eingeloggte)
    Orders.tsx
    Favorites.tsx
    Notifications.tsx
    Login.tsx
    Register.tsx
  contexts/
    CustomerAuthContext.tsx (separat von AdminAuthContext)
  hooks/
    useFavorites.ts
    usePushNotifications.ts
  components/
    FavoriteButton.tsx
    push/PushPermissionPrompt.tsx

supabase/functions/
  send-push/               (FCM Sender)
  register-push-token/     (Token speichern)
  push-trigger-new-event/  (per DB trigger via pg_net)
  push-reminders-cron/     (täglicher Cron)
```

### Reihenfolge der Umsetzung
1. DB Migrationen (Profile, Favorites, Push-Tabellen)
2. Customer Auth Context + Login/Register Pages
3. Account-Layout + Profile-Seite
4. Favoriten-System + Herz-Buttons
5. Order-History + Tickets-Seite
6. Push-Notification Setup (Capacitor + Token-Erfassung)
7. Push Edge Functions + Admin-Manager
8. Cron-Jobs & DB-Trigger
9. Anleitung für Firebase Setup

---

## Was du am Ende lokal machen musst (Firebase + Apple)

1. Firebase-Projekt erstellen (console.firebase.google.com) → kostenlos
2. Android App hinzufügen → `google-services.json` → in `android/app/` legen
3. iOS App hinzufügen → `GoogleService-Info.plist` → in `ios/App/App/` legen
4. Apple Developer: APNs Auth Key (.p8) erstellen → in Firebase Cloud Messaging hochladen
5. Service Account JSON aus Firebase → 3 Secrets in Lovable Cloud einfügen
6. `npx cap sync` → `npx cap run ios/android`

---

## Offene Frage
Soll ich den Account-Bereich **vor** der Push-Integration komplett fertig machen (ca. 60% des Aufwands), oder beides parallel in einem Rutsch? Ich empfehle: Account zuerst fertigstellen, dann Push obendrauf — sonst wird ein Rollback bei Bugs schwierig.