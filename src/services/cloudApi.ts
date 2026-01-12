/**
 * Cloud API Service
 * Uses Lovable Cloud (Supabase) directly instead of external Express backend
 * The old api.ts is preserved for reference but this is the active service
 */

import { supabase } from "@/integrations/supabase/client";

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// Types
export interface User {
  id: string;
  phone?: string;
  name: string;
  email?: string;
  role: "BUYER" | "SELLER" | "ADMIN";
}

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  phone?: string;
  email?: string;
  role: "BUYER" | "SELLER" | "ADMIN";
  avatar_url?: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Store {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  logo?: string;
  bio?: string;
  visibility: "PRIVATE" | "PUBLIC";
  status: "INACTIVE" | "ACTIVE" | "FROZEN";
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  name: string;
  description?: string;
  price?: number;
  images: string[];
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  ai_confidence_score?: number;
  extraction_warnings: string[];
  missing_fields: string[];
  source_type?: "MANUAL" | "AI_GENERATED" | "SOCIAL_IMPORT";
  source_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  available_balance: number;
  pending_balance: number;
  total_earned: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  seller_id: string;
  buyer_id?: string;
  item_name: string;
  description?: string;
  amount: number;
  status: string;
  payment_method?: string;
  payment_reference?: string;
  shipping_courier?: string;
  tracking_number?: string;
  estimated_delivery?: string;
  buyer_name?: string;
  buyer_email?: string;
  buyer_phone?: string;
  created_at: string;
  updated_at: string;
}

export interface SocialAccount {
  id: string;
  store_id: string;
  platform: string;
  page_url: string;
  page_id?: string;
  sync_status: string;
  last_synced_at?: string;
  created_at: string;
  updated_at: string;
}

class CloudApiService {
  // ==================== AUTH ====================
  
  async registerWithEmail(data: { email: string; password: string; name: string; role?: string }): Promise<ApiResponse<{ user: User }>> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            name: data.name,
            role: data.role || "BUYER",
          },
        },
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: "Failed to create user" };
      }

      // Create profile
      const { error: profileError } = await supabase.from("profiles").insert({
        user_id: authData.user.id,
        name: data.name,
        email: data.email,
        role: data.role || "BUYER",
      });

      if (profileError) {
        console.error("Profile creation error:", profileError);
      }

      // Create wallet for the user
      await supabase.from("wallets").insert({
        user_id: authData.user.id,
        available_balance: 0,
        pending_balance: 0,
        total_earned: 0,
      });

      const user: User = {
        id: authData.user.id,
        email: data.email,
        name: data.name,
        role: (data.role as "BUYER" | "SELLER" | "ADMIN") || "BUYER",
      };

      return { success: true, data: { user } };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Registration failed" };
    }
  }

  async loginWithEmail(email: string, password: string): Promise<ApiResponse<{ user: User }>> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: "Login failed" };
      }

      // Get profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", authData.user.id)
        .maybeSingle();

      const user: User = {
        id: authData.user.id,
        email: authData.user.email || undefined,
        name: profile?.name || authData.user.user_metadata?.name || "User",
        role: (profile?.role as "BUYER" | "SELLER" | "ADMIN") || "BUYER",
        phone: profile?.phone || undefined,
      };

      return { success: true, data: { user } };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Login failed" };
    }
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  }

  async getSession() {
    return supabase.auth.getSession();
  }

  async getUser() {
    return supabase.auth.getUser();
  }

  // ==================== PROFILE ====================

  async getProfile(): Promise<ApiResponse<Profile>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Not authenticated" };

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) return { success: false, error: error.message };
      if (!data) return { success: false, error: "Profile not found" };

      return { success: true, data: data as Profile };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to fetch profile" };
    }
  }

  async updateProfile(updates: Partial<Profile>): Promise<ApiResponse<boolean>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Not authenticated" };

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", user.id);

      if (error) return { success: false, error: error.message };
      return { success: true, data: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to update profile" };
    }
  }

  // ==================== STORE ====================

  async getMyStore(): Promise<ApiResponse<Store>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Not authenticated" };

      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) return { success: false, error: error.message };
      return { success: true, data: data as Store };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to fetch store" };
    }
  }

  async createStore(data: { name: string; slug: string }): Promise<ApiResponse<Store>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Not authenticated" };

      const { data: store, error } = await supabase
        .from("stores")
        .insert({ user_id: user.id, name: data.name, slug: data.slug })
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, data: store as Store };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to create store" };
    }
  }

  async updateStore(updates: Partial<Store>): Promise<ApiResponse<boolean>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Not authenticated" };

      const { error } = await supabase
        .from("stores")
        .update(updates)
        .eq("user_id", user.id);

      if (error) return { success: false, error: error.message };
      return { success: true, data: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to update store" };
    }
  }

  async updateStoreStatus(status: "INACTIVE" | "ACTIVE" | "FROZEN"): Promise<ApiResponse<boolean>> {
    return this.updateStore({ status } as Partial<Store>);
  }

  // ==================== PRODUCTS ====================

  async getDraftProducts(): Promise<ApiResponse<Product[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Not authenticated" };

      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!store) return { success: true, data: [] };

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", store.id)
        .eq("status", "DRAFT")
        .order("created_at", { ascending: false });

      if (error) return { success: false, error: error.message };
      return { success: true, data: (data || []) as Product[] };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to fetch drafts" };
    }
  }

  async getPublishedProducts(): Promise<ApiResponse<Product[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Not authenticated" };

      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!store) return { success: true, data: [] };

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", store.id)
        .eq("status", "PUBLISHED")
        .order("created_at", { ascending: false });

      if (error) return { success: false, error: error.message };
      return { success: true, data: (data || []) as Product[] };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to fetch products" };
    }
  }

  async createProduct(data: { name: string; description?: string; price: number; images?: string[] }): Promise<ApiResponse<Product>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Not authenticated" };

      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!store) return { success: false, error: "Store not found" };

      const { data: product, error } = await supabase
        .from("products")
        .insert({
          store_id: store.id,
          name: data.name,
          description: data.description,
          price: data.price,
          images: data.images || [],
          status: "DRAFT",
          source_type: "MANUAL",
        })
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, data: product as Product };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to create product" };
    }
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id);

      if (error) return { success: false, error: error.message };
      return { success: true, data: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to update product" };
    }
  }

  async publishProduct(id: string): Promise<ApiResponse<boolean>> {
    return this.updateProduct(id, { status: "PUBLISHED" } as Partial<Product>);
  }

  async archiveProduct(id: string): Promise<ApiResponse<boolean>> {
    return this.updateProduct(id, { status: "ARCHIVED" } as Partial<Product>);
  }

  async deleteProduct(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (error) return { success: false, error: error.message };
      return { success: true, data: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to delete product" };
    }
  }

  // ==================== AI GENERATION ====================

  async generateProductWithAI(description: string, imageUrl?: string): Promise<ApiResponse<Product>> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { success: false, error: "Not authenticated" };

      const { data, error } = await supabase.functions.invoke("ai-generate-product", {
        body: { description, imageUrl },
      });

      if (error) return { success: false, error: error.message };
      return { success: true, data: data?.product as Product };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "AI generation failed" };
    }
  }

  // ==================== WALLET ====================

  async getWallet(): Promise<ApiResponse<Wallet>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Not authenticated" };

      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) return { success: false, error: error.message };
      return { success: true, data: data as Wallet };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to fetch wallet" };
    }
  }

  // ==================== TRANSACTIONS ====================

  async getTransactions(params: { status?: string; page?: number; limit?: number } = {}): Promise<ApiResponse<Transaction[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Not authenticated" };

      let query = supabase
        .from("transactions")
        .select("*")
        .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (params.status) {
        query = query.eq("status", params.status);
      }

      if (params.limit) {
        const offset = ((params.page || 1) - 1) * params.limit;
        query = query.range(offset, offset + params.limit - 1);
      }

      const { data, error } = await query;

      if (error) return { success: false, error: error.message };
      return { success: true, data: (data || []) as Transaction[] };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to fetch transactions" };
    }
  }

  async getTransaction(id: string): Promise<ApiResponse<Transaction>> {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) return { success: false, error: error.message };
      if (!data) return { success: false, error: "Transaction not found" };
      return { success: true, data: data as Transaction };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to fetch transaction" };
    }
  }

  async createTransaction(data: { itemName: string; amount: number; description?: string }): Promise<ApiResponse<Transaction>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Not authenticated" };

      const { data: transaction, error } = await supabase
        .from("transactions")
        .insert({
          seller_id: user.id,
          item_name: data.itemName,
          amount: data.amount,
          description: data.description,
          status: "PENDING",
        })
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, data: transaction as Transaction };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to create transaction" };
    }
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from("transactions")
        .update(updates)
        .eq("id", id);

      if (error) return { success: false, error: error.message };
      return { success: true, data: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to update transaction" };
    }
  }

  // ==================== SELLER ORDERS ====================

  async getSellerOrders(params: { status?: string; page?: number; limit?: number } = {}): Promise<ApiResponse<Transaction[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Not authenticated" };

      let query = supabase
        .from("transactions")
        .select("*")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      if (params.status) {
        query = query.eq("status", params.status);
      }

      if (params.limit) {
        const offset = ((params.page || 1) - 1) * params.limit;
        query = query.range(offset, offset + params.limit - 1);
      }

      const { data, error } = await query;

      if (error) return { success: false, error: error.message };
      return { success: true, data: (data || []) as Transaction[] };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to fetch orders" };
    }
  }

  async acceptOrder(orderId: string): Promise<ApiResponse<boolean>> {
    return this.updateTransaction(orderId, { status: "ACCEPTED" });
  }

  async rejectOrder(orderId: string): Promise<ApiResponse<boolean>> {
    return this.updateTransaction(orderId, { status: "REJECTED" });
  }

  async addShippingInfo(orderId: string, data: { courierName: string; trackingNumber: string; estimatedDeliveryDate?: string }): Promise<ApiResponse<boolean>> {
    return this.updateTransaction(orderId, {
      shipping_courier: data.courierName,
      tracking_number: data.trackingNumber,
      estimated_delivery: data.estimatedDeliveryDate,
      status: "SHIPPED",
    });
  }

  // ==================== BUYER ORDERS ====================

  async getBuyerOrders(params: { status?: string; page?: number; limit?: number } = {}): Promise<ApiResponse<Transaction[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Not authenticated" };

      let query = supabase
        .from("transactions")
        .select("*")
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false });

      if (params.status) {
        query = query.eq("status", params.status);
      }

      if (params.limit) {
        const offset = ((params.page || 1) - 1) * params.limit;
        query = query.range(offset, offset + params.limit - 1);
      }

      const { data, error } = await query;

      if (error) return { success: false, error: error.message };
      return { success: true, data: (data || []) as Transaction[] };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to fetch orders" };
    }
  }

  async confirmDelivery(transactionId: string): Promise<ApiResponse<boolean>> {
    return this.updateTransaction(transactionId, { status: "DELIVERED" });
  }

  // ==================== SOCIAL ACCOUNTS ====================

  async listSocialAccounts(): Promise<ApiResponse<SocialAccount[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Not authenticated" };

      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!store) return { success: true, data: [] };

      const { data, error } = await supabase
        .from("social_accounts")
        .select("*")
        .eq("store_id", store.id)
        .order("created_at", { ascending: false });

      if (error) return { success: false, error: error.message };
      return { success: true, data: (data || []) as SocialAccount[] };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to fetch social accounts" };
    }
  }

  async connectSocialPage(data: { platform: string; pageUrl: string; pageId?: string }): Promise<ApiResponse<SocialAccount>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Not authenticated" };

      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!store) return { success: false, error: "Store not found" };

      const { data: account, error } = await supabase
        .from("social_accounts")
        .insert({
          store_id: store.id,
          platform: data.platform,
          page_url: data.pageUrl,
          page_id: data.pageId,
          sync_status: "PENDING",
        })
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, data: account as SocialAccount };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to connect social page" };
    }
  }

  // ==================== STOREFRONT (PUBLIC) ====================

  async getStorefront(slug: string): Promise<ApiResponse<{ store: Store; products: Product[] }>> {
    try {
      const { data: store, error: storeError } = await supabase
        .from("stores")
        .select("*")
        .eq("slug", slug)
        .eq("visibility", "PUBLIC")
        .eq("status", "ACTIVE")
        .maybeSingle();

      if (storeError || !store) {
        return { success: false, error: "Store not found" };
      }

      const { data: products } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", store.id)
        .eq("status", "PUBLISHED")
        .order("created_at", { ascending: false });

      return {
        success: true,
        data: {
          store: store as Store,
          products: (products || []) as Product[],
        },
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to fetch storefront" };
    }
  }

  async getPublicProduct(slug: string, productId: string): Promise<ApiResponse<Product>> {
    try {
      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("slug", slug)
        .eq("visibility", "PUBLIC")
        .eq("status", "ACTIVE")
        .maybeSingle();

      if (!store) return { success: false, error: "Store not found" };

      const { data: product, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .eq("store_id", store.id)
        .eq("status", "PUBLISHED")
        .maybeSingle();

      if (error || !product) return { success: false, error: "Product not found" };
      return { success: true, data: product as Product };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to fetch product" };
    }
  }

  // ==================== SELLER STATS ====================

  async getSellerStats(): Promise<ApiResponse<{
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    totalRevenue: number;
  }>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Not authenticated" };

      const { data: transactions } = await supabase
        .from("transactions")
        .select("status, amount")
        .eq("seller_id", user.id);

      const stats = {
        totalOrders: transactions?.length || 0,
        pendingOrders: transactions?.filter(t => t.status === "PENDING").length || 0,
        completedOrders: transactions?.filter(t => t.status === "DELIVERED" || t.status === "COMPLETED").length || 0,
        totalRevenue: transactions?.filter(t => t.status === "DELIVERED" || t.status === "COMPLETED").reduce((sum, t) => sum + Number(t.amount), 0) || 0,
      };

      return { success: true, data: stats };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to fetch stats" };
    }
  }
}

export const cloudApi = new CloudApiService();
