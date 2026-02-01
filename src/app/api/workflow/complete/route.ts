import { NextRequest, NextResponse } from 'next/server';

/**
 * 预处理文本：每40个字符换行
 * 智能地在最近的空格处换行，避免截断单词
 */
function preprocessTextForHandwriting(text: string, lineLength: number = 40): string {
  if (!text) return '';

  // 移除多余的空格和换行符
  const cleanedText = text.replace(/\s+/g, ' ').trim();

  const result: string[] = [];
  let currentLine = '';

  for (const word of cleanedText.split(' ')) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;

    if (testLine.length <= lineLength) {
      // 单词可以放入当前行
      currentLine = testLine;
    } else {
      // 单词无法放入当前行
      if (currentLine) {
        // 保存当前行并开始新行
        result.push(currentLine);
        currentLine = word;
      } else {
        // 单词本身就超过一行，强制分割
        for (let i = 0; i < word.length; i += lineLength) {
          result.push(word.slice(i, i + lineLength));
        }
        currentLine = '';
      }
    }
  }

  // 添加最后一行
  if (currentLine) {
    result.push(currentLine);
  }

  return result.join('\n');
}

/**
 * 完整工作流：Style Mimic + Handwriting Generator
 * 1. 根据主题和风格样本生成文章
 * 2. 预处理文章文本（每40字符换行）
 * 3. 将文章转换为手写风格
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      topic,
      style_sample,
      handwriting_image,
      steps = 12,
      guidance_scale = 2.0,
      max_segment_chars = 200,
      api_endpoint,
      ollamaEndpoint = 'https://4e9abcf1a8c0.ngrok-free.app',
    } = body;

    // 参数验证
    if (!topic || !topic.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'topic 不能为空',
          article: null,
          result_image_base64: null,
        },
        { status: 400 }
      );
    }

    console.log('Starting complete workflow...');
    console.log(`Topic: ${topic}`);
    console.log(`Has style sample: ${!!style_sample}`);
    console.log(`Has handwriting image: ${!!handwriting_image}`);

    // 步骤 1: Style Mimic - 生成文章
    console.log('\n=== Step 1: Style Mimic ===');
    const styleMimicResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000'}/api/style-mimic`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic,
          style_sample: style_sample || undefined,
          ollamaEndpoint: ollamaEndpoint,
        }),
      }
    );

    if (!styleMimicResponse.ok) {
      const errorData = await styleMimicResponse.json();
      throw new Error(`Style Mimic failed: ${errorData.error || 'Unknown error'}`);
    }

    const styleMimicData = await styleMimicResponse.json();

    if (!styleMimicData.success) {
      throw new Error(`Style Mimic failed: ${styleMimicData.error || 'Unknown error'}`);
    }

    const article = styleMimicData.article;
    const styleDNA = styleMimicData.style_dna;

    console.log(`Article generated: ${article.length} characters`);
    if (styleDNA) {
      console.log(`Style DNA applied: ${styleDNA.tone} tone, ${styleDNA.vocabulary_level} vocabulary`);
    }

    // 步骤 1.5: 预处理文本 - 每40字符换行
    console.log('\n=== Step 1.5: Text Preprocessing ===');
    const preprocessedText = preprocessTextForHandwriting(article, 40);
    console.log(`Text preprocessed: ${article.length} -> ${preprocessedText.length} characters (with line breaks)`);

    // 步骤 2: Handwriting Generator - 转换为手写风格
    console.log('\n=== Step 2: Handwriting Generator ===');
    
    const handwritingResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000'}/api/handwriting/generate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input_text: preprocessedText,
          style_image: handwriting_image || undefined,
          steps: steps,
          guidance_scale: guidance_scale,
          max_segment_chars: max_segment_chars,
          api_endpoint: api_endpoint || undefined,
        }),
      }
    );

    if (!handwritingResponse.ok) {
      const errorData = await handwritingResponse.json();
      throw new Error(`Handwriting generation failed: ${errorData.error || 'Unknown error'}`);
    }

    const handwritingData = await handwritingResponse.json();

    if (!handwritingData.success) {
      throw new Error(`Handwriting generation failed: ${handwritingData.error || 'Unknown error'}`);
    }

    console.log(`Handwriting image generated: ${handwritingData.segments_count} segments`);

    // 返回完整结果
    const response = {
      success: true,
      article: article,
      preprocessed_text: preprocessedText,
      result_image_base64: handwritingData.result_image_base64,
      style_dna: styleDNA,
      message: '完整工作流执行成功：文章生成 + 文本预处理 + 手写转换',
      steps: {
        style_mimic: {
          success: true,
          style_dna_applied: !!styleDNA,
        },
        preprocessing: {
          success: true,
          line_length: 40,
        },
        handwriting: {
          success: true,
          segments_count: handwritingData.segments_count,
        },
      },
    };

    console.log('\n=== Complete workflow finished successfully ===');
    return NextResponse.json(response);

  } catch (error) {
    console.error('Complete workflow failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        article: null,
        result_image_base64: null,
        steps: null,
      },
      { status: 500 }
    );
  }
}
