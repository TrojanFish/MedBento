#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
server.py
MedBento AI - Lightweight Backend Server & Static File Host
- Built-in VPS Private Access Authentication (Protected by AUTH_PASSWORD in .env)
- Reads GEMINI_API_KEY securely from .env
- Runs on non-standard port 38999 (customizable for VPS / Docker deployment)
- Provides /api/login, /api/logout, /api/auth-check
- Provides /api/analyze (Google Gemini Native Multimodal & Text Processing)
- Provides /api/fetch-url (Online Medical Webpage / PubMed Article Scraper)
- Provides /api/status (System & Gemini Configuration Status)
- Zero external dependencies required (Built on Python Standard Library)
"""

import os
import sys
import json
import time
import secrets
import mimetypes
import ipaddress
import urllib.request
import urllib.parse
import urllib.error
from http import cookies
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path

# Fix Windows console encoding
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Base Directories
BASE_DIR = Path(__file__).resolve().parent

def is_safe_external_url(url_str: str) -> bool:
    """SSRF Protection: Ensure URL points to a legitimate public internet domain/host"""
    try:
        parsed = urllib.parse.urlparse(url_str)
        if parsed.scheme not in ("http", "https"):
            return False
        hostname = (parsed.hostname or "").strip().lower()
        if not hostname:
            return False
        # Block localhost and common private names
        if hostname in ("localhost", "127.0.0.1", "0.0.0.0", "::1", "local", "internal"):
            return False
        if hostname.endswith(".local") or hostname.endswith(".internal"):
            return False
        # Check IP ranges
        try:
            ip = ipaddress.ip_address(hostname)
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast:
                return False
        except ValueError:
            # Regular domain name
            pass
        return True
    except Exception:
        return False

def load_env_file(filepath: Path):
    """Simple, zero-dependency .env parser"""
    env_vars = {}
    if filepath.exists():
        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" in line:
                    key, val = line.split("=", 1)
                    key = key.strip()
                    val = val.strip().strip("\"'").strip()
                    env_vars[key] = val
                    os.environ[key] = val
    return env_vars

# Load .env initially
load_env_file(BASE_DIR / ".env")

PORT = int(os.environ.get("PORT", 38999))
HOST = os.environ.get("HOST", "0.0.0.0")

def get_env_config():
    """Dynamically read latest .env without requiring server restart"""
    load_env_file(BASE_DIR / ".env")
    return {
        "api_key": os.environ.get("GEMINI_API_KEY", "").strip(),
        "model": os.environ.get("GEMINI_MODEL", "gemini-2.5-flash").strip(),
        "auth_user": os.environ.get("AUTH_USERNAME", "admin").strip(),
        "auth_pass": os.environ.get("AUTH_PASSWORD", "").strip()
    }

# In-memory valid sessions set
VALID_SESSIONS = set()

# Register additional mimetypes
mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("application/json", ".json")
mimetypes.add_type("application/pdf", ".pdf")
mimetypes.add_type("text/markdown", ".md")


SYSTEM_MEDICAL_PROMPT = """你是一个世界顶尖的肿瘤与胸外科临床医学专家、生物统计学家兼医疗自媒体（小红书/抖音）爆款主理人。
请对输入的医学研究报告（PDF或文本）进行深度临床与统计学解析，提取关键终点、KM生存数据、主要结论，并生成符合小红书/抖音调性的结构化数据。

请严格输出合法的 JSON 格式，包含以下结构字段：
{
  "studyMeta": {
    "title": "研究主标题（中文精炼，突出对比与结论）",
    "subtitle": "副标题或核心医学论点",
    "journal": "期刊名称 (如 The Lancet)",
    "year": "发表年份 (如 2022)",
    "doi": "DOI号",
    "trialName": "试验代号 (如 JCOG0802/WJOG4607L)",
    "phase": "临床分期 (如 Phase 3 RCT)",
    "sampleSize": "总样本量 (如 1,106 例)",
    "followUpYears": "中位随访年数 (如 7.3 年)",
    "condition": "适应症 (如 ≤2cm 外周型早期非小细胞肺癌)"
  },
  "keyMetrics": {
    "primaryEndpointName": "主要终点名称 (如 5年总生存率 5-Yr OS)",
    "expValue": "试验组数值 (如 94.3%)",
    "ctrlValue": "对照组数值 (如 91.1%)",
    "hazardRatio": "风险比 (如 HR 0.663, 95%CI 0.463-0.948)",
    "pValue": "统计学P值 (如 P=0.0082)",
    "benefitSummary": "主要终点结论 (如 死亡风险显著降低 33.7%)",
    "secondaryEndpointName": "次要终点名称 (如 5年无复发生存率 5-Yr RFS)",
    "secondaryExpValue": "次要终点试验组 (如 88.0%)",
    "secondaryCtrlValue": "次要终点对照组 (如 87.9%)",
    "secondaryPValue": "P=0.9889 (完全等效)",
    "safetyOrTradeOff": "核心权衡指标 (如 局部切缘复发率 10.5% vs 5.4%，但1年肺功能多保留3.5%)"
  },
  "kmData": {
    "years": [0, 1, 2, 3, 4, 5, 6, 7],
    "segmentectomyOS": [100.0, 99.1, 97.5, 96.0, 95.1, 94.3, 93.5, 92.8],
    "lobectomyOS": [100.0, 98.6, 96.2, 94.1, 92.5, 91.1, 89.8, 88.2]
  },
  "comparisonTable": [
    { "feature": "手术范围", "exp": "解剖性肺段切除 (保肺)", "ctrl": "标准肺叶切除", "verdict": "肺段胜出 (创伤更小)" },
    { "feature": "5年总生存率 (OS)", "exp": "94.3%", "ctrl": "91.1%", "verdict": "肺段显著胜出 (P=0.0082)" },
    { "feature": "5年无复发生存 (RFS)", "exp": "88.0%", "ctrl": "87.9%", "verdict": "等效 (P=0.9889)" },
    { "feature": "局部复发率", "exp": "10.5%", "ctrl": "5.4%", "verdict": "肺叶复发率更低 (P=0.0018)" },
    { "feature": "1年FEV1肺功能损失", "exp": "-8.5%", "ctrl": "-12.0%", "verdict": "肺段多保住3.5%肺活量" },
    { "feature": "非癌症远期死因", "exp": "27 例 (保留更多呼吸耐力)", "ctrl": "52 例", "verdict": "肺段显著降低非癌死亡" }
  ],
  "doctorTakeaways": [
    "对于 ≤2cm、CTR>0.5 的外周型早期非小细胞肺癌，解剖性肺段切除术已确立为新标准治疗；",
    "主要终点 OS 的优效证实了保留肺实质对老年及长期生存患者全身心肺储备的巨大获益；",
    "术中需确保切缘 ≥2.0cm 或大于肿瘤最大径，以最大限度控制局部切缘复发风险。"
  ],
  "safetyProfile": {
    "grade3PlusExp": "22.3% (123例)",
    "grade3PlusCtrl": "22.9% (127例)",
    "grade3PlusP": "P = 0.82 (无显著差异)",
    "keyAEs": [
      { "name": "术后肺漏气持续>7天", "exp": "12.3% (68例)", "ctrl": "6.5% (36例)", "note": "肺段需精细断面缝合 (P=0.001)" },
      { "name": "30天/90天围术期死亡率", "exp": "0.0% / 0.4% (2例)", "ctrl": "0.0% / 0.2% (1例)", "note": "顶级安全性一致" },
      { "name": "严重心律失常/房颤", "exp": "2.2% (12例)", "ctrl": "2.5% (14例)", "note": "耐受良好" },
      { "name": "非肿瘤远期合并症死因", "exp": "27 例 (降低48%)", "ctrl": "52 例", "note": "保肺降低心肺功能衰竭死亡" }
    ]
  },
  "subgroupAnalysis": {
    "title": "关键预设亚组 5年 OS 获益森林图 (Subgroup Forest Plot)",
    "items": [
      { "name": "≥65岁 老年人群", "hr": "0.58", "ci": "0.36 - 0.93", "benefit": "显著优效 (保肺生存优势突出)" },
      { "name": "CTR 0.5~1.0 (含实性成分)", "hr": "0.61", "ci": "0.42 - 0.89", "benefit": "优效确立 (P=0.010)" },
      { "name": "女性 / 从不吸烟人群", "hr": "0.65", "ci": "0.41 - 1.04", "benefit": "获益趋势高度一致" },
      { "name": "病理确诊腺癌", "hr": "0.67", "ci": "0.47 - 0.95", "benefit": "统计学显著获益" }
    ]
  },
  "guidelineImpact": {
    "level": "NCCN / CSCO 1A 类最高等级指南推荐",
    "paradigmShift": "正式改写 1995 年 LCSG 821 准则，将 ≤2cm 实性为主外周早期 NSCLC 标准根治术式确立为解剖性肺段切除",
    "clinicalPathway": [
      { "step": "1. 术前精准评估", "desc": "高分辨薄层 HRCT 结合 3D 支气管血管三维重建规划安全切缘" },
      { "step": "2. 术中双重质控", "desc": "切缘距离 ≥2cm (或大于肿瘤直径) + 快速冰冻病理 N1/N2 淋巴结阴性" },
      { "step": "3. 术后呼吸康复", "desc": "多保留 3.5% 肺功能，早期肺康复训练恢复通气耐力" },
      { "step": "4. 规律严密随访", "desc": "术后前3年每6个月复查薄层 CT，科学保障长期生存" }
    ]
  },
  "patientTakeaways": [
    "查出早期肺结节（≤2cm）莫慌张，5年生存率高达 94.3%，属于根治黄金期；",
    "符合指征优先考虑肺段切除，多保住肺功能，术后爬楼、跑步更轻松；",
    "术后前3年需遵医嘱每半年规律复查胸部薄层CT，微小复发早发现依然可长期高质量生存。"
  ],
  "socialMediaCopy": {
    "hookTitle": "早期肺癌别急着切整叶肺！做肺段切除，活得更长？",
    "summary": "重磅柳叶刀研究！1106例大样本证实：对于≤2cm早期肺结节，只切肺段不仅能根治，5年生存率反而高达94.3%（反超全切的91.1%），还能多保住3.5%肺功能！",
    "bodyBullets": [
      "📌 【生存率逆袭】：5年总生存率 94.3% vs 91.1%，死亡风险直降 33.7%！",
      "🫁 【呼吸耐力】：术后1年多保住 3.5% 肺活量，术后生活质量显著优于整叶切除！",
      "⚠️ 【局部复发】：局部复发率略高（10.5% vs 5.4%），但因心脑感染等非癌死亡人数减少近一半！",
      "🩺 【就医建议】：符合外周、≤2cm、实性结节特征，积极与胸外科专家探讨肺段切除术！"
    ],
    "tags": "#早期肺癌 #肺结节 #保肺手术 #柳叶刀 #胸外科 #肿瘤科普 #健康科普 #医学前沿"
  }
}
"""


class MedBentoRequestHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        sys.stderr.write(f"[{self.log_date_time_string()}] {format % args}\n")

    def send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def get_session_token(self):
        """Extract session token from cookie or Authorization header"""
        cookie_header = self.headers.get("Cookie")
        if cookie_header:
            c = cookies.SimpleCookie()
            try:
                c.load(cookie_header)
                if "medbento_session" in c:
                    return c["medbento_session"].value
            except Exception:
                pass
        
        auth_header = self.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            return auth_header.split(" ", 1)[1].strip()

        return None

    def is_authenticated(self):
        """Check if request is authenticated (or if password protection is disabled)"""
        conf = get_env_config()
        if not conf["auth_pass"]:
            # If no password configured in .env, allow open access
            return True
        
        token = self.get_session_token()
        return bool(token and token in VALID_SESSIONS)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path

        # 1. Public Auth Check API
        if path == "/api/auth-check":
            conf = get_env_config()
            self.send_response(200)
            self.send_cors_headers()
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            resp = {
                "authenticated": self.is_authenticated(),
                "auth_required": bool(conf["auth_pass"]),
                "username": conf["auth_user"] if self.is_authenticated() else None
            }
            self.wfile.write(json.dumps(resp, ensure_ascii=False).encode("utf-8"))
            return

        # 2. Public Login Page Route
        if path == "/login.html" or path == "/login":
            if self.is_authenticated():
                self.send_response(302)
                self.send_header("Location", "/")
                self.end_headers()
                return
            self.serve_file(BASE_DIR / "login.html")
            return

        # 3. Static Assets (CSS, JS, Fonts) - Allow public load so login page is styled
        if path.startswith("/css/") or path.startswith("/js/") or path == "/favicon.ico":
            self.serve_file(BASE_DIR / path.lstrip("/"))
            return

        # 4. Auth Gate for Private Dashboard & APIs
        if not self.is_authenticated():
            if path.startswith("/api/"):
                self.send_response(401)
                self.send_cors_headers()
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "未授权访问，请先登录系统"}, ensure_ascii=False).encode("utf-8"))
                return
            else:
                # Redirect page requests to login page
                self.send_response(302)
                self.send_header("Location", "/login.html")
                self.end_headers()
                return

        # 5. Protected API: System Status Route
        if path == "/api/status":
            conf = get_env_config()
            self.send_response(200)
            self.send_cors_headers()
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            resp = {
                "status": "ok",
                "gemini_configured": bool(conf["api_key"]),
                "model": conf["model"],
                "port": PORT,
                "auth_enabled": bool(conf["auth_pass"])
            }
            self.wfile.write(json.dumps(resp, ensure_ascii=False).encode("utf-8"))
            return

        # 6. Protected Main App & Files
        if path == "/" or path == "":
            rel_path = "index.html"
        else:
            rel_path = path.lstrip("/")

        self.serve_file(BASE_DIR / rel_path)

    def serve_file(self, file_path: Path):
        """Safely serve a static file from disk"""
        try:
            file_path = file_path.resolve()
            if not str(file_path).startswith(str(BASE_DIR.resolve())):
                self.send_error(403, "Access Denied")
                return
        except Exception:
            self.send_error(404, "File Not Found")
            return

        if not file_path.exists() or not file_path.is_file():
            self.send_error(404, f"File Not Found: {file_path.name}")
            return

        mime_type, _ = mimetypes.guess_type(str(file_path))
        if not mime_type:
            mime_type = "application/octet-stream"

        try:
            with open(file_path, "rb") as f:
                content = f.read()

            self.send_response(200)
            self.send_cors_headers()
            self.send_header("Content-Type", mime_type)
            self.send_header("Content-Length", str(len(content)))
            self.send_header("Cache-Control", "no-cache")
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            self.send_error(500, f"Internal Server Error: {str(e)}")

    def do_POST(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path

        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)

        try:
            req_data = json.loads(body.decode("utf-8")) if body else {}
        except Exception:
            req_data = {}

        # 1. Login Endpoint
        if path == "/api/login":
            self.handle_api_login(req_data)
            return

        # 2. Logout Endpoint
        if path == "/api/logout":
            self.handle_api_logout()
            return

        # Protected API Routes Gate
        if not self.is_authenticated():
            self.send_response(401)
            self.send_cors_headers()
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"error": "未授权访问，请先登录系统"}, ensure_ascii=False).encode("utf-8"))
            return

        # 3. Medical Study Analyzer
        if path == "/api/analyze":
            self.handle_api_analyze(req_data)
            return

        # 4. Online Webpage Scraper
        if path == "/api/fetch-url":
            self.handle_api_fetch_url(req_data)
            return

        self.send_error(404, "API Endpoint Not Found")

    def handle_api_login(self, data):
        conf = get_env_config()
        username = data.get("username", "").strip()
        password = data.get("password", "").strip()

        # If no password configured in .env, accept any login
        expected_pass = conf["auth_pass"]
        expected_user = conf["auth_user"]

        if not expected_pass or (username == expected_user and password == expected_pass):
            token = secrets.token_hex(24)
            VALID_SESSIONS.add(token)

            self.send_response(200)
            self.send_cors_headers()
            self.send_header("Content-Type", "application/json; charset=utf-8")
            # Set 30-day session cookie
            self.send_header("Set-Cookie", f"medbento_session={token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000")
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "token": token}, ensure_ascii=False).encode("utf-8"))
        else:
            self.send_response(401)
            self.send_cors_headers()
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "error": "用户名或访问密码不正确，请检查 .env 中的设置"}, ensure_ascii=False).encode("utf-8"))

    def handle_api_logout(self):
        token = self.get_session_token()
        if token and token in VALID_SESSIONS:
            VALID_SESSIONS.remove(token)

        self.send_response(200)
        self.send_cors_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Set-Cookie", "medbento_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0")
        self.end_headers()
        self.wfile.write(json.dumps({"success": True}, ensure_ascii=False).encode("utf-8"))

    def handle_api_analyze(self, data):
        conf = get_env_config()
        api_key = conf["api_key"]
        model = conf["model"]
        
        pdf_base64 = data.get("pdf_base64")
        text_content = data.get("text", "")
        style = data.get("style", "social_viral")

        if not api_key:
            self.send_response(400)
            self.send_cors_headers()
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            resp = {
                "error": "后端未配置 GEMINI_API_KEY。请在项目根目录的 .env 文件中填入您的 Gemini API Key。"
            }
            self.wfile.write(json.dumps(resp, ensure_ascii=False).encode("utf-8"))
            return

        # Build Gemini REST Request
        parts = []
        if pdf_base64:
            clean_base64 = pdf_base64
            if "," in clean_base64:
                clean_base64 = clean_base64.split(",", 1)[1]
            parts.append({
                "inline_data": {
                    "mime_type": "application/pdf",
                    "data": clean_base64
                }
            })

        user_instruction = f"{SYSTEM_MEDICAL_PROMPT}\n\n【用户选择的风格模式】：{style}\n\n【输入的文献文本内容】：\n{text_content[:20000] if text_content else '（请结合上传的PDF报告进行全量分析）'}"
        parts.append({"text": user_instruction})

        gemini_payload = {
            "contents": [{"parts": parts}],
            "generationConfig": {
                "temperature": 0.2,
                "responseMimeType": "application/json"
            }
        }

        gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

        # Robust API calling with up to 3 retries and exponential backoff
        max_retries = 3
        last_error_msg = None
        result = None

        for attempt in range(max_retries):
            try:
                req = urllib.request.Request(
                    gemini_url,
                    data=json.dumps(gemini_payload).encode("utf-8"),
                    headers={"Content-Type": "application/json"}
                )
                with urllib.request.urlopen(req, timeout=60) as response:
                    result = json.loads(response.read().decode("utf-8"))
                break  # Successful
            except urllib.error.HTTPError as e:
                err_body = e.read().decode("utf-8")
                last_error_msg = f"Gemini API 错误 ({e.code}): {err_body}"
                if e.code in (429, 500, 502, 503, 504) and attempt < max_retries - 1:
                    sleep_sec = (attempt + 1) * 1.5
                    print(f"⚠️ Gemini API 返回 HTTP {e.code}，将在 {sleep_sec}s 后重试 (第 {attempt + 1}/{max_retries} 次)...")
                    time.sleep(sleep_sec)
                    continue
                else:
                    self.send_response(e.code)
                    self.send_cors_headers()
                    self.send_header("Content-Type", "application/json; charset=utf-8")
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": last_error_msg}, ensure_ascii=False).encode("utf-8"))
                    return
            except Exception as e:
                last_error_msg = f"请求异常: {str(e)}"
                if attempt < max_retries - 1:
                    sleep_sec = (attempt + 1) * 1.5
                    print(f"⚠️ 网络请求异常: {e}，将在 {sleep_sec}s 后重试 (第 {attempt + 1}/{max_retries} 次)...")
                    time.sleep(sleep_sec)
                    continue
                else:
                    self.send_response(500)
                    self.send_cors_headers()
                    self.send_header("Content-Type", "application/json; charset=utf-8")
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": f"服务器内部处理异常: {str(e)}"}, ensure_ascii=False).encode("utf-8"))
                    return

        if not result:
            self.send_response(500)
            self.send_cors_headers()
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"error": last_error_msg or "未能获取到有效的模型分析结果"}, ensure_ascii=False).encode("utf-8"))
            return

        try:
            candidates = result.get("candidates", [])
            if not candidates:
                raise ValueError("Gemini 未返回有效预测结果")

            raw_text = candidates[0]["content"]["parts"][0]["text"]
            clean_json_str = raw_text.strip()
            if clean_json_str.startswith("```json"):
                clean_json_str = clean_json_str[7:]
            if clean_json_str.startswith("```"):
                clean_json_str = clean_json_str[3:]
            if clean_json_str.endswith("```"):
                clean_json_str = clean_json_str[:-3]
            clean_json_str = clean_json_str.strip()

            parsed_data = json.loads(clean_json_str)

            self.send_response(200)
            self.send_cors_headers()
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(parsed_data, ensure_ascii=False).encode("utf-8"))
        except Exception as e:
            self.send_response(500)
            self.send_cors_headers()
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"error": f"模型返回内容 JSON 解析失败: {str(e)}"}, ensure_ascii=False).encode("utf-8"))

    def handle_api_fetch_url(self, data):
        url = data.get("url", "").strip()
        if not url:
            self.send_response(400)
            self.send_cors_headers()
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"error": "缺少 url 参数"}, ensure_ascii=False).encode("utf-8"))
            return

        if not url.startswith("http://") and not url.startswith("https://"):
            url = "https://" + url

        # SSRF Security Validation
        if not is_safe_external_url(url):
            self.send_response(400)
            self.send_cors_headers()
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"error": "安全防护拦截：仅支持抓取合法的公网公开医学文献网页，不支持私有局域网/内网地址。"}, ensure_ascii=False).encode("utf-8"))
            return

        try:
            reader_url = f"https://r.jina.ai/{url}"
            req = urllib.request.Request(
                reader_url,
                headers={"Accept": "text/markdown, text/plain", "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
            )
            with urllib.request.urlopen(req, timeout=20) as resp:
                text = resp.read().decode("utf-8")

            self.send_response(200)
            self.send_cors_headers()
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"text": text}, ensure_ascii=False).encode("utf-8"))
        except Exception as e:
            self.send_response(500)
            self.send_cors_headers()
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"error": f"抓取网页正文失败: {str(e)}"}, ensure_ascii=False).encode("utf-8"))


def run_server():
    conf = get_env_config()
    server_address = (HOST, PORT)
    httpd = HTTPServer(server_address, MedBentoRequestHandler)
    print("=" * 65)
    print(" 🚀 MedBento AI - 医学报告 Bento 可视化 & 自媒体切片系统")
    print(f" 🌐 访问地址: http://localhost:{PORT}")
    print(f" 📦 运行端口: {PORT} (自定义非标准端口，适配 VPS / Docker)")
    print(f" 🔒 私有鉴权: {'已启用 (密码保护中)' if conf['auth_pass'] else '未设置密码 (公开免密模式)'}")
    print(f" 🔑 Gemini API: {'已配置 (.env)' if conf['api_key'] else '未配置 (使用内置高质量离线引擎)'}")
    print("=" * 65)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 服务已平稳停止。")
        httpd.server_close()


if __name__ == "__main__":
    run_server()
