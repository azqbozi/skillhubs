/**
 * 技能详情获取与缓存模块
 * 从 skills.sh 详情页获取 SKILL.md 描述并缓存
 */

/** 描述缓存：key 为 `${source}/${skillId}` */
const descriptionCache = new Map<string, string>();

/**
 * 生成缓存 key
 * @param source - 仓库路径，如 vercel-labs/skills
 * @param skillId - 技能 ID，如 find-skills
 */
function getCacheKey(source: string, skillId: string): string {
  return `${source}/${skillId}`;
}

/**
 * 从 HTML 文本中提取 SKILL.md 描述
 * skills.sh 详情页结构中，SKILL.md 内容通常在页面中渲染
 * 提取策略：获取第一个 # 标题后的第一段文字作为描述
 * @param html - 页面 HTML
 * @returns 提取的描述文本
 */
function parseDescriptionFromHtml(html: string): string {
  try {
    // 方法 1：使用正则提取 # 标题后的描述段落
    // 通常格式为：# Skill Name\n\nDescription paragraph...
    
    // 移除 HTML 标签，获取纯文本
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // 移除 script
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // 移除 style
      .replace(/<[^>]+>/g, '\n') // HTML 标签替换为换行
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#x3C;/g, '<')
      .replace(/\n{3,}/g, '\n\n'); // 合并多余换行

    // 查找 SKILL.md 标记后的内容
    const skillMdIndex = textContent.indexOf('SKILL.md');
    if (skillMdIndex !== -1) {
      const afterSkillMd = textContent.substring(skillMdIndex + 8);
      
      // 查找第一个标题（# 开头的行）
      const titleMatch = afterSkillMd.match(/^#\s+(.+)$/m);
      if (titleMatch) {
        const titleIndex = afterSkillMd.indexOf(titleMatch[0]);
        const afterTitle = afterSkillMd.substring(titleIndex + titleMatch[0].length);
        
        // 获取标题后的第一段非空文本
        const lines = afterTitle.split('\n').map(l => l.trim()).filter(l => l);
        
        // 跳过可能的副标题或空行，获取描述段落
        let description = '';
        for (const line of lines) {
          // 跳过标题行
          if (line.startsWith('#')) continue;
          // 跳过列表项开头的行（可能是目录）
          if (line.startsWith('*') || line.startsWith('-') || line.startsWith('|')) continue;
          // 跳过代码块
          if (line.startsWith('```') || line.startsWith('`')) continue;
          
          // 找到描述段落
          if (line.length > 20) {
            description = line;
            break;
          }
        }
        
        if (description) {
          // 截断过长的描述
          return description.length > 200 
            ? description.substring(0, 200) + '...' 
            : description;
        }
      }
    }

    // 备用方案：查找页面中的描述性文本
    const descMatch = textContent.match(/This skill[^.]+\./i);
    if (descMatch) {
      return descMatch[0];
    }

    return '点击查看详情';
  } catch {
    return '点击查看详情';
  }
}

/**
 * 获取技能描述
 * 先查缓存，未命中则请求详情页并解析
 * @param source - 仓库路径，如 vercel-labs/skills
 * @param skillId - 技能 ID，如 find-skills
 * @returns 描述文本
 */
export async function fetchSkillDescription(
  source: string,
  skillId: string
): Promise<string> {
  const cacheKey = getCacheKey(source, skillId);

  // 检查缓存
  const cached = descriptionCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // 构建详情页 URL（通过 Vite 代理解决 CORS）
    const url = `/api/skills-sh/${source}/${skillId}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`请求失败: ${response.status}`);
    }

    const html = await response.text();
    const description = parseDescriptionFromHtml(html);

    // 写入缓存
    descriptionCache.set(cacheKey, description);

    return description;
  } catch (err) {
    console.error('获取技能描述失败:', err);
    return '获取描述失败，请稍后重试';
  }
}

/**
 * 清除描述缓存
 * @param source - 可选，指定仓库路径
 * @param skillId - 可选，指定技能 ID
 */
export function clearDescriptionCache(source?: string, skillId?: string): void {
  if (source && skillId) {
    descriptionCache.delete(getCacheKey(source, skillId));
  } else {
    descriptionCache.clear();
  }
}

/**
 * 获取缓存的描述（同步，仅返回已缓存的）
 * @param source - 仓库路径
 * @param skillId - 技能 ID
 * @returns 缓存的描述或 undefined
 */
export function getCachedDescription(
  source: string,
  skillId: string
): string | undefined {
  return descriptionCache.get(getCacheKey(source, skillId));
}
