// ---------------------------------------------------------------------------
// Every mock exam and level test Seonbae sells, with its published price.
// Single source of truth: the mock-exams page, the pricing page block, and the
// per-subject mentions all read from here. Prices are in KRW.
//
// Members (families in active weekly tutoring) pay MEMBER_DISCOUNT less.
// ---------------------------------------------------------------------------

export const MEMBER_DISCOUNT = 0.2;

export type ExamFamily = 'ib' | 'ap' | 'english' | 'admissions';

export interface Exam {
  id: string;
  name: string;
  family: ExamFamily;
  /** Shown under the name. Says exactly what the buyer receives. */
  unit: string;
  price: number;
  /** Working days from submission to report. */
  turnaround: number;
  /** Which curriculum page should link to this, if any. Matches the subject page slugs. */
  subjectSlug?: string;
  blurb: string;
}

export const exams: Exam[] = [
  {
    id: 'ib-math-placement',
    name: 'IB Math placement test',
    family: 'ib',
    unit: 'One diagnostic paper, 60 minutes',
    price: 35_000,
    turnaround: 2,
    subjectSlug: 'ib-diploma',
    blurb: 'Tells you whether AA or AI, and Higher or Standard, is the right choice before you commit to two years of it.',
  },
  {
    id: 'sat',
    name: 'SAT full mock',
    family: 'admissions',
    unit: 'Both sections, full length',
    price: 50_000,
    turnaround: 3,
    subjectSlug: 'standardized-tests',
    blurb: 'A full-length linear paper covering both sections, marked against real boundaries.',
  },
  {
    id: 'ap-calculus-bc',
    name: 'AP Calculus BC',
    family: 'ap',
    unit: 'One full paper, multiple choice and free response',
    price: 60_000,
    turnaround: 3,
    subjectSlug: 'advanced-placement',
    blurb: 'Both sections, with every free-response step marked the way a reader would mark it.',
  },
  {
    id: 'ib-chemistry',
    name: 'IB Chemistry',
    family: 'ib',
    unit: 'One paper',
    price: 65_000,
    turnaround: 3,
    subjectSlug: 'ib-diploma',
    blurb: 'Long-answer marked by hand, with method credit shown separately from final answers.',
  },
  {
    id: 'ib-physics',
    name: 'IB Physics',
    family: 'ib',
    unit: 'One paper',
    price: 65_000,
    turnaround: 3,
    subjectSlug: 'ib-diploma',
    blurb: 'Long-answer marked by hand, with method credit shown separately from final answers.',
  },
  {
    id: 'ib-economics',
    name: 'IB Economics',
    family: 'ib',
    unit: 'One paper',
    price: 65_000,
    turnaround: 3,
    subjectSlug: 'ib-diploma',
    blurb: 'Essays marked against the real criteria, with the command term treated as the instruction it is.',
  },
  {
    id: 'ib-math-aa',
    name: 'IB Math AA',
    family: 'ib',
    unit: 'One paper',
    price: 65_000,
    turnaround: 3,
    subjectSlug: 'ib-diploma',
    blurb: 'Working marked line by line, so a lost mark is traced to the step that lost it.',
  },
  {
    id: 'toefl',
    name: 'TOEFL full mock',
    family: 'english',
    unit: 'All four skills, speaking recorded',
    price: 90_000,
    turnaround: 4,
    subjectSlug: 'english-writing',
    blurb: 'Reading, listening, speaking, and writing. Speaking is submitted as a recording and marked against the official descriptors.',
  },
  {
    id: 'ielts',
    name: 'IELTS full mock',
    family: 'english',
    unit: 'All four skills, speaking recorded',
    price: 90_000,
    turnaround: 4,
    subjectSlug: 'english-writing',
    blurb: 'Reading, listening, speaking, and writing, banded against the official descriptors.',
  },
];

export const memberPrice = (price: number) => Math.round(price * (1 - MEMBER_DISCOUNT));
export const examPriceRange = () => ({
  min: Math.min(...exams.map((e) => e.price)),
  max: Math.max(...exams.map((e) => e.price)),
});
export const examsFor = (slug: string) => exams.filter((e) => e.subjectSlug === slug);
