import React, { useState, useRef } from 'react';
import { Search, Copy, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { generateDorks } from '../lib/gemini';
import type { DorkGeneratorFormData, DorkResponse } from '../types';

const DORK_COUNT_OPTIONS = [1, 3, 5, 10, 20];

export function DorkForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<DorkGeneratorFormData>({
    productName: '',
    paymentGateway: '',
    customGateway: '',
    dorkCount: 1
  });
  const [gateways, setGateways] = useState(['PayPal', 'Stripe']);
  const [negativePrompt, setNegativePrompt] = useState('');
  const [dorkResponses, setDorkResponses] = useState<Record<string, DorkResponse>>({});
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setDorkResponses({});

    try {
      const responses: Record<string, DorkResponse> = {};
      for (const gateway of gateways) {
        const dorksWithDescriptions = await generateDorks(formData.productName, gateway, formData.dorkCount, negativePrompt);
        if (dorksWithDescriptions && Array.isArray(dorksWithDescriptions)) {
          const dorks = dorksWithDescriptions.map(item => item.dork);
          const descriptions = dorksWithDescriptions.map(item => item.description);
          const searchUrls = dorks.map(dork => `https://www.google.com/search?q=${encodeURIComponent(dork)}`);
          responses[gateway] = { dorks, searchUrls, descriptions };
        } else {
          console.warn(`No dorks generated for gateway: ${gateway}`);
          responses[gateway] = { dorks: [], searchUrls: [], descriptions: [] };
        }
      }
      setDorkResponses(responses);
    } catch (error) {
      toast.error('Falha ao gerar dorks. Por favor, tente novamente.');
      console.error('Error generating dorks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGatewayChange = (index: number, value: string) => {
    const updatedGateways = [...gateways];
    updatedGateways[index] = value;
    setGateways(updatedGateways);
  };

  const addGateway = () => {
    setGateways([...gateways, '']);
  };

  const removeGateway = (index: number) => {
    const updatedGateways = [...gateways];
    updatedGateways.splice(index, 1);
    setGateways(updatedGateways);
  };

  const copyToClipboard = (dork: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(dork)
        .then(() => {
          toast.success('Dork copiado para a área de transferência!');
        })
        .catch(err => {
          console.error('Falha ao copiar dork: ', err);
          toast.error('Falha ao copiar dork para a área de transferência.');
        });
    } else {
      // Fallback for browsers that don't support the Clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = dork;
      textArea.style.position = 'absolute';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        toast.success('Dork copiado para a área de transferência!');
      } catch (err) {
        console.error('Falha ao copiar dork: ', err);
        toast.error('Falha ao copiar dork para a área de transferência.');
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="productName" className="block text-sm font-medium text-gray-200 mb-2">
            Nome do Produto
          </label>
          <input
            id="productName"
            type="text"
            required
            value={formData.productName}
            onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
            className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-magenta-500 focus:border-transparent"
            placeholder="Digite o nome do produto..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Gateways de Pagamento
          </label>
          {gateways.map((gateway, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                value={gateway}
                onChange={(e) => handleGatewayChange(index, e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-magenta-500 focus:border-transparent"
                placeholder={`Gateway ${index + 1}`}
              />
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => removeGateway(index)}
                  className="p-2 rounded-lg hover:bg-gray-700 text-red-500 hover:text-white transition-colors"
                >
                  Remover
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addGateway}
            className="py-2 px-4 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
          >
            Adicionar Gateway
          </button>
        </div>

        <div>
          <label htmlFor="negativePrompt" className="block text-sm font-medium text-gray-200 mb-2">
            Termos a Excluir (ex: marketplaces)
          </label>
          <input
            type="text"
            id="negativePrompt"
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-magenta-500 focus:border-transparent"
            placeholder="Ex: casasbahia, mercadolivre, magalu..."
          />
        </div>

        <div>
          <label htmlFor="dorkCount" className="block text-sm font-medium text-gray-200 mb-2">
            Quantidade de Dorks
          </label>
          <select
            id="dorkCount"
            value={formData.dorkCount}
            onChange={(e) => setFormData({ ...formData, dorkCount: parseInt(e.target.value, 10) })}
            className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-magenta-500 focus:border-transparent"
          >
            {DORK_COUNT_OPTIONS.map((count) => (
              <option key={count} value={count}>
                {count} {count === 1 ? 'dork' : 'dorks'}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-6 rounded-lg bg-magenta-600 hover:bg-magenta-700 text-white font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
          ) : (
            <>
              <Search size={20} />
              <span>Gerar Dorks</span>
            </>
          )}
        </button>
      </form>

      {Object.keys(dorkResponses).length > 0 && (
        <div className="mt-8 space-y-4">
          {Object.entries(dorkResponses).map(([gateway, response]) => (
            <div key={gateway} className="space-y-4">
              <h2 className="text-xl font-semibold text-magenta-500">Gateway: {gateway}</h2>
              {response.dorks.map((dork, index) => {
                const description = response.descriptions && response.descriptions[index] ? response.descriptions[index] : 'Descrição não disponível.';
                return (
                  <div key={index} className="p-4 rounded-lg bg-gray-800 border border-gray-700">
                    <div className="flex items-start justify-between">
                      <h3 className="text-lg font-medium text-white mb-2">Dork {index + 1}:</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => copyToClipboard(dork)}
                          className="p-2 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                          title="Copiar para área de transferência"
                        >
                          <Copy size={20} />
                        </button>
                        <a
                          href={response.searchUrls[index]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                          title="Abrir no Google"
                          onClick={(e) => {
                            if (!response.searchUrls[index]) {
                              e.preventDefault();
                              toast.error('URL de pesquisa não disponível.');
                            }
                          }}
                        >
                          <ExternalLink size={20} />
                        </a>
                      </div>
                    </div>
                    <pre className="mt-2 p-3 bg-gray-900 rounded-lg overflow-x-auto text-sm text-gray-200">
                      {dork}
                    </pre>
                    <p className="text-gray-400 mt-2">
                      Função: {description}
                    </p>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
