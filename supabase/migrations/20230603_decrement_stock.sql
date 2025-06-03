-- Função para decrementar o estoque de um produto
CREATE OR REPLACE FUNCTION decrement_stock(product_id UUID, quantity INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_stock INTEGER;
  new_stock INTEGER;
BEGIN
  -- Obter o estoque atual
  SELECT estoque INTO current_stock FROM items WHERE id = product_id;
  
  -- Verificar se há estoque suficiente
  IF current_stock IS NULL THEN
    RAISE EXCEPTION 'Produto não encontrado';
  END IF;
  
  IF current_stock < quantity THEN
    RAISE EXCEPTION 'Estoque insuficiente. Disponível: %, Solicitado: %', current_stock, quantity;
  END IF;
  
  -- Calcular o novo estoque
  new_stock := current_stock - quantity;
  
  -- Atualizar o estoque
  UPDATE items SET estoque = new_stock WHERE id = product_id;
  
  -- Retornar o novo valor de estoque
  RETURN new_stock;
END;
$$;