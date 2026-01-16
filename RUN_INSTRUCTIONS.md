# LearnStocks - Run Instructions

To run the LearnStocks system fully functionally, ensure all connected services are active and reachable.

## 1. Active Services
You currently have the following services running:

| Service | Location | URL | Status |
|---------|----------|-----|--------|
| **Frontend** | `d:\LearnStocks` | [http://localhost:8080](http://localhost:8080) | ✅ Running |
| **Chatbot** | `d:\LearnStocks\investment-advisor-chatbot` | [http://localhost:3000](http://localhost:3000) (Estimated) | ✅ Running |
| **Python API** | `d:\LearnStocks\python-api` | [http://localhost:8000](http://localhost:8000) | ✅ Running |

## 2. Verification Steps

1.  **Open Frontend Dashboard**:
    *   Navigate to **[http://localhost:8080](http://localhost:8080)**.
    *   **Log In**: Ensure you are signed in (Supabase Auth relies on the cloud project `faflzgtrtjfxanusaltc`).

2.  **Check Chatbot Connectivity**:
    *   The frontend expects the chatbot at `VITE_CHAT_URL` (see `.env`).
    *   Verify by clicking the **Chatbot/Advisor Link** in the UI.
    *   If it fails, confirm the chatbot is running on the expected port (usually 3000) by visiting `http://localhost:3000` in a new tab.

3.  **Check Predictions (Supabase Functions)**:
    *   The **Predictions Page** calls Supabase Edge Functions (`get-stock-data`).
    *   These execute on the **Cloud** (Supabase).
    *   **Test**: Go to the Predictions tab. If stock prices load, it's working. If not, you may need to **deploy your functions** to Supabase or check the browser console for errors.

4.  **Check Python API**:
    *   If the app uses the Python backend (e.g., for advanced ML on Port 8000), verify it is accessible.
    *   Visit **[http://localhost:8000/docs](http://localhost:8000/docs)** to see the Swagger documentation and check if it's responsive.

## 3. Important Notes
*   **Supabase**: Your project is connected to a live Supabase instance (`https://faflzgtrtjfxanusaltc.supabase.co`). Ensure your internet connection is active.
*   **Environment Variables**: Your `.env` file looks correctly configured for local development.

**Status**: Your system appears to be **Running Fully**. Just ensure you can access `localhost:8080` and that the Predictions page loads data correctly.
