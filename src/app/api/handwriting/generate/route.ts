import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

// 智能文本分段
function splitText(text: string, maxChars: number = 200): string[] {
  if (text.length <= maxChars) {
    return [text];
  }

  const segments: string[] = [];
  let currentSegment = '';

  // 按句号分割
  let sentences = text.split('。');
  sentences = sentences.map((s, i) => 
    i < sentences.length - 1 ? s + '。' : s
  );

  // 如果没有句号，则按逗号分割
  if (sentences.length <= 1) {
    sentences = text.split('，');
    sentences = sentences.map((s, i) =>
      i < sentences.length - 1 ? s + '，' : s
    );
  }

  // 如果还没有分割点，则按字符数强制分割
  if (sentences.length <= 1) {
    for (let i = 0; i < text.length; i += maxChars) {
      segments.push(text.slice(i, i + maxChars));
    }
    return segments;
  }

  for (const sentence of sentences) {
    if ((currentSegment + sentence).length <= maxChars) {
      currentSegment += sentence;
    } else {
      if (currentSegment) {
        segments.push(currentSegment);
      }
      currentSegment = sentence;
    }
  }

  if (currentSegment) {
    segments.push(currentSegment);
  }

  // 最后检查每段长度
  const finalSegments: string[] = [];
  for (const segment of segments) {
    if (segment.length > maxChars) {
      for (let i = 0; i < segment.length; i += maxChars) {
        finalSegments.push(segment.slice(i, i + maxChars));
      }
    } else {
      finalSegments.push(segment);
    }
  }

  return finalSegments;
}

// Base64转Buffer
function base64ToBuffer(base64Str: string): Buffer {
  const base64Data = base64Str.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
}

// Buffer转Base64
function bufferToBase64(buffer: Buffer, mimeType: string = 'image/png'): string {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

// 拼接图片（垂直拼接）
async function concatenateImages(imageBuffers: Buffer[]): Promise<Buffer> {
  if (imageBuffers.length === 0) {
    throw new Error('No images to concatenate');
  }

  if (imageBuffers.length === 1) {
    return imageBuffers[0];
  }

  // 计算所有图片的尺寸
  const images = await Promise.all(
    imageBuffers.map(async (buffer) => {
      const metadata = await sharp(buffer).metadata();
      return {
        buffer,
        width: metadata.width || 0,
        height: metadata.height || 0,
      };
    })
  );

  // 找出最大宽度和总高度
  const maxWidth = Math.max(...images.map(img => img.width));
  const totalHeight = images.reduce((sum, img) => sum + img.height, 0);

  // 创建画布
  const composites = images.map((img, index) => {
    const yOffset = images
      .slice(0, index)
      .reduce((sum, i) => sum + i.height, 0);
    
    // 如果图片宽度小于最大宽度，居中处理
    const xOffset = Math.floor((maxWidth - img.width) / 2);
    
    return {
      input: img.buffer,
      left: xOffset,
      top: yOffset,
    };
  });

  // 创建白色背景画布并拼接图片
  const result = await sharp({
    create: {
      width: maxWidth,
      height: totalHeight,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite(composites)
    .png()
    .toBuffer();

  return result;
}

// 生成手写图片（模拟函数，实际应该调用真实API）
async function generateHandwritingSegment(
  inputText: string,
  styleImage?: string,
  steps: number = 12,
  guidanceScale: number = 2.0,
  apiEndpoint?: string
): Promise<Buffer> {
  // TODO: 这里应该调用真实的手写生成API
  // 目前创建一个模拟的图片作为占位
  
  // 如果提供了风格图片，使用它；否则创建一个简单的文本图片
  if (apiEndpoint) {
    // 调用外部API
    try {
      // 处理 style_image：去除 data:image/xxx;base64, 前缀，只保留纯Base64数据
      let cleanStyleImage = styleImage;
      if (styleImage && styleImage.startsWith('data:')) {
        cleanStyleImage = styleImage.replace(/^data:image\/\w+;base64,/, '');
      }

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input_text: inputText,
          style_image: cleanStyleImage,
          steps: steps,
          guidance_scale: guidanceScale,
        }),
        // 不设置超时，让请求一直等待
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.result_image_base64) {
        return base64ToBuffer(result.result_image_base64);
      } else {
        throw new Error(result.error || 'Generation failed');
      }
    } catch (error) {
      console.error('API call failed:', error);
      // 如果API调用失败，返回占位图片
    }
  }

  // 创建占位图片
  // 处理文本：移除HTML标签，处理换行
  const cleanText = inputText
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, ' ');

  const svgText = `
    <svg width="800" height="${Math.max(200, Math.ceil(cleanText.length / 40) * 20)}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="white"/>
      <text x="20" y="40" font-family="cursive, serif" font-size="20" fill="#333">
        ${cleanText}
      </text>
    </svg>
  `;

  return sharp(Buffer.from(svgText)).png().toBuffer();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      input_text,
      style_image,
      steps = 12,
      guidance_scale = 2.0,
      api_endpoint = 'https://unpermeative-anamaria-famously.ngrok-free.dev/coze/generate',
      max_segment_chars = 200,
    } = body;

    // 参数验证
    if (!input_text || !input_text.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'input_text 不能为空',
          result_image_base64: null,
          result_image_url: null,
          message: '参数错误',
          segments_count: null,
        },
        { status: 400 }
      );
    }

    console.log(`开始处理文本，长度: ${input_text.length} 字符`);

    // 检测文本长度，决定是否需要分段
    const segments = splitText(input_text, max_segment_chars);
    
    console.log(`文本已分割为 ${segments.length} 个段落`);

    // 生成每个段落的图片
    const imageBuffers: Buffer[] = [];
    
    for (let i = 0; i < segments.length; i++) {
      console.log(`正在处理第 ${i + 1}/${segments.length} 段...`);
      
      const segment = segments[i];
      const imageBuffer = await generateHandwritingSegment(
        segment,
        style_image,
        steps,
        guidance_scale,
        api_endpoint
      );
      
      imageBuffers.push(imageBuffer);
    }

    console.log('正在拼接所有段落的图片...');

    // 拼接所有段落的图片
    let finalImageBuffer: Buffer;
    if (imageBuffers.length === 1) {
      finalImageBuffer = imageBuffers[0];
    } else {
      finalImageBuffer = await concatenateImages(imageBuffers);
    }

    const resultImageBase64 = bufferToBase64(finalImageBuffer, 'image/png');

    const response = {
      success: true,
      result_image_url: null,
      result_image_base64: resultImageBase64,
      message: segments.length > 1 
        ? `长文本处理完成，共${segments.length}个段落` 
        : '手写图片生成成功',
      error: null,
      segments_count: segments.length,
    };

    console.log('生成成功！');
    return NextResponse.json(response);

  } catch (error) {
    console.error('生成失败:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        result_image_base64: null,
        result_image_url: null,
        message: '生成失败',
        segments_count: null,
      },
      { status: 500 }
    );
  }
}
