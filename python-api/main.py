# Required packages:
# pip install fastapi uvicorn numpy scikit-learn tensorflow requests nltk vaderSentiment python-multipart

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import numpy as np
from sklearn.preprocessing import MinMaxScaler
import tensorflow as tf
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import requests
import traceback
import nltk

# Download sentiment lexicon if not already present
nltk.download('vader_lexicon', quiet=True)

app = FastAPI(title="Stock Prediction + Sentiment API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Sentiment Analyzer Setup ----------
NEWS_API_KEY = "a7703adbe1f341009591213d204153e5"  # your NewsAPI key
analyzer = SentimentIntensityAnalyzer()


# ---------- Price Prediction Endpoint ----------
class PredictRequest(BaseModel):
    symbol: str
    days: int
    closePrices: list[float]


@app.post("/predict")
def predict(data: PredictRequest):
    try:
        prices = np.array(data.closePrices).reshape(-1, 1)

        scaler = MinMaxScaler(feature_range=(0, 1))
        scaled_prices = scaler.fit_transform(prices)

        if data.days >= 90:
            timesteps = 15
        elif data.days >= 60:
            timesteps = 10
        else:
            timesteps = 5

        if len(scaled_prices) <= timesteps:
            return JSONResponse(
                content={"error": f"Not enough data. Need >{timesteps} days, got {len(scaled_prices)}."},
                status_code=400
            )

        X, y = [], []
        for i in range(timesteps, len(scaled_prices)):
            X.append(scaled_prices[i - timesteps:i, 0])
            y.append(scaled_prices[i, 0])
        X, y = np.array(X), np.array(y)
        X = np.reshape(X, (X.shape[0], X.shape[1], 1))

        model = tf.keras.Sequential([
            tf.keras.layers.LSTM(50, return_sequences=True, input_shape=(X.shape[1], 1)),
            tf.keras.layers.LSTM(50, return_sequences=False),
            tf.keras.layers.Dense(25),
            tf.keras.layers.Dense(1)
        ])
        model.compile(optimizer='adam', loss='mean_squared_error')
        model.fit(X, y, epochs=20, batch_size=1, verbose=0)

        last_sequence = scaled_prices[-timesteps:].reshape(1, timesteps, 1)
        predicted_scaled_price = model.predict(last_sequence, verbose=0)
        predicted_price = scaler.inverse_transform(predicted_scaled_price)

        return JSONResponse(
            content={"symbol": data.symbol, "predicted_next_close": float(predicted_price[0][0])}
        )

    except Exception as e:
        return JSONResponse(
            content={"error": str(e), "trace": traceback.format_exc()},
            status_code=500
        )


# ---------- Sentiment Analysis Endpoint ----------
@app.get("/sentiment/{symbol}")
def get_stock_sentiment(symbol: str):
    try:
        url = f"https://newsapi.org/v2/everything?q={symbol}&language=en&sortBy=publishedAt&apiKey={NEWS_API_KEY}"
        response = requests.get(url)
        data = response.json()

        if "articles" not in data or len(data["articles"]) == 0:
            return JSONResponse(
                content={"symbol": symbol, "message": "No recent news found."},
                status_code=404
            )

        articles = data["articles"][:10]
        results = []
        positive = negative = neutral = 0

        for art in articles:
            text = f"{art.get('title', '')}. {art.get('description', '')}"
            score = analyzer.polarity_scores(text)

            sentiment = (
                "Positive" if score["compound"] > 0.05
                else "Negative" if score["compound"] < -0.05
                else "Neutral"
            )

            if sentiment == "Positive": positive += 1
            elif sentiment == "Negative": negative += 1
            else: neutral += 1

            results.append({
                "title": art.get("title"),
                "description": art.get("description"),
                "sentiment": sentiment,
                "score": score["compound"],
                "url": art.get("url")
            })

        total = positive + negative + neutral
        summary = {
            "symbol": symbol.upper(),
            "total_articles": total,
            "positive": positive,
            "negative": negative,
            "neutral": neutral,
            "positive_percent": round((positive / total) * 100, 2),
            "negative_percent": round((negative / total) * 100, 2),
            "neutral_percent": round((neutral / total) * 100, 2)
        }

        return JSONResponse(content={"summary": summary, "articles": results})

    except Exception as e:
        return JSONResponse(
            content={"error": str(e), "trace": traceback.format_exc()},
            status_code=500
        )


# ---------- Run the App ----------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
