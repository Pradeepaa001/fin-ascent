from app.services.storage.supabase_client import supabase
from fastapi import APIRouter, Query

router = APIRouter()

# 1️⃣ CREDIT SCORE
@router.get("/credit-score")
@router.get("/credit-score")
def get_credit_score(user_id: str = Query(...)):
    res = supabase.table("user_profiles") \
        .select("credit") \
        .eq("user_id", user_id) \
        .execute()

    if not res.data:
        return {"credit_score": 0}

    return {
        "credit_score": res.data[0].get("credit", 0)
    }

# 2️⃣ TOTAL PAYABLES
@router.get("/payables/summary")
def get_payables(user_id: str = Query(...)):
    res = supabase.table("obligations") \
        .select("amount") \
        .eq("type", "PAYABLE") \
        .eq("user_id", user_id) \
        .execute()

    total = sum([r["amount"] for r in res.data])

    return {
        "total_payables": len(res.data),
        "total_amount": float(total)
    }

# 3️⃣ TOTAL RECEIVABLES
@router.get("/receivables/summary")
def get_receivables(user_id: str = Query(...)):
    res = supabase.table("obligations") \
        .select("amount") \
        .eq("type", "RECEIVABLE") \
        .eq("user_id", user_id) \
        .execute()

    total = sum([r["amount"] for r in res.data])

    return {
        "total_receivables": len(res.data),
        "total_amount": float(total)
    }

# 4️⃣ CURRENT BALANCE
@router.get("/balance")
def get_balance(user_id: str = Query(...)):
    res = supabase.table("user_profiles") \
        .select("current_balance") \
        .eq("user_id", user_id) \
        .execute()

    if not res.data:
        return {"balance": 0}

    return {
        "balance": float(res.data[0]["current_balance"])
    }

# 5️⃣ GANTT DATA (PAYABLES)
@router.get("/payables/timeline")
def timeline(user_id: str = Query(...)):
    res = supabase.table("obligations") \
        .select("entity_name, amount, due_date, priority_score") \
        .eq("type", "PAYABLE") \
        .eq("user_id", user_id) \
        .execute()

    return [
        {
            "entity": r["entity_name"],
            "amount": float(r["amount"]),
            "due_date": r["due_date"],
            "priority": r["priority_score"],
            "color": "red" if r["priority_score"] > 70 else "green"
        }
        for r in res.data
    ]

# 6️⃣ TOP 10 DUE RECORDS
@router.get("/payables/top10")
def top10(user_id: str = Query(...)):
    res = supabase.table("obligations") \
        .select("due_date, entity_name, amount") \
        .eq("user_id", user_id) \
        .order("due_date") \
        .limit(10) \
        .execute()

    return [
        {
            "due_date": r["due_date"],
            "company": r["entity_name"],
            "amount": float(r["amount"])
        }
        for r in res.data
    ]