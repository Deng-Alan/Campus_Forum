import { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/seo'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1'

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

  // 动态获取最新的帖子（最多 1000 条）
  try {
    const res = await fetch(`${API_BASE_URL}/posts?page=1&size=1000`)
    const json: any = await res.json()

    if (json.code === 200 && json.data?.list) {
      const posts = json.data.list as { id: string; createdAt: string }[]
      const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
        url: `${baseUrl}/post/${post.id}`,
        lastModified: new Date(post.createdAt),
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
