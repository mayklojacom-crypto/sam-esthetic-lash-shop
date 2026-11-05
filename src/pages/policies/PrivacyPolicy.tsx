import PolicyLayout, { STORE_WHATSAPP_URL } from '@/components/PolicyLayout';
import { openCookieSettings } from '@/lib/consent';

export default function PrivacyPolicy() {
  return (
    <PolicyLayout
      title="Política de privacidade"
      path="/privacidade"
      description="Quais dados a Sam Esthetic coleta no site, para que usa e como você pode escolher sobre cookies."
    >
      <p>Esta página explica, de forma simples, quais informações o site usa e por quê.</p>

      <h2>Dados que você informa na compra</h2>
      <ul>
        <li>Nome, CPF, e-mail, telefone, endereço de entrega e observações do pedido.</li>
        <li>Usamos esses dados para registrar o pedido, gerar o pagamento Pix pelo Mercado Pago e fazer a entrega.</li>
        <li>Para calcular o frete, o CEP e o número do endereço são usados para consultar o endereço e a rota de entrega.</li>
      </ul>

      <h2>Contato pelo WhatsApp</h2>
      <p>Se você usar o botão de WhatsApp do site, pedimos nome e telefone para identificar e responder seu atendimento.</p>

      <h2>Dados salvos no seu aparelho</h2>
      <p>Para facilitar sua próxima compra, o carrinho, o endereço consultado e os dados preenchidos no checkout ficam salvos no navegador deste aparelho. Você pode apagá-los limpando os dados do navegador.</p>

      <h2>Visitas e cookies</h2>
      <ul>
        <li>Contamos visitas ao site de forma agregada, para saber quantas pessoas acessam a loja.</li>
        <li>Ferramentas de medição e anúncios (Google e Meta) só são carregadas se você tocar em <strong>Aceitar</strong> no aviso de cookies. Se recusar, elas não são carregadas e você continua podendo comprar normalmente.</li>
        <li>Você pode mudar sua escolha quando quiser: <button type="button" onClick={openCookieSettings} className="text-primary underline">rever cookies</button>.</li>
        <li>Não enviamos nome, CPF, e-mail, telefone ou endereço para essas ferramentas.</li>
      </ul>

      <h2>Seus direitos</h2>
      <p>Você pode pedir acesso, correção ou exclusão dos seus dados, conforme a Lei Geral de Proteção de Dados (LGPD). Fale com a gente pelo <a href={STORE_WHATSAPP_URL} target="_blank" rel="noopener noreferrer">WhatsApp</a>.</p>
    </PolicyLayout>
  );
}
