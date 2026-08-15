# 🏛️ Tejus Auditorium — Booking & Availability Web App

A production-ready, fast, mobile-first **Auditorium Booking & Management System** for **Tejus Auditorium**.

---

## ✨ Key Features

1. **Public Availability Calendar**:
   - 12-Month Year View (3 columns × 4 rows matrix) with real-time status color coding:
     - 🔴 **Full Day Booked** (Both Morning & Evening slots)
     - 🟡 **Morning / Evening Slot Booked** (1 slot booked)
     - ⚪ **Available**
   - Click any month on the 12-Month view to expand into the **Full Month Calendar View**.
   - Zero customer or financial data exposed to unauthenticated users (secured by PostgreSQL RPC functions).

2. **Admin Management Portal**:
   - Secure login with **"Remember me on this device"** preference.
   - **Booking Creation & Editing**:
     - 12-hour AM/PM TimePicker with presets (*Morning 9 AM - 1 PM*, *Evening 3 PM - 7 PM*).
     - **Real-Time Conflict Prevention**: Validates start/end times and enforces mandatory 1-hour buffer.
     - **Indian Mobile Number Validation**: Live 10-digit validation.
     - **Custom Programme Types**: Easily add custom event types (*Dance Fest, Annual Day, etc.*).
     - Automated slot categorization (*Morning* / *Evening*).
     - Instant billing balance calculation (*Total*, *Advance*, *Pending*).
   - **Mobile Day Management Drawer**: Tap any date to view complete bookings, phone numbers with direct calling, edit, receipt, and trash actions.
   - **Customer Search**: Search bookings by Customer Name or Mobile Number.
   - **Official Customer Receipts**: Printable & downloadable PDF receipts.
   - **Soft-Delete Trash & Recovery**: Safely recover deleted bookings.
   - **Audit Activity Logs**: Track create, update, delete, print, and download actions.

---

## 🚀 One-Click Deploy to Vercel (Free Plan)

1. Push your repository to GitHub.
2. Go to [Vercel Dashboard](https://vercel.com/new).
3. Import the **`Tejus-auditorium`** repository.
4. Add the following **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://stizrhatmhniurlugusu.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0aXpyaGF0bWhuaXVybHVndXN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3NzE2OTEsImV4cCI6MjEwMjM0NzY5MX0.H9Fa65IJrG2hLO5XWWrIpHEiM-8gpyznsBi3tZl-Oqc`
5. Click **Deploy**.

---

## 🔑 Admin Credentials

- **Admin Login URL**: `/admin/login`
- **Email**: `tejusauditorium@gmail.com`
- **Password**: `tejus@2027`
- **Booking Enquiry Phone**: `9447241559`

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```
