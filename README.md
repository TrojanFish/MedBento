# 🫁 MedBento AI：JCOG 早期肺癌研究报告与医学自媒体可视化生成系统

> 一套专为医学科研报告、肿瘤临床试验（JCOG / ASCO / Lancet / NEJM）与自媒体科普打造的 **Bento Grid 动态可视化与小红书/抖音智能切图系统**。

---

## 🌟 核心功能一览

1. **JCOG 早期肺癌里程碑研究报告本地化**
   - 选取全球胸外科具有颠覆意义的 **JCOG0802 / WJOG4607L（发表于《The Lancet》柳叶刀）** 早期非小细胞肺癌（≤2cm）肺段切除 vs 肺叶切除 III 期临床试验。
   - 包含完整的核心数据（N=1106，5年 OS 94.3% vs 91.1%，HR 0.663，P=0.0082，FEV1 肺功能损失 -8.5% vs -12.0%，局部复发率 10.5% vs 5.4%）。
   - 本地生成专业矢量排版的中英双语 PDF 报告：[`output/JCOG0802_Lancet_Study_Report.pdf`](output/JCOG0802_Lancet_Study_Report.pdf) 与详尽文本报告 [`input/JCOG0802_Lancet_Study_Report.txt`](input/JCOG0802_Lancet_Study_Report.txt)。

2. **全格式文献输入、HTML 链接抓取与 Markdown/表格双模编辑器**
   - **支持的文件格式**：
     - 📑 **PDF 格式 (`.pdf`)**：纯前端解析 + 后端 Gemini 原生 PDF 多模态视觉直读；
     - 📝 **Word 文档 (`.docx`)**：集成 `mammoth.js` 即时解析排版与表格；
     - 📄 **Markdown (`.md`) / 纯文本 (`.txt`) / JSON (`.json`) / HTML 文件 (`.html`)**；
   - **🌐 在线网页链接 (URL / HTML Link) 一键抓取**：
     - 支持直接输入 **PubMed、The Lancet、Nature、ASCO、微信公众号文章、学术新闻博客等任意公开网址 (URL)**；
     - 集成高可用 Jina Reader 及智能代理通道，一键秒级将网页正文提取为干净的 Markdown 文本并填入解析器；
   - **📊 Markdown / 复杂临床数据表双模工作区**：
     - 支持 **【📝 源码编辑】** 与 **【👁️ 表格/排版渲染】** 一键自由切换；
     - 集成 `marked.js` 高保真表格渲染引擎，告别纯文本杂乱对齐，完美支持临床对照表、斑马纹高亮与一键插入表格模板。

3. **🔒 VPS 私有化专属登录鉴权体系（防滥用网关）**
   - **全站路由守卫**：未登录用户访问首页或敏感 API 均自动重定向至高颜值私有登录页面 [`login.html`](login.html)；
   - **多重防暴力防盗刷**：凭证校验由服务端与 `.env` 文件严格比对，支持 30 天持久化安全 Session Cookie；
   - **一键退出与免密切换**：主界面右上角提供【<i class="fa-solid fa-arrow-right-from-bracket"></i> 退出】按钮；若 `.env` 中 `AUTH_PASSWORD` 留空则自动进入本地免密开发模式。

4. **后置安全 Gemini API（.env 配置）**
   - **环境变量后置**：支持在 `.env` 中配置 `GEMINI_API_KEY` 与 `GEMINI_MODEL`，服务端安全代理请求，绝不泄露 API Key 到前端；
   - **零 Key 无缝兜底**：未配置 Key 时自动启用内置高精度医学解析引擎，零门槛开箱即用。

5. **3 款高质感卡片视觉主题（含便签纸暖白风格）**
   - 🌙 **暗黑科技风** (`theme-dark`)：深蓝黑底 + 霓虹青绿，酷炫现代感；
   - 📜 **便签纸暖白** (`theme-light`)：**精选柔和暖黄便签纸/羊皮纸底色 (`#FAF7EE`) + 深炭灰字 + 经典医学蓝**，温润护眼、手记质感，极其契合小红书博主；
   - 🧪 **蓝绿生命风** (`theme-emerald`)：深邃森林墨绿 + 薄荷荧光，生物医药前沿学术风。

5. **智能自适应 5~8 张自媒体卡片体系（小红书 / 抖音 / 方图）**
   - **5张 · 爆款精炼模式**：核心大字封面卡、试验设计卡、KM 生存阶梯曲线卡、临床获益与局部复发权衡卡、患者就医四步指南卡。
   - **7张 · 深度临床模式**：新增 **【第 6 张：安全性与并发症对比卡 (Grade 3+ AE、肺漏气与非癌死因)】**、**【第 7 张：关键预设亚组 5 年 OS 获益森林图卡】**。
   - **8张 · 全景全案模式**：新增 **【第 8 张：权威指南共识 (NCCN/CSCO 1A 类) 与 4 步全流程诊疗路径卡】**。
   - **智能自适应模式 (`auto`)**：根据输入的医学文献信息丰富度自动识别并扩展篇幅。
   - **所见即所得修改**：支持鼠标直接点击卡片文字所见即所得微调，实时同步至导出图片。

6. **全矢量 100% SVG 引擎与 4K 超高清无损导出**
   - **100% 原生矢量 SVG 图标**：告别 WebFont 跨域字体加载失败引起的 `☒` 乱码方块，确保图片导出完美渲染。
   - **现代 `html-to-image` SVG `<foreignObject>` 渲染引擎**：原生 DOM 排版保真，自动规避 `-webkit-background-clip` 渐变白框瑕疵。
   - **多比例自由切换**：小红书 3:4 (1080×1440) | 抖音/竖屏 9:16 (1080×1920) | 方图 1:1。
   - **📥 单张高清下载**：每张卡片底部提供独立一键下载按钮。
   - **📦 一键打包全部切片 (ZIP)**：基于 `JSZip` 批量高清打包导出全套切片图片。
   - **📜 拼接完整长图**：一键生成整张医学科普长图信息流。
   - **📝 独立文案工作台**：字数统计、Emoji 结构化段落、Hashtag 热门标签与一键复制发布。

---

## 🚀 启动与部署指引

### 方式一：Docker 一键部署（推荐 VPS / 云服务器，端口：`38999`）

本项目已预置专属高位非标准端口 **`38999`**（避开 80/443/8080 等常用端口，非常适合 VPS）：

```bash
# 1. 复制环境变量并配置（可选填入 Gemini Key）
cp .env.example .env

# 2. 一键启动 Docker 容器
docker compose up -d --build
```

启动完成后，直接在浏览器访问：
👉 **`http://<你的VPS_IP或域名>:38999`**

---

### 方式二：本地 Python 轻量级服务启动（端口：`38999`）

无需安装额外框架，基于 Python 原生轻量级标准库一秒启动：

```bash
# 启动本地服务（默认端口 38999）
python server.py
```

打开浏览器访问：👉 **`http://localhost:38999`** 即可即刻畅享全部功能！

---

## 📂 规范化项目目录结构

```
CA研究/
├── 📥 input/                               # 原始文献与参考素材
│   ├── README.md                          # 输入目录说明
│   ├── JCOG0802_Lancet_Study_Report.pdf   # 原始/参考 JCOG 柳叶刀 PDF 报告
│   ├── JCOG0802_Lancet_Study_Report.txt   # 原始/参考 JCOG 完整文本报告
│   └── prompt.jpg                         # 原始参考财报提示词截图
│
├── 📤 output/                              # 产物与导出目录
│   ├── README.md                          # 产物输出说明
│   ├── JCOG0802_Lancet_Study_Report.pdf   # Python 脚本生成的学术 PDF
│   └── optimized_medical_prompt.md        # 重构后的医学 Bento 提示词文档
│
├── 📑 templates/                           # 提示词模板
│   └── prompt_template.json               # 3 种医学自媒体风格的结构化提示词模板
│
├── 🛠️ scripts/                             # 自动化构建脚本
│   └── generate_jcog_pdf.py               # Python PDF 矢量生成脚本
│
├── 🎨 css/                                 # 页面样式体系 (含便签纸暖白、暗黑科技、蓝绿生命)
│   └── style.css                          
│
├── ⚙️ js/                                  # 前端引擎模块
│   ├── app.js                             # 页面主控制器与事件绑定
│   ├── pdf_extractor.js                   # 全格式文档解析 (PDF/Word/MD/HTML/URL)
│   ├── medical_analyzer.js                # 后端 API 联动与离线医学智能引擎
│   ├── card_slicer.js                     # 自媒体 5 步智能切片器 (无截断高保真排版)
│   └── exporter.js                        # 2.5x 高清渲染、ZIP 打包、长图与文案导出
│
├── .env                                   # 🔑 私有环境变量配置文件 (Gemini Key, 端口等)
├── .env.example                           # 环境变量配置模板
├── Dockerfile                             # 🐳 Docker 轻量镜像构建定义
├── docker-compose.yml                     # 🐳 Docker Compose 容器编排定义
├── server.py                              # 🚀 Python 后端轻量服务器 (端口 38999)
├── index.html                             # 🌐 Web 应用程序主界面
├── requirements.txt                       # 📦 Python 环境依赖清单
└── README.md                              # 📖 项目总览与使用说明书
```
