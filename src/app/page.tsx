import WritingWorkflow from '@/components/WritingWorkflow';
import HandwritingGenerator from '@/components/HandwritingGenerator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto p-4 md:p-8">
        {/* 头部 */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            智能写作平台
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            风格模仿 · 文章生成 · 手写转换
          </p>
        </div>

        {/* 功能切换 */}
        <Tabs defaultValue="workflow" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="workflow" className="text-base">
              完整工作流
            </TabsTrigger>
            <TabsTrigger value="handwriting" className="text-base">
              仅手写转换
            </TabsTrigger>
          </TabsList>

          <TabsContent value="workflow">
            <WritingWorkflow />
          </TabsContent>

          <TabsContent value="handwriting">
            <HandwritingGenerator />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
