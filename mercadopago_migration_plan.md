# Plano de Migração: Stripe → Mercado Pago

## 📋 Visão Geral

**Objetivo:** Migrar o sistema de pagamentos do Stripe para Mercado Pago, mantendo toda a estrutura e funcionalidades existentes.

**Motivação:** 
- PIX instantâneo (melhor experiência para usuários brasileiros)
- Aprovação mais rápida para contas brasileiras
- Taxas competitivas no mercado nacional
- Suporte nativo ao ecossistema brasileiro

---

## 🏗️ Análise da Arquitetura Atual

### ✅ Pontos Positivos (Mantemos)
- **Estrutura modular bem organizada**
- **Context API para carrinho** (`CartContext.tsx`)
- **Páginas de sucesso/cancelamento** já implementadas
- **Sistema de estoque** funcionando
- **Integração com Supabase** estabelecida
- **Fluxo de checkout** bem definido

### 🔄 Arquivos que Precisam de Modificação

#### Frontend (React)
1. **`src/services/paymentService.ts`** - Substituir lógica Stripe
2. **`src/services/stripeService.ts`** - Renomear para `mercadopagoService.ts`
3. **`src/components/StripeProvider.tsx`** - Adaptar para MP
4. **`src/pages/CartPage.tsx`** - Atualizar botão de checkout
5. **`src/pages/Success.tsx`** - Ajustar validação de sessão
6. **`src/pages/cancel.tsx`** - Adaptar para MP

#### Backend (Supabase Functions)
1. **`supabase/functions/create-checkout-session/`** - Adaptar para MP
2. **`supabase/functions/stripe-webhook/`** - Criar webhook MP
3. **Nova function:** `create-payment-preference/` (já existe!)

#### Configuração
1. **`.env`** - Adicionar credenciais MP
2. **`package.json`** - Trocar dependências

---

## 📊 Estimativa de Dificuldade: **BAIXA-MÉDIA**

### Por que é Relativamente Simples?
- ✅ Fluxo similar (criar sessão → redirecionar → webhook → sucesso)
- ✅ Estrutura já preparada para múltiplos provedores
- ✅ Context API isolado (não afeta pagamentos)
- ✅ Supabase functions modulares
- ✅ Páginas de resultado já existem

---

## 🚀 Plano de Implementação

### **FASE 1: Preparação (30 min)** 🚀 **EM ANDAMENTO**

#### 1.1 Configuração Inicial
- [ ] Criar conta Mercado Pago Developers ⚠️ **AÇÃO EXTERNA NECESSÁRIA**
- [ ] Obter credenciais (Access Token, Public Key) ⚠️ **AÇÃO EXTERNA NECESSÁRIA**
- [ ] Instalar SDK do Mercado Pago
- [ ] Configurar variáveis de ambiente

#### 1.2 Backup de Segurança
- [ ] Commit atual: `git commit -m "Backup antes da migração MP"`
- [ ] Criar branch: `git checkout -b feature/mercadopago-migration`

### **FASE 2: Implementação Backend (45 min)**

#### 2.1 Supabase Functions
- [ ] **Adaptar:** `create-checkout-session` → `create-payment-preference`
- [ ] **Criar:** `mercadopago-webhook` (baseado no stripe-webhook)
- [ ] **Testar:** Functions localmente

#### 2.2 Configuração de Webhook
- [ ] Configurar webhook no painel MP
- [ ] Testar notificações de pagamento

### **FASE 3: Implementação Frontend (60 min)**

#### 3.1 Services Layer
- [ ] **Criar:** `mercadopagoService.ts`
- [ ] **Adaptar:** `paymentService.ts`
- [ ] **Manter:** Interface consistente

#### 3.2 Components
- [ ] **Adaptar:** Provider de pagamento
- [ ] **Atualizar:** Botão de checkout
- [ ] **Manter:** Toda lógica de carrinho

#### 3.3 Pages
- [ ] **Success.tsx:** Adaptar validação de sessão MP
- [ ] **cancel.tsx:** Ajustar para fluxo MP
- [ ] **CartPage.tsx:** Novo botão de checkout

### **FASE 4: Testes e Validação (30 min)**

#### 4.1 Testes Funcionais
- [ ] Fluxo completo de compra
- [ ] Webhook de confirmação
- [ ] Decremento de estoque
- [ ] Limpeza do carrinho

#### 4.2 Testes de Edge Cases
- [ ] Pagamento cancelado
- [ ] Pagamento pendente
- [ ] Webhook duplicado
- [ ] Falha de rede

---

## 🔧 Detalhes Técnicos

### Dependências a Instalar
```bash
# Frontend (React SDK)
npm install @mercadopago/sdk-react

# Backend (Node.js SDK)
npm install mercadopago

# Remover Stripe
npm uninstall @stripe/stripe-js stripe
```

### 📚 Documentação Atualizada (2024)
- **React SDK Oficial:** https://github.com/mercadopago/sdk-react <mcreference link="https://github.com/mercadopago/sdk-react" index="1">1</mcreference>
- **Node.js SDK:** https://www.npmjs.com/package/mercadopago <mcreference link="https://www.npmjs.com/package/mercadopago" index="2">2</mcreference>
- **Documentação Oficial:** https://www.mercadopago.com.br/developers/pt/docs/sdks-library/client-side/sdk-js-react-installation <mcreference link="https://www.mercadopago.com.br/developers/pt/docs/sdks-library/client-side/sdk-js-react-installation" index="3">3</mcreference>
- **Versão Suportada:** Node.js 16+ <mcreference link="https://www.npmjs.com/package/mercadopago" index="2">2</mcreference>

### Variáveis de Ambiente (.env)
```env
# Mercado Pago
VITE_MERCADOPAGO_PUBLIC_KEY=your_public_key
MERCADOPAGO_ACCESS_TOKEN=your_access_token
MERCADOPAGO_WEBHOOK_SECRET=your_webhook_secret

# Manter Supabase
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Fluxo de Dados (Novo)
```
1. Usuário clica "Finalizar Compra"
2. Frontend chama create-payment-preference
3. Supabase Function cria preferência no MP
4. Usuário é redirecionado para MP
5. Após pagamento, MP chama webhook
6. Webhook processa e atualiza banco
7. Usuário retorna para /success
```

---

## ⚠️ Possíveis Desafios

### Menores (Facilmente Resolvíveis)
1. **Formato de resposta diferente** - Adaptar parsing
2. **Campos obrigatórios específicos** - Ajustar payload
3. **Webhook signature** - Implementar validação MP
4. **URLs de retorno** - Configurar corretamente

### Mitigações
- Manter estrutura de dados consistente
- Usar TypeScript para type safety
- Testes unitários para cada função
- Logs detalhados para debugging

---

## 📈 Vantagens da Migração

### Para o Usuário
- ✅ **PIX instantâneo** (pagamento em segundos)
- ✅ **Cartão nacional** (melhor aprovação)
- ✅ **Interface familiar** (brasileiro)
- ✅ **Parcelamento nativo**

### Para o Negócio
- ✅ **Taxas competitivas**
- ✅ **Aprovação mais rápida**
- ✅ **Suporte em português**
- ✅ **Compliance brasileiro**

---

## 🎯 Cronograma Estimado

| Fase | Tempo | Descrição |
|------|-------|----------|
| Preparação | 30 min | Setup inicial e backup |
| Backend | 45 min | Supabase functions |
| Frontend | 60 min | Services e components |
| Testes | 30 min | Validação completa |
| **TOTAL** | **2h 45min** | **Migração completa** |

---

## 🚦 Próximos Passos

1. **Aprovação do plano** ✋
2. **Criação da conta MP** 🏦
3. **Início da implementação** 🚀

---

## 📝 Notas Importantes

- **Zero downtime:** Implementação em branch separada
- **Rollback fácil:** Estrutura atual preservada
- **Testes obrigatórios:** Antes de merge para main
- **Documentação:** Atualizar README após migração

---

**Status:** 🚀 FASE 1 INICIADA - Preparação em andamento

**Última atualização:** 2024-01-31 - Documentação atualizada

**Responsável:** AI Assistant + Desenvolvedor

---

## 🔄 Log de Progresso

### ✅ Concluído
- [x] Plano de migração criado
- [x] Documentação oficial consultada e atualizada
- [x] SDKs identificados (@mercadopago/sdk-react + mercadopago)

### 🚀 Em Andamento
- [ ] FASE 1: Preparação

### ⏳ Pendente
- [ ] FASE 2: Backend
- [ ] FASE 3: Frontend  
- [ ] FASE 4: Testes