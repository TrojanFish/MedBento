/**
 * js/app.js
 * Main Application Controller for MedBento AI
 * Supports:
 * - Clean Standby Mode (Demo starts on-demand)
 * - Real-Time Visual Generation Progress Bar
 * - Live Author Signature Watermark Sync
 * - Dual-Mode Markdown & Table Workspace
 */

const JCOG_MARKDOWN_PRESET = `# JCOG0802 / WJOG4607L: 早期非小细胞肺癌解剖性肺段切除 vs 肺叶切除 III 期随机对照试验

> **发表期刊**: *The Lancet* (柳叶刀, 2022) | **DOI**: 10.1016/S0140-6736(21)02333-3  
> **总样本量**: N = 1,106 例 | **中位随访**: 7.3 年 (88.2 个月) | **适应症**: ≤2.0cm 外周型早期 NSCLC (CTR > 0.5)

### 📊 核心临床终点对照数据表

| 临床评估指标 (Endpoint) | 肺段切除组 (试验组, N=552) | 肺叶切除组 (对照组, N=554) | 统计学检验 (HR / P值) | 临床综合结论 |
| :--- | :--- | :--- | :--- | :--- |
| **5年总生存率 (5-Yr OS)** | **94.3%** (92.1% - 96.0%) | **91.1%** (88.4% - 93.2%) | **HR 0.663 (P=0.0082)** | 🏆 肺段切除显著胜出 (优效) |
| **5年无复发生存率 (RFS)** | **88.0%** (85.0% - 90.4%) | **87.9%** (84.8% - 90.3%) | HR 0.998 (P=0.9889) | ⚖️ 肿瘤根治性完全等效 |
| **局部切缘复发率 (Local Relapse)** | 10.5% (58 例) | 5.4% (30 例) | P = 0.0018 | ⚠️ 肺段复发率偏高，需保证安全切缘 |
| **1年 FEV1 肺功能损失** | **-8.5%** | **-12.0%** | P < 0.0001 | 🫁 肺段多保住 3.5% 肺活量 (通气储备更优) |
| **非癌症远期死因 (Non-Cancer)** | **27 例** (心脑/肺部感染) | **52 例** (呼吸耐力受损) | 死亡风险降低 48% | 🛡️ 保肺显著降低老年非癌死亡 |

### 🔬 临床专家共识与启示
1. **确立新标准**：对于 ≤2cm、CTR>0.5 的外周型早期肺癌，解剖性肺段切除术正式取代肺叶切除成为标准术式；
2. **切缘铁律**：术中需确保切缘 ≥2.0cm 或大于肿瘤最大径，以最大限度控制局部切缘复发风险。
`;

document.addEventListener("DOMContentLoaded", () => {
  App.init();
});

const App = {
  currentData: null,
  currentView: "bento", // "bento" or "social"
  currentRatio: "ratio-3-4",
  currentTheme: "theme-dark",
  currentEditorMode: "raw", // "raw" or "preview"
  currentAuthor: "Dr. 肿瘤前沿速递",
  bentoChartInstance: null,
  radarChartInstance: null,
  currentPdfBase64: null,

  async init() {
    // Start with clean standby state (no forced demo)
    this.currentData = null;

    const textarea = document.getElementById("report-textarea");
    if (textarea) {
      textarea.value = "";
    }

    const watermarkInput = document.getElementById("watermark-input");
    if (watermarkInput) {
      this.currentAuthor = watermarkInput.value.trim() || "Dr. 肿瘤前沿速递";
    }

    this.bindEvents();
    this.refreshAllViews();
    this.updateMarkdownPreview();
  },

  /**
   * Visual Step-by-Step Generation Progress Controller
   */
  setProgress(pct, title, sub = "", status = "loading") {
    const panel = document.getElementById("gen-progress-panel");
    const bar = document.getElementById("gen-progress-bar");
    const pctText = document.getElementById("gen-progress-pct");
    const titleText = document.getElementById("gen-progress-title");
    const subText = document.getElementById("gen-progress-sub");

    if (!panel || !bar || !pctText || !titleText) return;

    panel.style.display = "block";
    bar.style.width = `${Math.min(100, Math.max(0, pct))}%`;
    pctText.innerText = `${Math.round(pct)}%`;
    titleText.innerText = title;
    if (subText && sub) subText.innerText = sub;

    if (status === "error") {
      bar.style.background = "linear-gradient(90deg, #F43F5E 0%, #E11D48 100%)";
      pctText.style.color = "#F43F5E";
      setTimeout(() => {
        panel.style.display = "none";
      }, 5000);
      return;
    } else {
      bar.style.background = "linear-gradient(90deg, #00E5FF 0%, #10B981 100%)";
      pctText.style.color = "#00E5FF";
    }

    if (pct >= 100) {
      setTimeout(() => {
        panel.style.display = "none";
      }, 900);
    }
  },

  bindEvents() {
    // 1. Tab Switching
    document.querySelectorAll(".nav-tab").forEach(tab => {
      tab.addEventListener("click", (e) => {
        const view = e.currentTarget.getAttribute("data-view");
        this.switchView(view);
      });
    });

    // 1.1 Input Mode Switcher (File vs URL)
    const tabInputFile = document.getElementById("tab-input-file");
    const tabInputUrl = document.getElementById("tab-input-url");
    const dropzoneBox = document.getElementById("dropzone-box");
    const urlBox = document.getElementById("url-box");

    if (tabInputFile && tabInputUrl) {
      tabInputFile.addEventListener("click", () => {
        tabInputFile.classList.add("active");
        tabInputUrl.classList.remove("active");
        dropzoneBox.style.display = "block";
        urlBox.style.display = "none";
      });

      tabInputUrl.addEventListener("click", () => {
        tabInputUrl.classList.add("active");
        tabInputFile.classList.remove("active");
        dropzoneBox.style.display = "none";
        urlBox.style.display = "block";
      });
    }

    // 1.2 URL Fetch Button
    const btnFetchUrl = document.getElementById("btn-fetch-url");
    const urlInput = document.getElementById("url-input");
    if (btnFetchUrl && urlInput) {
      btnFetchUrl.addEventListener("click", async () => {
        const url = urlInput.value.trim();
        if (!url) {
          this.showToast("请输入需要抓取的医学文献网页链接", "error");
          return;
        }

        try {
          btnFetchUrl.disabled = true;
          btnFetchUrl.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> 正在抓取...`;
          this.setProgress(20, "正在连接文献网页...", url);
          
          const text = await PDFExtractor.fetchTextFromUrl(url, (pct, msg) => {
            this.setProgress(pct, msg, url);
          });

          document.getElementById("report-textarea").value = text;
          this.currentPdfBase64 = null;
          this.updateMarkdownPreview();
          this.setProgress(100, "✅ 网页正文抓取完成！", "已自动生成 Markdown 排版，点击【一键生成】即可生成仪表盘与切片");
          this.showToast("网页正文抓取成功！点击【一键生成】即可刷新仪表盘", "success");
        } catch (err) {
          this.setProgress(100, "抓取失败", err.message, "error");
          this.showToast(`抓取失败: ${err.message}`, "error");
        } finally {
          btnFetchUrl.disabled = false;
          btnFetchUrl.innerHTML = `<i class="fa-solid fa-bolt"></i> 抓取正文`;
        }
      });
    }

    // 1.3 Markdown Dual-Mode Switcher & Table Insertion
    const btnModeRaw = document.getElementById("btn-mode-raw");
    const btnModePreview = document.getElementById("btn-mode-preview");
    const btnInsertTable = document.getElementById("btn-insert-table");
    const textarea = document.getElementById("report-textarea");
    const preview = document.getElementById("report-md-preview");

    if (btnModeRaw && btnModePreview && textarea && preview) {
      btnModeRaw.addEventListener("click", () => {
        this.currentEditorMode = "raw";
        btnModeRaw.classList.add("active");
        btnModePreview.classList.remove("active");
        textarea.style.display = "block";
        preview.style.display = "none";
      });

      btnModePreview.addEventListener("click", () => {
        this.currentEditorMode = "preview";
        btnModePreview.classList.add("active");
        btnModeRaw.classList.remove("active");
        this.updateMarkdownPreview();
        textarea.style.display = "none";
        preview.style.display = "block";
      });

      textarea.addEventListener("input", () => {
        if (this.currentEditorMode === "preview") {
          this.updateMarkdownPreview();
        }
      });
    }

    if (btnInsertTable && textarea) {
      btnInsertTable.addEventListener("click", () => {
        const tableTemplate = `\n\n### 📊 临床终点对照数据表\n| 评估指标 | 试验组 (Exp) | 对照组 (Ctrl) | 统计学 HR / P值 | 结论 |\n| :--- | :--- | :--- | :--- | :--- |\n| **5年总生存率 (OS)** | **94.3%** | 91.1% | HR 0.663 (P=0.0082) | 显著优效 |\n| **5年无复发生存 (RFS)** | 88.0% | 87.9% | HR 0.998 (P=0.9889) | 完全等效 |\n| **器官功能保留** | -8.5% | -12.0% | P < 0.0001 | 多保留 3.5% 肺功能 |\n\n`;
        
        const cursorPos = textarea.selectionStart || textarea.value.length;
        const textBefore = textarea.value.substring(0, cursorPos);
        const textAfter = textarea.value.substring(cursorPos);
        
        textarea.value = textBefore + tableTemplate + textAfter;
        this.updateMarkdownPreview();
        this.showToast("已插入 Markdown 对照数据表模板，可直接修改单元格数据", "success");
      });
    }

    // 2. Drag & Drop File Upload
    const dropzone = document.getElementById("dropzone");
    const fileInput = document.getElementById("file-input");
    
    if (dropzone && fileInput) {
      dropzone.addEventListener("click", () => fileInput.click());
      
      dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.classList.add("dragover");
      });
      
      dropzone.addEventListener("dragleave", () => {
        dropzone.classList.remove("dragover");
      });
      
      dropzone.addEventListener("drop", async (e) => {
        e.preventDefault();
        dropzone.classList.remove("dragover");
        if (e.dataTransfer.files.length) {
          await this.handleFile(e.dataTransfer.files[0]);
        }
      });

      fileInput.addEventListener("change", async (e) => {
        if (e.target.files.length) {
          await this.handleFile(e.target.files[0]);
        }
      });
    }

    // 3. Preset Loading (Triggered explicitly on click)
    const btnPresetJcog = document.getElementById("btn-preset-jcog");
    if (btnPresetJcog) {
      btnPresetJcog.addEventListener("click", async () => {
        btnPresetJcog.classList.add("active");
        this.setProgress(25, "正在载入 JCOG0802 柳叶刀研究演示...", "初始化 1106 例全量临床数据与 Markdown 表格");
        
        document.getElementById("report-textarea").value = JCOG_MARKDOWN_PRESET;
        this.updateMarkdownPreview();
        this.currentData = MedicalAnalyzer.DEFAULT_JCOG_DATA;
        
        this.setProgress(70, "正在构建 Bento 仪表盘与自媒体切片...", "应用多维指标与 KM 阶梯曲线");
        this.refreshAllViews();
        
        setTimeout(() => {
          this.setProgress(100, "✨ JCOG0802 演示数据载入完成！", "已生成桌面仪表盘与 5 张高清自媒体切片");
          this.showToast("已开启 JCOG0802 (Lancet 2022) 临床试验全量数据演示", "success");
        }, 300);
      });
    }

    // 4. Generate Button
    const btnGenerate = document.getElementById("btn-generate");
    if (btnGenerate) {
      btnGenerate.addEventListener("click", async () => {
        await this.handleGenerate();
      });
    }

    // 5. Social Ratio Toggle
    document.querySelectorAll(".ratio-selector .ratio-btn[data-ratio]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        document.querySelectorAll(".ratio-selector .ratio-btn[data-ratio]").forEach(b => b.classList.remove("active"));
        e.currentTarget.classList.add("active");
        
        const ratio = e.currentTarget.getAttribute("data-ratio");
        this.currentRatio = ratio;
        if (this.currentData) {
          this.renderSocialSlicer(this.currentData);
        }
        this.showToast(`已切换至 ${e.currentTarget.innerText.trim()} 比例`, "info");
      });
    });

    // 5.1 Card Theme Toggle (Dark vs Light vs Emerald)
    document.querySelectorAll("#card-theme-group .ratio-btn[data-theme]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        document.querySelectorAll("#card-theme-group .ratio-btn[data-theme]").forEach(b => b.classList.remove("active"));
        e.currentTarget.classList.add("active");
        
        const theme = e.currentTarget.getAttribute("data-theme");
        this.currentTheme = theme;
        CardSlicer.setTheme(theme);
        this.showToast(`已切换至 ${e.currentTarget.innerText.trim()} 主题`, "info");
      });
    });

    // 5.2 Card Deck Count Adaptive Toggle (5~8 Cards)
    document.querySelectorAll("#deck-count-group .ratio-btn[data-deck-mode]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        document.querySelectorAll("#deck-count-group .ratio-btn[data-deck-mode]").forEach(b => b.classList.remove("active"));
        e.currentTarget.classList.add("active");
        
        const mode = e.currentTarget.getAttribute("data-deck-mode");
        this.currentDeckMode = mode;
        if (this.currentData) {
          this.renderSocialSlicer(this.currentData);
        }
        this.showToast(`已切换至 ${e.currentTarget.innerText.trim()} 篇幅`, "info");
      });
    });

    // 6. Copywriting Modal
    const btnOpenCopywriter = document.getElementById("btn-open-copywriter");
    const modalCopywriter = document.getElementById("modal-copywriter");
    const btnCloseCopywriter = document.getElementById("btn-close-copywriter-modal");
    const btnCwCopyAll = document.getElementById("btn-cw-copy-all");
    const cwTitleInput = document.getElementById("cw-title-input");
    const cwBodyTextarea = document.getElementById("cw-body-textarea");
    const cwTagsInput = document.getElementById("cw-tags-input");

    if (btnOpenCopywriter && modalCopywriter) {
      btnOpenCopywriter.addEventListener("click", () => {
        if (!this.currentData) {
          this.currentData = MedicalAnalyzer.DEFAULT_JCOG_DATA;
        }
        this.populateCopywriterModal();
        modalCopywriter.classList.add("active");
      });
    }

    if (btnCloseCopywriter && modalCopywriter) {
      btnCloseCopywriter.addEventListener("click", () => {
        modalCopywriter.classList.remove("active");
      });
    }

    if (cwTitleInput) {
      cwTitleInput.addEventListener("input", () => {
        this.updateCopyCharCount();
        this.saveCopywriterChanges();
      });
    }

    if (cwBodyTextarea) {
      cwBodyTextarea.addEventListener("input", () => {
        this.updateCopyCharCount();
        this.saveCopywriterChanges();
      });
    }

    if (cwTagsInput) {
      cwTagsInput.addEventListener("input", () => {
        this.saveCopywriterChanges();
      });
    }

    if (btnCwCopyAll) {
      btnCwCopyAll.addEventListener("click", async () => {
        this.saveCopywriterChanges();
        await Exporter.copySocialMediaText(this.currentData);
        this.showToast("📋 已一键复制完整自媒体发布文案！", "success");
      });
    }

    // 7. Exporter Actions
    const btnExportZip = document.getElementById("btn-export-zip");
    if (btnExportZip) {
      btnExportZip.addEventListener("click", async () => {
        if (!this.currentData) {
          this.showToast("请先生成或载入文献数据后再导出切片", "error");
          return;
        }
        try {
          btnExportZip.disabled = true;
          btnExportZip.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> 正在打包高清切片...`;
          await Exporter.exportAllCardsAsZip("MedBento_SocialCards", (pct, msg) => {
            this.showToast(`${msg} (${pct}%)`, "info");
          });
          const cardCount = document.querySelectorAll(".social-card-item").length;
          this.showToast(`✅ 全部 ${cardCount} 张自媒体高清卡片打包完成！`, "success");
        } catch (err) {
          this.showToast(`导出失败: ${err.message}`, "error");
        } finally {
          btnExportZip.disabled = false;
          btnExportZip.innerHTML = `<i class="fa-solid fa-file-zipper"></i> 一键打包全部切片 (ZIP)`;
        }
      });
    }

    const btnExportLong = document.getElementById("btn-export-long");
    if (btnExportLong) {
      btnExportLong.addEventListener("click", async () => {
        if (!this.currentData) {
          this.showToast("请先生成或载入文献数据后再导出长图", "error");
          return;
        }
        try {
          btnExportLong.disabled = true;
          btnExportLong.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> 正在拼接长图...`;
          await Exporter.exportLongImage("MedBento_LongInfographic", (pct, msg) => {
            this.showToast(`${msg}`, "info");
          });
          this.showToast("✅ 高清长图已生成并开始下载！", "success");
        } catch (err) {
          this.showToast(`长图导出失败: ${err.message}`, "error");
        } finally {
          btnExportLong.disabled = false;
          btnExportLong.innerHTML = `<i class="fa-solid fa-scroll"></i> 下载完整长图 (PNG)`;
        }
      });
    }

    const btnCopySocial = document.getElementById("btn-copy-social");
    if (btnCopySocial) {
      btnCopySocial.addEventListener("click", async () => {
        if (!this.currentData) {
          this.showToast("请先生成或载入文献数据后再复制文案", "error");
          return;
        }
        await Exporter.copySocialMediaText(this.currentData);
        this.showToast("📋 小红书/抖音爆款文案与话题标签已复制到剪贴板！", "success");
      });
    }

    // 8. Prompt Template Modal
    const btnShowPrompt = document.getElementById("btn-show-prompt");
    const modalPrompt = document.getElementById("modal-prompt");
    const btnCloseModal = document.getElementById("btn-close-modal");
    
    if (btnShowPrompt && modalPrompt) {
      btnShowPrompt.addEventListener("click", () => {
        modalPrompt.classList.add("active");
      });
    }
    if (btnCloseModal && modalPrompt) {
      btnCloseModal.addEventListener("click", () => {
        modalPrompt.classList.remove("active");
      });
    }

    // 9. Watermark Real-time Dynamic Sync to Cards
    const watermarkInput = document.getElementById("watermark-input");
    if (watermarkInput) {
      watermarkInput.addEventListener("input", (e) => {
        const val = e.target.value.trim() || "Dr. 肿瘤前沿速递";
        this.currentAuthor = val;
        CardSlicer.currentAuthor = val;
        document.querySelectorAll(".card-author").forEach(el => {
          el.innerHTML = `<i class="fa-solid fa-feather-pointed" style="color:var(--card-accent); margin-right:3px;"></i>@${val}`;
        });
      });
    }

    // 10. KM Curve Endpoint Toggle (OS vs RFS in Bento view)
    const btnKmOs = document.getElementById("btn-km-os");
    const btnKmRfs = document.getElementById("btn-km-rfs");
    if (btnKmOs && btnKmRfs) {
      btnKmOs.addEventListener("click", () => {
        btnKmOs.classList.add("active");
        btnKmRfs.classList.remove("active");
        this.updateBentoKmChart("OS");
      });
      btnKmRfs.addEventListener("click", () => {
        btnKmRfs.classList.add("active");
        btnKmOs.classList.remove("active");
        this.updateBentoKmChart("RFS");
      });
    }

    // 11. Logout Button
    const btnLogout = document.getElementById("btn-logout");
    if (btnLogout) {
      btnLogout.addEventListener("click", async () => {
        try {
          await fetch("/api/logout", { method: "POST" });
          this.showToast("已成功退出登录，正在跳转...", "info");
          setTimeout(() => {
            window.location.href = "/login.html";
          }, 400);
        } catch (e) {
          window.location.href = "/login.html";
        }
      });
    }
  },

  updateMarkdownPreview() {
    const textarea = document.getElementById("report-textarea");
    const preview = document.getElementById("report-md-preview");
    if (!textarea || !preview) return;

    const raw = textarea.value.trim();
    if (!raw) {
      preview.innerHTML = `<span style="color:#64748B; font-style:italic;">暂无提取文本。请在左侧上传 PDF / 文档、输入网页链接，或点击【快捷预置演示】载入示例...</span>`;
      return;
    }

    if (typeof marked !== "undefined") {
      preview.innerHTML = marked.parse(raw);
    } else {
      preview.innerText = raw;
    }
  },

  async handleFile(file) {
    const badge = document.getElementById("file-info-badge");
    const fileNameSpan = document.getElementById("file-name-text");
    this.currentPdfBase64 = null;

    try {
      this.setProgress(20, `正在读取文件: ${file.name}...`, `文件大小: ${(file.size / 1024).toFixed(1)} KB`);
      
      // If PDF, convert to base64 for native Gemini multimodal upload
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = reader.result.split(",")[1];
          this.currentPdfBase64 = base64String;
        };
        reader.readAsDataURL(file);
      }

      const text = await PDFExtractor.extractTextFromFile(file, (pct, msg) => {
        this.setProgress(pct, msg, file.name);
      });

      if (badge && fileNameSpan) {
        badge.style.display = "flex";
        fileNameSpan.innerText = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
      }

      document.getElementById("report-textarea").value = text;
      this.updateMarkdownPreview();
      this.setProgress(100, "文件解析完成", "已自动生成 Markdown 排版，点击【一键生成】即可刷新仪表盘与切片");
      this.showToast("文件内容解析成功，点击【一键生成】即可生成仪表盘与切片", "success");
    } catch (err) {
      this.setProgress(100, "文件读取失败", err.message, "error");
      this.showToast(err.message, "error");
    }
  },

  async handleGenerate() {
    const textarea = document.getElementById("report-textarea");
    const text = textarea.value.trim();
    const styleSelect = document.getElementById("style-select");
    const style = styleSelect ? styleSelect.value : "social_viral";

    if (!text && !this.currentPdfBase64) {
      this.showToast("请先输入/上传文献内容或点击【快捷预置演示】", "error");
      return;
    }

    try {
      const modeDesc = this.currentPdfBase64 ? " (含原生 PDF 视觉直读)" : "";
      
      this.setProgress(15, "正在清洗文献文本与多模态结构...", "准备调用大模型医学解析引擎");
      
      setTimeout(() => {
        this.setProgress(45, `正在通过 Google Gemini 2.5 Flash 进行深度医学抽取${modeDesc}...`, "提取主要终点 (OS/RFS)、统计学 HR/P值、KM 生存曲线与自媒体文案");
      }, 300);

      this.currentData = await MedicalAnalyzer.analyze(text, { 
        pdfBase64: this.currentPdfBase64,
        style: style
      });

      this.setProgress(80, "正在构建 Bento Grid 临床多维全景数据...", "绘制 Kaplan-Meier 阶梯生存曲线与对比雷达图");
      this.refreshAllViews();

      this.setProgress(95, "正在生成 5 张高分辨率自媒体视觉切片...", "应用当前配色主题并嵌入署名水印");

      setTimeout(() => {
        this.setProgress(100, "✨ 解析与可视化渲染完成！", "仪表盘与自媒体切片已就绪");
        this.showToast("✨ 医学 Bento 仪表盘与自媒体切片生成完毕！", "success");
      }, 400);

    } catch (err) {
      this.setProgress(100, "生成遇到异常", err.message, "error");
      this.showToast(`生成失败: ${err.message}`, "error");
    }
  },

  switchView(view) {
    this.currentView = view;
    document.querySelectorAll(".nav-tab").forEach(t => {
      t.classList.toggle("active", t.getAttribute("data-view") === view);
    });

    const bentoSection = document.getElementById("bento-view-section");
    const socialSection = document.getElementById("social-view-section");

    if (view === "bento") {
      bentoSection.style.display = "block";
      socialSection.style.display = "none";
    } else {
      bentoSection.style.display = "none";
      socialSection.style.display = "block";
      if (this.currentData) {
        this.renderSocialSlicer(this.currentData);
      }
    }
  },

  refreshAllViews() {
    const bentoEmpty = document.getElementById("bento-empty-state");
    const bentoMain = document.getElementById("bento-main-content");
    const socialEmpty = document.getElementById("social-empty-state");
    const socialCards = document.getElementById("social-cards-container");
    const statusText = document.getElementById("study-status-text");
    const statusIndicator = document.getElementById("study-status-indicator");

    if (!this.currentData) {
      // Show Standby / Empty States
      if (bentoEmpty) bentoEmpty.style.display = "block";
      if (bentoMain) bentoMain.style.display = "none";
      if (socialEmpty) socialEmpty.style.display = "block";
      if (socialCards) socialCards.style.display = "none";
      if (statusText) statusText.innerText = "等待文献载入中";
      if (statusIndicator) {
        const dot = statusIndicator.querySelector("span");
        if (dot) dot.style.background = "#64748B";
      }
      return;
    }

    // Show Populated States
    if (bentoEmpty) bentoEmpty.style.display = "none";
    if (bentoMain) bentoMain.style.display = "flex";
    if (socialEmpty) socialEmpty.style.display = "none";
    if (socialCards) socialCards.style.display = "grid";
    if (statusText) statusText.innerText = `已对齐研究：${this.currentData.id || this.currentData.title || '临床研究'}`;
    if (statusIndicator) {
      const dot = statusIndicator.querySelector("span");
      if (dot) dot.style.background = "#10B981";
    }

    this.renderBentoDashboard(this.currentData);
    this.renderSocialSlicer(this.currentData);
  },

  renderBentoDashboard(data) {
    if (!data) return;

    // 1. Hero Header
    const heroTitle = document.getElementById("hero-title");
    if (heroTitle) heroTitle.innerText = data.title || "医学研究临床生存率报告";

    const heroEn = document.getElementById("hero-full-en");
    if (heroEn) heroEn.innerText = data.fullTitleEn || "";

    const heroDoi = document.getElementById("hero-doi");
    if (heroDoi) heroDoi.innerText = data.doi ? `DOI: ${data.doi}` : "";

    const heroJournal = document.getElementById("hero-journal");
    if (heroJournal) heroJournal.innerText = data.journal || "医学顶级同行评审期刊";

    const heroAuthors = document.getElementById("hero-authors");
    if (heroAuthors) heroAuthors.innerText = data.leadAuthors || "临床试验研究协作组";

    // 2. Big Numbers
    const exp = data.arms?.experimental || { name: "试验组", fiveYrOS: 94.3, fev1Loss12mo: 8.5 };
    const ctrl = data.arms?.control || { name: "对照组", fiveYrOS: 91.1, fev1Loss12mo: 12.0 };
    const stats = data.statistics || { osHazardRatio: "0.663", osHR_CI: "HR 0.663", osRiskReduction: "33.7%", pValueSuperiority: "0.0082" };

    const kpiOs = document.getElementById("kpi-os-val");
    if (kpiOs) kpiOs.innerHTML = `${exp.fiveYrOS}% <span style="font-size:1.3rem; color:#94A3B8; font-weight:400;">vs ${ctrl.fiveYrOS}%</span>`;

    const kpiHr = document.getElementById("kpi-hr-val");
    if (kpiHr) kpiHr.innerText = stats.osHazardRatio ? `HR ${stats.osHazardRatio}` : "HR 显著";

    const kpiHrSub = document.getElementById("kpi-hr-sub");
    if (kpiHrSub) kpiHrSub.innerText = `${stats.osHR_CI || ""} (获益: ${stats.osRiskReduction || "显著"})`;

    const kpiP = document.getElementById("kpi-p-val");
    if (kpiP) kpiP.innerText = `P = ${stats.pValueSuperiority || "0.0082"}`;

    const kpiN = document.getElementById("kpi-n-val");
    const sampleSizeStr = typeof data.sampleSize === "number" ? `N = ${data.sampleSize.toLocaleString()}` : `N = ${data.sampleSize || "1,106"}`;
    if (kpiN) kpiN.innerText = sampleSizeStr;

    const kpiFev1 = document.getElementById("kpi-fev1-val");
    if (kpiFev1) kpiFev1.innerText = `-${exp.fev1Loss12mo || "8.5"}% vs -${ctrl.fev1Loss12mo || "12.0"}%`;

    // 3. Takeaways Lists
    const patientList = document.getElementById("patient-takeaways-list");
    if (patientList && Array.isArray(data.patientTakeaways)) {
      patientList.innerHTML = data.patientTakeaways.map(t => `<li>${t}</li>`).join("");
    }

    const doctorList = document.getElementById("doctor-takeaways-list");
    if (doctorList && Array.isArray(data.doctorTakeaways)) {
      doctorList.innerHTML = data.doctorTakeaways.map(t => `<li>${t}</li>`).join("");
    }

    // 4. Update Charts
    this.updateBentoKmChart("OS");
    this.renderBentoRadarChart(data);
  },

  updateBentoKmChart(endpoint = "OS") {
    const canvas = document.getElementById("bento-km-chart");
    if (!canvas || typeof Chart === "undefined" || !this.currentData) return;

    if (this.bentoChartInstance) {
      this.bentoChartInstance.destroy();
    }

    const km = this.currentData.kmData || MedicalAnalyzer.DEFAULT_JCOG_DATA.kmData;
    const expData = endpoint === "OS" ? km.segmentectomyOS : km.segmentectomyRFS;
    const ctrlData = endpoint === "OS" ? km.lobectomyOS : km.lobectomyRFS;
    const endpointLabel = endpoint === "OS" ? "5年总生存率 (OS)" : "5年无复发生存率 (RFS)";

    const allVals = [...expData, ...ctrlData].filter(v => typeof v === 'number' && !isNaN(v));
    const minVal = allVals.length > 0 ? Math.min(...allVals) : 80;
    const computedYMin = Math.max(0, Math.floor((minVal - 5) / 5) * 5);

    const ctx = canvas.getContext("2d");
    this.bentoChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: km.years.map(y => `${y} 年`),
        datasets: [
          {
            label: "肺段切除组 (Segmentectomy)",
            data: expData,
            borderColor: "#00E5FF",
            backgroundColor: "rgba(0, 229, 255, 0.12)",
            fill: true,
            borderWidth: 3,
            stepped: "before",
            tension: 0,
            pointRadius: 4,
            pointBackgroundColor: "#00E5FF",
            pointHoverRadius: 7
          },
          {
            label: "肺叶切除组 (Lobectomy)",
            data: ctrlData,
            borderColor: "#94A3B8",
            backgroundColor: "transparent",
            borderWidth: 2.5,
            borderDash: [5, 5],
            stepped: "before",
            tension: 0,
            pointRadius: 4,
            pointBackgroundColor: "#94A3B8",
            pointHoverRadius: 7
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false
        },
        plugins: {
          legend: {
            position: "top",
            labels: {
              color: "#F8FAFC",
              font: { size: 12, weight: "bold" },
              padding: 16
            }
          },
          tooltip: {
            backgroundColor: "#0F172A",
            titleColor: "#00E5FF",
            bodyColor: "#FFFFFF",
            borderColor: "rgba(0, 229, 255, 0.4)",
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: (item) => ` ${item.dataset.label}: ${item.raw}% (${endpointLabel})`
            }
          }
        },
        scales: {
          x: {
            title: { display: true, text: "随访时间 (年 / Years after Randomization)", color: "#64748B" },
            grid: { color: "rgba(255, 255, 255, 0.05)" },
            ticks: { color: "#94A3B8" }
          },
          y: {
            min: computedYMin,
            max: 100,
            title: { display: true, text: "生存率百分比 (%)", color: "#64748B" },
            grid: { color: "rgba(255, 255, 255, 0.05)" },
            ticks: {
              color: "#94A3B8",
              callback: (v) => `${v}%`
            }
          }
        }
      }
    });
  },

  renderBentoRadarChart(data) {
    const canvas = document.getElementById("bento-radar-chart");
    if (!canvas || typeof Chart === "undefined" || !data) return;

    if (this.radarChartInstance) {
      this.radarChartInstance.destroy();
    }

    const exp = data.arms?.experimental || { fiveYrOS: 94.3, fiveYrRFS: 88.0, fev1Loss12mo: 8.5 };
    const ctrl = data.arms?.control || { fiveYrOS: 91.1, fiveYrRFS: 87.9, fev1Loss12mo: 12.0 };

    const barVals = [exp.fiveYrOS, exp.fiveYrRFS, 100 - (exp.fev1Loss12mo || 0), 95.1, ctrl.fiveYrOS, ctrl.fiveYrRFS, 100 - (ctrl.fev1Loss12mo || 0), 90.6].filter(v => typeof v === 'number' && !isNaN(v));
    const minBarVal = barVals.length > 0 ? Math.min(...barVals) : 80;
    const computedBarYMin = Math.max(0, Math.floor((minBarVal - 5) / 5) * 5);

    const ctx = canvas.getContext("2d");
    this.radarChartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: [
          "5年总生存率 (OS)",
          "5年无复发生存 (RFS)",
          "肺功能多保留 (FEV1)",
          "非癌生存优势"
        ],
        datasets: [
          {
            label: "肺段切除组 (Segmentectomy)",
            data: [exp.fiveYrOS, exp.fiveYrRFS, 100 - exp.fev1Loss12mo, 95.1],
            backgroundColor: "rgba(0, 229, 255, 0.7)",
            borderColor: "#00E5FF",
            borderWidth: 1.5,
            borderRadius: 6
          },
          {
            label: "肺叶切除组 (Lobectomy)",
            data: [ctrl.fiveYrOS, ctrl.fiveYrRFS, 100 - ctrl.fev1Loss12mo, 90.6],
            backgroundColor: "rgba(148, 163, 184, 0.4)",
            borderColor: "#94A3B8",
            borderWidth: 1.5,
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
            labels: { color: "#F8FAFC", font: { size: 11, weight: "bold" } }
          },
          tooltip: {
            backgroundColor: "#0F172A",
            borderColor: "rgba(0, 229, 255, 0.4)",
            borderWidth: 1
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "#94A3B8", font: { size: 11 } }
          },
          y: {
            min: computedBarYMin,
            max: 100,
            grid: { color: "rgba(255, 255, 255, 0.05)" },
            ticks: {
              color: "#94A3B8",
              callback: (v) => `${v}%`
            }
          }
        }
      }
    });
  },

  renderSocialSlicer(data) {
    const container = document.getElementById("social-cards-container");
    const author = this.currentAuthor || "Dr. 肿瘤前沿速递";
    const mode = this.currentDeckMode || "auto";
    CardSlicer.renderCards(data, container, this.currentRatio, author, mode);
  },

  populateCopywriterModal() {
    const copy = this.currentData?.socialMediaCopy || MedicalAnalyzer.DEFAULT_JCOG_DATA.socialMediaCopy;
    
    const inputTitle = document.getElementById("cw-title-input");
    const textareaBody = document.getElementById("cw-body-textarea");
    const inputTags = document.getElementById("cw-tags-input");

    if (inputTitle) {
      inputTitle.value = copy.hookTitle || "";
    }

    if (textareaBody) {
      let bodyText = "";
      if (copy.summary) {
        bodyText += `${copy.summary}\n\n`;
      }
      if (copy.bodyBullets) {
        bodyText += `📌 核心循证数据解析：\n`;
        bodyText += Array.isArray(copy.bodyBullets) ? copy.bodyBullets.join("\n") : copy.bodyBullets;
      }
      if (!bodyText && copy.summary) {
        bodyText = copy.summary;
      }
      textareaBody.value = bodyText.trim();
    }

    if (inputTags) {
      inputTags.value = copy.tags || "";
    }

    this.updateCopyCharCount();
  },

  updateCopyCharCount() {
    const t = document.getElementById("cw-title-input")?.value || "";
    const b = document.getElementById("cw-body-textarea")?.value || "";
    
    const titleCount = document.getElementById("title-char-count");
    if (titleCount) {
      titleCount.innerText = `${t.length} 字 (建议≤32字)`;
    }

    const bodyCount = document.getElementById("body-char-count");
    if (bodyCount) {
      bodyCount.innerText = `${b.length} 字 (建议300~800字)`;
    }
  },

  saveCopywriterChanges() {
    if (!this.currentData) return;

    const t = document.getElementById("cw-title-input")?.value.trim() || "";
    const b = document.getElementById("cw-body-textarea")?.value.trim() || "";
    const tags = document.getElementById("cw-tags-input")?.value.trim() || "";

    if (!this.currentData.socialMediaCopy) {
      this.currentData.socialMediaCopy = {};
    }

    this.currentData.socialMediaCopy.hookTitle = t;
    this.currentData.socialMediaCopy.summary = b;
    this.currentData.socialMediaCopy.tags = tags;

    // Update Card 1 cover title in real-time if rendered
    const coverTitle = document.querySelector(".card-cover-title");
    if (coverTitle && t) {
      coverTitle.innerText = t;
    }
  },

  showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    
    let icon = '<i class="fa-solid fa-circle-info"></i>';
    if (type === "success") icon = '<i class="fa-solid fa-circle-check"></i>';
    if (type === "error") icon = '<i class="fa-solid fa-circle-exclamation"></i>';

    toast.innerHTML = `${icon} <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
};
