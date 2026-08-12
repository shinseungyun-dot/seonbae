import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const accent = z.enum(['mint', 'lavender', 'butter', 'violet']);

// Curriculum / subject groups shown across the site.
const subjects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/subjects' }),
  schema: z.object({
    title: z.string(),
    number: z.string(),
    summary: z.string(),
    levels: z.array(z.string()),
    accent,
    order: z.number(),
    featured: z.boolean().default(false),
    priceFrom: z.number(), // KRW per hour
    tutorCount: z.number().default(0),
    topics: z.array(z.string()),
    idealLearner: z.string(),
    lessonFormat: z.array(z.string()),
  }),
});

// Verified tutors. Sample profiles the founders will replace with the live roster.
const tutors = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/tutors' }),
  schema: z.object({
    name: z.string(),
    hangul: z.string().optional(),
    university: z.string(),
    specialty: z.array(z.string()),
    levels: z.array(z.string()),
    languages: z.array(z.string()),
    credentials: z.array(z.string()),
    availability: z.string(),
    teachingStyle: z.string(),
    accent,
    order: z.number(),
    featured: z.boolean().default(false),
  }),
});

// Editorial learning resources.
const resources = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/resources' }),
  schema: z.object({
    title: z.string(),
    author: z.string(),
    date: z.coerce.date(),
    category: z.enum(['Study Skills', 'Subject Help', 'Test Prep', 'Parent Guides', 'Getting Started']),
    excerpt: z.string(),
    readingTime: z.number().default(5),
    accent,
    featured: z.boolean().default(false),
  }),
});

const testimonials = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/testimonials' }),
  schema: z.object({
    name: z.string(),
    context: z.string(),
    quote: z.string(),
    rating: z.number().min(1).max(5).default(5),
    subject: z.string().optional(),
    accent,
    order: z.number(),
    featured: z.boolean().default(false),
  }),
});

// Two ways to work with Seonbae. Rates are per subject, per hour.
const plans = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/plans' }),
  schema: z.object({
    name: z.string(),
    tagline: z.string(),
    priceFrom: z.number(), // KRW per hour
    billingMonthly: z.string(),
    billingLesson: z.string(),
    features: z.array(z.string()),
    ctaLabel: z.string(),
    ctaHref: z.string(),
    accent,
    order: z.number(),
    featured: z.boolean().default(false),
    wide: z.boolean().default(false),
  }),
});

export const collections = { subjects, tutors, resources, testimonials, plans };
