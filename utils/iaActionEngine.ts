
import { IAResponse, IAAction } from '../types';

/**
 * IA Action Engine
 * Responsável por fazer o parse seguro da resposta da LLM e garantir que
 * ela respeita o contrato de tipos do sistema.
 */
export function parseIAResponse(rawText: string): IAResponse {
  try {
    // Tenta encontrar um bloco JSON na resposta, caso a IA mande texto antes/depois
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : rawText;

    const parsed = JSON.parse(jsonString);

    // Validação básica da estrutura
    if (!parsed || typeof parsed !== 'object') {
      throw new Error("Invalid JSON structure");
    }

    const message = parsed.message || "Entendido.";
    const actions = Array.isArray(parsed.actions) ? parsed.actions : [];

    // Sanitização das ações (garantir que type existe)
    const sanitizedActions: IAAction[] = actions.map((action: any) => {
        if (!action.type) return { type: "NO_ACTION" };
        return action as IAAction;
    });

    return {
      message,
      actions: sanitizedActions
    };

  } catch (error) {
    console.warn("IA Engine Parse Error:", error);
    // Fallback gracioso: Trata tudo como texto simples se o JSON falhar
    return {
      message: rawText,
      actions: []
    };
  }
}
