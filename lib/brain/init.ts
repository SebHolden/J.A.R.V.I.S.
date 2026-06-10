import { createServiceClient } from "@/lib/supabase/server";
import { registerBrainHandlers } from "./register-handlers";

registerBrainHandlers(createServiceClient);
