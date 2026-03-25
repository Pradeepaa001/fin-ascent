import os
from fastapi import FastAPI
from dotenv import load_dotenv
from datetime import date
import time

# Plaid imports
from plaid import Configuration, ApiClient
from plaid.api import plaid_api
from plaid.model.sandbox_public_token_create_request import SandboxPublicTokenCreateRequest
from plaid.model.products import Products
from plaid.model.country_code import CountryCode
from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
from plaid.model.transactions_sync_request import TransactionsSyncRequest

# ----------------------------
# Load ENV
# ----------------------------
load_dotenv()

PLAID_CLIENT_ID = os.getenv("PLAID_CLIENT_ID")
PLAID_SECRET = os.getenv("PLAID_SECRET")
PLAID_ENV = os.getenv("PLAID_ENV", "sandbox")

# ----------------------------
# Config
# ----------------------------
host = {
    "sandbox": "https://sandbox.plaid.com",
    "development": "https://development.plaid.com",
    "production": "https://production.plaid.com"
}[PLAID_ENV]

configuration = Configuration(
    host=host,
    api_key={
        "clientId": PLAID_CLIENT_ID,
        "secret": PLAID_SECRET
    }
)

api_client = ApiClient(configuration)
plaid_client = plaid_api.PlaidApi(api_client)

# ----------------------------
# FastAPI App
# ----------------------------
app = FastAPI(title="Plaid Sandbox Bank Statement API")

# ----------------------------
# ROOT
# ----------------------------
@app.get("/")
def root():
    return {"message": "Plaid Sandbox Running"}

# ----------------------------
# GET MOCK BANK STATEMENT
# ----------------------------
@app.get("/api/plaid/statement")
def get_statement():
    try:
        # 1️⃣ Create sandbox public_token
        sandbox_request = SandboxPublicTokenCreateRequest(
            institution_id="ins_109508",
            initial_products=[Products("transactions")]
        )

        sandbox_response = plaid_client.sandbox_public_token_create(sandbox_request)
        public_token = sandbox_response["public_token"]

        # 2️⃣ Exchange → access_token
        exchange_request = ItemPublicTokenExchangeRequest(
            public_token=public_token
        )

        exchange_response = plaid_client.item_public_token_exchange(exchange_request)
        access_token = exchange_response["access_token"]

        # 3️⃣ Wait for data to be ready
        time.sleep(3)

        # 4️⃣ Use CORRECT request for sync API
        sync_request = TransactionsSyncRequest(
            access_token=access_token
        )

        sync_response = plaid_client.transactions_sync(sync_request)

        transactions = sync_response.to_dict().get("added", [])

        return {
            "status": "success",
            "count": len(transactions),
            "transactions": transactions[:10]  # limit for demo
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }