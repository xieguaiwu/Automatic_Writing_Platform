/**
 * Style DNA 分析工具
 * 分析文本的语言风格特征
 */

export interface StyleDNA {
  avg_sent_len: number;
  transitions: string[];
  quirks: string[];
  vocabulary_level: 'simple' | 'moderate' | 'high';
  sentence_structures: {
    simple: number;
    compound: number;
    complex: number;
  };
  tone: 'formal' | 'casual' | 'critical' | 'positive' | 'neutral';
}

export function analyzeStyle(text: string): StyleDNA {
  // 文本预处理
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  if (!cleanText) {
    throw new Error('输入文本为空');
  }

  // 分句（按中英文句号、问号、感叹号）
  const sentences = cleanText
    .split(/[.!?。！？]/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  if (sentences.length === 0) {
    throw new Error('无法识别句子，请检查文本格式');
  }

  // 1. 计算平均句长
  const avgSentLen = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;

  // 2. 提取过渡词
  const transitionList = [
    // 英文过渡词
    'however', 'thus', 'therefore', 'moreover', 'furthermore',
    'in contrast', 'nevertheless', 'consequently', 'hence',
    'besides', 'moreover', 'meanwhile', 'nonetheless',
    // 中文过渡词
    '然而', '因此', '此外', '所以', '不过', '总之', '但是',
    '可是', '而且', '于是', '况且', '反之', '实际上', '事实上'
  ];

  const textLower = cleanText.toLowerCase();
  const foundTransitions = transitionList.filter(word => 
    textLower.includes(word.toLowerCase())
  );

  // 3. 识别语言习惯
  const quirks: string[] = [];

  // 检测句首词偏好
  const startWords = sentences
    .map(s => {
      const words = s.split(/\s+/);
      return words[0]?.toLowerCase() || '';
    })
    .filter(w => w.length > 0);

  const startWordCounts = new Map<string, number>();
  startWords.forEach(word => {
    startWordCounts.set(word, (startWordCounts.get(word) || 0) + 1);
  });

  const totalStartWords = startWords.length;
  
  // 检测以 And/But/So 开头
  const andCount = startWordCounts.get('and') || 0;
  const butCount = startWordCounts.get('but') || 0;
  const 但是Count = startWordCounts.get('但是') || 0;
  const 然而Count = startWordCounts.get('然而') || 0;

  if ((andCount / totalStartWords > 0.2) ||
      (butCount / totalStartWords > 0.15) ||
      (但是Count / totalStartWords > 0.15) ||
      (然而Count / totalStartWords > 0.15)) {
    quirks.push('And/But starters');
  }

  // 检测标点使用偏好
  const textLen = cleanText.length;
  const dashCount = (cleanText.match(/—|--/g) || []).length;
  const semicolonCount = (cleanText.match(/;/g) || []).length;
  const colonCount = (cleanText.match(/:/g) || []).length;
  const exclamationCount = (cleanText.match(/[!！]/g) || []).length;

  if (dashCount / textLen > 0.01) quirks.push('dash-heavy');
  if (semicolonCount / textLen > 0.005) quirks.push('semicolon-heavy');
  if (colonCount / textLen > 0.005) quirks.push('colon-heavy');
  if (exclamationCount / textLen > 0.008) quirks.push('exclamation-heavy');

  // 检测短句偏好
  const shortSentences = sentences.filter(s => s.length < 15);
  if (shortSentences.length / sentences.length > 0.5) {
    quirks.push('short sentences');
  }

  // 检测长句偏好
  const longSentences = sentences.filter(s => s.length > 40);
  if (longSentences.length / sentences.length > 0.3) {
    quirks.push('long sentences');
  }

  // 4. 词汇复杂度
  const englishWords = cleanText.match(/\b[a-zA-Z]{10,}\b/g) || [];
  let vocabLevel: 'simple' | 'moderate' | 'high';
  const complexWordRatio = englishWords.length / sentences.length;

  if (complexWordRatio > 2) {
    vocabLevel = 'high';
  } else if (complexWordRatio > 0.5) {
    vocabLevel = 'moderate';
  } else {
    vocabLevel = 'simple';
  }

  // 5. 句式类型分布
  const simpleCount = sentences.filter(s => 
    !s.includes(',') && !s.includes('，') && s.length < 30
  ).length;
  const complexCount = sentences.filter(s => 
    (s.includes(',') || s.includes('，')) && (s.includes(';') || s.includes('；'))
  ).length;
  const compoundCount = sentences.length - simpleCount - complexCount;

  const sentenceStructures = {
    simple: parseFloat((simpleCount / sentences.length).toFixed(2)),
    compound: parseFloat((compoundCount / sentences.length).toFixed(2)),
    complex: parseFloat((complexCount / sentences.length).toFixed(2)),
  };

  // 6. 语气基调
  const positiveWords = ['good', 'great', 'excellent', 'wonderful', '好', '棒', '优秀'];
  const negativeWords = ['bad', 'terrible', 'awful', 'poor', '差', '糟糕', '坏'];
  const formalWords = ['therefore', 'consequently', 'moreover', '因此', '所以', '从而'];
  const casualWords = ['like', 'gonna', 'wanna', '哈哈', '呃', '那个'];

  const positiveCount = positiveWords.filter(w => textLower.includes(w.toLowerCase())).length;
  const negativeCount = negativeWords.filter(w => textLower.includes(w.toLowerCase())).length;
  const formalCount = formalWords.filter(w => textLower.includes(w.toLowerCase())).length;
  const casualCount = casualWords.filter(w => textLower.includes(w.toLowerCase())).length;

  let tone: StyleDNA['tone'];
  if (formalCount > casualCount * 2) {
    tone = 'formal';
  } else if (casualCount > formalCount * 2) {
    tone = 'casual';
  } else if (negativeCount > positiveCount * 1.5) {
    tone = 'critical';
  } else if (positiveCount > negativeCount * 1.5) {
    tone = 'positive';
  } else {
    tone = 'neutral';
  }

  return {
    avg_sent_len: parseFloat(avgSentLen.toFixed(1)),
    transitions: foundTransitions.length > 0 ? foundTransitions : ['common'],
    quirks: quirks.length > 0 ? quirks : ['standard writing'],
    vocabulary_level: vocabLevel,
    sentence_structures: sentenceStructures,
    tone,
  };
}

/**
 * 生成 Style DNA 描述
 */
export function describeStyleDNA(styleDNA: StyleDNA): string {
  const descriptions: string[] = [];

  descriptions.push(`平均句长: ${styleDNA.avg_sent_len} 字符`);
  descriptions.push(`常用过渡词: ${styleDNA.transitions.slice(0, 5).join(', ')}`);
  descriptions.push(`语言习惯: ${styleDNA.quirks.join(', ')}`);
  descriptions.push(`词汇复杂度: ${styleDNA.vocabulary_level}`);
  descriptions.push(`语气基调: ${styleDNA.tone}`);
  descriptions.push(
    `句式分布: 简单句${Math.round(styleDNA.sentence_structures.simple * 100)}%, ` +
    `复合句${Math.round(styleDNA.sentence_structures.compound * 100)}%, ` +
    `复杂句${Math.round(styleDNA.sentence_structures.complex * 100)}%`
  );

  return descriptions.join('\n');
}
