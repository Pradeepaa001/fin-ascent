import os
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
router = APIRouter()

supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_ANON_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-2.5-flash')

class ChatRequest(BaseModel):
    user_id: str
    message: str
    apply_personalization: bool = True

@router.post("/query")
async def handle_chat_query(req: ChatRequest):
    try:
        # Fetch user data strictly
        profile_res = supabase.table("user_profiles").select("*").eq("user_id", req.user_id).execute()
        profile = profile_res.data[0] if profile_res.data else {}
        
        balance = profile.get("current_liquidity", 15000.00) # Fallback to 15k
        
        if req.apply_personalization:
            penalty_w = float(profile.get("penalty_weight", 1.0))
            relationship_w = float(profile.get("relationship_weight", 1.0))
            flexibility_w = float(profile.get("flexibility_weight", 1.0))
            priority_entities = profile.get("priority_entities", [])
        else:
            penalty_w = 1.0
            relationship_w = 1.0
            flexibility_w = 1.0
            priority_entities = []

        # Fetch obligations
        obligations_res = supabase.table("obligations").select("*").limit(30).execute()
        obligations = obligations_res.data

        scored_obligations = []
        total_payable = 0
        
        for ob in obligations:
            if ob["type"] == "PAYABLE":
                total_payable += ob.get("amount", 0)
                
            urgency = 10 if ob["status"] == "OVERDUE" else 5
            penalty_rate = float(ob.get("penalty_rate", 0.0))
            priority_score = float(ob.get("priority_score", 50))
            
            is_priority = any(ent.lower() in ob["entity_name"].lower() for ent in priority_entities) if priority_entities else False
            rel_score = priority_score + (50 if is_priority else 0)
            
            flex_factor = 1.0 / (flexibility_w if flexibility_w > 0 else 1.0)
            score = (urgency * flex_factor) + (penalty_w * penalty_rate * 100) + (relationship_w * rel_score)
            
            scored_obligations.append({
                "entity_name": ob["entity_name"],
                "type": ob["type"],
                "amount": ob["amount"],
                "penalty_rate": penalty_rate,
                "status": ob["status"],
                "computed_score": round(score, 2),
                "is_priority_match": is_priority
            })

        # Sort top 8 obligations deterministically
        scored_obligations.sort(key=lambda x: x["computed_score"], reverse=True)
        top_obligations = scored_obligations[:8]

        # Context JSON built natively (NO LLM MATH)
        context_data = {
            "user_balance": balance,
            "total_upcoming_payables": total_payable,
            "is_personalization_active": req.apply_personalization,
            "applied_weights": {
                "penalty": penalty_w,
                "relationship": relationship_w,
                "flexibility": flexibility_w
            },
            "top_prioritized_obligations_sorted": top_obligations
        }

        prompt = f"""
        You are a Context-Aware Financial Decision Assistant.
        Answer the user's financial query using ONLY the provided deterministic data context below.
        DO NOT calculate new priorities. Rely entirely on the "computed_score" to determine what is most important (higher score means they MUST pay it first).
        Explain the reasoning clearly to the user using the actual values. Do not give generic advice. Keep your response conversational, concise, and professional.
        
        === SYSTEM CONTEXT (DATA YOU MUST EXPLAIN FROM) ===
        {json.dumps(context_data, indent=2)}
        ====================================================
        
        User Query: "{req.message}"
        """
        
        response = model.generate_content(prompt)
        reply = response.text
        
        return {
            "reply": reply,
            "data_used": context_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
