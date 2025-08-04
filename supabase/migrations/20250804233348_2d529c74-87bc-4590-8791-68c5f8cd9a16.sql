-- Adicionar campo de foto na tabela veiculos
ALTER TABLE veiculos ADD COLUMN foto TEXT;

-- Criar bucket para fotos de veículos
INSERT INTO storage.buckets (id, name, public) VALUES ('vehicle-photos', 'vehicle-photos', true);

-- Criar policies para o bucket vehicle-photos
CREATE POLICY "Fotos de veículos são publicamente acessíveis"
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'vehicle-photos');

CREATE POLICY "Usuários podem fazer upload de fotos de veículos"
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'vehicle-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Usuários podem atualizar suas fotos de veículos"
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'vehicle-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Usuários podem deletar suas fotos de veículos"
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'vehicle-photos' AND auth.uid()::text = (storage.foldername(name))[1]);