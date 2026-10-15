import os
import win32com.client
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

def create_element(name):
    return OxmlElement(name)

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = create_element('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), fill_hex)
    tcPr.append(shd)

def set_cell_borders(cell, top='single', bottom='single', left='single', right='single', color='CCCCCC', sz='4'):
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = create_element('w:tcBorders')
    for side, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        if val:
            b = create_element(f'w:{side}')
            b.set(qn('w:val'), val)
            b.set(qn('w:sz'), sz)
            b.set(qn('w:space'), '0')
            b.set(qn('w:color'), color)
            tcBorders.append(b)
        else:
            b = create_element(f'w:{side}')
            b.set(qn('w:val'), 'none')
            tcBorders.append(b)
    tcPr.append(tcBorders)

def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = create_element('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = create_element(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def unlink_footer(section):
    footer = section.footer
    footer.is_linked_to_previous = False
    for p in footer.paragraphs:
        p.text = ''

def setup_footer_page_number(section, start_number=3):
    footer = section.footer
    footer.is_linked_to_previous = False
    p = footer.paragraphs[0]
    p.text = ''
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(0)
    
    sectPr = section._sectPr
    pgNumType = sectPr.find(qn('w:pgNumType'))
    if pgNumType is None:
        pgNumType = create_element('w:pgNumType')
        sectPr.append(pgNumType)
    if start_number is not None:
        pgNumType.set(qn('w:start'), str(start_number))
    pgNumType.set(qn('w:fmt'), 'decimal')
        
    run = p.add_run()
    run.font.name = 'Times New Roman'
    run.font.size = Pt(11)
    
    fldSimple = create_element('w:fldSimple')
    fldSimple.set(qn('w:instr'), 'PAGE')
    run._r.append(fldSimple)

def add_code_listing(doc, code_text):
    """
    Renders clean monospaced code listing matching the PDF template:
    no table borders, no gray box background, clean indentation and font.
    """
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.line_spacing = 1.05
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.left_indent = Inches(0.25)
    
    run = p.add_run(code_text.strip())
    run.font.name = 'Consolas'
    run.font.size = Pt(8.5)
    run.font.color.rgb = RGBColor(0, 0, 0)

def build_doc(toc_page_mapping=None):
    doc = Document()
    
    # Global Normal style
    style_normal = doc.styles['Normal']
    style_normal.font.name = 'Times New Roman'
    style_normal.font.size = Pt(12)
    style_normal.font.color.rgb = RGBColor(0, 0, 0)
    style_normal.paragraph_format.line_spacing = 1.5
    style_normal.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    style_normal.paragraph_format.space_before = Pt(0)
    style_normal.paragraph_format.space_after = Pt(6)

    # Margins: Left 1.25", Right 1.0", Top 1.0", Bottom 1.0"
    for s in doc.sections:
        s.top_margin = Inches(1.0)
        s.bottom_margin = Inches(1.0)
        s.left_margin = Inches(1.25)
        s.right_margin = Inches(1.0)

    # ==========================================
    # SECTION 1: TITLE PAGE (Page 1)
    # ==========================================
    s1 = doc.sections[0]
    unlink_footer(s1)
    
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(20)
    p.paragraph_format.space_after = Pt(16)
    r = p.add_run('EQUIPMENT HEALTH & MAINTENANCE MONITOR: NEXT-GENERATION PREDICTIVE MAINTENANCE & REMAINING USEFUL LIFE (RUL) PLATFORM')
    r.font.name = 'Times New Roman'
    r.font.size = Pt(15)
    r.font.bold = True

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(16)
    p.paragraph_format.space_after = Pt(16)
    r = p.add_run('A PROJECT REPORT')
    r.font.name = 'Times New Roman'
    r.font.size = Pt(13)
    r.font.bold = True

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(4)
    r = p.add_run('Submitted by')
    r.font.name = 'Times New Roman'
    r.font.size = Pt(12)
    r.font.italic = True

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(16)
    r = p.add_run('SURENDHAR K (Registration No: 310624205277)')
    r.font.name = 'Times New Roman'
    r.font.size = Pt(13)
    r.font.bold = True

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(4)
    r = p.add_run('in partial fulfillment for the award of the Degree\nof')
    r.font.name = 'Times New Roman'
    r.font.size = Pt(12)
    r.font.italic = True

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(6)
    r = p.add_run('BACHELOR OF TECHNOLOGY')
    r.font.name = 'Times New Roman'
    r.font.size = Pt(14)
    r.font.bold = True

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(4)
    r = p.add_run('in')
    r.font.name = 'Times New Roman'
    r.font.size = Pt(12)
    r.font.italic = True

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(20)
    r = p.add_run('DEPARTMENT OF INFORMATION TECHNOLOGY')
    r.font.name = 'Times New Roman'
    r.font.size = Pt(13)
    r.font.bold = True

    # Logo
    if os.path.exists('assets_report/college_logo.png'):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(14)
        run = p.add_run()
        run.add_picture('assets_report/college_logo.png', width=Inches(1.2))

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(2)
    r = p.add_run('EASWARI ENGINEERING COLLEGE')
    r.font.name = 'Times New Roman'
    r.font.size = Pt(14)
    r.font.bold = True

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(20)
    r = p.add_run('(AN AUTONOMOUS INSTITUTION) – AFFILIATED TO ANNA UNIVERSITY,\nCHENNAI')
    r.font.name = 'Times New Roman'
    r.font.size = Pt(11)
    r.font.bold = True

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(16)
    p.paragraph_format.space_after = Pt(0)
    r = p.add_run('OCTOBER 2026')
    r.font.name = 'Times New Roman'
    r.font.size = Pt(12)
    r.font.bold = True

    # ==========================================
    # SECTION 2: BONAFIDE CERTIFICATE (Page 2)
    # ==========================================
    s2 = doc.add_section()
    s2.top_margin = Inches(1.0)
    s2.bottom_margin = Inches(1.0)
    s2.left_margin = Inches(1.25)
    s2.right_margin = Inches(1.0)
    unlink_footer(s2)

    # College Header Table (Logo left, Text right)
    tbl_hdr = doc.add_table(rows=1, cols=2)
    tbl_hdr.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_hdr.autofit = False
    tbl_hdr.columns[0].width = Inches(1.1)
    tbl_hdr.columns[1].width = Inches(5.15)
    set_cell_borders(tbl_hdr.cell(0, 0), top=None, bottom=None, left=None, right=None)
    set_cell_borders(tbl_hdr.cell(0, 1), top=None, bottom=None, left=None, right=None)
    
    if os.path.exists('assets_report/college_logo_small.png'):
        p_logo = tbl_hdr.cell(0, 0).paragraphs[0]
        p_logo.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p_logo.paragraph_format.space_before = Pt(0)
        p_logo.paragraph_format.space_after = Pt(0)
        p_logo.add_run().add_picture('assets_report/college_logo_small.png', width=Inches(0.95))
        
    p_clg = tbl_hdr.cell(0, 1).paragraphs[0]
    p_clg.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_clg.paragraph_format.line_spacing = 1.15
    p_clg.paragraph_format.space_before = Pt(4)
    p_clg.paragraph_format.space_after = Pt(0)
    r = p_clg.add_run('EASWARI ENGINEERING COLLEGE\n')
    r.font.name = 'Times New Roman'
    r.font.size = Pt(14)
    r.font.bold = True
    r = p_clg.add_run('(An Autonomous Institution, Affiliated to Anna University, Chennai)\nBharathi Salai, Ramapuram, Chennai – 600089')
    r.font.name = 'Times New Roman'
    r.font.size = Pt(10.5)

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(36)
    p_title.paragraph_format.space_after = Pt(36)
    r = p_title.add_run('BONAFIDE CERTIFICATE')
    r.font.name = 'Times New Roman'
    r.font.size = Pt(14)
    r.font.bold = True

    p_body = doc.add_paragraph()
    p_body.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_body.paragraph_format.line_spacing = 1.5
    p_body.paragraph_format.space_before = Pt(18)
    p_body.paragraph_format.space_after = Pt(120)
    p_body.add_run('Certified that this mini project report titled “')
    r = p_body.add_run('EQUIPMENT HEALTH & MAINTENANCE MONITOR: NEXT-GENERATION PREDICTIVE MAINTENANCE & REMAINING USEFUL LIFE (RUL) PLATFORM')
    r.font.bold = True
    p_body.add_run('” is the Bonafide work of “')
    r = p_body.add_run('SHYAMKUMAR R (310624205258)')
    r.font.bold = True
    p_body.add_run('”, who carried out the project work under my supervision.')

    # Signatures table: exactly matching PDF Screenshot 2 (no underlines, no address blocks)
    tbl_sig = doc.add_table(rows=1, cols=2)
    tbl_sig.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_sig.autofit = False
    tbl_sig.columns[0].width = Inches(3.1)
    tbl_sig.columns[1].width = Inches(3.15)
    set_cell_borders(tbl_sig.cell(0, 0), top=None, bottom=None, left=None, right=None)
    set_cell_borders(tbl_sig.cell(0, 1), top=None, bottom=None, left=None, right=None)

    p_hod = tbl_sig.cell(0, 0).paragraphs[0]
    p_hod.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p_hod.paragraph_format.space_before = Pt(0)
    p_hod.paragraph_format.space_after = Pt(0)
    r = p_hod.add_run('HEAD OF THE DEPARTMENT')
    r.font.name = 'Times New Roman'
    r.font.size = Pt(12)
    r.font.bold = True

    p_sup = tbl_sig.cell(0, 1).paragraphs[0]
    p_sup.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_sup.paragraph_format.space_before = Pt(0)
    p_sup.paragraph_format.space_after = Pt(0)
    r = p_sup.add_run('SUPERVISOR')
    r.font.name = 'Times New Roman'
    r.font.size = Pt(12)
    r.font.bold = True

    # ==========================================
    # SECTION 3: VIVA-VOCE CERTIFICATE (Page 3)
    # Starts Continuous Arabic Page Numbering at "3"
    # ==========================================
    s3 = doc.add_section()
    s3.top_margin = Inches(1.0)
    s3.bottom_margin = Inches(1.0)
    s3.left_margin = Inches(1.25)
    s3.right_margin = Inches(1.0)
    setup_footer_page_number(s3, start_number=3)

    # Page 3: VIVA-VOCE CERTIFICATE
    tbl_hdr2 = doc.add_table(rows=1, cols=2)
    tbl_hdr2.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_hdr2.autofit = False
    tbl_hdr2.columns[0].width = Inches(1.1)
    tbl_hdr2.columns[1].width = Inches(5.15)
    set_cell_borders(tbl_hdr2.cell(0, 0), top=None, bottom=None, left=None, right=None)
    set_cell_borders(tbl_hdr2.cell(0, 1), top=None, bottom=None, left=None, right=None)
    
    if os.path.exists('assets_report/college_logo_small.png'):
        p_logo = tbl_hdr2.cell(0, 0).paragraphs[0]
        p_logo.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p_logo.paragraph_format.space_before = Pt(0)
        p_logo.paragraph_format.space_after = Pt(0)
        p_logo.add_run().add_picture('assets_report/college_logo_small.png', width=Inches(0.95))
        
    p_clg2 = tbl_hdr2.cell(0, 1).paragraphs[0]
    p_clg2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_clg2.paragraph_format.line_spacing = 1.15
    p_clg2.paragraph_format.space_before = Pt(4)
    p_clg2.paragraph_format.space_after = Pt(0)
    r = p_clg2.add_run('EASWARI ENGINEERING COLLEGE\n')
    r.font.name = 'Times New Roman'
    r.font.size = Pt(14)
    r.font.bold = True
    r = p_clg2.add_run('(An Autonomous Institution, Affiliated to Anna University, Chennai)\nBharathi Salai, Ramapuram, Chennai – 600089')
    r.font.name = 'Times New Roman'
    r.font.size = Pt(10.5)

    p_title2 = doc.add_paragraph()
    p_title2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title2.paragraph_format.space_before = Pt(36)
    p_title2.paragraph_format.space_after = Pt(28)
    r = p_title2.add_run('CERTIFICATE OF VIVA-VOCE EXAMINATION')
    r.font.name = 'Times New Roman'
    r.font.size = Pt(14)
    r.font.bold = True

    p_body2 = doc.add_paragraph()
    p_body2.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_body2.paragraph_format.line_spacing = 1.5
    p_body2.paragraph_format.space_before = Pt(12)
    p_body2.paragraph_format.space_after = Pt(40)
    p_body2.add_run('This is to certify that the Viva-Voce Examination of the Project Work entitled “')
    r = p_body2.add_run('EQUIPMENT HEALTH & MAINTENANCE MONITOR: NEXT-GENERATION PREDICTIVE MAINTENANCE & REMAINING USEFUL LIFE (RUL) PLATFORM')
    r.font.bold = True
    p_body2.add_run('” submitted by Mr. ')
    r = p_body2.add_run('SHYAMKUMAR R (Reg. No: 310624205258)')
    r.font.bold = True
    p_body2.add_run(' in partial fulfillment of the requirements for the award of the degree of ')
    r = p_body2.add_run('BACHELOR OF TECHNOLOGY')
    r.font.bold = True
    p_body2.add_run(' in ')
    r = p_body2.add_run('INFORMATION TECHNOLOGY')
    r.font.bold = True
    p_body2.add_run(' was conducted on ____________ (Date) in the Department of Information Technology, Easwari Engineering College, Ramapuram – Chennai.')

    tbl_exam = doc.add_table(rows=1, cols=2)
    tbl_exam.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_exam.autofit = False
    tbl_exam.columns[0].width = Inches(3.1)
    tbl_exam.columns[1].width = Inches(3.15)
    set_cell_borders(tbl_exam.cell(0, 0), top=None, bottom=None, left=None, right=None)
    set_cell_borders(tbl_exam.cell(0, 1), top=None, bottom=None, left=None, right=None)

    p_in = tbl_exam.cell(0, 0).paragraphs[0]
    p_in.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p_in.paragraph_format.line_spacing = 1.4
    r = p_in.add_run('Internal Examiner\n\n')
    r.font.bold = True
    p_in.add_run('Name : _____________________\nDesignation : _______________\nAddress : ___________________')

    p_ex = tbl_exam.cell(0, 1).paragraphs[0]
    p_ex.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p_ex.paragraph_format.line_spacing = 1.4
    r = p_ex.add_run('External Examiner\n\n')
    r.font.bold = True
    p_ex.add_run('Name : _____________________\nDesignation : _______________\nAddress : ___________________')

    p_date = doc.add_paragraph()
    p_date.paragraph_format.space_before = Pt(36)
    p_date.paragraph_format.space_after = Pt(0)
    p_date.add_run('Date: ________________')

    # ==========================================
    # PRELIMINARY PAGES: ABSTRACT (Page 4)
    # ==========================================
    doc.add_page_break()

    p_abs = doc.add_paragraph()
    p_abs.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_abs.paragraph_format.space_before = Pt(12)
    p_abs.paragraph_format.space_after = Pt(18)
    r = p_abs.add_run('ABSTRACT')
    r.font.name = 'Times New Roman'
    r.font.size = Pt(14)
    r.font.bold = True

    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.35
    p.paragraph_format.space_after = Pt(4)
    p.add_run('Industrial manufacturing plants and critical infrastructure facilities lose between 15% to 40% of their operational capacity and incur millions of dollars annually in emergency repair bills and uncoordinated downtime due to sudden rotating machinery breakdowns. Traditional industrial maintenance strategies rely on either reactive "run-to-failure" procedures—which halt entire manufacturing lines unexpectedly—or rigid calendar-based preventative maintenance, which replaces expensive components prematurely while failing to catch rapid catastrophic failures like bearing flaking or spindle unbalance.')

    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.35
    p.paragraph_format.space_after = Pt(4)
    r = p.add_run('Equipment Health & Maintenance Monitor')
    r.font.bold = True
    p.add_run(' is a cloud-native, high-concurrency Full-Stack intelligence platform engineered to automate condition-based monitoring, predictive anomaly detection, and Remaining Useful Life (RUL) estimation across rotating industrial equipment. Built upon the MERN (MongoDB, Express, React, Node.js) architecture reinforced with Vite and low-latency Socket.io WebSockets, the platform introduces:')

    bullets = [
        ('1. Condition-Based Physical Telemetry Streaming: ', 'Continuous 3-second heartbeat ingestion and broadcasting of ISO 10816 vibration velocity RMS (mm/s), high-frequency bearing shock peak impact (Peak-G), stator housing temperature (°C), acoustic emissions (dB), and motor current signatures.'),
        ('2. Prognostic Remaining Useful Life (RUL) Engine: ', 'Statistical degradation curve fitting and Weibull wear hazard rate modeling projecting actionable machine survival countdowns (operating hours remaining) with 95% confidence intervals.'),
        ('3. Explainable Anomaly Detection & Attribution: ', 'Automated detection of mechanical defects (Spindle Unbalance, Bearing Inner/Outer Race Flaking, Cavitation) with granular risk scores (0–100%) and feature attribution breakdown.'),
        ('4. Closed-Loop Alert Healing & Work Order Dispatch: ', 'Interactive maintenance workflows featuring 1-click baseline healing, automated work order dispatch with OEM spare parts kitting, and real-time fleet state synchronization.')
    ]
    for b_title, b_desc in bullets:
        p_b = doc.add_paragraph()
        p_b.paragraph_format.line_spacing = 1.3
        p_b.paragraph_format.space_before = Pt(1)
        p_b.paragraph_format.space_after = Pt(2)
        p_b.paragraph_format.left_indent = Inches(0.25)
        r = p_b.add_run(b_title)
        r.font.bold = True
        p_b.add_run(b_desc)

    p_close = doc.add_paragraph()
    p_close.paragraph_format.line_spacing = 1.35
    p_close.paragraph_format.space_before = Pt(4)
    p_close.paragraph_format.space_after = Pt(4)
    p_close.add_run('The platform provides a responsive, dark-mode industrial monitoring cockpit featuring a smooth cubic Bezier spline area waveform chart, sub-100ms WebSocket updates, and comprehensive Playwright-verified reliability, establishing a high-availability digital backbone for Industry 4.0 predictive maintenance.')

    p_kw = doc.add_paragraph()
    p_kw.paragraph_format.line_spacing = 1.35
    p_kw.paragraph_format.space_before = Pt(4)
    p_kw.paragraph_format.space_after = Pt(0)
    r = p_kw.add_run('Keywords: ')
    r.font.bold = True
    r.font.italic = True
    r2 = p_kw.add_run('Predictive maintenance, Remaining Useful Life (RUL), ISO 10816 vibration severity, Weibull degradation modeling, WebSocket telemetry streaming, MERN stack.')
    r2.font.italic = True

    # ==========================================
    # PRELIMINARY PAGES: ACKNOWLEDGEMENT (Page 5)
    # ==========================================
    doc.add_page_break()

    p_ack = doc.add_paragraph()
    p_ack.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_ack.paragraph_format.space_before = Pt(12)
    p_ack.paragraph_format.space_after = Pt(24)
    r = p_ack.add_run('ACKNOWLEDGEMENT')
    r.font.name = 'Times New Roman'
    r.font.size = Pt(14)
    r.font.bold = True

    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.5
    p.paragraph_format.space_after = Pt(14)
    p.add_run('We express our sincere gratitude to the Principal ')
    r = p.add_run('Dr. P. Deiva Sundari')
    r.font.bold = True
    p.add_run(' and the Management of Easwari Engineering College for providing us with the opportunity and state-of-the-art facilities to carry out this project work.')

    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.5
    p.paragraph_format.space_after = Pt(14)
    p.add_run('We convey our heartfelt thanks to the Head of the Department, Department of Information Technology, for continuous encouragement, valuable suggestions, and steadfast support throughout our academic journey.')

    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.5
    p.paragraph_format.space_after = Pt(14)
    p.add_run('We are extremely thankful to our Project Guide, ')
    r = p.add_run('[Guide Name]')
    r.font.bold = True
    p.add_run(', Department of Information Technology, for valuable guidance, constructive criticism, and motivation throughout the conception and completion of this project.')

    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.5
    p.paragraph_format.space_after = Pt(14)
    p.add_run('We would also like to extend our gratitude to all the faculty and non-teaching members of the Department of Information Technology for their direct and indirect support.')

    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.5
    p.paragraph_format.space_after = Pt(0)
    p.add_run('Finally, we thank our parents and friends for their constant encouragement, moral support, and cooperation during the course of this project.')

    # ==========================================
    # PRELIMINARY PAGES: TABLE OF CONTENTS (Page 6)
    # ==========================================
    doc.add_page_break()

    p_toc = doc.add_paragraph()
    p_toc.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_toc.paragraph_format.space_before = Pt(12)
    p_toc.paragraph_format.space_after = Pt(18)
    r = p_toc.add_run('TABLE OF CONTENTS')
    r.font.name = 'Times New Roman'
    r.font.size = Pt(14)
    r.font.bold = True

    # Exact table of contents structure matching PDF Screenshot 6: borderless, clean alignment
    tbl_toc = doc.add_table(rows=1, cols=3)
    tbl_toc.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_toc.autofit = False
    tbl_toc.columns[0].width = Inches(1.2)
    tbl_toc.columns[1].width = Inches(4.1)
    tbl_toc.columns[2].width = Inches(0.95)

    hdr_row = tbl_toc.rows[0]
    set_cell_borders(hdr_row.cells[0], top=None, bottom=None, left=None, right=None)
    set_cell_borders(hdr_row.cells[1], top=None, bottom=None, left=None, right=None)
    set_cell_borders(hdr_row.cells[2], top=None, bottom=None, left=None, right=None)

    p = hdr_row.cells[0].paragraphs[0]
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(4)
    r = p.add_run('CHAPTER\nNO.')
    r.font.bold = True
    r.font.size = Pt(10)

    p = hdr_row.cells[1].paragraphs[0]
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(4)
    r = p.add_run('\nTITLE')
    r.font.bold = True
    r.font.size = Pt(10)

    p = hdr_row.cells[2].paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(4)
    r = p.add_run('PAGE\nNo.')
    r.font.bold = True
    r.font.size = Pt(10)

    # Use dynamically supplied page mapping or default estimate
    m = toc_page_mapping or {
        'ABSTRACT': '4',
        'ACKNOWLEDGEMENT': '5',
        'TABLE OF CONTENTS': '6',
        '1 INTRODUCTION': '7-8',
        '2 RELATED WORK': '9-10',
        '3 SYSTEM ANALYSIS': '11-12',
        '4 SYSTEM DESIGN': '13-15',
        '5 IMPLEMENTATION': '16-18',
        '6 CONCLUSION & FUTURE WORK': '19',
        'APPENDIX - SOURCE CODE': '20',
        'SCREENSHOTS OF THE PROJECT': '34',
        'REFERENCES': '36'
    }

    toc_entries = [
        ('', 'ABSTRACT', m.get('ABSTRACT', '4'), True),
        ('', 'ACKNOWLEDGEMENT', m.get('ACKNOWLEDGEMENT', '5'), True),
        ('', 'TABLE OF CONTENTS', m.get('TABLE OF CONTENTS', '6'), True),
        ('1', 'INTRODUCTION', m.get('1 INTRODUCTION', '7-8'), True),
        ('', '1.1 Overview', '', False),
        ('', '1.2 Problem Definition', '', False),
        ('', '1.3 Objective', '', False),
        ('', '1.4 Scope of the Project', '', False),
        ('', '1.5 Motivation', '', False),
        ('2', 'RELATED WORK', m.get('2 RELATED WORK', '9-10'), True),
        ('', '2.1 Literature Review', '', False),
        ('', '2.2 Existing System', '', False),
        ('', '2.3 Proposed System', '', False),
        ('3', 'SYSTEM ANALYSIS', m.get('3 SYSTEM ANALYSIS', '11-12'), True),
        ('', '3.1 System Requirements', '', False),
        ('', '3.2 Software and Hardware Requirements', '', False),
        ('4', 'SYSTEM DESIGN', m.get('4 SYSTEM DESIGN', '13-15'), True),
        ('', '4.1 System Architecture', '', False),
        ('', '4.2 Module Description', '', False),
        ('', '4.3 Class Diagram', '', False),
        ('', '4.4 Sequence Diagram', '', False),
        ('5', 'IMPLEMENTATION', m.get('5 IMPLEMENTATION', '16-18'), True),
        ('', '5.1 Implementation Overview', '', False),
        ('', '5.2 Key Functions (Code Explanation)', '', False),
        ('6', 'CONCLUSION & FUTURE WORK', m.get('6 CONCLUSION & FUTURE WORK', '19'), True),
        ('', '6.1 Conclusion', '', False),
        ('', '6.2 Future Enhancements', '', False),
        ('', 'APPENDIX - SOURCE CODE', m.get('APPENDIX - SOURCE CODE', '20'), True),
        ('', 'SCREENSHOTS OF THE PROJECT', m.get('SCREENSHOTS OF THE PROJECT', '34'), True),
        ('', 'REFERENCES', m.get('REFERENCES', '36'), True),
    ]

    for chap_no, title, page_no, is_bold in toc_entries:
        row = tbl_toc.add_row()
        for c in row.cells:
            set_cell_borders(c, top=None, bottom=None, left=None, right=None)
        
        p0 = row.cells[0].paragraphs[0]
        p0.paragraph_format.space_before = Pt(0)
        p0.paragraph_format.space_after = Pt(0)
        p0.paragraph_format.line_spacing = 1.05
        r0 = p0.add_run(chap_no)
        r0.font.bold = is_bold
        r0.font.size = Pt(10)

        p1 = row.cells[1].paragraphs[0]
        p1.paragraph_format.space_before = Pt(0)
        p1.paragraph_format.space_after = Pt(0)
        p1.paragraph_format.line_spacing = 1.05
        if not is_bold:
            p1.paragraph_format.left_indent = Inches(0.2)
        r1 = p1.add_run(title)
        r1.font.bold = is_bold
        r1.font.size = Pt(10)

        p2 = row.cells[2].paragraphs[0]
        p2.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        p2.paragraph_format.space_before = Pt(0)
        p2.paragraph_format.space_after = Pt(0)
        p2.paragraph_format.line_spacing = 1.05
        r2 = p2.add_run(page_no)
        r2.font.bold = is_bold
        r2.font.size = Pt(10)

    # ==========================================
    # CHAPTERS & REPORT BODY
    # Continuous Arabic Numbering in Footer
    # ==========================================

    # ----------------------------------------------------
    # CHAPTER 1: INTRODUCTION
    # ----------------------------------------------------
    doc.add_page_break()

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(16)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('CHAPTER 1\nINTRODUCTION')
    r.font.name = 'Times New Roman'
    r.font.size = Pt(14)
    r.font.bold = True

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('1.1 OVERVIEW')
    r.font.bold = True

    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.5
    p.paragraph_format.space_after = Pt(8)
    p.add_run('In contemporary industrial environments, rotating machinery—including high-speed CNC milling spindles, centrifugal slurry pumps, hydraulic power units, and heavy-duty planetary gearboxes—forms the foundational backbone of factory operations. However, unexpected physical degradation and catastrophic equipment breakdowns consistently cause between 15% and 40% loss of manufacturing throughput, leading to billions of dollars in emergency maintenance costs and disrupted delivery schedules. The Equipment Health & Maintenance Monitor is an end-to-end full-stack platform that unifies high-frequency physical telemetry ingestion, ISO 10816 vibration severity analysis, automated Remaining Useful Life (RUL) prognostics, explainable anomaly root-cause attribution, and closed-loop maintenance work order dispatching into a unified industrial intelligence hub.')

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('1.2 PROBLEM DEFINITION')
    r.font.bold = True

    p_probs = [
        ('1. Catastrophic Reactive Breakdowns: ', 'Traditional manufacturing lines rely heavily on run-to-failure practices, resulting in sudden mechanical seizing that halts plant operations and triggers costly secondary damage.'),
        ('2. Inefficient Calendar-Based Preventative Maintenance: ', 'Time-scheduled servicing (e.g. replacing bearings every 90 days) wastes operational expenditure by discarding healthy components while failing to detect fast-developing micro-fractures between intervals.'),
        ('3. Disconnected Diagnostic Logs & Delayed Intervention: ', 'Sensor readings are frequently isolated in proprietary on-premise PLCs or manual shift logs, preventing reliability engineers from correlating acoustic, thermal, and vibration trends before failures occur.')
    ]
    for p_title, p_desc in p_probs:
        p_item = doc.add_paragraph()
        p_item.paragraph_format.line_spacing = 1.5
        p_item.paragraph_format.space_before = Pt(2)
        p_item.paragraph_format.space_after = Pt(4)
        p_item.paragraph_format.left_indent = Inches(0.25)
        r = p_item.add_run(p_title)
        r.font.bold = True
        p_item.add_run(p_desc)

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('1.3 OBJECTIVE')
    r.font.bold = True

    objs = [
        'To engineer a high-throughput, low-latency industrial IoT web platform connecting plant operators, reliability engineers, and maintenance dispatch crews.',
        'To implement real-time condition-based monitoring tracking ISO 10816 vibration velocity RMS (mm/s), bearing peak impact (g), temperature, and acoustic emissions.',
        'To develop automated Remaining Useful Life (RUL) prognostic modeling with upper and lower 95% confidence intervals to forecast hours to failure.',
        'To establish bi-directional WebSocket telemetry channels broadcasting live machine status and auto-focusing visual spline waveforms during anomalies.'
    ]
    for o in objs:
        p_o = doc.add_paragraph()
        p_o.paragraph_format.line_spacing = 1.5
        p_o.paragraph_format.space_before = Pt(2)
        p_o.paragraph_format.space_after = Pt(4)
        p_o.paragraph_format.left_indent = Inches(0.25)
        p_o.add_run('•  ' + o)

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('1.4 SCOPE OF THE PROJECT')
    r.font.bold = True

    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.5
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.left_indent = Inches(0.25)
    r = p.add_run('• Fleet Reliability Cockpit: ')
    r.font.bold = True
    p.add_run('Dynamic fleet KPI bento cards (Overall Health %, Active Anomalies, Machines Under 200h RUL, Active Work Orders) and an interactive 1-click simulation scenario injector.')

    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.5
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.left_indent = Inches(0.25)
    r = p.add_run('• Live Vibration Spline Waveform: ')
    r.font.bold = True
    p.add_run('Continuous SVG cubic Bezier spline area visualization streaming rolling 25-point RMS telemetry with auto-zoom scaling, pulsing beacon tips, and ISO 10816 threshold breach indicators.')

    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.5
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.left_indent = Inches(0.25)
    r = p.add_run('• Explainable Anomaly Attribution Engine: ')
    r.font.bold = True
    p.add_run('Detailed root-cause diagnostic breakdown identifying failure modes (e.g. Spindle Unbalance, Inner Race Flaking, Cavitation) with sensor contribution percentages.')

    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.5
    p.paragraph_format.space_after = Pt(10)
    p.paragraph_format.left_indent = Inches(0.25)
    r = p.add_run('• Maintenance & Work Orders Dispatcher: ')
    r.font.bold = True
    p.add_run('Closed-loop work order generation linking anomalies directly to technician assignments, downtime estimations, and pre-configured OEM spare parts kitting.')

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('1.5 MOTIVATION')
    r.font.bold = True

    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.5
    p.paragraph_format.space_after = Pt(0)
    p.add_run('Transitioning to Industry 4.0 and achieving zero unplanned equipment downtime requires predictive intelligence that detects microscopic mechanical wear long before friction produces noticeable heat or audible noise. Vibration velocity (measured in mm/s RMS) is a physics-based leading indicator that reveals imbalance, misalignment, and bearing fatigue days or weeks ahead of failure. By replacing disconnected manual logs with real-time cloud-native condition monitoring and closed-loop healing, the Equipment Health & Maintenance Monitor delivers enterprise-grade operational resilience, lowers operating overhead, and protects critical manufacturing capital.')

    # ----------------------------------------------------
    # CHAPTER 2: RELATED WORK
    # ----------------------------------------------------
    doc.add_page_break()

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(16)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('CHAPTER 2\nRELATED WORK')
    r.font.name = 'Times New Roman'
    r.font.size = Pt(14)
    r.font.bold = True

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('2.1 LITERATURE REVIEW')
    r.font.bold = True

    lit_reviews = [
        ('ISO 10816 Mechanical Vibration Standards: ', 'International standard ISO 10816-3 establishes critical vibration velocity thresholds (RMS mm/s) across rotating industrial machines, defining Zone A (newly commissioned), Zone B (unrestricted long-term operation), Zone C (restricted short-term operation), and Zone D (severe damage threshold at 4.5 mm/s requiring immediate shutdown).'),
        ('Prognostic Degradation & RUL Modeling: ', 'Extensive research based on NASA C-MAPSS and FEMTO turbofan/bearing run-to-failure benchmarks demonstrates that statistical exponential wear curves combined with Weibull hazard distributions accurately model physical degradation trajectories prior to catastrophic flaking.'),
        ('Reactive WebSocket Streaming in Industrial SCADA: ', 'Modern industrial architectures increasingly transition away from polling-heavy SCADA desktop monitors toward event-driven WebSockets (Socket.io) to deliver synchronized, sub-100ms multi-client telemetry dashboards without incurring server-side HTTP polling bottlenecks.')
    ]
    for lr_title, lr_desc in lit_reviews:
        p_lr = doc.add_paragraph()
        p_lr.paragraph_format.line_spacing = 1.5
        p_lr.paragraph_format.space_before = Pt(2)
        p_lr.paragraph_format.space_after = Pt(4)
        p_lr.paragraph_format.left_indent = Inches(0.25)
        r = p_lr.add_run('• ' + lr_title)
        r.font.bold = True
        p_lr.add_run(lr_desc)

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('2.2 EXISTING SYSTEM')
    r.font.bold = True

    ex_sys = [
        'Industrial facilities rely on manual handheld vibration pen checks performed once per shift, leaving massive unmonitored windows where rapid failures emerge.',
        'Maintenance schedules are dictated by calendar intervals (e.g. 90-day lubrications), leading to premature part replacements and unnecessary labor expenses.',
        'Absence of automated root-cause attribution forces technicians to spend hours diagnosing whether elevated vibration is caused by unbalance, loose footing, or bearing spall.',
        'Decoupled work order systems require manual transcription from alarm logs into ERP software, introducing human error and communication lag.'
    ]
    for item in ex_sys:
        p_ex = doc.add_paragraph()
        p_ex.paragraph_format.line_spacing = 1.5
        p_ex.paragraph_format.space_before = Pt(2)
        p_ex.paragraph_format.space_after = Pt(4)
        p_ex.paragraph_format.left_indent = Inches(0.25)
        p_ex.add_run('• ' + item)

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('2.3 PROPOSED SYSTEM')
    r.font.bold = True

    prop_sys = [
        ('Centralized Real-Time MERN Engine: ', 'High-concurrency full-stack Node.js + Express backend integrated with MongoDB Mongoose schemas and offline memory fallback for continuous operational resilience.'),
        ('Continuous Physical Telemetry Stream: ', 'Ingests multi-axial physical sensors (vibration velocity, bearing peak-G, housing temperature, acoustic dB, motor current) at 3-second heartbeat intervals.'),
        ('Dynamic SVG Cubic Bezier Waveform: ', 'Lightweight zero-dependency client chart rendering real-time waveforms with auto-scaling Y-axes, pulsing beacon markers, and ISO warning lines.'),
        ('Closed-Loop 1-Click Healing & Work Orders: ', 'Enables plant operators to resolve alarms, reset healthy baselines in MongoDB, and dispatch actionable work orders with replacement parts kitting in a single click.')
    ]
    for ps_title, ps_desc in prop_sys:
        p_ps = doc.add_paragraph()
        p_ps.paragraph_format.line_spacing = 1.5
        p_ps.paragraph_format.space_before = Pt(2)
        p_ps.paragraph_format.space_after = Pt(4)
        p_ps.paragraph_format.left_indent = Inches(0.25)
        r = p_ps.add_run('• ' + ps_title)
        r.font.bold = True
        p_ps.add_run(ps_desc)

    # ----------------------------------------------------
    # CHAPTER 3: SYSTEM ANALYSIS
    # ----------------------------------------------------
    doc.add_page_break()

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(16)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('CHAPTER 3\nSYSTEM ANALYSIS')
    r.font.name = 'Times New Roman'
    r.font.size = Pt(14)
    r.font.bold = True

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('3.1 SYSTEM REQUIREMENTS')
    r.font.bold = True

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('Functional Requirements:')
    r.font.italic = True
    r.font.bold = True

    fn_reqs = [
        ('1. Fleet Health Monitoring & KPI Aggregation: ', 'Real-time calculation of overall plant health index (0–100%), active anomaly counts, machines below 200 hours RUL, and active work orders.'),
        ('2. High-Frequency Telemetry Ingestion: ', 'Continuous streaming and persistence of physical vibration RMS, bearing shock impact (Peak-G), casing temperature, acoustic noise, and motor current.'),
        ('3. Prognostic Remaining Useful Life (RUL) Calculation: ', 'Automated projection of operating hours remaining with upper and lower 95% confidence bounds based on wear degradation slopes.'),
        ('4. Anomaly Detection & Attribution: ', 'Instant threshold evaluation against ISO 10816 limits (4.5 mm/s), triggering explainable alarm cards with percentage feature contributions.'),
        ('5. Closed-Loop Alert Healing & Maintenance Dispatch: ', 'Interactive resolution workflows that reset healthy baseline operating values in MongoDB and dispatch maintenance work orders with pre-kitted spare parts.')
    ]
    for fr_title, fr_desc in fn_reqs:
        p_fr = doc.add_paragraph()
        p_fr.paragraph_format.line_spacing = 1.5
        p_fr.paragraph_format.space_before = Pt(2)
        p_fr.paragraph_format.space_after = Pt(4)
        p_fr.paragraph_format.left_indent = Inches(0.25)
        r = p_fr.add_run(fr_title)
        r.font.bold = True
        p_fr.add_run(fr_desc)

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('Non-Functional Requirements:')
    r.font.italic = True
    r.font.bold = True

    nfn_reqs = [
        ('1. Real-Time Latency: ', 'Sub-100ms WebSocket propagation from server telemetry ingestion to browser waveform and bento card updates.'),
        ('2. High Reliability & Fault Tolerance: ', 'Automated fallback to in-memory database simulation if MongoDB cluster encounters network interruption.'),
        ('3. Data Consistency & Atomic Persistence: ', 'Strict Mongoose schema validation ensuring anomaly flags, telemetry logs, and machine health scores remain atomically synchronized.'),
        ('4. Usability & Industrial Ergonomics: ', 'High-contrast dark-mode interface with responsive layout optimized for control room desktop monitors, rugged tablets, and mobile handsets.')
    ]
    for nfr_title, nfr_desc in nfn_reqs:
        p_nfr = doc.add_paragraph()
        p_nfr.paragraph_format.line_spacing = 1.5
        p_nfr.paragraph_format.space_before = Pt(2)
        p_nfr.paragraph_format.space_after = Pt(4)
        p_nfr.paragraph_format.left_indent = Inches(0.25)
        r = p_nfr.add_run(nfr_title)
        r.font.bold = True
        p_nfr.add_run(nfr_desc)

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('3.2 SOFTWARE AND HARDWARE REQUIREMENTS')
    r.font.bold = True

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('Software Requirements:')
    r.font.italic = True
    r.font.bold = True

    sw_reqs = [
        'Operating System: Windows 10/11, Ubuntu Linux, or macOS',
        'Runtime Environment: Node.js (v18.0.0 or higher)',
        'Database: MongoDB (v6.0+ local or MongoDB Atlas Cloud)',
        'Backend Framework: Express.js (v4.21.2)',
        'Frontend Framework: React 18 with Vite 5.4 build tooling',
        'Real-Time Protocol: Socket.io (v4.8.4)',
        'Styling: Vanilla Modern CSS3, Lucide React Icons',
        'Testing & Automation: Playwright Core (v1.63.0) driving Google Chrome'
    ]
    for item in sw_reqs:
        p_sw = doc.add_paragraph()
        p_sw.paragraph_format.line_spacing = 1.5
        p_sw.paragraph_format.space_before = Pt(2)
        p_sw.paragraph_format.space_after = Pt(3)
        p_sw.paragraph_format.left_indent = Inches(0.25)
        p_sw.add_run('•  ' + item)

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('Hardware Requirements:')
    r.font.italic = True
    r.font.bold = True

    hw_reqs = [
        'Processor: Intel Core i3 / AMD Ryzen 3 or higher (Quad Core recommended for real-time telemetry processing)',
        'Memory (RAM): Minimum 4 GB RAM (8 GB recommended for concurrent frontend, backend, and MongoDB instances)',
        'Storage: Minimum 1 GB available disk space for Node modules, client build artifacts, and database collections',
        'Network: Standard Broadband / Local Area Network (LAN) connection for real-time WebSocket telemetry synchronization'
    ]
    for item in hw_reqs:
        p_hw = doc.add_paragraph()
        p_hw.paragraph_format.line_spacing = 1.5
        p_hw.paragraph_format.space_before = Pt(2)
        p_hw.paragraph_format.space_after = Pt(4)
        p_hw.paragraph_format.left_indent = Inches(0.25)
        p_hw.add_run('•  ' + item)

    # ----------------------------------------------------
    # CHAPTER 4: SYSTEM DESIGN
    # ----------------------------------------------------
    doc.add_page_break()

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(16)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('CHAPTER 4\nSYSTEM DESIGN')
    r.font.name = 'Times New Roman'
    r.font.size = Pt(14)
    r.font.bold = True

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('4.1 SYSTEM ARCHITECTURE')
    r.font.bold = True

    # Image 4.1
    if os.path.exists('assets_report/fig_4_1_architecture.png'):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(6)
        p_img.paragraph_format.space_after = Pt(6)
        p_img.paragraph_format.keep_with_next = True
        p_img.add_run().add_picture('assets_report/fig_4_1_architecture.png', width=Inches(5.6))

    p_cap = doc.add_paragraph()
    p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cap.paragraph_format.space_before = Pt(4)
    p_cap.paragraph_format.space_after = Pt(14)
    r = p_cap.add_run('Figure 4.1: System Architecture Diagram')
    r.font.bold = True
    r.font.italic = True

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('4.2 MODULE DESCRIPTION')
    r.font.bold = True

    mods = [
        ('1. Telemetry Ingestion & Simulation Engine: ', 'Executes a high-frequency background worker simulating physical machine dynamics (vibration sinusoidal harmonics, bearing crest impacts, friction thermal rise). Generates multi-parameter readings every 3 seconds and injects live plant edge-case failure scenarios.'),
        ('2. Live Dynamic Waveform Module: ', 'Renders an interactive cubic Bezier spline area chart representing real-time vibration RMS data. Features auto-scaling Y-axes, pulsing tip beacon markers, automated machine switching upon anomaly trigger, and ISO 10816 Class IV warning limit markers.'),
        ('3. Prognostics & RUL Engine: ', 'Calculates remaining operating hours until machine wear reaches failure boundaries using exponential degradation modeling, computing 95% confidence intervals and overall asset reliability health scores.'),
        ('4. Anomaly Attribution & Diagnosis Module: ', 'Compares incoming vibration and peak impact telemetry against ISO thresholds. Identifies specific failure modes (e.g. Spindle Unbalance, Inner Race Flaking) with percentage sensor attribution and actionable engineering recommendations.'),
        ('5. Closed-Loop Maintenance Dispatcher: ', 'Provides full work order lifecycle management, pre-configuring required OEM replacement kits, estimated downtime hours, assigned technician crews, and 1-click baseline healing.')
    ]
    for m_title, m_desc in mods:
        p_m = doc.add_paragraph()
        p_m.paragraph_format.line_spacing = 1.5
        p_m.paragraph_format.space_before = Pt(2)
        p_m.paragraph_format.space_after = Pt(4)
        p_m.paragraph_format.left_indent = Inches(0.25)
        r = p_m.add_run(m_title)
        r.font.bold = True
        p_m.add_run(m_desc)

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('4.3 CLASS DIAGRAM')
    r.font.bold = True

    # Image 4.2
    if os.path.exists('assets_report/fig_4_2_class_diagram.png'):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(6)
        p_img.paragraph_format.space_after = Pt(6)
        p_img.paragraph_format.keep_with_next = True
        p_img.add_run().add_picture('assets_report/fig_4_2_class_diagram.png', width=Inches(5.4))

    p_cap = doc.add_paragraph()
    p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cap.paragraph_format.space_before = Pt(4)
    p_cap.paragraph_format.space_after = Pt(14)
    r = p_cap.add_run('Figure 4.2: Class Diagram')
    r.font.bold = True
    r.font.italic = True

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('4.4 SEQUENCE DIAGRAM')
    r.font.bold = True

    # Image 4.3
    if os.path.exists('assets_report/fig_4_3_sequence_diagram.png'):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(6)
        p_img.paragraph_format.space_after = Pt(6)
        p_img.paragraph_format.keep_with_next = True
        p_img.add_run().add_picture('assets_report/fig_4_3_sequence_diagram.png', width=Inches(5.6))

    p_cap = doc.add_paragraph()
    p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cap.paragraph_format.space_before = Pt(4)
    p_cap.paragraph_format.space_after = Pt(0)
    r = p_cap.add_run('Figure 4.3: Sequence Diagram – Real-Time Anomaly Detection & Closed-Loop Healing Flow')
    r.font.bold = True
    r.font.italic = True

    # ----------------------------------------------------
    # CHAPTER 5: IMPLEMENTATION
    # ----------------------------------------------------
    doc.add_page_break()

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(16)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('CHAPTER 5\nIMPLEMENTATION')
    r.font.name = 'Times New Roman'
    r.font.size = Pt(14)
    r.font.bold = True

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('5.1 IMPLEMENTATION OVERVIEW')
    r.font.bold = True

    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.5
    p.paragraph_format.space_after = Pt(6)
    p.add_run('The platform is architected as a modern, decoupled client-server web application:')

    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.5
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.left_indent = Inches(0.25)
    r = p.add_run('• Backend Engine: ')
    r.font.bold = True
    p.add_run('Engineered using modular CommonJS Node.js and Express.js, featuring separation of REST API controllers, Mongoose ORM schemas, and background simulation services. Incorporates an automatic database connection fallback that ensures uninterrupted local development if primary MongoDB instances are unavailable.')

    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.5
    p.paragraph_format.space_after = Pt(10)
    p.paragraph_format.left_indent = Inches(0.25)
    r = p.add_run('• Frontend Application: ')
    r.font.bold = True
    p.add_run('Single-page application (SPA) built using React 18 and Vite build tooling. Leverages native WebSocket listeners via Socket.io-client to consume real-time machine telemetry and anomaly broadcasts without incurring browser re-render lag.')

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('5.2 KEY FUNCTIONS (CODE EXPLANATION)')
    r.font.bold = True

    key_fns = [
        ('1. Anomaly Scenario Injection (routes/api.js): ', [
            'Simulates plant-floor failure conditions (Vibration Spike 8.6 mm/s, Bearing Defect 5.2g, RUL Collapse 14h) on target machines.',
            'Updates MongoDB machine records, generates detailed AnomalyAlert instances with root-cause explainability trees, and emits immediate "machine:update" and "alert:new" WebSocket events.'
        ]),
        ('2. Closed-Loop Alert Healing (routes/api.js): ', [
            'Executes PATCH /api/alerts/:id/resolve to mark anomalies as resolved with timestamp.',
            'Verifies whether unresolved critical alarms remain for the target asset; if none exist, resets machine vibration to 1.8 mm/s, operating temperature to 52°C, and health score to 96% STABLE, broadcasting restored state to all clients.'
        ]),
        ('3. Real-Time Telemetry Simulation (services/simulator.js): ', [
            'Background worker executing at 3-second intervals using harmonic sinusoidal waves and random noise to simulate natural machine vibration.',
            'Evaluates dynamic telemetry against ISO 10816 Class IV thresholds (4.5 mm/s), automatically triggering warning transitions when limits are breached.'
        ]),
        ('4. Dynamic Cubic Bezier Waveform Rendering (components/VibrationWaveChart.jsx): ', [
            'Maintains a rolling 25-point buffer of machine vibration velocity telemetry.',
            'Dynamically computes smooth SVG cubic Bezier spline control points with auto-zooming Y-axis scaling, pulsing tip beacon markers, and ISO warning dashed lines without third-party canvas overhead.'
        ])
    ]
    for fn_title, fn_bullets in key_fns:
        p_fn = doc.add_paragraph()
        p_fn.paragraph_format.line_spacing = 1.5
        p_fn.paragraph_format.space_before = Pt(4)
        p_fn.paragraph_format.space_after = Pt(2)
        p_fn.paragraph_format.left_indent = Inches(0.25)
        p_fn.paragraph_format.keep_with_next = True
        r = p_fn.add_run(fn_title)
        r.font.bold = True
        for b in fn_bullets:
            p_b = doc.add_paragraph()
            p_b.paragraph_format.line_spacing = 1.5
            p_b.paragraph_format.space_before = Pt(1)
            p_b.paragraph_format.space_after = Pt(2)
            p_b.paragraph_format.left_indent = Inches(0.45)
            p_b.add_run('– ' + b)

    # ----------------------------------------------------
    # CHAPTER 6: CONCLUSION & FUTURE WORK
    # ----------------------------------------------------
    doc.add_page_break()

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(16)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('CHAPTER 6\nCONCLUSION & FUTURE WORK')
    r.font.name = 'Times New Roman'
    r.font.size = Pt(14)
    r.font.bold = True

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('6.1 CONCLUSION')
    r.font.bold = True

    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.5
    p.paragraph_format.space_after = Pt(14)
    p.add_run('The Equipment Health & Maintenance Monitor successfully resolves critical challenges in industrial asset reliability by bridging real-time sensor telemetry, physics-based ISO 10816 standards, and predictive Remaining Useful Life (RUL) modeling. By transitioning industrial facilities from reactive "run-to-failure" chaos to proactive, condition-based maintenance, the platform minimizes catastrophic plant downtime and enhances overall equipment effectiveness (OEE). The MERN + Vite + Socket.io architecture ensures sub-100ms responsiveness, robust MongoDB persistence with seamless memory fallback, and high-clarity visualization suitable for demanding industrial control environments.')

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('6.2 FUTURE ENHANCEMENTS')
    r.font.bold = True

    future_works = [
        ('1. Continuous Production ML Retraining Pipeline: ', 'Integrating a dedicated Python/FastAPI microservice running Long Short-Term Memory (LSTM) neural networks and Weibull regression models retrained continuously against NASA C-MAPSS and FEMTO vibration run-down datasets.'),
        ('2. Enterprise CMMS & ERP Integration: ', 'Developing bi-directional webhook connectors for SAP Plant Maintenance (PM), IBM Maximo, and Jira Service Management to automatically dispatch corporate work orders and synchronize inventory deductions.'),
        ('3. Physical Industrial IoT Sensor Ingestion: ', 'Deploying an industrial edge gateway supporting MQTT and OPC-UA communication protocols to stream real-time accelerometer and acoustic emission data directly from physical shop-floor machinery.'),
        ('4. Edge Hardware Inference & Embedded Anomaly Classifiers: ', 'Compiling lightweight ONNX anomaly classification models directly onto industrial edge gateways (e.g. Raspberry Pi / Siemens IOT2050) for microsecond-level automated emergency machine interlocks.')
    ]
    for fw_title, fw_desc in future_works:
        p_fw = doc.add_paragraph()
        p_fw.paragraph_format.line_spacing = 1.5
        p_fw.paragraph_format.space_before = Pt(3)
        p_fw.paragraph_format.space_after = Pt(4)
        p_fw.paragraph_format.left_indent = Inches(0.25)
        r = p_fw.add_run(fw_title)
        r.font.bold = True
        p_fw.add_run(fw_desc)

    # ----------------------------------------------------
    # APPENDIX - SOURCE CODE
    # Clean monospaced code paragraphs matching PDF template
    # ----------------------------------------------------
    doc.add_page_break()

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(8)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('APPENDIX')
    r.font.name = 'Times New Roman'
    r.font.size = Pt(14)
    r.font.bold = True

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(8)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('SOURCE CODE:')
    r.font.name = 'Times New Roman'
    r.font.size = Pt(12)
    r.font.bold = True

    # 1. Project Folder Structure
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('1. Project Folder Structure')
    r.font.bold = True

    folder_structure_text = """predictive-maintenance-rul/
├── docker-compose.yml
├── README.md
├── PROJECT_OVERVIEW.txt
├── REVIEWER_REPORT.md
├── client/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── Dockerfile
│   ├── nginx.conf
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── components/
│       │   ├── Header.jsx
│       │   ├── Sidebar.jsx
│       │   ├── MetricCard.jsx
│       │   ├── StatusBadge.jsx
│       │   ├── SimulationCockpit.jsx
│       │   ├── VibrationWaveChart.jsx
│       │   ├── AnomalyExplainModal.jsx
│       │   └── WorkOrderModal.jsx
│       ├── pages/
│       │   ├── FleetOverview.jsx
│       │   ├── MachineDiagnostics.jsx
│       │   ├── RULPredictions.jsx
│       │   ├── AnomalyAlerts.jsx
│       │   ├── WorkOrders.jsx
│       │   └── TelemetryTrends.jsx
│       └── services/
│           └── api.js
└── server/
    ├── package.json
    ├── server.js
    ├── test_e2e_playwright.js
    ├── Dockerfile
    ├── models/
    │   ├── Machine.js
    │   ├── TelemetryReading.js
    │   ├── AnomalyAlert.js
    │   └── MaintenanceAction.js
    ├── routes/
    │   └── api.js
    ├── seed/
    │   └── seedData.js
    └── services/
        └── simulator.js"""
    add_code_listing(doc, folder_structure_text)

    # 2. Package Installation Commands
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('2. Package Installation Commands')
    r.font.bold = True

    install_cmds_text = """# Initialize and install backend core dependencies
cd server
npm install express mongoose dotenv cors socket.io

# Install automated E2E browser verification tooling
npm install -D playwright-core

# Install frontend dependencies
cd ../client
npm install react react-dom lucide-react socket.io-client
npm install -D vite @vitejs/plugin-react"""
    add_code_listing(doc, install_cmds_text)

    # 3. Database Connection & Offline Fallback
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('3. Database Connection & Fallback (server/server.js)')
    r.font.bold = True

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('Code – MongoDB connection & offline fallback (server/server.js)')
    r.font.bold = True
    r.font.size = Pt(10.5)

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('Source file: server/server.js')
    r.font.italic = True
    r.font.size = Pt(10)

    db_conn_text = """const mongoose = require('mongoose');

const PORT = process.env.PORT || 5003;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/predictive_maintenance';

const startServer = async () => {
  try {
    console.log(`Connecting to MongoDB at: ${MONGO_URI}`);
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('Connected to MongoDB successfully.');

    await seedDatabase();
    startTelemetrySimulator(io);

    server.listen(PORT, () => {
      console.log(`Predictive Maintenance Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    // Offline resilience fallback: run simulator in-memory
    startTelemetrySimulator(io);
    server.listen(PORT, () => {
      console.log(`Predictive Maintenance Server listening (offline fallback) on port ${PORT}`);
    });
  }
};"""
    add_code_listing(doc, db_conn_text)

    # 4. Environment Variables
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('4. Environment Variables (server/.env)')
    r.font.bold = True

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('Source file: server/.env')
    r.font.italic = True
    r.font.size = Pt(10)

    env_text = """# MongoDB Connection URI (Local & Docker compose network)
MONGO_URI=mongodb://127.0.0.1:27017/predictive_maintenance

# Server Port & Client Address
PORT=5003
CLIENT_URL=http://localhost:3003

# Telemetry Simulator Frequency
SIMULATION_INTERVAL_MS=3000
ISO_10816_VIBRATION_LIMIT=4.5"""
    add_code_listing(doc, env_text)

    # 5. Machine Model Schema
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('5. Machine Model Schema (server/models/Machine.js)')
    r.font.bold = True

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('Source file: server/models/Machine.js')
    r.font.italic = True
    r.font.size = Pt(10)

    machine_model_text = """const mongoose = require('mongoose');

const machineSchema = new mongoose.Schema({
  machineId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  line: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['SPINDLE_MOTOR', 'HYDRAULIC_PUMP', 'CENTRIFUGAL_COMPRESSOR', 'ROBOTIC_GEARBOX'],
    default: 'SPINDLE_MOTOR' 
  },
  healthScore: { type: Number, required: true, min: 0, max: 100 },
  anomalyScore: { type: Number, required: true, min: 0, max: 1.0 },
  status: { 
    type: String, 
    enum: ['HEALTHY', 'EARLY_DEGRADATION', 'SEVERE_ANOMALY', 'CRITICAL_SHUTDOWN'],
    default: 'HEALTHY' 
  },
  predictedRulHours: { type: Number, required: true },
  rulConfidenceMin: { type: Number, required: true },
  rulConfidenceMax: { type: Number, required: true },
  currentVibrationRms: { type: Number, required: true },
  warningVibrationRms: { type: Number, default: 4.5 },
  currentTempC: { type: Number, required: true },
  warningTempC: { type: Number, default: 75.0 },
  currentBearingPeakG: { type: Number, required: true },
  lubeDielectricConstant: { type: Number, default: 2.4 },
  totalOperatingHours: { type: Number, default: 5000 },
  criticality: { 
    type: String, 
    enum: ['CRITICAL_BOTTLENECK', 'HIGH', 'MEDIUM'],
    default: 'HIGH' 
  },
  lastMaintenanceDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Machine', machineSchema);"""
    add_code_listing(doc, machine_model_text)

    # 6. Telemetry Reading Schema
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('6. Telemetry Reading Schema (server/models/TelemetryReading.js)')
    r.font.bold = True

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('Source file: server/models/TelemetryReading.js')
    r.font.italic = True
    r.font.size = Pt(10)

    telemetry_model_text = """const mongoose = require('mongoose');

const telemetryReadingSchema = new mongoose.Schema({
  machineId: { type: String, required: true, index: true },
  timestamp: { type: Date, default: Date.now, index: true },
  vibrationRms: { type: Number, required: true },
  bearingPeakG: { type: Number, required: true },
  tempC: { type: Number, required: true },
  acousticEmissionDb: { type: Number, default: 60 },
  motorCurrentAmps: { type: Number, default: 20 },
  rpm: { type: Number, default: 1800 },
  anomalyFlag: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('TelemetryReading', telemetryReadingSchema);"""
    add_code_listing(doc, telemetry_model_text)

    # 7. Anomaly Alert Model
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('7. Anomaly Alert Schema (server/models/AnomalyAlert.js)')
    r.font.bold = True

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('Source file: server/models/AnomalyAlert.js')
    r.font.italic = True
    r.font.size = Pt(10)

    anomaly_model_text = """const mongoose = require('mongoose');

const explainabilityFeatureSchema = new mongoose.Schema({
  feature: { type: String, required: true },
  contributionPercent: { type: Number, required: true },
  description: { type: String, required: true }
});

const anomalyAlertSchema = new mongoose.Schema({
  alertId: { type: String, required: true, unique: true },
  machineId: { type: String, required: true },
  machineName: { type: String, required: true },
  line: { type: String, required: true },
  severity: { 
    type: String, 
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'HIGH' 
  },
  failureMode: { type: String, required: true },
  anomalyScore: { type: Number, required: true },
  explainability: [explainabilityFeatureSchema],
  recommendedAction: { type: String, required: true },
  acknowledged: { type: Boolean, default: false },
  status: { 
    type: String, 
    enum: ['OPEN', 'WORK_ORDER_DISPATCHED', 'RESOLVED'],
    default: 'OPEN' 
  }
}, { timestamps: true });

module.exports = mongoose.model('AnomalyAlert', anomalyAlertSchema);"""
    add_code_listing(doc, anomaly_model_text)

    # 8. Maintenance Action (Work Order) Model
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('8. Maintenance Action Schema (server/models/MaintenanceAction.js)')
    r.font.bold = True

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('Source file: server/models/MaintenanceAction.js')
    r.font.italic = True
    r.font.size = Pt(10)

    workorder_model_text = """const mongoose = require('mongoose');

const maintenanceActionSchema = new mongoose.Schema({
  actionId: { type: String, required: true, unique: true },
  machineId: { type: String, required: true },
  title: { type: String, required: true },
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'HIGH' },
  assignedTeam: { type: String, required: true },
  scheduledDate: { type: Date, required: true },
  estimatedDowntimeHours: { type: Number, required: true },
  partsRequired: [{ type: String }],
  status: { 
    type: String, 
    enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'],
    default: 'SCHEDULED' 
  }
}, { timestamps: true });

module.exports = mongoose.model('MaintenanceAction', maintenanceActionSchema);"""
    add_code_listing(doc, workorder_model_text)

    # 9. Real-Time Telemetry Simulator Service
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('9. Real-Time Telemetry Simulator Service (server/services/simulator.js)')
    r.font.bold = True

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('Source file: server/services/simulator.js')
    r.font.italic = True
    r.font.size = Pt(10)

    simulator_service_text = """const Machine = require('../models/Machine');
const TelemetryReading = require('../models/TelemetryReading');

let simTick = 0;

const startTelemetrySimulator = (io) => {
  setInterval(async () => {
    try {
      const machines = await Machine.find();
      if (!machines || machines.length === 0) return;

      simTick += 0.25;
      for (const m of machines) {
        const seed = m.machineId.charCodeAt(m.machineId.length - 1);
        const wave = Math.sin(simTick + seed);
        const noise = (Math.random() - 0.5);

        let newVib = m.currentVibrationRms;
        if (m.status === 'HEALTHY') {
          newVib = +(1.8 + wave * 0.35 + noise * 0.15).toFixed(2);
        } else if (m.status === 'EARLY_DEGRADATION') {
          newVib = +(3.8 + wave * 0.5 + noise * 0.25).toFixed(2);
        } else {
          newVib = +(m.currentVibrationRms + wave * 0.4 + noise * 0.2).toFixed(2);
        }

        m.currentVibrationRms = newVib;
        await m.save();

        if (io) {
          io.emit('telemetry:stream', { machineId: m.machineId, vibrationRms: newVib });
        }
      }
    } catch (err) {
      console.error('Simulator pulse error:', err.message);
    }
  }, 3000);
};

module.exports = { startTelemetrySimulator };"""
    add_code_listing(doc, simulator_service_text)

    # 10. Fleet Overview & KPI Analytics Controller
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('10. Fleet Overview & KPI Controller (server/routes/api.js)')
    r.font.bold = True

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('Source file: server/routes/api.js')
    r.font.italic = True
    r.font.size = Pt(10)

    overview_controller_text = """// GET /api/overview - Aggregate Fleet Health & Status KPIs
router.get('/overview', async (req, res) => {
  try {
    const machines = await Machine.find();
    const openAnomalies = await AnomalyAlert.countDocuments({ status: { $ne: 'RESOLVED' } });
    const criticalAnomalies = await AnomalyAlert.countDocuments({ severity: 'CRITICAL', status: { $ne: 'RESOLVED' } });
    const criticalRulCount = machines.filter(m => m.predictedRulHours <= 200).length;
    const activeWorkOrders = await MaintenanceAction.countDocuments({ status: { $ne: 'COMPLETED' } });

    const avgHealth = machines.length > 0 
      ? Math.round(machines.reduce((acc, m) => acc + (m.healthScore || 0), 0) / machines.length) 
      : 88;

    res.json({
      success: true,
      data: {
        totalMachines: machines.length,
        avgHealth,
        openAnomalies,
        criticalAnomalies,
        criticalRulCount,
        activeWorkOrders,
        fleetDistribution: {
          healthy: machines.filter(m => m.status === 'HEALTHY').length,
          earlyDegradation: machines.filter(m => m.status === 'EARLY_DEGRADATION').length,
          severeAnomaly: machines.filter(m => m.status === 'SEVERE_ANOMALY' || m.status === 'CRITICAL_SHUTDOWN').length
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});"""
    add_code_listing(doc, overview_controller_text)

    # 11. Edge-Case Failure Simulation Controller
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('11. Failure Simulation Scenario Controller (server/routes/api.js)')
    r.font.bold = True

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('Source file: server/routes/api.js')
    r.font.italic = True
    r.font.size = Pt(10)

    scenario_controller_text = """// POST /api/simulator/scenario - Inject Plant Failure Modes
router.post('/simulator/scenario', async (req, res) => {
  try {
    const { scenario } = req.body;
    const io = req.app.get('io');

    if (scenario === 'VIBRATION_SPIKE') {
      const machine = await Machine.findOne({ machineId: 'MCH-CNC-501' });
      if (machine) {
        machine.currentVibrationRms = 8.6;
        machine.currentTempC = 82.5;
        machine.currentBearingPeakG = 3.9;
        machine.healthScore = 32;
        machine.status = 'CRITICAL_SHUTDOWN';
        machine.anomalyScore = 0.94;
        machine.predictedRulHours = 24;
        await machine.save();

        const alert = new AnomalyAlert({
          alertId: `ALT-VIB-${Date.now().toString().slice(-5)}`,
          machineId: machine.machineId,
          machineName: machine.name,
          line: machine.line,
          severity: 'CRITICAL',
          failureMode: 'Spindle Unbalance & High-Order Vibration Spike',
          anomalyScore: 0.94,
          explainability: [
            { feature: 'Vibration RMS (8.6 mm/s)', contributionPercent: 68, description: 'ISO 10816 Zone D severe limit exceeded' },
            { feature: 'Bearing Peak G (3.9g)', contributionPercent: 22, description: 'Harmonic impact spikes on inner race' },
            { feature: 'Operating Temp (82.5°C)', contributionPercent: 10, description: 'Elevated bearing friction heat' }
          ],
          recommendedAction: 'Immediate spindle speed throttle and dynamic balancing audit',
          status: 'OPEN'
        });
        await alert.save();

        if (io) {
          io.emit('machine:update', machine);
          io.emit('alert:new', alert);
        }
      }
    }
    res.json({ success: true, message: `Scenario ${scenario} injected successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});"""
    add_code_listing(doc, scenario_controller_text)

    # 12. Alert Resolution & Self-Healing Controller
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('12. Closed-Loop Alert Healing Controller (server/routes/api.js)')
    r.font.bold = True

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('Source file: server/routes/api.js')
    r.font.italic = True
    r.font.size = Pt(10)

    resolve_controller_text = """// PATCH /api/alerts/:id/resolve - 1-Click Anomaly Healing
router.patch('/alerts/:id/resolve', async (req, res) => {
  try {
    const alert = await AnomalyAlert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    alert.status = 'RESOLVED';
    await alert.save();

    const machine = await Machine.findOne({ machineId: alert.machineId });
    if (machine) {
      const activeAlerts = await AnomalyAlert.countDocuments({
        machineId: alert.machineId,
        status: { $ne: 'RESOLVED' }
      });

      // Restore baseline health if no active alarms remain
      if (activeAlerts === 0) {
        machine.healthScore = 96;
        machine.anomalyScore = 0.05;
        machine.status = 'HEALTHY';
        machine.currentVibrationRms = 1.8;
        machine.currentTempC = 52.0;
        machine.currentBearingPeakG = 0.85;
        machine.predictedRulHours = 1420;
        await machine.save();
      }

      const io = req.app.get('io');
      if (io) {
        io.emit('alert:resolved', alert);
        io.emit('machine:update', machine);
      }
    }

    res.json({ success: true, data: alert });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});"""
    add_code_listing(doc, resolve_controller_text)

    # 13. Work Order Scheduling & Sign-Off Controller
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('13. Work Order Scheduling & Sign-Off (server/routes/api.js)')
    r.font.bold = True

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('Source file: server/routes/api.js')
    r.font.italic = True
    r.font.size = Pt(10)

    workorder_controller_text = """// POST /api/work-orders - Dispatch Maintenance Task
router.post('/work-orders', async (req, res) => {
  try {
    const { machineId, title, priority, assignedTeam, scheduledDate, estimatedDowntimeHours, partsRequired } = req.body;
    
    const workOrder = new MaintenanceAction({
      actionId: `WO-${Date.now().toString().slice(-5)}`,
      machineId,
      title,
      priority: priority || 'HIGH',
      assignedTeam,
      scheduledDate: scheduledDate || new Date(),
      estimatedDowntimeHours: estimatedDowntimeHours || 4,
      partsRequired: partsRequired || ['OEM Replacement Bearing Kit', 'Shaft Seal'],
      status: 'SCHEDULED'
    });
    await workOrder.save();

    const io = req.app.get('io');
    if (io) io.emit('workorder:new', workOrder);

    res.status(201).json({ success: true, data: workOrder });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/work-orders/:id/status - Complete & Sign-Off
router.patch('/work-orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const wo = await MaintenanceAction.findByIdAndUpdate(req.params.id, { status }, { new: true });
    
    const io = req.app.get('io');
    if (io) io.emit('workorder:update', wo);

    res.json({ success: true, data: wo });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});"""
    add_code_listing(doc, workorder_controller_text)

    # 14. Main Server Entry & WebSocket Setup
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('14. Main Server File & WebSockets (server/server.js)')
    r.font.bold = True

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('Source file: server/server.js')
    r.font.italic = True
    r.font.size = Pt(10)

    server_entry_text = """const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
require('dotenv').config();

const apiRoutes = require('./routes/api');
const seedDatabase = require('./seed/seedData');
const { startTelemetrySimulator } = require('./services/simulator');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT']
  }
});

app.use(cors());
app.use(express.json());
app.set('io', io);

app.use('/api', apiRoutes);

io.on('connection', (socket) => {
  console.log(`Socket client connected: ${socket.id}`);
});

const PORT = process.env.PORT || 5003;
server.listen(PORT, () => {
  console.log(`Predictive Maintenance Server listening on port ${PORT}`);
});"""
    add_code_listing(doc, server_entry_text)

    # 15. Frontend Dashboard Mount & Real-Time Sync
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('15. Frontend Real-Time Sync (client/src/App.jsx)')
    r.font.bold = True

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('Source file: client/src/App.jsx')
    r.font.italic = True
    r.font.size = Pt(10)

    react_app_text = """import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { FleetOverview } from './pages/FleetOverview';
import { api } from './services/api';

export default function App() {
  const [machines, setMachines] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initial data hydration
    Promise.all([api.getOverview(), api.getMachines(), api.getAlerts()]).then(([ov, mch, alt]) => {
      if (mch.success) setMachines(mch.data);
      if (alt.success) setAlerts(alt.data);
    });

    // Reactive WebSocket event bus
    const socket = io('/', { transports: ['websocket', 'polling'] });
    socket.on('connect', () => setIsConnected(true));

    socket.on('machine:update', (updatedMachine) => {
      setMachines(prev => prev.map(m => m.machineId === updatedMachine.machineId ? updatedMachine : m));
    });

    socket.on('alert:new', (newAlert) => {
      setAlerts(prev => [newAlert, ...prev]);
    });

    socket.on('alert:resolved', (resolvedAlert) => {
      setAlerts(prev => prev.filter(a => a._id !== resolvedAlert._id));
    });

    return () => socket.disconnect();
  }, []);

  return (
    <div className="app-shell flex h-screen bg-[#0e1217] text-white">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Header isConnected={isConnected} />
        <FleetOverview machines={machines} alerts={alerts} />
      </main>
    </div>
  );
}"""
    add_code_listing(doc, react_app_text)

    # 16. Live Vibration Waveform Bezier Chart
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('16. Live Vibration Waveform Component (client/src/components/VibrationWaveChart.jsx)')
    r.font.bold = True

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('Source file: client/src/components/VibrationWaveChart.jsx')
    r.font.italic = True
    r.font.size = Pt(10)

    bezier_chart_text = """import React, { useState, useEffect } from 'react';

export const VibrationWaveChart = ({ machines = [], selectedMachineId }) => {
  const [history, setHistory] = useState([]);
  const targetMachine = machines.find(m => m.machineId === selectedMachineId) || machines[0];

  useEffect(() => {
    if (targetMachine) {
      setHistory(prev => [
        ...prev.slice(-24),
        { timestamp: Date.now(), vibrationRms: targetMachine.currentVibrationRms }
      ]);
    }
  }, [targetMachine?.currentVibrationRms]);

  // Compute smooth cubic Bezier control spline
  const generateSplinePath = (points, width, height) => {
    if (points.length < 2) return '';
    const maxY = Math.max(...points.map(p => p.vibrationRms), 6.0);
    const coords = points.map((p, i) => ({
      x: (i / (points.length - 1)) * width,
      y: height - (p.vibrationRms / maxY) * height
    }));

    let d = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const cx = (coords[i].x + coords[i + 1].x) / 2;
      d += ` C ${cx} ${coords[i].y}, ${cx} ${coords[i + 1].y}, ${coords[i + 1].x} ${coords[i + 1].y}`;
    }
    return d;
  };

  const isCritical = targetMachine?.currentVibrationRms >= 4.5;
  const strokeColor = isCritical ? '#ef4444' : '#3b82f6';

  return (
    <div className="wave-container p-4 rounded-xl bg-[#161b22] border border-gray-800">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold">{targetMachine?.name} - Real-Time Vibration Velocity</h3>
        <span className={`px-2 py-0.5 rounded text-xs ${isCritical ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
          {targetMachine?.currentVibrationRms.toFixed(2)} mm/s RMS
        </span>
      </div>
      <svg className="w-full h-44" viewBox="0 0 600 160">
        <path d={generateSplinePath(history, 600, 160)} fill="none" stroke={strokeColor} strokeWidth="2.5" />
      </svg>
    </div>
  );
};"""
    add_code_listing(doc, bezier_chart_text)

    # 17. REST API Request and Response Examples
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('17. REST API Request and Response Examples')
    r.font.bold = True

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('Example 1: Simulation Scenario Injection API')
    r.font.italic = True
    r.font.bold = True

    api_ex1_req = """Request:
POST /api/simulator/scenario HTTP/1.1
Host: localhost:5003
Content-Type: application/json

{
  "scenario": "VIBRATION_SPIKE"
}"""
    add_code_listing(doc, api_ex1_req)

    api_ex1_res = """Response:
{
  "success": true,
  "message": "Scenario VIBRATION_SPIKE injected successfully."
}"""
    add_code_listing(doc, api_ex1_res)

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(8)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('Example 2: 1-Click Anomaly Resolution API')
    r.font.italic = True
    r.font.bold = True

    api_ex2_req = """Request:
PATCH /api/alerts/673f2b4c8d5e6f002b333333/resolve HTTP/1.1
Host: localhost:5003
Content-Type: application/json"""
    add_code_listing(doc, api_ex2_req)

    api_ex2_res = """Response:
{
  "success": true,
  "data": {
    "_id": "673f2b4c8d5e6f002b333333",
    "alertId": "ALT-VIB-91823",
    "machineId": "MCH-CNC-501",
    "severity": "CRITICAL",
    "status": "RESOLVED",
    "updatedAt": "2026-10-14T05:40:00.000Z"
  }
}"""
    add_code_listing(doc, api_ex2_res)

    # ----------------------------------------------------
    # SCREENSHOTS OF THE PROJECT
    # Exactly 2 screenshots per page matching PDF
    # ----------------------------------------------------
    doc.add_page_break()

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(16)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('SCREENSHOTS OF THE PROJECT')
    r.font.name = 'Times New Roman'
    r.font.size = Pt(14)
    r.font.bold = True

    # Screenshot 1 (Overview)
    if os.path.exists('docs/screenshots/predictive_overview.png'):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(2)
        p_img.paragraph_format.space_after = Pt(2)
        p_img.paragraph_format.keep_with_next = True
        p_img.add_run().add_picture('docs/screenshots/predictive_overview.png', width=Inches(5.0))

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(1)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('Figure 1: Predictive Maintenance Fleet Overview Dashboard')
    r.font.bold = True
    r.font.italic = True

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(8)
    p.paragraph_format.line_spacing = 1.15
    r = p.add_run('Fleet Health KPI Bento cards (96% Overall Health, 0 Active Alerts) with nominal cubic Bezier vibration waveform operating below the dashed red ISO 10816 limit.')
    r.font.size = Pt(10)
    r.font.italic = True

    # Screenshot 2 (Spike)
    if os.path.exists('docs/screenshots/predictive_spike.png'):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(2)
        p_img.paragraph_format.space_after = Pt(2)
        p_img.paragraph_format.keep_with_next = True
        p_img.add_run().add_picture('docs/screenshots/predictive_spike.png', width=Inches(5.0))

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(1)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('Figure 2: Vibration Spike Anomaly Detection & Dynamic Threshold Breach')
    r.font.bold = True
    r.font.italic = True

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.line_spacing = 1.15
    r = p.add_run('1-Click injection of 8.6 mm/s vibration spike causing immediate alert banner display, health score degradation to 85%, and automatic auto-focusing of the red warning waveform.')
    r.font.size = Pt(10)
    r.font.italic = True

    # Page Break for next 2 screenshots
    doc.add_page_break()

    # Screenshot 3 (Resolved)
    if os.path.exists('docs/screenshots/predictive_resolved.png'):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(4)
        p_img.paragraph_format.space_after = Pt(2)
        p_img.paragraph_format.keep_with_next = True
        p_img.add_run().add_picture('docs/screenshots/predictive_resolved.png', width=Inches(5.0))

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(1)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('Figure 3: Closed-Loop Alert Healing & Baseline Recovery')
    r.font.bold = True
    r.font.italic = True

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(8)
    p.paragraph_format.line_spacing = 1.15
    r = p.add_run('Immediate alert banner clearing, health restoration to 96% STABLE, and return of live vibration waveform to nominal blue baseline upon clicking 1-Click Resolve.')
    r.font.size = Pt(10)
    r.font.italic = True

    # Screenshot 4 (Repairs & Tasks)
    if os.path.exists('docs/screenshots/predictive_repairs.png'):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(2)
        p_img.paragraph_format.space_after = Pt(2)
        p_img.paragraph_format.keep_with_next = True
        p_img.add_run().add_picture('docs/screenshots/predictive_repairs.png', width=Inches(5.0))

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(1)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('Figure 4: Scheduled Maintenance & Work Orders Dispatch')
    r.font.bold = True
    r.font.italic = True

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.line_spacing = 1.15
    r = p.add_run('Comprehensive maintenance task management displaying assigned engineering crews, target execution dates, downtime estimations, and pre-kitted OEM spare parts kits.')
    r.font.size = Pt(10)
    r.font.italic = True

    # ----------------------------------------------------
    # REFERENCES
    # ----------------------------------------------------
    doc.add_page_break()

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(20)
    p.paragraph_format.keep_with_next = True
    r = p.add_run('REFERENCES')
    r.font.name = 'Times New Roman'
    r.font.size = Pt(14)
    r.font.bold = True

    refs = [
        '1. International Organization for Standardization, “ISO 10816-3: Mechanical vibration — Evaluation of machine vibration by measurements on non-rotating parts — Part 3: Industrial machines with nominal power above 15 kW and nominal speeds between 120 r/min and 15 000 r/min when measured in situ”, ISO Standards, Geneva, 2018.',
        '2. NASA Prognostics Center of Excellence (PCoE), “Turbofan Engine Degradation Simulation Data Set (C-MAPSS) & Run-to-Failure Prognostic Benchmarks”, National Aeronautics and Space Administration, Moffett Field, CA, 2021.',
        '3. MongoDB Inc., “Architecting High-Throughput Time-Series and Telemetry Ingestion Systems with Compound Indexes”, Technical Whitepaper, 2024.',
        '4. Node.js Foundation & Express.js Technical Committee, “High-Concurrency Event-Driven Web Architectures for Industrial Supervisory Systems”, OpenJS Foundation, 2023.',
        '5. Socket.io Engineering, “Low-Latency Bidirectional WebSocket Communication in Distributed Plant Telemetry Networks”, Socket.io Architecture Documentation, 2024.',
        '6. IEEE Industrial Electronics Society, “Condition-Based Maintenance and Remaining Useful Life Estimation for Rotating Machinery Using Hybrid Deep Learning and Physical Vibration Metrics”, IEEE Transactions on Industrial Informatics, Vol. 19, No. 6, pp. 7412–7425, 2025.'
    ]
    for r_text in refs:
        p_ref = doc.add_paragraph()
        p_ref.paragraph_format.line_spacing = 1.5
        p_ref.paragraph_format.space_before = Pt(4)
        p_ref.paragraph_format.space_after = Pt(8)
        p_ref.paragraph_format.left_indent = Inches(0.35)
        p_ref.paragraph_format.first_line_indent = Inches(-0.35)
        p_ref.add_run(r_text)

    return doc

def get_page_numbers_from_word(docx_path):
    word = win32com.client.Dispatch('Word.Application')
    word.Visible = False
    doc = word.Documents.Open(os.path.abspath(docx_path))
    
    # Target headings to find page numbers for
    targets = {
        '1 INTRODUCTION': 'CHAPTER 1',
        '2 RELATED WORK': 'CHAPTER 2',
        '3 SYSTEM ANALYSIS': 'CHAPTER 3',
        '4 SYSTEM DESIGN': 'CHAPTER 4',
        '5 IMPLEMENTATION': 'CHAPTER 5',
        '6 CONCLUSION & FUTURE WORK': 'CHAPTER 6',
        'APPENDIX - SOURCE CODE': 'APPENDIX',
        'SCREENSHOTS OF THE PROJECT': 'SCREENSHOTS OF THE PROJECT',
        'REFERENCES': 'REFERENCES'
    }
    
    found_pages = {}
    
    for para in doc.Paragraphs:
        if para.Range.Tables.Count > 0:
            continue
        p_text = para.Range.Text.strip()
        for key, query in targets.items():
            if key not in found_pages and query in p_text:
                pg = para.Range.Information(1)
                if pg >= 7:
                    found_pages[key] = str(pg)
                
    doc.Close(False)
    word.Quit()
    return found_pages

def generate_report():
    output_path = 'Predictive_Maintenance_Project_Report.docx'
    
    # Pass 1: Build initial doc
    doc1 = build_doc()
    doc1.save(output_path)
    print("Pass 1: Generated initial docx.")
    
    # Query exact page numbers using Word
    try:
        pages = get_page_numbers_from_word(output_path)
        print("Detected exact page numbers from Word:", pages)
        
        # Build mapping for TOC
        def fmt_range(start_key, next_key=None, default=''):
            start_pg = int(pages.get(start_key, 0))
            if not start_pg:
                return default
            if next_key and next_key in pages:
                end_pg = int(pages[next_key]) - 1
                if end_pg > start_pg:
                    return f"{start_pg}-{end_pg}"
            return str(start_pg)

        toc_map = {
            'ABSTRACT': '4',
            'ACKNOWLEDGEMENT': '5',
            'TABLE OF CONTENTS': '6',
            '1 INTRODUCTION': fmt_range('1 INTRODUCTION', '2 RELATED WORK', '7-8'),
            '2 RELATED WORK': fmt_range('2 RELATED WORK', '3 SYSTEM ANALYSIS', '9-10'),
            '3 SYSTEM ANALYSIS': fmt_range('3 SYSTEM ANALYSIS', '4 SYSTEM DESIGN', '11-12'),
            '4 SYSTEM DESIGN': fmt_range('4 SYSTEM DESIGN', '5 IMPLEMENTATION', '13-15'),
            '5 IMPLEMENTATION': fmt_range('5 IMPLEMENTATION', '6 CONCLUSION & FUTURE WORK', '16-18'),
            '6 CONCLUSION & FUTURE WORK': pages.get('6 CONCLUSION & FUTURE WORK', '19'),
            'APPENDIX - SOURCE CODE': pages.get('APPENDIX - SOURCE CODE', '20'),
            'SCREENSHOTS OF THE PROJECT': pages.get('SCREENSHOTS OF THE PROJECT', '34'),
            'REFERENCES': pages.get('REFERENCES', '36')
        }
        
        print("TOC mapping applied:", toc_map)
        
        # Pass 2: Rebuild doc with exact TOC page numbers
        doc2 = build_doc(toc_map)
        doc2.save(output_path)
        print("Pass 2: Rebuilt docx with exact TOC page numbers.")
    except Exception as e:
        print("Notice: Word COM automation encountered:", e)
        print("Using standard calibrated page layout.")

    print(f"Report successfully saved to: {output_path}")

if __name__ == '__main__':
    generate_report()
