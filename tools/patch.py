#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
patch.py — Portfolio i18n patcher
Jalankan dari root project:  python3 tools/patch.py

Apa yang dilakukan:
  1. Merge T_EXT translations ke js/lang.js (idempotent — skip jika sudah ada)
  2. Inject <script src="/js/lang.js"> ke semua pages (idempotent)
  3. Tag data-i18n di experience, projects, achievements, education, talks, contact

Aman dijalankan berkali-kali — sudah ada pengecekan idempoten.
"""

import os, re, sys

# ── Resolve root from script location ──────────────────────
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = os.path.join(ROOT, 'pages')
JS    = os.path.join(ROOT, 'js', 'lang.js')

def page(name): return os.path.join(PAGES, name, 'index.html')

def read(path):
    with open(path, encoding='utf-8') as f: return f.read()

def write(path, content):
    with open(path, 'w', encoding='utf-8') as f: f.write(content)

def patch(content, old, new, label=''):
    if new in content:
        return content  # already patched
    if old not in content:
        print(f'  WARN [{label}]: not found — {old[:65]}')
        return content
    return content.replace(old, new, 1)

def patch_all(content, old, new):
    """Replace all occurrences (idempotent)."""
    if new in content: return content
    return content.replace(old, new)

ok  = lambda msg: print(f'  ✓  {msg}')
skp = lambda msg: print(f'  –  {msg} (already done)')

# ══════════════════════════════════════════════════════════════
# 1. MERGE T_EXT INTO lang.js
# ══════════════════════════════════════════════════════════════
T_EXT = """
    /* ══════════ EXPERIENCE — JOB ROLES ══════════ */
    'exp.j1.role':{ id:'Pemimpin Komunitas AI', jv:'Pangarsa Komunitas AI', su:'Pamingpin Komunitas AI', bal:'Pangarsaning Komunitas AI', lam:'Pemimpin Komunitas AI', en:'AI Community Lead', zh:'AI社区负责人', ja:'AIコミュニティリード', ru:'Лидер AI-сообщества', fr:'Responsable communauté IA', es:'Líder de comunidad IA', ar:'قائد مجتمع الذكاء الاصطناعي', ko:'AI 커뮤니티 리드' },
    'exp.j2.role':{ id:'Pendiri & CEO', jv:'Pendiri & CEO', su:'Pendiri & CEO', bal:'Pendiri & CEO', lam:'Pendiri & CEO', en:'Founder & Chief Executive Officer', zh:'创始人兼首席执行官', ja:'創業者兼最高経営責任者', ru:'Основатель и генеральный директор', fr:'Fondateur et directeur général', es:'Fundador y director ejecutivo', ar:'المؤسس والرئيس التنفيذي', ko:'창업자 및 CEO' },
    'exp.j3.role':{ id:'Insinyur Kecerdasan Buatan — Manufaktur', jv:'Insinyur AI — Manufaktur', su:'Insinyur AI — Manufaktur', bal:'Insinyur AI — Manufaktur', lam:'Insinyur AI — Manufaktur', en:'Artificial Intelligence Engineer — Manufacturing', zh:'人工智能工程师 — 制造业', ja:'AIエンジニア — 製造業', ru:'Инженер ИИ — Производство', fr:'Ingénieur IA — Fabrication', es:'Ingeniero de IA — Manufactura', ar:'مهندس ذكاء اصطناعي — التصنيع', ko:'AI 엔지니어 — 제조업' },
    'exp.j4.role':{ id:'Insinyur Machine Learning', jv:'Insinyur Machine Learning', su:'Insinyur Machine Learning', bal:'Insinyur Machine Learning', lam:'Insinyur Machine Learning', en:'Machine Learning Engineer', zh:'机器学习工程师', ja:'機械学習エンジニア', ru:'Инженер машинного обучения', fr:'Ingénieur apprentissage automatique', es:'Ingeniero de aprendizaje automático', ar:'مهندس تعلم الآلة', ko:'머신러닝 엔지니어' },
    'exp.j5.role':{ id:'Asisten Pengajar — ML, Big Data, Web, C, Basis Data', jv:'Asisten Pengajar — ML, Big Data, Web, C, Basis Data', su:'Asisten Pangajar — ML, Big Data, Web, C, Basis Data', bal:'Asisten Pangajar — ML, Big Data, Web, C, Basis Data', lam:'Asisten Pengajar — ML, Big Data, Web, C, Basis Data', en:'Teaching Assistant — ML, Big Data, Web, C, Databases', zh:'助教 — ML、大数据、Web、C、数据库', ja:'ティーチングアシスタント — ML・ビッグデータ・Web・C・DB', ru:'Ассистент преподавателя — ML, Big Data, Web, C, БД', fr:'Assistant enseignant — ML, Big Data, Web, C, BDD', es:'Asistente de enseñanza — ML, Big Data, Web, C, BD', ar:'مساعد تدريس — ML وبيانات ضخمة وويب وC وقواعد بيانات', ko:'조교 — ML, 빅데이터, 웹, C, 데이터베이스' },
    'exp.j6.role':{ id:'Ko-Pendiri & Pemimpin — Proyek Keamanan Siber Skala Besar', jv:'Ko-Pendiri & Pemimpin — Proyek Cybersecurity Skala Gedhe', su:'Ko-Pendiri & Pamingpin — Proyék Cybersecurity Skala Badag', bal:'Ko-Pendiri & Pangarsaning — Proyék Cybersecurity Skala Ageng', lam:'Ko-Pendiri & Pemimpin — Proyék Cybersecurity Skala Gede', en:'Co-Founder & Lead — Large-Scale Cybersecurity Projects', zh:'联合创始人兼负责人 — 大型网络安全项目', ja:'共同創業者兼リード — 大規模サイバーセキュリティプロジェクト', ru:'Сооснователь и руководитель — Крупные проекты кибербезопасности', fr:'Co-fondateur & responsable — Projets de cybersécurité à grande échelle', es:'Co-fundador y líder — Proyectos de ciberseguridad a gran escala', ar:'المؤسس المشارك والقائد — مشاريع الأمن السيبراني واسعة النطاق', ko:'공동 창업자 및 리드 — 대규모 사이버보안 프로젝트' },
    /* ══════════ EXPERIENCE — DESCRIPTIONS ══════════ */
    'exp.j1.desc':{ id:'Membangun dan memimpin inisiatif yang memberdayakan praktisi AI.', en:'Building and leading initiatives that empower aspiring and professional AI practitioners across Indonesia.', jv:'Mbangun lan mimpin inisiatif sing nguatake praktisi AI.', su:'Ngawangun sareng mingpin inisiatif anu nguatkeun praktisi AI.', bal:'Ngraris lan mingpin inisiatif sane nguatang praktisi AI.', lam:'Ngewangi dan mimpin inisiatif sai menguatkan praktisi AI.', zh:'在印度尼西亚各地建立并领导赋能AI从业者的倡议。', ja:'インドネシア全土でAI実践者の育成を支援するイニシアチブを構築・主導。', ru:'Создание и руководство инициативами для AI-специалистов по всей Индонезии.', fr:"Construire et diriger des initiatives qui autonomisent les praticiens IA à travers l'Indonésie.", es:'Construir y liderar iniciativas que empoderan a practicantes de IA en toda Indonesia.', ar:'بناء وقيادة مبادرات تمكين ممارسي الذكاء الاصطناعي عبر إندونيسيا.', ko:'인도네시아 전역에서 AI 실무자들을 역량 강화하는 이니셔티브 구축 및 주도.' },
    'exp.j2.desc':{ id:'Konsultan IT yang mempersiapkan talenta digital untuk dunia AI melalui inisiatif berbasis proyek dan open-source. Fokus pada AI untuk Budaya, Kesehatan, dan Kebugaran.', en:'IT Consulting that prepares digital talent for the AI world through project-based and open-source initiatives. Focused on AI for Culture, Healthcare, and Wellness.', jv:'Konsultan IT sing nyiapake talenta digital kanggo dunia AI.', su:'Konsultan IT anu nyiapkeun talenta digital pikeun dunya AI.', bal:'Konsultan IT sane nyiapang talenta digital ring dunya AI.', lam:'Konsultan IT sai nyiapko talenta digital untuk dunia AI.', zh:'IT咨询公司，通过项目驱动和开源计划为AI世界培养数字人才。', ja:'プロジェクト型とオープンソースの取り組みを通じてAIの世界にデジタル人材を育成するITコンサルティング。', ru:'ИТ-консалтинг, готовящий цифровые кадры для мира ИИ.', fr:"Conseil IT qui prépare les talents numériques au monde de l'IA.", es:'Consultoría IT que prepara talentos digitales para el mundo de la IA.', ar:'استشارات تقنية تُعد المواهب الرقمية لعالم الذكاء الاصطناعي.', ko:'프로젝트 기반 및 오픈소스 이니셔티브를 통해 AI 세계를 위한 디지털 인재를 육성하는 IT 컨설팅.' },
    'exp.j3.desc':{ id:'Memimpin otomasi dan optimasi berbasis AI di salah satu perusahaan farmasi terbesar di Indonesia.', en:"Spearheaded AI-driven automation and optimization in one of Indonesia's largest pharmaceutical companies.", jv:'Mimpin otomasi lan optimasi berbasis AI ing salah siji perusahaan farmasi paling gedhe ing Indonesia.', su:'Mingpin otomasi sareng optimasi berbasis AI di salah sahiji perusahaan farmasi pangbesar di Indonesia.', bal:'Mingpin otomasi lan optimasi berbasis AI ring salah tunggal perusahaan farmasi pangageng ring Indonesia.', lam:'Memimpin otomasi dan optimasi berbasis AI di salah satu perusahaan farmasi terbesar di Indonesia.', zh:'在印度尼西亚最大的制药公司之一主导AI驱动的自动化和优化。', ja:'インドネシア最大手の製薬会社の一つでAI主導の自動化と最適化を主導。', ru:'Возглавил автоматизацию и оптимизацию на основе ИИ в одной из крупнейших фармацевтических компаний Индонезии.', fr:"Piloté l'automatisation et l'optimisation pilotées par IA dans l'une des plus grandes sociétés pharmaceutiques d'Indonésie.", es:'Lideró la automatización y optimización impulsada por IA en una de las compañías farmacéuticas más grandes de Indonesia.', ar:'قاد الأتمتة والتحسين المدعوم بالذكاء الاصطناعي في إحدى كبرى شركات الأدوية الإندونيسية.', ko:'인도네시아 최대 제약 회사 중 한 곳에서 AI 기반 자동화 및 최적화를 주도.' },
    'exp.j4.desc':{ id:'Bergabung dengan hampir selusin perusahaan dan institusi pihak ketiga untuk mengintegrasikan solusi AI inovatif.', en:'Joined forces with nearly a dozen third-party companies and institutions to integrate innovative AI solutions.', jv:'Gabung karo meh selusin perusahaan lan institusi pihak ketiga.', su:'Ngagabung sareng ampir hiji lusin perusahaan sareng institusi pihak katilu.', bal:'Masekan ring ampir sedahan perusahaan lan institusi pihak katilu.', lam:'Bergabung dengan hampir selusin perusahaan dan institusi pihak ketiga.', zh:'与近十家第三方公司和机构合作，整合创新的AI解决方案。', ja:'約10社のサードパーティ企業と機関と連携し、革新的なAIソリューションを統合。', ru:'Объединил усилия с почти дюжиной сторонних компаний и учреждений для интеграции инновационных ИИ-решений.', fr:"Uni les forces avec près d'une douzaine d'entreprises et institutions tierces.", es:'Unió fuerzas con casi una docena de empresas e instituciones de terceros.', ar:'انضم إلى ما يقرب من اثني عشر شركة ومؤسسة من أطراف ثالثة.', ko:'약 12개의 제3자 회사 및 기관과 협력하여 혁신적인 AI 솔루션을 통합.' },
    'exp.j5.desc':{ id:'Serangkaian empat semester peran pengajaran yang mencakup ML, Analitik Big Data, Pemrograman Web, dan Bahasa Pemrograman C.', en:'Four-semester series of teaching roles spanning ML, Big Data Analytics, Web Programming, and C Programming Language.', jv:'Serangkaian papat semester peran ngajar sing nyakup ML, Analitik Big Data, Pemrograman Web, lan Bahasa C.', su:'Sarangkaian opat sémester peran ngajar.', bal:'Rangkaian papat sémester peran pangajar.', lam:'Serangkaian empat semester peran pengajaran.', zh:'横跨ML、大数据分析、Web编程和C语言的四学期系列教学工作。', ja:'ML・ビッグデータ分析・Webプログラミング・C言語にわたる4学期の教育担当。', ru:'Четырёхсеместровая серия преподавательских ролей.', fr:"Série de quatre semestres de rôles d'enseignement couvrant ML, analytique Big Data, programmation Web et langage C.", es:'Serie de cuatro semestres de roles docentes que abarca ML, análisis de Big Data, programación Web y lenguaje C.', ar:'سلسلة من أربعة فصول دراسية من أدوار التدريس تشمل ML.', ko:'ML, 빅데이터 분석, 웹 프로그래밍, C 언어에 걸친 4학기 교육 담당.' },
    'exp.j6.desc':{ id:'Memimpin proyek keamanan siber kolaboratif skala besar yang melibatkan kontributor di seluruh Indonesia.', en:'Led a large-scale collaborative cybersecurity project involving contributors across Indonesia, exploring both offensive and defensive security strategies.', jv:'Mimpin proyek keamanan siber kolaboratif skala gedhe.', su:'Mingpin proyék cybersecurity kolaboratif skala badag.', bal:'Mingpin proyék cybersecurity kolaboratif skala ageng.', lam:'Memimpin proyek keamanan siber kolaboratif skala besar.', zh:'领导一个涉及印度尼西亚各地贡献者的大规模协作网络安全项目。', ja:'インドネシア全土の貢献者が参加する大規模な協調サイバーセキュリティプロジェクトを主導。', ru:'Руководил крупным совместным проектом по кибербезопасности с участниками по всей Индонезии.', fr:"Dirigé un grand projet collaboratif de cybersécurité impliquant des contributeurs à travers l'Indonésie.", es:'Lideró un proyecto de ciberseguridad colaborativo a gran escala con colaboradores en toda Indonesia.', ar:'قاد مشروعاً تعاونياً واسع النطاق للأمن السيبراني يضم مساهمين عبر إندونيسيا.', ko:'인도네시아 전역의 기여자들이 참여하는 대규모 협력 사이버보안 프로젝트를 주도.' },
    /* ══════════ EXPERIENCE — BULLETS ══════════ */
    'exp.j1.b1':{ id:'Menciptakan ekosistem AI kolaboratif melalui workshop dan kelompok belajar langsung', en:'Created collaborative AI ecosystems through hands-on workshops and study groups', jv:'Nggawe ekosistem AI kolaboratif liwat workshop', su:'Nyiptakeun ékosistem AI kolaboratif', bal:'Nyiapang ékosistem AI kolaboratif', lam:'Nyiptako ekosistem AI kolaboratif', zh:'通过实践研讨会和学习小组创建协作AI生态系统', ja:'実践的なワークショップと学習グループを通じて協力的なAIエコシステムを構築', ru:'Создал совместные AI-экосистемы через практические воркшопы', fr:"Créé des écosystèmes IA collaboratifs via des ateliers pratiques", es:'Creó ecosistemas de IA colaborativos mediante talleres prácticos', ar:'أنشأ نظماً بيئية تعاونية للذكاء الاصطناعي', ko:'실습 워크샵과 스터디 그룹을 통해 협력적 AI 생태계 조성' },
    'exp.j1.b2':{ id:'Memimpin proyek open-source yang menghubungkan praktisi AI Indonesia', en:'Led open-source projects connecting Indonesian AI practitioners', jv:'Mimpin proyek open-source sing nyambungake praktisi AI Indonesia', su:'Mingpin proyék open-source anu nyambungkeun praktisi AI Indonesia', bal:'Mingpin proyék open-source sane nyambungang praktisi AI Indonesia', lam:'Memimpin proyek open-source sai nyambungko praktisi AI Indonesia', zh:'领导开源项目，连接印度尼西亚AI从业者', ja:'インドネシアのAI実践者をつなぐオープンソースプロジェクトを主導', ru:'Руководил open-source проектами', fr:'Dirigé des projets open-source reliant les praticiens IA indonésiens', es:'Lideró proyectos open-source que conectan a los practicantes de IA indonesios', ar:'قاد مشاريع مفتوحة المصدر لربط ممارسي الذكاء الاصطناعي الإندونيسيين', ko:'인도네시아 AI 실무자들을 연결하는 오픈소스 프로젝트 주도' },
    'exp.j1.b3':{ id:'Membangun kemitraan strategis di seluruh kawasan', en:'Established strategic partnerships across the region', jv:'Mbangun kemitraan strategis sak kawasan', su:'Ngawangun kemitraan strategis di sakuliah kawasan', bal:'Ngraris kemitraan strategis ring sakuliah kawasan', lam:'Membangun kemitraan strategis di seluruh kawasan', zh:'在整个地区建立了战略合作伙伴关系', ja:'地域全体で戦略的パートナーシップを確立', ru:'Установил стратегические партнёрства по всему региону', fr:'Établi des partenariats stratégiques dans toute la région', es:'Estableció asociaciones estratégicas en toda la región', ar:'أسس شراكات استراتيجية عبر المنطقة', ko:'지역 전반에 걸쳐 전략적 파트너십 구축' },
    'exp.j2.b1':{ id:'Membangun 10 divisi spesialis', en:'Built 10 specialized Houses: Bioinformatics, Computer Vision, Competition Team, Data Engineer, Data Science, Expert System, Generative AI, Machine Learning, NLP, UI/UX', jv:'Mbangun 10 divisi spesialis', su:'Ngawangun 10 divisi spésialis', bal:'Ngraris 10 divisi spésialis', lam:'Ngusung 10 divisi spesialis', zh:'建立了10个专业部门', ja:'10の専門部署を設立', ru:'Создал 10 специализированных подразделений', fr:'Créé 10 divisions spécialisées', es:'Creó 10 divisiones especializadas', ar:'بنى 10 أقساماً متخصصة', ko:'10개 전문 부서 구축' },
    'exp.j2.b2':{ id:'Mengerjakan 20+ proyek dan 2 produk AI utama dengan deployment tingkat produksi', en:'Delivered 20+ projects and 2 main AI products with production-level deployment', jv:'Nggarap 20+ proyek lan 2 produk AI utama', su:'Ngerjakeun 20+ proyék sareng 2 produk AI utama', bal:'Nggarap 20+ proyék lan 2 produk AI utama', lam:'Ngerjako 20+ proyek dan 2 produk AI utama', zh:'交付了20多个项目和2款主要AI产品', ja:'20以上のプロジェクトと2つのメインAI製品を本番環境レベルのデプロイで提供', ru:'Реализовал 20+ проектов и 2 основных AI-продукта', fr:'Livré 20+ projets et 2 produits IA principaux', es:'Entregó más de 20 proyectos y 2 productos IA principales', ar:'سلّم أكثر من 20 مشروعاً و2 منتجَي ذكاء اصطناعي رئيسيَّين', ko:'20개 이상의 프로젝트와 2개의 주요 AI 제품 납품' },
    'exp.j2.b3':{ id:'Mengadakan 5 Kelas Eksklusif dan membimbing tim kompetisi hingga babak nasional', en:'Held 5 Exclusive Classes and mentored competition teams to national finals', jv:'Ngadakake 5 Kelas Eksklusif', su:'Ngayakeun 5 Kelas Ékslusif', bal:'Ngadakang 5 Kelas Ékslusif', lam:'Ngadako 5 Kelas Eksklusif', zh:'举办了5个专属课程，并指导竞赛团队进入全国决赛', ja:'5つの限定クラスを開催し、競技チームを全国決勝へと導いた', ru:'Провёл 5 эксклюзивных классов', fr:"Organisé 5 classes exclusives et encadré des équipes jusqu'aux finales nationales", es:'Impartió 5 clases exclusivas y orientó equipos hasta las finales nacionales', ar:'أقام 5 فصول حصرية وأرشد فرق المسابقات حتى النهائيات الوطنية', ko:'5개의 익스클루시브 클래스 개최 및 경쟁 팀을 전국 결선까지 멘토링' },
    'exp.j3.b1':{ id:'Mengotomasi deteksi cacat pada kemasan aluminium', en:'Automated defect detection on aluminum packaging using advanced Computer Vision techniques', jv:'Ngotomasi deteksi cacat ing kemasan aluminium', su:'Nganotomasi deteksi cacat dina kemasan aluminium', bal:'Ngotomasi deteksi cacat ring kemasan aluminium', lam:'Mengotomasi deteksi cacat pada kemasan aluminium', zh:'使用先进的计算机视觉技术在铝包装上自动检测缺陷', ja:'高度なコンピュータビジョン技術を用いてアルミ包装の欠陥検出を自動化', ru:'Автоматизировал обнаружение дефектов алюминиевой упаковки', fr:'Automatisé la détection de défauts sur les emballages aluminium', es:'Automatizó la detección de defectos en empaques de aluminio', ar:'أتمت كشف العيوب في التغليف الألوميني', ko:'고급 컴퓨터 비전 기술을 사용하여 알루미늄 포장의 결함 감지 자동화' },
    'exp.j3.b2':{ id:'Membangun Sistem Rekomendasi Gaya Hidup Sehat menggunakan LightFM dan Surprise', en:'Built Health Lifestyle Recommendation System using LightFM and Surprise — featured at National Data Science Tournament', jv:'Mbangun Sistem Rekomendasi Gaya Hidup Sehat nganggo LightFM', su:'Ngawangun Sistem Rekomendasi Gaya Hidup Séhat nganggo LightFM', bal:'Ngraris Sistem Rekomendasi Gaya Hidup Séhat nganggo LightFM', lam:'Ngusung Sistem Rekomendasi Gaya Hidup Sehat nganggo LightFM', zh:'使用LightFM和Surprise构建健康生活方式推荐系统', ja:'LightFMとSurpriseを使用したヘルスライフスタイル推薦システムを構築', ru:'Создал систему рекомендаций здорового образа жизни', fr:'Construit un système de recommandation de style de vie sain avec LightFM', es:'Construyó un sistema de recomendación de estilo de vida saludable con LightFM', ar:'بنى نظام توصية نمط الحياة الصحية باستخدام LightFM', ko:'LightFM 및 Surprise를 사용한 건강 생활 방식 추천 시스템 구축' },
    'exp.j3.b3':{ id:'Mengembangkan strategi optimasi energi untuk spray dryer menggunakan CFD + ML', en:'Developed energy optimization strategies for spray dryers using Computational Fluid Dynamics + ML with Large Eddy Simulation', jv:'Ngembangake strategi optimasi energi kanggo spray dryer', su:'Ngamekarkeun strategi optimasi énérgi pikeun spray dryer', bal:'Ngemekaryang strategi optimasi énérgi ring spray dryer', lam:'Mengembangkan strategi optimasi energi untuk spray dryer', zh:'使用计算流体动力学+机器学习为喷雾干燥机开发能源优化策略', ja:'計算流体力学 + MLを使用したスプレードライヤーのエネルギー最適化戦略を開発', ru:'Разработал стратегии оптимизации энергии для распылительных сушилок', fr:"Développé des stratégies d'optimisation énergétique pour les sécheurs à pulvérisation", es:'Desarrolló estrategias de optimización energética para secadores de atomización', ar:'طور استراتيجيات تحسين الطاقة لمجففات الرش', ko:'계산 유체 역학 + ML을 사용한 스프레이 드라이어 에너지 최적화 전략 개발' },
    'exp.j3.b4':{ id:'Memprediksi kadar kelembaban dalam produksi susu menggunakan LSTM, XGBoost, dan decision tree', en:'Predicted moisture content in milk production using LSTM, XGBoost, and decision trees', jv:'Memprediksi kadar kelembaban ing produksi susu', su:'Memprediksi kadar kelembaban dina produksi susu', bal:'Memprediksi kadar kelembaban ring produksi susu', lam:'Memprediksi kadar kelembaban di produksi susu', zh:'使用LSTM、XGBoost和决策树预测牛奶生产中的水分含量', ja:'LSTM、XGBoost、決定木を使用して牛乳生産の水分含量を予測', ru:'Предсказал содержание влаги в производстве молока', fr:'Prédit la teneur en humidité dans la production laitière', es:'Predijo el contenido de humedad en la producción de leche', ar:'تنبأ بمحتوى الرطوبة في إنتاج الحليب', ko:'LSTM, XGBoost, 의사 결정 트리를 사용하여 우유 생산의 수분 함량 예측' },
    'exp.j3.b5':{ id:'Berkolaborasi dalam analisis data genomik di NutrigenMe', en:'Collaborated on genomic data analysis at NutrigenMe for personalized health solutions', jv:'Kolaborasi ing analisis data genomik ing NutrigenMe', su:'Kolaborasi dina analisis data genomik di NutrigenMe', bal:'Kolaborasi ring analisis data genomik ring NutrigenMe', lam:'Berkolaborasi dalam analisis data genomik di NutrigenMe', zh:'在NutrigenMe参与基因组数据分析', ja:'NutrigenMeでのゲノムデータ分析に協力', ru:'Сотрудничал в анализе геномных данных в NutrigenMe', fr:"Collaboré à l'analyse des données génomiques chez NutrigenMe", es:'Colaboró en el análisis de datos genómicos en NutrigenMe', ar:'تعاون في تحليل البيانات الجينومية في NutrigenMe', ko:'NutrigenMe에서 유전체 데이터 분석에 협력' },
    'exp.j3.b6':{ id:'Mereproduksi kode simulasi RANS dari literatur', en:'Reproduced Reynolds-Averaged Navier-Stokes (RANS) simulation code from literature', jv:'Ngreproduksi kode simulasi RANS saka literatur', su:'Ngahasilkeun deui kode simulasi RANS tina literatur', bal:'Ngreproduksi kode simulasi RANS saking literatur', lam:'Mereproduksi kode simulasi RANS dari literatur', zh:'从文献中复现了雷诺平均纳维-斯托克斯（RANS）仿真代码', ja:'文献からRANSシミュレーションコードを再現', ru:'Воспроизвёл код симуляции RANS из литературы', fr:'Reproduit le code de simulation RANS à partir de la littérature', es:'Reprodujo el código de simulación RANS de la literatura', ar:'أعاد إنتاج كود محاكاة RANS من الأدبيات', ko:'문헌에서 RANS 시뮬레이션 코드 재현' },
    'exp.j4.b1':{ id:'Berkolaborasi erat dengan mitra eksternal untuk mengintegrasikan inovasi ML ke platform X', en:"Collaborated closely with external partners to integrate ML innovations into X's platform", jv:'Kolaborasi erat karo mitra eksternal', su:'Kolaborasi erat sareng mitra éksternal', bal:'Kolaborasi erat lan mitra éksternal', lam:'Berkolaborasi erat dengan mitra eksternal', zh:'与外部合作伙伴密切合作，将机器学习创新集成到X平台', ja:'外部パートナーと密接に協力し、MLイノベーションをXのプラットフォームに統合', ru:'Тесно сотрудничал с внешними партнёрами для интеграции ML-инноваций', fr:'Collaboré étroitement avec des partenaires externes', es:'Colaboró estrechamente con socios externos para integrar innovaciones de ML', ar:'تعاون عن كثب مع شركاء خارجيين لدمج ابتكارات ML', ko:'외부 파트너와 긴밀하게 협력하여 X의 플랫폼에 ML 혁신을 통합' },
    'exp.j4.b2':{ id:"Memperluas jangkauan teknologi X melalui ekosistem inovasi yang dinamis", en:"Expanded X's technology reach through dynamic ecosystem of innovation", jv:'Ngembangake jangkauan teknologi X', su:'Ngaluaskeun jangkauan téknologi X', bal:'Ngembangyang jangkauan téknologi X', lam:'Memperluas jangkauan teknologi X', zh:'通过动态创新生态系统扩展X的技术影响力', ja:'革新の動的エコシステムを通じてXの技術リーチを拡大', ru:'Расширил технологический охват X через динамичную экосистему инноваций', fr:"Élargi la portée technologique de X via un écosystème d'innovation dynamique", es:'Amplió el alcance tecnológico de X a través de un ecosistema de innovación dinámico', ar:'وسّع نطاق تقنية X من خلال نظام بيئي ديناميكي للابتكار', ko:'혁신의 역동적 생태계를 통해 X의 기술 범위 확장' },
    'exp.j4.b3':{ id:'Mengerjakan proyek lintas organisasi yang menggabungkan AI dan rekayasa platform', en:'Delivered cross-organizational projects combining AI and platform engineering', jv:'Nggarap proyek lintas organisasi', su:'Ngerjakeun proyék lintas organisasi', bal:'Nggarap proyék lintas organisasi', lam:'Mengerjakan proyek lintas organisasi', zh:'交付了结合AI和平台工程的跨组织项目', ja:'AIとプラットフォームエンジニアリングを組み合わせた組織横断プロジェクトを提供', ru:'Реализовал межорганизационные проекты, сочетающие ИИ и инженерию платформ', fr:'Livré des projets inter-organisationnels combinant IA et ingénierie de plateforme', es:'Entregó proyectos entre organizaciones combinando IA e ingeniería de plataformas', ar:'سلّم مشاريع متعددة المؤسسات تجمع بين الذكاء الاصطناعي وهندسة المنصات', ko:'AI와 플랫폼 엔지니어링을 결합한 조직 간 프로젝트 납품' },
    'exp.j5.b1':{ id:'Mengajar Machine Learning dan Basis Data Lanjutan kepada 40+ mahasiswa per mata kuliah (Feb–Jun 2024)', en:'Taught Machine Learning and Advanced Databases to 40+ students per subject (Feb–Jun 2024)', jv:'Ngajar Machine Learning lan Basis Data Lanjutan marang 40+ mahasiswa', su:'Ngajar Machine Learning sareng Basis Data Lanjutan ka 40+ mahasiswa', bal:'Ngajar Machine Learning lan Basis Data Lanjutan ring 40+ mahasiswa', lam:'Mengajar Machine Learning dan Basis Data Lanjutan kepada 40+ mahasiswa', zh:'教授机器学习和高级数据库给40多名学生（2024年2月至6月）', ja:'機械学習と高度データベースを40人以上の学生に教えた（2024年2月〜6月）', ru:'Преподавал машинное обучение и продвинутые базы данных 40+ студентам', fr:'Enseigné ML et bases de données avancées à 40+ étudiants (fév–juin 2024)', es:'Enseñó ML y bases de datos avanzadas a más de 40 estudiantes (feb–jun 2024)', ar:'علّم ML وقواعد البيانات المتقدمة لأكثر من 40 طالباً', ko:'과목당 40명 이상의 학생에게 머신러닝 및 고급 데이터베이스 강의' },
    'exp.j5.b2':{ id:'Mengajar Big Data, Analitik Data, dan Machine Learning dengan Python + RapidMiner (Feb–Jun 2023)', en:'Taught Big Data, Data Analytics, and Machine Learning in Python + RapidMiner (Feb–Jun 2023)', jv:'Ngajar Big Data, Analitik Data, lan Machine Learning', su:'Ngajar Big Data, Analitik Data, sareng Machine Learning', bal:'Ngajar Big Data, Analitik Data, lan Machine Learning', lam:'Mengajar Big Data, Analitik Data, dan Machine Learning', zh:'教授Python+RapidMiner的大数据、数据分析和机器学习（2023年2月至6月）', ja:'Python + RapidMinerでビッグデータ・データ分析・機械学習を教えた', ru:'Преподавал Big Data, аналитику данных и ML с Python + RapidMiner', fr:'Enseigné Big Data, analytique de données et ML avec Python + RapidMiner', es:'Enseñó Big Data, análisis de datos y ML con Python + RapidMiner', ar:'علّم Big Data وتحليلات البيانات و ML باستخدام Python + RapidMiner', ko:'Python + RapidMiner으로 빅데이터, 데이터 분석, 머신러닝 강의' },
    'exp.j5.b3':{ id:'Mengajar konsep big data kepada 170+ mahasiswa menggunakan SQL, RapidMiner, Python (Sep 2022–Jan 2023)', en:'Taught big data concepts to 170+ students using SQL, RapidMiner, Python (Sep 2022–Jan 2023)', jv:'Ngajar konsep big data marang 170+ mahasiswa', su:'Ngajar konsep big data ka 170+ mahasiswa', bal:'Ngajar konsep big data ring 170+ mahasiswa', lam:'Mengajar konsep big data kepada 170+ mahasiswa', zh:'使用SQL、RapidMiner、Python向170多名学生教授大数据概念', ja:'SQL、RapidMiner、Pythonを使ってビッグデータの概念を170人以上の学生に教えた', ru:'Преподавал концепции больших данных 170+ студентам', fr:'Enseigné les concepts Big Data à 170+ étudiants', es:'Enseñó conceptos de Big Data a más de 170 estudiantes', ar:'علّم مفاهيم البيانات الضخمة لأكثر من 170 طالباً', ko:'SQL, RapidMiner, Python을 사용하여 170명 이상의 학생에게 빅데이터 개념 강의' },
    'exp.j5.b4':{ id:'Mengajar Pemrograman C untuk Data Science kepada kelompok privat 20 mahasiswa (Sep 2021–Jan 2022)', en:'Taught C Programming for Data Science to private group of 20 students (Sep 2021–Jan 2022)', jv:'Ngajar Pemrograman C kanggo Data Science', su:'Ngajar Pemrograman C pikeun Data Science', bal:'Ngajar Pemrograman C anggen Data Science', lam:'Mengajar Pemrograman C untuk Data Science', zh:'向20名学生的私人小组教授数据科学C编程', ja:'データサイエンスのためのCプログラミングを20人の私的グループに教えた', ru:'Преподавал программирование на C для Data Science частной группе из 20 студентов', fr:'Enseigné la programmation C pour Data Science à un groupe privé de 20 étudiants', es:'Enseñó programación C para Data Science a un grupo privado de 20 estudiantes', ar:'علّم برمجة C لعلوم البيانات لمجموعة خاصة من 20 طالباً', ko:'20명의 개인 그룹에 데이터 과학을 위한 C 프로그래밍 강의' },
    'exp.j5.b5':{ id:'Menghubungkan Big Data dengan Hubungan Internasional untuk pengambilan keputusan berbasis kebijakan', en:'Correlated Big Data with International Relations for policy-informed decision-making', jv:'Nyambungake Big Data karo Hubungan Internasional', su:'Nyambungkeun Big Data sareng Hubungan Internasional', bal:'Nyambungang Big Data lan Hubungan Internasional', lam:'Menghubungkan Big Data dengan Hubungan Internasional', zh:'将大数据与国际关系相结合，用于政策驱动的决策', ja:'ビッグデータを国際関係と相関させ、政策に基づく意思決定に活用', ru:'Соотнёс Big Data с международными отношениями', fr:'Corrélé le Big Data avec les relations internationales', es:'Correlacionó Big Data con Relaciones Internacionales', ar:'ربط البيانات الضخمة بالعلاقات الدولية', ko:'정책 기반 의사결정을 위해 빅데이터와 국제관계 상관관계 분석' },
    'exp.j6.b1':{ id:'Mengembangkan skrip virus untuk pengujian keamanan sistem dan kesadaran kerentanan', en:'Developed virus scripts for system security testing and vulnerability awareness', jv:'Ngembangake skrip virus kanggo pengujian keamanan sistem', su:'Ngamekarkeun skrip virus pikeun nguji kaamanan sistem', bal:'Ngemekaryang skrip virus anggen pengujian kaamanan sistem', lam:'Mengembangkan skrip virus untuk pengujian keamanan sistem', zh:'开发病毒脚本用于系统安全测试和漏洞意识', ja:'システムセキュリティテストと脆弱性認識のためのウイルススクリプトを開発', ru:'Разработал вирусные скрипты для тестирования безопасности систем', fr:'Développé des scripts virus pour les tests de sécurité système', es:'Desarrolló scripts de virus para pruebas de seguridad del sistema', ar:'طور سكريبتات فيروسية لاختبار أمان النظام', ko:'시스템 보안 테스트 및 취약점 인식을 위한 바이러스 스크립트 개발' },
    'exp.j6.b2':{ id:'Merancang kegiatan keamanan siber ofensif dan defensif', en:'Designed activities: "System Security Testing via Offensive/Defensive Strategies," "Defacement & Countermeasures," "DDoS/DoS Simulation"', jv:'Ngrancang kegiatan keamanan siber', su:'Ngarancang kagiatan kaamanan siber', bal:'Ngrancang kagiatan kaamanan siber', lam:'Merancang kegiatan keamanan siber', zh:'设计活动：系统安全测试、网站篡改与对策、DDoS/DoS模拟', ja:'サイバーセキュリティ活動を設計', ru:'Разработал мероприятия по кибербезопасности', fr:'Conçu des activités de cybersécurité offensives et défensives', es:'Diseñó actividades de ciberseguridad ofensivas y defensivas', ar:'صمّم الأنشطة الأمنية الهجومية والدفاعية', ko:'사이버보안 공격적/방어적 활동 설계' },
    'exp.j6.b3':{ id:'Mendorong pembelajaran kolaboratif dalam menganalisis dan mengamankan sistem dari ancaman siber', en:'Promoted collaborative learning on analyzing and securing systems from cyber threats', jv:'Nyengkuyung sinau kolaboratif', su:'Nyengkuyung diajar kolaboratif', bal:'Nyengkuyung melajah kolaboratif', lam:'Mendorong pembelajaran kolaboratif', zh:'促进协作学习，分析和保护系统免受网络威胁', ja:'サイバー脅威からシステムを分析・保護する協調学習を推進', ru:'Продвигал совместное обучение по анализу и защите систем', fr:'Promu l\'apprentissage collaboratif pour analyser et sécuriser les systèmes', es:'Promovió el aprendizaje colaborativo en el análisis y protección de sistemas', ar:'روّج للتعلم التعاوني في تحليل الأنظمة وتأمينها', ko:'사이버 위협으로부터 시스템을 분석하고 보호하는 협력 학습 촉진' },
    /* ══════════ PROJECTS ══════════ */
    'proj.filter.all':{ id:'Semua', jv:'Kabeh', su:'Sadayana', bal:'Sareng', lam:'Semua', en:'All', zh:'全部', ja:'すべて', ru:'Все', fr:'Tous', es:'Todos', ar:'الكل', ko:'전체' },
    'proj.filter.nlp':{ id:'NLP / LLM', jv:'NLP / LLM', su:'NLP / LLM', bal:'NLP / LLM', lam:'NLP / LLM', en:'NLP / LLM', zh:'NLP / 大语言模型', ja:'NLP / LLM', ru:'NLP / LLM', fr:'NLP / LLM', es:'NLP / LLM', ar:'NLP / LLM', ko:'NLP / LLM' },
    'proj.filter.cv':{ id:'Penglihatan Komputer', jv:'Computer Vision', su:'Computer Vision', bal:'Computer Vision', lam:'Computer Vision', en:'Computer Vision', zh:'计算机视觉', ja:'コンピュータビジョン', ru:'Компьютерное зрение', fr:'Vision par ordinateur', es:'Visión por computadora', ar:'رؤية الحاسوب', ko:'컴퓨터 비전' },
    'proj.filter.health':{ id:'Kesehatan', jv:'Kesehatan', su:'Kaséhatan', bal:'Kesehatan', lam:'Kesehatan', en:'Healthcare', zh:'医疗', ja:'医療', ru:'Здравоохранение', fr:'Santé', es:'Salud', ar:'الرعاية الصحية', ko:'의료' },
    'proj.filter.culture':{ id:'Budaya', jv:'Budaya', su:'Budaya', bal:'Budaya', lam:'Budaya', en:'Culture', zh:'文化', ja:'文化', ru:'Культура', fr:'Culture', es:'Cultura', ar:'الثقافة', ko:'문화' },
    'proj.filter.mfg':{ id:'Manufaktur', jv:'Manufaktur', su:'Manufaktur', bal:'Manufaktur', lam:'Manufaktur', en:'Manufacturing', zh:'制造业', ja:'製造業', ru:'Производство', fr:'Fabrication', es:'Manufactura', ar:'التصنيع', ko:'제조업' },
    'proj.filter.web3':{ id:'Web3', jv:'Web3', su:'Web3', bal:'Web3', lam:'Web3', en:'Web3', zh:'Web3', ja:'Web3', ru:'Web3', fr:'Web3', es:'Web3', ar:'Web3', ko:'Web3' },
    'proj.p1.tag':{ id:'Unggulan · AI Multimodal', en:'Flagship · Multimodal AI', jv:'Unggulan · AI Multimodal', su:'Unggulan · AI Multimodal', bal:'Unggulan · AI Multimodal', lam:'Unggulan · AI Multimodal', zh:'旗舰 · 多模态AI', ja:'フラッグシップ · マルチモーダルAI', ru:'Флагман · Мультимодальный ИИ', fr:'Phare · IA multimodale', es:'Insignia · IA multimodal', ar:'الرائد · AI متعدد الوسائط', ko:'플래그십 · 멀티모달 AI' },
    'proj.p2.tag':{ id:'NLP · OCR', en:'NLP · OCR', jv:'NLP · OCR', su:'NLP · OCR', bal:'NLP · OCR', lam:'NLP · OCR', zh:'NLP · OCR', ja:'NLP · OCR', ru:'NLP · OCR', fr:'NLP · OCR', es:'NLP · OCR', ar:'NLP · OCR', ko:'NLP · OCR' },
    'proj.p3.tag':{ id:'Model Fondasi', en:'Foundation Model', jv:'Model Fondasi', su:'Modél Fondasi', bal:'Modél Fondasi', lam:'Model Fondasi', zh:'基础模型', ja:'基盤モデル', ru:'Базовая модель', fr:'Modèle fondateur', es:'Modelo fundacional', ar:'نموذج أساسي', ko:'기반 모델' },
    'proj.p4.tag':{ id:'Model Fondasi 2B', en:'Foundation Model 2B', jv:'Model Fondasi 2B', su:'Modél Fondasi 2B', bal:'Modél Fondasi 2B', lam:'Model Fondasi 2B', zh:'基础模型 2B', ja:'基盤モデル 2B', ru:'Базовая модель 2B', fr:'Modèle fondateur 2B', es:'Modelo fundacional 2B', ar:'نموذج أساسي 2B', ko:'기반 모델 2B' },
    'proj.p5.tag':{ id:'Web3 · Budaya', en:'Web3 · Cultural', jv:'Web3 · Budaya', su:'Web3 · Budaya', bal:'Web3 · Budaya', lam:'Web3 · Budaya', zh:'Web3 · 文化', ja:'Web3 · 文化', ru:'Web3 · Культура', fr:'Web3 · Culturel', es:'Web3 · Cultural', ar:'Web3 · الثقافة', ko:'Web3 · 문화' },
    'proj.p7.tag':{ id:'Perkeretaapian · Keselamatan', en:'Railway · Safety', jv:'Kereta Api · Keselamatan', su:'Karéta Api · Kaamanan', bal:'Keréta Api · Kaamanan', lam:'Kereta Api · Keselamatan', zh:'铁路 · 安全', ja:'鉄道 · 安全', ru:'Железная дорога · Безопасность', fr:'Ferroviaire · Sécurité', es:'Ferroviario · Seguridad', ar:'السكك الحديدية · السلامة', ko:'철도 · 안전' },
    'proj.p8.tag':{ id:'Kesehatan · NLP', en:'Healthcare · NLP', jv:'Kesehatan · NLP', su:'Kaséhatan · NLP', bal:'Kesehatan · NLP', lam:'Kesehatan · NLP', zh:'医疗 · NLP', ja:'医療 · NLP', ru:'Здравоохранение · NLP', fr:'Santé · NLP', es:'Salud · NLP', ar:'الرعاية الصحية · NLP', ko:'의료 · NLP' },
    'proj.p9.tag':{ id:'Kesehatan · LLM', en:'Healthcare · LLM', jv:'Kesehatan · LLM', su:'Kaséhatan · LLM', bal:'Kesehatan · LLM', lam:'Kesehatan · LLM', zh:'医疗 · LLM', ja:'医療 · LLM', ru:'Здравоохранение · LLM', fr:'Santé · LLM', es:'Salud · LLM', ar:'الرعاية الصحية · LLM', ko:'의료 · LLM' },
    'proj.p10.tag':{ id:'Manufaktur · CFD', en:'Manufacturing · CFD', jv:'Manufaktur · CFD', su:'Manufaktur · CFD', bal:'Manufaktur · CFD', lam:'Manufaktur · CFD', zh:'制造业 · CFD', ja:'製造業 · CFD', ru:'Производство · CFD', fr:'Fabrication · CFD', es:'Manufactura · CFD', ar:'التصنيع · CFD', ko:'제조업 · CFD' },
    'proj.p11.tag':{ id:'Manufaktur · ML', en:'Manufacturing · ML', jv:'Manufaktur · ML', su:'Manufaktur · ML', bal:'Manufaktur · ML', lam:'Manufaktur · ML', zh:'制造业 · ML', ja:'製造業 · ML', ru:'Производство · ML', fr:'Fabrication · ML', es:'Manufactura · ML', ar:'التصنيع · ML', ko:'제조업 · ML' },
    'proj.p12.tag':{ id:'Audio · AI', en:'Audio · AI', jv:'Audio · AI', su:'Audio · AI', bal:'Audio · AI', lam:'Audio · AI', zh:'音频 · AI', ja:'オーディオ · AI', ru:'Аудио · ИИ', fr:'Audio · IA', es:'Audio · IA', ar:'صوت · AI', ko:'오디오 · AI' },
    'proj.p13.tag':{ id:'Kesehatan · SisRek', en:'Health · RecSys', jv:'Kesehatan · SisRek', su:'Kaséhatan · SisRék', bal:'Kesehatan · SisRék', lam:'Kesehatan · SisRek', zh:'健康 · 推荐系统', ja:'健康 · 推薦システム', ru:'Здоровье · Рекомендательная система', fr:'Santé · SysRec', es:'Salud · SisRec', ar:'الصحة · نظام توصية', ko:'건강 · 추천 시스템' },
    'proj.p15.tag':{ id:'CV · AI Tepi', en:'CV · Edge AI', jv:'CV · Edge AI', su:'CV · Edge AI', bal:'CV · Edge AI', lam:'CV · Edge AI', zh:'CV · 边缘AI', ja:'CV · エッジAI', ru:'CV · Периферийный ИИ', fr:'CV · IA embarquée', es:'CV · IA en el borde', ar:'CV · AI الحافة', ko:'CV · 엣지 AI' },
    'proj.p16.tag':{ id:'Ilmu Data · Kebijakan', en:'Data Science · Policy', jv:'Ilmu Data · Kebijakan', su:'Élmu Data · Kawijakan', bal:'Ilmu Data · Kebijakan', lam:'Ilmu Data · Kebijakan', zh:'数据科学 · 政策', ja:'データサイエンス · 政策', ru:'Наука о данных · Политика', fr:'Data Science · Politique', es:'Ciencia de datos · Política', ar:'علوم البيانات · السياسة', ko:'데이터 사이언스 · 정책' },
    'proj.p17.tag':{ id:'MLOps · Python', en:'MLOps · Python', jv:'MLOps · Python', su:'MLOps · Python', bal:'MLOps · Python', lam:'MLOps · Python', zh:'MLOps · Python', ja:'MLOps · Python', ru:'MLOps · Python', fr:'MLOps · Python', es:'MLOps · Python', ar:'MLOps · Python', ko:'MLOps · Python' },
    'proj.p18.tag':{ id:'AI Medis · NVIDIA', en:'Medical AI · NVIDIA', jv:'AI Medis · NVIDIA', su:'AI Médis · NVIDIA', bal:'AI Médis · NVIDIA', lam:'AI Medis · NVIDIA', zh:'医疗AI · NVIDIA', ja:'医療AI · NVIDIA', ru:'Медицинский ИИ · NVIDIA', fr:'IA médicale · NVIDIA', es:'IA médica · NVIDIA', ar:'AI الطبي · NVIDIA', ko:'의료 AI · NVIDIA' },
    /* ══════════ ACHIEVEMENTS ══════════ */
    'ach.cat.awards':{ id:'Penghargaan & Hibah', en:'Awards & Grants', jv:'Penghargaan & Hibah', su:'Pangajén & Hibah', bal:'Pangajén & Hibah', lam:'Penghargaan & Hibah', zh:'奖项与资助', ja:'受賞・助成金', ru:'Награды и гранты', fr:'Prix et subventions', es:'Premios y subvenciones', ar:'الجوائز والمنح', ko:'수상 및 보조금' },
    'ach.cat.academic':{ id:'Akademik', en:'Academic', jv:'Akademik', su:'Akademik', bal:'Akademik', lam:'Akademik', zh:'学术', ja:'学術', ru:'Академические', fr:'Académique', es:'Académico', ar:'الأكاديمية', ko:'학술' },
    'ach.cat.speaking':{ id:'Berbicara di Depan Umum', en:'Public Speaking', jv:'Ngomong Ngarep Umum', su:'Nyarios di Hareupeun Umum', bal:'Maomong ring Ajeng Umum', lam:'Berbicara di Depan Umum', zh:'公开演讲', ja:'パブリックスピーキング', ru:'Публичные выступления', fr:'Prise de parole en public', es:'Oratoria', ar:'الخطابة العامة', ko:'공개 연설' },
    'ach.h.recognition':{ id:'Pengakuan', en:'Recognition', jv:'Pengakuan', su:'Pangakuan', bal:'Pangakuan', lam:'Pengakuan', zh:'荣誉', ja:'受賞歴', ru:'Признание', fr:'Reconnaissance', es:'Reconocimiento', ar:'الاعتراف', ko:'수상 경력' },
    'ach.h.education':{ id:'Pendidikan', en:'Education', jv:'Pendidikan', su:'Atikan', bal:'Pendidikan', lam:'Pendidikan', zh:'教育', ja:'教育', ru:'Образование', fr:'Éducation', es:'Educación', ar:'التعليم', ko:'교육' },
    'ach.h.talks':{ id:'Ceramah & Seminar', en:'Talks & Seminars', jv:'Ceramah & Seminar', su:'Ceramah & Seminar', bal:'Ceramah & Seminar', lam:'Ceramah & Seminar', zh:'演讲与研讨', ja:'講演・セミナー', ru:'Выступления и семинары', fr:'Conférences & Séminaires', es:'Charlas y seminarios', ar:'المحاضرات والندوات', ko:'강연 및 세미나' },
    'ach.edu1.deg':{ id:'Pra-Doktor Filsafat', en:'Pre-Doctor of Philosophy', jv:'Pra-Doktor Filsafat', su:'Pra-Doktor Filsafat', bal:'Pra-Doktor Filsafat', lam:'Pra-Doktor Filsafat', zh:'博士前', ja:'プレ博士（哲学）', ru:'Пре-Доктор философии', fr:'Pré-Doctorat en philosophie', es:'Pre-Doctor en Filosofía', ar:'ما قبل الدكتوراه في الفلسفة', ko:'예비 철학 박사' },
    'ach.edu2.deg':{ id:'Sarjana Ilmu Komputer (S.Kom)', en:'Bachelor of Computer Science (S.Kom)', jv:'Sarjana Ilmu Komputer (S.Kom)', su:'Sarjana Élmu Komputer (S.Kom)', bal:'Sarjana Ilmu Komputer (S.Kom)', lam:'Sarjana Ilmu Komputer (S.Kom)', zh:'计算机科学学士', ja:'コンピュータサイエンス学士', ru:'Бакалавр компьютерных наук', fr:'Licence en informatique', es:'Licenciatura en Ciencias de la Computación', ar:'بكالوريوس علوم الحاسوب', ko:'컴퓨터 과학 학사' },
    'ach.edu3.deg':{ id:'Sarjana Sains (Hons) — Ekonomi Analitik', en:'Bachelor of Science (Hons) — Analytical Economics', jv:'Sarjana Sains (Hons) — Ekonomi Analitik', su:'Sarjana Sains (Hons) — Ékonomi Analitik', bal:'Sarjana Sains (Hons) — Ékonomi Analitik', lam:'Sarjana Sains (Hons) — Ekonomi Analitik', zh:'理学学士（荣誉）— 分析经济学', ja:'理学士（優等）— 分析経済学', ru:'Бакалавр наук (с отличием) — Аналитическая экономика', fr:'Licence ès sciences (Hons) — Économie analytique', es:'Licenciatura en Ciencias (Hons) — Economía Analítica', ar:'بكالوريوس العلوم (مع مرتبة الشرف) — الاقتصاد التحليلي', ko:'이학 학사(우등) — 분석 경제학' },
    /* ══════════ EDUCATION LABELS ══════════ */
    'edu.lbl.ra':{ id:'Bidang Riset', en:'Research Area', jv:'Bidang Riset', su:'Widang Riset', bal:'Widang Riset', lam:'Bidang Riset', zh:'研究领域', ja:'研究分野', ru:'Область исследований', fr:'Domaine de recherche', es:'Área de investigación', ar:'مجال البحث', ko:'연구 분야' },
    'edu.lbl.program':{ id:'Program', en:'Program', jv:'Program', su:'Program', bal:'Program', lam:'Program', zh:'项目', ja:'プログラム', ru:'Программа', fr:'Programme', es:'Programa', ar:'البرنامج', ko:'프로그램' },
    'edu.lbl.status':{ id:'Status', en:'Status', jv:'Status', su:'Status', bal:'Status', lam:'Status', zh:'状态', ja:'ステータス', ru:'Статус', fr:'Statut', es:'Estado', ar:'الحالة', ko:'상태' },
    'edu.lbl.notable':{ id:'Notable', en:'Notable', jv:'Notable', su:'Notable', bal:'Notable', lam:'Notable', zh:'亮点', ja:'注目', ru:'Примечательное', fr:'Notable', es:'Notable', ar:'بارز', ko:'주목할만한' },
    'edu.lbl.major':{ id:'Jurusan', en:'Major', jv:'Jurusan', su:'Jurusan', bal:'Jurusan', lam:'Jurusan', zh:'专业', ja:'専攻', ru:'Специализация', fr:'Majeure', es:'Especialidad', ar:'التخصص', ko:'전공' },
    'edu.lbl.minor':{ id:'Minor', en:'Minor', jv:'Minor', su:'Minor', bal:'Minor', lam:'Minor', zh:'辅修', ja:'副専攻', ru:'Второстепенный', fr:'Mineure', es:'Menor', ar:'الثانوي', ko:'부전공' },
    'edu.lbl.duration':{ id:'Durasi', en:'Duration', jv:'Durasi', su:'Durasi', bal:'Durasi', lam:'Durasi', zh:'时长', ja:'期間', ru:'Продолжительность', fr:'Durée', es:'Duración', ar:'المدة', ko:'기간' },
    'edu.lbl.role':{ id:'Peran', en:'Role', jv:'Peran', su:'Peran', bal:'Peran', lam:'Peran', zh:'角色', ja:'役割', ru:'Роль', fr:'Rôle', es:'Rol', ar:'الدور', ko:'역할' },
    'edu.lbl.field':{ id:'Bidang', en:'Field', jv:'Bidang', su:'Widang', bal:'Widang', lam:'Bidang', zh:'领域', ja:'分野', ru:'Область', fr:'Domaine', es:'Campo', ar:'الميدان', ko:'분야' },
    'edu.lbl.electives':{ id:'Pilihan', en:'Electives', jv:'Pilihan', su:'Pilihan', bal:'Pilihan', lam:'Pilihan', zh:'选修', ja:'選択科目', ru:'Факультативы', fr:'Options', es:'Optativas', ar:'الاختياريات', ko:'선택과목' },
    'edu.lbl.country':{ id:'Negara', en:'Country', jv:'Negara', su:'Nagara', bal:'Nagara', lam:'Negara', zh:'国家', ja:'国', ru:'Страна', fr:'Pays', es:'País', ar:'الدولة', ko:'국가' },
    'edu.lbl.honors':{ id:'Penghargaan', en:'Honors', jv:'Penghargaan', su:'Pangajén', bal:'Pangajén', lam:'Penghargaan', zh:'荣誉', ja:'優等', ru:'Отличие', fr:'Mention', es:'Honores', ar:'المرتبة', ko:'우등' },
    /* ══════════ CONTACT ══════════ */
    'con.label':{ id:'Hubungi', en:'Get in Touch', jv:'Hubungi', su:'Hubungi', bal:'Hubungi', lam:'Hubungi', zh:'联系我', ja:'お問い合わせ', ru:'Связаться', fr:'Contacter', es:'Contactar', ar:'تواصل', ko:'연락하기' },
    'con.lbl.email':{ id:'Email', en:'Email', jv:'Email', su:'Email', bal:'Email', lam:'Email', zh:'邮箱', ja:'メール', ru:'Email', fr:'E-mail', es:'Correo', ar:'البريد الإلكتروني', ko:'이메일' },
    'con.lbl.phone':{ id:'Telepon / WhatsApp', en:'Phone / WhatsApp', jv:'Telepon / WhatsApp', su:'Telepon / WhatsApp', bal:'Telepon / WhatsApp', lam:'Telepon / WhatsApp', zh:'电话/WhatsApp', ja:'電話/WhatsApp', ru:'Телефон/WhatsApp', fr:'Téléphone/WhatsApp', es:'Teléfono/WhatsApp', ar:'هاتف/واتساب', ko:'전화/WhatsApp' },
    'con.lbl.location':{ id:'Lokasi', en:'Location', jv:'Lokasi', su:'Lokasi', bal:'Lokasi', lam:'Lokasi', zh:'位置', ja:'場所', ru:'Местоположение', fr:'Localisation', es:'Ubicación', ar:'الموقع', ko:'위치' },
    'con.lbl.academic':{ id:'Akademik', en:'Academic', jv:'Akademik', su:'Akademik', bal:'Akademik', lam:'Akademik', zh:'学术', ja:'学術', ru:'Академический', fr:'Académique', es:'Académico', ar:'الأكاديمي', ko:'학술' },
    'con.lbl.company':{ id:'Perusahaan', en:'Company', jv:'Perusahaan', su:'Perusahaan', bal:'Perusahaan', lam:'Perusahaan', zh:'公司', ja:'会社', ru:'Компания', fr:'Entreprise', es:'Empresa', ar:'الشركة', ko:'회사' },
    'con.form.title':{ id:'Kirim Pesan', en:'Send a Message', jv:'Kirim Pesan', su:'Kirim Pesen', bal:'Kirim Pesan', lam:'Kirim Pesan', zh:'发送消息', ja:'メッセージを送る', ru:'Отправить сообщение', fr:'Envoyer un message', es:'Enviar mensaje', ar:'إرسال رسالة', ko:'메시지 보내기' },
    'con.form.fname':{ id:'Nama Depan', en:'First Name', jv:'Jeneng Ngarep', su:'Ngaran Hareup', bal:'Aran Arep', lam:'Nama Depan', zh:'名字', ja:'名', ru:'Имя', fr:'Prénom', es:'Nombre', ar:'الاسم الأول', ko:'이름' },
    'con.form.lname':{ id:'Nama Belakang', en:'Last Name', jv:'Jeneng Mburi', su:'Ngaran Tukang', bal:'Aran Pungkur', lam:'Nama Belakang', zh:'姓氏', ja:'姓', ru:'Фамилия', fr:'Nom de famille', es:'Apellido', ar:'اسم العائلة', ko:'성' },
    'con.form.email':{ id:'Email', en:'Email', jv:'Email', su:'Email', bal:'Email', lam:'Email', zh:'邮箱', ja:'メール', ru:'Email', fr:'E-mail', es:'Correo', ar:'البريد الإلكتروني', ko:'이메일' },
    'con.form.org':{ id:'Organisasi', en:'Organization', jv:'Organisasi', su:'Organisasi', bal:'Organisasi', lam:'Organisasi', zh:'组织', ja:'組織', ru:'Организация', fr:'Organisation', es:'Organización', ar:'المنظمة', ko:'조직' },
    'con.form.subject':{ id:'Subjek', en:'Subject', jv:'Subjek', su:'Subjek', bal:'Subjek', lam:'Subjek', zh:'主题', ja:'件名', ru:'Тема', fr:'Sujet', es:'Asunto', ar:'الموضوع', ko:'제목' },
    'con.form.msg':{ id:'Pesan', en:'Message', jv:'Pesan', su:'Pesen', bal:'Pesan', lam:'Pesan', zh:'消息', ja:'メッセージ', ru:'Сообщение', fr:'Message', es:'Mensaje', ar:'الرسالة', ko:'메시지' },
    'con.form.btn':{ id:'Kirim Pesan →', en:'Send Message →', jv:'Kirim Pesan →', su:'Kirim Pesen →', bal:'Kirim Pesan →', lam:'Kirim Pesan →', zh:'发送消息 →', ja:'メッセージを送る →', ru:'Отправить →', fr:'Envoyer →', es:'Enviar →', ar:'إرسال →', ko:'메시지 보내기 →' },
    'con.form.sent':{ id:'Pesan Terkirim!', en:'Message Sent!', jv:'Pesan Wis Kirim!', su:'Pesen Parantos Dikirim!', bal:'Pesan Sampun Kirim!', lam:'Pesan Dah Kirim!', zh:'消息已发送！', ja:'メッセージが送信されました！', ru:'Сообщение отправлено!', fr:'Message envoyé !', es:'¡Mensaje enviado!', ar:'تم إرسال الرسالة!', ko:'메시지 전송됨!' },
    'con.ql.projects':{ id:'Lihat Proyek →', en:'View Projects →', jv:'Liyat Proyek →', su:'Tingal Proyék →', bal:'Tingalin Proyék →', lam:'Liat Proyek →', zh:'查看项目 →', ja:'プロジェクトを見る →', ru:'Проекты →', fr:'Voir les projets →', es:'Ver proyectos →', ar:'عرض المشاريع →', ko:'프로젝트 보기 →' },
    'con.ql.exp':{ id:'Pengalaman →', en:'Experience →', jv:'Pengalaman →', su:'Pangalaman →', bal:'Pengalaman →', lam:'Pengalaman →', zh:'经历 →', ja:'経歴 →', ru:'Опыт →', fr:'Expérience →', es:'Experiencia →', ar:'الخبرة →', ko:'경험 →' },
    'con.ql.ach':{ id:'Prestasi →', en:'Achievements →', jv:'Prestasi →', su:'Prestasi →', bal:'Prestasi →', lam:'Prestasi →', zh:'成就 →', ja:'実績 →', ru:'Достижения →', fr:'Réalisations →', es:'Logros →', ar:'الإنجازات →', ko:'업적 →' },
    'con.ql.skills':{ id:'Keahlian →', en:'Skills →', jv:'Keahlian →', su:'Kaahliyan →', bal:'Kaprigelan →', lam:'Keahlian →', zh:'技能 →', ja:'スキル →', ru:'Навыки →', fr:'Compétences →', es:'Habilidades →', ar:'المهارات →', ko:'기술 →' },
    /* ══════════ TALKS ══════════ */
    'talks.stat.seminars':{ id:'Seminar', en:'Seminars', jv:'Seminar', su:'Seminar', bal:'Seminar', lam:'Seminar', zh:'研讨会', ja:'セミナー', ru:'Семинары', fr:'Séminaires', es:'Seminarios', ar:'الندوات', ko:'세미나' },
    'talks.stat.workshops':{ id:'Workshop', en:'Workshops', jv:'Workshop', su:'Workshop', bal:'Workshop', lam:'Workshop', zh:'工作坊', ja:'ワークショップ', ru:'Воркшопы', fr:'Ateliers', es:'Talleres', ar:'ورش العمل', ko:'워크샵' },
    'talks.stat.lectures':{ id:'Kuliah Umum', en:'Public Lectures', jv:'Kuliah Umum', su:'Kuliah Umum', bal:'Kuliah Umum', lam:'Kuliah Umum', zh:'公开讲座', ja:'公開講義', ru:'Публичные лекции', fr:'Conférences publiques', es:'Conferencias públicas', ar:'المحاضرات العامة', ko:'공개 강의' },
    'talks.stat.judge':{ id:'Panel Juri', en:'Judge Panels', jv:'Panel Juri', su:'Panel Juri', bal:'Panel Juri', lam:'Panel Juri', zh:'评委席', ja:'審査員', ru:'Жюри', fr:'Panels de jury', es:'Paneles de jurado', ar:'لجان التحكيم', ko:'심사 패널' },
    'talks.stat.mentor':{ id:'Peran Mentor', en:'Mentor Roles', jv:'Peran Mentor', su:'Peran Mentor', bal:'Peran Mentor', lam:'Peran Mentor', zh:'导师角色', ja:'メンター役', ru:'Наставничество', fr:'Rôles de mentor', es:'Roles de mentor', ar:'أدوار الإرشاد', ko:'멘토 역할' },
    'talks.badge.keynote':{ id:'Pembicara Utama', en:'Keynote', jv:'Pembicara Utama', su:'Pembicara Utama', bal:'Pembicara Utama', lam:'Pembicara Utama', zh:'主旨演讲', ja:'基調講演', ru:'Пленарный докладчик', fr:'Conférencier principal', es:'Conferencia magistral', ar:'خطاب رئيسي', ko:'기조연설' },
    'talks.badge.speaker':{ id:'Pembicara', en:'Speaker', jv:'Pembicara', su:'Pembicara', bal:'Pembicara', lam:'Pembicara', zh:'演讲者', ja:'スピーカー', ru:'Докладчик', fr:'Intervenant', es:'Ponente', ar:'متحدث', ko:'연사' },
    'talks.badge.panelist':{ id:'Panelis', en:'Panelist', jv:'Panelis', su:'Panelis', bal:'Panelis', lam:'Panelis', zh:'小组成员', ja:'パネリスト', ru:'Участник панели', fr:'Panéliste', es:'Panelista', ar:'عضو في اللجنة', ko:'패널리스트' },
    'talks.badge.judge':{ id:'Juri', en:'Judge', jv:'Juri', su:'Juri', bal:'Juri', lam:'Juri', zh:'评委', ja:'審査員', ru:'Судья', fr:'Juge', es:'Juez', ar:'حكم', ko:'심사위원' },
    'talks.badge.mentor':{ id:'Mentor', en:'Mentor', jv:'Mentor', su:'Mentor', bal:'Mentor', lam:'Mentor', zh:'导师', ja:'メンター', ru:'Наставник', fr:'Mentor', es:'Mentor', ar:'مرشد', ko:'멘토' },
    'talks.sec.seminars':{ id:'Seminar', en:'Seminars', jv:'Seminar', su:'Seminar', bal:'Seminar', lam:'Seminar', zh:'研讨会', ja:'セミナー', ru:'Семинары', fr:'Séminaires', es:'Seminarios', ar:'الندوات', ko:'세미나' },
    'talks.sec.workshops':{ id:'Workshop', en:'Workshops', jv:'Workshop', su:'Workshop', bal:'Workshop', lam:'Workshop', zh:'工作坊', ja:'ワークショップ', ru:'Воркшопы', fr:'Ateliers', es:'Talleres', ar:'ورش العمل', ko:'워크샵' },
    'talks.sec.lectures':{ id:'Kuliah Umum', en:'Public Lectures', jv:'Kuliah Umum', su:'Kuliah Umum', bal:'Kuliah Umum', lam:'Kuliah Umum', zh:'公开讲座', ja:'公開講義', ru:'Публичные лекции', fr:'Conférences publiques', es:'Conferencias públicas', ar:'المحاضرات العامة', ko:'공개 강의' },
"""

def patch_lang_js():
    print('\n[1/3] Patching js/lang.js ...')
    sentinel = "'exp.j1.role':"
    content = read(JS)
    if sentinel in content:
        skp('T_EXT already in lang.js')
        return
    # Find closing }; of T object
    lines = content.split('\n')
    close_idx = None
    for i, line in enumerate(lines):
        if "'footer.contact_h'" in line:
            for j in range(i+1, len(lines)):
                if lines[j].strip() == '};':
                    close_idx = j
                    break
            break
    if close_idx is None:
        print('  ERROR: cannot find T object closing — skipping lang.js patch')
        return
    lines.insert(close_idx, T_EXT)
    write(JS, '\n'.join(lines))
    ok(f'lang.js — T_EXT merged ({len(T_EXT):,} chars)')


# ══════════════════════════════════════════════════════════════
# 2. INJECT lang.js SCRIPT TAG INTO ALL PAGES
# ══════════════════════════════════════════════════════════════
ALL_PAGES = ['experience','projects','achievements','education','talks',
             'contact','skills','volunteering','ai-lab']

def patch_script_tags():
    print('\n[2/3] Injecting lang.js <script> tags ...')
    for name in ALL_PAGES:
        p = page(name)
        if not os.path.exists(p): continue
        c = read(p)
        if 'lang.js' in c:
            skp(f'{name}/index.html')
            continue
        if '<script src="/js/shared.js"></script>' in c:
            c = c.replace('<script src="/js/shared.js"></script>',
                          '<script src="/js/shared.js"></script>\n<script src="/js/lang.js"></script>', 1)
        elif '</body>' in c:
            c = c.replace('</body>', '<script src="/js/lang.js"></script>\n</body>', 1)
        write(p, c)
        ok(f'{name}/index.html')


# ══════════════════════════════════════════════════════════════
# 3. TAG data-i18n IN HTML PAGES
# ══════════════════════════════════════════════════════════════
def tag_pages():
    print('\n[3/3] Tagging data-i18n attributes ...')

    # ── EXPERIENCE ──────────────────────────────────────────
    p = page('experience'); c = read(p); before = c.count('data-i18n=')

    for text, key in [
        ('AI Community Lead','exp.j1.role'),
        ('Founder & Chief Executive Officer','exp.j2.role'),
        ('Artificial Intelligence Engineer — Manufacturing','exp.j3.role'),
        ('Machine Learning Engineer','exp.j4.role'),
        ('Teaching Assistant — ML, Big Data, Web, C, Databases','exp.j5.role'),
        ('Co-Founder & Lead — Large-Scale Cybersecurity Projects','exp.j6.role'),
    ]:
        c = patch(c, f'<div class="tl-role">{text}</div>',
                     f'<div class="tl-role" data-i18n="{key}">{text}</div>', key)

    for text, key in [
        ('Building and leading initiatives that empower aspiring and professional AI practitioners across Indonesia.','exp.j1.desc'),
        ('IT Consulting that prepares digital talent for the AI world through project-based and open-source initiatives. Focused on AI for Culture, Healthcare, and Wellness.','exp.j2.desc'),
        ("Spearheaded AI-driven automation and optimization in one of Indonesia's largest pharmaceutical companies.",'exp.j3.desc'),
        ('Joined forces with nearly a dozen third-party companies and institutions to integrate innovative AI solutions.','exp.j4.desc'),
        ('Four-semester series of teaching roles spanning ML, Big Data Analytics, Web Programming, and C Programming Language.','exp.j5.desc'),
        ('Led a large-scale collaborative cybersecurity project involving contributors across Indonesia, exploring both offensive and defensive security strategies.','exp.j6.desc'),
    ]:
        c = patch(c, f'<div class="tl-desc">{text}</div>',
                     f'<div class="tl-desc" data-i18n="{key}">{text}</div>', key)

    BULLETS_EXP = [
        ('Created collaborative AI ecosystems through hands-on workshops and study groups','exp.j1.b1'),
        ('Led open-source projects connecting Indonesian AI practitioners','exp.j1.b2'),
        ('Established strategic partnerships across the region','exp.j1.b3'),
        ('Built 10 specialized Houses: Bioinformatics, Computer Vision, Competition Team, Data Engineer, Data Science, Expert System, Generative AI, Machine Learning, NLP, UI/UX','exp.j2.b1'),
        ('Delivered 20+ projects and 2 main AI products with production-level deployment','exp.j2.b2'),
        ('Held 5 Exclusive Classes and mentored competition teams to national finals','exp.j2.b3'),
        ('Automated defect detection on aluminum packaging using advanced Computer Vision techniques','exp.j3.b1'),
        ('Built Health Lifestyle Recommendation System using LightFM and Surprise — featured at National Data Science Tournament','exp.j3.b2'),
        ('Developed energy optimization strategies for spray dryers using Computational Fluid Dynamics + ML with Large Eddy Simulation','exp.j3.b3'),
        ('Predicted moisture content in milk production using LSTM, XGBoost, and decision trees','exp.j3.b4'),
        ('Collaborated on genomic data analysis at NutrigenMe for personalized health solutions','exp.j3.b5'),
        ('Reproduced Reynolds-Averaged Navier-Stokes (RANS) simulation code from literature','exp.j3.b6'),
        ("Collaborated closely with external partners to integrate ML innovations into X's platform",'exp.j4.b1'),
        ("Expanded X's technology reach through dynamic ecosystem of innovation",'exp.j4.b2'),
        ('Delivered cross-organizational projects combining AI and platform engineering','exp.j4.b3'),
        ('Taught Machine Learning and Advanced Databases to 40+ students per subject (Feb–Jun 2024)','exp.j5.b1'),
        ('Taught Big Data, Data Analytics, and Machine Learning in Python + RapidMiner (Feb–Jun 2023)','exp.j5.b2'),
        ('Taught big data concepts to 170+ students using SQL, RapidMiner, Python (Sep 2022–Jan 2023)','exp.j5.b3'),
        ('Taught C Programming for Data Science to private group of 20 students (Sep 2021–Jan 2022)','exp.j5.b4'),
        ('Correlated Big Data with International Relations for policy-informed decision-making','exp.j5.b5'),
        ('Developed virus scripts for system security testing and vulnerability awareness','exp.j6.b1'),
        ('Promoted collaborative learning on analyzing and securing systems from cyber threats','exp.j6.b3'),
    ]
    for text, key in BULLETS_EXP:
        c = patch(c, f'<li>{text}</li>', f'<li data-i18n="{key}">{text}</li>', key)
    # j6.b2 — raw & in HTML
    c = patch(c,
        '<li>Designed activities: "System Security Testing via Offensive/Defensive Strategies," "Defacement & Countermeasures," "DDoS/DoS Simulation"</li>',
        '<li data-i18n="exp.j6.b2">Designed activities: "System Security Testing via Offensive/Defensive Strategies," "Defacement & Countermeasures," "DDoS/DoS Simulation"</li>',
        'exp.j6.b2')

    write(p, c)
    ok(f'experience  (+{c.count("data-i18n=") - before} tags, total={c.count("data-i18n=")})')

    # ── PROJECTS ────────────────────────────────────────────
    p = page('projects'); c = read(p); before = c.count('data-i18n=')

    c = patch(c, '<button class="filter-btn active" data-filter="all">All</button>',
                 '<button class="filter-btn active" data-filter="all" data-i18n="proj.filter.all">All</button>', 'filter.all')
    for flt, text, key in [
        ('nlp','NLP / LLM','proj.filter.nlp'),('cv','Computer Vision','proj.filter.cv'),
        ('health','Healthcare','proj.filter.health'),('culture','Culture','proj.filter.culture'),
        ('mfg','Manufacturing','proj.filter.mfg'),('web3','Web3','proj.filter.web3'),
    ]:
        c = patch(c, f'<button class="filter-btn" data-filter="{flt}">{text}</button>',
                     f'<button class="filter-btn" data-filter="{flt}" data-i18n="{key}">{text}</button>', key)

    # bc-tags
    c = patch(c,'<span class="bc-tag">Flagship · Multimodal AI</span>',
                '<span class="bc-tag" data-i18n="proj.p1.tag">Flagship · Multimodal AI</span>','p1.tag')
    for text, key in [
        ('NLP · OCR','proj.p2.tag'),('Foundation Model','proj.p3.tag'),
        ('Web3 · Cultural','proj.p5.tag'),('Railway · Safety','proj.p7.tag'),
        ('Healthcare · NLP','proj.p8.tag'),('Healthcare · LLM','proj.p9.tag'),
        ('Manufacturing · CFD','proj.p10.tag'),('Manufacturing · ML','proj.p11.tag'),
        ('Audio · AI','proj.p12.tag'),('Health · RecSys','proj.p13.tag'),
        ('CV · Edge AI','proj.p15.tag'),('Data Science · Policy','proj.p16.tag'),
        ('MLOps · Python','proj.p17.tag'),('Medical AI · NVIDIA','proj.p18.tag'),
    ]:
        c = patch(c, f'<span class="bc-tag">{text}</span>',
                     f'<span class="bc-tag" data-i18n="{key}">{text}</span>', key)
    # p4 tag — second Foundation Model remaining after p3 replaced
    c = patch(c,'<span class="bc-tag">Foundation Model</span>',
                '<span class="bc-tag" data-i18n="proj.p4.tag">Foundation Model</span>','p4.tag')

    # p1 desc has style attr
    c = patch(c,
        '<div class="bc-desc" style="font-size:14px;line-height:1.75;max-width:460px;">\n        Full multimodal AI learning environment',
        '<div class="bc-desc" data-i18n="proj.p1.desc" style="font-size:14px;line-height:1.75;max-width:460px;">\n        Full multimodal AI learning environment',
        'p1.desc')
    for text, key in [
        ('CNN-based OCR for Indonesian indigenous Nusantara scripts. Powers Arutala Aksara with 600K+ users. Presented at Sorcery Gathering 4.0 & 5.0.','proj.p2.desc'),
        ('LLM foundation model for Indonesian local languages and dialects. Core infrastructure of the Arutala ecosystem.','proj.p3.desc'),
        ('Foundation model specialized for Indonesian dialect understanding and generation. 21 communication personas.','proj.p4.desc'),
        ('Web3 & NFT-based Cultural Learn-to-Earn application. Presented at Garuda Hacks 2025.','proj.p5.desc'),
        ('Construction site app with face recognition attendance, safety gear detection, and real-time CCTV monitoring.','proj.p6.desc'),
        ('Monitoring Safety and Railway Navigation system. Presented to PT. KAI (Indonesia Railway Company) 2025.','proj.p7.desc'),
        ('Machine Learning-driven drug recommendation system for healthcare in a multilingual environment. Features multilingual NLP for patient interaction and personalized treatment pathways.','proj.p8.desc'),
        ('LSTM and BERT-powered health consultation system with diagnostic conversation flow. Presented at Final Thesis Defence and MIT Hacking Medicine 2023 (2nd Place).','proj.p9.desc'),
        ('Energy optimization for industrial spray dryers using CFD, TFLSTM, Large Eddy Simulation. Kalbe Farma.','proj.p10.desc'),
        ('Predicted moisture content in pharmaceutical milk production with LSTM, XGBoost, and decision trees. Kalbe Farma.','proj.p11.desc'),
        ('Audio restoration for reconstructing traditional instruments of the Yogyakarta Palace Guard. Javanese Cultural Symposium 2024.','proj.p12.desc'),
        ('Built with LightFM and Surprise collaborative filtering. Featured in Indonesia National Data Science Tournament. Personalized health and fitness recommendations at scale.','proj.p13.desc'),
        ('Multi-task classification of safety equipment and helmet color using ResNet-15. Real-time worksite safety enforcement.','proj.p14.desc'),
        ('Cat face recognition using HOG feature extraction + KNN classifier for automated feeding system.','proj.p15.desc'),
        ('Route data correlation for agriculture partnerships in Magelang, Central Java. Food security insights.','proj.p16.desc'),
        ('Benchmarking threading, multiprocessing, and async execution for large-scale model pipelines.','proj.p17.desc'),
        ('Neural network approach for optimizing Dose-Volume Histogram and radiomic evaluation from IMRT radiotherapy. Final project at NVIDIA × UGM scholarship.','proj.p18.desc'),
    ]:
        c = patch(c, f'<div class="bc-desc">{text}</div>',
                     f'<div class="bc-desc" data-i18n="{key}">{text}</div>', key)

    write(p, c)
    ok(f'projects    (+{c.count("data-i18n=") - before} tags, total={c.count("data-i18n=")})')

    # ── ACHIEVEMENTS ────────────────────────────────────────
    p = page('achievements'); c = read(p); before = c.count('data-i18n=')

    for text, key in [
        ('Awards & Grants','ach.cat.awards'),('Academic','ach.cat.academic'),
        ('Public Speaking','ach.cat.speaking'),
    ]:
        c = patch(c, f'<p class="s-label reveal">{text}</p>',
                     f'<p class="s-label reveal" data-i18n="{key}">{text}</p>', key)
    for text, key in [
        ('Recognition','ach.h.recognition'),('Education','ach.h.education'),
        ('Talks & Seminars','ach.h.talks'),
    ]:
        c = patch(c, f'<h2 class="s-title reveal">{text}</h2>',
                     f'<h2 class="s-title reveal" data-i18n="{key}">{text}</h2>', key)
    for text, key in [
        ('Awardee for AI Development 2025. Funding the development of ARUNA 7B, DIALEKTA 2B, and the Arutala multimodal AI ecosystem.','ach.a1.desc'),
        ('Multi-year grant for Certifications Program 2025–2027. Funding AI education and training programs across Indonesia.','ach.a2.desc'),
        ('MIT Regional Entrepreneurship Acceleration Programme. Competed among global AI startups.','ach.a3.desc'),
        ('Selected by Circle 8 among top Southeast Asian AI startups.','ach.a4.desc'),
        ('By Startup Bandung and School of Business and Management ITB.','ach.a5.desc'),
        ('Upstream: Pharmaceutical and Biotechnology Track.','ach.a6.desc'),
        ('8th International Conference on Pharmacy & Advanced Pharmaceutical Sciences.','ach.a7.desc'),
        ('International AI competition held in Zagreb, Croatia during ERASMUS+ exchange.','ach.a8.desc'),
        ('University Zagreb, Croatia. Acceptance rate 1:250 (0.4%). Fully funded exchange program.','ach.a9.desc'),
        ('International Big Data Ideathon Competition.','ach.a10.desc'),
        ('By DPP PKB (National Awakening Party) Indonesia 2025.','ach.a11.desc'),
    ]:
        c = patch(c, f'<div class="ach-desc">{text}</div>',
                     f'<div class="ach-desc" data-i18n="{key}">{text}</div>', key)

    write(p, c)
    ok(f'achievements (+{c.count("data-i18n=") - before} tags, total={c.count("data-i18n=")})')

    # ── EDUCATION ───────────────────────────────────────────
    p = page('education'); c = read(p); before = c.count('data-i18n=')

    for lbl, key in [
        ('Research Area','edu.lbl.ra'),('Program','edu.lbl.program'),('Status','edu.lbl.status'),
        ('Notable','edu.lbl.notable'),('Major','edu.lbl.major'),('Minor','edu.lbl.minor'),
        ('Duration','edu.lbl.duration'),('Role','edu.lbl.role'),('Field','edu.lbl.field'),
        ('Electives','edu.lbl.electives'),('Country','edu.lbl.country'),('Honors','edu.lbl.honors'),
        ('Exchange Type','edu.lbl.exchange'),('Focus','edu.lbl.focus'),('Credits','edu.lbl.credits'),
    ]:
        c = patch_all(c, f'<label>{lbl}</label>', f'<label data-i18n="{key}">{lbl}</label>')
    for text, key in [
        ('Pre-Doctoral Research','edu.e1.type'),("Bachelor's Degree",'edu.e2.type'),
        ("Bachelor's Degree (Honours)",'edu.e3.type'),('Exchange Program','edu.e4.type'),
    ]:
        c = patch(c, f'<div class="edu-type">{text}</div>',
                     f'<div class="edu-type" data-i18n="{key}">{text}</div>', key)
    for text, key in [
        ('Research in Computer Vision and Computational Optimization at the frontier of AI','edu.e1.h1'),
        ('4th Place at MIT Regional Entrepreneurship Acceleration Programme (REAP) 2025','edu.e1.h2'),
        ('Collaborating with global researchers on low-resource language AI systems','edu.e1.h3'),
        ("Building on MIT's framework for Computational Science with AI for social impact",'edu.e1.h4'),
        ('Teaching Assistant for Machine Learning, Big Data, Databases, and Web Programming','edu.e2.h1'),
        ('Taught 170+ students across multiple disciplines and cohorts','edu.e2.h2'),
        ('Final thesis: Health Consultation Chatbot using LSTM and BERT — presented at MIT Hacking Medicine 2023','edu.e2.h3'),
        ('Capstone projects: ResNet-15 safety classification, Dota 2 MLP classification, Cat Face Recognition','edu.e2.h4'),
        ('Interdisciplinary degree bridging AI and economic analysis for policy formulation','edu.e3.h1'),
        ('Applied big data concepts correlated with topics in International Relations','edu.e3.h2'),
        ('Presentation at UN Statistics Division (UNSD) International Conference on Big Data 2022','edu.e3.h3'),
    ]:
        c = patch_all(c, f'<div class="highlight-item">{text}</div>',
                         f'<div class="highlight-item" data-i18n="{key}">{text}</div>')

    write(p, c)
    ok(f'education   (+{c.count("data-i18n=") - before} tags, total={c.count("data-i18n=")})')

    # ── TALKS ───────────────────────────────────────────────
    p = page('talks'); c = read(p); before = c.count('data-i18n=')

    for text, key in [
        ('Seminars','talks.stat.seminars'),('Workshops','talks.stat.workshops'),
        ('Public Lectures','talks.stat.lectures'),('Judge Panels','talks.stat.judge'),
        ('Mentor Roles','talks.stat.mentor'),
    ]:
        c = patch_all(c, f'<div class="lbl">{text}</div>',
                         f'<div class="lbl" data-i18n="{key}">{text}</div>')
    for flt, text, key in [
        ('seminar','Seminars','talks.stat.seminars'),('workshop','Workshops','talks.stat.workshops'),
        ('lecture','Public Lectures','talks.stat.lectures'),
        ('judge','Judge','talks.badge.judge'),('mentor','Mentor','talks.badge.mentor'),
    ]:
        c = patch(c, f'<button class="filter-btn" data-filter="{flt}">{text}</button>',
                     f'<button class="filter-btn" data-filter="{flt}" data-i18n="{key}">{text}</button>', key)
    for text, key in [
        ('Seminars','talks.sec.seminars'),('Workshops','talks.sec.workshops'),
        ('Public Lectures','talks.sec.lectures'),
    ]:
        c = patch(c, f'<span class="cat-title">{text}</span>',
                     f'<span class="cat-title" data-i18n="{key}">{text}</span>', key)
    c = patch_all(c,'<span class="talk-badge keynote">Keynote</span>',
                    '<span class="talk-badge keynote" data-i18n="talks.badge.keynote">Keynote</span>')
    c = patch_all(c,'<span class="talk-badge">Speaker</span>',
                    '<span class="talk-badge" data-i18n="talks.badge.speaker">Speaker</span>')
    c = patch_all(c,'<span class="talk-badge">Panelist</span>',
                    '<span class="talk-badge" data-i18n="talks.badge.panelist">Panelist</span>')
    c = patch_all(c,'<span class="talk-badge judge">Judge</span>',
                    '<span class="talk-badge judge" data-i18n="talks.badge.judge">Judge</span>')
    c = patch_all(c,'<span class="talk-badge mentor">Mentor</span>',
                    '<span class="talk-badge mentor" data-i18n="talks.badge.mentor">Mentor</span>')

    write(p, c)
    ok(f'talks       (+{c.count("data-i18n=") - before} tags, total={c.count("data-i18n=")})')

    # ── CONTACT ─────────────────────────────────────────────
    p = page('contact'); c = read(p); before = c.count('data-i18n=')

    c = patch(c,'<p class="contact-label">Get in Touch</p>',
                '<p class="contact-label" data-i18n="con.label">Get in Touch</p>','con.label')
    for text, key in [
        ('Email','con.lbl.email'),('Phone / WhatsApp','con.lbl.phone'),
        ('Location','con.lbl.location'),('Academic','con.lbl.academic'),('Company','con.lbl.company'),
    ]:
        c = patch(c, f'<div class="c-link-label">{text}</div>',
                     f'<div class="c-link-label" data-i18n="{key}">{text}</div>', key)
    c = patch(c,'<div class="c-link-val">MIT · Pre-PhD Computational Science</div>',
                '<div class="c-link-val" data-i18n="con.val.academic">MIT · Pre-PhD Computational Science</div>','con.val.academic')
    c = patch(c,'<div class="c-link-val">CEO, PT. Data Sorcerers Indonesia</div>',
                '<div class="c-link-val" data-i18n="con.val.company">CEO, PT. Data Sorcerers Indonesia</div>','con.val.company')
    c = patch(c,'<div class="form-title">Send a Message</div>',
                '<div class="form-title" data-i18n="con.form.title">Send a Message</div>','con.form.title')
    for text, key in [
        ('First Name','con.form.fname'),('Last Name','con.form.lname'),('Email','con.form.email'),
        ('Organization','con.form.org'),('Subject','con.form.subject'),('Message','con.form.msg'),
    ]:
        c = patch(c, f'<label class="form-label">{text}</label>',
                     f'<label class="form-label" data-i18n="{key}">{text}</label>', key)
    c = patch(c,'<button class="form-btn" onclick="handleSubmit()">Send Message →</button>',
                '<button class="form-btn" onclick="handleSubmit()" data-i18n="con.form.btn">Send Message →</button>','con.form.btn')
    c = patch(c,'<div class="form-success-title">Message Sent!</div>',
                '<div class="form-success-title" data-i18n="con.form.sent">Message Sent!</div>','con.form.sent')
    for href, text, key in [
        ('/projects/','View Projects →','con.ql.projects'),('/experience/','Experience →','con.ql.exp'),
        ('/achievements/','Achievements →','con.ql.ach'),('/skills/','Skills →','con.ql.skills'),
    ]:
        c = patch(c, f'<a href="{href}" class="q-link">{text}</a>',
                     f'<a href="{href}" class="q-link" data-i18n="{key}">{text}</a>', key)

    write(p, c)
    ok(f'contact     (+{c.count("data-i18n=") - before} tags, total={c.count("data-i18n=")})')


# ══════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════
if __name__ == '__main__':
    print(f'Portfolio i18n patcher — root: {ROOT}')
    patch_lang_js()
    patch_script_tags()
    tag_pages()
    print('\n✅ Done! All patches applied.')