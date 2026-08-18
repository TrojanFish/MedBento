/**
 * js/card_slicer.js
 * Social Media Multi-Card Slicer (小红书 3:4 / 抖音 9:16 / 方图 1:1)
 * Supports Adaptive Card Count Mode (5 ~ 8 Cards):
 *  - 5-Card Viral Deck: Hook, Design, KM Curve, Clinical Tradeoffs, Patient Guide
 *  - 7-Card Deep Clinical Deck: + Safety & Adverse Events, + Subgroup Forest Plot
 *  - 8-Card Full Comprehensive Deck: + Guideline Consensus & 4-Step Clinical Pathway
 * Uses 100% Native Inline Vector SVGs to guarantee perfect rendering in image exports without CORS font artifacts.
 */

const CardSlicer = {
  currentRatio: "ratio-3-4",
  currentTheme: "theme-dark",
  currentDeckMode: "auto", // "auto", "5", "7", "8"
  currentAuthor: "Dr. 肿瘤前沿速递",

  /**
   * Native SVG Vector Icon Provider
   * Completely immune to CORS webfont loading issues in html-to-image/Canvas
   */
  svgIcon(name, customStyle = "") {
    const styleAttr = customStyle ? ` style="${customStyle}; vertical-align: -0.15em; display: inline-block;"` : ` style="vertical-align: -0.15em; display: inline-block;"`;
    switch (name) {
      case "dna":
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"${styleAttr}><path d="M2 15c6.667-6 13.333 0 20-6"></path><path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993"></path><path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993"></path><path d="M17 6l-2.5-2.5"></path><path d="M14 8l-1-1"></path><path d="M7 18l2.5 2.5"></path><path d="M3.5 14.5l3 3"></path><path d="M20 9.5l-3-3"></path><path d="M10 16l1 1"></path></svg>`;
      case "feather":
        return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"${styleAttr}><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path><line x1="16" y1="8" x2="2" y2="22"></line><line x1="17.5" y1="15" x2="9" y2="15"></line></svg>`;
      case "book-medical":
        return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"${styleAttr}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path><line x1="12" y1="7" x2="12" y2="13"></line><line x1="9" y1="10" x2="15" y2="10"></line></svg>`;
      case "trend-up":
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"${styleAttr}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>`;
      case "users":
        return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"${styleAttr}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`;
      case "check":
        return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"${styleAttr}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
      case "stethoscope":
        return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"${styleAttr}><path d="M4.5 3v5a6.5 6.5 0 0 0 13 0V3"></path><path d="M17.5 3H21v3h-3.5zM3 3h3.5v3H3z"></path><path d="M11 14.5v3.5a3 3 0 0 0 6 0v-1"></path><circle cx="17" cy="17" r="2"></circle></svg>`;
      case "shield":
        return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"${styleAttr}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`;
      case "triangle-alert":
        return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"${styleAttr}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
      case "award":
        return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"${styleAttr}><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>`;
      default:
        return "";
    }
  },

  /**
   * Helper to get category name for each card in the deck
   */
  getCardCategoryName(cardType) {
    const map = {
      cover: "爆款核心封面",
      design: "试验方案设计",
      km: "KM生存分析",
      tradeoffs: "临床启示与获益",
      safety: "安全性与并发症",
      subgroups: "关键亚组获益",
      guidelines: "权威指南与路径",
      guide: "患者就医指南"
    };
    return map[cardType] || "切片卡片";
  },

  /**
   * Standardized Citation Formatter for Card Footer
   */
  getFormattedCitation(data) {
    if (!data) return "顶级同行评审期刊 · 临床研究";
    let journal = data.journal || "顶级同行评审期刊";
    let studyId = data.id || data.studyMeta?.trialName || "";

    // Clean up wrapping punctuation
    journal = journal.replace(/^[《<"']+|[》>"']+$/g, "").trim();

    // Standard medical journal abbreviations for excessively long titles
    const KNOWN_ABBR = [
      { key: "journal of thoracic oncology", abbr: "JTO (胸部肿瘤学)" },
      { key: "journal of clinical oncology", abbr: "JCO (临床肿瘤学)" },
      { key: "new england journal of medicine", abbr: "NEJM (新英格兰)" },
      { key: "the lancet oncology", abbr: "Lancet Oncol" },
      { key: "the lancet respiratory medicine", abbr: "Lancet Respir Med" },
      { key: "the lancet", abbr: "The Lancet (柳叶刀)" },
      { key: "nature medicine", abbr: "Nature Medicine" },
      { key: "annals of oncology", abbr: "Annals of Oncology" },
      { key: "clinical cancer research", abbr: "CCR (临床癌症研究)" },
      { key: "cancer cell", abbr: "Cancer Cell" },
      { key: "jama oncology", abbr: "JAMA Oncology" }
    ];

    const lowerJ = journal.toLowerCase();
    for (const item of KNOWN_ABBR) {
      if (lowerJ.includes(item.key)) {
        journal = item.abbr;
        break;
      }
    }

    if (studyId) {
      studyId = studyId.trim();
      if (studyId.length > 20) {
        studyId = studyId.substring(0, 18) + "...";
      }
      return `《${journal}》 · ${studyId}`;
    }
    return `《${journal}》`;
  },

  /**
   * Determine which cards to build based on mode and data richness
   */
  getCardTypes(data, mode = "auto") {
    if (mode === "5") {
      return ["cover", "design", "km", "tradeoffs", "guide"];
    }
    if (mode === "7") {
      return ["cover", "design", "km", "tradeoffs", "safety", "subgroups", "guide"];
    }
    if (mode === "8") {
      return ["cover", "design", "km", "tradeoffs", "safety", "subgroups", "guidelines", "guide"];
    }

    // "auto" adaptive mode:
    // If parsed document has safetyProfile and subgroupAnalysis -> expand to 7 or 8 cards
    const hasSafety = data && data.safetyProfile && (data.safetyProfile.keyAEs || data.safetyProfile.grade3PlusExp);
    const hasSubgroups = data && data.subgroupAnalysis && Array.isArray(data.subgroupAnalysis.items) && data.subgroupAnalysis.items.length > 0;
    const hasGuidelines = data && data.guidelineImpact && (data.guidelineImpact.level || data.guidelineImpact.clinicalPathway);

    if (hasSafety && hasSubgroups && hasGuidelines) {
      return ["cover", "design", "km", "tradeoffs", "safety", "subgroups", "guidelines", "guide"]; // 8 cards
    }
    if (hasSafety || hasSubgroups) {
      return ["cover", "design", "km", "tradeoffs", "safety", "subgroups", "guide"]; // 7 cards
    }
    return ["cover", "design", "km", "tradeoffs", "guide"]; // 5 cards
  },

  /**
   * Main entry point to render discrete cards
   */
  renderCards(data, container, ratio = "ratio-3-4", author = "Dr. 肿瘤前沿速递", deckMode = null) {
    if (!container) return;
    this.currentRatio = ratio;
    this.currentAuthor = author;
    if (deckMode) this.currentDeckMode = deckMode;

    const cardTypes = this.getCardTypes(data, this.currentDeckMode);
    const total = cardTypes.length;

    const cardsHtml = cardTypes.map((type, idx) => {
      const stepIndex = idx + 1;
      switch (type) {
        case "cover":
          return { html: this.generateCard1Cover(data, stepIndex, total), type };
        case "design":
          return { html: this.generateCard2Design(data, stepIndex, total), type };
        case "km":
          return { html: this.generateCard3SurvivalData(data, stepIndex, total), type };
        case "tradeoffs":
          return { html: this.generateCard4RecurrenceAndLung(data, stepIndex, total), type };
        case "safety":
          return { html: this.generateCard6Safety(data, stepIndex, total), type };
        case "subgroups":
          return { html: this.generateCard7Subgroups(data, stepIndex, total), type };
        case "guidelines":
          return { html: this.generateCard8Guidelines(data, stepIndex, total), type };
        case "guide":
        default:
          return { html: this.generateCard5ActionGuide(data, stepIndex, total), type };
      }
    });

    container.innerHTML = cardsHtml.map((item, idx) => `
      <div class="social-card-wrapper">
        <!-- Pure High-Resolution Card Target for Export -->
        <div id="social-card-${idx + 1}" class="social-card-item ${this.currentRatio} ${this.currentTheme}" data-card-index="${idx + 1}">
          ${item.html}
        </div>

        <!-- Sleek Card Deck Bottom Toolbar (Outside capture area) -->
        <div class="card-footer-toolbar">
          <div class="card-deck-indicator">
            <span class="card-deck-num">${idx + 1}</span>
            <span class="card-deck-name">${this.getCardCategoryName(item.type)}</span>
          </div>
          <button class="btn-slice-dl" onclick="Exporter.exportSingleCard(${idx + 1})" title="下载第 ${idx + 1} 张高清 PNG 图片">
            <i class="fa-solid fa-arrow-down-to-line"></i> 下载此张 (PNG)
          </button>
        </div>
      </div>
    `).join("");

    // Initialize mini KM chart on Card 3 (if present in DOM)
    setTimeout(() => {
      this.initCard3MiniChart(data);
    }, 50);
  },

  /**
   * Set Deck Count Mode ('auto', '5', '7', '8')
   */
  setDeckMode(mode) {
    this.currentDeckMode = mode;
    const currentData = (typeof App !== "undefined" && App.currentData) || (window.app && window.app.currentData);
    if (currentData) {
      const container = document.getElementById("social-cards-container");
      this.renderCards(currentData, container, this.currentRatio, this.currentAuthor, mode);
    }
  },

  /**
   * Update theme across all currently rendered cards
   */
  setTheme(themeName) {
    this.currentTheme = themeName;
    const cards = document.querySelectorAll(".social-card-item");
    cards.forEach(c => {
      c.classList.remove("theme-dark", "theme-light", "theme-emerald");
      c.classList.add(themeName);
    });

    // Re-render SVG KM chart with matching theme palette
    const currentData = (typeof App !== "undefined" && App.currentData) || (window.app && window.app.currentData) || (typeof MedicalAnalyzer !== "undefined" && MedicalAnalyzer.DEFAULT_JCOG_DATA);
    if (currentData) {
      const container = document.querySelector(".card-km-container");
      if (container) {
        container.innerHTML = this.generateKMVectorSVG(currentData);
      }
    }
  },

  /**
   * Standardized Header
   */
  getHeader(stepIndex, total = 5) {
    const author = this.currentAuthor || "Dr. 肿瘤前沿速递";
    return `
      <div class="card-header-bar">
        <div class="brand-badge">
          ${this.svgIcon("dna", "color:var(--card-accent)")}
          <span>MedBento AI · 临床洞察</span>
        </div>
        <div class="card-header-right">
          <span class="card-author" contenteditable="true" title="点击可直接修改署名">
            ${this.svgIcon("feather", "color:var(--card-accent); margin-right:3px")}@${author}
          </span>
          <div class="card-step-pill">${stepIndex} / ${total}</div>
        </div>
      </div>
    `;
  },

  /**
   * Standardized Footer
   */
  getFooter(sourceText = "顶级同行评审期刊 · 临床研究") {
    return `
      <div class="card-footer-bar">
        <span class="card-footer-source" title="${sourceText}">
          ${this.svgIcon("book-medical", "color:var(--card-accent); margin-right:4px; flex-shrink:0;")}
          <span class="card-footer-source-text" contenteditable="true">${sourceText}</span>
        </span>
        <span class="card-footer-disclaimer">仅供学术交流 · 诊疗遵医嘱</span>
      </div>
    `;
  },

  /**
   * Smart Cover Journal Badge Formatter
   */
  getCoverJournalBadge(data) {
    let j = (data.journal || "Lancet").trim();
    if (j.includes("Lancet")) return "《Lancet 柳叶刀》重磅";
    if (j.includes("New England") || j.includes("NEJM")) return "《NEJM》顶刊重磅";
    if (j.includes("Journal of Clinical Oncology") || j.includes("JCO")) return "《JCO》顶刊重磅";
    if (j.includes("Thoracic Oncology") || j.includes("JTO")) return "《JTO》胸部肿瘤重磅";
    if (j.includes("Nature")) return "《Nature》顶级重磅";
    if (j.includes("Cell")) return "《Cell》顶刊重磅";
    if (j.length > 12) {
      j = this.getShortJournalName(j);
    }
    return `《${j}》重磅`;
  },

  /**
   * Card 1: 爆款封面大字卡
   */
  generateCard1Cover(data, stepIndex = 1, total = 5) {
    const exp = data.arms?.experimental || { name: "试验组", fiveYrOS: 94.3 };
    const ctrl = data.arms?.control || { name: "对照组", fiveYrOS: 91.1 };
    const stats = data.statistics || { osHazardRatio: "0.663", osRiskReduction: "33.7%" };
    const sampleSizeStr = typeof data.sampleSize === "number" ? `N=${data.sampleSize.toLocaleString()} 例` : `N=${data.sampleSize || '1106'} 例`;
    const citation = this.getFormattedCitation(data);

    return `
      ${this.getHeader(stepIndex, total)}
      <div class="card-content-body" style="text-align: center;">
        <div class="card-cover-badges">
          <span class="badge-lancet" style="white-space:nowrap; word-break:keep-all; min-width:max-content; flex:0 0 auto;" contenteditable="true">${this.getCoverJournalBadge(data)}</span>
          <span class="badge-jcog" style="white-space:nowrap; word-break:keep-all; min-width:max-content; flex:0 0 auto;" contenteditable="true">${data.id || "前沿临床研究"}</span>
        </div>

        <h2 class="card-cover-title" contenteditable="true">
          ${data.socialMediaCopy?.hookTitle || data.title || "重磅医学临床研究突破！"}
        </h2>

        <div class="sc-highlight-card">
          <div style="font-size:0.72rem; color:var(--card-text-muted); text-transform:uppercase; letter-spacing:0.05em;">5-Year Overall Survival (5年总生存率)</div>
          <div class="card-cover-stat" contenteditable="true">
            ${exp.fiveYrOS}% <span style="font-size:1.3rem; color:var(--card-text-muted); font-weight:400;">vs ${ctrl.fiveYrOS}%</span>
          </div>
          <div style="font-size:0.82rem; font-weight:700; color:var(--card-accent-green);" contenteditable="true">
            ${this.svgIcon("trend-up", "margin-right:3px")}${stats.osRiskReduction ? '死亡风险降低 ' + stats.osRiskReduction : '统计学显著优效'} (HR ${stats.osHazardRatio || '0.663'})
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; text-align:left;">
          <div class="sc-box" style="border-left: 3px solid var(--card-accent);">
            <div style="font-size:0.68rem; color:var(--card-text-muted);">样本量 & 随访</div>
            <div style="font-size:0.92rem; font-weight:800; color:var(--card-text-title);" contenteditable="true">${sampleSizeStr} / ${data.medianFollowup || '7.3年'}</div>
          </div>
          <div class="sc-box" style="border-left: 3px solid var(--card-accent-green);">
            <div style="font-size:0.68rem; color:var(--card-text-muted);">临床获益与结局</div>
            <div style="font-size:0.92rem; font-weight:800; color:var(--card-accent-green);" contenteditable="true">${stats.osRiskReduction ? '死亡风险降 ' + stats.osRiskReduction : '多维度获益确立'}</div>
          </div>
        </div>
      </div>
      ${this.getFooter(citation)}
    `;
  },

  /**
   * Card 2: 试验设计与入组标准卡
   */
  generateCard2Design(data, stepIndex = 2, total = 5) {
    const exp = data.arms?.experimental || { name: "试验组 (Segmentectomy)" };
    const ctrl = data.arms?.control || { name: "对照组 (Lobectomy)" };
    const sampleSizeStr = typeof data.sampleSize === "number" ? `${data.sampleSize.toLocaleString()}例大样本` : `${data.sampleSize || '1106例'}大样本`;
    const citation = this.getFormattedCitation(data);

    return `
      ${this.getHeader(stepIndex, total)}
      <div class="card-content-body">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="padding:2px 8px; background:var(--card-highlight-bg); border:1px solid var(--card-highlight-border); border-radius:6px; font-size:0.72rem; font-weight:700; color:var(--card-accent);">STUDY DESIGN</span>
          <h3 style="font-size:1.05rem; font-weight:800; color:var(--card-text-title); margin:0;" contenteditable="true">${sampleSizeStr}：怎么比的？</h3>
        </div>

        <div class="sc-box" style="border-left: 3.5px solid var(--card-accent);">
          <div style="font-weight:700; font-size:0.82rem; color:var(--card-accent); margin-bottom:2px;" contenteditable="true">
            ${this.svgIcon("users", "margin-right:5px")}入组与适应症标准
          </div>
          <div style="font-size:0.75rem; color:var(--card-text-body); line-height:1.4;" contenteditable="true">
            • 目标人群：<b>${data.targetPopulation || '经严格病理诊断入组患者'}</b><br/>
            • 随机对照：前瞻性 1:1 随机分组与长周期随访
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
          <div class="sc-box" style="text-align:center; border: 1px solid var(--card-highlight-border);">
            <div style="font-size:0.7rem; color:var(--card-accent); font-weight:700;">试验组 (Experimental)</div>
            <div style="font-size:0.96rem; font-weight:800; color:var(--card-text-title); margin:2px 0;" contenteditable="true">${exp.name}</div>
            <div style="font-size:0.68rem; color:var(--card-text-muted);">精准干预 / 新术式方案</div>
          </div>
          <div class="sc-box" style="text-align:center;">
            <div style="font-size:0.7rem; color:var(--card-text-muted); font-weight:700;">对照组 (Control)</div>
            <div style="font-size:0.96rem; font-weight:800; color:var(--card-text-title); margin:2px 0;" contenteditable="true">${ctrl.name}</div>
            <div style="font-size:0.68rem; color:var(--card-text-muted);">经典传统标准方案</div>
          </div>
        </div>

        <div class="sc-box" style="border-left: 3.5px solid var(--card-accent-green);">
          <div style="font-size:0.75rem; font-weight:700; color:var(--card-accent-green); margin-bottom:2px;" contenteditable="true">
            ${this.svgIcon("check", "margin-right:4px")}随访硬指标
          </div>
          <div style="font-size:0.72rem; color:var(--card-text-body);" contenteditable="true">
            主要终点为<b>总生存期 (OS)</b>，中位随访长达 <b>${data.medianFollowup || '7.3年'}</b>，全流程严格质控。
          </div>
        </div>
      </div>
      ${this.getFooter(citation)}
    `;
  },

  /**
   * Card 3: KM生存曲线与硬核数据卡
   */
  generateCard3SurvivalData(data, stepIndex = 3, total = 5) {
    const exp = data.arms?.experimental || { name: "试验组", fiveYrOS: 94.3, fiveYrRFS: 88.0 };
    const ctrl = data.arms?.control || { name: "对照组", fiveYrOS: 91.1, fiveYrRFS: 87.9 };
    const stats = data.statistics || { osHazardRatio: "0.663", pValueSuperiority: "0.0082", osRiskReduction: "33.7%" };
    const citation = this.getFormattedCitation(data);

    return `
      ${this.getHeader(stepIndex, total)}
      <div class="card-content-body">
        <div style="display:flex; align-items:center; justify-content:space-between;">
          <div>
            <span style="padding:2px 8px; background:var(--card-highlight-bg); border:1px solid var(--card-highlight-border); border-radius:6px; font-size:0.7rem; font-weight:700; color:var(--card-accent-green);">OS ENDPOINT</span>
            <h3 style="font-size:1.05rem; font-weight:800; color:var(--card-text-title); margin:2px 0 0;" contenteditable="true">5年总生存率：试验组显著胜出</h3>
          </div>
          <div style="text-align:right;">
            <span style="font-size:0.7rem; color:var(--card-text-muted);">P = ${stats.pValueSuperiority || '0.0082'}</span>
            <div style="font-size:0.82rem; font-weight:800; color:var(--card-accent-green);" contenteditable="true">优效性确立</div>
          </div>
        </div>

        <!-- Mini KM Vector Chart for Social Card (Crystal-Clear Native SVG) -->
        <div class="card-km-container" style="position:relative; width:100%; height:115px; background:var(--card-canvas-bg); border:1px solid var(--card-box-border); border-radius:10px; padding:4px; box-sizing:border-box; overflow:hidden;">
          ${this.generateKMVectorSVG(data)}
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
          <div class="sc-box" style="border-left:3px solid var(--card-accent);">
            <div style="font-size:0.68rem; color:var(--card-text-muted);">5年总生存率 (5-Yr OS)</div>
            <div style="font-size:1.25rem; font-weight:900; color:var(--card-accent);" contenteditable="true">${exp.fiveYrOS}% vs ${ctrl.fiveYrOS}%</div>
            <div style="font-size:0.65rem; color:var(--card-text-muted);">试验组显著优于对照组</div>
          </div>

          <div class="sc-box" style="border-left:3px solid var(--card-accent-green);">
            <div style="font-size:0.68rem; color:var(--card-text-muted);">死亡风险比 (Hazard Ratio)</div>
            <div style="font-size:1.25rem; font-weight:900; color:var(--card-accent-green);" contenteditable="true">HR ${stats.osHazardRatio || '0.663'}</div>
            <div style="font-size:0.65rem; color:var(--card-text-muted);">${stats.osRiskReduction ? '死亡风险降低 ' + stats.osRiskReduction : '获益明确'}</div>
          </div>
        </div>

        <div class="sc-box" style="border-left:3px solid var(--card-accent-amber); padding:6px 10px;">
          <div style="font-size:0.72rem; color:var(--card-text-body);" contenteditable="true">
            <b style="color:var(--card-accent-amber);">次要终点 (5年 RFS)：</b> ${exp.fiveYrRFS}% vs ${ctrl.fiveYrRFS}%，证实两组在肿瘤局部根治与控制上完全等效！
          </div>
        </div>
      </div>
      ${this.getFooter(citation)}
    `;
  },

  /**
   * Card 4: 获益与复发权衡卡
   */
  generateCard4RecurrenceAndLung(data, stepIndex = 4, total = 5) {
    const takeaways = Array.isArray(data.doctorTakeaways) && data.doctorTakeaways.length > 0 
      ? data.doctorTakeaways 
      : ["确立新术式/治疗方案为优选标准；", "关注综合生理机能与生活质量保留；", "严格把握适应症与规范化随访。"];
    const citation = this.getFormattedCitation(data);

    return `
      ${this.getHeader(stepIndex, total)}
      <div class="card-content-body">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="padding:2px 8px; background:var(--card-highlight-bg); border:1px solid var(--card-highlight-border); border-radius:6px; font-size:0.7rem; font-weight:700; color:var(--card-accent-red);">CLINICAL INSIGHTS</span>
          <h3 style="font-size:1.05rem; font-weight:800; color:var(--card-text-title); margin:0;" contenteditable="true">核心临床启示与获益权衡</h3>
        </div>

        <div class="sc-box" style="border-left:3.5px solid var(--card-accent-green);">
          <div style="font-weight:700; font-size:0.78rem; color:var(--card-accent-green); margin-bottom:4px;" contenteditable="true">
            ${this.svgIcon("stethoscope", "margin-right:4px")}专家核心共识与要点
          </div>
          <div style="font-size:0.72rem; color:var(--card-text-body); line-height:1.45;" contenteditable="true">
            <b>1. </b>${takeaways[0]}<br/>
            <b>2. </b>${takeaways[1] || takeaways[0]}<br/>
            <b>3. </b>${takeaways[2] || '规范化随访质控保障长期获益。'}
          </div>
        </div>

        <div class="sc-box" style="padding:6px 10px; font-size:0.7rem; color:var(--card-text-muted);" contenteditable="true">
          ${this.svgIcon("shield", "color:var(--card-accent); margin-right:4px")}<b>临床铁律：</b>严格遵循临床指征与规范化路径，实现个体化最优生存获益。
        </div>
      </div>
      ${this.getFooter(citation)}
    `;
  },

  /**
   * Card 6: 安全性与不良反应谱卡 (Adaptive Extension)
   */
  generateCard6Safety(data, stepIndex = 5, total = 7) {
    const safety = data.safetyProfile || {
      grade3PlusExp: "22.3% (123例)",
      grade3PlusCtrl: "22.9% (127例)",
      grade3PlusP: "P = 0.82 (两组无差异)",
      keyAEs: [
        { name: "术后肺漏气 >7天", exp: "12.3% (68例)", ctrl: "6.5% (36例)", note: "肺段需精细缝合 (P=0.001)" },
        { name: "30天/90天围术期死亡率", exp: "0.0% / 0.4% (2例)", ctrl: "0.0% / 0.2% (1例)", note: "极致安全性一致" },
        { name: "严重心律失常/房颤", exp: "2.2% (12例)", ctrl: "2.5% (14例)", note: "心脏耐受性良好" },
        { name: "非肿瘤远期合并症死因", exp: "27 例 (降低48%)", ctrl: "52 例", note: "保肺降低心肺衰竭死亡" }
      ]
    };
    const citation = this.getFormattedCitation(data);

    const aeSummary = (safety.keyAEs && Array.isArray(safety.keyAEs) && safety.keyAEs.length > 0)
      ? safety.keyAEs.slice(0, 2).map(ae => `• <b>${ae.name}：</b> 试验组 ${ae.exp || '-'} vs 对照组 ${ae.ctrl || '-'}${ae.note ? ' (' + ae.note + ')' : ''}`).join('<br/>')
      : `• <b>主要不良反应：</b> 试验组与对照组发生率高度一致；<br/>• <b>远期安全性：</b> 未见新增严重未预期不良反应信号。`;

    return `
      ${this.getHeader(stepIndex, total)}
      <div class="card-content-body">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="padding:2px 8px; background:var(--card-highlight-bg); border:1px solid var(--card-highlight-border); border-radius:6px; font-size:0.7rem; font-weight:700; color:var(--card-accent-red);">SAFETY PROFILE</span>
          <h3 style="font-size:1.05rem; font-weight:800; color:var(--card-text-title); margin:0;" contenteditable="true">安全性与不良事件对比</h3>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
          <div class="sc-box" style="border-left:3px solid var(--card-accent);">
            <div style="font-size:0.68rem; color:var(--card-text-muted);">≥3级 严重不良事件</div>
            <div style="font-size:1.15rem; font-weight:900; color:var(--card-text-title);" contenteditable="true">${safety.grade3PlusExp || '22.3%'} vs ${safety.grade3PlusCtrl || '22.9%'}</div>
            <div style="font-size:0.64rem; color:var(--card-text-muted);">${safety.grade3PlusP || '无统计学显著差异'}</div>
          </div>
          <div class="sc-box" style="border-left:3px solid var(--card-accent-green);">
            <div style="font-size:0.68rem; color:var(--card-text-muted);">围术期/近期死亡率</div>
            <div style="font-size:1.15rem; font-weight:900; color:var(--card-accent-green);" contenteditable="true">${safety.mortality || '0.0% vs 0.2%'}</div>
            <div style="font-size:0.64rem; color:var(--card-text-muted);">两组安全性高度一致</div>
          </div>
        </div>

        <div class="sc-box" style="border-left:3.5px solid var(--card-accent-amber); padding:8px 10px;">
          <div style="font-size:0.76rem; font-weight:700; color:var(--card-accent-amber); margin-bottom:4px;" contenteditable="true">
            ${this.svgIcon("triangle-alert", "margin-right:4px")}重点不良事件与管理要点
          </div>
          <div style="font-size:0.72rem; color:var(--card-text-body); line-height:1.45;" contenteditable="true">
            ${aeSummary}
          </div>
        </div>

        <div class="sc-box" style="font-size:0.7rem; color:var(--card-text-muted);" contenteditable="true">
          ${this.svgIcon("shield", "color:var(--card-accent); margin-right:4px")}<b>安全定性：</b>两组严重不良反应相当，高水平中心实施极其安全可控。
        </div>
      </div>
      ${this.getFooter(citation)}
    `;
  },

  /**
   * Card 7: 关键亚组获益森林图卡 (Adaptive Extension)
   */
  generateCard7Subgroups(data, stepIndex = 6, total = 7) {
    const subgroups = (data.subgroupAnalysis && Array.isArray(data.subgroupAnalysis.items)) ? data.subgroupAnalysis.items : [
      { name: "≥65岁 老年人群 (N=558)", hr: "0.58", ci: "0.36 - 0.93", benefit: "显著优效 (保肺生存优势突出)" },
      { name: "CTR 0.5~1.0 (实性为主)", hr: "0.61", ci: "0.42 - 0.89", benefit: "优效确立 (P=0.010)" },
      { name: "女性 / 从不吸烟人群", hr: "0.65", ci: "0.41 - 1.04", benefit: "获益趋势高度一致" },
      { name: "病理确诊腺癌 (Adeno)", hr: "0.67", ci: "0.47 - 0.95", benefit: "统计学显著获益" }
    ];
    const citation = this.getFormattedCitation(data);
    const topSg = subgroups[0] || { name: "主要预设亚组", hr: "0.58" };

    return `
      ${this.getHeader(stepIndex, total)}
      <div class="card-content-body">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="padding:2px 8px; background:var(--card-highlight-bg); border:1px solid var(--card-highlight-border); border-radius:6px; font-size:0.7rem; font-weight:700; color:var(--card-accent);">SUBGROUP ANALYSIS</span>
          <h3 style="font-size:1.05rem; font-weight:800; color:var(--card-text-title); margin:0;" contenteditable="true">关键亚组获益森林图：谁最受益？</h3>
        </div>

        <div style="display:flex; flex-direction:column; gap:6px;">
          ${subgroups.map(sg => `
            <div class="sc-box" style="padding:6px 10px; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <div style="font-size:0.76rem; font-weight:700; color:var(--card-text-title);" contenteditable="true">${sg.name}</div>
                <div style="font-size:0.66rem; color:var(--card-text-muted);" contenteditable="true">${sg.benefit || '生存获益一致'}</div>
              </div>
              <div style="text-align:right;">
                <span style="font-size:0.86rem; font-weight:800; color:var(--card-accent-green); background:rgba(16,185,129,0.12); padding:2px 6px; border-radius:6px;" contenteditable="true">HR ${sg.hr}</span>
                <div style="font-size:0.62rem; color:var(--card-text-muted); margin-top:2px;">95%CI: ${sg.ci || '优效'}</div>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="sc-box" style="border-left:3.5px solid var(--card-accent-green); font-size:0.72rem; color:var(--card-text-body);" contenteditable="true">
          ${this.svgIcon("check", "color:var(--card-accent-green); margin-right:4px")}<b>亚组全线获益：</b>在所有预设关键亚组中，试验组均保持稳固生存获益，尤其<b>${topSg.name} (HR ${topSg.hr})</b> 获益最为显著！
        </div>
      </div>
      ${this.getFooter(citation)}
    `;
  },

  /**
   * Card 8: 权威指南与全流程诊疗路径卡 (Adaptive Extension)
   */
  generateCard8Guidelines(data, stepIndex = 7, total = 8) {
    const guidelines = data.guidelineImpact || {
      level: "NCCN / CSCO 1A 类最高等级指南推荐",
      paradigmShift: "正式改写全球临床金标准，确立试验方案为推荐优选标准术式/用药路径！",
      pathways: [
        { step: "1. 术前精准多维评估", desc: "高分辨影像与生物标志物精准分型" },
        { step: "2. 术中/方案严格质控", desc: "确保规范化实施与安全达标" },
        { step: "3. 围术期康复支持", desc: "全程支持治疗与不良反应监测" },
        { step: "4. 长期规范随访", desc: "规律随访复查评估远期生存" }
      ]
    };
    const pathways = Array.isArray(guidelines.pathways) && guidelines.pathways.length === 4 ? guidelines.pathways : [
      { step: "1. 术前精准多维评估", desc: "高分辨影像与生物标志物精准分型" },
      { step: "2. 术中/方案严格质控", desc: "确保规范化实施与安全达标" },
      { step: "3. 围术期康复支持", desc: "全程支持治疗与不良反应监测" },
      { step: "4. 长期规范随访", desc: "规律随访复查评估远期生存" }
    ];
    const citation = this.getFormattedCitation(data);

    return `
      ${this.getHeader(stepIndex, total)}
      <div class="card-content-body">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="padding:2px 8px; background:var(--card-highlight-bg); border:1px solid var(--card-highlight-border); border-radius:6px; font-size:0.7rem; font-weight:700; color:var(--card-accent-amber);">GUIDELINE & PATHWAY</span>
          <h3 style="font-size:1.05rem; font-weight:800; color:var(--card-text-title); margin:0;" contenteditable="true">权威指南共识与诊疗全流程</h3>
        </div>

        <div class="sc-box" style="border-left:3.5px solid var(--card-accent-amber); padding:8px 10px;">
          <div style="font-size:0.76rem; font-weight:700; color:var(--card-accent-amber); margin-bottom:2px;" contenteditable="true">
            ${this.svgIcon("award", "margin-right:4px")}${guidelines.level}
          </div>
          <div style="font-size:0.72rem; color:var(--card-text-body);" contenteditable="true">
            ${guidelines.paradigmShift}
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
          ${pathways.map((p, idx) => `
            <div class="sc-box" style="padding:6px 8px;">
              <div style="font-size:0.72rem; font-weight:700; color:${idx < 2 ? 'var(--card-accent)' : 'var(--card-accent-green)'};" contenteditable="true">${p.step}</div>
              <div style="font-size:0.66rem; color:var(--card-text-muted);" contenteditable="true">${p.desc}</div>
            </div>
          `).join('')}
        </div>

        <div class="sc-box" style="font-size:0.7rem; color:var(--card-text-muted);" contenteditable="true">
          ${this.svgIcon("shield", "color:var(--card-accent); margin-right:4px")}<b>诊疗准则：</b>严格遵循临床指征与规范化路径，实现个体化最优生存获益。
        </div>
      </div>
      ${this.getFooter(citation)}
    `;
  },

  /**
   * Card 5: 患者就医指南与行动建议卡
   */
  generateCard5ActionGuide(data, stepIndex = 5, total = 5) {
    const pt = Array.isArray(data.patientTakeaways) && data.patientTakeaways.length > 0
      ? data.patientTakeaways
      : [
          "早筛早治可治愈，理性看待临床生存数据；",
          "与主治专家充分沟通个体化适宜方案；",
          "术后遵医嘱规律随访，保持良好生活习惯；",
          "选择具备丰富经验的三甲医疗团队就诊。"
        ];
    const citation = this.getFormattedCitation(data);

    return `
      ${this.getHeader(stepIndex, total)}
      <div class="card-content-body">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="padding:2px 8px; background:var(--card-highlight-bg); border:1px solid var(--card-highlight-border); border-radius:6px; font-size:0.7rem; font-weight:700; color:var(--card-accent);">ACTION GUIDE</span>
          <h3 style="font-size:1.05rem; font-weight:800; color:var(--card-text-title); margin:0;" contenteditable="true">患者与家属：就医四步指南</h3>
        </div>

        <div class="sc-box" style="border-left:3.5px solid var(--card-accent);">
          <div style="font-size:0.76rem; font-weight:700; color:var(--card-accent);" contenteditable="true">1. 把握黄金窗口，理性对待</div>
          <div style="font-size:0.72rem; color:var(--card-text-body);" contenteditable="true">${pt[0]}</div>
        </div>

        <div class="sc-box" style="border-left:3.5px solid var(--card-accent-green);">
          <div style="font-size:0.76rem; font-weight:700; color:var(--card-accent-green);" contenteditable="true">2. 充分评估沟通，个体化施策</div>
          <div style="font-size:0.72rem; color:var(--card-text-body);" contenteditable="true">${pt[1] || pt[0]}</div>
        </div>

        <div class="sc-box" style="border-left:3.5px solid var(--card-accent-amber);">
          <div style="font-size:0.76rem; font-weight:700; color:var(--card-accent-amber);" contenteditable="true">3. 严密规律随访，早防早治</div>
          <div style="font-size:0.72rem; color:var(--card-text-body);" contenteditable="true">${pt[2] || '遵医嘱定期复查，发现异常及时干预。'}</div>
        </div>

        <div class="sc-box" style="border-left:3.5px solid var(--card-accent);">
          <div style="font-size:0.76rem; font-weight:700; color:var(--card-accent);" contenteditable="true">4. 选择规范化诊疗医疗中心</div>
          <div style="font-size:0.72rem; color:var(--card-text-body);" contenteditable="true">${pt[3] || '建议到具备多学科综合诊疗实力的三甲医院就医。'}</div>
        </div>
      </div>
      ${this.getFooter(citation)}
    `;
  },

  /**
   * Pure Native Vector SVG Kaplan-Meier Curve Generator
   * 100% immune to WebKit/Safari offscreen canvas bugs, renders instantly with 4K clarity on both PC and WebApp.
   */
  generateKMVectorSVG(data) {
    if (!data) return "";

    const isLight = this.currentTheme === "theme-light";
    const isEmerald = this.currentTheme === "theme-emerald";

    const colorExp = isLight ? "#0369A1" : isEmerald ? "#34D399" : "#00E5FF";
    const colorCtrl = isLight ? "#78716C" : isEmerald ? "#6EE7B7" : "#94A3B8";
    const gridColor = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";
    const textColor = isLight ? "#57534E" : "#94A3B8";
    const fillGradientId = `km-grad-${this.currentTheme || 'theme-dark'}`;
    const fillColorStart = isLight ? "rgba(3,105,161,0.25)" : isEmerald ? "rgba(52,211,153,0.25)" : "rgba(0,229,255,0.25)";

    const km = data.kmData || (typeof MedicalAnalyzer !== "undefined" && MedicalAnalyzer.DEFAULT_JCOG_DATA ? MedicalAnalyzer.DEFAULT_JCOG_DATA.kmData : {
      years: [0, 1, 2, 3, 4, 5, 6, 7],
      segmentectomyOS: [100.0, 99.1, 97.8, 96.4, 95.2, 94.3, 93.1, 91.8],
      lobectomyOS:      [100.0, 98.4, 96.2, 94.1, 92.5, 91.1, 89.2, 87.5]
    });

    const years = km.years || [0, 1, 2, 3, 4, 5, 6, 7];
    const segOS = km.segmentectomyOS || [100, 99.1, 97.8, 96.4, 95.2, 94.3, 93.1, 91.8];
    const lobOS = km.lobectomyOS || [100, 98.4, 96.2, 94.1, 92.5, 91.1, 89.2, 87.5];

    const allVals = [...segOS, ...lobOS].filter(v => typeof v === 'number' && !isNaN(v));
    const minVal = allVals.length > 0 ? Math.min(...allVals) : 80;
    const yMin = Math.max(0, Math.floor((minVal - 5) / 5) * 5);
    const yMax = 100;

    const width = 360;
    const height = 115;
    const padLeft = 32;
    const padRight = 14;
    const padTop = 18;
    const padBottom = 20;

    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    const getX = (yearIdx) => {
      const maxIdx = Math.max(1, years.length - 1);
      return padLeft + (yearIdx / maxIdx) * plotW;
    };

    const getY = (val) => {
      const pct = (val - yMin) / (yMax - yMin);
      return padTop + plotH - (pct * plotH);
    };

    const pathExp = [];
    const pathCtrl = [];
    const dotsExp = [];
    const dotsCtrl = [];

    for (let i = 0; i < years.length; i++) {
      const x = getX(i);
      const yE = getY(segOS[i] !== undefined ? segOS[i] : 94.3);
      const yC = getY(lobOS[i] !== undefined ? lobOS[i] : 91.1);

      if (i === 0) {
        pathExp.push(`M ${x.toFixed(1)} ${yE.toFixed(1)}`);
        pathCtrl.push(`M ${x.toFixed(1)} ${yC.toFixed(1)}`);
      } else {
        const prevYE = getY(segOS[i - 1] !== undefined ? segOS[i - 1] : 95);
        const prevYC = getY(lobOS[i - 1] !== undefined ? lobOS[i - 1] : 92);
        pathExp.push(`L ${x.toFixed(1)} ${prevYE.toFixed(1)} L ${x.toFixed(1)} ${yE.toFixed(1)}`);
        pathCtrl.push(`L ${x.toFixed(1)} ${prevYC.toFixed(1)} L ${x.toFixed(1)} ${yC.toFixed(1)}`);
      }

      dotsExp.push(`<circle cx="${x.toFixed(1)}" cy="${yE.toFixed(1)}" r="2.2" fill="${colorExp}"/>`);
      dotsCtrl.push(`<circle cx="${x.toFixed(1)}" cy="${yC.toFixed(1)}" r="2.2" fill="${colorCtrl}"/>`);
    }

    const lastX = getX(years.length - 1);
    const baseY = getY(yMin);
    const areaD = `${pathExp.join(' ')} L ${lastX.toFixed(1)} ${baseY.toFixed(1)} L ${padLeft.toFixed(1)} ${baseY.toFixed(1)} Z`;

    const yTicks = [yMin, yMin + (yMax - yMin) / 2, yMax];
    const gridSvg = [];
    for (const yt of yTicks) {
      const yPos = getY(yt);
      gridSvg.push(`<line x1="${padLeft}" y1="${yPos.toFixed(1)}" x2="${(width - padRight).toFixed(1)}" y2="${yPos.toFixed(1)}" stroke="${gridColor}" stroke-dasharray="2,2"/>`);
      gridSvg.push(`<text x="${(padLeft - 4).toFixed(1)}" y="${(yPos + 3).toFixed(1)}" fill="${textColor}" font-size="8" text-anchor="end" font-family="system-ui">${Math.round(yt)}%</text>`);
    }

    for (let i = 0; i < years.length; i++) {
      const x = getX(i);
      gridSvg.push(`<text x="${x.toFixed(1)}" y="${height - 6}" fill="${textColor}" font-size="8" text-anchor="middle" font-family="system-ui">${years[i]}y</text>`);
    }

    let expLabel = data.arms?.experimental?.name || "试验组";
    let ctrlLabel = data.arms?.control?.name || "对照组";
    if (expLabel.length > 10) expLabel = "试验组";
    if (ctrlLabel.length > 10) ctrlLabel = "对照组";

    return `
      <svg viewBox="0 0 ${width} ${height}" style="width:100%; height:100%; display:block;" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="${fillGradientId}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${fillColorStart}" stop-opacity="1"/>
            <stop offset="100%" stop-color="${fillColorStart}" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <g transform="translate(${width - padRight - 145}, 10)">
          <rect x="0" y="-6" width="10" height="2" fill="${colorExp}"/>
          <text x="14" y="-3" fill="${textColor}" font-size="8.5" font-weight="bold" font-family="system-ui">${expLabel}</text>
          <line x1="70" y1="-5" x2="80" y2="-5" stroke="${colorCtrl}" stroke-dasharray="2,2" stroke-width="1.5"/>
          <text x="84" y="-3" fill="${textColor}" font-size="8.5" font-weight="bold" font-family="system-ui">${ctrlLabel}</text>
        </g>
        ${gridSvg.join('')}
        <path d="${areaD}" fill="url(#${fillGradientId})"/>
        <path d="${pathCtrl.join(' ')}" fill="none" stroke="${colorCtrl}" stroke-width="1.8" stroke-dasharray="4,3"/>
        <path d="${pathExp.join(' ')}" fill="none" stroke="${colorExp}" stroke-width="2.2"/>
        ${dotsCtrl.join('')}
        ${dotsExp.join('')}
      </svg>
    `;
  },

  /**
   * Compatibility wrapper for mini KM chart
   */
  initCard3MiniChart(data) {
    const container = document.querySelector(".card-km-container");
    if (container && data) {
      container.innerHTML = this.generateKMVectorSVG(data);
    }
  }
};
