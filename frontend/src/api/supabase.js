import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://soicabkrzdourszqjrvl.supabase.co",
  "sb_publishable_sJE7_T9UUX4xDOfBMGwhDg__RgS1ulE"
);

export default supabase;