ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS storage_path text,
  ADD COLUMN IF NOT EXISTS uploaded_by text NOT NULL DEFAULT 'Boss Admin';

CREATE POLICY panel_read_franchise_documents ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'franchise-documents');
CREATE POLICY panel_insert_franchise_documents ON storage.objects
  FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'franchise-documents');
CREATE POLICY panel_update_franchise_documents ON storage.objects
  FOR UPDATE TO anon, authenticated USING (bucket_id = 'franchise-documents') WITH CHECK (bucket_id = 'franchise-documents');
CREATE POLICY panel_delete_franchise_documents ON storage.objects
  FOR DELETE TO anon, authenticated USING (bucket_id = 'franchise-documents');