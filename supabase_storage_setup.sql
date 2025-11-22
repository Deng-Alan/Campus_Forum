-- ================================================
-- 武冈三中校园论坛 - Supabase Storage 配置
-- ================================================
-- 功能：配置图片上传存储桶及访问策略
-- 创建日期：2025-11-21
-- ================================================

-- 注意：这个脚本需要在 Supabase Dashboard 的 Storage 页面手动操作，或通过 SQL 执行
-- 如果 SQL 执行失败，请按照以下步骤在 Supabase Dashboard 手动创建：
-- 1. 进入 Storage 页面
-- 2. 点击 "New bucket"
-- 3. Bucket name: images
-- 4. Public bucket: 勾选（允许公开访问）
-- 5. 保存后设置以下策略

-- ================================================
-- 创建公开存储桶（如果不存在）
-- ================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- 存储桶访问策略
-- ================================================

-- 删除旧策略（如果存在）
DROP POLICY IF EXISTS "Allow public upload to posts folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow public upload to avatars folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;

-- 策略 1：允许任何人上传图片到 posts 文件夹
CREATE POLICY "Allow public upload to posts folder"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'images' AND (storage.foldername(name))[1] = 'posts');

-- 策略 2：允许任何人上传头像到 avatars 文件夹
CREATE POLICY "Allow public upload to avatars folder"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'images' AND (storage.foldername(name))[1] = 'avatars');

-- 策略 3：允许任何人读取所有图片（公开访问）
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'images');

-- 策略 3：允许用户删除自己上传的图片（可选，暂不启用）
-- CREATE POLICY "Allow users to delete own images"
-- ON storage.objects
-- FOR DELETE
-- TO public
-- USING (bucket_id = 'images');

-- ================================================
-- 验证配置
-- ================================================
-- 执行完成后，可以在 Supabase Dashboard > Storage > images 中看到新建的 bucket
-- 策略可以在 Storage > images > Policies 中查看
