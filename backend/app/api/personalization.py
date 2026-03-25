import os
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
from typing import List

from app.services.storage.supabase_client import supabase

router = APIRouter()

genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-2.5-flash', generation_config={"response_mime_type": "application/json"})

class ParseRequest(BaseModel):
    text: str

class UpdateRequest(BaseModel):
    user_id: str
    penalty_weight: float
    relationship_weight: float
    flexibility_weight: float
    priority_entities: List[str]

@router.post("/parse")
async def parse_text(req: ParseRequest):
    prompt = f"""
    Analyze the following user input about their financial priorities and extract the specific weights and relationship preferences.
    Convert the responses into numerical weights generally between 0.0 and 2.0 (1.0 is default).
    
    Fields to extract:
    - penalty_weight (float: >1.0 if they avoid penalties, <1.0 if they don't care. Default 1.0)
    - relationship_weight (float: >1.0 if they prioritize relationships/vendors. Default 1.0)
    - flexibility_weight (float: >1.0 if very flexible, <1.0 if strict. Default 1.0)
    - priority_entities (list of strings: specific entities they mentioned prioritizing, e.g., 'Bank Loan', 'Vendors')

    Input text: "{req.text}"

    Output strict JSON with exactly these 4 keys.
    """
    
    try:
        response = model.generate_content(prompt)
        parsed_data = json.loads(response.text)
        return parsed_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/update")
async def update_profile(req: UpdateRequest):
    try:
        res = supabase.table("user_profiles").select("id").eq("user_id", req.user_id).execute()
        
        data = {
            "penalty_weight": req.penalty_weight,
            "relationship_weight": req.relationship_weight,
            "flexibility_weight": req.flexibility_weight,
            "priority_entities": req.priority_entities
        }
        
        if len(res.data) > 0:
            result = supabase.table("user_profiles").update(data).eq("user_id", req.user_id).execute()
        else:
            data["user_id"] = req.user_id
            data["name"] = "Default User"
            result = supabase.table("user_profiles").insert(data).execute()
            
        return {"status": "success", "data": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
