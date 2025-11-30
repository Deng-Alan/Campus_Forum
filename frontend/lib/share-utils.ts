/**
 * 分享工具函数
 */

export interface ShareResult {
  success: boolean
  message: string
}

/**
 * 复制文本到剪贴板
 */
export async function copyToClipboard(text: string): Promise<ShareResult> {
  try {
    // 优先使用现代 Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return { success: true, message: '链接已复制到剪贴板' }
    }
    
    // 降级方案：使用 document.execCommand
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    
    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)
    
    if (successful) {
      return { success: true, message: '链接已复制到剪贴板' }
    } else {
      throw new Error('复制失败')
    }
  } catch (err) {
    console.error('Copy failed:', err)
    return { success: false, message: '复制失败，请手动复制链接' }
  }
}

/**
 * 生成帖子分享链接
 */
export function generatePostShareLink(postId: string): string {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_SITE_URL || 'https://campus-forum-iota.vercel.app'
  return `${baseUrl}/post/${postId}`
}

/**
 * 生成分享文案
 */
export function generateShareText(postContent: string, postType: string): string {
  const typeNames: Record<string, string> = {
    campus_fun: '校园趣事',
    study_help: '学习互助',
    confession: '表白墙',
    anonymous: '匿名树洞'
  }
  
  const typeName = typeNames[postType] || '帖子'
  const preview = postContent.length > 50 
    ? postContent.slice(0, 50) + '...' 
    : postContent
  
  return `【${typeName}】${preview} - 来自武冈三中校园论坛`
}

/**
 * 分享帖子（复制链接 + 文案）
 */
export async function sharePost(postId: string, postContent: string, postType: string): Promise<ShareResult> {
  const link = generatePostShareLink(postId)
  const text = generateShareText(postContent, postType)
  const fullText = `${text}\n\n${link}`
  
  return await copyToClipboard(fullText)
}
