/**
 * js/pdf_extractor.js
 * Multi-Format Document & Webpage Extractor
 * Supports: PDF (.pdf), Word (.docx), Markdown (.md), Plain Text (.txt), JSON (.json), HTML (.html/.htm), and Online Webpage Links (URLs).
 */

const PDFExtractor = {
  /**
   * Extract plain text / markdown from a File object
   * @param {File} file 
   * @param {Function} onProgress 
   * @returns {Promise<string>}
   */
  async extractTextFromFile(file, onProgress = null) {
    if (!file) throw new Error("未选择任何文件");
    const name = file.name.toLowerCase();

    // 1. Plain Text, Markdown, HTML, JSON, CSV
    if (
      file.type === "text/plain" || 
      file.type === "text/markdown" ||
      file.type === "text/html" ||
      file.type === "application/json" ||
      name.endsWith(".txt") || 
      name.endsWith(".md") ||
      name.endsWith(".json") ||
      name.endsWith(".csv") ||
      name.endsWith(".html") ||
      name.endsWith(".htm")
    ) {
      if (onProgress) onProgress(100, "文本文件读取完成");
      const rawText = await file.text();
      // If HTML file, strip tags cleanly
      if (name.endsWith(".html") || name.endsWith(".htm") || file.type === "text/html") {
        return this.stripHtmlTags(rawText);
      }
      return rawText;
    }

    // 2. Word Documents (.docx)
    if (name.endsWith(".docx") || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      return await this.extractFromDocx(file, onProgress);
    }

    // 3. PDF Documents (.pdf)
    if (file.type === "application/pdf" || name.endsWith(".pdf")) {
      return await this.extractFromPdf(file, onProgress);
    }

    throw new Error("不支持的文件格式，目前支持：PDF (.pdf)、Word (.docx)、Markdown (.md)、文本 (.txt)、网页 (.html) 与 JSON");
  },

  /**
   * Extract text from PDF using PDF.js
   */
  async extractFromPdf(file, onProgress = null) {
    if (typeof pdfjsLib === "undefined") {
      throw new Error("PDF 解析器尚未完成加载，请检查网络连接或切换为纯文本粘贴。");
    }

    try {
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      }

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      let fullText = "";

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        if (onProgress) {
          onProgress(Math.round((pageNum / numPages) * 100), `正在解析第 ${pageNum} / ${numPages} 页...`);
        }
        
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        let lastY = null;
        let pageStr = "";
        
        for (const item of textContent.items) {
          if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
            pageStr += "\n";
          }
          pageStr += item.str + " ";
          lastY = item.transform[5];
        }
        
        fullText += `\n--- [Page ${pageNum}] ---\n` + pageStr;
      }

      return this.cleanExtractedText(fullText);
    } catch (err) {
      console.error("PDF Extraction error:", err);
      throw new Error("PDF 解析失败（可能为加密文件或损坏），建议直接粘贴正文。");
    }
  },

  /**
   * Extract text from Word (.docx) using Mammoth.js
   */
  async extractFromDocx(file, onProgress = null) {
    if (typeof mammoth === "undefined") {
      throw new Error("Word 解析器尚未完成加载，请稍候重试或直接复制文档内容粘贴。");
    }

    if (onProgress) onProgress(50, "正在解析 Word 文档结构...");
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
    if (onProgress) onProgress(100, "Word 文档提取完成");
    return result.value;
  },

  /**
   * Fetch online webpage (HTML Link / URL) and convert to clean Markdown/text
   * Uses Jina Reader API (https://r.jina.ai) or CORS Fallback for PubMed, Lancet, ASCO, news, etc.
   * @param {string} url 
   * @param {Function} onProgress 
   * @returns {Promise<string>}
   */
  async fetchTextFromUrl(url, onProgress = null) {
    if (!url || !url.trim()) throw new Error("请输入有效的网页链接 (URL)");
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = "https://" + cleanUrl;
    }

    if (onProgress) onProgress(20, `正在抓取网页正文: ${cleanUrl}...`);

    try {
      // 1. Primary: Use high-speed Jina Reader endpoint (bypasses CORS and outputs clean markdown)
      const readerEndpoint = `https://r.jina.ai/${cleanUrl}`;
      const response = await fetch(readerEndpoint, {
        headers: {
          "Accept": "text/plain, text/markdown"
        }
      });

      if (response.ok) {
        const markdown = await response.text();
        if (markdown && markdown.length > 50) {
          if (onProgress) onProgress(100, "网页正文抓取解析成功！");
          return markdown;
        }
      }
    } catch (e) {
      console.warn("Jina Reader fetch failed, trying CORS proxy fallback...", e);
    }

    // 2. Fallback: AllOrigins CORS proxy
    try {
      if (onProgress) onProgress(60, "正在通过备用通道提取网页正文...");
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(cleanUrl)}`;
      const proxyRes = await fetch(proxyUrl);
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data.contents) {
          const stripped = this.stripHtmlTags(data.contents);
          if (onProgress) onProgress(100, "备用通道提取完成！");
          return stripped;
        }
      }
    } catch (err) {
      console.error("URL fetch fallback failed:", err);
    }

    throw new Error("无法抓取该网页内容（可能需要登录或反爬限制），建议在浏览器中复制网页正文后直接粘贴。");
  },

  /**
   * Strip HTML tags and retain readable text
   * @param {string} html 
   * @returns {string}
   */
  stripHtmlTags(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    // Remove scripts and styles
    doc.querySelectorAll("script, style, noscript, nav, header, footer, svg").forEach(el => el.remove());
    return this.cleanExtractedText(doc.body.innerText || doc.body.textContent || "");
  },

  /**
   * Clean text extracted from PDF or Webpage
   * @param {string} rawText 
   * @returns {string}
   */
  cleanExtractedText(rawText) {
    return rawText
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n\s*\n\s*\n/g, "\n\n")
      .trim();
  }
};
