/**
 * SEO 配置
 */

export const siteConfig = {
  name: '武冈三中校园论坛',
  description: '武冈三中官方校园论坛 - 校园趣事、学习互助、表白墙、匿名树洞，让校园生活更精彩',
  url: 'https://campus-forum-iota.vercel.app',
  ogImage: 'https://campus-forum-iota.vercel.app/og-image.png',
  keywords: [
    '武冈三中',
    '校园论坛',
    '学生社区',
    '校园趣事',
    '学习互助',
    '表白墙',
    '匿名树洞',
    '武冈',
    '高中论坛'
  ],
  author: 'Alan Deng',
  locale: 'zh-CN',
  type: 'website'
}

export const postTypes = {
  campus_fun: {
    name: '校园趣事',
    description: '分享校园中的有趣见闻和快乐时光',
    emoji: '🎉'
  },
  study_help: {
    name: '学习互助',
    description: '互相帮助，共同进步',
    emoji: '📚'
  },
  confession: {
    name: '表白墙',
    description: '勇敢表达你的心意',
    emoji: '💕'
  },
  anonymous: {
    name: '匿名树洞',
    description: '倾诉心声，匿名分享',
    emoji: '🌲'
  }
}

/**
 * 生成页面标题
 */
export function generatePageTitle(pageTitle?: string): string {
  if (!pageTitle) return siteConfig.name
  return `${pageTitle} - ${siteConfig.name}`
}

/**
 * 生成页面描述
 */
export function generatePageDescription(content?: string, type?: string): string {
  if (!content) return siteConfig.description
  
  const typeInfo = type && postTypes[type as keyof typeof postTypes]
  const prefix = typeInfo ? `【${typeInfo.name}】` : ''
  const truncated = content.length > 150 ? content.slice(0, 150) + '...' : content
  
  return `${prefix}${truncated} - ${siteConfig.name}`
}

/**
 * 生成绝对 URL
 */
export function generateUrl(path: string = ''): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${siteConfig.url}${cleanPath}`
}

/**
 * 生成结构化数据（JSON-LD）
 */
export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    inLanguage: 'zh-CN',
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}/logo.png`
      }
    }
  }
}

/**
 * 生成帖子的结构化数据
 */
export function generatePostSchema(post: {
  id: string
  content: string
  created_at: string
  author?: string
  likes?: number
  post_type?: string
}) {
  const typeInfo = post.post_type && postTypes[post.post_type as keyof typeof postTypes]
  
  return {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    headline: post.content.slice(0, 100),
    articleBody: post.content,
    datePublished: post.created_at,
    author: {
      '@type': 'Person',
      name: post.author || '匿名用户'
    },
    interactionStatistic: {
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/LikeAction',
      userInteractionCount: post.likes || 0
    },
    ...(typeInfo && { genre: typeInfo.name })
  }
}

/**
 * 生成面包屑导航的结构化数据
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  }
}
