# 📈 LearnStocks — AI-Powered Gamified Stock Market Learning Platform

LearnStocks is an AI-powered and gamified stock market learning platform designed for Indian retail investors and students. It combines real-time NSE market simulations with educational tools such as paper trading, AI-driven stock analysis, quizzes, portfolio intelligence, and investment advisory assistance.

---

## 🚀 Key Highlights

- 📊 Real-time virtual stock trading simulator
- 🤖 AI-powered investment advisor chatbot
- 📈 Stock price forecasting using LSTM
- 📰 News sentiment analysis using NLP
- 🎮 Gamified learning through quizzes and prediction challenges
- 📉 Portfolio analytics and risk analysis dashboard
- 🔄 Real-time synchronization using Supabase

---

# 🏗️ System Architecture

```text
                  +----------------------------------------------+
                  |               React Web App                  |
                  |         (Vite Frontend - Port 8080)          |
                  +-------+---------------+--------------+-------+
                          |               |              |
           Proxy /py-api  |               |              | Proxy /advisor-api
                          v               v              v

+---------------------------+    +----------------+    +---------------------------+
|      Python FastAPI       |    |    Supabase    |    |       AI Chatbot          |
|    (Backend - Port 8000)  |    | (Backend/DB)   |    |    (Next.js - Port 3000)  |
+-------------+-------------+    +-------+--------+    +-------------+-------------+
              |                          |                           |
              | yFinance &               | Auth, Realtime           | Groq API
              | NewsAPI                  | Database Services        | (Llama Models)
              v                          v                           v

        [External APIs]          [PostgreSQL Database]      [Generative AI Layer]
```

---

## 🔄 Live Market Data Flow

```text
Frontend Component (Polling Every 5 Seconds)
        ↓
Supabase Edge Function (get-stock-data)
        ↓
Yahoo Finance API
        ↓
Returns Current + Historical Data
        ↓
Updates Zustand Store
        ↓
Re-renders Charts & Portfolio Data
```

---

# 📦 Project Structure

| Module | Directory | Technology Stack | Purpose |
|-------|-------|-------|-------|
| Frontend UI | `/src` | React, Vite, TypeScript, Zustand, Tailwind | Main web application |
| AI Chatbot | `/investment-advisor-chatbot` | Next.js, Groq SDK, Tailwind | Investment advisory chatbot |
| Python Backend | `/python-api` | FastAPI, Pandas, NumPy, Scikit-Learn | Prediction & analytics APIs |
| Database Layer | `/supabase` | Supabase, PostgreSQL, Edge Functions | Authentication & realtime sync |
| Analytics Dashboard | `/python-api/psg_analyzer.py` | Streamlit, Plotly | Portfolio analytics |

---

# ✨ Features

## 1. Portfolio Dashboard

- Portfolio overview with profit/loss tracking
- Holdings visualization
- Performance charts
- Realtime updates using Supabase subscriptions
- Multi-view portfolio analysis

---

## 2. Gamification Layer

### 📚 Stock Market Quiz
- Adaptive quizzes
- Multiple difficulty levels
- Reward points system

### 💰 Paper Trading Simulator
- Mock trading environment
- NSE market hour validation
- Real-time stock pricing

### 🎯 Market Challenges
- Daily stock prediction contests
- Rewards & penalties system

### 📈 Knowledge Tracking
- User learning analytics
- Performance history graphs

---

## 3. AI-Based Prediction Engine

### LSTM Price Forecasting

- Dynamic stock prediction models
- Historical trend learning
- Daily closing price forecasts

### Sentiment Analysis

- News headline extraction
- VADER sentiment scoring
- Positive/Neutral/Negative insights

---

## 4. Portfolio Intelligence System

### PSG (Portfolio Suitability Guide)

Evaluates:

- Risk tolerance
- Investment goals
- Age profile
- Experience level

### Portfolio Analyzer

Provides:

- Diversification analysis
- Concentration risk (HHI)
- Portfolio Health Score
- Buy / Hold / Reduce recommendations

---

# 🛠️ Installation Guide

## Prerequisites

- Node.js v18+
- Python 3.10+
- Supabase CLI (Optional)

---

## Step 1: Clone Repository

```bash
git clone https://github.com/tirthgandhitg23/LearnStocks.git

cd LearnStocks
```

---

## Step 2: Configure Environment Variables

Create `.env`

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SUPABASE_PROJECT_ID=
VITE_CHAT_URL=http://localhost:3000
VITE_ADVISOR_URL=http://localhost:3000

GROQ_API_KEY=
MODEL=llama3-8b-8192
```

---

## Step 3: Run FastAPI Backend

```bash
cd python-api

python -m venv venv

# Windows
venv\Scripts\activate

# Linux / Mac
source venv/bin/activate

pip install -r requirements.txt

uvicorn main:app --reload --port 8000
```

Backend:

```text
http://127.0.0.1:8000/docs
```

---

## Step 4: Run Frontend

```bash
npm install

npm run dev
```

Frontend:

```text
http://localhost:8080
```

---

## Step 5: Run AI Chatbot

```bash
cd investment-advisor-chatbot

npm install

npm run dev
```

Chatbot:

```text
http://localhost:3000
```

---

## Step 6: Run Portfolio Analyzer

```bash
cd python-api

streamlit run psg_analyzer.py
```

---

# 🗄️ Database Schema Overview

| Table | Purpose |
|------|------|
| profiles | User details & onboarding |
| holdings | Portfolio holdings |
| transactions | Trading logs |
| sectors | Sector classifications |
| user_sectors | User preferences |
| user_game_activity | Gamification tracking |
| user_knowledge_progress | Learning analytics |

---

# 🔐 Security Features

- Trading hour validation
- API key protection
- No direct financial advice
- Backend-only AI API access
- Secure authentication via Supabase

---

# 🧠 Technology Stack

### Frontend
- React
- TypeScript
- Tailwind CSS
- Zustand

### Backend
- FastAPI
- Python
- Scikit-Learn
- Pandas

### AI / ML
- LSTM
- VADER NLP
- Groq API
- Llama Models

### Database & Cloud
- Supabase
- PostgreSQL
- Edge Functions

---
