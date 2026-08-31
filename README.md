# Como Organizar Fácil Seu Casamento 2027

Landing page estática (HTML/CSS/JS puro) para venda do produto digital
**"Como Organizar Fácil Seu Casamento 2027"**, otimizada para tráfego de
Meta Ads (Instagram/Facebook), mobile-first.

## Estrutura

```
index.html                    # landing page principal (todas as 15 seções)
checklist-gratis.html         # página de captura de leads (isca digital)
politica-de-privacidade.html
termos-de-uso.html
suporte.html
css/style.css                 # design system completo (paleta, tipografia, componentes)
js/config.js                  # ⚙️ ÚNICO lugar para configurar links e IDs
js/analytics.js               # carregamento condicional do Meta Pixel e GA4
js/main.js                    # navegação suave, animações, CTAs, formulário de lead
```

## Como configurar (edite apenas `js/config.js`)

1. **Link de checkout da Kiwify** — substitua `CHECKOUT_URL` pelo link real.
   Todos os botões de compra do site usam essa mesma variável.
2. **Meta Pixel** — informe o `META_PIXEL_ID` para ativar o rastreamento
   (PageView automático + evento `InitiateCheckout` em cada clique de CTA).
3. **Google Analytics 4** — informe o `GA4_MEASUREMENT_ID`.
4. **Captura de leads** — informe `LEAD_WEBHOOK_URL` para enviar os dados do
   formulário de `/checklist-gratis.html` a uma ferramenta externa (Zapier,
   Make, e-mail marketing, planilha, etc). Enquanto vazio, os leads ficam
   salvos localmente no navegador (`localStorage`) como fallback.

## Antes de publicar

- Atualize as URLs `https://www.exemplo.com/...` (canonical e Open Graph) para o domínio real.
- Adicione uma imagem de compartilhamento (`img/og-cover.jpg`, 1200x630px) e aponte `og:image`/`twitter:image` para ela.
- Preencha o e-mail/canal de suporte em `suporte.html`.

## Funcionalidades já implementadas

- Design responsivo mobile-first (paleta off-white, champagne, nude, dourado, marrom)
- Navegação suave entre seções (âncoras)
- Animações discretas de entrada ao rolar a página (`data-reveal`)
- Barra de CTA fixa no mobile
- FAQ em acordeão
- SEO básico (title, description, canonical, dados estruturados de produto)
- Meta tags para compartilhamento (Open Graph e Twitter Card)
- Estrutura pronta para Meta Pixel e Google Analytics (basta preencher os IDs)
- Formulário de captura de leads pronto para integração futura
- Preço promocional (de/por) sem contagem regressiva falsa ou escassez artificial
