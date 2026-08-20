/**
 * js/exporter.js
 * High-Resolution Native Image Rendering (html-to-image), JSZip Batch Packaging, WebApp Mobile Safe Saving, and Social Copywriting Exporter.
 */

const Exporter = {
  isExporting: false,

  /**
   * Detect Mobile & Standalone PWA environment
   */
  isStandalone() {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || 
           window.navigator.standalone === true;
  },

  isMobile() {
    return /iPhone|iPad|iPod|Android|Mobile/i.test(navigator.userAgent) || this.isStandalone();
  },

  /**
   * Export all social media cards as a ZIP containing high-res PNGs
   */
  async exportAllCardsZip(baseName = "MedBento_SocialCards", onProgress = null) {
    if (this.isExporting) return;
    this.isExporting = true;

    if (typeof JSZip === "undefined") {
      this.isExporting = false;
      throw new Error("JSZip 组件尚未准备就绪，请检查网络连接。");
    }

    try {
      const cards = document.querySelectorAll(".social-card-item");
      if (!cards.length) throw new Error("未找到可导出的卡片元素");

      const zip = new JSZip();
      const folder = zip.folder(baseName);

      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const cardIndex = i + 1;

        if (onProgress) {
          onProgress(Math.round(((i + 1) / cards.length) * 100), `正在高保真渲染第 ${cardIndex} / ${cards.length} 张切片...`);
        }

        const blob = await this.renderCardToBlob(card);
        folder.file(`${baseName}_Slide_${cardIndex.toString().padStart(2, '0')}.png`, blob);

        // Microtask yield & GC pause for mobile memory stability
        await new Promise(resolve => setTimeout(resolve, 60));
      }

      if (onProgress) onProgress(100, "正在打包生成 ZIP 压缩包...");
      const content = await zip.generateAsync({ type: "blob" });
      
      this.downloadBlob(content, `${baseName}_All_Slides.zip`);
      if (typeof App !== "undefined" && App.showToast) {
        App.showToast("✅ 全部切片卡片已成功打包下载 (ZIP)！", "success");
      }
      return true;
    } catch (err) {
      console.error("ZIP Export error:", err);
      if (typeof App !== "undefined" && App.showToast) {
        App.showToast(`ZIP 打包失败: ${err.message}`, "error");
      }
      throw err;
    } finally {
      this.isExporting = false;
    }
  },

  async exportAllCardsAsZip(baseName = "MedBento_SocialCards", onProgress = null) {
    return this.exportAllCardsZip(baseName, onProgress);
  },

  /**
   * Export all active cards as a crisp multi-page presentation PDF (jsPDF)
   */
  async exportAllCardsPdf(baseName = "MedBento_Clinical_Report", onProgress = null) {
    if (this.isExporting) return;
    this.isExporting = true;

    try {
      const cards = document.querySelectorAll(".social-card-item");
      if (!cards.length) throw new Error("未找到可导出的卡片元素");

      if (typeof window.jspdf === "undefined" && typeof jsPDF === "undefined") {
        throw new Error("jsPDF 演示文档组件尚未准备就绪，请检查网络连接。");
      }
      const { jsPDF } = window.jspdf || window;

      const is916 = document.querySelector(".social-card-item.ratio-9-16");
      const pdfW = 420;
      const pdfH = is916 ? 746 : 560;

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [pdfW, pdfH]
      });

      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const cardIndex = i + 1;

        if (onProgress) {
          onProgress(Math.round(((i + 1) / cards.length) * 100), `正在合成第 ${cardIndex} / ${cards.length} 页演示幻灯片...`);
        }

        const canvas = await this.renderCardToCanvas(card);
        const imgData = canvas.toDataURL("image/png", 0.95);

        if (i > 0) {
          doc.addPage([pdfW, pdfH], "portrait");
        }
        doc.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);

        // Microtask yield & memory release
        await new Promise(resolve => setTimeout(resolve, 60));
      }

      const outName = `${baseName}_Presentation.pdf`;
      doc.save(outName);

      if (typeof App !== "undefined" && App.showToast) {
        App.showToast("✅ 多页学术汇报演示文档 (PDF) 已成功生成并下载！", "success");
      }
      return true;
    } catch (err) {
      console.error("PDF Export error:", err);
      if (typeof App !== "undefined" && App.showToast) {
        App.showToast(`PDF 导出失败: ${err.message}`, "error");
      }
      throw err;
    } finally {
      this.isExporting = false;
    }
  },

  /**
   * Export a single card by index as high-res PNG
   * WebApp Safe: Supports Web Share API & Preview Modal (no page navigation / no white screen)
   */
  async exportSingleCard(cardIndex = 1, fileName = "MedBento_SocialCard") {
    const card = document.getElementById(`social-card-${cardIndex}`);
    if (!card) {
      if (typeof App !== "undefined" && App.showToast) {
        App.showToast(`未找到第 ${cardIndex} 张卡片，请确认已载入数据`, "error");
      }
      return;
    }

    try {
      if (typeof App !== "undefined" && App.showToast) {
        App.showToast(`正在高清渲染第 ${cardIndex} 张切片图片...`, "info");
      }

      // If data has a custom trial ID, use it in the filename
      let customPrefix = fileName;
      const curData = (typeof App !== "undefined" && App.currentData) || (window.app && window.app.currentData);
      if (curData && curData.id) {
        customPrefix = `MedBento_${curData.id}`;
      }

      const blob = await this.renderCardToBlob(card);
      const outName = `${customPrefix}_Slide_${cardIndex.toString().padStart(2, '0')}.png`;

      // 1. If Mobile / WebApp Standalone: try Web Share API first
      if (this.isMobile()) {
        const file = new File([blob], outName, { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: outName,
              text: `MedBento AI 医疗切片卡片 · 第 ${cardIndex} 张`
            });
            if (typeof App !== "undefined" && App.showToast) {
              App.showToast("✅ 已调起系统存储/分享，卡片已保存！", "success");
            }
            return;
          } catch (shareErr) {
            // User cancelled share or fallback needed
            if (shareErr.name !== "AbortError") {
              console.warn("navigator.share fallback:", shareErr);
            }
          }
        }

        // Show image preview modal for mobile long-press to save
        this.showImagePreviewModal(blob, outName, `第 ${cardIndex} 张高清切片已生成`);
        if (typeof App !== "undefined" && App.showToast) {
          App.showToast(`✅ 高清图已就绪！可长按图片保存至手机相册`, "success");
        }
        return;
      }

      // 2. Standard Desktop Browser Download
      this.downloadBlob(blob, outName);
      if (typeof App !== "undefined" && App.showToast) {
        App.showToast(`✅ 第 ${cardIndex} 张卡片高清图已成功下载！`, "success");
      }
    } catch (err) {
      console.error("Single card export error:", err);
      if (typeof App !== "undefined" && App.showToast) {
        App.showToast(`导出失败: ${err.message}`, "error");
      }
    }
  },

  /**
   * Export all cards combined into a seamless long infographic image
   */
  async exportLongImage(fileName = "MedBento_LongInfographic", onProgress = null) {
    if (this.isExporting) return;
    this.isExporting = true;

    try {
      const cards = document.querySelectorAll(".social-card-item");
      if (!cards.length) throw new Error("未找到可导出的卡片元素");

      const canvases = [];
      let totalHeight = 0;
      let maxWidth = 0;

      for (let i = 0; i < cards.length; i++) {
        if (onProgress) {
          onProgress(Math.round(((i + 1) / cards.length) * 80), `正在高保真合成第 ${i + 1} / ${cards.length} 张切片...`);
        }
        const c = await this.renderCardToCanvas(cards[i]);
        canvases.push(c);
        totalHeight += c.height;
        if (c.width > maxWidth) maxWidth = c.width;
      }

      // Create master canvas
      const masterCanvas = document.createElement("canvas");
      masterCanvas.width = maxWidth;
      masterCanvas.height = totalHeight;
      const ctx = masterCanvas.getContext("2d");

      let currentY = 0;
      for (const c of canvases) {
        ctx.drawImage(c, (maxWidth - c.width) / 2, currentY);
        currentY += c.height;
      }

      if (onProgress) onProgress(100, "正在导出高清长图...");
      masterCanvas.toBlob(blob => {
        const outName = `${fileName}.png`;
        if (this.isMobile()) {
          this.showImagePreviewModal(blob, outName, "完整科普长图已生成");
        } else {
          this.downloadBlob(blob, outName);
        }
        if (typeof App !== "undefined" && App.showToast) {
          App.showToast("✅ 高清医学长图已成功生成！", "success");
        }
      }, "image/png", 1.0);

      return true;
    } catch (err) {
      console.error("Long image export error:", err);
      if (typeof App !== "undefined" && App.showToast) {
        App.showToast(`长图导出失败: ${err.message}`, "error");
      }
      throw err;
    } finally {
      this.isExporting = false;
    }
  },

  /**
   * Display High-Resolution Image in Modal with Mobile Long-Press / System Share support
   */
  showImagePreviewModal(blob, fileName, title = "高清切片已生成") {
    const modal = document.getElementById("modal-image-preview");
    const imgTarget = document.getElementById("img-preview-target");
    const titleSpan = document.getElementById("img-preview-title");
    const btnShare = document.getElementById("btn-img-share");
    const btnDownload = document.getElementById("btn-img-download-fallback");
    const btnClose = document.getElementById("btn-close-img-modal");

    if (!modal || !imgTarget) {
      this.downloadBlob(blob, fileName);
      return;
    }

    const objectUrl = URL.createObjectURL(blob);
    imgTarget.src = objectUrl;
    if (titleSpan) titleSpan.innerText = title;

    // Check system share
    if (btnShare) {
      const file = new File([blob], fileName, { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        btnShare.style.display = "inline-flex";
        btnShare.onclick = async () => {
          try {
            await navigator.share({
              files: [file],
              title: fileName,
              text: "MedBento AI 医疗切片卡片"
            });
          } catch(e) {}
        };
      } else {
        btnShare.style.display = "none";
      }
    }

    if (btnDownload) {
      btnDownload.onclick = () => {
        this.downloadBlob(blob, fileName);
      };
    }

    const closeModal = () => {
      modal.classList.remove("active");
    };

    if (btnClose) btnClose.onclick = closeModal;
    modal.onclick = (e) => {
      if (e.target === modal) closeModal();
    };

    modal.classList.add("active");
  },

  /**
   * Modern High-Fidelity DOM-to-Blob Renderer
   * Converts all live Canvas elements into static high-res <img> elements in the clone,
   * completely resolving WebKit/Mobile canvas clipping and context loss bugs.
   */
  async renderCardToBlob(element) {
    const isLight = element.classList.contains("theme-light");
    const isEmerald = element.classList.contains("theme-emerald");
    const bgColor = isLight ? "#FAF7EE" : isEmerald ? "#031911" : "#0A0F1D";

    // 1. Ensure live canvas (KM curve) is properly initialized
    const origCanvas = element.querySelector("canvas");
    if (origCanvas && typeof Chart !== "undefined") {
      const curData = (typeof App !== "undefined" && App.currentData) || (window.app && window.app.currentData) || MedicalAnalyzer.DEFAULT_JCOG_DATA;
      if (!Chart.getChart(origCanvas) && typeof CardSlicer !== "undefined" && CardSlicer.initCard3MiniChart) {
        CardSlicer.initCard3MiniChart(curData);
      }
    }

    // 2. Create a fixed 420px master staging container
    const staging = document.createElement("div");
    staging.style.position = "fixed";
    staging.style.top = "-9999px";
    staging.style.left = "-9999px";
    staging.style.width = "420px";
    staging.style.opacity = "0";
    staging.style.pointerEvents = "none";
    staging.style.zIndex = "-1000";

    const clone = element.cloneNode(true);
    clone.style.width = "420px";
    clone.style.minWidth = "420px";
    clone.style.maxWidth = "420px";
    clone.style.margin = "0";
    clone.style.transform = "none";

    // 3. Convert all live canvases into static high-res <img> elements in the clone
    const origCanvases = element.querySelectorAll("canvas");
    const cloneCanvases = clone.querySelectorAll("canvas");
    origCanvases.forEach((origCv, i) => {
      const cloneCv = cloneCanvases[i];
      if (origCv && cloneCv) {
        try {
          const imgDataUrl = origCv.toDataURL("image/png");
          if (imgDataUrl && imgDataUrl !== "data:," && imgDataUrl.length > 50) {
            const img = document.createElement("img");
            img.src = imgDataUrl;
            img.style.width = "100%";
            img.style.height = "100%";
            img.style.display = "block";
            img.style.objectFit = "contain";
            img.className = cloneCv.className || "";
            if (cloneCv.parentNode) {
              cloneCv.parentNode.replaceChild(img, cloneCv);
            }
          }
        } catch (e) {
          console.warn("Canvas to image conversion fallback:", e);
        }
      }
    });

    staging.appendChild(clone);
    document.body.appendChild(staging);

    try {
      if (typeof htmlToImage !== "undefined") {
        try {
          const blob = await htmlToImage.toBlob(clone, {
            pixelRatio: 3, // 3x Ultra-HD: 420 * 3 = 1260px width
            backgroundColor: bgColor,
            cacheBust: true,
            width: 420
          });
          if (blob) return blob;
        } catch (e) {
          console.warn("htmlToImage on clone failed, falling back to html2canvas:", e);
        }
      }

      // Fallback: html2canvas
      if (typeof html2canvas !== "undefined") {
        const canvas = await html2canvas(clone, {
          scale: 3,
          backgroundColor: bgColor,
          useCORS: true,
          allowTaint: true,
          logging: false,
          width: 420
        });
        return await new Promise(resolve => canvas.toBlob(resolve, "image/png", 1.0));
      }
      throw new Error("无可用渲染引擎");
    } finally {
      document.body.removeChild(staging);
    }
  },

  /**
   * Ultra-HD Card-to-Canvas Renderer with html2canvas (Fallback)
   */
  async renderCardToCanvas(element) {
    const isLight = element.classList.contains("theme-light");
    const isEmerald = element.classList.contains("theme-emerald");
    const bgColor = isLight ? "#FAF7EE" : isEmerald ? "#031911" : "#0A0F1D";

    const origCanvas = element.querySelector("canvas");
    if (origCanvas && typeof Chart !== "undefined") {
      const curData = (typeof App !== "undefined" && App.currentData) || (window.app && window.app.currentData) || MedicalAnalyzer.DEFAULT_JCOG_DATA;
      if (!Chart.getChart(origCanvas) && typeof CardSlicer !== "undefined" && CardSlicer.initCard3MiniChart) {
        CardSlicer.initCard3MiniChart(curData);
      }
    }

    const staging = document.createElement("div");
    staging.style.position = "fixed";
    staging.style.top = "-9999px";
    staging.style.left = "-9999px";
    staging.style.width = "420px";
    staging.style.opacity = "0";
    staging.style.pointerEvents = "none";
    staging.style.zIndex = "-1000";

    const clone = element.cloneNode(true);
    clone.style.width = "420px";
    clone.style.minWidth = "420px";
    clone.style.maxWidth = "420px";
    clone.style.margin = "0";
    clone.style.transform = "none";

    const origCanvases = element.querySelectorAll("canvas");
    const cloneCanvases = clone.querySelectorAll("canvas");
    origCanvases.forEach((origCv, i) => {
      const cloneCv = cloneCanvases[i];
      if (origCv && cloneCv) {
        try {
          const imgDataUrl = origCv.toDataURL("image/png");
          if (imgDataUrl && imgDataUrl !== "data:," && imgDataUrl.length > 50) {
            const img = document.createElement("img");
            img.src = imgDataUrl;
            img.style.width = "100%";
            img.style.height = "100%";
            img.style.display = "block";
            img.style.objectFit = "contain";
            img.className = cloneCv.className || "";
            if (cloneCv.parentNode) {
              cloneCv.parentNode.replaceChild(img, cloneCv);
            }
          }
        } catch (e) {
          console.warn("Canvas to image conversion fallback:", e);
        }
      }
    });

    staging.appendChild(clone);
    document.body.appendChild(staging);

    try {
      if (typeof htmlToImage !== "undefined") {
        try {
          const dataUrl = await htmlToImage.toPng(clone, {
            pixelRatio: 3,
            backgroundColor: bgColor,
            cacheBust: true,
            width: 420
          });
          const img = new Image();
          img.src = dataUrl;
          await new Promise((res, rej) => {
            img.onload = res;
            img.onerror = rej;
          });
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          return canvas;
        } catch (e) {
          console.warn("htmlToImage to Canvas fallback:", e);
        }
      }

      if (typeof html2canvas !== "undefined") {
        return await html2canvas(clone, {
          scale: 3,
          backgroundColor: bgColor,
          useCORS: true,
          allowTaint: true,
          logging: false,
          width: 420
        });
      }
      throw new Error("无可用渲染引擎");
    } finally {
      document.body.removeChild(staging);
    }
  },

  /**
   * Safe Cross-Platform File Downloader (Pure non-navigating Anchor)
   * Prevents PWA Standalone Webview white-screen navigation bugs
   */
  downloadBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = fileName;
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (e) {}
    }, 1500);
  },

  /**
   * Copy formatted Xiaohongshu/Douyin social copy to clipboard
   */
  async copySocialMediaText(data) {
    const copy = (data && data.socialMediaCopy) || MedicalAnalyzer.DEFAULT_JCOG_DATA.socialMediaCopy;
    const title = copy.hookTitle || (data && data.title) || "重磅医学临床研究突破！";
    const tags = copy.tags || "#医学科普 #临床研究 #健康生活";

    let bodyText = "";
    if (copy.summary && copy.summary.trim()) {
      bodyText = copy.summary.trim();
    } else if (copy.bodyBullets) {
      bodyText = Array.isArray(copy.bodyBullets) ? copy.bodyBullets.join("\n") : copy.bodyBullets;
    }

    let formattedText = `【${title}】\n\n${bodyText}`;
    if (!formattedText.includes("免责声明")) {
      formattedText += `\n\n⚠️ 免责声明：本内容由公开同行评审期刊文献整理科普，仅供健康学术交流，具体诊疗决策请严格遵从三甲医院专科执业医师意见。`;
    }
    if (tags) {
      formattedText += `\n\n${tags}`;
    }

    try {
      await navigator.clipboard.writeText(formattedText);
      return formattedText;
    } catch (err) {
      const textarea = document.createElement("textarea");
      textarea.value = formattedText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      return formattedText;
    }
  }
};
