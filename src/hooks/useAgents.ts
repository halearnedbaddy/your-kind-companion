import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAgents() {
  return useQuery({
    queryKey: ["agents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("*, profiles(full_name, phone, avatar_url)")
        .order("total_earned", { ascending: false });
      if (error) throw error;
      return (data || []).map((a: any) => ({
        ...a,
        name: a.profiles?.full_name || "Agent",
        phone: a.profiles?.phone || a.mpesa_phone,
        avatar: (a.profiles?.full_name || "AG").split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase(),
      }));
    },
  });
}

export function useAgentProfile(userId?: string) {
  return useQuery({
    queryKey: ["agent-profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("*, profiles(full_name, phone, avatar_url)")
        .eq("user_id", userId!)
        .single();
      if (error) throw error;
      return {
        ...data,
        name: (data as any).profiles?.full_name || "Agent",
        phone: (data as any).profiles?.phone || data.mpesa_phone,
        avatar: ((data as any).profiles?.full_name || "AG").split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase(),
      };
    },
  });
}
