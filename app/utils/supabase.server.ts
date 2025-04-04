import { createClient } from "@supabase/supabase-js";

const supabaseUrl: string = process.env.SUPABASE_URL || "";
const supabaseAnonKey: string = process.env.SUPABASE_API_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables: SUPABASE_URL or SUPABASE_API_KEY");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
