import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('AIzaSyBBxiNMCu22aZsHxqiIpdkT4qa4TVadAs4');

export async function generateDorks(
  productName: string,
  paymentGateway: string,
  count: number,
  negativePrompt: string
): Promise<{ dork: string; description: string }[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `Você é um especialista em criar dorks do Google para buscas direcionadas. Sua tarefa é criar ${count} dorks eficazes com base nos seguintes critérios:

1. Produto/Categoria: ${productName}
2. Gateway de Pagamento: ${paymentGateway}

O objetivo é encontrar lojas online que vendam o produto ou produtos da categoria especificada e que aceitem o gateway de pagamento fornecido.

Use técnicas avançadas de dorking como:
- 'inurl:' para localizar URLs contendo palavras-chave específicas.
- 'intext:' para encontrar páginas mencionando o produto ou gateway.
- 'site:' para focar em plataformas de e-commerce ou regiões específicas.
- Operadores lógicos ('AND', 'OR', '-') para refinar a busca.

Além disso, considere variações comuns do nome do produto e termos do gateway para maximizar a precisão. Otimize os dorks para máxima especificidade, garantindo que os resultados sejam APENAS de lojas online que vendem o produto ou categoria.

Importante:
- Remova todos os resultados de marketplaces conhecidos.
- Foque em lojas que explicitamente mencionem o nome do produto ou categoria junto com o gateway de pagamento.

Termos a Excluir (Negative Prompt): ${negativePrompt}

Siga o exemplo abaixo para gerar dorks e explicações:

Produto: Pneu
Gateway de Pagamento: Cielo

Dork 1: inurl:products intext:"Pneu" AND "Cielo" site:.com.br
Explicação: Esta dork procura por URLs contendo "produtos" (products) e garante que a página mencione tanto "Pneu" quanto "Cielo". Restringe a busca para domínios brasileiros (.com.br), focando em sites de e-commerce locais.

Dork 2: inurl:checkout intext:"Pneu" AND ("Cielo" OR "pagamento seguro") -blog
Explicação: Alvo páginas de checkout onde "Pneu" é mencionado junto com "Cielo" ou "pagamento seguro". Exclui blogs para evitar conteúdo irrelevante.

Dork 3: site:*.com.br filetype:php intext:"Pneu" AND "Cielo"
Explicação: Foca em websites de e-commerce baseados em PHP no Brasil, garantindo que a página contenha tanto "Pneu" quanto "Cielo". O filtro filetype:php ajuda a identificar páginas de lojas dinâmicas.

Dork 4: inurl:loja intext:"Pneu" AND "Cielo" -forum
Explicação: Procura por URLs contendo "loja" (store) e garante que a página mencione tanto "Pneu" quanto "Cielo". Exclui fóruns para evitar discussões não relacionadas.

Dork 5: intext:"comprar Pneu" AND "Cielo pago" site:.com.br
Explicação: Procura por páginas mencionando explicitamente "comprar Pneu" (buy tires) e "Cielo pago" (Cielo payment), restrito a domínios brasileiros.

Dork 6: inurl:category intext:"Pneu" AND "Cielo" AND "automotivo"
Explicação: Alvo páginas de categoria de produtos onde "Pneu" é listado junto com "Cielo" e "automotivo" (automotive), garantindo relevância para produtos relacionados a automóveis.

Dork 7: site:*.com.br intext:"Pneu" AND "Cielo" AND "parcelamento"
Explicação: Procura por sites de e-commerce brasileiros mencionando "Pneu", "Cielo" e "parcelamento" (installments), que é um recurso comum em lojas online.

Dork 8: inurl:product intext:"Pneu" AND "Cielo" -wordpress
Explicação: Alvo URLs específicos de produtos, excluindo sites WordPress para focar em plataformas de e-commerce dedicadas.

Dork 9: intext:"Pneu" AND "Cielo" AND "frete grátis" site:.com.br
Explicação: Encontra páginas que oferecem "frete grátis" para "Pneu" com "Cielo" como gateway de pagamento, atraindo compradores sensíveis ao preço.

Dork 10: inurl:search intext:"Pneu" AND "Cielo" AND "preço baixo"
Explicação: Procura por páginas de resultados de busca de lojas mencionando "Pneu", "Cielo" e "preço baixo", ajudando os usuários a encontrar produtos com desconto.

Agora, crie ${count} dorks para o Produto/Categoria: ${productName} e Gateway de Pagamento: ${paymentGateway}.

Retorne um array de objetos JSON, onde cada objeto contém a dork e sua descrição, no seguinte formato:
\`\`\`json
[
  {
    "dork": "dork1",
    "description": "this dork will find sites that contain product x by informing the gateway in the index"
  },
  {
    "dork": "dork2",
    "description": "this dork will find sites that contain product x by informing the gateway in the index"
  },
  ...
]
\`\`\``;

  try {
    const result = await model.generateContent(prompt);
    let responseText = result.response.text();

    // Strip code block delimiters
    responseText = responseText.replace(/^```json\n/, '').replace(/```$/, '');

    try {
      const response = JSON.parse(responseText);
      if (Array.isArray(response)) {
        return response.slice(0, count).map(item => ({
          dork: item.dork || '',
          description: item.description || 'Descrição não disponível',
        }));
      } else {
        console.error('Resposta JSON inválida: Array esperado', responseText);
        return [];
      }
    } catch (jsonError) {
      console.error('Erro ao analisar a resposta JSON:', jsonError, responseText);

      // Improved fallback mechanism
      const dorkList: { dork: string; description: string }[] = [];
      const lines = responseText.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]?.trim();
        if (line) {
          try {
            // Try to parse each line as a JSON object
            const parsed = JSON.parse(line);
            if (typeof parsed === 'object' && parsed !== null && 'dork' in parsed && 'description' in parsed) {
              dorkList.push({
                dork: (parsed.dork as string) || '',
                description: (parsed.description as string) || 'Descrição não disponível',
              });
            }
          } catch (itemError) {
            console.warn('Failed to parse line as JSON:', line, itemError);
            // If parsing as JSON fails, treat the line as a dork with no description
            dorkList.push({
              dork: line,
              description: 'Descrição não disponível',
            });
          }
        }
      }
      return dorkList.slice(0, count);
    }
  } catch (error) {
    console.error('Erro ao gerar conteúdo:', error);
    return [];
  }
}
