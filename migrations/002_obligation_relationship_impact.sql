-- Per-payable relationship term for priority engine (NULL = use code default 0.1)
ALTER TABLE obligations
  ADD COLUMN IF NOT EXISTS relationship_impact NUMERIC(10, 4);

COMMENT ON COLUMN obligations.relationship_impact IS
  'Relationship weight for this obligation only; NULL means default 0.1 in the API.';
