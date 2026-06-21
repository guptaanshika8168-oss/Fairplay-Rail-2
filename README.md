# 🚂 RailGuard IRCTC — Tatkal Booking with AI Bot Detection

A modern IRCTC-style railway ticket booking website with **AI-powered bot detection** to ensure fair access for all passengers during Tatkal bookings.

![RailGuard IRCTC](https://img.shields.io/badge/RailGuard-IRCTC-blue?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-20.x-green?style=for-the-badge)
![Express](https://img.shields.io/badge/Express-4.x-grey?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

---

## 🎯 Features

### Core Features
- ✅ **5-Step Booking Flow**: Home → Train Selection → Passenger Info → Payment → Confirmation
- ✅ **Real-time Train Availability**: View available seats across SL, 3A, 2A, 1A classes
- ✅ **Tatkal Booking Support**: Special interface for Tatkal ticket bookings
- ✅ **Mock PNR Generation**: Auto-generated PNR and transaction IDs
- ✅ **Fare Calculation**: Automatic fare breakup with GST and reservation charges

### 🔒 AI Bot Detection (RailGuard)
- 🛡️ **Behavioral Analysis**: Detects automated bots through user behavior
- 🎯 **Multiple Detection Signals**:
  - Honeypot field detection (bots auto-fill hidden fields)
  - Scroll speed analysis (bots scroll too fast)
  - Keystroke pattern analysis (bots paste or use programmatic input)
  - Mouse movement variance (bots move linearly)
  - Hover behavior anomaly (bots don't hover naturally)
- ⚠️ **3-Level Response**:
  - **Human** (Score 0-39): Full access
  - **Challenged** (Score 40-69): CAPTCHA verification required
  - **Blocked** (Score 70-100): Access denied

### 📊 Admin Dashboard
- Real-time session monitoring
- Bot score distribution histogram
- User IP tracking (masked for privacy)
- Session statistics (Human/Challenged/Blocked)
- Clear old sessions functionality

---

## 🏗️ Project Structure
