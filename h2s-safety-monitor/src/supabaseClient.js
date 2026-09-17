import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://sbqomqvgchftdntgwyow.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_5rS2ps2MOP7ZNnAmbkYJ7w_BnrcwQRf";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
