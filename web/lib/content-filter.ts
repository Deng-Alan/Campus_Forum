// 敏感词库
const BAD_WORDS = ["操", "傻X", "人渣", "sb", "尼玛", "草", "滚", "智障"];

// 友好词替换规则
const FRIENDLY_REPLACE = [
  { from: "约会", to: "一起吃食堂" },
  { from: "人渣", to: "不太友善" },
  { from: "打架", to: "切磋武艺" },
  { from: "早恋", to: "青春期懵懂" }
];

// 敏感内容（直接屏蔽）
const SENSITIVE_TOPICS = ['家庭暴力', '校园欺凌', '自残', '自杀', '毒品', '赌博'];

export interface FilterResult {
  text: string;
  hasSensitiveContent: boolean;
  replacedWords: string[];
}

export function filterContent(text: string): FilterResult {
  let processedText = text;
  const replacedWords: string[] = [];

  // 1. 检查是否有极其敏感的内容（直接屏蔽）
  const hasSensitiveContent = SENSITIVE_TOPICS.some(topic => text.includes(topic));
  if (hasSensitiveContent) {
    return { text, hasSensitiveContent: true, replacedWords: [] };
  }

  // 2. 脏话过滤 (替换为 ***)
  BAD_WORDS.forEach(word => {
    const regex = new RegExp(word, "gi");
    if (regex.test(processedText)) {
      processedText = processedText.replace(regex, "*".repeat(word.length));
      // 这里简单记录一下被替换了，实际可以更精细
    }
  });

  // 3. 友好词替换
  FRIENDLY_REPLACE.forEach(item => {
    const regex = new RegExp(item.from, "gi");
    if (regex.test(processedText)) {
      processedText = processedText.replace(regex, item.to);
      replacedWords.push(`${item.from} -> ${item.to}`);
    }
  });

  return {
    text: processedText,
    hasSensitiveContent: false,
    replacedWords
  };
}
