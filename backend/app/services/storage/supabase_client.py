from supabase import create_client
import os
from dotenv import load_dotenv, find_dotenv

env_path = find_dotenv(".env.local") or find_dotenv(".env")
if env_path:
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("REACT_APP_SUPABASE_URL")
SUPABASE_KEY = (
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    or os.getenv("REACT_APP_SUPABASE_ANON_KEY")
)

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError(
        "Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL (or REACT_APP_SUPABASE_URL) "
        "and either SUPABASE_SERVICE_ROLE_KEY (preferred) or NEXT_PUBLIC_SUPABASE_ANON_KEY (fallback)."
    )

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)