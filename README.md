# Ploopp

Ploopp is a geo-location based secret messaging platform that allows users to securely drop encrypted notes tied to physical world coordinates. Using a "Bubble" mechanism, messages can only be discovered and unlocked by other users who physically travel within a 1-kilometer radius of the drop location. It implements Zero-Knowledge security principles to ensure absolute privacy for the content creators.

## Key Features

- Geo-Fenced Discovery: Users can only see and interact with messages located within a strict 1-kilometer physical radius of their current GPS location.
- Zero-Knowledge Encryption: All secret messages are encrypted strictly on the client side using the Web Crypto API (AES-GCM-256) combined with PBKDF2 key derivation. The server never reads or holds the raw decryption keys.
- Real-Time Map Radar: Built on top of the `@vis.gl/react-google-maps` library, providing smooth panning, custom markers, and real-time status updates syncing seamlessly with Firebase Firestore.
- Anonymity Friendly: Allows "Guest Ninjas" to drop open public bubbles without requiring formal account registration.
- Burn After Reading / Auto-Expire: Messages are architected to vanish completely from the database after a default 24 hours, keeping the map clean and secure.

## Tech Stack

- Framework: Next.js 15+ (App Router)
- Language: TypeScript
- Frontend Styling: Tailwind CSS v4 
- State Management: Zustand 
- Maps & Geospatial: Google Maps Javascript API, Haversine formula, and Geohashing
- Backend & Authentication: Firebase (Auth, Firestore)

## Getting Started

First, install the necessary dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Architecture & Security Notes

The project relies on a split-database architecture to uphold its Zero-Knowledge integrity:
1. `drops` collection: Stores the metadata needed for map indexing (Geohash bounds, coordinates, expiration timestamps, visibility tags).
2. `drop_contents` collection: Houses the actual encrypted vault securely. The decryption UI handles fetching and decrypting via a client-side password hash verification check.

A single atomic standard is implemented ensuring that metadata and secret vaults always sync synchronously during creation or user-prompted deletion.
