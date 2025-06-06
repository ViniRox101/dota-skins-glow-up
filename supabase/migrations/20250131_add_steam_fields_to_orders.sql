-- Migração para adicionar campos Steam à tabela orders
-- Esta migração deve ser aplicada manualmente no painel do Supabase

-- Adicionar campos Steam à tabela orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS steam_id TEXT,
ADD COLUMN IF NOT EXISTS steam_add_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS steam_ready_to_send BOOLEAN DEFAULT FALSE;

-- Comentários sobre os campos:
-- steam_id: ID da Steam do usuário para entrega dos itens
-- steam_add_date: Data quando o usuário foi adicionado na Steam (inicia contagem de 30 dias)
-- steam_ready_to_send: Flag indicando se o item está pronto para ser entregue