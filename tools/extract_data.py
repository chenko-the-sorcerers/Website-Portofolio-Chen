"""
extract_data.py
───────────────
Membuat file data/*.json dari data yang sudah ada di HTML.
Data diisi manual berdasarkan konten asli HTML — tidak di-parse otomatis
karena HTML asli tidak punya struktur yang konsisten.

Cara pakai:
  python extract_data.py

Output: folder data/ berisi JSON per halaman.
"""

import os, json

os.makedirs("data", exist_ok=True)

# ══════════════════════════════════════════════════════════════
# PROJECTS
# ══════════════════════════════════════════════════════════════
projects = [
  {
    "id": "arutala",
    "title": "Arutala v2.2 — Multimodal AI Ecosystem",
    "tags": ["nlp", "culture"],
    "badges": ["LLM", "VLM", "Multimodal", "NLP", "Cultural AI"],
    "icon": "🌐",
    "size": "featured",
    "desc": "Full multimodal AI learning environment for Indonesian local languages. Integrates LLM and VLM pipelines with 21 regional personas via Dialekta v1.0. Includes the ARUNA 7B and DIALEKTA 2B foundation models, and is powered by the SABDA algorithm for script intelligence."
  },
  {
    "id": "indollnet",
    "title": "IndoLLNet v2.1",
    "tags": ["cv", "culture"],
    "badges": ["CNN", "OCR", "Computer Vision"],
    "icon": "📜",
    "size": "normal",
    "desc": "Novel CNN architecture for Indonesian indigenous Nusantara script recognition. Enables handwritten character recognition for ancient scripts. Powers the Arutala Aksara app with 600K+ users. Presented at 10+ academic and industry panels."
  },
  {
    "id": "aruna",
    "title": "ARUNA 7B & DIALEKTA 2B",
    "tags": ["nlp", "culture"],
    "badges": ["Foundation Model", "7B params", "Low-resource"],
    "icon": "🤖",
    "size": "normal",
    "desc": "Foundation language models purpose-built for Indonesian local languages and dialects. ARUNA at 7B parameters handles broad linguistic understanding; DIALEKTA 2B specialises in regional dialect generation and conversation."
  },
  {
    "id": "mandala",
    "title": "MANDALA",
    "tags": ["cv", "mfg"],
    "badges": ["IoT", "Safety", "Computer Vision"],
    "icon": "🚆",
    "size": "normal",
    "desc": "Monitoring Safety and Railway Navigation system. Presented to PT. KAI (Indonesia Railway Company) 2025 for national railway infrastructure safety and real-time hazard detection."
  },
  {
    "id": "sabdarana",
    "title": "SABDARANA",
    "tags": ["web3", "culture"],
    "badges": ["Web3", "NFT", "Blockchain"],
    "icon": "⛓️",
    "size": "normal",
    "desc": "Web3 & NFT-based Cultural Learn-to-Earn application. Preserving Nusantara heritage through blockchain incentives and gamified cultural education. Presented at Garuda Hacks 2025."
  },
  {
    "id": "kerti-kawista",
    "title": "KERTI KAWISTA",
    "tags": ["cv"],
    "badges": ["Face Recognition", "Safety", "CCTV"],
    "icon": "🏗️",
    "size": "normal",
    "desc": "Construction site presence app with facial recognition attendance, safety gear validation, and real-time CCTV monitoring. Presented at Garuda Hacks 2023."
  },
  {
    "id": "defect-detection",
    "title": "Aluminium Defect Detection",
    "tags": ["cv", "mfg"],
    "badges": ["Computer Vision", "Manufacturing", "Quality Control"],
    "icon": "🔬",
    "size": "normal",
    "desc": "Automated defect detection in aluminium packaging using Computer Vision at PT. Kalbe Farma. Reduced manual inspection time significantly and improved product quality consistency."
  },
  {
    "id": "lightfm",
    "title": "LightFM Health Recommender",
    "tags": ["health", "nlp"],
    "badges": ["Recommendation System", "Healthcare", "ML"],
    "icon": "💊",
    "size": "normal",
    "desc": "Collaborative filtering health recommendation system built for the National Data Science Tournament at Kalbe Farma. Personalises health product recommendations for millions of users."
  },
  {
    "id": "cfd-ml",
    "title": "CFD + ML Spray Dryer Optimisation",
    "tags": ["mfg"],
    "badges": ["CFD", "OpenFOAM", "Energy Optimisation"],
    "icon": "🌊",
    "size": "normal",
    "desc": "Combined Computational Fluid Dynamics and Machine Learning model for energy optimisation in pharmaceutical spray dryer machines at Kalbe Farma. Reduces energy consumption while maintaining output quality."
  },
  {
    "id": "bioblock",
    "title": "BioBlock",
    "tags": ["web3", "health"],
    "badges": ["Blockchain", "Healthcare", "AI Diagnostics"],
    "icon": "🧬",
    "size": "normal",
    "desc": "Blockchain-based secure medical data platform with integrated AI diagnostics. Presented at Universitas Gadjah Mada NETCOMP 3.0. Ensures data integrity and patient privacy in healthcare systems."
  }
]

# ══════════════════════════════════════════════════════════════
# EXPERIENCE
# ══════════════════════════════════════════════════════════════
experience = [
  {
    "company": "Coding Collective",
    "role": "AI Community Lead",
    "period": "Jul – Nov 2025",
    "year": "2025",
    "location": "Singapore",
    "active": True,
    "tags": ["Community Building", "AI Ecosystem", "Open Source", "Leadership"],
    "desc": "Building and leading initiatives that empower aspiring and professional AI practitioners across Indonesia.",
    "bullets": [
      "Created collaborative AI ecosystems through hands-on workshops and study groups",
      "Led open-source projects connecting Indonesian AI practitioners",
      "Established strategic partnerships across the region"
    ]
  },
  {
    "company": "PT. Data Sorcerers Indonesia",
    "role": "Founder & Chief Executive Officer",
    "period": "Apr 2024 – Present",
    "year": "2024",
    "location": "Yogyakarta, ID",
    "active": True,
    "tags": ["AI Consulting", "Leadership", "Entrepreneurship", "Product Development"],
    "desc": "IT Consulting that prepares digital talent for the AI world through project-based and open-source initiatives. Focused on AI for Culture, Healthcare, and Wellness.",
    "bullets": [
      "Founded and scaled to 10 AI divisions (CV, NLP, GenAI, Bioinformatics, etc.)",
      "Delivered 20+ AI projects across industries",
      "Built a community of 500+ AI practitioners in Indonesia"
    ]
  },
  {
    "company": "Massachusetts Institute of Technology",
    "role": "Pre-PhD Researcher",
    "period": "2025 – Present",
    "year": "2025",
    "location": "Boston, USA",
    "active": True,
    "tags": ["Computer Vision", "Computational Optimization", "Research", "MIT REAP"],
    "desc": "Computational Science & Engineering research focused on Computer Vision and Computational Optimization.",
    "bullets": [
      "Research: Computer Vision & Computational Optimization",
      "4th Place MIT Regional Entrepreneurship Acceleration Programme (REAP) 2025",
      "Collaborating with cross-disciplinary research groups"
    ]
  },
  {
    "company": "PT. Kalbe Farma, Tbk.",
    "role": "AI Engineer — Manufacturing",
    "period": "Jun 2024 – Jun 2025",
    "year": "2024",
    "location": "Jakarta, ID",
    "active": False,
    "tags": ["Computer Vision", "CFD", "ML", "Manufacturing", "Healthcare"],
    "desc": "Applied AI engineering in pharmaceutical manufacturing — from defect detection to energy optimisation.",
    "bullets": [
      "Automated defect detection in aluminium packaging with Computer Vision",
      "Built LightFM health recommendation system (National DS Tournament)",
      "CFD + ML energy optimisation for spray dryer machines"
    ]
  },
  {
    "company": "X Corp (Twitter)",
    "role": "Machine Learning Engineer",
    "period": "Jul 2023 – Dec 2024",
    "year": "2023",
    "location": "San Francisco, USA",
    "active": False,
    "tags": ["Machine Learning", "NLP", "Platform AI", "Collaboration"],
    "desc": "Collaborated with 10+ third-party institutions to integrate ML solutions across the X platform.",
    "bullets": [
      "Collaborated with 10+ third-party institutions",
      "Integrated innovative ML solutions across the platform",
      "Expanded X's AI innovation ecosystem"
    ]
  }
]

# ══════════════════════════════════════════════════════════════
# EDUCATION
# ══════════════════════════════════════════════════════════════
education = [
  {
    "school": "Massachusetts Institute of Technology",
    "location": "Boston, United States of America",
    "period": "2025 — Present",
    "degree": "Pre-Doctor of Philosophy — Computational Science & Engineering",
    "detail": "Research Area: Computer Vision, Computational Optimization. Part of the MIT Regional Entrepreneurship Acceleration Programme (4th Place 2025).",
    "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/MIT_logo.svg/800px-MIT_logo.svg.png"
  },
  {
    "school": "University of Technology Yogyakarta",
    "location": "Yogyakarta, Indonesia",
    "period": "Graduated January 2025",
    "degree": "Bachelor of Computer Science (S.Kom)",
    "detail": "Major: Informatics. Minor: Artificial Intelligence & Smart Systems. Also served as Teaching Assistant for ML, Big Data, and Database courses.",
    "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/UTY_Logo.png/1200px-UTY_Logo.png"
  },
  {
    "school": "University of Kuala Lumpur",
    "location": "Kuala Lumpur, Malaysia",
    "period": "Graduated October 2023",
    "degree": "Bachelor of Science (Hons) — Analytical Economics",
    "detail": "Electives: Public Finance. Bridging AI and economic analysis for policy formulation.",
    "logo": "https://upload.wikimedia.org/wikipedia/en/thumb/0/06/UniKL-logo.jpg/800px-UniKL-logo.jpg"
  },
  {
    "school": "University of Zagreb",
    "location": "Zagreb, Croatia",
    "period": "July 2022",
    "degree": "ERASMUS+ ICM KA 107 Exchange",
    "detail": "Major: Computer Science. Minor: Artificial Intelligence. Acceptance rate 1:250 (0.4%). Finalist at AI Battleground Croatia 2022 during tenure.",
    "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/University_of_Zagreb_logo.svg/1200px-University_of_Zagreb_logo.svg.png"
  }
]

# ══════════════════════════════════════════════════════════════
# SKILLS
# ══════════════════════════════════════════════════════════════
skills = {
  "categories": [
    {
      "name": "AI & Machine Learning",
      "items": [
        {"name": "Python", "level": 95, "icon": "🐍"},
        {"name": "PyTorch", "level": 90, "icon": "🔥"},
        {"name": "TensorFlow", "level": 85, "icon": "🧠"},
        {"name": "Computer Vision (CNN, OCR)", "level": 92, "icon": "👁️"},
        {"name": "NLP / LLM", "level": 90, "icon": "💬"},
        {"name": "Multimodal AI", "level": 88, "icon": "🤖"}
      ]
    },
    {
      "name": "Engineering & Cloud",
      "items": [
        {"name": "GCP / Docker", "level": 80, "icon": "☁️"},
        {"name": "MLOps", "level": 78, "icon": "⚙️"},
        {"name": "CFD / OpenFOAM", "level": 75, "icon": "🌊"},
        {"name": "Cybersecurity", "level": 72, "icon": "🔐"}
      ]
    },
    {
      "name": "Research & Science",
      "items": [
        {"name": "Bioinformatics (Nextflow, Seqera)", "level": 70, "icon": "🧬"},
        {"name": "Computational Optimization", "level": 82, "icon": "📐"},
        {"name": "Web3 / Blockchain", "level": 68, "icon": "⛓️"}
      ]
    }
  ]
}

# ══════════════════════════════════════════════════════════════
# ACHIEVEMENTS
# ══════════════════════════════════════════════════════════════
achievements = [
  {"year": "2025", "icon": "🏅", "text": "Nominee of The Rising Changemaker Awards by DPP PKB (National Awakening Party)", "badge": "National"},
  {"year": "2025", "icon": "🚀", "text": "Finalist — Bandung Startup Pitching Day 2025 by Startup Bandung & School of Business Management ITB", "badge": "Startup"},
  {"year": "2025", "icon": "🌏", "text": "Top 10 — Startup Pitching Day Singapore 2025 by Circle 8", "badge": "International"},
  {"year": "2025", "icon": "🎓", "text": "4th Place — MIT Regional Entrepreneurship Acceleration Programme (REAP) 2025", "badge": "MIT"},
  {"year": "2025", "icon": "💚", "text": "NVIDIA Deep Learning Grant USD $112K+ (IDR 1.8B) for Certifications Program 2025–2027", "badge": "NVIDIA"},
  {"year": "2025", "icon": "💰", "text": "Awardee NVIDIA Inception Program with USD $250K+ Grant for AI Development 2025", "badge": "NVIDIA"},
  {"year": "2024", "icon": "🥇", "text": "1st Place — National Data Science Tournament, Kalbe Farma 2024", "badge": "National"},
  {"year": "2023", "icon": "🏆", "text": "Winner — 3M Presentation at 8th International Conference on Pharmacy & Advanced Pharmaceutical Sciences", "badge": "International"},
  {"year": "2023", "icon": "🥈", "text": "2nd Place — Upstream: Pharmaceutical & Biotechnology, Biofarma × MIT Hacking Medicine 2023", "badge": "MIT"},
  {"year": "2023", "icon": "🌐", "text": "Winner — Garuda Hacks 2023 (KERTI KAWISTA project)", "badge": "Hackathon"},
  {"year": "2022", "icon": "🎯", "text": "Finalist — AI Battleground Croatia 2022 (during ERASMUS+ tenure at University of Zagreb)", "badge": "International"}
]

# ══════════════════════════════════════════════════════════════
# TALKS
# ══════════════════════════════════════════════════════════════
talks = [
  {"title": "Behind The Scene of Multimodal Large Language Model (MLLM)", "org": "University of Darma Persada · Jakarta", "year": "2025", "tags": ["AI", "LLM"]},
  {"title": "AI Security: Weaponized Intelligence for Red & Blue Team Engineering", "org": "Ministry of Communication · Cyberkarta", "year": "2025", "tags": ["Cybersecurity", "AI"]},
  {"title": "The Rise of AI Gladiators: Deep Dive into AI Battleground", "org": "SEMNASTI 2025 · UDINUS Semarang", "year": "2025", "tags": ["AI", "Competition"]},
  {"title": "Post-Human Code: When Machines Learning to Become God", "org": "Jogja Developer Community · JogjaDevday.id", "year": "2025", "tags": ["AI", "Philosophy"]},
  {"title": "Web4: When AI meets Blockchain", "org": "AMIKOM Yogyakarta", "year": "2025", "tags": ["Web3", "AI"]},
  {"title": "Young Leadership and Advocacy with AI", "org": "UNDP Indonesia", "year": "2025", "tags": ["Leadership", "AI"]},
  {"title": "BioBlock — Blockchain for Secure Medical Data & AI Diagnostics", "org": "Universitas Gadjah Mada · NETCOMP 3.0", "year": "2025", "tags": ["Blockchain", "Healthcare"]},
  {"title": "AI-Preneurship Blueprint: Building a Profitable Business in the AI Era", "org": "AMIKOM Entrepreneurship Community", "year": "2025", "tags": ["Entrepreneurship", "AI"]},
  {"title": "Integrating Intelligence: AI Robotics and The Future", "org": "VORTEX 2025 · State University of Yogyakarta", "year": "2025", "tags": ["Robotics", "AI"]},
  {"title": "Running an RNA-Seq pipeline with nf-core and Seqera", "org": "Bioinformatics & Biodiversity Conference 2024 · Kalbe", "year": "2024", "tags": ["Bioinformatics", "Research"]},
  {"title": "SABDA Algorithm: Cracking the Code of Nusantara Scripts", "org": "ICOICT 2024 · International Conference", "year": "2024", "tags": ["Research", "NLP"]},
  {"title": "Generative AI for Creative Industries", "org": "Creative Economy Agency (Bekraf) Indonesia", "year": "2024", "tags": ["GenAI", "Creative"]},
  {"title": "DDoS Attack Simulation and Mitigation Strategies", "org": "Cybersecurity Summit · Yogyakarta", "year": "2024", "tags": ["Cybersecurity"]},
  {"title": "Foundation Models for Low-Resource Languages", "org": "Southeast Asia NLP Workshop 2024", "year": "2024", "tags": ["NLP", "Research"]},
  {"title": "Malware Analysis with ML: From Detection to Attribution", "org": "BSSN (National Cyber Agency) Workshop", "year": "2023", "tags": ["Cybersecurity", "ML"]}
]

# ══════════════════════════════════════════════════════════════
# VOLUNTEERING
# ══════════════════════════════════════════════════════════════
volunteering = [
  {
    "org": "NVIDIA Deep Learning Institute",
    "role": "Certified Instructor & Ambassador",
    "period": "2025 – Present",
    "location": "Indonesia",
    "icon": "💚",
    "desc": "Delivering NVIDIA-certified AI and Deep Learning courses across Indonesian universities and institutions. Part of the NVIDIA Deep Learning Grant program.",
    "tags": ["Teaching", "AI", "NVIDIA", "Certification"]
  },
  {
    "org": "UNDP Indonesia",
    "role": "Youth AI Advocate",
    "period": "2025",
    "location": "Jakarta, Indonesia",
    "icon": "🌍",
    "desc": "Representing Indonesian youth in AI policy discussions and advocating for ethical AI development in developing nations.",
    "tags": ["Policy", "Youth", "AI Ethics", "UN"]
  },
  {
    "org": "Coding Collective",
    "role": "Community Lead & Mentor",
    "period": "2025",
    "location": "Singapore (Remote)",
    "icon": "👥",
    "desc": "Leading the Indonesian chapter of Coding Collective — empowering 500+ AI practitioners through workshops, mentoring sessions, and open-source collaboration.",
    "tags": ["Mentoring", "Community", "Open Source"]
  },
  {
    "org": "University of Technology Yogyakarta",
    "role": "Teaching Assistant — ML, Big Data, Database",
    "period": "2023 – 2025",
    "location": "Yogyakarta, Indonesia",
    "icon": "🎓",
    "desc": "Assisted professors in delivering Machine Learning, Big Data Analytics, and Database Systems courses. Mentored 200+ undergraduate students.",
    "tags": ["Teaching", "Academia", "ML", "Mentoring"]
  },
  {
    "org": "Open Source Nusantara",
    "role": "Core Contributor",
    "period": "2023 – Present",
    "location": "Remote",
    "icon": "🤝",
    "desc": "Contributing to open-source tools and datasets for Indonesian language processing, including corpus building for low-resource Nusantara languages.",
    "tags": ["Open Source", "NLP", "Community"]
  }
]

# ══════════════════════════════════════════════════════════════
# WRITE ALL JSON FILES
# ══════════════════════════════════════════════════════════════
datasets = {
    "projects":     projects,
    "experience":   experience,
    "education":    education,
    "skills":       skills,
    "achievements": achievements,
    "talks":        talks,
    "volunteering": volunteering,
}

for name, data in datasets.items():
    path = os.path.join("data", f"{name}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"  ✅  data/{name}.json")

print(f"\n✨  Selesai! Semua data tersimpan di folder data/\n")
