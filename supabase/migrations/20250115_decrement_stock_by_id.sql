-- Função para decrementar o estoque de um produto por ID
CREATE OR REPLACE FUNCTION decrement_stock_by_id(p_product_id UUID, quantity_to_decrement INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_stock INTEGER;
  new_stock INTEGER;
BEGIN
  -- Obter o estoque atual
  SELECT estoque INTO current_stock FROM items WHERE id = p_product_id;
  
  -- Verificar se o produto existe
  IF current_stock IS NULL THEN
    RAISE EXCEPTION 'Produto não encontrado com ID: %', p_product_id;
  END IF;
  
  -- Verificar se há estoque suficiente
  IF current_stock < quantity_to_decrement THEN
    RAISE EXCEPTION 'Estoque insuficiente. Disponível: %, Solicitado: %', current_stock, quantity_to_decrement;
  END IF;
  
  -- Calcular o novo estoque
  new_stock := current_stock - quantity_to_decrement;
  
  -- Atualizar o estoque
  UPDATE items SET estoque = new_stock WHERE id = p_product_id;
  
  -- Retornar o novo valor de estoque
  RETURN new_stock;
END;
$$;