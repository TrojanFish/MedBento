#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
generate_jcog_pdf.py
Generates an authoritative, beautifully formatted PDF report for JCOG0802/WJOG4607L lung cancer trial.
Uses ReportLab with Microsoft YaHei font on Windows.
"""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm, mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# 1. Register Chinese Fonts
font_dir = r"C:\Windows\Fonts"
font_path_regular = os.path.join(font_dir, "msyh.ttc")
font_path_bold = os.path.join(font_dir, "msyhbd.ttc")
font_path_simhei = os.path.join(font_dir, "simhei.ttf")

if os.path.exists(font_path_regular):
    pdfmetrics.registerFont(TTFont("YaHei", font_path_regular, subfontIndex=0))
else:
    pdfmetrics.registerFont(TTFont("YaHei", font_path_simhei))

if os.path.exists(font_path_bold):
    pdfmetrics.registerFont(TTFont("YaHei-Bold", font_path_bold, subfontIndex=0))
else:
    pdfmetrics.registerFont(TTFont("YaHei-Bold", font_path_simhei))


class NumberedCanvas(canvas.Canvas):
    """Adds professional header, footer, page numbering, and disclaimer to each page"""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_decorations(self, page_count):
        self.saveState()
        self.setFont("YaHei", 8)
        self.setFillColor(colors.HexColor("#64748B"))

        # Top Header line
        self.setStrokeColor(colors.HexColor("#0284C7"))
        self.setLineWidth(1.5)
        self.line(40, 802, 555, 802)

        self.drawString(40, 808, "JCOG Clinical Oncology Report | 《The Lancet》2022 Milestone Study")
        self.drawRightString(555, 808, "JCOG0802 / WJOG4607L")

        # Bottom Footer
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(40, 45, 555, 45)

        self.drawString(40, 32, "免责声明：本报告由公开文献编译整理，仅供医学科研与科普交流，不构成具体临床诊疗建议。")
        self.drawRightString(555, 32, f"第 {self._pageNumber} 页 / 共 {page_count} 页")
        self.restoreState()


def build_pdf(filename="JCOG0802_Lancet_Study_Report.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        leftMargin=40,
        rightMargin=40,
        topMargin=55,
        bottomMargin=55
    )

    styles = getSampleStyleSheet()
    
    # Custom Color Palette
    PRIMARY = colors.HexColor("#0F172A")    # Deep Slate Navy
    ACCENT_CYAN = colors.HexColor("#0284C7") # Clinical Blue/Cyan
    EMERALD = colors.HexColor("#059669")    # Medical Emerald
    CORAL = colors.HexColor("#DC2626")      # Warning/Alert
    BG_LIGHT = colors.HexColor("#F8FAFC")
    BORDER_COLOR = colors.HexColor("#E2E8F0")

    # Typography Styles
    title_style = ParagraphStyle(
        'MainTitle',
        fontName='YaHei-Bold',
        fontSize=17,
        leading=22,
        textColor=PRIMARY,
        spaceAfter=6
    )
    subtitle_style = ParagraphStyle(
        'SubTitle',
        fontName='YaHei',
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor("#475569"),
        spaceAfter=12
    )
    h1_style = ParagraphStyle(
        'SectionH1',
        fontName='YaHei-Bold',
        fontSize=12,
        leading=16,
        textColor=PRIMARY,
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    )
    body_style = ParagraphStyle(
        'BodyTextCustom',
        fontName='YaHei',
        fontSize=9,
        leading=13.5,
        textColor=colors.HexColor("#1E293B"),
        spaceAfter=6
    )
    bullet_style = ParagraphStyle(
        'BulletCustom',
        fontName='YaHei',
        fontSize=8.5,
        leading=12.5,
        textColor=colors.HexColor("#334155"),
        leftIndent=12,
        spaceAfter=3
    )
    card_title = ParagraphStyle(
        'CardTitle',
        fontName='YaHei-Bold',
        fontSize=9,
        leading=11,
        textColor=colors.HexColor("#64748B"),
        alignment=1
    )
    card_val = ParagraphStyle(
        'CardVal',
        fontName='YaHei-Bold',
        fontSize=18,
        leading=22,
        textColor=ACCENT_CYAN,
        alignment=1
    )
    card_sub = ParagraphStyle(
        'CardSub',
        fontName='YaHei',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor("#475569"),
        alignment=1
    )

    story = []

    # 1. Header Banner & Title
    story.append(Paragraph("JCOG0802 / WJOG4607L 早期肺癌生存率里程碑研究报告", title_style))
    story.append(Paragraph("Segmentectomy versus lobectomy in small-sized peripheral non-small-cell lung cancer: a multicentre, open-label, phase 3, randomised, controlled, non-inferiority trial", subtitle_style))

    # 2. Metadata Box
    meta_data = [
        [
            Paragraph("<b>发表期刊:</b> 《The Lancet》柳叶刀", body_style),
            Paragraph("<b>影响因子 / 级别:</b> Top 权威医学顶刊", body_style),
            Paragraph("<b>DOI:</b> 10.1016/S0140-6736(21)02333-3", body_style)
        ],
        [
            Paragraph("<b>主要作者:</b> Hisashi Saji, Morihito Okada, et al.", body_style),
            Paragraph("<b>研究组:</b> JCOG (日本临床肿瘤研究组)", body_style),
            Paragraph("<b>试验注册:</b> UMIN000002323 / N=1106", body_style)
        ]
    ]
    t_meta = Table(meta_data, colWidths=[170, 160, 185])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), BG_LIGHT),
        ('BOX', (0, 0), (-1, -1), 0.8, BORDER_COLOR),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#F1F5F9")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 8))

    # 3. Big Metric KPI Cards (Bento Style in PDF)
    kpi_card_1 = [
        [Paragraph("5年总生存率 (OS)", card_title)],
        [Paragraph("94.3% vs 91.1%", card_val)],
        [Paragraph("肺段切除 vs 肺叶切除 (P=0.0082 优效)", card_sub)]
    ]
    kpi_card_2 = [
        [Paragraph("死亡风险比 (Hazard Ratio)", card_title)],
        [Paragraph("HR 0.663", ParagraphStyle('CardVal2', parent=card_val, textColor=EMERALD))],
        [Paragraph("95% CI: 0.474-0.927 (死亡风险降低33.7%)", card_sub)]
    ]
    kpi_card_3 = [
        [Paragraph("12个月肺功能损失(FEV1)", card_title)],
        [Paragraph("8.5% vs 12.0%", ParagraphStyle('CardVal3', parent=card_val, textColor=PRIMARY))],
        [Paragraph("肺段组多保留 3.5% 肺功能 (P<0.0001)", card_sub)]
    ]
    kpi_card_4 = [
        [Paragraph("多中心样本总量 (ITT)", card_title)],
        [Paragraph("N = 1,106", ParagraphStyle('CardVal4', parent=card_val, textColor=PRIMARY))],
        [Paragraph("全日本70家顶尖医院 / 中位随访7.3年", card_sub)]
    ]

    t_kpi1 = Table(kpi_card_1, colWidths=[120])
    t_kpi1.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F0F9FF")), ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#BAE6FD")), ('PADDING', (0,0), (-1,-1), 3)]))
    
    t_kpi2 = Table(kpi_card_2, colWidths=[130])
    t_kpi2.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#ECFDF5")), ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#A7F3D0")), ('PADDING', (0,0), (-1,-1), 3)]))
    
    t_kpi3 = Table(kpi_card_3, colWidths=[130])
    t_kpi3.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8FAFC")), ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#E2E8F0")), ('PADDING', (0,0), (-1,-1), 3)]))

    t_kpi4 = Table(kpi_card_4, colWidths=[115])
    t_kpi4.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8FAFC")), ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#E2E8F0")), ('PADDING', (0,0), (-1,-1), 3)]))

    t_kpi_row = Table([[t_kpi1, t_kpi2, t_kpi3, t_kpi4]], colWidths=[126, 136, 136, 117])
    t_kpi_row.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_kpi_row)
    story.append(Spacer(1, 10))

    # 4. Research Background & Design
    story.append(Paragraph("一、研究背景与临床假说 (Background & Clinical Rationale)", h1_style))
    story.append(Paragraph(
        "自1995年LCSG 821临床试验确立“肺叶切除术（Lobectomy）”为早期肺癌标准根治术式以来，切除整叶肺已统治胸外科近30年。随着薄层HRCT筛查普及，大量 ≤2cm 的早期肺癌（cT1aN0M0）被早期发现。JCOG0802/WJOG4607L旨在解决核心争议：对于 ≤2cm、实性为主的外周型早期非小细胞肺癌，保留更多正常肺组织的“解剖性肺段切除术（Segmentectomy）”能否在根治肿瘤的同时，提供不劣于甚至更优的总生存期？",
        body_style
    ))

    story.append(Paragraph("二、试验设计与患者入组基线 (Methods & Patients)", h1_style))
    story.append(Paragraph("<b>• 入组标准：</b>年龄20-79岁，PS 0-1，经CT确诊肿瘤最大径 ≤2.0cm，实性成分比（CTR）> 0.5，临床分期 cT1aN0M0；", bullet_style))
    story.append(Paragraph("<b>• 分组干预：</b>1:1随机分配至【肺段切除组 (n=552)】与【肺叶切除组 (n=554)】，全日本70家医学中心参与；", bullet_style))
    story.append(Paragraph("<b>• 终点指标：</b>主要终点为总生存期（OS）；次要终点包括无复发生存期（RFS）、局部复发率、12个月肺功能改变（FEV1/FVC）、并发症与死亡率。", bullet_style))
    story.append(Spacer(1, 6))

    # 5. Core Findings Table
    story.append(Paragraph("三、核心试验数据全景对照表 (Core Findings Comparison)", h1_style))
    table_header_style = ParagraphStyle('TH', fontName='YaHei-Bold', fontSize=8.5, leading=11, textColor=colors.white, alignment=1)
    td_bold = ParagraphStyle('TDB', fontName='YaHei-Bold', fontSize=8, leading=11, textColor=PRIMARY)
    td_reg = ParagraphStyle('TDR', fontName='YaHei', fontSize=8, leading=11, textColor=colors.HexColor("#334155"), alignment=1)
    td_fav1 = ParagraphStyle('TDF1', fontName='YaHei-Bold', fontSize=8, leading=11, textColor=EMERALD, alignment=1)
    td_fav2 = ParagraphStyle('TDF2', fontName='YaHei-Bold', fontSize=8, leading=11, textColor=CORAL, alignment=1)

    table_data = [
        [
            Paragraph("评价指标 (Endpoints)", table_header_style),
            Paragraph("肺段切除组 (n=552)", table_header_style),
            Paragraph("肺叶切除组 (n=554)", table_header_style),
            Paragraph("统计学效应量 (HR / P-value)", table_header_style),
            Paragraph("临床结论 / 评价", table_header_style)
        ],
        [
            Paragraph("5年总生存率 (5-yr OS)", td_bold),
            Paragraph("94.3% (92.1-96.0)", td_fav1),
            Paragraph("91.1% (88.4-93.2)", td_reg),
            Paragraph("HR 0.663 (0.474-0.927)<br/>P = 0.0082", td_fav1),
            Paragraph("<b>肺段组显著优效</b> (死亡风险降33.7%)", td_bold)
        ],
        [
            Paragraph("5年无复发生存率 (5-yr RFS)", td_bold),
            Paragraph("88.0% (85.0-90.4)", td_reg),
            Paragraph("87.9% (84.8-90.3)", td_reg),
            Paragraph("HR 0.998 (0.753-1.323)<br/>P = 0.9889", td_reg),
            Paragraph("两组肿瘤学控制无差异", td_reg)
        ],
        [
            Paragraph("局部复发率 (Local Relapse)", td_bold),
            Paragraph("10.5% (58例)", td_fav2),
            Paragraph("5.4% (30例)", td_reg),
            Paragraph("P = 0.0018 (差异显著)", td_fav2),
            Paragraph("肺段组切缘/局部复发率约高2倍", td_fav2)
        ],
        [
            Paragraph("12个月FEV1肺功能损失", td_bold),
            Paragraph("-8.5% (中位数)", td_fav1),
            Paragraph("-12.0% (中位数)", td_reg),
            Paragraph("差值 3.5% (P < 0.0001)", td_fav1),
            Paragraph("<b>肺段组显著保留更多通气功能</b>", td_bold)
        ],
        [
            Paragraph("30天 / 90天围术期死亡率", td_bold),
            Paragraph("0.0% / 0.4% (2例)", td_reg),
            Paragraph("0.0% / 0.2% (1例)", td_reg),
            Paragraph("无显著差异", td_reg),
            Paragraph("两种术式均具备极高安全性", td_reg)
        ],
        [
            Paragraph("非癌症相关死亡人数", td_bold),
            Paragraph("27 例 (脑/心/肺疾病)", td_fav1),
            Paragraph("52 例 (脑/心/肺疾病)", td_reg),
            Paragraph("肺段组明显降低", td_fav1),
            Paragraph("保留肺功能提升机体远期耐受力", td_bold)
        ]
    ]

    t_findings = Table(table_data, colWidths=[120, 100, 100, 105, 90])
    t_findings.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), ACCENT_CYAN),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_findings)
    story.append(Spacer(1, 10))

    # 6. Clinical Takeaways & Guidelines
    story.append(Paragraph("四、临床实践启示与全球指南影响 (Clinical Implications)", h1_style))
    story.append(Paragraph("<b>1. 外科标准颠覆：</b>该试验正式确立肺段切除术为 ≤2cm、CTR > 0.5 早期非小细胞肺癌的标准手术方式，改写了 NCCN 与 CSCO 等全球肺癌诊疗指南；", bullet_style))
    story.append(Paragraph("<b>2. 为何生存率反超：</b>虽然肺段切除局部复发率略高（10.5% vs 5.4%），但因患者保留了更多健康肺组织，复发后有充足生理储备接受二次手术、SBRT放疗或靶向/免疫治疗，且心肺基础疾病死亡率更低；", bullet_style))
    story.append(Paragraph("<b>3. 手术安全底线：</b>必须严格保障肿瘤切缘 ≥ 2.0cm 或 ≥ 肿瘤直径，必须行系统性肺门及纵隔淋巴结采样活检，若术中冰冻发现淋巴结转移需中转肺叶切除。", bullet_style))
    story.append(Spacer(1, 8))

    # 7. Patient Consultation & Communication (Layman Friendly)
    story.append(Paragraph("五、医患沟通与通俗科普要点 (Patient Consultation Notes)", h1_style))
    story.append(Paragraph("<b>• 早期发现 = 高治愈率：</b>≤2cm 的早期肺结节通过根治性手术，5年生存率高达 94.3%，不必过度恐慌；", bullet_style))
    story.append(Paragraph("<b>• 能保肺尽量保肺：</b>在专业胸外科评估符合指征的前提下，肺段切除既能根治肿瘤，又能多保住肺活量，术后爬楼、跑步生活质量更高；", bullet_style))
    story.append(Paragraph("<b>• 严守复查纪律：</b>术后前 3 年每 6 个月复查薄层胸部 HRCT，及早识别微小复发并可进行有效挽救治疗。", bullet_style))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[OK] PDF successfully generated: {filename}")


if __name__ == "__main__":
    build_pdf()
