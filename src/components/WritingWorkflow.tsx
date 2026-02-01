'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, Download, Wand2, Settings, FileText, 
  Image as ImageIcon, PenTool, BookOpen, ChevronRight, 
  CheckCircle2, Loader2 
} from 'lucide-react';

type WorkflowStep = 'input' | 'article' | 'handwriting' | 'complete';

export default function WritingWorkflow() {
  const [workflowStep, setWorkflowStep] = useState<WorkflowStep>('input');
  
  // 输入状态
  const [topic, setTopic] = useState('');
  const [styleSample, setStyleSample] = useState('');
  const [handwritingImage, setHandwritingImage] = useState<string | null>(null);
  const [handwritingImageName, setHandwritingImageName] = useState('');
  
  // 生成状态
  const [article, setArticle] = useState('');
  const [styleDNA, setStyleDNA] = useState<any>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  
  // UI状态
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  
  // 参数设置
  const [temperature, setTemperature] = useState(1.2);
  const [steps, setSteps] = useState(12);
  const [guidanceScale, setGuidanceScale] = useState(2.0);
  const [maxSegmentChars, setMaxSegmentChars] = useState(200);
  const [apiEndpoint, setApiEndpoint] = useState('https://unpermeative-anamaria-famously.ngrok-free.dev/coze/generate');
  const [ollamaEndpoint, setOllamaEndpoint] = useState('https://4e9abcf1a8c0.ngrok-free.app');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);

  // 处理文件上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setHandwritingImage(event.target?.result as string);
        setHandwritingImageName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  // 清除笔迹图片
  const clearHandwritingImage = () => {
    setHandwritingImage(null);
    setHandwritingImageName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 第一步：生成文章
  const generateArticle = async () => {
    if (!topic.trim()) {
      setMessage('请输入写作主题');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setMessage('正在生成文章...');
    setArticle('');
    setStyleDNA(null);

    try {
      const response = await fetch('/api/style-mimic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic,
          style_sample: styleSample || undefined,
          ollamaEndpoint: ollamaEndpoint,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setArticle(data.article);
        setStyleDNA(data.style_dna);
        setMessage(data.message || '文章生成成功！');
        setProgress(100);
        setWorkflowStep('article');
      } else {
        setMessage(`生成失败: ${data.error || '未知错误'}`);
      }
    } catch (error) {
      setMessage(`请求失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 第二步：生成手写
  const generateHandwriting = async () => {
    if (!article) {
      setMessage('请先生成文章');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setMessage('正在转换为手写风格...');
    setResultImage(null);

    try {
      const response = await fetch('/api/handwriting/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input_text: article,
          style_image: handwritingImage || undefined,
          steps: steps,
          guidance_scale: guidanceScale,
          max_segment_chars: maxSegmentChars,
          api_endpoint: apiEndpoint || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResultImage(data.result_image_base64);
        setMessage(data.message || '手写转换成功！');
        setProgress(100);
        setWorkflowStep('handwriting');
      } else {
        setMessage(`转换失败: ${data.error || '未知错误'}`);
      }
    } catch (error) {
      setMessage(`请求失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 完整工作流
  const runCompleteWorkflow = async () => {
    if (!topic.trim()) {
      setMessage('请输入写作主题');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setMessage('正在执行完整工作流...');
    setArticle('');
    setStyleDNA(null);
    setResultImage(null);

    try {
      const response = await fetch('/api/workflow/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic,
          style_sample: styleSample || undefined,
          handwriting_image: handwritingImage || undefined,
          steps: steps,
          guidance_scale: guidanceScale,
          max_segment_chars: maxSegmentChars,
          api_endpoint: apiEndpoint || undefined,
          ollamaEndpoint: ollamaEndpoint,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setArticle(data.article);
        setStyleDNA(data.style_dna);
        setResultImage(data.result_image_base64);
        setMessage(data.message || '完整工作流执行成功！');
        setProgress(100);
        setWorkflowStep('complete');
      } else {
        setMessage(`执行失败: ${data.error || '未知错误'}`);
      }
    } catch (error) {
      setMessage(`请求失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsProcessing(false);
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

  // 重置
  const resetWorkflow = () => {
    setWorkflowStep('input');
    setArticle('');
    setStyleDNA(null);
    setResultImage(null);
    setProgress(0);
    setMessage('');
  };

  // 加载示例
  const loadExample = () => {
    setTopic('人工智能在教育中的应用与未来展望');
    setStyleSample('教育正在经历前所未有的变革。技术的进步为我们带来了新的可能性，同时也带来了新的挑战。然而，我们不能仅仅停留在对技术的盲目崇拜上，更应该思考如何将其真正融入教育的本质——培养能够独立思考、勇于创新的人。');
  };

  // 步骤指示器
  const StepIndicator = ({ step, label, icon: Icon, active, completed }: {
    step: number;
    label: string;
    icon: any;
    active?: boolean;
    completed?: boolean;
  }) => (
    <div className={`flex items-center gap-2 ${active ? 'text-primary' : 'text-muted-foreground'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
        completed ? 'bg-green-500 text-white' : active ? 'bg-primary text-white' : 'bg-muted'
      }`}>
        {completed ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );

  return (
    <div className="container mx-auto p-4 md:p-8">
      {/* 头部 */}
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          智能写作工作流
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          模仿风格 → 生成文章 → 手写转换
        </p>
      </div>

      {/* 步骤指示器 */}
      <div className="mb-8 flex items-center justify-center gap-4 md:gap-8">
        <StepIndicator
          step={1}
          label="输入设置"
          icon={FileText}
          active={workflowStep === 'input'}
          completed={workflowStep !== 'input'}
        />
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
        <StepIndicator
          step={2}
          label="生成文章"
          icon={BookOpen}
          active={workflowStep === 'article'}
          completed={workflowStep === 'handwriting' || workflowStep === 'complete'}
        />
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
        <StepIndicator
          step={3}
          label="手写转换"
          icon={PenTool}
          active={workflowStep === 'handwriting' || workflowStep === 'complete'}
          completed={workflowStep === 'complete'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 左侧：输入区域 */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              输入设置
            </CardTitle>
            <CardDescription>
              配置写作主题、风格和生成参数
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 写作主题 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="topic">写作主题</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={loadExample}
                  className="h-7 text-xs"
                  disabled={isProcessing}
                >
                  加载示例
                </Button>
              </div>
              <Input
                id="topic"
                placeholder="请输入写作主题，例如：人工智能在教育中的应用"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={isProcessing}
              />
            </div>

            {/* 风格样本 */}
            <div className="space-y-2">
              <Label>风格样本（可选）</Label>
              <Textarea
                placeholder="粘贴一段你喜欢的写作风格文本，系统会模仿这种风格生成文章..."
                value={styleSample}
                onChange={(e) => setStyleSample(e.target.value)}
                className="min-h-[120px] resize-y"
                disabled={isProcessing}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                系统会分析这段文本的语言特征，并在生成文章时模仿
              </p>
            </div>

            {/* 笔迹图片 */}
            <div className="space-y-2">
              <Label>笔迹图片（可选）</Label>
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
                  disabled={isProcessing}
                  className="flex-1"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {handwritingImageName || '选择图片'}
                </Button>
                {handwritingImage && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearHandwritingImage}
                    disabled={isProcessing}
                  >
                    清除
                  </Button>
                )}
              </div>
              {handwritingImage && (
                <div className="mt-2 rounded-lg border border-slate-200 dark:border-slate-700 p-2">
                  <img
                    src={handwritingImage}
                    alt="笔迹预览"
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
                      <Label>生成温度</Label>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {temperature.toFixed(1)}
                      </span>
                    </div>
                    <Slider
                      value={[temperature]}
                      onValueChange={(value) => setTemperature(value[0])}
                      min={0.5}
                      max={2.0}
                      step={0.1}
                      disabled={isProcessing}
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      控制文章的创造性，越高越有创意
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>手写步骤数</Label>
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
                      disabled={isProcessing}
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="advanced" className="space-y-4">
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
                    disabled={isProcessing}
                  />
                </div>

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
                    disabled={isProcessing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api-endpoint">手写生成API端点（可选）</Label>
                  <Input
                    id="api-endpoint"
                    type="text"
                    placeholder="当前已配置默认API，留空则使用本地模拟生成"
                    value={apiEndpoint}
                    onChange={(e) => setApiEndpoint(e.target.value)}
                    disabled={isProcessing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ollama-endpoint">Ollama API端点</Label>
                  <Input
                    id="ollama-endpoint"
                    type="text"
                    placeholder="当前已配置ngrok地址"
                    value={ollamaEndpoint}
                    onChange={(e) => setOllamaEndpoint(e.target.value)}
                    disabled={isProcessing}
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ollama服务地址（当前已配置ngrok远程服务）
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {/* 操作按钮 */}
            <div className="flex gap-3">
              <Button
                onClick={generateArticle}
                disabled={isProcessing || !topic.trim()}
                className="flex-1"
              >
                {isProcessing && workflowStep === 'input' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <BookOpen className="mr-2 h-4 w-4" />
                    仅生成文章
                  </>
                )}
              </Button>

              <Button
                onClick={runCompleteWorkflow}
                disabled={isProcessing || !topic.trim()}
                className="flex-1"
                variant="default"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    处理中...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    完整工作流
                  </>
                )}
              </Button>
            </div>

            {/* 状态消息 */}
            {message && (
              <div className={`rounded-lg p-3 ${
                message.includes('失败') || message.includes('错误')
                  ? 'bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-50'
                  : 'bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-50'
              }`}>
                <p className="text-sm">{message}</p>
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
              查看文章预览和手写转换结果
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 文章预览 */}
            {article && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base">生成的文章</Label>
                  {styleDNA && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {styleDNA.tone} · {styleDNA.vocabulary_level}
                    </span>
                  )}
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 max-h-[300px] overflow-y-auto">
                  <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                    {article}
                  </p>
                </div>
                
                {workflowStep === 'article' && (
                  <Button
                    onClick={generateHandwriting}
                    disabled={isProcessing}
                    className="w-full"
                  >
                    <PenTool className="mr-2 h-4 w-4" />
                    转换为手写
                  </Button>
                )}
              </div>
            )}

            {/* 手写图片 */}
            {!resultImage && !article && (
              <div className="min-h-[400px] rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="text-center p-8">
                  <ImageIcon className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-600 mb-4" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {isProcessing ? '正在处理...' : '生成的内容将显示在这里'}
                  </p>
                </div>
              </div>
            )}

            {resultImage && (
              <div className="space-y-3">
                <Label>手写作文</Label>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-2 max-h-[500px] overflow-auto">
                  <img
                    src={resultImage}
                    alt="生成的手写图片"
                    className="w-full h-auto"
                  />
                </div>
                
                <div className="flex gap-3">
                  <Button
                    onClick={downloadImage}
                    className="flex-1"
                    variant="outline"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    下载图片
                  </Button>
                  
                  <Button
                    onClick={resetWorkflow}
                    variant="ghost"
                  >
                    重新开始
                  </Button>
                </div>
              </div>
            )}

            <a ref={downloadLinkRef} className="hidden" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
