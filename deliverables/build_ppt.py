from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt
import copy

# ── Palette ──────────────────────────────────────────────────────────────────
BG_DARK      = RGBColor(0x0D, 0x0F, 0x14)   # near-black navy
BG_CARD      = RGBColor(0x16, 0x1A, 0x24)   # card bg
ACCENT_GREEN = RGBColor(0x3E, 0xD5, 0x8E)   # brand green
ACCENT_TEAL  = RGBColor(0x22, 0xC5, 0xBF)   # teal
ACCENT_GOLD  = RGBColor(0xF5, 0xC5, 0x18)   # gold highlight
WHITE        = RGBColor(0xFF, 0xFF, 0xFF)
LIGHT_GRAY   = RGBColor(0xB0, 0xB8, 0xCC)
MID_GRAY     = RGBColor(0x4A, 0x52, 0x68)
DIM          = RGBColor(0x2A, 0x30, 0x42)

W = Inches(13.33)
H = Inches(7.5)

prs = Presentation()
prs.slide_width  = W
prs.slide_height = H
blank = prs.slide_layouts[6]   # completely blank

# ── Helpers ───────────────────────────────────────────────────────────────────
def add_rect(slide, x, y, w, h, fill=None, alpha=None, line=None, line_w=Pt(0)):
    shape = slide.shapes.add_shape(1, x, y, w, h)
    shape.line.fill.background()
    if fill:
        shape.fill.solid()
        shape.fill.fore_color.rgb = fill
    else:
        shape.fill.background()
    if line:
        shape.line.color.rgb = line
        shape.line.width = line_w
    else:
        shape.line.fill.background()
    return shape

def add_text(slide, text, x, y, w, h, size=Pt(18), bold=False, color=WHITE,
             align=PP_ALIGN.LEFT, italic=False, wrap=True):
    tb = slide.shapes.add_textbox(x, y, w, h)
    tb.word_wrap = wrap
    tf = tb.text_frame
    tf.word_wrap = wrap
    p  = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    run.font.size  = size
    run.font.bold  = bold
    run.font.color.rgb = color
    run.font.italic = italic
    return tb

def add_multiline(slide, lines, x, y, w, h, size=Pt(14), color=LIGHT_GRAY,
                  spacing=Pt(6), align=PP_ALIGN.LEFT):
    tb = slide.shapes.add_textbox(x, y, w, h)
    tb.word_wrap = True
    tf = tb.text_frame
    tf.word_wrap = True
    for i, (txt, bold, clr) in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        p.space_after = spacing
        run = p.add_run()
        run.text = txt
        run.font.size  = size
        run.font.bold  = bold
        run.font.color.rgb = clr or color
    return tb

def bg(slide):
    """Full dark background"""
    add_rect(slide, 0, 0, W, H, fill=BG_DARK)

def accent_bar(slide, color=ACCENT_GREEN, width=Inches(0.05)):
    """Left accent bar"""
    add_rect(slide, 0, 0, width, H, fill=color)

def slide_tag(slide, text, color=ACCENT_GREEN):
    """Small top-right label"""
    add_text(slide, text, Inches(11.5), Inches(0.18), Inches(1.7), Inches(0.35),
             size=Pt(9), color=color, align=PP_ALIGN.RIGHT, italic=True)

def divider(slide, y, color=MID_GRAY):
    add_rect(slide, Inches(0.4), y, Inches(12.5), Pt(1), fill=color)

def pill(slide, text, x, y, color=ACCENT_GREEN, text_color=BG_DARK):
    w = Inches(1.4)
    h = Inches(0.35)
    add_rect(slide, x, y, w, h, fill=color)
    add_text(slide, text, x, y, w, h, size=Pt(11), bold=True,
             color=text_color, align=PP_ALIGN.CENTER)

def icon_bullet(slide, icon, text, x, y, icon_color=ACCENT_GREEN, size=Pt(13)):
    add_text(slide, icon, x, y, Inches(0.4), Inches(0.32),
             size=size, bold=True, color=icon_color)
    add_text(slide, text, x+Inches(0.38), y, Inches(5.5), Inches(0.32),
             size=size, color=LIGHT_GRAY)

def card(slide, x, y, w, h, fill=BG_CARD, border=ACCENT_GREEN):
    r = add_rect(slide, x, y, w, h, fill=fill, line=border, line_w=Pt(1))
    return r


# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 1 — TITLE
# ══════════════════════════════════════════════════════════════════════════════
s = prs.slides.add_slide(blank)
bg(s)

# Gradient overlay strip (simulated with two rects)
add_rect(s, 0, 0, W, Inches(0.008), fill=ACCENT_GREEN)
add_rect(s, 0, H-Inches(0.008), W, Inches(0.008), fill=ACCENT_TEAL)

# Big decorative circle (background)
circ = s.shapes.add_shape(9, Inches(8.5), Inches(-1.2), Inches(5.5), Inches(5.5))
circ.fill.solid(); circ.fill.fore_color.rgb = RGBColor(0x1A, 0x22, 0x35)
circ.line.fill.background()

circ2 = s.shapes.add_shape(9, Inches(9.8), Inches(3.5), Inches(3.5), Inches(3.5))
circ2.fill.solid(); circ2.fill.fore_color.rgb = RGBColor(0x16, 0x20, 0x2F)
circ2.line.fill.background()

# Tag line
add_text(s, "INTERNSHIP PROJECT  ·  AWS SERVERLESS", Inches(0.55), Inches(1.6),
         Inches(8), Inches(0.4), size=Pt(11), color=ACCENT_GREEN, bold=True, italic=False)

# Main title
add_text(s, "OnboardIQ", Inches(0.5), Inches(2.1), Inches(9), Inches(1.5),
         size=Pt(72), bold=True, color=WHITE)

add_text(s, "Smart Employee Onboarding", Inches(0.55), Inches(3.5),
         Inches(9), Inches(0.7), size=Pt(32), bold=False, color=ACCENT_TEAL)
add_text(s, "& Identity Service", Inches(0.55), Inches(4.1),
         Inches(9), Inches(0.7), size=Pt(32), bold=False, color=ACCENT_TEAL)

# Sub
add_text(s, "From offer letter acceptance to Day 1 login — fully automated on AWS",
         Inches(0.55), Inches(5.0), Inches(9), Inches(0.5),
         size=Pt(15), color=LIGHT_GRAY, italic=True)

# Tech pills
px = Inches(0.55)
for label, clr in [("React", ACCENT_GREEN), ("AWS Lambda", ACCENT_TEAL),
                    ("Step Functions", ACCENT_GOLD), ("DynamoDB", ACCENT_GREEN),
                    ("Cognito", ACCENT_TEAL)]:
    pill(s, label, px, Inches(6.2), color=clr, text_color=BG_DARK)
    px += Inches(1.55)


# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 2 — THE PROBLEM
# ══════════════════════════════════════════════════════════════════════════════
s = prs.slides.add_slide(blank)
bg(s); accent_bar(s, ACCENT_GOLD)
slide_tag(s, "THE PROBLEM", ACCENT_GOLD)

add_text(s, "The Old Way is Broken", Inches(0.6), Inches(0.3), Inches(10), Inches(0.7),
         size=Pt(36), bold=True, color=WHITE)
add_text(s, "Traditional onboarding wastes time, loses documents, and leaves new hires confused.",
         Inches(0.6), Inches(0.95), Inches(11), Inches(0.4), size=Pt(14), color=LIGHT_GRAY)

divider(s, Inches(1.4))

# Two column headers
add_text(s, "❌  Before OnboardIQ", Inches(0.6), Inches(1.55), Inches(5.5), Inches(0.45),
         size=Pt(16), bold=True, color=RGBColor(0xFF,0x5C,0x5C))
add_text(s, "✅  With OnboardIQ", Inches(6.8), Inches(1.55), Inches(5.5), Inches(0.45),
         size=Pt(16), bold=True, color=ACCENT_GREEN)

# Vertical divider
add_rect(s, Inches(6.55), Inches(1.5), Pt(1.5), Inches(5.5), fill=MID_GRAY)

problems = [
    "HR manually emails every new hire",
    "Documents collected over WhatsApp",
    "No visibility into who completed what",
    "IT provisions accounts days late",
    "Managers forget to greet new hires",
    "No audit trail or compliance record",
]
solutions = [
    "Automated emails triggered by workflow",
    "Secure encrypted S3 upload portal",
    "Real-time HR dashboard with stage tracking",
    "Cognito account created automatically",
    "Auto introduction email on joining date",
    "Every action logged with timestamps",
]

for i, (prob, sol) in enumerate(zip(problems, solutions)):
    y = Inches(2.1) + i * Inches(0.72)
    card(s, Inches(0.6), y, Inches(5.7), Inches(0.58),
         fill=RGBColor(0x1F, 0x10, 0x10), border=RGBColor(0xFF,0x5C,0x5C))
    add_text(s, prob, Inches(0.75), y+Inches(0.1), Inches(5.4), Inches(0.4),
             size=Pt(12.5), color=RGBColor(0xFF,0xAA,0xAA))
    card(s, Inches(6.8), y, Inches(5.7), Inches(0.58),
         fill=RGBColor(0x0F, 0x1F, 0x16), border=ACCENT_GREEN)
    add_text(s, sol, Inches(6.95), y+Inches(0.1), Inches(5.4), Inches(0.4),
             size=Pt(12.5), color=RGBColor(0xAA, 0xFF, 0xCC))


# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 3 — WHAT IT DOES
# ══════════════════════════════════════════════════════════════════════════════
s = prs.slides.add_slide(blank)
bg(s); accent_bar(s, ACCENT_TEAL)
slide_tag(s, "OVERVIEW", ACCENT_TEAL)

add_text(s, "What OnboardIQ Does", Inches(0.6), Inches(0.3), Inches(10), Inches(0.7),
         size=Pt(36), bold=True, color=WHITE)
add_text(s, "Two audiences. One platform. Fully automated.",
         Inches(0.6), Inches(0.95), Inches(10), Inches(0.4), size=Pt(14), color=LIGHT_GRAY)
divider(s, Inches(1.4))

# New Hire column
add_text(s, "👤  New Hire Portal", Inches(0.6), Inches(1.6), Inches(5.8), Inches(0.45),
         size=Pt(18), bold=True, color=ACCENT_TEAL)

steps_hire = [
    ("1", "Fill in your profile", "Name, role, department, joining date"),
    ("2", "Upload 3 documents", "ID proof · Degree cert · Offer letter"),
    ("3", "Sign 5 policies", "Progress bar fills as each is checked"),
    ("4", "Meet your manager", "Optional intro note"),
    ("5", "Done!", "Credentials arrive in your inbox"),
]
for i, (num, title, sub) in enumerate(steps_hire):
    y = Inches(2.15) + i * Inches(0.92)
    add_rect(s, Inches(0.6), y, Inches(0.45), Inches(0.45),
             fill=ACCENT_TEAL)
    add_text(s, num, Inches(0.6), y, Inches(0.45), Inches(0.45),
             size=Pt(14), bold=True, color=BG_DARK, align=PP_ALIGN.CENTER)
    add_text(s, title, Inches(1.15), y, Inches(5.1), Inches(0.28),
             size=Pt(13), bold=True, color=WHITE)
    add_text(s, sub, Inches(1.15), y+Inches(0.27), Inches(5.1), Inches(0.22),
             size=Pt(11), color=LIGHT_GRAY)

# AWS column
add_text(s, "⚙️  AWS Does Automatically", Inches(7.1), Inches(1.6), Inches(5.8), Inches(0.45),
         size=Pt(18), bold=True, color=ACCENT_GREEN)

steps_aws = [
    ("▸", "Employee record created in DynamoDB", ACCENT_GREEN),
    ("▸", "Step Functions workflow starts", ACCENT_GREEN),
    ("▸", "S3 event validates each document upload", ACCENT_GREEN),
    ("▸", "Cognito account provisioned & credentials emailed", ACCENT_GREEN),
    ("▸", "Policy sign-off timestamped in DynamoDB", ACCENT_GREEN),
    ("▸", "Manager introduction emails sent", ACCENT_GREEN),
    ("▸", "Employee status → ACTIVE", ACCENT_GOLD),
    ("▸", "HR dashboard updates in real time", ACCENT_GOLD),
]
for i, (icon, text, clr) in enumerate(steps_aws):
    y = Inches(2.15) + i * Inches(0.6)
    add_text(s, icon, Inches(7.1), y, Inches(0.3), Inches(0.35),
             size=Pt(13), bold=True, color=clr)
    add_text(s, text, Inches(7.45), y, Inches(5.5), Inches(0.35),
             size=Pt(12.5), color=LIGHT_GRAY)

add_rect(s, Inches(6.75), Inches(1.5), Pt(1.5), Inches(5.8), fill=MID_GRAY)


# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 4 — ARCHITECTURE
# ══════════════════════════════════════════════════════════════════════════════
s = prs.slides.add_slide(blank)
bg(s); accent_bar(s, ACCENT_GREEN)
slide_tag(s, "ARCHITECTURE", ACCENT_GREEN)

add_text(s, "System Architecture", Inches(0.6), Inches(0.3), Inches(10), Inches(0.7),
         size=Pt(36), bold=True, color=WHITE)
divider(s, Inches(1.05))

# Layer definitions: (label, x, y, w, h, color, sub)
layers = [
    ("FRONTEND  ·  React + Vite hosted on S3 Static Website",
     Inches(0.5), Inches(1.2), Inches(12.3), Inches(1.05), RGBColor(0x12,0x25,0x2E), ACCENT_TEAL),
    ("API GATEWAY  ·  REST API  ·  CORS enabled",
     Inches(0.5), Inches(2.38), Inches(12.3), Inches(0.55), RGBColor(0x12,0x2A,0x1E), ACCENT_GREEN),
    ("AWS LAMBDA  ·  9 serverless functions  ·  Node.js 20  ·  ARM64",
     Inches(0.5), Inches(3.05), Inches(12.3), Inches(0.55), RGBColor(0x18,0x20,0x10), ACCENT_GOLD),
    ("STEP FUNCTIONS  ·  4-stage orchestration state machine",
     Inches(0.5), Inches(3.72), Inches(12.3), Inches(0.55), RGBColor(0x1A,0x14,0x28), RGBColor(0xA0,0x78,0xFF)),
]
for label, x, y, w, h, fill, border in layers:
    add_rect(s, x, y, w, h, fill=fill, line=border, line_w=Pt(1.5))
    add_text(s, label, x+Inches(0.15), y+Inches(0.1), w-Inches(0.3), h-Inches(0.15),
             size=Pt(13), bold=True, color=border)

# Data layer boxes
data_items = [
    ("DynamoDB\n4 Tables", Inches(0.5),  RGBColor(0x0A,0x1E,0x3A), ACCENT_TEAL),
    ("S3 Bucket\nEncrypted", Inches(3.2), RGBColor(0x1A,0x1A,0x0A), ACCENT_GOLD),
    ("Cognito\nUser Pool", Inches(5.9),  RGBColor(0x1A,0x0A,0x2A), RGBColor(0xC0,0x80,0xFF)),
    ("SES\nEmail", Inches(8.6),          RGBColor(0x0A,0x1E,0x18), ACCENT_GREEN),
    ("SNS\nAlerts", Inches(10.7),        RGBColor(0x20,0x12,0x08), RGBColor(0xFF,0x88,0x44)),
]
for label, x, fill, border in data_items:
    add_rect(s, x, Inches(4.4), Inches(2.4), Inches(0.85),
             fill=fill, line=border, line_w=Pt(1.2))
    add_text(s, label, x+Inches(0.1), Inches(4.42), Inches(2.2), Inches(0.82),
             size=Pt(12), bold=True, color=border, align=PP_ALIGN.CENTER)

add_text(s, "DATA LAYER", Inches(0.5), Inches(4.28), Inches(3), Inches(0.2),
         size=Pt(9), color=MID_GRAY, bold=True)

# Arrows (simple connectors via thin rects)
for y_pos in [Inches(2.25), Inches(2.93), Inches(3.6), Inches(4.27)]:
    add_rect(s, Inches(6.3), y_pos, Inches(0.015), Inches(0.13), fill=MID_GRAY)

# CloudFormation/SAM footnote
add_text(s, "Infrastructure as Code: AWS SAM + CloudFormation  ·  Stack: hrms-onboarding-stack  ·  Region: ap-south-1 (Mumbai)",
         Inches(0.5), Inches(5.45), Inches(12.3), Inches(0.3),
         size=Pt(10), color=MID_GRAY, italic=True, align=PP_ALIGN.CENTER)


# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 5 — AWS SERVICES
# ══════════════════════════════════════════════════════════════════════════════
s = prs.slides.add_slide(blank)
bg(s); accent_bar(s, ACCENT_GOLD)
slide_tag(s, "AWS SERVICES", ACCENT_GOLD)

add_text(s, "AWS Services Used", Inches(0.6), Inches(0.3), Inches(10), Inches(0.7),
         size=Pt(36), bold=True, color=WHITE)
add_text(s, "9 managed services — zero servers to maintain",
         Inches(0.6), Inches(0.95), Inches(10), Inches(0.35), size=Pt(14), color=LIGHT_GRAY)
divider(s, Inches(1.35))

services = [
    ("⚡", "AWS Lambda",         "9 serverless functions, Node.js 20, ARM64, 256MB",     ACCENT_GOLD),
    ("🔀", "Step Functions",     "4-stage state machine: documents → IT → policy → intro",  RGBColor(0xA0,0x78,0xFF)),
    ("🗄️", "DynamoDB",           "4 tables, 3 GSIs, millisecond reads, pay-per-request",  ACCENT_TEAL),
    ("🪣", "S3",                  "Document storage (AES-256 encrypted) + static hosting",  ACCENT_GREEN),
    ("🔐", "Cognito",             "User pool — auto-provisions accounts with temp passwords", RGBColor(0xFF,0x88,0x44)),
    ("📧", "SES",                 "Transactional emails: welcome, reminders, introductions", ACCENT_GREEN),
    ("📢", "SNS",                 "HR team instant alerts when documents are received",      RGBColor(0xFF,0x66,0x66)),
    ("🌐", "API Gateway",        "REST API — routes all frontend requests to Lambda",       ACCENT_TEAL),
    ("🏗️", "SAM + CloudFormation","Entire infra defined as code, deployed with one command", LIGHT_GRAY),
]

cols = [Inches(0.55), Inches(4.6), Inches(8.65)]
for i, (icon, name, desc, clr) in enumerate(services):
    col = i % 3
    row = i // 3
    x = cols[col]
    y = Inches(1.55) + row * Inches(1.72)
    card(s, x, y, Inches(3.8), Inches(1.55), fill=BG_CARD, border=clr)
    add_text(s, icon + "  " + name, x+Inches(0.15), y+Inches(0.1), Inches(3.5), Inches(0.45),
             size=Pt(15), bold=True, color=clr)
    add_text(s, desc, x+Inches(0.15), y+Inches(0.55), Inches(3.5), Inches(0.85),
             size=Pt(11.5), color=LIGHT_GRAY, wrap=True)


# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 6 — ER DIAGRAM
# ══════════════════════════════════════════════════════════════════════════════
s = prs.slides.add_slide(blank)
bg(s); accent_bar(s, ACCENT_TEAL)
slide_tag(s, "DATABASE SCHEMA", ACCENT_TEAL)

add_text(s, "Database Schema — ER Diagram", Inches(0.6), Inches(0.3), Inches(10), Inches(0.7),
         size=Pt(34), bold=True, color=WHITE)
add_text(s, "Amazon DynamoDB · 4 tables · 3 GSIs",
         Inches(0.6), Inches(0.92), Inches(10), Inches(0.35), size=Pt(14), color=LIGHT_GRAY)
divider(s, Inches(1.3))

# Draw 4 entity boxes
entities = {
    "EMPLOYEES": {
        "x": Inches(0.5), "y": Inches(1.5), "w": Inches(3.0), "h": Inches(4.5),
        "color": ACCENT_TEAL,
        "pk": "employee_id  PK",
        "fields": [
            "first_name", "last_name", "email", "phone",
            "department", "role", "employment_type",
            "joining_date", "manager_id  FK",
            "cognito_user_id", "status",
        ]
    },
    "ONBOARDING_WORKFLOWS": {
        "x": Inches(4.2), "y": Inches(1.5), "w": Inches(3.2), "h": Inches(3.2),
        "color": ACCENT_GREEN,
        "pk": "workflow_id  PK",
        "fields": [
            "employee_id  FK+GSI",
            "execution_arn",
            "current_stage",
            "overall_status",
            "reminder_attempt",
            "started_at",
        ]
    },
    "ONBOARDING_STAGES": {
        "x": Inches(4.2), "y": Inches(5.05), "w": Inches(3.2), "h": Inches(2.2),
        "color": ACCENT_GOLD,
        "pk": "stage_id  PK",
        "fields": [
            "workflow_id  FK+GSI",
            "stage_name",
            "status",
            "signed_at",
            "completed_at",
        ]
    },
    "DOCUMENTS": {
        "x": Inches(8.0), "y": Inches(1.5), "w": Inches(3.3), "h": Inches(3.8),
        "color": RGBColor(0xA0,0x78,0xFF),
        "pk": "document_id  PK",
        "fields": [
            "employee_id  FK+GSI",
            "doc_type",
            "status",
            "s3_key",
            "content_type",
            "verified",
            "validation_errors",
            "uploaded_at",
        ]
    },
}

for name, e in entities.items():
    clr = e["color"]
    # Header
    add_rect(s, e["x"], e["y"], e["w"], Inches(0.45), fill=clr)
    add_text(s, name, e["x"]+Inches(0.08), e["y"]+Inches(0.04), e["w"]-Inches(0.1), Inches(0.38),
             size=Pt(11), bold=True, color=BG_DARK)
    # Body
    add_rect(s, e["x"], e["y"]+Inches(0.45), e["w"], e["h"]-Inches(0.45),
             fill=BG_CARD, line=clr, line_w=Pt(1.2))
    # PK row
    add_rect(s, e["x"], e["y"]+Inches(0.45), e["w"], Inches(0.32),
             fill=RGBColor(0x22,0x28,0x38))
    add_text(s, "🔑  " + e["pk"], e["x"]+Inches(0.1), e["y"]+Inches(0.47),
             e["w"]-Inches(0.15), Inches(0.28), size=Pt(10), bold=True, color=ACCENT_GOLD)
    # Fields
    for j, field in enumerate(e["fields"]):
        fy = e["y"] + Inches(0.45) + Inches(0.32) + j*Inches(0.32)
        fc = LIGHT_GRAY if "FK" not in field else ACCENT_TEAL
        add_text(s, "  " + field, e["x"]+Inches(0.05), fy, e["w"]-Inches(0.1), Inches(0.3),
                 size=Pt(10), color=fc)

# Relationship arrows (text labels)
rels = [
    (Inches(3.52), Inches(2.9),  "1 → 1"),
    (Inches(7.35), Inches(2.9),  "1 → many"),
    (Inches(4.95), Inches(4.73), "1 → 4 stages"),
]
for rx, ry, label in rels:
    add_rect(s, rx, ry, Inches(0.65), Inches(0.25), fill=DIM, line=MID_GRAY, line_w=Pt(0.5))
    add_text(s, label, rx, ry, Inches(0.65), Inches(0.25),
             size=Pt(8), bold=True, color=ACCENT_GREEN, align=PP_ALIGN.CENTER)

# Self-join note
add_text(s, "↺ manager_id → employee_id (self-join)", Inches(0.55), Inches(6.1),
         Inches(3), Inches(0.3), size=Pt(10), color=LIGHT_GRAY, italic=True)


# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 7 — STEP FUNCTIONS FLOW
# ══════════════════════════════════════════════════════════════════════════════
s = prs.slides.add_slide(blank)
bg(s); accent_bar(s, RGBColor(0xA0,0x78,0xFF))
slide_tag(s, "WORKFLOW ENGINE", RGBColor(0xA0,0x78,0xFF))

add_text(s, "The Onboarding Workflow Engine", Inches(0.6), Inches(0.3), Inches(11), Inches(0.7),
         size=Pt(34), bold=True, color=WHITE)
add_text(s, "AWS Step Functions state machine — fully event-driven, auditable, serverless",
         Inches(0.6), Inches(0.92), Inches(11), Inches(0.35), size=Pt(13), color=LIGHT_GRAY)
divider(s, Inches(1.3))

# 4 stage nodes horizontally
stages_info = [
    ("📄", "Stage 1", "Document\nCollection", "Validates 3 docs\nin S3 + DynamoDB", ACCENT_TEAL),
    ("💻", "Stage 2", "IT\nProvisioning", "Creates Cognito\naccount + sends\ncredentials via SES", ACCENT_GREEN),
    ("✍️", "Stage 3", "Policy\nSign-off", "Checks signed_at\ntimestamp in DB\nfor 5 policies", ACCENT_GOLD),
    ("🤝", "Stage 4", "Manager\nIntro", "Sends intro emails\nto hire + manager\nUpdates status→ACTIVE", RGBColor(0xA0,0x78,0xFF)),
]

node_x = [Inches(0.55), Inches(3.55), Inches(6.55), Inches(9.55)]
for i, (icon, stage, title, desc, clr) in enumerate(stages_info):
    x = node_x[i]
    # Stage card
    card(s, x, Inches(1.55), Inches(2.7), Inches(3.6), fill=BG_CARD, border=clr)
    # Icon circle
    circ = s.shapes.add_shape(9, x+Inches(1.0), Inches(1.7), Inches(0.7), Inches(0.7))
    circ.fill.solid(); circ.fill.fore_color.rgb = clr
    circ.line.fill.background()
    add_text(s, icon, x+Inches(1.0), Inches(1.7), Inches(0.7), Inches(0.7),
             size=Pt(18), align=PP_ALIGN.CENTER)
    add_text(s, stage, x+Inches(0.1), Inches(2.5), Inches(2.5), Inches(0.3),
             size=Pt(10), color=clr, bold=True, align=PP_ALIGN.CENTER)
    add_text(s, title, x+Inches(0.1), Inches(2.78), Inches(2.5), Inches(0.55),
             size=Pt(16), bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    add_text(s, desc, x+Inches(0.1), Inches(3.38), Inches(2.5), Inches(1.5),
             size=Pt(11.5), color=LIGHT_GRAY, align=PP_ALIGN.CENTER)
    # Check mark at bottom
    add_rect(s, x+Inches(0.85), Inches(4.9), Inches(1.0), Inches(0.28), fill=clr)
    add_text(s, "✓ COMPLETE", x+Inches(0.85), Inches(4.9), Inches(1.0), Inches(0.28),
             size=Pt(9), bold=True, color=BG_DARK, align=PP_ALIGN.CENTER)

# Arrows between stages
for ax in [Inches(3.28), Inches(6.28), Inches(9.28)]:
    add_text(s, "→", ax, Inches(3.1), Inches(0.3), Inches(0.4),
             size=Pt(22), bold=True, color=MID_GRAY, align=PP_ALIGN.CENTER)

# Wait state note
add_text(s, "⏳  Wait states between stages check DynamoDB every 30s (demo) / 24h (production) before advancing",
         Inches(0.55), Inches(5.35), Inches(12.3), Inches(0.32),
         size=Pt(11.5), color=LIGHT_GRAY, italic=True, align=PP_ALIGN.CENTER)

# Bottom strip — why Step Functions
add_rect(s, Inches(0.5), Inches(5.75), Inches(12.3), Inches(0.6), fill=DIM)
reasons = ["Event-driven", "Auto-retry on failure", "Full execution history", "No servers polling", "Visual debugger"]
rx = Inches(0.8)
for r in reasons:
    add_text(s, "✦ " + r, rx, Inches(5.82), Inches(2.2), Inches(0.4),
             size=Pt(11), color=ACCENT_GREEN, bold=True)
    rx += Inches(2.35)


# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 8 — LIVE EXECUTION PROOF
# ══════════════════════════════════════════════════════════════════════════════
s = prs.slides.add_slide(blank)
bg(s); accent_bar(s, ACCENT_GREEN)
slide_tag(s, "LIVE EXECUTION", ACCENT_GREEN)

add_text(s, "Live Execution Proof", Inches(0.6), Inches(0.3), Inches(10), Inches(0.7),
         size=Pt(36), bold=True, color=WHITE)

# Execution meta pill bar
add_rect(s, Inches(0.5), Inches(1.0), Inches(12.3), Inches(0.5), fill=DIM)
meta_items = [
    ("Employee:", "Arjun Sharma · EMP-4FEA92A3"),
    ("Status:", "✅  SUCCEEDED"),
    ("Duration:", "66 seconds"),
    ("Date:", "2026-04-08 · 15:11 IST"),
]
mx = Inches(0.7)
for label, val in meta_items:
    add_text(s, label, mx, Inches(1.05), Inches(1.0), Inches(0.35),
             size=Pt(10), color=LIGHT_GRAY, bold=True)
    add_text(s, val, mx+Inches(0.85), Inches(1.05), Inches(2.0), Inches(0.35),
             size=Pt(10), color=ACCENT_GREEN, bold=True)
    mx += Inches(3.0)

divider(s, Inches(1.55))

# Timeline
events = [
    ("15:11:53", "→", "DocumentCollection",    "Stage 1 starts — checks DynamoDB for uploads",     ACCENT_TEAL,  False),
    ("15:11:54", "⏳", "WaitForDocuments",       "30-second wait — documents uploaded during pause",  MID_GRAY,     True),
    ("15:12:25", "✓", "DocumentCollection",    "All 3 documents received — stage COMPLETE",          ACCENT_TEAL,  False),
    ("15:12:25", "→", "ITProvisioning",        "Stage 2 — creates Cognito user, sends credentials",  ACCENT_GREEN, False),
    ("15:12:27", "✓", "ITProvisioning",        "Cognito account created — stage COMPLETE",            ACCENT_GREEN, False),
    ("15:12:27", "→", "PolicySignoff",         "Stage 3 — checks policy signed_at timestamp",        ACCENT_GOLD,  False),
    ("15:12:27", "⏳", "WaitForPolicySignoff",  "30-second wait",                                     MID_GRAY,     True),
    ("15:12:58", "✓", "PolicySignoff",         "All 5 policies signed — stage COMPLETE",              ACCENT_GOLD,  False),
    ("15:12:58", "→", "ManagerIntro",          "Stage 4 — intro emails to employee + manager",       RGBColor(0xA0,0x78,0xFF), False),
    ("15:12:59", "✓", "OnboardingComplete",    "🎉  EXECUTION SUCCEEDED — employee status → ACTIVE",  ACCENT_GREEN, False),
]

for i, (ts, icon, state, desc, clr, dim) in enumerate(events):
    y = Inches(1.7) + i * Inches(0.51)
    # Time
    add_text(s, ts, Inches(0.55), y, Inches(0.9), Inches(0.38),
             size=Pt(10), color=MID_GRAY if dim else LIGHT_GRAY)
    # Icon
    add_text(s, icon, Inches(1.5), y, Inches(0.35), Inches(0.38),
             size=Pt(13), bold=True, color=clr, align=PP_ALIGN.CENTER)
    # State name
    add_text(s, state, Inches(1.9), y, Inches(2.8), Inches(0.38),
             size=Pt(11), bold=True, color=clr)
    # Description
    add_text(s, desc, Inches(4.75), y, Inches(8.0), Inches(0.38),
             size=Pt(11), color=MID_GRAY if dim else LIGHT_GRAY)
    # Thin timeline line
    if i < len(events)-1:
        add_rect(s, Inches(1.62), y+Inches(0.38), Pt(1.5), Inches(0.13),
                 fill=DIM)

# Duration summary bar
add_rect(s, Inches(0.5), Inches(6.9), Inches(12.3), Inches(0.38), fill=DIM)
stage_times = [
    ("Doc Collection", "~32s", ACCENT_TEAL),
    ("IT Provisioning", "~1.7s", ACCENT_GREEN),
    ("Policy Sign-off", "~30.3s", ACCENT_GOLD),
    ("Manager Intro", "~2.1s", RGBColor(0xA0,0x78,0xFF)),
    ("TOTAL", "66s", WHITE),
]
bx = Inches(0.75)
for label, dur, clr in stage_times:
    add_text(s, label + ": ", bx, Inches(6.95), Inches(1.5), Inches(0.28),
             size=Pt(10), color=LIGHT_GRAY)
    add_text(s, dur, bx+Inches(1.35), Inches(6.95), Inches(0.6), Inches(0.28),
             size=Pt(10), bold=True, color=clr)
    bx += Inches(2.4)


# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 9 — DEMO WALKTHROUGH (NEW HIRE)
# ══════════════════════════════════════════════════════════════════════════════
s = prs.slides.add_slide(blank)
bg(s); accent_bar(s, ACCENT_TEAL)
slide_tag(s, "DEMO · PART A", ACCENT_TEAL)

add_text(s, "Demo Walkthrough", Inches(0.6), Inches(0.25), Inches(8), Inches(0.65),
         size=Pt(36), bold=True, color=WHITE)
add_text(s, "Part A — New Hire Experience", Inches(0.6), Inches(0.87), Inches(8), Inches(0.4),
         size=Pt(18), color=ACCENT_TEAL)
divider(s, Inches(1.32))

add_text(s, "🌐  App URL:", Inches(0.6), Inches(1.42), Inches(2.2), Inches(0.35),
         size=Pt(12), color=LIGHT_GRAY, bold=True)
add_text(s, "hrms-onboarding-frontend-dev.s3-website.ap-south-1.amazonaws.com",
         Inches(2.85), Inches(1.42), Inches(9.5), Inches(0.35),
         size=Pt(12), color=ACCENT_TEAL)

steps_demo = [
    ("A1", "Open the App",
     "Go to the URL above → splash animation plays → landing page shows 2 cards.",
     ACCENT_TEAL),
    ("A2", "Enter New Hire Portal",
     "Click 'New Hire Portal' → another splash → Step 1 of 4 appears.",
     ACCENT_TEAL),
    ("A3", "Fill in Profile",
     "First: Priya · Last: Menon · Email: priya.menon@example.com · Dept: Engineering · Role: Frontend Engineer · Click Continue →",
     ACCENT_GREEN),
    ("A4", "Upload Documents",
     "Click each of the 3 cards (ID Proof, Degree, Offer Letter) → choose any PDF → green badge appears. Click Continue →",
     ACCENT_GOLD),
    ("A5", "Sign Policies",
     "Tick all 5 checkboxes → progress bar fills to 100% → Click Continue →",
     ACCENT_GOLD),
    ("A6", "Manager Intro",
     "Optionally type a note → Click 'Submit & Complete ✓'",
     RGBColor(0xA0,0x78,0xFF)),
    ("A7", "Completion Screen",
     "Shows all stages. Click '← Back to Home' to return.",
     ACCENT_GREEN),
]

for i, (tag, title, detail, clr) in enumerate(steps_demo):
    y = Inches(1.9) + i * Inches(0.73)
    add_rect(s, Inches(0.55), y, Inches(0.42), Inches(0.42), fill=clr)
    add_text(s, tag, Inches(0.55), y, Inches(0.42), Inches(0.42),
             size=Pt(10), bold=True, color=BG_DARK, align=PP_ALIGN.CENTER)
    add_text(s, title, Inches(1.1), y, Inches(3.1), Inches(0.28),
             size=Pt(12), bold=True, color=clr)
    add_text(s, detail, Inches(1.1), y+Inches(0.27), Inches(11.5), Inches(0.32),
             size=Pt(10.5), color=LIGHT_GRAY)


# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 10 — DEMO WALKTHROUGH (HR DASHBOARD)
# ══════════════════════════════════════════════════════════════════════════════
s = prs.slides.add_slide(blank)
bg(s); accent_bar(s, ACCENT_GREEN)
slide_tag(s, "DEMO · PART B", ACCENT_GREEN)

add_text(s, "Demo Walkthrough", Inches(0.6), Inches(0.25), Inches(8), Inches(0.65),
         size=Pt(36), bold=True, color=WHITE)
add_text(s, "Part B — HR Admin Dashboard", Inches(0.6), Inches(0.87), Inches(8), Inches(0.4),
         size=Pt(18), color=ACCENT_GREEN)
divider(s, Inches(1.32))

add_text(s, "🔑  HR PIN:", Inches(0.6), Inches(1.42), Inches(1.5), Inches(0.35),
         size=Pt(12), color=LIGHT_GRAY, bold=True)
add_rect(s, Inches(2.15), Inches(1.38), Inches(0.75), Inches(0.4), fill=ACCENT_GREEN)
add_text(s, "1234", Inches(2.15), Inches(1.38), Inches(0.75), Inches(0.4),
         size=Pt(16), bold=True, color=BG_DARK, align=PP_ALIGN.CENTER)
add_text(s, "← auto-unlocks on 4th digit, no Enter needed",
         Inches(3.0), Inches(1.42), Inches(6), Inches(0.35), size=Pt(12), color=LIGHT_GRAY, italic=True)

hr_steps = [
    ("B1", "Open HR Dashboard",
     "From landing page click 'HR Admin Dashboard' → splash plays → PIN gate appears.",
     ACCENT_GREEN),
    ("B2", "Enter PIN",
     "Type 1-2-3-4. On the 4th digit the screen fades out automatically. Dashboard fades in.",
     ACCENT_GREEN),
    ("B3", "Read the Stats Bar",
     "5 metric cards: Total Employees · In Progress · Completed · Docs Pending · Avg Completion %",
     ACCENT_TEAL),
    ("B4", "Find Your New Hire",
     "Type 'Priya' in the search bar → table filters live to show Priya Menon's row.",
     ACCENT_TEAL),
    ("B5", "Expand Detail Panel",
     "Click Priya's row → detail panel slides open showing all 4 stages with timestamps + 3 document badges.",
     ACCENT_GOLD),
    ("B6", "Refresh Dashboard",
     "Click the Refresh button (top right) → spinning icon → data reloads from live API.",
     ACCENT_GOLD),
    ("B7", "Filter by Status",
     "Use filter pills: All · In Progress · Completed · Pending — each filters the table.",
     RGBColor(0xA0,0x78,0xFF)),
]

for i, (tag, title, detail, clr) in enumerate(hr_steps):
    y = Inches(1.9) + i * Inches(0.73)
    add_rect(s, Inches(0.55), y, Inches(0.42), Inches(0.42), fill=clr)
    add_text(s, tag, Inches(0.55), y, Inches(0.42), Inches(0.42),
             size=Pt(10), bold=True, color=BG_DARK, align=PP_ALIGN.CENTER)
    add_text(s, title, Inches(1.1), y, Inches(3.1), Inches(0.28),
             size=Pt(12), bold=True, color=clr)
    add_text(s, detail, Inches(1.1), y+Inches(0.27), Inches(11.5), Inches(0.32),
             size=Pt(10.5), color=LIGHT_GRAY)


# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 11 — DEMO WALKTHROUGH (AWS CONSOLE)
# ══════════════════════════════════════════════════════════════════════════════
s = prs.slides.add_slide(blank)
bg(s); accent_bar(s, ACCENT_GOLD)
slide_tag(s, "DEMO · PART C", ACCENT_GOLD)

add_text(s, "Demo Walkthrough", Inches(0.6), Inches(0.25), Inches(8), Inches(0.65),
         size=Pt(36), bold=True, color=WHITE)
add_text(s, "Part C — AWS Console Evidence", Inches(0.6), Inches(0.87), Inches(8), Inches(0.4),
         size=Pt(18), color=ACCENT_GOLD)
divider(s, Inches(1.32))

console_steps = [
    ("C1", "Step Functions Console",
     "Open AWS Console → Step Functions → hrms-onboarding-workflow → Executions tab\n"
     "→ Click latest SUCCEEDED execution → Graph view (all states green) → Events tab (full timeline)",
     ACCENT_GOLD),
    ("C2", "DynamoDB — Employees Table",
     "DynamoDB → hrms-employees → Explore table items\n"
     "→ Find your employee: status = ACTIVE, cognito_user_id populated, all fields present",
     ACCENT_TEAL),
    ("C3", "DynamoDB — Stages Table",
     "DynamoDB → hrms-onboarding-stages → Filter by workflow_id\n"
     "→ All 4 rows show status = COMPLETE with completed_at timestamps",
     ACCENT_TEAL),
    ("C4", "S3 Bucket — Uploaded Documents",
     "S3 → hrms-onboarding-documents-736786104206-dev → documents/{employee_id}/\n"
     "→ 3 files visible: ID_PROOF, DEGREE_CERTIFICATE, OFFER_LETTER",
     ACCENT_GREEN),
    ("C5", "S3 — Encryption Proof",
     "S3 bucket → Properties tab → Default encryption → AES-256 server-side encryption enabled",
     ACCENT_GREEN),
]

for i, (tag, title, detail, clr) in enumerate(console_steps):
    y = Inches(1.55) + i * Inches(1.12)
    card(s, Inches(0.55), y, Inches(12.2), Inches(1.0), fill=BG_CARD, border=clr)
    add_rect(s, Inches(0.55), y, Inches(0.5), Inches(1.0), fill=clr)
    add_text(s, tag, Inches(0.55), y+Inches(0.28), Inches(0.5), Inches(0.42),
             size=Pt(10), bold=True, color=BG_DARK, align=PP_ALIGN.CENTER)
    add_text(s, title, Inches(1.15), y+Inches(0.05), Inches(11.3), Inches(0.35),
             size=Pt(13), bold=True, color=clr)
    add_text(s, detail, Inches(1.15), y+Inches(0.38), Inches(11.3), Inches(0.58),
             size=Pt(11), color=LIGHT_GRAY, wrap=True)


# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 12 — COST ESTIMATE
# ══════════════════════════════════════════════════════════════════════════════
s = prs.slides.add_slide(blank)
bg(s); accent_bar(s, ACCENT_GREEN)
slide_tag(s, "COST ESTIMATE", ACCENT_GREEN)

add_text(s, "Cost Estimate — 50 Hires/Month", Inches(0.6), Inches(0.3), Inches(10), Inches(0.7),
         size=Pt(34), bold=True, color=WHITE)
add_text(s, "AWS ap-south-1 (Mumbai) · All major services within free tier at this scale",
         Inches(0.6), Inches(0.92), Inches(11), Inches(0.35), size=Pt(13), color=LIGHT_GRAY)
divider(s, Inches(1.32))

costs = [
    ("⚡ Lambda",        "750 invocations/mo",       "$0.00", "Covered by 1M free tier",   ACCENT_GOLD),
    ("🔀 Step Functions","1,650 transitions/mo",      "$0.00", "First 4,000 are free",       RGBColor(0xA0,0x78,0xFF)),
    ("🗄️ DynamoDB",      "1,500 writes · 5,000 reads","$0.00", "25GB always free",           ACCENT_TEAL),
    ("🪣 S3",            "75MB storage · 150 PUTs",   "$0.004","$0.023/GB storage",          ACCENT_GREEN),
    ("📧 SES",           "400 emails/mo",             "$0.04", "$0.10 per 1,000 emails",     ACCENT_GREEN),
    ("🔐 Cognito",       "50 MAUs",                   "$0.00", "First 50,000 MAU free",      RGBColor(0xFF,0x88,0x44)),
    ("📢 SNS",           "50 notifications/mo",       "$0.00", "First 1M free",              RGBColor(0xFF,0x66,0x66)),
    ("🌐 API Gateway",   "~200 requests/mo",          "$0.001","$3.50 per million requests", ACCENT_TEAL),
]

cols_c = [Inches(0.55), Inches(4.1), Inches(7.4), Inches(9.4)]
hdrs = ["Service", "Usage", "Cost/mo", "Pricing Basis"]
for j, hdr in enumerate(hdrs):
    add_text(s, hdr, cols_c[j], Inches(1.45), Inches(2.5), Inches(0.3),
             size=Pt(11), bold=True, color=LIGHT_GRAY)

add_rect(s, Inches(0.5), Inches(1.78), Inches(12.3), Pt(1), fill=MID_GRAY)

for i, (name, usage, cost, basis, clr) in enumerate(costs):
    y = Inches(1.85) + i * Inches(0.53)
    if i % 2 == 0:
        add_rect(s, Inches(0.5), y, Inches(12.3), Inches(0.53), fill=RGBColor(0x14,0x18,0x22))
    add_text(s, name,  cols_c[0], y+Inches(0.08), Inches(3.3), Inches(0.38),
             size=Pt(12), color=clr, bold=True)
    add_text(s, usage, cols_c[1], y+Inches(0.08), Inches(3.0), Inches(0.38),
             size=Pt(11), color=LIGHT_GRAY)
    add_text(s, cost,  cols_c[2], y+Inches(0.08), Inches(1.7), Inches(0.38),
             size=Pt(12), bold=True, color=ACCENT_GREEN)
    add_text(s, basis, cols_c[3], y+Inches(0.08), Inches(3.0), Inches(0.38),
             size=Pt(10), color=MID_GRAY)

# Total bar
add_rect(s, Inches(0.5), Inches(6.3), Inches(12.3), Inches(0.5), fill=DIM, line=ACCENT_GREEN, line_w=Pt(1.2))
add_text(s, "TOTAL MONTHLY COST:", Inches(0.7), Inches(6.35), Inches(5), Inches(0.38),
         size=Pt(14), bold=True, color=WHITE)
add_text(s, "~$0.05 / month", Inches(5.8), Inches(6.35), Inches(4), Inches(0.38),
         size=Pt(18), bold=True, color=ACCENT_GREEN)
add_text(s, "≈ ₹4 per month", Inches(10.0), Inches(6.38), Inches(2.5), Inches(0.3),
         size=Pt(11), color=LIGHT_GRAY, italic=True)

add_text(s, "Scales to 5,000 hires/month for just ~$5.00",
         Inches(0.7), Inches(6.9), Inches(12), Inches(0.3),
         size=Pt(11), color=MID_GRAY, italic=True, align=PP_ALIGN.CENTER)


# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 13 — THANK YOU / CLOSING
# ══════════════════════════════════════════════════════════════════════════════
s = prs.slides.add_slide(blank)
bg(s)

add_rect(s, 0, 0, W, Inches(0.006), fill=ACCENT_GREEN)
add_rect(s, 0, H-Inches(0.006), W, Inches(0.006), fill=ACCENT_TEAL)

circ = s.shapes.add_shape(9, Inches(8.0), Inches(-1.5), Inches(7), Inches(7))
circ.fill.solid(); circ.fill.fore_color.rgb = RGBColor(0x12,0x1A,0x28)
circ.line.fill.background()

add_text(s, "OnboardIQ", Inches(0.8), Inches(1.8), Inches(9), Inches(1.5),
         size=Pt(72), bold=True, color=WHITE)
add_text(s, "From offer letter to Day 1 login.", Inches(0.85), Inches(3.25),
         Inches(9), Inches(0.6), size=Pt(26), color=ACCENT_TEAL)
add_text(s, "Fully automated. Fully serverless.", Inches(0.85), Inches(3.82),
         Inches(9), Inches(0.6), size=Pt(26), color=ACCENT_GREEN)

divider(s, Inches(4.6))

# Links
links = [
    ("🌐 Live App", "hrms-onboarding-frontend-dev.s3-website.ap-south-1.amazonaws.com"),
    ("🔑 HR PIN", "1234"),
    ("☁️ Region", "ap-south-1 · Mumbai"),
    ("📦 Stack", "hrms-onboarding-stack"),
]
lx = Inches(0.85)
for label, val in links:
    add_text(s, label, lx, Inches(4.8), Inches(2.5), Inches(0.3),
             size=Pt(11), color=MID_GRAY, bold=True)
    add_text(s, val, lx, Inches(5.08), Inches(2.5), Inches(0.3),
             size=Pt(11), color=ACCENT_GREEN)
    lx += Inches(3.1)

add_text(s, "Built with  AWS Lambda · Step Functions · DynamoDB · S3 · Cognito · SES · SNS · API Gateway · React",
         Inches(0.85), Inches(5.65), Inches(11.5), Inches(0.3),
         size=Pt(11), color=MID_GRAY, italic=True, align=PP_ALIGN.CENTER)

add_text(s, "Thank You", Inches(0.85), Inches(6.1), Inches(11.5), Inches(0.85),
         size=Pt(42), bold=True, color=ACCENT_GREEN, align=PP_ALIGN.CENTER)


# ── Save ──────────────────────────────────────────────────────────────────────
out = "/Users/oggy/F13/project 4/deliverables/OnboardIQ-Presentation.pptx"
prs.save(out)
print("Saved:", out)
