-- 创建系统设置表
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 插入默认配置：每日发帖上限 = 3
INSERT INTO public.system_settings (key, value, description)
VALUES ('daily_post_limit', '3', '每个账号每日发帖上限次数')
ON CONFLICT (key) DO NOTHING;

-- 开启 RLS（虽然是公开读，但写入需要权限）
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 删除旧策略（如果存在），然后重新创建
DROP POLICY IF EXISTS "Allow public read settings" ON public.system_settings;
DROP POLICY IF EXISTS "Allow authenticated update settings" ON public.system_settings;

-- 允许所有人读取设置（前台需要知道上限）
CREATE POLICY "Allow public read settings" ON public.system_settings
FOR SELECT USING (true);

-- 仅允许 service_role 或特定管理员修改（这里简化为允许所有，后台配合鉴权）
-- 实际生产环境建议只允许 authenticated role 且有 admin 标记的用户修改
CREATE POLICY "Allow authenticated update settings" ON public.system_settings
FOR UPDATE USING (true) WITH CHECK (true);
