// ---------------------------------------------------------------------------
// Bilingual content for the homepage + shared chrome.
// Single source of truth: every visible string exists in English and Korean,
// and the <T> helper renders both so the header toggle switches instantly.
// Korean copy follows the brand voice: warm, plain, no hanja, no em dashes.
// Prices and the seven-price model come from the Company Policies manual (§8,
// §15) and the subject rate sheet.
// ---------------------------------------------------------------------------

export interface Pair { en: string; ko: string }
const t = (en: string, ko: string): Pair => ({ en, ko });

// ----- Shared chrome (header, utility bar, footer, ticker, CTA) -------------
export const ui = {
  utilLeft: t(
    'EDUCATION TO THE WORLD',
    'EDUCATION TO THE WORLD',
  ),
  utilRight: t('Replies within one business day', '영업일 기준 하루 안에 답장'),
  findTutor: t('Find a tutor', '선배 찾기'),
  explore: t('Explore', '더 보기'),
  subjects: t('Subjects', '과목'),
  megaHead: t('Every curriculum, one tutor away', '모든 커리큘럼, 선배 한 명이면'),
  seeAllSubjects: t('See all subjects', '전체 과목 보기'),
  from: t('from', '부터'),
  seeHow: t('See how it works', '이용 방법 보기'),
  logIn: t('Log in', '로그인'),
  getStarted: t('Get started', '시작하기'),
  becomeTutor: t('Become a tutor', '선배로 지원'),

  ticker: [
    t('Confidence starts here', '자신감은 여기서 시작됩니다'),
    t('Learn from someone who has been there', '선배에게 배우세요'),
    t('Tutors who have been there', '직접 겪어본 선배들'),
    t('Tutoring that clicks', '이해가 되는 과외'),
  ] as Pair[],

  footer: {
    promise: t(
      "Verified tutors from Korea's top universities. One to one, wherever you learn.",
      '대한민국 최상위 대학 출신의 검증된 선배. 어디서 배우든, 일대일로.',
    ),
    newsletterLabel: t(
      'Get study notes and tutor stories in your inbox',
      '학습 노트와 선배 이야기를 메일로 받아보세요',
    ),
    emailPlaceholder: t('you@email.com', '이메일 주소'),
    subscribe: t('Subscribe', '구독'),
    newsletterDone: t('Thanks. We will be in touch soon.', '감사합니다. 곧 연락드릴게요.'),
    colLearn: t('Learn', '배우기'),
    colCompany: t('Company', '회사'),
    base: t(
      'Verified tutors from Seoul National University, Korea University, and Yonsei University.',
      '서울대, 고려대, 연세대 출신의 검증된 선배.',
    ),
    legalVerify: t('Verification', '검증'),
    legalContact: t('Contact', '문의'),
  },

  conversion: {
    eyebrow: t('Your next step', '다음 단계'),
    heading: t(
      'The right tutor is one conversation away.',
      '좋은 선배는, 대화 한 번이면 만납니다.',
    ),
    copy: t(
      'Share your goal and we will match you with a verified tutor from the top universities in Korea. You will see their record before you ever book a lesson.',
      '목표를 알려주시면 대한민국 최상위 대학 출신의 검증된 선배와 매칭해 드립니다. 수업을 예약하기 전에, 선배의 실력을 먼저 확인하세요.',
    ),
    cta: t('Get matched', '매칭 시작하기'),
  },
};

// ----- Homepage -------------------------------------------------------------
export const home = {
  hero: {
    eyebrow: t(
      'One to one tutoring in IB, AP, A Level, IGCSE and tests',
      'IB, AP, A레벨, IGCSE, 시험 대비 일대일 과외',
    ),
    // The headline states the entry requirement as a fact. It is the hardest
    // thing for a competitor to copy, so it leads.
    titleA: t(
      'Every tutor holds the top grade in the subject they teach.',
      '모든 선배는 자신이 가르치는 과목에서 최고 등급을 받았습니다.',
    ),
    copy: t(
      'We started Seonbae because tutoring was unfair at both ends: the tutor was underpaid and the family overcharged. So we publish every subject rate, pay tutors a fixed amount they keep in full, and teach online, one to one, wherever you are.',
      '과외는 양쪽 모두에게 불공정했습니다. 가르치는 사람은 적게 받고, 가족은 많이 냈습니다. 그래서 선배는 모든 과목의 요금을 공개하고, 선배에게는 정해진 금액을 전액 지급하며, 어디에 있든 온라인 일대일로 가르칩니다.',
    ),
    ctaPrimary: t('Find a tutor', '선배 찾기'),
    ctaSecondary: t('How it works', '이용 방법'),
    trust: t(
      '‘선배’ means the one who has gone before. Every Seonbae tutor is one, verified against the record before they ever teach.',
      '‘선배’는 먼저 그 길을 걸어본 사람을 뜻합니다. 모든 선배는 가르치기 전에 실력을 검증받습니다.',
    ),
  },

  about: {
    eyebrow: t('About Seonbae', '선배 소개'),
    heading: t(
      'A warmer way to learn, from someone who recently sat where you sit.',
      '당신과 같은 자리에 먼저 앉아본 선배에게, 더 가깝게 배웁니다.',
    ),
    metrics: [
      { value: '125', count: 125, suffix: '+', label: t('subjects, from IB and AP to A Level and IGCSE', 'IB, AP, A레벨, IGCSE까지 과목 수') },
      { value: '1:1', label: t('live lessons, recorded so you can review them', '일대일 실시간 수업, 다시 볼 수 있도록 녹화') },
      { value: '100', count: 100, suffix: '%', label: t('of tutors verified against real score reports', '선배 전원, 실제 성적표로 검증') },
      { value: 'SKY', label: t('tutors from Seoul National University, Korea University, and Yonsei University', '서울대학교 · 고려대학교 · 연세대학교 출신 선배') },
    ] as { value: string; count?: number; suffix?: string; label: Pair }[],
    card1Title: t('Plans built around goals', '목표에 맞춘 학습'),
    card1Copy: t(
      'We start from what you are working toward, then shape every lesson around getting there.',
      '당신이 이루고 싶은 것에서 시작해, 모든 수업을 그 목표에 맞춰 설계합니다.',
    ),
    card1Link: t('How it works', '이용 방법'),
    card2Title: t('Lessons that fit life abroad', '해외 생활에 맞춘 수업'),
    card2Copy: t(
      'Evenings, weekends, and time zones that actually match yours, with the same tutor each week.',
      '저녁, 주말, 그리고 당신의 시간대에 맞춰. 매주 같은 선배와 함께합니다.',
    ),
    card2Link: t('See pricing', '요금 보기'),
    mediaLabel: t('Live, one to one', '실시간 일대일'),
  },

  why: {
    eyebrow: t('Why it works', '왜 효과가 있을까요'),
    heading: t(
      'The right tutor can change how a whole subject feels.',
      '좋은 선배 한 명이 과목 전체의 느낌을 바꿉니다.',
    ),
    lead: t(
      'When the person teaching you scored at the top of the same exam last year, the advice is specific and the path is clear.',
      '당신을 가르치는 사람이 바로 작년에 같은 시험에서 최고 성적을 받았다면, 조언은 구체적이고 길은 분명해집니다.',
    ),
    pair1Title: t('Matched by hand', '직접 매칭'),
    pair1Copy: t(
      'We read your goals and choose a tutor who fits, subject, level, and personality.',
      '목표를 읽고 과목, 수준, 성향까지 맞는 선배를 직접 고릅니다.',
    ),
    pair2Title: t('Progress you can see', '보이는 성장'),
    pair2Copy: t(
      'Notes and next steps after every lesson turn effort into something you can track.',
      '매 수업 뒤의 노트와 다음 단계가, 노력을 확인할 수 있는 결과로 바꿉니다.',
    ),
    cta: t('Meet our tutors', '선배 만나보기'),
    mediaLabel: t('A lesson in progress', '진행 중인 수업'),
  },

  values: {
    eyebrow: t('Built for real progress', '진짜 성장을 위해'),
    heading: t(
      'Built for real progress, not just more time on a screen.',
      '화면 앞의 시간이 아니라, 진짜 성장을 위해 설계했습니다.',
    ),
    items: [
      {
        accent: 'mint', scene: 'figure',
        title: t('1:1 attention', '일대일 집중'),
        copy: t(
          'Lessons move at your pace, not a syllabus timetable. The feedback is direct and it is yours alone.',
          '정해진 진도표가 아니라 당신의 속도로. 피드백은 직접적이고, 온전히 당신의 것입니다.',
        ),
      },
      {
        accent: 'lavender', scene: 'notes',
        title: t('Clear progress', '분명한 성장'),
        copy: t(
          'Notes, goals, and next steps land after every lesson, so you always know what changed and what comes next.',
          '매 수업 뒤 노트와 목표, 다음 단계가 도착합니다. 무엇이 달라졌고 다음은 무엇인지 늘 알 수 있도록.',
        ),
      },
      {
        accent: 'butter', scene: 'rings',
        title: t('Flexible scheduling', '유연한 일정'),
        copy: t(
          'Evenings and weekends across time zones, arranged around a school week and a life outside it.',
          '시간대를 넘나드는 저녁과 주말. 학교 생활과 그 밖의 삶에 맞춰.',
        ),
      },
    ] as { accent: string; scene: string; title: Pair; copy: Pair }[],
  },

  curricula: {
    eyebrow: t('Curricula', '커리큘럼'),
    heading: t('Every curriculum, one tutor away.', '모든 커리큘럼, 선배 한 명이면 됩니다.'),
    cta: t('Browse all subjects', '전체 과목 보기'),
    viewLabel: t('View subjects', '과목 보기'),
    // No prices here. Rates are per subject, so a curriculum tile links through
    // to the full sheet instead of quoting an average (see src/data/rates.ts).
    items: [
      {
        num: '01', href: '/subjects/ib-diploma', slug: 'ib-diploma',
        title: t('IB Diploma', 'IB 디플로마'),
        levels: t('HL · SL · Core', 'HL · SL · 코어'),
        copy: t('The full IB Diploma, HL and SL, plus EE, TOK, and IA coaching.', 'HL과 SL 전 과목, 그리고 EE, TOK, IA 코칭까지.'),
      },
      {
        num: '02', href: '/subjects/advanced-placement', slug: 'advanced-placement',
        title: t('Advanced Placement', 'AP'),
        levels: t('Capstone to Physics C', '캡스톤부터 물리 C까지'),
        copy: t('AP across the sciences, mathematics, humanities, and languages.', '과학, 수학, 인문, 언어 전 영역의 AP.'),
      },
      {
        num: '03', href: '/subjects/a-level', slug: 'a-level',
        title: t('A Level', 'A레벨'),
        levels: t('AS · A2', 'AS · A2'),
        copy: t('A Level maths, sciences, and essay subjects for UK style exams.', '영국식 시험을 위한 수학, 과학, 논술 과목.'),
      },
      {
        num: '04', href: '/subjects/igcse', slug: 'igcse',
        title: t('IGCSE', 'IGCSE'),
        levels: t('Year 10 · Year 11', '10학년 · 11학년'),
        copy: t('A strong foundation across IGCSE subjects, sciences to languages.', '과학부터 언어까지, IGCSE 전 과목의 탄탄한 기초.'),
      },
      {
        num: '05', href: '/subjects/standardized-tests', slug: 'standardized-tests',
        title: t('Standardized Tests', '표준화 시험'),
        levels: t('SAT · ACT · IELTS · TOEFL', 'SAT · ACT · IELTS · TOEFL'),
        copy: t('SAT and ACT section by section, plus IELTS and TOEFL.', 'SAT와 ACT를 영역별로, 그리고 IELTS와 TOEFL까지.'),
      },
      {
        num: '06', href: '/subjects/english-writing', slug: 'english-writing',
        title: t('English', '영어'),
        levels: t('Beginner · Academic · Business', '기초 · 학술 · 비즈니스'),
        copy: t('Everyday English through to academic writing and applications.', '일상 영어부터 학술 글쓰기와 지원서 작성까지.'),
      },
    ] as { num: string; href: string; slug: string; title: Pair; levels: Pair; copy: Pair }[],
  },

  features: {
    eyebrow: t('Support that stays human', '사람 중심의 배움'),
    heading: t('Learning support that stays human.', '끝까지 사람이 함께하는 배움.'),
    lead: t(
      'Good tools help. A good person helps more. Seonbae keeps the technology light and the teaching personal.',
      '좋은 도구는 도움이 됩니다. 좋은 사람은 더 큰 도움이 됩니다. 선배는 기술은 가볍게, 가르침은 깊게 유지합니다.',
    ),
    mediaLabel: t('Your tutor, every week', '매주, 같은 선배'),
    items: [
      { title: t('Matched by hand', '직접 매칭'), copy: t('We read your goals and choose a tutor who fits, then guarantee a rematch after the first lesson.', '목표를 읽고 맞는 선배를 고릅니다. 첫 수업 뒤 재매칭도 보장합니다.') },
      { title: t('Live whiteboard', '실시간 화이트보드'), copy: t('A shared board for working through problems together, the way you would side by side.', '나란히 앉은 것처럼, 함께 문제를 풀어가는 공유 보드.') },
      { title: t('Lesson notes', '수업 노트'), copy: t('A written record after each session, so nothing important slips between lessons.', '매 수업 뒤 남는 기록. 중요한 것이 수업 사이로 새지 않도록.') },
      { title: t('Parent visibility', '학부모 리포트'), copy: t('A monthly summary and a dashboard, so parents can follow progress without hovering.', '월간 요약과 대시보드로, 지나치게 관여하지 않아도 성장을 지켜볼 수 있게.') },
    ] as { title: Pair; copy: Pair }[],
  },

  stories: {
    eyebrow: t('Student stories', '학생 이야기'),
    heading: t('Stories from learners who found their stride.', '자신의 리듬을 찾은 학생들의 이야기.'),
    cta: t('More about Seonbae', '선배 더 알아보기'),
    items: [
      {
        accent: 'mint',
        quote: t(
          'My tutor had just scored a 45 in the IB, so every piece of advice was specific. My predicted grade went from a 5 to a 7 in one term.',
          '제 선배는 바로 얼마 전 IB에서 45점을 받은 분이었어요. 그래서 모든 조언이 구체적이었죠. 한 학기 만에 예상 등급이 5에서 7로 올랐어요.',
        ),
        name: t('Seojin’s family', '서진이 가족'),
        context: t('IB Diploma · Dubai', 'IB 디플로마 · 두바이'),
      },
      {
        accent: 'lavender',
        quote: t(
          'We tried three tutors before Seonbae. The difference was a tutor who actually remembered where we left off and planned the next step.',
          '선배를 만나기 전 세 분의 선생님을 거쳤어요. 차이는, 지난 수업을 정확히 기억하고 다음 단계를 계획해 주는 선배였다는 점이었어요.',
        ),
        name: t('Yerin’s family', '예린이 가족'),
        context: t('A Level · Hong Kong', 'A레벨 · 홍콩'),
      },
      {
        accent: 'butter',
        quote: t(
          'The lesson notes after every session meant I always knew what to practice. My SAT reading jumped 90 points.',
          '매 수업 뒤 노트 덕분에 무엇을 연습할지 늘 분명했어요. SAT 독해 점수가 90점 올랐습니다.',
        ),
        name: t('Jung', '정민'),
        context: t('SAT · Singapore', 'SAT · 싱가포르'),
      },
      {
        accent: 'violet',
        quote: t(
          'Evenings in London matched my tutor’s schedule in Seoul, and it was the same tutor every week. That consistency changed everything.',
          '런던의 저녁이 서울에 있는 선배의 일정과 맞았고, 매주 같은 선배였어요. 그 꾸준함이 모든 것을 바꿨습니다.',
        ),
        name: t('Han’s family', '한이 가족'),
        context: t('IGCSE · London', 'IGCSE · 런던'),
      },
    ] as { accent: string; quote: Pair; name: Pair; context: Pair }[],
  },

  pricing: {
    eyebrow: t('Pricing', '요금'),
    heading: t(
      'One clear price per subject. No packages, no surprises.',
      '과목마다 하나의 분명한 가격. 패키지도, 예상 밖 비용도 없습니다.',
    ),
    lead: t(
      'Every subject sits at one of seven hourly prices, from ₩50,000 to ₩120,000, set by level and demand. Families pay monthly, in advance, for the hours used that month.',
      '모든 과목은 수준과 수요에 따라 ₩50,000부터 ₩120,000까지 일곱 가격 중 하나에 속합니다. 매달, 그달에 사용한 시간만큼 미리 결제합니다.',
    ),
    band: [50000, 60000, 70000, 80000, 90000, 100000, 120000],
    bandUnit: t('Seven hourly prices, set by level and demand', '수준과 수요에 따라 정해지는 시간당 일곱 가격'),
    tableSubject: t('Subject', '과목'),
    tablePrice: t('Per hour', '시간당'),
    rows: [
      { price: 100000, subject: t('IB Math AA · Higher Level', 'IB 수학 AA · 고급') },
      { price: 90000, subject: t('IB Economics · Higher Level', 'IB 경제 · 고급') },
      { price: 90000, subject: t('AP Calculus BC', 'AP 미적분 BC') },
      { price: 100000, subject: t('A Level Chemistry', 'A레벨 화학') },
      { price: 80000, subject: t('IGCSE Mathematics', 'IGCSE 수학') },
      { price: 90000, subject: t('SAT Reading & Writing', 'SAT 독해 · 작문') },
    ] as { price: number; subject: Pair }[],
    note: t(
      'Rates depend on the subject and level. Tutors are paid a fixed amount per subject and always receive the full amount, whatever the exchange rate.',
      '요금은 과목과 수준에 따라 다릅니다. 선배는 과목별로 정해진 금액을 받으며, 환율과 관계없이 언제나 전액을 받습니다.',
    ),
    cta: t('See the full rate card', '전체 요금표 보기'),
  },

  resources: {
    eyebrow: t('Resources', '학습 자료'),
    heading: t('Guidance for every next step.', '다음 단계를 위한 안내.'),
    cta: t('All resources', '전체 자료 보기'),
    readLabel: t('Read', '읽기'),
    items: [
      {
        accent: 'mint', category: t('Study Skills', '학습 습관'), meta: t('6 min read', '6분 분량'),
        title: t('How to build a study routine that survives exam term', '시험 기간에도 무너지지 않는 공부 루틴 만들기'),
      },
      {
        accent: 'lavender', category: t('Getting Started', '시작하기'), meta: t('5 min read', '5분 분량'),
        title: t('IGCSE to IB: what actually changes in Year 12', 'IGCSE에서 IB로: 12학년에 실제로 달라지는 것'),
      },
      {
        accent: 'butter', category: t('Test Prep', '시험 대비'), meta: t('7 min read', '7분 분량'),
        title: t('Reading for the SAT when English is your second language', '영어가 제2언어일 때, SAT 독해 준비법'),
      },
    ] as { accent: string; category: Pair; meta: Pair; title: Pair }[],
  },
};
