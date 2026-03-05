import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MOCK_PRODUCTS_SHOP, MOCK_CATEGORIES } from "@/data/mockData";

export type Product = {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  category_name?: string;
  price: number;
  original_price: number | null;
  stock: number;
  image_url: string | null;
  emoji: string | null;
  badge: string | null;
  rating: number | null;
  total_sold: number;
  is_active: boolean;
  created_by: string | null;
};

export function useProducts(categoryFilter?: string) {
  return useQuery({
    queryKey: ["products", categoryFilter],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*, categories(name)")
        .eq("is_active", true)
        .order("total_sold", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      const dbProducts = (data || []).map((p: any) => ({
        ...p,
        category_name: p.categories?.name || "Uncategorized",
      })) as (Product & { category_name: string })[];

      // Fallback to mock data when DB is empty
      if (dbProducts.length === 0) {
        return MOCK_PRODUCTS_SHOP as (Product & { category_name: string })[];
      }

      return dbProducts;
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;

      // Fallback to mock categories
      if (!data || data.length === 0) {
        return MOCK_CATEGORIES;
      }

      return data;
    },
  });
}
