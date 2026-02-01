import { NextRequest, NextResponse } from 'next/server';
import { analyzeStyle, StyleDNA, describeStyleDNA } from '@/lib/style-analyzer';

interface MimicRequest {
  style_sample: string;
  topic: string;
  instruction?: string;
  ollamaEndpoint?: string;
}

interface MimicResponse {
  success: boolean;
  article?: string;
  style_dna?: StyleDNA | null;
  error?: string;
}

/**
 * 调用 Ollama API（带重试和错误处理）
 */
async function callOllamaAPI(
  ollamaEndpoint: string,
  requestBody: any,
  maxRetries: number = 2
): Promise<any> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`${ollamaEndpoint}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        lastError = new Error(`Ollama API error (${response.status}): ${response.statusText}`);
        console.error(`Attempt ${attempt} - Ollama API error:`, errorText);
        if (attempt < maxRetries) {
          console.log(`Retrying... (${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
        throw lastError;
      }

      // 检查响应内容类型
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const errorText = await response.text();
        console.error(`Attempt ${attempt} - Unexpected content type: ${contentType}`);
        console.error(`Response preview:`, errorText.substring(0, 300));

        // 如果是 ngrok 警告页面，重试
        if (errorText.includes('<!DOCTYPE') || errorText.includes('ngrok')) {
          console.log('Detected ngrok warning page, retrying...');
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
            continue;
          }
        }

        throw new Error(
          `Ollama API returned unexpected content type: ${contentType}. ` +
          `This might be a ngrok warning page. Please visit ${ollamaEndpoint} in your browser first.`
        );
      }

      const data = await response.json();
      return data;

    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt} - Error:`, lastError.message);
      if (attempt < maxRetries) {
        console.log(`Retrying... (${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  throw lastError || new Error('Failed to call Ollama API');
}

/**
 * 构建 Ollama prompt
 */
function buildPrompt(instruction: string, outlinePoint: string, styleDNA: StyleDNA | null, previousContext?: string): string {
  const styleDescription = styleDNA
    ? `> - Style_DNA: ${JSON.stringify(styleDNA)}`
    : '> - Style_DNA: [No style sample provided]';

  const contextPart = previousContext
    ? `Previous_Context: ${previousContext}`
    : 'Previous_Context: [First paragraph - no previous context]';

  const inputContext = `${styleDescription}

Current_Outline_Point: ${outlinePoint}
${contextPart}`;

  return `### Instruction:
${instruction}

### Input:
${inputContext}

### Response:
`;
}

/**
 * 生成段落大纲
 */
async function generateOutline(
  topic: string,
  styleDNA: StyleDNA | null,
  ollamaEndpoint: string
): Promise<Array<{ index: number; point: string; connection: string }>> {
  const styleDescription = styleDNA 
    ? `\n\nStyle DNA to follow:\n${describeStyleDNA(styleDNA)}`
    : '';

  const prompt = `Create a structured outline for an article about: "${topic}"${styleDescription}

Return ONLY valid JSON format with the following structure:
[
  {
    "index": 1,
    "point": "Main point description",
    "connection": "How it connects to previous paragraph"
  }
]
Generate 5-7 logical paragraphs.`;

  const data = await callOllamaAPI(ollamaEndpoint, {
    model: 'ghostwriter',
    prompt: prompt,
    stream: false,
    options: {
      temperature: 0.7,
      top_p: 0.95,
      repeat_penalty: 1.2,
      presence_penalty: 0.8,
      stop: ['###', '</s>']
    }
  });

  const content = data.response?.trim() || '';

  // 尝试解析JSON
  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    const outline = JSON.parse(jsonMatch[0]);
    return outline;
  } catch (error) {
    console.error('Failed to parse outline:', content);
    // 返回默认大纲
    return [
      { index: 1, point: `Introduction about ${topic}`, connection: 'Start' },
      { index: 2, point: `First key aspect of ${topic}`, connection: 'Continue' },
      { index: 3, point: `Second key aspect of ${topic}`, connection: 'Continue' },
      { index: 4, point: `Third key aspect of ${topic}`, connection: 'Continue' },
      { index: 5, point: `Conclusion about ${topic}`, connection: 'Wrap up' },
    ];
  }
}

/**
 * 生成单个段落
 */
async function generateParagraph(
  outlinePoint: string,
  styleDNA: StyleDNA | null,
  previousContext: string,
  instruction: string,
  ollamaEndpoint: string
): Promise<string> {
  const prompt = buildPrompt(
    instruction,
    outlinePoint,
    styleDNA,
    previousContext
  );

  const data = await callOllamaAPI(ollamaEndpoint, {
    model: 'ghostwriter',
    prompt: prompt,
    stream: false,
    options: {
      temperature: 1.5,
      top_p: 0.95,
      repeat_penalty: 1.2,
      presence_penalty: 0.8,
      stop: ['###', '</s>']
    }
  });

  return data.response?.trim() || '';
}

/**
 * 生成完整文章
 */
async function generateFullArticle(
  topic: string,
  styleDNA: StyleDNA | null,
  instruction: string,
  ollamaEndpoint: string
): Promise<string> {
  // 1. 生成大纲
  console.log('Generating outline...');
  const outline = await generateOutline(topic, styleDNA, ollamaEndpoint);
  console.log('Outline generated:', outline.length, 'paragraphs');

  // 2. 逐段生成内容
  const paragraphs: string[] = [];
  let previousContext = '';

  for (let i = 0; i < outline.length; i++) {
    console.log(`Generating paragraph ${i + 1}/${outline.length}...`);
    
    const paragraph = await generateParagraph(
      outline[i].point,
      styleDNA,
      previousContext,
      instruction,
      ollamaEndpoint
    );
    
    paragraphs.push(paragraph);
    previousContext = paragraph.slice(0, 100); // 使用前100字符作为上下文
  }

  // 3. 合并为完整文章
  const fullArticle = paragraphs.join('\n\n');
  console.log('Article generation complete');
  
  return fullArticle;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      style_sample,
      topic,
      instruction = 'Write the next logical unit in the user\'s style based on the outline point and previous context.',
      ollamaEndpoint = 'https://4e9abcf1a8c0.ngrok-free.app',
    } = body;

    // 参数验证
    if (!topic || !topic.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'topic 不能为空',
          article: null,
          style_dna: null,
        },
        { status: 400 }
      );
    }

    console.log(`Starting style mimic for topic: ${topic}`);
    console.log(`Using Ollama endpoint: ${ollamaEndpoint}`);

    // 1. 如果有风格样本，分析 Style DNA
    let styleDNA: StyleDNA | null = null;
    if (style_sample && style_sample.trim()) {
      console.log('Analyzing style DNA...');
      styleDNA = analyzeStyle(style_sample);
      console.log('Style DNA:', styleDNA);
    }

    // 2. 生成完整文章
    console.log('Generating article...');
    const article = await generateFullArticle(
      topic.trim(),
      styleDNA,
      instruction,
      ollamaEndpoint
    );

    const response = {
      success: true,
      article: article,
      style_dna: styleDNA,
      message: styleDNA 
        ? '文章生成成功（已应用风格模仿）'
        : '文章生成成功',
    };

    console.log('Style mimic complete');
    return NextResponse.json(response);

  } catch (error) {
    console.error('Style mimic failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        article: null,
        style_dna: null,
      },
      { status: 500 }
    );
  }
}
