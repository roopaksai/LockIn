# LockIn — Google Play Store Listing Copy

## App title
LockIn — Countdown Wallpaper  (30 char limit; alt: "LockIn: Goal Countdown")

## Short description (80 chars max)
Turn your lock screen into a live countdown and progress tracker. Stay locked in.

## Full description (4000 chars max)

Your goal. On every unlock.

Most goals fail because you stop seeing them. LockIn puts your countdown directly on your lock screen as a beautiful dot grid — every time you check your phone, your progress checks you.

■ HOW IT WORKS
Pick a challenge — the full year, or a custom run of days (30, 90, 180, JEE, boards, gym cut... whatever you're chasing). LockIn renders every single day as a dot on a live wallpaper. Days you complete glow brighter. The rest stay dim, waiting for you.

■ FEATURES

• LIVE COUNTDOWN WALLPAPER — A native Android live wallpaper showing every day of your challenge as one dot. Today's dot pulses.

• PROGRESS MODE — Turn on daily tasks and each day's dot reflects how much of your checklist you finished. GitHub-style contribution graph, but for your life.

• HOME SCREEN WIDGET — Pin the matching countdown widget next to your wallpaper. Progress everywhere, zero effort.

• FULL YEAR MODE — Leap-year aware year progress: days elapsed vs. days left.

• CUSTOM CHALLENGES — Any duration from 2 to 365+ days. Start new runs anytime or keep editing your current streak.

• MAKE IT YOURS — AMOLED black, charcoal, deep navy backgrounds. Orange, cyan, lime, pink, purple accents. Tune completed-day and remaining-day tones so it matches your setup.

• DAILY REMINDER — One gentle notification at the hour you choose. No spam, ever.

• BATTERY FRIENDLY — Rendered by an optimized native engine with cached drawing. Safe-zone calibrated across Pixel, Samsung One UI, Xiaomi HyperOS, and OnePlus OxygenOS so nothing collides with your clock or fingerprint icon.

• NO ACCOUNT. NO ADS. NO TRACKING. — Everything is stored on your device. Install, set your goal, done.

■ WHO IT'S FOR
Students grinding for JEE, NEET, boards, or semesters. Gym-goers on a cut or bulk. Anyone building a habit, breaking one, or counting down to anything that matters.

Your phone is already in your hand dozens of times a day.
Make every unlock count.

Download LockIn and start your first countdown today.

---

## Screenshots (upload these files directly — no URLs needed)
Play Console → Store listing → Phone screenshots → upload:
1. D:\projects\Lockin-app-website\assets\1.jpg     (1080x2400)
2. D:\projects\Lockin-app-website\assets\v1.jpg    (1080x2400)
3. D:\projects\Lockin-app-website\assets\2.jpg     (1080x2400)
4. D:\projects\Lockin-app-website\assets\v2.jpg    (1080x2400)
Optional extras: settings.jpg, widget.jpg

## Feature graphic (1024x500) — MISSING, needs creating

---

# Data safety form — recommended answers

Console path: App content → Data safety

Q: Does your app collect or share any required user data types? → **Yes**
(collects only because of optional feedback form)

Declare these two types (both: Collected = Yes, Shared = No, Ephemeral = No,
Required = Optional, Purpose = "App functionality / developer communication"):
1. Photos & videos → NO — skip. Use instead:
   - Category "App activity" → type **"Other user-generated content"** (the feedback message)
   - Category "Personal info" → type **"Email address"** (optional contact field)

For both types set:
- Collected: Yes | Shared: No | Processed ephemerally: No | Required/Optional: Optional
- Purposes: App functionality (feedback handling)
- Deletable: Yes (on request via contact email)

Q: Is all user data encrypted in transit? → **Yes** (webhook is HTTPS)
Q: Do you provide a way to request data deletion? → **Yes** (contact email)

Alternative shortcut: answer "No data collected/shared" ONLY if you also remove
the feedback form before release. With the form present, declare as above —
Google cross-checks this against the app.

---

# Permission declarations — FINAL AUDIT RESULT

Good news: LockIn's merged release manifest contains NO sensitive permissions.
Nothing to declare under location / phone / camera / microphone sections.

Actual permissions in build:
- INTERNET            — normal, no declaration needed
- POST_NOTIFICATIONS  — runtime prompt only; answer "Notifications: core functionality"
- VIBRATE             — normal, no declaration needed
- RECEIVE_BOOT_COMPLETED, WAKE_LOCK, ACCESS_NETWORK_STATE + vendor badge perms
  — auto-merged by expo-notifications/Firebase internals; benign, no declarations

Video demonstration requirement: NOT applicable (no background location).

Play Console "App access": app has no login — select
"All functionality is available without special access".
