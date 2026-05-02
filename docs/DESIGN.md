# Design System - Venda Mobile (PDV, Estoque e Fiado)

Este documento define as diretrizes visuais, tokens de cores, tipografia e boas práticas de UX/UI para o aplicativo Venda Mobile.

## 1. Princípios de Design

1.  **Clareza e Rapidez:** O usuário está trabalhando. O fluxo de vendas (PDV) e registro de fiado deve ter o menor número de toques possível. Botões grandes e feedback visual rápido.
2.  **Acessibilidade e Contraste:** Suporte de primeira classe para temas Claros e Escuros. Os temas escuros devem ser "suaves" (evitar preto puro #000000 e branco puro #FFFFFF nos fundos e textos longos) para reduzir a fadiga visual.
3.  **Modernidade:** Interfaces limpas, uso de *cards* com bordas sutis (radius modernos) e sombras leves nos temas claros. No tema escuro, os cards devem ter contraste de cor de superfície ao invés de sombras.

## 2. Sistema de Temas (ThemeContext)

O aplicativo possui 4 temas nativos estruturados no `ThemeContext.tsx`:

### 🌞 Temas Claros

*   **Brisa do Oceano (Padrão):**
    *   Foco em frescor e clareza.
    *   Tons principais: Azul Cerulean (`#457b9d`) e fundos Honeydew (`#f1faee`).
    *   Bom para: Uso em ambientes bem iluminados, sensação de um sistema limpo.
*   **Coat Vibe:**
    *   Elegante e sério.
    *   Tons principais: Índigo (`#2b2d42`) e vermelho vivo (`#ef233c`) como destaque.
    *   Bom para: Usuários que preferem cores mais neutras/sóbrias de dia.

### 🌙 Temas Escuros (Otimizados)

Ambos os temas escuros foram ajustados para utilizar cores mais modernas (como a paleta *slate* e *gray* do Tailwind), abandonando os pretos muito puros (`#000814`) para evitar fadiga visual e o "smearing" em telas OLED.

*   **Golden:**
    *   Sofisticado, usa Cinza Escuro (`#111827`) e Superfície (`#1f2937`) com destaque para Âmbar/Dourado (`#fbbf24`).
    *   Os textos utilizam um branco quente/off-white (`#f9fafb`) para não "gritar" na tela.
*   **Deep Sea:**
    *   Inspirado no *slate* escuro (`#0f172a`), trazendo um tom azulado para a noite.
    *   Usa detalhes sutis em amarelo/ouro (`#fcd34d`).
    *   Textos secundários em `#94a3b8` guiam a hierarquia sem roubar a atenção.

## 3. Diretrizes de Cores Semânticas

Além das cores primárias, os componentes de estado devem seguir a seguinte semântica universal (ajustada dinamicamente entre claro/escuro):

*   **Success (`success`):** Usado para Vendas Concluídas, Pagamentos Recebidos, Sincronização. (Ex: `#34d399` no escuro, `#10b981` no claro).
*   **Warning (`warning`):** Usado para Alertas, Estoque Baixo, Fiados pendentes. (Ex: `#fbbf24` / `#f59e0b`).
*   **Error (`error`):** Usado para Cancelamentos, Exclusões de itens, Dívidas atrasadas. (Ex: `#f87171` no escuro, `#ef4444` no claro).

## 4. Tipografia e Espaçamento

*   **Tipografia:** Deve seguir a fonte do sistema (San Francisco no iOS, Roboto no Android) para melhor performance e legibilidade nativa.
*   **Hierarquia:** 
    *   Títulos de tela grandes e bold.
    *   Valores monetários sempre em destaque.
*   **Espaçamento:** Utilizar múltiplos de `8px` (`8`, `16`, `24`, `32`) para margens e paddings, garantindo consistência visual (Grid de 8 pontos).

## 5. Implementação

Para usar cores do design system em qualquer componente React Native, sempre importe o Hook de tema:

```tsx
import { useTheme } from '../contexts/ThemeContext';
import { View, Text } from 'react-native';

export function MeuComponente() {
  const { colors } = useTheme();

  return (
    <View style={{ backgroundColor: colors.background, padding: 16 }}>
      <Text style={{ color: colors.text, fontSize: 18 }}>Olá, Sistema</Text>
      <Text style={{ color: colors.textSecondary }}>Descrição suave</Text>
    </View>
  );
}
```

*Nota: Nunca utilize cores soltas em formato HEX ou RGBA (ex: `color: '#333'`) diretamente na estilização dos componentes. Sempre referencie `colors.X` do `ThemeContext` para garantir o funcionamento automático da troca de temas Claro/Escuro.*
