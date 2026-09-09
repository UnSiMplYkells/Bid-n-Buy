# Bid 'N Buy | Live Auction Frontend Client

A premium, ultra-modern, and highly responsive single-page web client built for the **Bid 'N Buy** Live Auction Platform.

Built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS (v4)**, and **Socket.io-Client**, this application features glassmorphism layouts, full **Dark Mode** support, fluid page-to-page route transitions, real-time bid updates, and slide-over panels.

---

## 🎨 Design System & Theme Customization

This application is styled with a gorgeous, custom **Teal and Brown** brand theme:
* **Brand Teal (`--color-brand-teal-500` to `900`):** Represents high-value bidding, action buttons, and active status widgets.
* **Brand Brown (`--color-brand-brown-500` to `900`):** Earthy backgrounds, deep borders, and cohesive typography.
* **Typography:** Overwritten globally to use Google's premium **Poppins** sans-serif font for ultimate clarity.
* **Glassmorphism:** Custom `.glass` classes leverage hardware-accelerated `backdrop-filter: blur(12px)` for premium background overlays.

All styles are configured directly inside **Tailwind v4** format in `src/app/globals.css`.

---

## 🛠️ Key Libraries & Tools Included

* **`next-themes`**: Flicker-free support for theme detection and toggling (System / Light / Dark).
* **`react-hot-toast`**: Floating non-blocking alerts styled natively to match light/dark modes (e.g., custom error nodes, loading spinners, and outbid push notices).
* **`@tanstack/react-query`**: Global asynchronous cache manager to automate paginated dashboard searching, profile syncing, and listing reloads.
* **`zustand`**: Ultra-light global client state storage that securely persists user profiles and JWT access tokens inside `localStorage`.
* **`framer-motion`**: Hardware-accelerated fluid page entrances, form shifts, and bid list update animations.
* **`socket.io-client`**: Establishes persistent WebSockets with your live Render backend for seamless bid updates.

---

## 📂 Folder Architecture

```
frontend/
├── public/                 # Static SVG icons and logos
└── src/
    ├── app/                # Next.js App Router (Layouts, Pages, Providers)
    │   ├── auction/[id]/   # Real-time listing details & bidding panel
    │   ├── create-auction/ # Listing creation forms
    │   ├── login/          # Access screens
    │   ├── my-auctions/    # Creator lists & early closures
    │   ├── profile/        # User profile, active bids, and won tabs
    │   ├── register/       # Create account forms
    │   ├── globals.css     # Tailwind v4 theme variables
    │   ├── layout.tsx      # Poppins Font & Providers wrapping
    │   └── Providers.tsx   # React Query, Themes, and Toasters
    ├── components/         # Global shared wrappers (Header navbar)
    ├── hooks/              # Custom React hooks (useSocket)
    ├── store/              # Zustand global client state stores
    └── utils/              # Axios HTTP client with interceptor bindings
```

---

## 🚀 Getting Started (Local Development)

### 1. Install Dependencies
Run this command inside the `frontend` directory to install all packages:
```bash
npm install
```

### 2. Configure Local Environment
Ensure your Axios client is pointing to the live Render backend inside `src/utils/axios.ts` or configure an environment variable fallback:
```typescript
const API_BASE_URL = "https://bid-n-buy.onrender.com";
```

### 3. Run Development Server
Start the local server with hot reloading enabled:
```bash
npm run dev
```
Open your browser and navigate to:
```
http://localhost:3000
```

---

## 🔌 WebSocket (Socket.io) Hook Integration

The application maintains a highly optimized custom hook inside `src/hooks/useSocket.ts`:
* It establishes a connection once and registers the user inside their personal notification room (`user-${userId}`).
* When viewing an individual listing, it automatically joins room `auction-${auctionId}`.
* It listens for `"outbid"` events globally. If another user outbids you on any listing, a customized **Outbid Slide-over Toast Alert** pops up in real-time, encouraging you to re-bid and stay in the lead!
* Inside `/auction/[id]/page.tsx`, it listens for `"newBid"` events to automatically invalidate React Query caches, instantly updating price widgets and bid history feeds across the screen for all viewers simultaneously.

---

## 📸 Image Upload & Profile Picture Suite

Rather than manual image URL pasting, the client fully handles native file uploads integrated with Cloudinary:

### 1. Create Auction Upload
When publishing a new listing:
- Users select an image file locally.
- An instant cover preview is generated.
- When published, the listing details are posted to `/api/v1/auction/create`, immediately followed by a multi-part `FormData` image upload to `/api/v1/auction/${auctionId}/images`.

### 2. Interactive Profile Avatar Management
On the `/profile` page, users can:
- **Change Photo:** Hover over their avatar and select a local file to upload directly using multipart form-data.
- **Remove Photo:** Easily revert their custom image to the system's default avatar (automatically deletes old resources from Cloudinary).
- **Zustand Synchronization:** All updates immediately update the global store (`useAuthStore`) to ensure state is in sync across all components instantly.
