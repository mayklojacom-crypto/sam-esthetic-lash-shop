import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// CEP de origem — Goiânia/GO
const CEP_ORIGEM = '74000000';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cepDestino, pesoGramas } = await req.json();

    if (!cepDestino || typeof cepDestino !== 'string') {
      return new Response(JSON.stringify({ error: 'CEP de destino é obrigatório' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const cep = cepDestino.replace(/\D/g, '');
    if (cep.length !== 8) {
      return new Response(JSON.stringify({ error: 'CEP inválido' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const peso = Math.max(pesoGramas || 300, 300); // mínimo 300g para Correios
    const pesoKg = (peso / 1000).toFixed(1);

    // Dimensões padrão (caixa pequena para produtos de cílios)
    const comprimento = 16;
    const altura = 5;
    const largura = 11;
    const diametro = 0;

    const serviceCodes = [
      { code: '04510', name: 'PAC' },
      { code: '04014', name: 'SEDEX' },
    ];

    const results = await Promise.allSettled(
      serviceCodes.map(async (svc) => {
        const params = new URLSearchParams({
          nCdEmpresa: '',
          sDsSenha: '',
          nCdServico: svc.code,
          sCepOrigem: CEP_ORIGEM,
          sCepDestino: cep,
          nVlPeso: pesoKg,
          nCdFormato: '1', // caixa
          nVlComprimento: String(comprimento),
          nVlAltura: String(altura),
          nVlLargura: String(largura),
          nVlDiametro: String(diametro),
          sCdMaoPropria: 'N',
          nVlValorDeclarado: '0',
          sCdAvisoRecebimento: 'N',
          sCdVisualizaCalculo: 'N',
          nIndicaCalculo: '3',
        });

        const url = `https://ws.correios.com.br/calculador/CalcPrecoPrazo.aspx?${params}&StrRetorno=xml&nCdFormato=1`;
        
        // Try XML endpoint
        const res = await fetch(url);
        const text = await res.text();

        // Parse XML response
        const valorMatch = text.match(/<Valor>([\d.,]+)<\/Valor>/);
        const prazoMatch = text.match(/<PrazoEntrega>(\d+)<\/PrazoEntrega>/);
        const erroMatch = text.match(/<Erro>(\d+)<\/Erro>/);
        const msgErroMatch = text.match(/<MsgErro>([^<]*)<\/MsgErro>/);

        const erro = erroMatch ? erroMatch[1] : '0';
        
        if (erro !== '0' && erro !== '010') {
          // erro 010 = "Serviço indisponível para o trecho informado" — skip silently
          throw new Error(msgErroMatch?.[1] || `Erro ${erro}`);
        }

        const valor = valorMatch ? parseFloat(valorMatch[1].replace('.', '').replace(',', '.')) : null;
        const prazo = prazoMatch ? parseInt(prazoMatch[1]) : null;

        if (!valor || !prazo) {
          throw new Error('Não foi possível calcular o frete');
        }

        return {
          service: svc.name,
          code: svc.code,
          price: valor,
          days: prazo,
        };
      })
    );

    const options = results
      .filter((r): r is PromiseFulfilledResult<{ service: string; code: string; price: number; days: number }> => r.status === 'fulfilled')
      .map(r => r.value);

    if (options.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'Não foi possível calcular o frete para este CEP',
        options: [] 
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ options }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Shipping calc error:', error);
    return new Response(JSON.stringify({ error: error.message, options: [] }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
