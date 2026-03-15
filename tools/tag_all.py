#!/usr/bin/env python3
"""Tag all HTML pages with data-i18n attributes"""
import re, os

BASE = ''

def s(content, old, new):
    """Simple string replace — one occurrence"""
    if old not in content:
        print(f'  WARN: not found: {old[:60]}')
    return content.replace(old, new, 1)

def tag_div(content, cls, text, key):
    old = f'<div class="{cls}">{text}</div>'
    new = f'<div class="{cls}" data-i18n="{key}">{text}</div>'
    return s(content, old, new)

def tag_li(content, text, key):
    old = f'<li>{text}</li>'
    new = f'<li data-i18n="{key}">{text}</li>'
    return s(content, old, new)

def tag_span(content, cls, text, key):
    old = f'<span class="{cls}">{text}</span>'
    new = f'<span class="{cls}" data-i18n="{key}">{text}</span>'
    return s(content, old, new)

def tag_btn(content, text, key, extra=''):
    old = f'<button class="filter-btn{extra}">{text}</button>'
    new = f'<button class="filter-btn{extra}" data-i18n="{key}">{text}</button>'
    return s(content, old, new)

def tag_label(content, text, key):
    old = f'<label class="form-label">{text}</label>'
    new = f'<label class="form-label" data-i18n="{key}">{text}</label>'
    return s(content, old, new)

# ══════════════════════════════════════════════
# EXPERIENCE.HTML
# ══════════════════════════════════════════════
with open(f'{BASE}/experience.html') as f:
    exp = f.read()

# Job roles
exp = tag_div(exp, 'tl-role', 'AI Community Lead', 'exp.j1.role')
exp = tag_div(exp, 'tl-role', 'Founder & Chief Executive Officer', 'exp.j2.role')
exp = tag_div(exp, 'tl-role', 'Artificial Intelligence Engineer — Manufacturing', 'exp.j3.role')
exp = tag_div(exp, 'tl-role', 'Machine Learning Engineer', 'exp.j4.role')
exp = tag_div(exp, 'tl-role', 'Teaching Assistant — ML, Big Data, Web, C, Databases', 'exp.j5.role')
exp = tag_div(exp, 'tl-role', 'Co-Founder &amp; Lead — Large-Scale Cybersecurity Projects', 'exp.j6.role')
exp = exp.replace('<div class="tl-role">Co-Founder & Lead — Large-Scale Cybersecurity Projects</div>',
                  '<div class="tl-role" data-i18n="exp.j6.role">Co-Founder & Lead — Large-Scale Cybersecurity Projects</div>')

# Job descriptions
exp = s(exp, '<div class="tl-desc">Building and leading initiatives that empower aspiring and professional AI practitioners across Indonesia.</div>',
             '<div class="tl-desc" data-i18n="exp.j1.desc">Building and leading initiatives that empower aspiring and professional AI practitioners across Indonesia.</div>')
exp = s(exp, '<div class="tl-desc">IT Consulting that prepares digital talent for the AI world through project-based and open-source initiatives. Focused on AI for Culture, Healthcare, and Wellness.</div>',
             '<div class="tl-desc" data-i18n="exp.j2.desc">IT Consulting that prepares digital talent for the AI world through project-based and open-source initiatives. Focused on AI for Culture, Healthcare, and Wellness.</div>')
exp = s(exp, "<div class=\"tl-desc\">Spearheaded AI-driven automation and optimization in one of Indonesia's largest pharmaceutical companies.</div>",
             '<div class="tl-desc" data-i18n="exp.j3.desc">Spearheaded AI-driven automation and optimization in one of Indonesia\'s largest pharmaceutical companies.</div>')
exp = s(exp, '<div class="tl-desc">Joined forces with nearly a dozen third-party companies and institutions to integrate innovative AI solutions.</div>',
             '<div class="tl-desc" data-i18n="exp.j4.desc">Joined forces with nearly a dozen third-party companies and institutions to integrate innovative AI solutions.</div>')
exp = s(exp, '<div class="tl-desc">Four-semester series of teaching roles spanning ML, Big Data Analytics, Web Programming, and C Programming Language.</div>',
             '<div class="tl-desc" data-i18n="exp.j5.desc">Four-semester series of teaching roles spanning ML, Big Data Analytics, Web Programming, and C Programming Language.</div>')
exp = s(exp, '<div class="tl-desc">Led a large-scale collaborative cybersecurity project involving contributors across Indonesia, exploring both offensive and defensive security strategies.</div>',
             '<div class="tl-desc" data-i18n="exp.j6.desc">Led a large-scale collaborative cybersecurity project involving contributors across Indonesia, exploring both offensive and defensive security strategies.</div>')

# Bullets j1
exp = tag_li(exp, 'Created collaborative AI ecosystems through hands-on workshops and study groups', 'exp.j1.b1')
exp = tag_li(exp, 'Led open-source projects connecting Indonesian AI practitioners', 'exp.j1.b2')
exp = tag_li(exp, 'Established strategic partnerships across the region', 'exp.j1.b3')
# Bullets j2
exp = tag_li(exp, 'Built 10 specialized Houses: Bioinformatics, Computer Vision, Competition Team, Data Engineer, Data Science, Expert System, Generative AI, Machine Learning, NLP, UI/UX', 'exp.j2.b1')
exp = tag_li(exp, 'Delivered 20+ projects and 2 main AI products with production-level deployment', 'exp.j2.b2')
exp = tag_li(exp, 'Held 5 Exclusive Classes and mentored competition teams to national finals', 'exp.j2.b3')
# Bullets j3
exp = tag_li(exp, 'Automated defect detection on aluminum packaging using advanced Computer Vision techniques', 'exp.j3.b1')
exp = tag_li(exp, 'Built Health Lifestyle Recommendation System using LightFM and Surprise — featured at National Data Science Tournament', 'exp.j3.b2')
exp = tag_li(exp, 'Developed energy optimization strategies for spray dryers using Computational Fluid Dynamics + ML with Large Eddy Simulation', 'exp.j3.b3')
exp = tag_li(exp, 'Predicted moisture content in milk production using LSTM, XGBoost, and decision trees', 'exp.j3.b4')
exp = tag_li(exp, 'Collaborated on genomic data analysis at NutrigenMe for personalized health solutions', 'exp.j3.b5')
exp = tag_li(exp, 'Reproduced Reynolds-Averaged Navier-Stokes (RANS) simulation code from literature', 'exp.j3.b6')
# Bullets j4
exp = tag_li(exp, "Collaborated closely with external partners to integrate ML innovations into X's platform", 'exp.j4.b1')
exp = tag_li(exp, "Expanded X's technology reach through dynamic ecosystem of innovation", 'exp.j4.b2')
exp = tag_li(exp, 'Delivered cross-organizational projects combining AI and platform engineering', 'exp.j4.b3')
# Bullets j5
exp = tag_li(exp, 'Taught Machine Learning and Advanced Databases to 40+ students per subject (Feb–Jun 2024)', 'exp.j5.b1')
exp = tag_li(exp, 'Taught Big Data, Data Analytics, and Machine Learning in Python + RapidMiner (Feb–Jun 2023)', 'exp.j5.b2')
exp = tag_li(exp, 'Taught big data concepts to 170+ students using SQL, RapidMiner, Python (Sep 2022–Jan 2023)', 'exp.j5.b3')
exp = tag_li(exp, 'Taught C Programming for Data Science to private group of 20 students (Sep 2021–Jan 2022)', 'exp.j5.b4')
exp = tag_li(exp, 'Correlated Big Data with International Relations for policy-informed decision-making', 'exp.j5.b5')
# Bullets j6
exp = tag_li(exp, 'Developed virus scripts for system security testing and vulnerability awareness', 'exp.j6.b1')
exp = tag_li(exp, 'Designed activities: "System Security Testing via Offensive/Defensive Strategies," "Defacement &amp; Countermeasures," "DDoS/DoS Simulation"', 'exp.j6.b2')
exp = tag_li(exp, 'Promoted collaborative learning on analyzing and securing systems from cyber threats', 'exp.j6.b3')

with open(f'{BASE}/experience.html', 'w') as f:
    f.write(exp)
print('✓ experience.html')


# ══════════════════════════════════════════════
# PROJECTS.HTML
# ══════════════════════════════════════════════
with open(f'{BASE}/projects.html') as f:
    proj = f.read()

# Filter buttons
proj = proj.replace('<button class="filter-btn active" data-filter="all">All</button>',
                    '<button class="filter-btn active" data-filter="all" data-i18n="proj.filter.all">All</button>')
proj = proj.replace('<button class="filter-btn" data-filter="nlp">NLP / LLM</button>',
                    '<button class="filter-btn" data-filter="nlp" data-i18n="proj.filter.nlp">NLP / LLM</button>')
proj = proj.replace('<button class="filter-btn" data-filter="cv">Computer Vision</button>',
                    '<button class="filter-btn" data-filter="cv" data-i18n="proj.filter.cv">Computer Vision</button>')
proj = proj.replace('<button class="filter-btn" data-filter="health">Healthcare</button>',
                    '<button class="filter-btn" data-filter="health" data-i18n="proj.filter.health">Healthcare</button>')
proj = proj.replace('<button class="filter-btn" data-filter="culture">Culture</button>',
                    '<button class="filter-btn" data-filter="culture" data-i18n="proj.filter.culture">Culture</button>')
proj = proj.replace('<button class="filter-btn" data-filter="mfg">Manufacturing</button>',
                    '<button class="filter-btn" data-filter="mfg" data-i18n="proj.filter.mfg">Manufacturing</button>')
proj = proj.replace('<button class="filter-btn" data-filter="web3">Web3</button>',
                    '<button class="filter-btn" data-filter="web3" data-i18n="proj.filter.web3">Web3</button>')

# Card tags (bc-tag)
proj = tag_span(proj, 'bc-tag', 'Flagship · Multimodal AI', 'proj.p1.tag')
proj = tag_span(proj, 'bc-tag', 'NLP · OCR', 'proj.p2.tag')
proj = tag_span(proj, 'bc-tag', 'Foundation Model', 'proj.p3.tag')
proj = proj.replace('<span class="bc-tag" data-i18n="proj.p3.tag">Foundation Model</span>\n      <div class="bc-num">2B</div>',
                    '<span class="bc-tag" data-i18n="proj.p4.tag">Foundation Model</span>\n      <div class="bc-num">2B</div>', 1)
proj = tag_span(proj, 'bc-tag', 'Web3 · Cultural', 'proj.p5.tag')
proj = tag_span(proj, 'bc-tag', 'Railway · Safety', 'proj.p7.tag')
proj = tag_span(proj, 'bc-tag', 'Healthcare · NLP', 'proj.p8.tag')
proj = tag_span(proj, 'bc-tag', 'Healthcare · LLM', 'proj.p9.tag')
proj = tag_span(proj, 'bc-tag', 'Manufacturing · CFD', 'proj.p10.tag')
proj = tag_span(proj, 'bc-tag', 'Manufacturing · ML', 'proj.p11.tag')
proj = tag_span(proj, 'bc-tag', 'Audio · AI', 'proj.p12.tag')
proj = tag_span(proj, 'bc-tag', 'Health · RecSys', 'proj.p13.tag')
proj = tag_span(proj, 'bc-tag', 'CV · Edge AI', 'proj.p15.tag')
proj = tag_span(proj, 'bc-tag', 'Data Science · Policy', 'proj.p16.tag')
proj = tag_span(proj, 'bc-tag', 'MLOps · Python', 'proj.p17.tag')
proj = tag_span(proj, 'bc-tag', 'Medical AI · NVIDIA', 'proj.p18.tag')

# Card descs — Arutala big desc
proj = s(proj,
    '        Full multimodal AI learning environment for Indonesian local languages. Integrates LLM and VLM pipelines with 21 regional personas via Dialekta v1.0. Includes the ARUNA 7B and DIALEKTA 2B foundation models, and is powered by the SABDA algorithm for script intelligence.\n      ',
    '        <span data-i18n="proj.p1.desc">Full multimodal AI learning environment for Indonesian local languages. Integrates LLM and VLM pipelines with 21 regional personas via Dialekta v1.0. Includes the ARUNA 7B and DIALEKTA 2B foundation models, and is powered by the SABDA algorithm for script intelligence.</span>\n      ')

for (txt, key) in [
    ('CNN-based OCR for Indonesian indigenous Nusantara scripts. Powers Arutala Aksara with 600K+ users. Presented at Sorcery Gathering 4.0 & 5.0.', 'proj.p2.desc'),
    ('LLM foundation model for Indonesian local languages and dialects. Core infrastructure of the Arutala ecosystem.', 'proj.p3.desc'),
    ('Foundation model specialized for Indonesian dialect understanding and generation. 21 communication personas.', 'proj.p4.desc'),
    ('Web3 &amp; NFT-based Cultural Learn-to-Earn application. Presented at Garuda Hacks 2025.', 'proj.p5.desc'),
    ('Construction site app with face recognition attendance, safety gear detection, and real-time CCTV monitoring.', 'proj.p6.desc'),
    ('Monitoring Safety and Railway Navigation system. Presented to PT. KAI (Indonesia Railway Company) 2025.', 'proj.p7.desc'),
    ('Machine Learning-driven drug recommendation system for healthcare in a multilingual environment. Features multilingual NLP for patient interaction and personalized treatment pathways.', 'proj.p8.desc'),
    ('LSTM and BERT-powered health consultation system with diagnostic conversation flow. Presented at Final Thesis Defence and MIT Hacking Medicine 2023 (2nd Place).', 'proj.p9.desc'),
    ('Energy optimization for industrial spray dryers using CFD, TFLSTM, Large Eddy Simulation. Kalbe Farma.', 'proj.p10.desc'),
    ('Predicted moisture content in pharmaceutical milk production with LSTM, XGBoost, and decision trees. Kalbe Farma.', 'proj.p11.desc'),
    ('Audio restoration for reconstructing traditional instruments of the Yogyakarta Palace Guard. Javanese Cultural Symposium 2024.', 'proj.p12.desc'),
    ('Built with LightFM and Surprise collaborative filtering. Featured in Indonesia National Data Science Tournament. Personalized health and fitness recommendations at scale.', 'proj.p13.desc'),
    ('Multi-task classification of safety equipment and helmet color using ResNet-15. Real-time worksite safety enforcement.', 'proj.p14.desc'),
    ('Cat face recognition using HOG feature extraction + KNN classifier for automated feeding system.', 'proj.p15.desc'),
    ('Route data correlation for agriculture partnerships in Magelang, Central Java. Food security insights.', 'proj.p16.desc'),
    ('Benchmarking threading, multiprocessing, and async execution for large-scale model pipelines.', 'proj.p17.desc'),
    ('Neural network approach for optimizing Dose-Volume Histogram and radiomic evaluation from IMRT radiotherapy. Final project at NVIDIA × UGM scholarship.', 'proj.p18.desc'),
]:
    old = f'<div class="bc-desc">{txt}</div>'
    new = f'<div class="bc-desc" data-i18n="{key}">{txt}</div>'
    proj = s(proj, old, new)
    # also handle whitespace variant
    old2 = f'<div class="bc-desc" style="font-size:14px;line-height:1.75;max-width:460px;">'
    # handled separately below

with open(f'{BASE}/projects.html', 'w') as f:
    f.write(proj)
print('✓ projects.html')


# ══════════════════════════════════════════════
# ACHIEVEMENTS.HTML
# ══════════════════════════════════════════════
with open(f'{BASE}/achievements.html') as f:
    ach = f.read()

# Section labels
ach = s(ach, '<p class="s-label reveal">Awards &amp; Grants</p>', '<p class="s-label reveal" data-i18n="ach.cat.awards">Awards &amp; Grants</p>')
ach = s(ach, '<p class="s-label reveal">Academic</p>', '<p class="s-label reveal" data-i18n="ach.cat.academic">Academic</p>')
ach = s(ach, '<p class="s-label reveal">Public Speaking</p>', '<p class="s-label reveal" data-i18n="ach.cat.speaking">Public Speaking</p>')
ach = s(ach, '<h2 class="s-title reveal">Recognition</h2>', '<h2 class="s-title reveal" data-i18n="ach.h.recognition">Recognition</h2>')
ach = s(ach, '<h2 class="s-title reveal">Education</h2>', '<h2 class="s-title reveal" data-i18n="ach.h.education">Education</h2>')
ach = s(ach, '<h2 class="s-title reveal">Talks &amp; Seminars</h2>', '<h2 class="s-title reveal" data-i18n="ach.h.talks">Talks &amp; Seminars</h2>')

# Award descs
for (txt, key) in [
    ('Awardee for AI Development 2025. Funding the development of ARUNA 7B, DIALEKTA 2B, and the Arutala multimodal AI ecosystem.', 'ach.a1.desc'),
    ('Multi-year grant for Certifications Program 2025–2027. Funding AI education and training programs across Indonesia.', 'ach.a2.desc'),
    ('MIT Regional Entrepreneurship Acceleration Programme. Competed among global AI startups.', 'ach.a3.desc'),
    ('Selected by Circle 8 among top Southeast Asian AI startups.', 'ach.a4.desc'),
    ('By Startup Bandung and School of Business and Management ITB.', 'ach.a5.desc'),
    ('Upstream: Pharmaceutical and Biotechnology Track.', 'ach.a6.desc'),
    ('8th International Conference on Pharmacy &amp; Advanced Pharmaceutical Sciences.', 'ach.a7.desc'),
    ('International AI competition held in Zagreb, Croatia during ERASMUS+ exchange.', 'ach.a8.desc'),
    ('University Zagreb, Croatia. Acceptance rate 1:250 (0.4%). Fully funded exchange program.', 'ach.a9.desc'),
    ('International Big Data Ideathon Competition.', 'ach.a10.desc'),
    ('By DPP PKB (National Awakening Party) Indonesia 2025.', 'ach.a11.desc'),
]:
    old = f'<div class="ach-desc">{txt}</div>'
    new = f'<div class="ach-desc" data-i18n="{key}">{txt}</div>'
    ach = s(ach, old, new)

# Education degree info
for (txt, key) in [
    ('Pre-Doctor of Philosophy', 'ach.edu1.deg'),
    ('Computational Science and Engineering · Boston, USA<br>Research: Computer Vision, Computational Optimization', 'ach.edu1.info'),
    ('Bachelor of Computer Science (S.Kom)', 'ach.edu2.deg'),
    ('Informatics · Yogyakarta, Indonesia<br>Minor: Artificial Intelligence and Smart System', 'ach.edu2.info'),
    ('Bachelor of Science (Hons) — Analytical Economics', 'ach.edu3.deg'),
    ('Kuala Lumpur, Malaysia · Electives: Public Finance', 'ach.edu3.info'),
]:
    for cls in ['edu-deg', 'edu-info']:
        old = f'<div class="{cls}">{txt}</div>'
        new = f'<div class="{cls}" data-i18n="{key}">{txt}</div>'
        if old in ach:
            ach = s(ach, old, new)
            break

with open(f'{BASE}/achievements.html', 'w') as f:
    f.write(ach)
print('✓ achievements.html')


# ══════════════════════════════════════════════
# EDUCATION.HTML
# ══════════════════════════════════════════════
with open(f'{BASE}/education.html') as f:
    edu = f.read()

# Detail label-value pairs
for (lbl, key) in [
    ('Research Area', 'edu.lbl.ra'), ('Program', 'edu.lbl.program'), ('Status', 'edu.lbl.status'),
    ('Notable', 'edu.lbl.notable'), ('Major', 'edu.lbl.major'), ('Minor', 'edu.lbl.minor'),
    ('Duration', 'edu.lbl.duration'), ('Role', 'edu.lbl.role'), ('Field', 'edu.lbl.field'),
    ('Electives', 'edu.lbl.electives'), ('Country', 'edu.lbl.country'), ('Honors', 'edu.lbl.honors'),
    ('Exchange Type', 'edu.lbl.exchange'), ('Focus', 'edu.lbl.focus'), ('Credits', 'edu.lbl.credits'),
]:
    old = f'<div class="detail-label">{lbl}</div>'
    new = f'<div class="detail-label" data-i18n="{key}">{lbl}</div>'
    edu = edu.replace(old, new)

# Detail values
for (val, key) in [
    ('Computer Vision, Computational Optimization', 'edu.e1.ra'),
    ('Computational Science &amp; Engineering', 'edu.e1.prog'),
    ('Currently Enrolled', 'edu.e1.status'),
    ('4th Place MIT REAP 2025', 'edu.e1.notable'),
    ('Informatics', 'edu.e2.major'),
    ('AI &amp; Smart Systems', 'edu.e2.minor'),
    ('2020 — 2025', 'edu.e2.dur'),
    ('Teaching Assistant (4 semesters)', 'edu.e2.role'),
    ('Analytical Economics', 'edu.e3.field'),
    ('Public Finance', 'edu.e3.electives'),
    ('Malaysia', 'edu.e3.country'),
    ('Bachelor with Honours', 'edu.e3.honors'),
]:
    old = f'<div class="detail-value">{val}</div>'
    new = f'<div class="detail-value" data-i18n="{key}">{val}</div>'
    edu = edu.replace(old, new)

# Degree types
for (txt, key) in [
    ('Pre-Doctoral Research', 'edu.e1.type'),
    ("Bachelor's Degree", 'edu.e2.type'),
    ("Bachelor's Degree (Honours)", 'edu.e3.type'),
]:
    for cls in ['edu-type', 'deg-type']:
        old = f'<div class="{cls}">{txt}</div>'
        new = f'<div class="{cls}" data-i18n="{key}">{txt}</div>'
        if old in edu:
            edu = edu.replace(old, new)
            break

# Highlight bullets
for (txt, key) in [
    ('Research in Computer Vision and Computational Optimization at the frontier of AI', 'edu.e1.h1'),
    ('4th Place at MIT Regional Entrepreneurship Acceleration Programme (REAP) 2025', 'edu.e1.h2'),
    ('Collaborating with global researchers on low-resource language AI systems', 'edu.e1.h3'),
    ("Building on MIT's framework for Computational Science with AI for social impact", 'edu.e1.h4'),
    ('Teaching Assistant for Machine Learning, Big Data, Databases, and Web Programming', 'edu.e2.h1'),
    ('Taught 170+ students across multiple disciplines and cohorts', 'edu.e2.h2'),
    ('Final thesis: Health Consultation Chatbot using LSTM and BERT — presented at MIT Hacking Medicine 2023', 'edu.e2.h3'),
    ('Capstone projects: ResNet-15 safety classification, Dota 2 MLP classification, Cat Face Recognition', 'edu.e2.h4'),
    ('Interdisciplinary degree bridging AI and economic analysis for policy formulation', 'edu.e3.h1'),
    ('Applied big data concepts correlated with topics in International Relations', 'edu.e3.h2'),
    ('Presentation at UN Statistics Division (UNSD) International Conference on Big Data 2022', 'edu.e3.h3'),
]:
    old = f'<li>{txt}</li>'
    new = f'<li data-i18n="{key}">{txt}</li>'
    edu = edu.replace(old, new)

with open(f'{BASE}/education.html', 'w') as f:
    f.write(edu)
print('✓ education.html')


# ══════════════════════════════════════════════
# TALKS.HTML
# ══════════════════════════════════════════════
with open(f'{BASE}/talks.html') as f:
    talks = f.read()

# Stat labels
for (txt, key) in [
    ('Seminars', 'talks.stat.seminars'), ('Workshops', 'talks.stat.workshops'),
    ('Public Lectures', 'talks.stat.lectures'), ('Judge Panels', 'talks.stat.judge'),
    ('Mentor Roles', 'talks.stat.mentor'),
]:
    old = f'<div class="stat-label">{txt}</div>'
    new = f'<div class="stat-label" data-i18n="{key}">{txt}</div>'
    talks = talks.replace(old, new)

# Badge labels
for (txt, key) in [
    ('Keynote', 'talks.badge.keynote'), ('Speaker', 'talks.badge.speaker'),
    ('Panelist', 'talks.badge.panelist'), ('Judge', 'talks.badge.judge'),
    ('Mentor', 'talks.badge.mentor'),
]:
    old = f'<span class="talk-badge">{txt}</span>'
    new = f'<span class="talk-badge" data-i18n="{key}">{txt}</span>'
    talks = talks.replace(old, new)

# Section headers
for (txt, key) in [
    ('Seminars', 'talks.sec.seminars'), ('Workshops', 'talks.sec.workshops'),
    ('Public Lectures', 'talks.sec.lectures'),
]:
    old = f'<div class="talks-section-title">{txt}</div>'
    new = f'<div class="talks-section-title" data-i18n="{key}">{txt}</div>'
    talks = talks.replace(old, new)

# Count badges
old = '<div class="talks-count">30 Talks</div>'
talks = talks.replace(old, '<div class="talks-count" data-i18n="talks.count.seminars">30 Talks</div>')

with open(f'{BASE}/talks.html', 'w') as f:
    f.write(talks)
print('✓ talks.html')


# ══════════════════════════════════════════════
# CONTACT.HTML
# ══════════════════════════════════════════════
with open(f'{BASE}/contact.html') as f:
    con = f.read()

# Labels
con = s(con, '<p class="contact-label">Get in Touch</p>', '<p class="contact-label" data-i18n="con.label">Get in Touch</p>')
con = s(con, "<p class=\"contact-text\">Whether it's a research collaboration, AI project, speaking invitation, mentoring opportunity, or just a conversation about technology and culture — I'd love to hear from you.</p>",
             '<p class="contact-text" data-i18n="con.text">Whether it\'s a research collaboration, AI project, speaking invitation, mentoring opportunity, or just a conversation about technology and culture — I\'d love to hear from you.</p>')

# Contact link labels
for (txt, key) in [
    ('Email', 'con.lbl.email'), ('Phone / WhatsApp', 'con.lbl.phone'),
    ('Location', 'con.lbl.location'), ('Academic', 'con.lbl.academic'),
    ('Company', 'con.lbl.company'),
]:
    old = f'<div class="c-link-label">{txt}</div>'
    new = f'<div class="c-link-label" data-i18n="{key}">{txt}</div>'
    con = con.replace(old, new)

# Contact link values  
con = s(con, '<div class="c-link-val">MIT · Pre-PhD Computational Science</div>',
             '<div class="c-link-val" data-i18n="con.val.academic">MIT · Pre-PhD Computational Science</div>')
con = s(con, '<div class="c-link-val">CEO, PT. Data Sorcerers Indonesia</div>',
             '<div class="c-link-val" data-i18n="con.val.company">CEO, PT. Data Sorcerers Indonesia</div>')

# Form
con = s(con, '<div class="form-title">Send a Message</div>', '<div class="form-title" data-i18n="con.form.title">Send a Message</div>')
con = s(con, "<div class=\"form-sub\">Fill out the form below and I'll get back to you within 24 hours.</div>",
             '<div class="form-sub" data-i18n="con.form.sub">Fill out the form below and I\'ll get back to you within 24 hours.</div>')
con = tag_label(con, 'First Name', 'con.form.fname')
con = tag_label(con, 'Last Name', 'con.form.lname')
con = tag_label(con, 'Email', 'con.form.email')
con = tag_label(con, 'Organization', 'con.form.org')
con = tag_label(con, 'Subject', 'con.form.subject')
con = tag_label(con, 'Message', 'con.form.msg')
con = s(con, '<button class="form-btn" onclick="handleSubmit()">Send Message →</button>',
             '<button class="form-btn" onclick="handleSubmit()" data-i18n="con.form.btn">Send Message →</button>')
con = s(con, '<div class="form-success-title">Message Sent!</div>',
             '<div class="form-success-title" data-i18n="con.form.sent">Message Sent!</div>')
con = s(con, "<div class=\"form-success-text\">Thank you for reaching out. I'll respond within 24 hours at Rianari990@gmail.com</div>",
             '<div class="form-success-text" data-i18n="con.form.thanks">Thank you for reaching out. I\'ll respond within 24 hours at Rianari990@gmail.com</div>')

# Quick links
con = s(con, '<a href="projects.html" class="q-link">View Projects →</a>', '<a href="projects.html" class="q-link" data-i18n="con.ql.projects">View Projects →</a>')
con = s(con, '<a href="experience.html" class="q-link">Experience →</a>', '<a href="experience.html" class="q-link" data-i18n="con.ql.exp">Experience →</a>')
con = s(con, '<a href="achievements.html" class="q-link">Achievements →</a>', '<a href="achievements.html" class="q-link" data-i18n="con.ql.ach">Achievements →</a>')
con = s(con, '<a href="skills.html" class="q-link">Skills →</a>', '<a href="skills.html" class="q-link" data-i18n="con.ql.skills">Skills →</a>')

with open(f'{BASE}/contact.html', 'w') as f:
    f.write(con)
print('✓ contact.html')

print('\nAll pages tagged successfully!')