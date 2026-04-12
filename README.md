# OyeRide Driver Web App

A web-based driver portal for OyeRide, built with React + TypeScript + Vite.
Mirrors the UX patterns of the passenger web app while replicating the full driver workflow from the React Native mobile app.

## Stack
- React 18 + TypeScript
- Vite
- React Router v6
- Framer Motion (bottom sheets with drag + spring animations)
- Firebase (Firestore + Auth)

## Architecture

```
src/
├── components/
│   ├── Icons.tsx              # Shared SVG icon library
│   ├── DriverBottomNav.tsx    # 4-tab bottom nav (Home, Earnings, Rides, Profile)
│   ├── DriverSidebar.tsx      # Slide-in drawer with driver info + menu
│   ├── DriverHomeSheet.tsx    # Online toggle + earnings summary + recent trips
│   ├── IncomingRideSheet.tsx  # Animated sheet: 30s countdown, accept/decline
│   ├── ActiveRideSheet.tsx    # Accepted → Arrived → In Progress states
│   └── RideCompletedSheet.tsx # Post-trip summary + fare earned
├── pages/
│   ├── DriverLoginPage.tsx    # Email/password login
│   ├── DriverHomePage.tsx     # Main orchestration page (all ride states)
│   ├── EarningsPage.tsx       # Earnings breakdown by day/week/month
│   ├── DriverHistoryPage.tsx  # Trip history with status filter
│   └── DriverProfilePage.tsx  # Driver profile + vehicle info + settings links
├── services/
│   └── firestoreService.ts    # Firestore CRUD: driver profile, rides, trips
├── contexts/
│   └── AuthContext.tsx        # Firebase auth context
├── lib/
│   └── firebase.ts            # Firebase init
├── types/
│   └── index.ts               # TypeScript types
└── styles/
    └── globals.css            # CSS vars + animations
```

## Driver Ride State Machine

```
offline → online → request_received → accepted → arrived → in_progress → completed
                ↑___________________________|
                       (decline/cancel)
```

## Key Features Mirrored from Mobile App

| Mobile (React Native)            | Web                              |
|----------------------------------|----------------------------------|
| `DriverHomeSheet` (gorhom)       | `DriverHomeSheet` (framer-motion)|
| `IncomingRideBottomSheet`        | `IncomingRideSheet`              |
| `DriverUnifiedRideSheet`         | `ActiveRideSheet`                |
| `DriverRideCompleted`            | `RideCompletedSheet`             |
| `DriverSidebar`                  | `DriverSidebar`                  |
| Firestore ride listener          | Same query in firestoreService   |
| 30s countdown timer              | SVG ring countdown               |
| MotorMode toggle                 | Mode badge in top bar            |
| `DriverBottomTabBar`             | `DriverBottomNav`                |

## Setup

```bash
cp .env.example .env
# Fill in your Firebase config in .env

npm install
npm run dev
```

## Firebase Requirements
The driver documents must exist in `drivers/{uid}` collection with:
- `isOnline: boolean`
- `vehicle.vehicleType: 'motor' | 'delivery' | 'bicycle_delivery'`
- `rating: number`
- `totalTrips: number`

Rides are read from the `rides` collection with status = 'requesting'.
