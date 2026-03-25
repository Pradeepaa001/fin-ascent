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

model_json = genai.GenerativeModel('gemini-1.5-flash', generation_config={"response_mime_type": "application/json"})
model_text = genai.GenerativeModel('gemini-1.5-flash')

class ChatRequest(BaseModel):
    user_id: str
    message: str

@router.post("/query")
async def handle_chat_query(req: ChatRequest):
    try:
        # STEP 1: Detect Implicit Personalization
        extract_prompt = f"""
        Analyze the user's incoming chat message: "{req.message}"
        Does the user express NEW preferences, constraints, or priorities regarding their financial decisions? 
        (e.g., "I want to prioritize bank loans strongly", "I absolutely hate penalties", "I am very flexible on timelines", "Don't care about late fees").

        If YES, extract the explicit preferences into numeric weights (usually 0.0 to 2.0, where 1.0 is neutral).
        - penalty_weight (float: >1.0 if they avoid penalties)
        - relationship_weight (float: >1.0 if they prioritize vendors/relationships)
        - flexibility_weight (float: >1.0 if very flexible with timelines, <1.0 if strict)
        - priority_entities (list of strings: specific company or entity names they mentioned prioritizing)

        Return a strictly formatted JSON object:
        {{
          "has_new_preferences": boolean,
          "weights": {{
            "penalty_weight": float,
            "relationship_weight": float,
            "flexibility_weight": float,
            "priority_entities": ["str"]
          }}
        }}
        """
        
        extraction_res = model_json.generate_content(extract_prompt)
        ext_data = json.loads(extraction_res.text)

        # If they gave new preferences, update DB first
        if ext_data.get("has_new_preferences") and "weights" in ext_data:
            w = ext_data["weights"]
            update_payload = {
                "penalty_weight": w.get("penalty_weight", 1.0),
                "relationship_weight": w.get("relationship_weight", 1.0),
                "flexibility_weight": w.get("flexibility_weight", 1.0),
                "priority_entities": w.get("priority_entities", [])
            }
            chk = supabase.table("user_profiles").select("id").eq("user_id", req.user_id).execute()
            if len(chk.data) > 0:
                supabase.table("user_profiles").update(update_payload).eq("user_id", req.user_id).execute()

        # STEP 2: Standard Deterministic Data Fetch logic
        profile_res = supabase.table("user_profiles").select("*").eq("user_id", req.user_id).execute()
        profile = profile_res.data[0] if profile_res.data else {}
        
        balance = profile.get("current_liquidity", 15000.00)
        penalty_w = float(profile.get("penalty_weight", 1.0))
        relationship_w = float(profile.get("relationship_weight", 1.0))
        priority_entities = profile.get("priority_entities")
        if not isinstance(priority_entities, list):
            priority_entities = []

        obligations_res = supabase.table("obligations").select("*").limit(30).execute()
        obligations = obligations_res.data

        scored_obligations = []
        total_payable = 0
        
        for ob in obligations:
            if ob.get("type") == "PAYABLE":
                total_payable = float(total_payable) + float(ob.get("amount", 0))
                
            urgency = 10 if ob.get("status") == "OVERDUE" else 5
            penalty_rate = float(ob.get("penalty_rate", 0.0))
            priority_score = float(ob.get("priority_score", 50))
            
            is_priority = any(ent.lower() in ob["entity_name"].lower() for ent in priority_entities) if priority_entities else False
            rel_score = priority_score + (50 if is_priority else 0)
            
            flex_factor = 1.0 / (flexibility_w if flexibility_w > 0 else 1.0)
            score = (urgency * flex_factor) + (penalty_w * penalty_rate * 100) + (relationship_w * rel_score)
            
            scored_obligations.append({
                "entity_name": str(ob.get("entity_name")),
                "type": str(ob.get("type")),
                "amount": float(ob.get("amount", 0)),
                "penalty_rate": float(penalty_rate),
                "status": str(ob.get("status")),
                "computed_score": round(float(score), 2),
                "is_priority_match": bool(is_priority)
            })

        scored_obligations.sort(key=lambda x: x["computed_score"], reverse=True)
        top_obligations = scored_obligations[:8]

        context_data = {
            "user_balance": balance,
            "total_upcoming_payables": total_payable,
            "applied_weights": {
                "penalty": penalty_w,
                "relationship": relationship_w,
                "flexibility": flexibility_w,
                "priority_entities": priority_entities
            },
            "top_prioritized_obligations_sorted": top_obligations
        }

        # STEP 3: Generate Response 
        prompt = f"""
        You are a Context-Aware Financial Decision Assistant.
        Answer the user's financial query using ONLY the provided deterministic data context below.
        DO NOT calculate new priorities. Rely entirely on the "computed_score" to determine what is most important (higher score means they MUST pay it first).
        Explain the reasoning clearly to the user using the actual values. Keep your response conversational, concise, and professional.
        If the user provided new personalization preferences in their query, quickly acknowledge that you have updated their profile settings accordingly.
        
        === SYSTEM CONTEXT (DATA YOU MUST EXPLAIN FROM) ===
        {json.dumps(context_data, indent=2)}
        ====================================================
        
        User Query: "{req.message}"
        """
        
        response = model_text.generate_content(prompt)
        reply = response.text
        
        return {
            "reply": reply,
            "data_used": context_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
