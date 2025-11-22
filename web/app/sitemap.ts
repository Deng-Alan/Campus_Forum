import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { siteConfig } from '@/lib/seo'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url

  // 静态页面
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${baseUrl}/my-posts`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ]

  // 动态获取最新的帖子
  try {
    const { data: posts } = await supabase
      .from('posts')
      .select('id, created_at')
      .order('created_at', { ascending: false })
      .limit(1000) // 限制 1000 个帖子

    if (posts && posts.length > 0) {
      const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
        url: `${baseUrl}/post/${post.id}`,
        lastModified: new Date(post.created_at),
        changeFrequency: 'weekly',
        priority: 0.6,
      }))

      routes.push(...postRoutes)
    }
  } catch (error) {
    console.error('Error generating sitemap:', error)
  }

  return routes
}
