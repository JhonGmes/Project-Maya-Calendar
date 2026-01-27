
import { IAResponse, IAAction } from '../types';

/**
 * IA Action Engine
 * Responsável por fazer o parse seguro da resposta da LLM e garantir que
 * ela respeita o contrato de tipos do sistema.
 */
export function parseIAResponse(rawText: string): IAResponse {
  try {
    // 1. Tentar encontrar um BLOCO JSON (seja Objeto {} ou Array [])
    // O regex procura pelo primeiro { ... } ou [ ... ] ignorando o texto em volta
    const jsonMatch = rawText.match(/({[\s\S]*})|(\[[\s\S]*\])/);
    
    if (!jsonMatch) {
        // Se não achou JSON nenhum, assume que é só conversa
        return {
            message: rawText,
            actions: []
        };
    }

    const jsonString = jsonMatch[0];
    
    // 2. Extrair a mensagem de texto que pode estar fora do JSON (antes ou depois)
    // Remove o bloco JSON do texto original e limpa espaços
    const textOutside = rawText.replace(jsonString, '').trim();

    // 3. Parse do JSON encontrado
    const parsed = JSON.parse(jsonString);
    let actions: any[] = [];
    let message = textOutside; // Default para o texto fora do JSON

    if (Array.isArray(parsed)) {
        // CASO 1: O modelo retornou apenas um Array de ações [ ... ]
        // A mensagem é o texto que sobrou fora do array. Se vazio, texto padrão.
        actions = parsed;
        if (!message) message = "Ações geradas.";
    } else if (typeof parsed === 'object') {
        // CASO 2: O modelo retornou o Objeto padrão { message, actions }
        // Prioriza a mensagem dentro do JSON, fallback para texto fora ou padrão
        actions = Array.isArray(parsed.actions) ? parsed.actions : [];
        message = parsed.message || message || "Entendido.";
    }

    // 4. Validação e Sanitização das ações
    const sanitizedActions: IAAction[] = actions.map((action: any) => {
        // Se a ação não tiver 'type', ignora ou converte para NO_ACTION
        if (!action || !action.type) return { type: "NO_ACTION" };
        return action as IAAction;
    });

    return {
      message: message,
      actions: sanitizedActions
    };

  } catch (error) {
    console.warn("IA Engine Parse Error:", error);
    // Fallback gracioso: Trata tudo como texto simples se o JSON falhar no parse
    return {
      message: rawText, // Retorna o texto cru para o usuário não perder a resposta
      actions: []
    };
  }
}
