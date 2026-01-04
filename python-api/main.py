from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import os
import numpy as np
from sklearn.preprocessing import MinMaxScaler
import traceback
import requests

app = FastAPI(title="Stock Prediction + Sentiment API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- HEALTH CHECK (CRITICAL) ----------
@app.get("/health")
def health():
    return {"status": "ok"}

# ---------- Lazy-loaded globals ----------
tf = None
SentimentIntensityAnalyzer = None
analyzer = None

NEWS_API_KEY = os.getenv("NEWS_API_KEY")

# ---------- Startup hook ----------
@app.on_event("startup")
def startup():
    global tf, analyzer, SentimentIntensityAnalyzer
    print("🔄 Starting backend...")

    import tensorflow as _tf
    tf = _tf

    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer as _SIA
    SentimentIntensityAnalyzer = _SIA
    analyzer = SentimentIntensityAnalyzer()

    print("✅ ML & Sentiment loaded")

# ---------- Request Models ----------
class PredictRequest(BaseModel):
    symbol: str
    days: int
    closePrices: list[float]

# ---------- Price Prediction ----------
@app.post("/predict")
def predict(data: PredictRequest):
    try:
        prices = np.array(data.closePrices).reshape(-1, 1)

        scaler = MinMaxScaler(feature_range=(0, 1))
        scaled_prices = scaler.fit_transform(prices)

        timesteps = 15 if data.days >= 90 else 10 if data.days >= 60 else 5

        if len(scaled_prices) <= timesteps:
            return JSONResponse(
                content={"error": f"Need >{timesteps} days data"},
                status_code=400
            )

        X, y = [], []
        for i in range(timesteps, len(scaled_prices)):
            X.append(scaled_prices[i - timesteps:i, 0])
            y.append(scaled_prices[i, 0])

        X, y = np.array(X), np.array(y)
        X = X.reshape((X.shape[0], X.shape[1], 1))

        model = tf.keras.Sequential([
            tf.keras.layers.LSTM(50, return_sequences=True, input_shape=(X.shape[1], 1)),
            tf.keras.layers.LSTM(50),
            tf.keras.layers.Dense(1)
        ])
        model.compile(optimizer="adam", loss="mse")
        model.fit(X, y, epochs=10, batch_size=1, verbose=0)

        last_seq = scaled_prices[-timesteps:].reshape(1, timesteps, 1)
        pred_scaled = model.predict(last_seq, verbose=0)
        pred_price = scaler.inverse_transform(pred_scaled)

        return {"symbol": data.symbol, "predicted_next_close": float(pred_price[0][0])}

    except Exception as e:
        return JSONResponse(
            content={"error": str(e), "trace": traceback.format_exc()},
            status_code=500
        )

# ---------- Sentiment ----------
@app.get("/sentiment/{symbol}")
def sentiment(symbol: str):
    try:
        url = f"https://newsapi.org/v2/everything?q={symbol}&language=en&apiKey={NEWS_API_KEY}"
        res = requests.get(url).json()

        if "articles" not in res:
            return {"symbol": symbol, "message": "No news found"}

        pos = neg = neu = 0

        for art in res["articles"][:10]:
            text = f"{art.get('title','')} {art.get('description','')}"
            score = analyzer.polarity_scores(text)["compound"]
            if score > 0.05: pos += 1
            elif score < -0.05: neg += 1
            else: neu += 1

        total = pos + neg + neu
        return {
            "symbol": symbol,
            "positive": pos,
            "negative": neg,
            "neutral": neu,
            "total": total
        }

    except Exception as e:
        return JSONResponse(
            content={"error": str(e), "trace": traceback.format_exc()},
            status_code=500
        )
