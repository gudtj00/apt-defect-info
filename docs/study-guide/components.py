# -*- coding: utf-8 -*-
"""재사용 컴포넌트 — 참고 PDF(2026 세제개편안 해설)의 디자인 언어를 재현한다."""
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import (
    Paragraph, Spacer, Table, TableStyle, Flowable, KeepTogether, HRFlowable
)

# ── 폰트 ──────────────────────────────────────────────────────────
pdfmetrics.registerFont(TTFont("Malgun", "C:/Windows/Fonts/malgun.ttf"))
pdfmetrics.registerFont(TTFont("Malgun-Bold", "C:/Windows/Fonts/malgunbd.ttf"))
pdfmetrics.registerFontFamily("Malgun", normal="Malgun", bold="Malgun-Bold")
REG, BOLD = "Malgun", "Malgun-Bold"

# ── 색상 팔레트 ────────────────────────────────────────────────────
NAVY_DARK = colors.HexColor("#101d33")
NAVY = colors.HexColor("#1b3a63")
BLUE = colors.HexColor("#2f6fb0")
BLUE_LIGHT_BG = colors.HexColor("#eaf1fb")
BLUE_BAR = colors.HexColor("#3a7cc4")
BLUE_BAR_DARK = colors.HexColor("#1e4f85")
GRAY_TEXT = colors.HexColor("#5a6472")
GRAY_LIGHT = colors.HexColor("#f4f5f7")
GRAY_BORDER = colors.HexColor("#dcdfe4")
AMBER_BG = colors.HexColor("#fdf3d9")
AMBER_TEXT = colors.HexColor("#8a6300")
RED_BG = colors.HexColor("#fbe4e2")
RED_TEXT = colors.HexColor("#b3261e")
GREEN_BG = colors.HexColor("#e2f3e6")
GREEN_TEXT = colors.HexColor("#1a7f37")
GRAY_TAG_BG = colors.HexColor("#eceef1")
GRAY_TAG_TEXT = colors.HexColor("#555555")
WHITE = colors.white

CONTENT_WIDTH = 174 * mm

# ── 문단 스타일 ────────────────────────────────────────────────────
S = {
    "cover_label": ParagraphStyle("cover_label", fontName=REG, fontSize=9.5, leading=13,
                                   textColor=colors.HexColor("#9db4d6"), tracking=1),
    "cover_title": ParagraphStyle("cover_title", fontName=BOLD, fontSize=27, leading=34, textColor=WHITE),
    "cover_sub": ParagraphStyle("cover_sub", fontName=REG, fontSize=11, leading=16,
                                 textColor=colors.HexColor("#c9d6e8")),
    "cover_stat_num": ParagraphStyle("cover_stat_num", fontName=BOLD, fontSize=20, leading=24, textColor=WHITE,
                                      alignment=TA_CENTER),
    "cover_stat_label": ParagraphStyle("cover_stat_label", fontName=REG, fontSize=8, leading=11,
                                        textColor=colors.HexColor("#b9c9e0"), alignment=TA_CENTER),
    "cover_src": ParagraphStyle("cover_src", fontName=REG, fontSize=8.5, leading=12,
                                 textColor=colors.HexColor("#8fa3c2")),

    "part_label": ParagraphStyle("part_label", fontName=REG, fontSize=9.5, leading=13,
                                   textColor=colors.HexColor("#9db4d6")),
    "part_title": ParagraphStyle("part_title", fontName=BOLD, fontSize=21, leading=27, textColor=WHITE),
    "part_sub": ParagraphStyle("part_sub", fontName=REG, fontSize=10, leading=14,
                                 textColor=colors.HexColor("#c9d6e8")),

    "h1": ParagraphStyle("h1", fontName=BOLD, fontSize=16, leading=21, textColor=NAVY_DARK,
                          spaceBefore=4, spaceAfter=10),
    "h2": ParagraphStyle("h2", fontName=BOLD, fontSize=12.5, leading=17, textColor=NAVY_DARK,
                          spaceBefore=10, spaceAfter=6),
    "h3": ParagraphStyle("h3", fontName=BOLD, fontSize=10.8, leading=15, textColor=NAVY,
                          spaceBefore=6, spaceAfter=4),

    "body": ParagraphStyle("body", fontName=REG, fontSize=9.6, leading=15, textColor=colors.HexColor("#2b2f36"),
                            spaceAfter=7, alignment=TA_LEFT),
    "body_tight": ParagraphStyle("body_tight", fontName=REG, fontSize=9.4, leading=13.6, spaceAfter=2),
    "caption": ParagraphStyle("caption", fontName=REG, fontSize=8, leading=11.5, textColor=GRAY_TEXT, spaceAfter=8),

    "card_title": ParagraphStyle("card_title", fontName=BOLD, fontSize=10.3, leading=14, textColor=NAVY_DARK,
                                   spaceAfter=3),
    "card_body": ParagraphStyle("card_body", fontName=REG, fontSize=9.2, leading=13.6, textColor=colors.HexColor("#333844")),
    "card_sub": ParagraphStyle("card_sub", fontName=REG, fontSize=8.3, leading=11.5, textColor=GRAY_TEXT, spaceAfter=4),

    "quote": ParagraphStyle("quote", fontName=REG, fontSize=9.3, leading=14, textColor=colors.HexColor("#333"),
                              leftIndent=10, spaceAfter=4),
    "quote_src": ParagraphStyle("quote_src", fontName=REG, fontSize=8, leading=11, textColor=GRAY_TEXT,
                                  leftIndent=10, spaceAfter=10),

    "stat_num": ParagraphStyle("stat_num", fontName=BOLD, fontSize=18, leading=22, textColor=NAVY, alignment=TA_CENTER),
    "stat_label": ParagraphStyle("stat_label", fontName=REG, fontSize=7.8, leading=10.5, textColor=GRAY_TEXT,
                                   alignment=TA_CENTER),

    "cell": ParagraphStyle("cell", fontName=REG, fontSize=8.6, leading=12.4),
    "cell_b": ParagraphStyle("cell_b", fontName=BOLD, fontSize=8.6, leading=12.4),
    "cell_head": ParagraphStyle("cell_head", fontName=BOLD, fontSize=8.8, leading=12, textColor=WHITE),
    "cell_head_navy": ParagraphStyle("cell_head_navy", fontName=BOLD, fontSize=9, leading=12.5, textColor=NAVY_DARK),

    "pill": ParagraphStyle("pill", fontName=BOLD, fontSize=7.6, leading=10, alignment=TA_CENTER),
    "warn": ParagraphStyle("warn", fontName=REG, fontSize=9, leading=13.4, textColor=AMBER_TEXT),
    "law_art": ParagraphStyle("law_art", fontName=BOLD, fontSize=10, leading=14, textColor=NAVY, spaceBefore=6, spaceAfter=3),
}


def P(text, style="body"):
    return Paragraph(text, S[style])


def rounded_table(data, col_widths, style_cmds, row_heights=None):
    t = Table(data, colWidths=col_widths, rowHeights=row_heights)
    t.setStyle(TableStyle(style_cmds))
    return t


def card(title, body_paras, bg=BLUE_LIGHT_BG, border=None, pad=10, title_style="card_title"):
    """단일 카드 박스(둥근 모서리, 배경색)."""
    content = [P(title, title_style)] if title else []
    content += body_paras
    inner = Table([[content]], colWidths=[CONTENT_WIDTH - 2 * pad])
    cmds = [
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("LEFTPADDING", (0, 0), (-1, -1), pad),
        ("RIGHTPADDING", (0, 0), (-1, -1), pad),
        ("TOPPADDING", (0, 0), (-1, -1), pad),
        ("BOTTOMPADDING", (0, 0), (-1, -1), pad),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ROUNDEDCORNERS", [6, 6, 6, 6]),
    ]
    if border:
        cmds.append(("BOX", (0, 0), (-1, -1), 0.8, border))
    outer = Table([[inner]], colWidths=[CONTENT_WIDTH])
    outer.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    inner.setStyle(TableStyle(cmds))
    return inner


def pill(text, bg, fg):
    t = Table([[P(text, "pill")]], colWidths=[None])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("TEXTCOLOR", (0, 0), (-1, -1), fg),
        ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("ROUNDEDCORNERS", [4, 4, 4, 4]),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    return t


def pill_row(pills):
    """[(text,bg,fg), ...] 튜플 리스트를 가로로 나열."""
    cells = [pill(t, bg, fg) for t, bg, fg in pills]
    row = Table([cells], colWidths=[None] * len(cells), hAlign="LEFT")
    row.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    return row


def stat_row(items):
    """items = [(number_str, label_str), ...] 최대 4~5개."""
    n = len(items)
    w = CONTENT_WIDTH / n
    cells = [[P(num, "stat_num"), P(label, "stat_label")] for num, label in items]
    # 각 셀을 별도 박스로
    boxes = []
    for num, label in items:
        inner = Table([[P(num, "stat_num")], [P(label, "stat_label")]], colWidths=[w - 6])
        inner.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), BLUE_LIGHT_BG),
            ("ROUNDEDCORNERS", [6, 6, 6, 6]),
            ("TOPPADDING", (0, 0), (-1, -1), 10), ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ]))
        boxes.append(inner)
    row = Table([boxes], colWidths=[w] * n)
    row.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 3), ("RIGHTPADDING", (0, 0), (-1, -1), 3),
        ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    return row


def cover_stat_row(items, width=CONTENT_WIDTH):
    n = len(items)
    w = width / n - 2
    boxes = []
    for num, label in items:
        inner = Table([[P(num, "cover_stat_num")], [P(label, "cover_stat_label")]], colWidths=[w])
        inner.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#1c3255")),
            ("ROUNDEDCORNERS", [6, 6, 6, 6]),
            ("TOPPADDING", (0, 0), (-1, -1), 12), ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ]))
        boxes.append(inner)
    row = Table([boxes], colWidths=[w + 2] * n)
    row.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 3), ("RIGHTPADDING", (0, 0), (-1, -1), 3),
        ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    return row


def part_divider(number, title, subtitle):
    label = P(f"PART {number}", "part_label")
    t = P(title, "part_title")
    sub = P(subtitle, "part_sub")
    inner = Table([[label], [Spacer(1, 4)], [t], [Spacer(1, 4)], [sub]], colWidths=[CONTENT_WIDTH - 40])
    inner.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    box = Table([[inner]], colWidths=[CONTENT_WIDTH])
    box.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("ROUNDEDCORNERS", [8, 8, 8, 8]),
        ("LEFTPADDING", (0, 0), (-1, -1), 20), ("RIGHTPADDING", (0, 0), (-1, -1), 20),
        ("TOPPADDING", (0, 0), (-1, -1), 22), ("BOTTOMPADDING", (0, 0), (-1, -1), 22),
    ]))
    return box


def warning_box(text, label="유의사항"):
    return card(f"{label} — ", [P(text, "warn")], bg=AMBER_BG, title_style="h3")


def section_num_header(num, title):
    circle = Table([[P(str(num), "cell_head")]], colWidths=[20], rowHeights=[20])
    circle.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BLUE),
        ("ROUNDEDCORNERS", [10, 10, 10, 10]),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    header_style = ParagraphStyle("shdr", fontName=BOLD, fontSize=13, leading=20, textColor=NAVY_DARK)
    row = Table([[circle, P(title, "h2")]], colWidths=[26, CONTENT_WIDTH - 26])
    row.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    return row


def two_col_compare(left_title, left_body, right_title, right_body, left_bg=GRAY_LIGHT):
    lw = (CONTENT_WIDTH - 6) / 2
    left_head = Table([[P(left_title, "cell_head_navy")]], colWidths=[lw])
    left_head.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#dfe3e8")),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"), ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    right_head = Table([[P(right_title, "cell_head")]], colWidths=[lw])
    right_head.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"), ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    left_col = [left_head, Spacer(1, 4)] + left_body
    right_col = [right_head, Spacer(1, 4)] + right_body
    tbl = Table([[left_col, right_col]], colWidths=[lw, lw])
    tbl.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOX", (0, 0), (0, 0), 0.7, GRAY_BORDER), ("BOX", (1, 0), (1, 0), 0.7, GRAY_BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    spacer_col = Table([[""]], colWidths=[6])
    wrapper = Table([[tbl]], colWidths=[CONTENT_WIDTH])
    return tbl


def styled_table(header, rows, col_widths, header_bg=NAVY, zebra=True, font_size=8.4):
    style = ParagraphStyle("dyn_cell", fontName=REG, fontSize=font_size, leading=font_size + 3.5)
    style_head = ParagraphStyle("dyn_head", fontName=BOLD, fontSize=font_size + 0.3, leading=font_size + 4, textColor=WHITE)
    data = [[Paragraph(h, style_head) for h in header]]
    for r in rows:
        data.append([Paragraph(str(c), style) for c in r])
    t = Table(data, colWidths=col_widths, repeatRows=1)
    cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), header_bg),
        ("GRID", (0, 0), (-1, -1), 0.5, GRAY_BORDER),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 6), ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]
    if zebra:
        cmds.append(("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, GRAY_LIGHT]))
    t.setStyle(TableStyle(cmds))
    return t


class HBarChart(Flowable):
    """가로 막대그래프. items = [(label, value, value_label, color?), ...]"""
    def __init__(self, items, width=CONTENT_WIDTH, bar_height=15, gap=7, max_value=None, label_width=118):
        super().__init__()
        self.items = items
        self.width = width
        self.bar_height = bar_height
        self.gap = gap
        self.label_width = label_width
        self.max_value = max_value or max(v for _, v, *_ in items)
        self.height = len(items) * (bar_height + gap)

    def wrap(self, availWidth, availHeight):
        return self.width, self.height

    def draw(self):
        c = self.canv
        bar_area = self.width - self.label_width - 45
        y = self.height
        for item in self.items:
            label, value = item[0], item[1]
            vlabel = item[2] if len(item) > 2 else str(value)
            color = item[3] if len(item) > 3 else BLUE_BAR
            y -= (self.bar_height + self.gap)
            c.setFont(REG, 8.6)
            c.setFillColor(colors.HexColor("#333"))
            c.drawRightString(self.label_width - 8, y + 4, label)
            bw = max(4, bar_area * (value / self.max_value))
            c.setFillColor(color)
            c.roundRect(self.label_width, y, bw, self.bar_height, 3, stroke=0, fill=1)
            c.setFont(BOLD, 8)
            if bw > 34:
                c.setFillColor(WHITE)
                c.drawRightString(self.label_width + bw - 6, y + 4.3, vlabel)
            else:
                c.setFillColor(colors.HexColor("#333"))
                c.drawString(self.label_width + bw + 4, y + 4.3, vlabel)


class SwotGrid(Flowable):
    """2x2 SWOT 그리드."""
    def __init__(self, s_items, w_items, o_items, t_items, width=CONTENT_WIDTH, height=230):
        super().__init__()
        self.data = [
            ("강점 (Strengths)", s_items, colors.HexColor("#e2f3e6"), colors.HexColor("#1a7f37")),
            ("약점 (Weaknesses)", w_items, colors.HexColor("#fbe9e2"), colors.HexColor("#c0492e")),
            ("기회 (Opportunities)", o_items, colors.HexColor("#eaf1fb"), colors.HexColor("#2f6fb0")),
            ("위협 (Threats)", t_items, colors.HexColor("#fdf3d9"), colors.HexColor("#8a6300")),
        ]
        self.width = width
        self.height = height

    def wrap(self, availWidth, availHeight):
        return self.width, self.height

    def draw(self):
        c = self.canv
        cw = self.width / 2 - 4
        ch = self.height / 2 - 4
        positions = [(0, self.height / 2 + 4), (cw + 8, self.height / 2 + 4), (0, 0), (cw + 8, 0)]
        for (title, items, bg, fg), (x, y) in zip(self.data, positions):
            c.setFillColor(bg)
            c.roundRect(x, y, cw, ch, 6, stroke=0, fill=1)
            c.setFillColor(fg)
            c.setFont(BOLD, 10.5)
            c.drawString(x + 10, y + ch - 18, title)
            c.setFont(REG, 8.3)
            c.setFillColor(colors.HexColor("#333"))
            ty = y + ch - 36
            for it in items:
                lines = wrap_text(it, chars_per_line(cw - 20, 8.3))
                for li, line in enumerate(lines):
                    prefix = "• " if li == 0 else "  "
                    c.drawString(x + 10, ty, prefix + line)
                    ty -= 11
                ty -= 2
                if ty < y + 8:
                    break


def wrap_text(text, width_chars):
    """CJK 텍스트는 공백 유무와 무관하게 고정 글자수로 하드랩한다(띄어쓰기 기준 줄바꿈은
    한글에서 신뢰할 수 없다 — 공백이 거의 없는 라벨이 박스 밖으로 삐져나가는 버그의 원인이었음)."""
    width_chars = max(4, width_chars)
    out = []
    for segment in text.split("\n"):
        segment = segment.strip()
        while len(segment) > width_chars:
            cut = segment.rfind(" ", 0, width_chars + 1)
            if cut <= 0:
                cut = width_chars
            out.append(segment[:cut].strip())
            segment = segment[cut:].strip()
        out.append(segment)
    return out or [text]


def chars_per_line(width_pt, fontsize):
    """CJK 완전폭 문자는 대략 폰트사이즈만큼의 폭을 차지한다(영문 word-wrap 계수를 쓰면 넘친다)."""
    return max(4, int(width_pt / (fontsize * 1.0)))


class PhaseTimeline(Flowable):
    """Phase 0~4 진행 현황 타임라인."""
    def __init__(self, phases, width=CONTENT_WIDTH, height=70):
        super().__init__()
        self.phases = phases  # [(label, status)]  status: 'done' | 'partial' | 'todo'
        self.width = width
        self.height = height

    def wrap(self, availWidth, availHeight):
        return self.width, self.height

    def draw(self):
        c = self.canv
        n = len(self.phases)
        cx0 = 30
        cx1 = self.width - 30
        step = (cx1 - cx0) / (n - 1)
        liney = self.height - 34
        c.setStrokeColor(GRAY_BORDER)
        c.setLineWidth(2)
        c.line(cx0, liney, cx1, liney)
        colors_map = {"done": GREEN_TEXT, "partial": AMBER_TEXT, "todo": colors.HexColor("#b0b6bf")}
        fill_map = {"done": GREEN_TEXT, "partial": AMBER_TEXT, "todo": WHITE}
        for i, (label, status) in enumerate(self.phases):
            x = cx0 + i * step
            col = colors_map[status]
            c.setFillColor(fill_map[status] if status != "todo" else WHITE)
            c.setStrokeColor(col)
            c.setLineWidth(1.6)
            c.circle(x, liney, 8, stroke=1, fill=(status != "todo"))
            if status == "done":
                c.setFillColor(WHITE)
                c.setFont(BOLD, 9)
                c.drawCentredString(x, liney - 3.2, "✓")
            c.setFont(BOLD, 8.4)
            c.setFillColor(colors.HexColor("#2b2f36"))
            c.drawCentredString(x, liney - 24, label)
            status_label = {"done": "완료", "partial": "일부완료", "todo": "미착수"}[status]
            c.setFont(REG, 7.6)
            c.setFillColor(col)
            c.drawCentredString(x, liney + 14, status_label)


class FlowDiagram(Flowable):
    """데이터 소스 3개 -> 엔진 -> 웹서비스 흐름도."""
    def __init__(self, sources, engine_label, output_label, width=CONTENT_WIDTH, height=150):
        super().__init__()
        self.sources = sources
        self.engine_label = engine_label
        self.output_label = output_label
        self.width = width
        self.height = height

    def wrap(self, availWidth, availHeight):
        return self.width, self.height

    def _box(self, c, x, y, w, h, text, bg, fg, fontsize=8.6, bold=False):
        c.setFillColor(bg)
        c.roundRect(x, y, w, h, 5, stroke=0, fill=1)
        c.setFillColor(fg)
        c.setFont(BOLD if bold else REG, fontsize)
        lines = wrap_text(text, chars_per_line(w - 16, fontsize))
        ty = y + h / 2 + (len(lines) - 1) * (fontsize + 2) / 2
        for line in lines:
            c.drawCentredString(x + w / 2, ty, line)
            ty -= fontsize + 2

    def draw(self):
        c = self.canv
        n = len(self.sources)
        src_w = 168
        src_h = 40
        gap = 14
        total_h = n * src_h + (n - 1) * gap
        y0 = (self.height - total_h) / 2
        src_x = 0
        for i, s in enumerate(self.sources):
            y = y0 + total_h - src_h - i * (src_h + gap)
            self._box(c, src_x, y, src_w, src_h, s, BLUE_LIGHT_BG, NAVY, fontsize=7.8, bold=True)
            # 화살표
            c.setStrokeColor(colors.HexColor("#9aa7b8"))
            c.setLineWidth(1.3)
            c.line(src_x + src_w + 4, y + src_h / 2, src_x + src_w + 34, self.height / 2)
        engine_x = src_x + src_w + 38
        engine_w = 130
        engine_h = 56
        engine_y = self.height / 2 - engine_h / 2
        self._box(c, engine_x, engine_y, engine_w, engine_h, self.engine_label, NAVY, WHITE, fontsize=9.4, bold=True)
        c.setStrokeColor(colors.HexColor("#9aa7b8"))
        c.line(engine_x + engine_w + 4, self.height / 2, engine_x + engine_w + 30, self.height / 2)
        out_x = engine_x + engine_w + 34
        out_w = self.width - out_x
        out_h = 44
        out_y = self.height / 2 - out_h / 2
        self._box(c, out_x, out_y, out_w, out_h, self.output_label, GREEN_BG, GREEN_TEXT, fontsize=9, bold=True)
