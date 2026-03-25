import random
import json
import os
from faker import Faker
from datetime import datetime, timedelta
from supabase import create_client, Client
from dotenv import load_dotenv, find_dotenv

dotenv_path = find_dotenv('.env.local') or find_dotenv('.env')
if not dotenv_path and os.path.exists('.env.local'):
    dotenv_path = '.env.local'
load_dotenv(dotenv_path)

url: str | None = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key: str | None = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not url or not key:
    raise ValueError("Missing Supabase credentials. Make sure you have created .env.local based on .env.example!")

supabase: Client = create_client(url, key)
fake = Faker()

def populate_finance_data():
    print("Connected to Supabase via HTTP REST. Initializing extra data...")

    # Create multiple Accounts
    accounts_data = [
        {"name": "AlphaTech Solutions", "current_balance": 15400.50},
        {"name": "Beta Corp", "current_balance": -2500.00},
        {"name": "Gamma Logistics", "current_balance": 85000.75}
    ]
    accounts_res = supabase.table("accounts").insert(accounts_data).execute()
    account_ids = [acc['id'] for acc in accounts_res.data]

    inserted_obligations = []

    # Generate 150 Smart Rows across accounts
    for i in range(150):
        acc_id = random.choice(account_ids)
        is_payable = random.choice([True, False])
        entity_name = fake.company() if is_payable else fake.name()
        
        is_hard = random.random() < 0.15 
        if is_hard and is_payable:
            entity_name = random.choice(["WeWork Office", "AWS Cloud", "Internal Payroll"])
        
        due_date = (datetime.now() + timedelta(days=random.randint(-10, 30))).date().isoformat()
        penalty = random.choice([0.0, 0.02, 0.05]) if is_payable else 0.0
        
        raw_ocr = {
            "extracted_by": "Gemini-1.5-Flash",
            "confidence": round(float(random.uniform(0.8, 0.99)), 2),
            "notes": random.choice(["Handwritten: Urgent", "Standard Net-30", "Early bird 2% disc.", "Delayed"]),
            "detected_vendor_address": fake.address().replace("\n", ", ")
        }
        
        obl_res = supabase.table("obligations").insert({
            "account_id": acc_id,
            "entity_name": entity_name,
            "type": 'PAYABLE' if is_payable else 'RECEIVABLE',
            "amount": float(round(random.uniform(150, 6500), 2)),
            "due_date": due_date,
            "is_hard_constraint": is_hard,
            "penalty_rate": float(penalty),
            "priority_score": random.randint(10, 100),
            "status": 'PENDING',
            "raw_ocr_data": raw_ocr
        }).execute()
        
        inserted_obligations.append(obl_res.data[0]['id'])

    # Generate Logs (Explainability)
    logs_data = []
    for obl_id in random.sample(inserted_obligations, 30):
        decision = random.choice(["DELAY", "PAY", "NEGOTIATE"])
        logs_data.append({
            "obligation_id": obl_id,
            "decision_reasoning": f"AI Engine opted to {decision} based on current cash flow runway and priority scoring.",
            "market_scenario": random.choice(["Bull market", "High inflation", "Standard season"]),
            "action_taken": f"Drafted email to vendor regarding {decision.lower()} action."
        })
    
    # Insert logs in chunks
    chunk_size = 10
    for i in range(0, len(logs_data), chunk_size):
        supabase.table("logs").insert(logs_data[i:i+chunk_size]).execute()

    print(f"DONE: Created {len(account_ids)} accounts, 150 obligations, and 30 AI reasoning logs.")

if __name__ == "__main__":
    populate_finance_data()