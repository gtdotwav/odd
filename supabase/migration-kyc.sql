-- Migration: KYC + Dados Pessoais + PIX
-- Rodar no Supabase SQL Editor

-- ============================================
-- 1. Novos campos em profiles
-- ============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cpf TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pix_key TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pix_key_type TEXT;

-- ============================================
-- 2. Nova tabela kyc_documents
-- ============================================
CREATE TABLE IF NOT EXISTS kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('id_front', 'proof_address')),
  storage_path TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_kyc_documents_user ON kyc_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_status ON kyc_documents(status);

-- ============================================
-- 3. RPC: update_profile
-- ============================================
CREATE OR REPLACE FUNCTION update_profile(
  p_clerk_id TEXT,
  p_display_name TEXT DEFAULT NULL,
  p_handle TEXT DEFAULT NULL,
  p_bio TEXT DEFAULT NULL,
  p_full_name TEXT DEFAULT NULL,
  p_cpf TEXT DEFAULT NULL,
  p_date_of_birth DATE DEFAULT NULL,
  p_phone TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_profile_id UUID;
  v_result JSON;
BEGIN
  SELECT id INTO v_profile_id FROM profiles WHERE clerk_id = p_clerk_id;
  IF v_profile_id IS NULL THEN
    RETURN json_build_object('error', 'profile_not_found');
  END IF;

  UPDATE profiles SET
    display_name = COALESCE(p_display_name, display_name),
    handle = COALESCE(p_handle, handle),
    bio = COALESCE(p_bio, bio),
    full_name = COALESCE(p_full_name, full_name),
    cpf = COALESCE(p_cpf, cpf),
    date_of_birth = COALESCE(p_date_of_birth, date_of_birth),
    phone = COALESCE(p_phone, phone)
  WHERE id = v_profile_id;

  SELECT json_build_object(
    'id', id,
    'display_name', display_name,
    'handle', handle,
    'bio', bio,
    'full_name', full_name,
    'cpf', cpf,
    'date_of_birth', date_of_birth,
    'phone', phone
  ) INTO v_result FROM profiles WHERE id = v_profile_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. RPC: save_pix_key
-- ============================================
CREATE OR REPLACE FUNCTION save_pix_key(
  p_clerk_id TEXT,
  p_pix_key TEXT,
  p_pix_key_type TEXT
) RETURNS JSON AS $$
DECLARE
  v_profile_id UUID;
BEGIN
  SELECT id INTO v_profile_id FROM profiles WHERE clerk_id = p_clerk_id;
  IF v_profile_id IS NULL THEN
    RETURN json_build_object('error', 'profile_not_found');
  END IF;

  UPDATE profiles SET
    pix_key = p_pix_key,
    pix_key_type = p_pix_key_type
  WHERE id = v_profile_id;

  RETURN json_build_object('success', true, 'pix_key', p_pix_key, 'pix_key_type', p_pix_key_type);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. RPC: submit_kyc_document
-- ============================================
CREATE OR REPLACE FUNCTION submit_kyc_document(
  p_clerk_id TEXT,
  p_type TEXT,
  p_storage_path TEXT,
  p_original_filename TEXT
) RETURNS JSON AS $$
DECLARE
  v_profile_id UUID;
  v_doc_id UUID;
BEGIN
  SELECT id INTO v_profile_id FROM profiles WHERE clerk_id = p_clerk_id;
  IF v_profile_id IS NULL THEN
    RETURN json_build_object('error', 'profile_not_found');
  END IF;

  -- Remove documento anterior do mesmo tipo (substituição)
  DELETE FROM kyc_documents WHERE user_id = v_profile_id AND type = p_type;

  INSERT INTO kyc_documents (user_id, type, storage_path, original_filename)
  VALUES (v_profile_id, p_type, p_storage_path, p_original_filename)
  RETURNING id INTO v_doc_id;

  -- Atualizar kyc_status para pending se estava none ou rejected
  UPDATE profiles SET kyc_status = 'pending'
  WHERE id = v_profile_id AND kyc_status IN ('none', 'rejected');

  RETURN json_build_object('success', true, 'document_id', v_doc_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. RPC: get_kyc_status
-- ============================================
CREATE OR REPLACE FUNCTION get_kyc_status(
  p_clerk_id TEXT
) RETURNS JSON AS $$
DECLARE
  v_profile_id UUID;
  v_kyc_status TEXT;
  v_documents JSON;
BEGIN
  SELECT id, kyc_status INTO v_profile_id, v_kyc_status
  FROM profiles WHERE clerk_id = p_clerk_id;

  IF v_profile_id IS NULL THEN
    RETURN json_build_object('error', 'profile_not_found');
  END IF;

  SELECT COALESCE(json_agg(json_build_object(
    'id', d.id,
    'type', d.type,
    'original_filename', d.original_filename,
    'status', d.status,
    'rejection_reason', d.rejection_reason,
    'uploaded_at', d.uploaded_at,
    'reviewed_at', d.reviewed_at
  ) ORDER BY d.uploaded_at DESC), '[]'::json)
  INTO v_documents
  FROM kyc_documents d
  WHERE d.user_id = v_profile_id;

  RETURN json_build_object(
    'kyc_status', v_kyc_status,
    'documents', v_documents
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. RPC: admin_review_kyc
-- ============================================
CREATE OR REPLACE FUNCTION admin_review_kyc(
  p_clerk_id TEXT,
  p_document_id UUID,
  p_status TEXT,
  p_reason TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_admin_id UUID;
  v_doc_user_id UUID;
  v_all_approved BOOLEAN;
BEGIN
  -- Verificar se é admin
  SELECT id INTO v_admin_id FROM profiles WHERE clerk_id = p_clerk_id AND role = 'admin';
  IF v_admin_id IS NULL THEN
    RETURN json_build_object('error', 'unauthorized');
  END IF;

  -- Atualizar documento
  UPDATE kyc_documents SET
    status = p_status,
    rejection_reason = CASE WHEN p_status = 'rejected' THEN p_reason ELSE NULL END,
    reviewed_at = now()
  WHERE id = p_document_id
  RETURNING user_id INTO v_doc_user_id;

  IF v_doc_user_id IS NULL THEN
    RETURN json_build_object('error', 'document_not_found');
  END IF;

  -- Se rejeitou, marcar profile como rejected
  IF p_status = 'rejected' THEN
    UPDATE profiles SET kyc_status = 'rejected' WHERE id = v_doc_user_id;
    RETURN json_build_object('success', true, 'kyc_status', 'rejected');
  END IF;

  -- Se aprovou, verificar se TODOS os documentos estão aprovados
  SELECT NOT EXISTS (
    SELECT 1 FROM kyc_documents
    WHERE user_id = v_doc_user_id AND status != 'approved'
  ) AND EXISTS (
    SELECT 1 FROM kyc_documents
    WHERE user_id = v_doc_user_id AND type = 'id_front' AND status = 'approved'
  ) AND EXISTS (
    SELECT 1 FROM kyc_documents
    WHERE user_id = v_doc_user_id AND type = 'proof_address' AND status = 'approved'
  )
  INTO v_all_approved;

  IF v_all_approved THEN
    UPDATE profiles SET kyc_status = 'verified' WHERE id = v_doc_user_id;
    RETURN json_build_object('success', true, 'kyc_status', 'verified');
  END IF;

  RETURN json_build_object('success', true, 'kyc_status', 'pending');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. Atualizar get_user_profile para incluir novos campos
-- ============================================
CREATE OR REPLACE FUNCTION get_user_profile(p_clerk_id TEXT)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'id', p.id,
    'clerk_id', p.clerk_id,
    'handle', p.handle,
    'display_name', p.display_name,
    'avatar_url', p.avatar_url,
    'bio', p.bio,
    'full_name', p.full_name,
    'cpf', p.cpf,
    'date_of_birth', p.date_of_birth,
    'phone', p.phone,
    'pix_key', p.pix_key,
    'pix_key_type', p.pix_key_type,
    'kyc_status', p.kyc_status,
    'role', p.role,
    'created_at', p.created_at,
    'balance', COALESCE(w.balance, 0),
    'total_trades', (SELECT COUNT(*) FROM orders WHERE user_id = p.id AND status IN ('filled', 'partial')),
    'total_volume', COALESCE((SELECT SUM(amount * price) FROM orders WHERE user_id = p.id AND status IN ('filled', 'partial')), 0),
    'unread_notifications', (SELECT COUNT(*) FROM notifications WHERE user_id = p.id AND read = false)
  ) INTO v_result
  FROM profiles p
  LEFT JOIN wallets w ON w.user_id = p.id
  WHERE p.clerk_id = p_clerk_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
