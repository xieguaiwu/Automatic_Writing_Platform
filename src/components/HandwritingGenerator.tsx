'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Download, Wand2, Settings, FileText, Image as ImageIcon } from 'lucide-react';

export default function HandwritingGenerator() {
  const [inputText, setInputText] = useState('');
  const [styleImage, setStyleImage] = useState<string | null>(null);
  const [styleImageName, setStyleImageName] = useState('');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [segmentsCount, setSegmentsCount] = useState<number | null>(null);
  
  // 参数设置
  const [steps, setSteps] = useState(12);
  const [guidanceScale, setGuidanceScale] = useState(2.0);
  const [maxSegmentChars, setMaxSegmentChars] = useState(200);
  const [apiEndpoint, setApiEndpoint] = useState('https://unpermeative-anamaria-famously.ngrok-free.dev/coze/generate');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);

  // 处理文件上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setStyleImage(event.target?.result as string);
        setStyleImageName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  // 清除风格图片
  const clearStyleImage = () => {
    setStyleImage(null);
    setStyleImageName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 生成手写图片
  const generateHandwriting = async () => {
    if (!inputText.trim()) {
      setMessage('请输入要转换的文本');
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setMessage('正在处理...');
    setResultImage(null);
    setSegmentsCount(null);

    try {
      const response = await fetch('/api/handwriting/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input_text: inputText,
          style_image: styleImage || undefined,
          steps: steps,
          guidance_scale: guidanceScale,
          max_segment_chars: maxSegmentChars,
          api_endpoint: apiEndpoint || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResultImage(data.result_image_base64);
        setMessage(data.message || '生成成功！');
        setSegmentsCount(data.segments_count || 1);
        setProgress(100);
      } else {
        setMessage(`生成失败: ${data.error || '未知错误'}`);
        setProgress(0);
      }
    } catch (error) {
      setMessage(`请求失败: ${error instanceof Error ? error.message : '未知错误'}`);
      setProgress(0);
    } finally {
      setIsGenerating(false);
    }
  };

  // 下载图片
  const downloadImage = () => {
    if (resultImage && downloadLinkRef.current) {
      downloadLinkRef.current.href = resultImage;
      downloadLinkRef.current.download = `handwriting_${Date.now()}.png`;
      downloadLinkRef.current.click();
    }
  };

  // 使用示例文本
  const loadExampleText = () => {
    setInputText("There's no escaping: the future of education is being rewritten by the math itself. Every decision made by a teacher, every interaction between student and screen, can be predicted and outmaneuvered by an algorithm on the rise. This isn't a threat; it's a law. We're already seeing this play out with adaptive learning platforms like DreamBox and Knewton, where each mistake leads to a hyper-personalized next clue");
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      {/* 头部 */}
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          手写生成器
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          将文本转换为手写风格图片
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 左侧：输入区域 */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              输入设置
            </CardTitle>
            <CardDescription>
              输入文本并选择生成参数
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 文本输入 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="text-input">输入文本</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={loadExampleText}
                  className="h-7 text-xs"
                >
                  加载示例文本
                </Button>
              </div>
              <Textarea
                id="text-input"
                placeholder="请输入要转换为手写的文本..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="min-h-[200px] resize-y"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                当前字符数: {inputText.length} / 建议分段阈值: {maxSegmentChars}
              </p>
            </div>

            {/* 风格图片 */}
            <div className="space-y-2">
              <Label>风格图片（可选）</Label>
              <div className="flex items-center gap-3">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isGenerating}
                  className="flex-1"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {styleImageName || '选择图片'}
                </Button>
                {styleImage && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearStyleImage}
                    disabled={isGenerating}
                  >
                    清除
                  </Button>
                )}
              </div>
              {styleImage && (
                <div className="mt-2 rounded-lg border border-slate-200 dark:border-slate-700 p-2">
                  <img
                    src={styleImage}
                    alt="风格预览"
                    className="mx-auto max-h-32 object-contain"
                  />
                </div>
              )}
            </div>

            {/* 参数设置 */}
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">基本参数</TabsTrigger>
                <TabsTrigger value="advanced">高级设置</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>生成步骤数</Label>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {steps}
                      </span>
                    </div>
                    <Slider
                      value={[steps]}
                      onValueChange={(value) => setSteps(value[0])}
                      min={8}
                      max={20}
                      step={1}
                      disabled={isGenerating}
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      越高越好但越慢，建议 8-15
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>引导比例</Label>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {guidanceScale.toFixed(1)}
                      </span>
                    </div>
                    <Slider
                      value={[guidanceScale]}
                      onValueChange={(value) => setGuidanceScale(value[0])}
                      min={1.0}
                      max={5.0}
                      step={0.1}
                      disabled={isGenerating}
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      控制风格强度，建议 1.5-3.0
                    </p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="advanced" className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>分段阈值</Label>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {maxSegmentChars} 字符
                    </span>
                  </div>
                  <Slider
                    value={[maxSegmentChars]}
                    onValueChange={(value) => setMaxSegmentChars(value[0])}
                    min={100}
                    max={500}
                    step={50}
                    disabled={isGenerating}
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    超过此长度的文本将自动分段处理
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api-endpoint">API端点（可选）</Label>
                  <Input
                    id="api-endpoint"
                    type="text"
                    placeholder="例如: https://api.example.com/generate"
                    value={apiEndpoint}
                    onChange={(e) => setApiEndpoint(e.target.value)}
                    disabled={isGenerating}
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    当前默认API已配置，留空则使用本地模拟生成
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {/* 生成按钮 */}
            <Button
              onClick={generateHandwriting}
              disabled={isGenerating || !inputText.trim()}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Wand2 className="mr-2 h-5 w-5 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-5 w-5" />
                  生成手写图片
                </>
              )}
            </Button>

            {/* 状态消息 */}
            {message && (
              <div className={`rounded-lg p-3 ${
                message.includes('失败') || message.includes('错误')
                  ? 'bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-50'
                  : 'bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-50'
              }`}>
                <p className="text-sm">{message}</p>
                {segmentsCount !== null && (
                  <p className="text-xs mt-1 opacity-75">
                    共处理 {segmentsCount} 个段落
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 右侧：结果区域 */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              生成结果
            </CardTitle>
            <CardDescription>
              查看和下载生成的手写图片
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 结果预览 */}
            <div className="min-h-[400px] rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-center overflow-auto">
              {resultImage ? (
                <img
                  src={resultImage}
                  alt="生成的手写图片"
                  className="max-w-full h-auto"
                />
              ) : (
                <div className="text-center p-8">
                  <ImageIcon className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-600 mb-4" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {isGenerating ? '正在生成...' : '生成的图片将显示在这里'}
                  </p>
                </div>
              )}
            </div>

            {/* 下载按钮 */}
            <Button
              onClick={downloadImage}
              disabled={!resultImage || isGenerating}
              className="w-full"
              variant="outline"
            >
              <Download className="mr-2 h-4 w-4" />
              下载图片
            </Button>

            <a ref={downloadLinkRef} className="hidden" />
          </CardContent>
        </Card>
      </div>

      {/* 底部说明 */}
      <div className="mt-8 text-center">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          💡 提示：长文本会自动分段处理以优化性能
        </p>
      </div>
    </div>
  );
}
