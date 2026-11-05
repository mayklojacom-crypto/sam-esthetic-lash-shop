import { Link } from 'react-router-dom';
import PolicyLayout, { STORE_WHATSAPP_URL } from '@/components/PolicyLayout';

export default function DeliveryPolicy() {
  return (
    <PolicyLayout
      title="Entrega e frete"
      path="/entrega"
      description="Como funciona a entrega da Sam Esthetic em Goiânia e Aparecida de Goiânia e como o frete é calculado antes do pagamento."
    >
      <h2>Onde entregamos</h2>
      <p>Entregamos somente em <strong>Goiânia</strong> e <strong>Aparecida de Goiânia</strong> (GO). Endereços de outras cidades não podem ser atendidos pelo site no momento.</p>

      <h2>Como o frete é calculado</h2>
      <ul>
        <li>Você informa o CEP e o número do endereço no carrinho ou no checkout.</li>
        <li>O valor é calculado pela distância de rota entre a loja e o seu endereço, usando a tabela definida pela loja.</li>
        <li>O frete aparece separado e somado ao total <strong>antes</strong> de você pagar.</li>
        <li>No momento do pagamento, produtos, cupom e frete são conferidos novamente pela loja. Se algo mudar, mostramos o novo total para você confirmar antes de gerar o Pix.</li>
      </ul>

      <h2>Se o cálculo não funcionar</h2>
      <p>Às vezes o cálculo de rota pode ficar indisponível por alguns instantes. Nesse caso você pode continuar preenchendo seus dados e tentar novamente; nenhum valor é cobrado sem que o frete apareça para você.</p>

      <h2>Modalidade e prazo</h2>
      <p>A entrega é feita por aplicativo de entregas. O prazo depende do endereço, do horário e da disponibilidade de entregadores, e pode ser confirmado com a loja após o pagamento.</p>

      <h2>Acompanhar o pedido</h2>
      <p>Depois do pagamento aprovado, você pode consultar a situação em <Link to="/meu-pedido">Meu pedido</Link>.</p>

      <h2>Dúvidas</h2>
      <p>Fale com a gente pelo <a href={STORE_WHATSAPP_URL} target="_blank" rel="noopener noreferrer">WhatsApp</a>.</p>
    </PolicyLayout>
  );
}
