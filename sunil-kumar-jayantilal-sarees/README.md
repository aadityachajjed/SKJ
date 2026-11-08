# Sunil Kumar Jayantilal – Wholesale Saree Website & Admin Platform
### 62/2 Jawahar Gate, M.T. Cloth Market, Indore, Madhya Pradesh • Phone: 9425191176

A mobile-first, bilingual (English & Hindi) wholesale saree e-commerce website and zero-code inventory dashboard designed specifically for Sunil Kumar Jayantilal.

---

## 🌟 Key Features Implemented

### 1. Bilingual Internationalization (Hindi & English)
- Instant toggle between **हिंदी** and **English** on the header.
- All headings, product descriptions, set labels, badges, forms, and order receipts are translated.
- Remembers user's language preference across sessions (`localStorage`).

### 2. Wholesale Set Purchasing Model (PRD Strict Compliance)
- **1 Set = X Sarees**: Every saree is sold strictly as a complete set.
- **Set Calculation**:
  $$\text{Total Sarees} = \text{Sarees per Set} \times \text{Number of Sets}$$
  $$\text{Total Price} = \text{Price per Set} \times \text{Number of Sets}$$
- **Interactive Colour Swatches**: Clicking any colour swatch dynamically updates the main photograph to that specific colour with its quantity breakdown.
- **Stock Limit Protection**: Prevents retailers from ordering more sets than the current available inventory.

### 3. Shopping Cart & Wholesale Ordering
- Itemized cart drawer displaying product snapshot, sets count stepper, total sarees, price per set, and total amount.
- **Dual Order Submission Flow**:
  1. **Direct Wholesale Order Request**: Submits directly to the server database with unique order code (e.g., `SKJ-2026-1001`), marked as `Pending Confirmation`.
  2. **Automated WhatsApp Order**: Automatically formats a clean, pre-filled WhatsApp message itemizing customer name, address, set codes, set quantities, total sarees, and price, and sends it directly to `9425191176`.
- **Customer Order Tracking**: Retailers can look up their orders using their 10-digit mobile number or order reference.

### 4. Zero-Code Admin Inventory Dashboard (`/admin`)
- Secure login (`admin` / `admin123`).
- **Statistics Overview**: Total Products, Total Available Sets, Out of Stock Products, Pending Confirmation Orders, Confirmed Orders.
- **5-Step "+ ADD NEW SAREE STOCK" Wizard**:
  - **Step 1: Basic Information**: Name (EN/HI), SKU/Code, Category, Fabric, Design, Description.
  - **Step 2: Set Information**: Wholesale price per set, Sarees per set, Available sets, MOQ.
  - **Step 3: Dynamic Colour Management**: Add colours, hex swatches, quantity per colour in set, live math validation verifying colour sum equals set quantity.
  - **Step 4: Photo Uploads**: Drag-and-drop or gallery photo upload with client-side canvas compression for fast mobile uploads.
  - **Step 5: Live Preview & Publish**: Instant catalogue publishing.
- **Inventory & Order Management**:
  - Quick Stock Adjuster (+1, +5, +10, -1, -5).
  - Status management (`Pending Confirmation` $\rightarrow$ `Confirmed` $\rightarrow$ `Dispatched` $\rightarrow$ `Delivered` $\rightarrow$ `Cancelled`).
  - Automatic inventory deduction upon order confirmation, and automatic stock restoration upon cancellation.
  - 1-click **Call Customer** and **WhatsApp Customer** buttons.
  - Shop Settings editor (address, phone, WhatsApp, Google Maps URL, banner announcements).

---

## 🚀 How to Run the Website

### Step 1: Open Terminal in the Project Directory
```powershell
cd C:\Users\Dell\.gemini\antigravity\scratch\sunil-kumar-jayantilal-sarees
```

### Step 2: Start the Server
```powershell
node server.js
```
The server will start at:
```
http://localhost:3000
```

### Step 3: Access the Application
- **Customer Storefront**: [http://localhost:3000](http://localhost:3000)
- **Admin Dashboard**: [http://localhost:3000/admin](http://localhost:3000/admin)
  - **Username**: `admin`
  - **Password**: `admin123`

---

## 📁 Directory Structure
```
sunil-kumar-jayantilal-sarees/
├── data/
│   ├── db.json              # Relational JSON database
│   └── seed.js              # Initial database seeder
├── public/
│   ├── css/
│   │   └── styles.css       # Brand styling (#641E32 Maroon, #B9975B Gold, #FFF9F0 Cream)
│   ├── js/
│   │   ├── i18n.js          # Bilingual Hindi/English translation dictionary
│   │   ├── api.js           # REST API client
│   │   ├── app.js           # Customer storefront logic
│   │   └── admin.js         # Admin dashboard and 5-step wizard logic
│   ├── images/              # Curated saree set and colour visual assets
│   ├── uploads/             # Media storage for admin photo uploads
│   ├── index.html           # Customer storefront
│   └── admin.html           # Admin dashboard
├── server.js                # High-performance zero-dependency REST HTTP server
├── mock-test.js             # Data integrity test suite
├── api-direct-test.js       # End-to-end API test suite
└── README.md
```
