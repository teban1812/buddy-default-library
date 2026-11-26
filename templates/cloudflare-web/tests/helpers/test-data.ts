// The test data (QLT-4): invented, and what is generated comes from a fixed seed, so every run gives the same
// data and no real person's data reaches the tests. Emails are on example.com, which is reserved for examples.
// A test that needs data asks for it here; a new kind of data gets its own function over the same generator.

// The seed's sample accounts (seeds/seed.sql, docs/base-application.md); a test proves the seed holds exactly these.
export const SAMPLE_ACCOUNTS = {
  admin: {
    id: 'usr-admin',
    email: 'admin@example.com',
    name: 'Sample Administrator',
    role: 'admin',
    password: 'local-admin-2026',
  },
  reader: {
    id: 'usr-reader',
    email: 'reader@example.com',
    name: 'Sample Reader',
    role: 'readonly',
    password: 'local-reader-2026',
  },
} as const;

export const SEED = 20261126;

// mulberry32: a small, well-known generator of numbers in [0, 1); the same seed gives the same sequence.
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface SamplePerson {
  name: string;
  email: string;
}

// Invented people with distinct emails: the number keeps them distinct, the seeded tag makes them look different.
export function samplePeople(count: number, seed = SEED): SamplePerson[] {
  const random = seededRandom(seed);
  return Array.from({ length: count }, (_, i) => {
    const tag = Math.floor(random() * 0x1000000)
      .toString(16)
      .padStart(6, '0');
    return { name: `Sample Person ${i + 1}`, email: `person${i + 1}-${tag}@example.com` };
  });
}
