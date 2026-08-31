/**
 * CONFIGURAÇÃO CENTRAL DO SITE
 * -----------------------------------------------------------------------
 * Edite os valores abaixo para atualizar o site inteiro de uma só vez.
 * Este é o ÚNICO lugar que precisa ser alterado quando o link de checkout,
 * o Pixel da Meta ou o Google Analytics estiverem disponíveis.
 * -----------------------------------------------------------------------
 */
window.SITE_CONFIG = {
  // 1) LINK DE CHECKOUT DA KIWIFY
  // Substitua a URL abaixo pelo link real do checkout da Kiwify.
  // Todos os botões "Quero Organizar Meu Casamento" usam esta variável.
  CHECKOUT_URL: "https://kiwify.app/qdYkqev",

  // 2) META PIXEL (Facebook/Instagram Ads)
  // Substitua pelo ID real do seu Pixel. Deixe vazio ("") para não carregar.
  META_PIXEL_ID: "",

  // 3) GOOGLE ANALYTICS 4
  // Substitua pelo Measurement ID real (ex: "G-XXXXXXXXXX"). Deixe vazio para não carregar.
  GA4_MEASUREMENT_ID: "",

  // 4) INTEGRAÇÃO DE CAPTURA DE LEADS (página /checklist-gratis.html)
  // URL de um webhook/endpoint (ex: Zapier, Make, ActiveCampaign, planilha) que
  // receberá { nome, email, origem, data }. Deixe vazio para apenas salvar
  // localmente (fallback) até a integração ser configurada.
  LEAD_WEBHOOK_URL: "",

  // 5) PREÇO EXIBIDO (apenas para facilitar manutenção de texto em JS, se necessário)
  PRICE_DISPLAY: "R$ 29,90",
};
