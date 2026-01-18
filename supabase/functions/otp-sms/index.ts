import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// In-memory OTP store (for simplicity - in production use Redis/DB)
const otpStore = new Map<string, { code: string; expiresAt: number; attempts: number }>();

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function formatPhoneNumber(phone: string): string {
  let formatted = phone.trim().replace(/\D/g, '');
  if (formatted.startsWith('0')) {
    formatted = '254' + formatted.substring(1);
  } else if (formatted.startsWith('7') || formatted.startsWith('1')) {
    formatted = '254' + formatted;
  } else if (!formatted.startsWith('254')) {
    formatted = '254' + formatted;
  }
  return formatted;
}

async function sendSMS(phone: string, message: string): Promise<{ success: boolean; error?: string }> {
  const apiKey = Deno.env.get("BULK_SMS_API_KEY");
  const senderId = "XpressKard";

  if (!apiKey) {
    console.error("❌ BULK_SMS_API_KEY not configured");
    return { success: false, error: "SMS service not configured" };
  }

  const formattedPhone = formatPhoneNumber(phone);
  console.log(`📱 Sending SMS to ${formattedPhone}...`);

  try {
    const response = await fetch("https://sms.blessedtexts.com/api/sms/v1/sendsms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        sender_id: senderId,
        message: message,
        phone: formattedPhone,
      }),
    });

    const data = await response.json();
    console.log("📱 SMS API Response:", JSON.stringify(data, null, 2));

    // Check response - API returns array with status_code
    if (Array.isArray(data) && data[0]?.status_code === "1000") {
      console.log(`✅ SMS sent successfully to ${formattedPhone}`);
      return { success: true };
    }

    // Handle single object response
    if (data.status_code === "1000") {
      console.log(`✅ SMS sent successfully to ${formattedPhone}`);
      return { success: true };
    }

    const errorDesc = data[0]?.status_desc || data.status_desc || "SMS send failed";
    return { success: false, error: errorDesc };
  } catch (error: any) {
    console.error("❌ Error sending SMS:", error.message);
    return { success: false, error: error.message };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, phone, code } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (action === "send") {
      // Validate phone is registered
      const formattedPhone = formatPhoneNumber(phone);
      
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, phone")
        .or(`phone.eq.${phone},phone.eq.${formattedPhone},phone.eq.0${formattedPhone.slice(3)}`)
        .single();

      if (profileError || !profile) {
        console.log("❌ Phone not registered:", phone);
        return new Response(
          JSON.stringify({ success: false, error: "Phone number not registered. Please sign up first." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check rate limiting (1 OTP per minute)
      const existingOtp = otpStore.get(formattedPhone);
      if (existingOtp && existingOtp.expiresAt > Date.now() && (existingOtp.expiresAt - Date.now()) > 9 * 60 * 1000) {
        return new Response(
          JSON.stringify({ success: false, error: "Please wait before requesting another OTP" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate and store OTP
      const otp = generateOTP();
      otpStore.set(formattedPhone, {
        code: otp,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
        attempts: 0,
      });

      // Send SMS
      const message = `Your SWIFTLINE verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`;
      const smsResult = await sendSMS(formattedPhone, message);

      if (!smsResult.success) {
        return new Response(
          JSON.stringify({ success: false, error: smsResult.error || "Failed to send SMS" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`✅ OTP sent to ${formattedPhone}`);
      return new Response(
        JSON.stringify({ success: true, message: "OTP sent successfully" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "verify") {
      const formattedPhone = formatPhoneNumber(phone);
      const storedOtp = otpStore.get(formattedPhone);

      if (!storedOtp) {
        return new Response(
          JSON.stringify({ success: false, error: "No OTP found. Please request a new one." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (storedOtp.expiresAt < Date.now()) {
        otpStore.delete(formattedPhone);
        return new Response(
          JSON.stringify({ success: false, error: "OTP expired. Please request a new one." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (storedOtp.attempts >= 3) {
        otpStore.delete(formattedPhone);
        return new Response(
          JSON.stringify({ success: false, error: "Too many attempts. Please request a new OTP." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (storedOtp.code !== code) {
        storedOtp.attempts++;
        return new Response(
          JSON.stringify({ success: false, error: "Invalid OTP code" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // OTP verified - find user and create session
      otpStore.delete(formattedPhone);

      // Get the user from profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id, email, name, role")
        .or(`phone.eq.${phone},phone.eq.${formattedPhone},phone.eq.0${formattedPhone.slice(3)}`)
        .single();

      if (!profile) {
        return new Response(
          JSON.stringify({ success: false, error: "User not found" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`✅ OTP verified for user: ${profile.user_id}`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "OTP verified successfully",
          user: {
            id: profile.user_id,
            email: profile.email,
            name: profile.name,
            role: profile.role
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ Error in OTP function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
