-- Função para decrementar o estoque de um produto
CREATE OR REPLACE FUNCTION decrement_stock(current_value TEXT, decrement_by INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Atualiza o estoque subtraindo a quantidade comprada
  RETURN (COALESCE(NULLIF(current_value, '')::INTEGER, 0) - decrement_by);
END;
$$;