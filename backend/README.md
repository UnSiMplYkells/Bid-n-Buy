# Real-Time Auction Platform API

A robust, secure, and real-time backend API for an Auction Platform. This API is built using **Node.js**, **Express**, **MongoDB (Mongoose)**, and **Socket.io** for real-time bid updates, alongside **node-cron** for automated auction lifecycle management.

---

## 🚀 Tech Stack & Core Libraries

* **Runtime:** Node.js (v20+ recommended)
* **Framework:** Express.js
* **Database:** MongoDB via Mongoose
* **Real-Time Communication:** Socket.io (WebSockets)
* **Task Scheduling:** Node-Cron (automated auction closure)
* **Security & Sanitization:** 
  * `bcryptjs` (password hashing)
  * `jsonwebtoken` (JWT access & refresh tokens)
  * `helmet` (secure HTTP headers)
  * `xss-clean` (user input sanitization)
  * `express-rate-limit` (endpoint rate limiting)
  * Mongoose ACID Transactions (race-condition prevention during bid placement)

---

## 💎 Key Architectural Features

### 1. Real-Time WebSockets Engine (Socket.io)
When users view an auction, they join a specialized Socket.io room dedicated to that auction. When a new bid is successfully stored:
* The server broadcasts the new price and highest bidder to the active auction room (`auction-${auctionId}`).
* Other bidders who have been outbid are immediately notified in their personal notification rooms (`user-${userId}`) with an outbid alert.

### 2. ACID Transactions & Race-Condition Safety
To prevent double-bidding or database inconsistencies if two users bid at the exact same millisecond:
* Placing a bid uses a **MongoDB Session and Transaction**.
* It employs **optimistic concurrency control** checks (`currentPrice` validation) to guarantee that a bid is only registered if the baseline price has not changed during the database operation.

### 3. Automated Lifecycle Scheduler (Cron Job)
* An automated process runs every minute (`* * * * *`) via `node-cron` in `services/endAuction.js`.
* It automatically scans for any active auctions whose `endTime` is less than or equal to the current time and closes them safely, updating their status to `closed`.

### 4. Robust Rate-Limiting Policy
* **General Limit:** 100 requests per 15 minutes per IP.
* **Authentication Limit:** 5 registration/login attempts per 10 minutes (prevents brute-force attacks).
* **Bidding Limit:** 10 bid placements per minute (prevents automated bot spamming).

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
PORT=3000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/database-name
JWT_ACCESS_SECRET=your_access_key
JWT_REFRESH_SECRET=your_refresh_key
JWT_LIFETIME=**
```

---

## 📦 Installation & Setup

1. **Clone the repository and navigate to the project root:**
   ```bash
   cd auction-api
   ```

2. **Install all dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   * Create a `.env` file in the root folder based on the variables described above.

4. **Start the server:**
   * **For Development (with Nodemon):**
     ```bash
     npm start
     ```
   * **For Production:**
     ```bash
     node app.js
     ```

---

## 📡 API Endpoint Reference

All REST endpoints are prefixed with `/api/v1`.

### 🔐 Authentication (`/api/v1/auth`)

| Method | Endpoint | Auth Required | Description | Request Body / Params |
| :--- | :--- | :---: | :--- | :--- |
| **POST** | `/register` | No | Registers a new user. Hash password and issue JWT tokens. | `{ "email": "user@example.com", "password": "securepassword", "username": "JohnDoe", "phoneNumber": "123456789" }` |
| **POST** | `/login` | No | Log in and set `refreshToken` inside a secure, HttpOnly cookie. | `{ "email": "user@example.com", "password": "securepassword" }` |
| **POST** | `/logout` | Yes | Clears active refresh tokens and logs out user. | None (Bearer Token in Header) |
| **POST** | `/refresh` | No | Rotates refresh token and generates a new access token. | Supports token via cookie or JSON body: `{ "refreshToken": "string" }` |

---

### 👤 User Profiles (`/api/v1/user`)
*All routes below require a `Authorization: Bearer <accessToken>` header.*

| Method | Endpoint | Description | Request Body / Response Sample |
| :--- | :--- | :--- | :--- |
| **POST** | `/me` | Updates user details (username, avatar, phone). | Body: `{ "username": "NewName", "image": "URL", "phoneNumber": "987654321" }` |
| **GET** | `/me` | Retrieves the complete user profile, current active bids, and won auctions. | Response: `{ "userProfile": {}, "userCurrentBids": [], "userWins": [] }` |
| **GET** | `/me/bids` | Retrieves all active auctions the user currently has bids on. | Response: `{ "userCurrentBids": [...] }` |
| **GET** | `/me/wins` | Retrieves a list of closed auctions won by this user. | Response: `{ "userWins": [...] }` |
| **POST** | `/:id/images` | Uploads and updates the user's profile picture using Multer & Cloudinary. | Multipart Form: `{ "image": File }` |
| **DELETE** | `/:id/images` | Deletes custom profile picture from Cloudinary and reverts back to the default avatar. | None |

---

### 🔨 Auctions Management (`/api/v1/auction`)
*All routes below require a `Authorization: Bearer <accessToken>` header.*

| Method | Endpoint | Query Parameters | Description | Request Body |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/create` | None | Creates a new auction item. | `{ "name": "Item", "desc": "Desc", "askingPrice": 100, "endTime": "2026-12-31T23:59:59Z", "image": "optional_url" }` |
| **GET** | `/all` | `status` (active/closed), `name` (search text), `page`, `limit` | Lists all platform auctions (paginated). Includes the latest bid data. | None |
| **GET** | `/user/all` | `status`, `name` | Lists auctions created by the logged-in user. | None |
| **GET** | `/:id` | None | Retrieves detailed information for a single auction. | Route param: `:id` (Auction ID) |
| **PATCH** | `/:id` | None | Edits auction details (only if active & no bids placed). | `{ "name": "New Name", "desc": "New description", "image": "New URL" }` |
| **DELETE** | `/:id` | None | Deletes an auction created by the user. | Route param: `:id` |
| **POST** | `/:id/close` | None | Manually closes an auction early (creator only). | Route param: `:id` |
| **POST** | `/:id/images` | None | Uploads and updates the auction's cover image using Multer & Cloudinary. | Multipart Form: `{ "image": File }` |

---

### 💰 Bidding System (`/api/v1/bid`)
*All routes below require a `Authorization: Bearer <accessToken>` header.*

| Method | Endpoint | Description | Request Body Schema |
| :--- | :--- | :--- | :--- |
| **POST** | `/:auctionId` | Places a bid on an active auction. Increments the price inside an ACID transaction. | `{ "amount": 150 }` (Custom Amount) OR `{ "bidType": "10%" }` (Auto-increments by percentage of current price) |
| **GET** | `/history/:auctionId` | Retrieves the history of bids placed on an auction. Usernames are masked (e.g. `J*****e`) for privacy. | Route param: `:auctionId` |

---

## 🔌 Socket.io Events Reference

To establish a WebSocket connection, point your Socket.io client to the root URL (e.g. `http://localhost:3000`).

### 🔹 Client to Server (Emits)
* **`joinAuction` (Argument: `auctionId`):** Joins the real-time bid updates room for a specific auction listing.
* **`leaveAuction` (Argument: `auctionId`):** Leaves the real-time room for a specific auction listing.
* **`joinUserRoom` (Argument: `userId`):** Joins the user's personal notifications room (needed to receive "outbid" alerts).

### 🔹 Server to Client (Listens)
* **`newBid` (Payload: `{ bid: BidObject, auction: AuctionObject }`):** Fired in room `auction-${auctionId}` when a new bid is successfully placed. Use this to update the UI listing instantly.
* **`outbid` (Payload: `{ auctionId, auctionName, currentPrice, message }`):** Fired in room `user-${userId}` when another user places a higher bid on an item you previously bid on. Excellent for real-time browser/app notifications.

### Setup Checklist

#### 1. Configure MongoDB Atlas (Whitelisting)
* In your MongoDB Atlas Dashboard, navigate to **Security** -> **Network Access**.
* Add IP address `0.0.0.0/0` (Allow access from anywhere) to ensure your cloud server can establish a connection with the database.

#### 2. Configure Environment Variables
* Configure all variables listed in the **Environment Variables** section inside your hosting provider's dashboard.
* Set `NODE_ENV` to `production`.

#### 3. Start Command
* Ensure your deployment service uses `node app.js` (or `npm start` after setting your start script) instead of `nodemon app.js` to ensure process stability.

---

## 🔒 Security Auditing Notes
* **CORS Settings:** In production, restrict the CORS configuration inside `app.js` and the Socket.io initialization to point explicitly to your client domain name instead of wildcards (`*`).
* **HTTPS Cookies:** The `refreshToken` cookie is automatically configured with `secure: true` in production environments (`NODE_ENV === "production"`), ensuring tokens are never sent over unencrypted connections.
