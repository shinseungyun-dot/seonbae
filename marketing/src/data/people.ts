// Every tutor card on the marketing site shows this one image. The team page
// still uses each person's own portrait from the `photo` fields below.
export const TUTOR_CARD_PHOTO = '/images/ian-bae-placeholder.png';

export const leadership = [
  {
    id: 'raphael-lee',
    name: 'Raphael Lee',
    hangul: '이윤재',
    role: 'Founder & CEO',
    roleKo: '창업자 & CEO',
    university: 'Korea University, International Studies',
    universityKo: '고려대학교 국제학부',
    photo: '/images/raphael-lee.png',
    linkedin: 'https://www.linkedin.com/in/raphael-lee-612369346/',
    credentials: [
      { en: 'IB & IGCSE Economics', ko: 'IB · IGCSE 경제' },
      { en: 'Founding tutor', ko: '창립 튜터' },
    ],
    tutorCopy: {
      en: 'Economics guidance grounded in firsthand international-curriculum experience.',
      ko: '국제 커리큘럼을 직접 경험한 선배의 경제 수업입니다.',
    },
  },
  {
    id: 'byeongguk-oh',
    name: 'Byeongguk Oh',
    hangul: '오병국',
    role: 'Co-Founder & COO',
    roleKo: '공동창업자 & COO',
    university: 'Korea University, Business Administration',
    universityKo: '고려대학교 경영학과',
    photo: '/images/byeongguk-oh.png',
    linkedin: 'https://www.linkedin.com/in/byeongguk-oh-272218398/',
    credentials: [
      { en: 'SAT 1510', ko: 'SAT 1510점' },
      { en: 'Founding tutor', ko: '창립 튜터' },
    ],
    tutorCopy: {
      en: 'Structured exam preparation with clear priorities and steady follow-through.',
      ko: '명확한 우선순위와 꾸준한 관리로 시험 준비를 돕습니다.',
    },
  },
  {
    id: 'seung-yun-shin',
    name: 'Seung-Yun Shin',
    hangul: '신승윤',
    role: 'Co-Founder & CTO',
    roleKo: '공동창업자 & CTO',
    university: 'Seoul National University, Computer Science',
    universityKo: '서울대학교 컴퓨터공학부',
    photo: '/images/seung-yun-shin.png',
    linkedin: 'https://www.linkedin.com/in/seung-yun-shin-33bbab413/',
    credentials: [
      { en: 'A Level A*A*A*A*', ko: 'A레벨 A*A*A*A*' },
      { en: 'Founding tutor', ko: '창립 튜터' },
    ],
    tutorCopy: {
      en: 'Analytical teaching that turns complex material into practical next steps.',
      ko: '복잡한 내용을 이해하기 쉬운 다음 단계로 정리합니다.',
    },
  },
] as const;
