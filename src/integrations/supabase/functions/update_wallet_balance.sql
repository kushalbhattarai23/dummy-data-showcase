
CREATE OR REPLACE FUNCTION update_wallet_balance(wallet_id uuid, amount_change numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE wallets 
  SET balance = balance + amount_change
  WHERE id = wallet_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found with id: %', wallet_id;
  END IF;
END;
$$;
