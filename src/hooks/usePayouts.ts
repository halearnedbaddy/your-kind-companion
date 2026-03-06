import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePayouts(agentId?: string) {
  return useQuery({
    queryKey: ["payouts", agentId],
    queryFn: async () => {
      let query = (supabase as any)
        .from("payouts")
        .select("*, agents(profiles(full_name), mpesa_phone)")
        .order("created_at", { ascending: false });

      if (agentId) {
        query = query.eq("agent_id", agentId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        agent_name: p.agents?.profiles?.full_name || "Unknown",
        agent_phone: p.agents?.mpesa_phone || "",
      }));
    },
  });
}
