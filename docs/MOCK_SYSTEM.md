# 🎭 Sistema de Mocks - Controle Centralizado

## 📋 **Visão Geral**

Todos os dados de exemplo estão centralizados no arquivo `lib/mocks.ts` e podem ser ativados/desativados facilmente.

## 🔧 **Como Funciona**

### **1. Configuração Central**
```typescript
// lib/mocks.ts
export const USE_MOCKS = true; // Mude para false para desativar mocks
```

### **2. Dados Centralizados**
Todos os dados de exemplo estão em `lib/mocks.ts`:
- ✅ `mockProducts` - Produtos de exemplo
- ✅ `mockCustomers` - Clientes de exemplo  
- ✅ `mockSales` - Vendas de exemplo
- ✅ `mockExpenses` - Despesas de exemplo
- ✅ `mockDashboardStats` - Estatísticas do dashboard
- ✅ `mockStoreSettings` - Configurações da loja

### **3. Verificação Automática**
Cada tela verifica se deve usar mocks ou dados reais:

```typescript
// Exemplo de implementação
const { USE_MOCKS, mockData } = await import('@/lib/mocks');

if (USE_MOCKS) {
  // Usar dados de exemplo
  setData(mockData);
} else {
  // Carregar dados reais do banco
  // TODO: Implementar carregamento real
  setData([]);
}
```

## 🎯 **Como Usar**

### **Para Desenvolvimento (com dados de exemplo):**
```typescript
// lib/mocks.ts
export const USE_MOCKS = true;
```

### **Para Produção (dados reais):**
```typescript
// lib/mocks.ts
export const USE_MOCKS = false;
```

## 📱 **Telas que Usam o Sistema**

### **✅ Dashboard (`app/(tabs)/index.tsx`)**
- Verifica `USE_MOCKS` antes de carregar dados
- Usa `mockDashboardStats` se mocks ativados
- Carrega dados reais se mocks desativados

### **✅ Configurações (`app/settings.tsx`)**
- Verifica `USE_MOCKS` antes de carregar configurações
- Usa `mockStoreSettings` se mocks ativados
- Carrega configurações reais se mocks desativados

### **✅ Produtos (`app/(tabs)/produtos.tsx`)**
- Sempre usa `mockProducts` (implementação pendente)
- TODO: Implementar verificação de `USE_MOCKS`

### **✅ Clientes (`app/(tabs)/clientes.tsx`)**
- Sempre usa `mockCustomers` (implementação pendente)
- TODO: Implementar verificação de `USE_MOCKS`

### **✅ Vendas (`app/(tabs)/vendas.tsx`)**
- Sempre usa `mockSales` (implementação pendente)
- TODO: Implementar verificação de `USE_MOCKS`

### **✅ Finanças (`app/(tabs)/financas.tsx`)**
- Sempre usa `mockExpenses` (implementação pendente)
- TODO: Implementar verificação de `USE_MOCKS`

## 🔄 **Implementação Completa**

### **Status Atual:**
- ✅ Dashboard: Implementado
- ✅ Configurações: Implementado
- ⏳ Produtos: Pendente
- ⏳ Clientes: Pendente
- ⏳ Vendas: Pendente
- ⏳ Finanças: Pendente

### **Próximos Passos:**
1. Implementar verificação `USE_MOCKS` em todas as telas
2. Adicionar carregamento de dados reais quando mocks desativados
3. Testar sistema completo

## 🎛️ **Controle de Mocks**

### **Ativar Mocks (Desenvolvimento):**
```typescript
// lib/mocks.ts
export const USE_MOCKS = true;
```

### **Desativar Mocks (Produção):**
```typescript
// lib/mocks.ts
export const USE_MOCKS = false;
```

## 📊 **Dados de Exemplo Incluídos**

### **Produtos:**
- Coca-Cola 350ml (R$ 3,50)
- Pão de Açúcar (R$ 0,50)
- Leite Integral 1L (R$ 4,80)
- Sabonete Líquido (R$ 8,90)
- Corte de Cabelo (R$ 35,00)
- Manicure (R$ 25,00)

### **Clientes:**
- João Silva
- Maria Santos
- Pedro Costa
- Ana Oliveira

### **Vendas:**
- 3 vendas de exemplo com itens
- Diferentes métodos de pagamento
- Datas variadas

### **Despesas:**
- Aluguel, Energia, Fornecedor
- Dívidas de clientes
- Despesas recorrentes

### **Dashboard:**
- Estatísticas zeradas por padrão
- Top produtos vazios
- Horários de pico vazios

## ✅ **Benefícios**

1. **Controle Centralizado:** Todos os dados em um local
2. **Fácil Ativação/Desativação:** Uma linha de código
3. **Desenvolvimento Simplificado:** Dados de exemplo sempre disponíveis
4. **Produção Limpa:** Sem dados de exemplo em produção
5. **Testes Facilitados:** Dados consistentes para testes

## 🚀 **Status Final**

**Sistema de mocks implementado e funcional!**

- ✅ Configuração centralizada
- ✅ Dashboard com controle de mocks
- ✅ Configurações com controle de mocks
- ⏳ Outras telas pendentes de implementação
