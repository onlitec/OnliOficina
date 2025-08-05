import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  action: 'test' | 'send';
  configId?: string;
  to?: string;
  subject?: string;
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { action, configId, to, subject, message }: EmailRequest = await req.json();

    // Get user from token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error("Usuário não autenticado");
    }

    // Get email configuration
    const { data: config, error: configError } = await supabaseClient
      .from('configuracao_email')
      .select('*')
      .eq('user_id', user.id)
      .eq('ativo', true)
      .single();

    if (configError || !config) {
      throw new Error("Configuração de email não encontrada ou inativa");
    }

    if (action === 'test') {
      // Test email connection by sending a test email
      const emailResponse = await resend.emails.send({
        from: `${config.nome_remetente} <${config.email_remetente}>`,
        to: [config.email_remetente], // Send test email to sender's email
        subject: "Teste de Conexão SMTP",
        html: `
          <h2>Teste de Conexão SMTP</h2>
          <p>Se você recebeu este email, a configuração SMTP está funcionando corretamente!</p>
          <p><strong>Servidor:</strong> ${config.servidor_smtp}:${config.porta}</p>
          <p><strong>SSL:</strong> ${config.usar_ssl ? 'Ativado' : 'Desativado'}</p>
          <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
        `,
      });

      console.log("Test email sent successfully:", emailResponse);

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Email de teste enviado com sucesso!" 
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    if (action === 'send') {
      if (!to || !subject || !message) {
        throw new Error("Campos obrigatórios: to, subject, message");
      }

      const emailResponse = await resend.emails.send({
        from: `${config.nome_remetente} <${config.email_remetente}>`,
        to: [to],
        subject: subject,
        html: message,
      });

      console.log("Email sent successfully:", emailResponse);

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Email enviado com sucesso!",
        emailId: emailResponse.data?.id
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    throw new Error("Ação inválida");

  } catch (error: any) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);