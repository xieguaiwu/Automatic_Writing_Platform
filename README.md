# 智能写作平台 - 完整工作流应用

一个基于 Next.js 的智能写作平台，整合了风格模仿、文章生成和手写转换三大功能，支持从主题输入到手写作文输出的完整工作流。

> ⚠️ **注意**：
> - **手写生成API**: `https://unpermeative-anamaria-famously.ngrok-free.dev/coze/generate`
> - **Ollama API**: `https://4e9abcf1a8c0.ngrok-free.app`（远程服务）
> 如需使用其他API，可在界面的"高级设置"中修改。

## ✨ 功能特性

### 🎯 完整工作流
一站式完成从主题到手写作文的全部流程：

1. **风格分析** - 分析用户提供的风格样本，提取语言特征（Style DNA）
2. **文章生成** - 使用 Ollama ghostwriter 模型生成模仿文章
3. **文本预处理** - 自动将文本每 40 个字符换行，优化手写排版
4. **手写转换** - 将预处理后的文本转换为手写风格图片

### 📝 风格模仿 (Style Mimic)
- 智能分析文本语言特征
- 提取 Style DNA（句长、过渡词、词汇复杂度等）
- 使用 Ollama ghostwriter 模型生成高质量文章
- 支持自定义创造性参数

### ✍️ 手写生成 (Handwriting Generator)
- 智能分段处理长文本（自动按句号、逗号、字符数分割）
- 支持自定义笔迹风格（上传参考图片）
- 可调整生成参数（步骤数、引导比例）
- 垂直拼接多段图片，居中对齐
- 无超时限制（长文本自动分段）

### 🎨 文本预处理（新增）
- 智能换行：每 40 个字符自动换行
- 单词保护：在空格处换行，避免截断单词
- 超长处理：自动处理超长单词，强制分割
- 排版优化：使手写效果更整齐自然

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

应用将在 http://localhost:5000 上运行。

## 📖 使用说明

### 完整工作流模式（推荐）

1. **输入写作主题**
   - 在"写作主题"框中输入你想要的文章主题
   - 例如："人工智能在教育中的应用"

2. **（可选）提供风格样本**
   - 粘贴一段你喜欢的写作风格文本
   - 系统会分析并提取 Style DNA

3. **（可选）上传笔迹图片**
   - 选择一张你喜欢的笔迹图片
   - 系统会模仿这种手写风格

4. **调整参数**
   - **基本参数**：
     - 生成温度：控制文章的创造性（0.5-2.0）
     - 手写步骤数：影响手写质量（8-20）
   - **高级设置**：
     - 引导比例：控制风格强度（1.0-5.0）
     - 分段阈值：长文本分段字符数（100-500）
     - Ollama API 端点：远程或本地服务地址
     - 手写生成 API 端点：远程或本地服务地址

5. **生成**
   - 点击"完整工作流"按钮
   - 系统自动完成：风格分析 → 文章生成 → 文本预处理 → 手写转换
   - 预览并下载最终的手写作文

### 分步模式

#### 仅生成文章
1. 点击"仅生成文章"按钮
2. 等待 Ollama 生成文章
3. 预览生成的文章
4. 满意后点击"转换为手写"

#### 仅手写转换
1. 切换到"仅手写转换"标签
2. 输入文本
3. （可选）上传笔迹图片
4. 调整生成参数
5. 点击生成手写风格

## 🔧 技术栈

- **框架**: Next.js 16 (App Router)
- **UI 组件**: shadcn/ui
- **样式**: Tailwind CSS 4
- **图像处理**: Sharp
- **语言**: TypeScript 5
- **包管理器**: pnpm

## 📂 项目结构

```
src/
├── app/
│   ├── api/
│   │   ├── style-mimic/
│   │   │   └── route.ts              # 风格模仿API（Ollama集成）
│   │   ├── handwriting/
│   │   │   └── generate/
│   │   │       └── route.ts          # 手写生成API（支持分段）
│   │   └── workflow/
│   │       └── complete/
│   │           └── route.ts          # 完整工作流API（含预处理）
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── WritingWorkflow.tsx           # 完整工作流组件
│   ├── HandwritingGenerator.tsx     # 手写生成器组件
│   └── ui/                           # shadcn/ui 组件
└── lib/
    └── style-analyzer.ts             # Style DNA 分析工具
```

## 🔑 API 接口

### POST /api/style-mimic

分析风格并生成文章（使用 Ollama API）。

**请求体**:

```json
{
  "topic": "写作主题",
  "style_sample": "风格样本文本（可选）",
  "instruction": "生成指令（可选）",
  "ollamaEndpoint": "Ollama服务地址（可选）"
}
```

**响应**:

```json
{
  "success": true,
  "article": "生成的文章内容",
  "style_dna": {
    "avg_sent_len": 24.5,
    "transitions": ["however", "thus"],
    "quirks": ["And/But starters"],
    "vocabulary_level": "moderate",
    "sentence_structures": {
      "simple": 0.3,
      "compound": 0.5,
      "complex": 0.2
    },
    "tone": "formal"
  },
  "message": "文章生成成功"
}
```

### POST /api/workflow/complete

执行完整工作流：风格模仿 → 文本预处理 → 手写转换。

**请求体**:

```json
{
  "topic": "写作主题",
  "style_sample": "风格样本文本（可选）",
  "handwriting_image": "base64笔迹图片（可选）",
  "steps": 12,
  "guidance_scale": 2.0,
  "max_segment_chars": 200,
  "api_endpoint": "手写生成API端点（可选）",
  "ollamaEndpoint": "Ollama API端点（可选）"
}
```

**响应**:

```json
{
  "success": true,
  "article": "原始生成的文章内容",
  "preprocessed_text": "预处理后的文章（每40字符换行）",
  "result_image_base64": "data:image/png;base64,...",
  "style_dna": { ... },
  "message": "完整工作流执行成功：文章生成 + 文本预处理 + 手写转换",
  "steps": {
    "style_mimic": {
      "success": true,
      "style_dna_applied": true
    },
    "preprocessing": {
      "success": true,
      "line_length": 40
    },
    "handwriting": {
      "success": true,
      "segments_count": 3
    }
  }
}
```

### POST /api/handwriting/generate

将文本转换为手写风格图片（支持长文本自动分段）。

**请求体**:

```json
{
  "input_text": "要转换的文本",
  "style_image": "base64风格图片（可选，不含前缀）",
  "steps": 12,
  "guidance_scale": 2.0,
  "max_segment_chars": 200,
  "api_endpoint": "自定义API端点（可选）"
}
```

**响应**:

```json
{
  "success": true,
  "result_image_url": null,
  "result_image_base64": "data:image/png;base64,...",
  "message": "手写图片生成成功",
  "error": null,
  "segments_count": 3
}
```

## 🎯 核心功能详解

### Style DNA 分析

自动分析文本的语言风格特征：

- **平均句长**: 句子的平均字符数
- **过渡词**: 常用的连接词
- **语言习惯**: 特殊的写作习惯
- **词汇复杂度**: simple / moderate / high
- **句式分布**: 简单句、复合句、复杂句的比例
- **语气基调**: formal / casual / critical / positive / neutral

**Style_DNA 格式**:
```json
{
  "avg_sent_len": 12.5,
  "transitions": ["Frankly", "Believe me"],
  "quirks": ["Superlative-heavy", "Punchy fragments"],
  "vocabulary_level": "moderate",
  "sentence_structures": {
    "simple": 0.4,
    "compound": 0.3,
    "complex": 0.3
  },
  "tone": "casual"
}
```

### 智能文章生成

1. **生成大纲** - 根据主题创建结构化段落大纲
2. **逐段生成** - 使用 Ollama ghostwriter 模型逐段生成内容
3. **保持连贯** - 通过前文摘要确保段落间连贯
4. **风格模仿** - 根据 Style DNA 调整语言风格

**Prompt 格式**:
```
### Instruction:
{instruction}

### Input:
> - Style_DNA: {style_dna_json}

Current_Outline_Point: {outline_point}
Previous_Context: {previous_context}

### Response:
```

### 文本预处理

自动将文本每 40 个字符换行，优化手写排版：

- **智能换行**: 在空格处换行，避免截断单词
- **超长处理**: 自动处理超长单词，强制分割
- **可配置**: 支持自定义行长度（默认 40）

**处理示例**:
```
输入: "人工智能在教育领域的应用日益广泛"
输出: "人工智能在教育领域的应用日益\n广泛"
```

### 手写图片转换

1. **智能分段** - 自动将长文本分段处理
2. **风格应用** - 使用上传的笔迹图片作为参考
3. **垂直拼接** - 将多段图片拼接成完整结果
4. **居中对齐** - 较窄的图片在较宽的画布中居中
5. **无超时** - 支持长时间运行

**分段策略**:
- 优先按句号（`。`）分割
- 其次按逗号（`，`）分割
- 最后按字符数强制分割（默认 200 字符）

## 💡 使用场景

1. **模仿名人写作风格**
   - 输入名人的文章片段
   - 生成相同风格的新文章
   - 转换为手写风格展示

2. **统一写作风格**
   - 收集团队已有的文档
   - 生成风格一致的新内容
   - 保持品牌一致性

3. **创意写作辅助**
   - 提供创意主题
   - AI 生成完整文章
   - 转换为手写效果
   - 用于展示或收藏

4. **教学演示**
   - 生成示例文章
   - 展示不同写作风格
   - 手写效果更真实
   - 适合教学场景

## ⚙️ 配置说明

### Ollama API 配置

**当前配置：**
```
Ollama API端点: https://4e9abcf1a8c0.ngrok-free.app
```

**服务信息：**
- **位置**: 远程服务（通过 ngrok 暴露）
- **模型**: `ghostwriter:latest`（已安装）
- **API 路径**: `/api/generate`（标准 Ollama API）

**如需使用其他 Ollama 服务地址，可在界面的"高级设置"中修改 Ollama API 端点**

**本地服务示例：**
```
Ollama API端点: http://localhost:11434
```

**重要参数：**
- **模型名称**: `ghostwriter`（必须预先在 Ollama 中安装）
- **温度参数**: 1.5（高创造性）
- **其他参数**:
  - `top_p`: 0.95
  - `repeat_penalty`: 1.2
  - `presence_penalty`: 0.8
  - `stop`: ["###", "</s>"]

**Style_DNA 格式**:

```json
{
  "avg_sent_len": 12.5,
  "transitions": ["Frankly", "Believe me"],
  "quirks": ["Superlative-heavy", "Punchy fragments"],
  "vocabulary_level": "moderate",
  "sentence_structures": {
    "simple": 0.4,
    "compound": 0.3,
    "complex": 0.3
  },
  "tone": "casual"
}
```

### 手写生成 API 配置

应用已默认配置手写生成API端点：`https://unpermeative-anamaria-famously.ngrok-free.dev/coze/generate`

如需使用其他API，可在界面的"高级设置"中修改 API 端点：

```
API端点: https://unpermeative-anamaria-famously.ngrok-free.dev/coze/generate
```

**请求格式：**

```json
{
  "input_text": "Hello World",
  "style_image": "iVBORw0KGgoAAAANSUhEUgAA...",
  "steps": 12,
  "guidance_scale": 2.0
}
```

**参数说明：**
- `input_text` (必需): 要转换为手写的文本内容
- `style_image` (可选): Base64编码的风格图片数据（**不含** `data:image/xxx;base64,` 前缀）
- `steps` (可选): 生成步骤数，默认12，范围5-50
- `guidance_scale` (可选): 引导比例，默认2.0，范围1.0-5.0

**响应格式：**

```json
{
  "success": true,
  "result_image_url": "http://example.com/generated/handwriting.png",
  "result_image_base64": "iVBORw0KGgoAAAANSUhEUgAA...",
  "message": "Handwriting generated successfully",
  "error": null
}
```

**使用建议：**
- 快速测试: 使用 steps=5-8
- 质量平衡: 使用 steps=12-15
- 高质量: 使用 steps=18-30
- 长文本: 超过200字符会自动分段处理
- 超时处理: 建议不设置请求超时时间

## 📊 完整工作流示例

### 示例 1：基础使用

**请求：**
```bash
curl -X POST http://localhost:5000/api/workflow/complete \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "人工智能在教育中的应用"
  }'
```

**处理流程：**
```
1. Style Mimic (Ollama)
   输入: "人工智能在教育中的应用"
   输出: 150字符的文章
   Style DNA: 已提取

2. ✨ Text Preprocessing
   输入: 150字符的文章
   输出: 160字符（含换行符）
   处理: 每40字符换行

3. Handwriting Generator
   输入: 预处理后的文本
   输出: 手写风格图片
   分段: 3个段落
```

**响应：**
```json
{
  "success": true,
  "article": "人工智能正在改变教育...",
  "preprocessed_text": "人工智能正在改变教育。\n通过智能辅导系统，\n每个学生都能获得...",
  "result_image_base64": "data:image/png;base64,...",
  "message": "完整工作流执行成功：文章生成 + 文本预处理 + 手写转换"
}
```

### 示例 2：使用风格样本和笔迹图片

**请求：**
```bash
curl -X POST http://localhost:5000/api/workflow/complete \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "未来城市的规划",
    "style_sample": "城市不仅仅是建筑，更是人与人之间交流的空间...",
    "handwriting_image": "iVBORw0KGgoAAAANSUhEUgAA...",
    "steps": 15,
    "guidance_scale": 2.2
  }'
```

## 🛠️ 故障排除

### Ollama API 相关问题

**问题 1：fetch failed**
- **原因**: Edge Runtime 无法访问 localhost
- **解决**: 已移除 Edge Runtime，使用 Node.js runtime

**问题 2：Unexpected token '<'**
- **原因**: ngrok 警告页面返回 HTML
- **解决**: 已添加自动检测和重试机制

**问题 3：超时**
- **原因**: 模型生成时间过长
- **解决**: 已添加超时保护，最长等待 30 秒

### 手写生成相关问题

**问题 1：返回占位图片**
- **原因**: API 调用失败
- **解决**: 检查 API 端点是否正确，确保服务正常运行

**问题 2：图片质量不佳**
- **原因**: steps 参数过低
- **解决**: 增加 steps 参数（建议 12-15）

**问题 3：长文本超时**
- **原因**: 单次处理时间过长
- **解决**: 已实现自动分段，将长文本分割成多个段落

## 📝 更新日志

### v2.0.0 (最新)
- ✨ 添加文本预处理功能（每 40 字符换行）
- 🔧 集成 Ollama ghostwriter 模型
- 🌐 配置远程 ngrok 服务
- 🛡️ 添加 ngrok 警告页面处理
- 🔄 添加 API 调用重试机制
- 📖 更新完整文档

### v1.0.0
- 🎉 初始版本发布
- ✨ 完整工作流功能
- 📝 风格模仿功能
- ✍️ 手写生成功能

## 📄 许可证

本项目仅供学习和研究使用。

---

**开始使用**: 访问 http://localhost:5000 体验智能写作平台！
