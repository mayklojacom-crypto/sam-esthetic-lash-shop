import PolicyLayout, { STORE_WHATSAPP_URL } from '@/components/PolicyLayout';

export default function ReturnsPolicy() {
  return (
    <PolicyLayout
      title="Trocas e devoluções"
      path="/trocas-e-devolucoes"
      description="Como solicitar troca, devolução ou arrependimento de compra na Sam Esthetic, conforme o Código de Defesa do Consumidor."
    >
      <p>Seguimos o Código de Defesa do Consumidor (CDC). Esta página explica como pedir ajuda; cada caso é analisado pelo nosso atendimento.</p>

      <h2>Arrependimento da compra</h2>
      <p>Compras feitas pela internet podem ser canceladas em até <strong>7 dias</strong> contados do recebimento do produto, conforme o artigo 49 do CDC.</p>

      <h2>Produto com defeito ou diferente do pedido</h2>
      <p>Se o produto chegar com defeito, danificado ou diferente do que você comprou, avise a loja o quanto antes. O CDC garante o direito de reclamar de defeitos aparentes em até 30 dias para produtos não duráveis e 90 dias para produtos duráveis (artigo 26).</p>

      <h2>Como solicitar</h2>
      <ul>
        <li>Fale com a gente pelo <a href={STORE_WHATSAPP_URL} target="_blank" rel="noopener noreferrer">WhatsApp</a>.</li>
        <li>Informe o código do seu pedido e o produto em questão.</li>
        <li>Se possível, envie fotos do produto e da embalagem.</li>
        <li>O atendimento vai orientar como será a retirada ou o envio e a forma de reembolso ou troca.</li>
      </ul>

      <h2>Reembolso</h2>
      <p>Quando houver reembolso, ele é combinado com o atendimento depois da análise do pedido.</p>
    </PolicyLayout>
  );
}
