import os
from fastapi import APIRouter
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_ANON_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

@router.get("/{user_id}")
async def get_decisions(user_id: str):
    profile_res = supabase.table("user_profiles").select("*").eq("user_id", user_id).execute()
    
    if not profile_res.data:
        penalty_w = 1.0
        relationship_w = 1.0
        flexibility_w = 1.0
        priority_entities = []
    else:
        profile = profile_res.data[0]
        penalty_w = float(profile.get("penalty_weight", 1.0))
        relationship_w = float(profile.get("relationship_weight", 1.0))
        flexibility_w = float(profile.get("flexibility_weight", 1.0))
        priority_entities = profile.get("priority_entities", [])

    obligations_res = supabase.table("obligations").select("*").limit(10).execute()
    obligations = obligations_res.data

    base_decisions = []
    personalized_decisions = []

    for ob in obligations:
        urgency = 10 if ob["status"] == "OVERDUE" else 5
        penalty_rate = ob.get("penalty_rate", 0.0)
        priority_score = ob.get("priority_score", 50)
        
        base_score = urgency + (penalty_rate * 100) + priority_score
        
        is_priority = any(ent.lower() in ob["entity_name"].lower() for ent in priority_entities) if priority_entities else False
        rel_score = priority_score + (50 if is_priority else 0)
        
        # Flex factor scales the urgency down if flexible, up if strict
        flex_factor = 1.0 / (flexibility_w if flexibility_w > 0 else 1.0)
        
        pers_score = (urgency * flex_factor) + (penalty_w * penalty_rate * 100) + (relationship_w * rel_score)
        
        base_decisions.append({
            "id": ob["id"],
            "entity_name": ob["entity_name"],
            "amount": ob["amount"],
            "score": round(base_score, 2),
            "reasoning": "Standard scoring based on base urgency, penalty, and priority."
        })
        
        reasoning = f"Personalized score: Weights applied (Penalty: {penalty_w}, Rel: {relationship_w}, Flex: {flexibility_w})."
        if is_priority:
            reasoning += f" Entity '{ob['entity_name']}' matched user priorities."
            
        personalized_decisions.append({
            "id": ob["id"],
            "entity_name": ob["entity_name"],
            "amount": ob["amount"],
            "score": round(pers_score, 2),
            "reasoning": reasoning
        })

    base_decisions.sort(key=lambda x: x["score"], reverse=True)
    personalized_decisions.sort(key=lambda x: x["score"], reverse=True)

    return {
        "base": base_decisions,
        "personalized": personalized_decisions
    }
