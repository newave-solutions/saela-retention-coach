import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type Position = "ces" | "cem";

export function usePosition(userId: string | undefined) {
  const query = useQuery({
    queryKey: ["profile", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, position")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return {
    position: (query.data?.position ?? null) as Position | null,
    loading: query.isLoading,
  };
}
