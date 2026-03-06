import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useOrders(agentId?: string) {
  return useQuery({
    queryKey: ["orders", agentId],
    queryFn: async () => {
      let query = (supabase as any)
        .from("orders")
        .select("*, order_items(*, products(name, emoji))")
        .order("created_at", { ascending: false });

      if (agentId) {
        query = query.eq("agent_id", agentId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useTransactions() {
  return useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*, agents(profiles(full_name))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((t: any) => ({
        ...t,
        agent_name: t.agents?.profiles?.full_name || "Unknown",
      }));
    },
  });
}
