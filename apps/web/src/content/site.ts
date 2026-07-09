// Static marketing content for VESION. Dynamic content (blog, portfolio,
// testimonials, FAQ, plans, careers) is served by the API and merged in pages.

export const SITE = {
  name: 'VESION',
  tagline: 'Software, engineered to outlast trends.',
  description:
    'VESION is a software engineering company crafting premium websites, web & mobile applications, AI solutions, and secure cloud infrastructure.',
  email: 'hello@vesion.dev',
  address: 'Keizersgracht 520, 1017 EK Amsterdam, Netherlands',
  social: {
    github: 'https://github.com/vesion-dev',
    linkedin: 'https://www.linkedin.com/company/vesion-dev',
    x: 'https://x.com/vesion_dev',
  },
} as const;

export interface Service {
  slug: string;
  icon: string;
  title: string;
  summary: string;
  details: string[];
  technologies: string[];
}

export const SERVICES: Service[] = [
  {
    slug: 'custom-websites',
    icon: '🌐',
    title: 'Custom Websites',
    summary:
      'High-performance marketing sites and e-commerce experiences that convert — built for speed, SEO, and effortless content editing.',
    details: [
      'Design-led development with obsessive attention to typography and motion',
      'Core Web Vitals budgets enforced in CI — sub-second first paint',
      'SEO architecture: structured data, sitemaps, edge caching',
      'Headless CMS integrations your marketing team will actually enjoy',
    ],
    technologies: ['Next.js', 'React', 'Tailwind CSS', 'TypeScript'],
  },
  {
    slug: 'web-applications',
    icon: '🧩',
    title: 'Web Applications',
    summary:
      'Complex products — dashboards, portals, SaaS platforms — engineered with clean architecture that stays fast to change.',
    details: [
      'Domain-driven design with modular boundaries',
      'Real-time features, offline resilience, and granular permissions',
      'Automated testing pyramids: unit, integration, end-to-end',
      'Battle-tested auth: SSO, 2FA, role-based access control',
    ],
    technologies: ['React', 'NestJS', 'PostgreSQL', 'Redis'],
  },
  {
    slug: 'mobile-applications',
    icon: '📱',
    title: 'Mobile Applications',
    summary:
      'Native-quality iOS and Android apps from a single codebase — or fully native when the product demands it.',
    details: [
      'React Native with native modules where performance matters',
      'Offline-first data layers and push notification pipelines',
      'App Store / Play Store submission and release management',
      'Crash reporting, analytics, and staged rollouts',
    ],
    technologies: ['React Native', 'Swift', 'Kotlin', 'Expo'],
  },
  {
    slug: 'desktop-applications',
    icon: '🖥️',
    title: 'Desktop Applications',
    summary:
      'Cross-platform desktop software for Windows, macOS, and Linux — from internal tools to commercial products.',
    details: [
      'Electron for web-stack velocity, Tauri for lightweight footprints',
      'Auto-update infrastructure and code signing',
      'Deep OS integrations: tray, notifications, file system',
      'Licensing and telemetry built in',
    ],
    technologies: ['Electron', 'Tauri', 'Rust', 'TypeScript'],
  },
  {
    slug: 'ai-solutions',
    icon: '🤖',
    title: 'AI Solutions',
    summary:
      'Practical machine intelligence: assistants, document processing, recommendation systems, and workflow automation that pay for themselves.',
    details: [
      'Retrieval-augmented assistants grounded in your knowledge base',
      'Document classification, extraction, and summarization pipelines',
      'Evaluation harnesses so quality is measured, not guessed',
      'On-premise deployments for sensitive data',
    ],
    technologies: ['Python', 'PyTorch', 'PostgreSQL', 'Redis'],
  },
  {
    slug: 'cloud-solutions',
    icon: '☁️',
    title: 'Cloud Solutions',
    summary:
      'Infrastructure that scales with your business and bills that don’t. Architecture, migration, and 24/7 operations.',
    details: [
      'Kubernetes and container platforms sized to your team, not to fashion',
      'Infrastructure-as-code from day one',
      'Cost audits that routinely cut cloud spend 30–60%',
      'Disaster recovery with tested runbooks',
    ],
    technologies: ['Docker', 'Kubernetes', 'Terraform', 'NGINX'],
  },
  {
    slug: 'automation',
    icon: '⚙️',
    title: 'Automation',
    summary:
      'Kill the copy-paste. We connect your systems and automate the workflows your team does by hand every day.',
    details: [
      'ERP, CRM, and back-office integrations',
      'Event-driven pipelines with full audit trails',
      'Scheduled jobs, approvals, and human-in-the-loop steps',
      'Monitoring so silent failures are impossible',
    ],
    technologies: ['Node.js', 'BullMQ', 'PostgreSQL', 'Redis'],
  },
  {
    slug: 'api-development',
    icon: '🔌',
    title: 'API Development',
    summary:
      'REST and event-driven APIs with documentation your partners will compliment — versioned, secured, and monitored.',
    details: [
      'OpenAPI-first design with generated docs and SDKs',
      'Rate limiting, API keys, and OAuth flows',
      'Backwards-compatible versioning strategies',
      'p95 latency budgets with load testing to prove them',
    ],
    technologies: ['NestJS', 'OpenAPI', 'PostgreSQL', 'Redis'],
  },
  {
    slug: 'ui-ux-design',
    icon: '🎨',
    title: 'UI/UX Design',
    summary:
      'Research, product design, and design systems that make complex software feel obvious.',
    details: [
      'User research and journey mapping',
      'High-fidelity prototypes tested with real users',
      'Design systems with semantic tokens and documentation',
      'Accessibility (WCAG 2.1 AA) as a baseline, not an add-on',
    ],
    technologies: ['Figma', 'Design Tokens', 'Storybook', 'WCAG 2.1'],
  },
  {
    slug: 'cybersecurity-consulting',
    icon: '🛡️',
    title: 'Cybersecurity Consulting',
    summary:
      'Security reviews, hardening, and compliance support from engineers who build software — not just audit it.',
    details: [
      'OWASP-aligned code and architecture reviews',
      'Penetration testing with prioritized, actionable reports',
      'Secrets management, encryption, and access policies',
      'GDPR and SOC 2 readiness programs',
    ],
    technologies: ['OWASP', 'Burp Suite', 'Vault', 'SIEM'],
  },
];

export const TECH_STACK = [
  { name: 'TypeScript', category: 'Language' },
  { name: 'React', category: 'Frontend' },
  { name: 'Next.js', category: 'Frontend' },
  { name: 'React Native', category: 'Mobile' },
  { name: 'Node.js', category: 'Backend' },
  { name: 'NestJS', category: 'Backend' },
  { name: 'Python', category: 'Backend' },
  { name: 'PostgreSQL', category: 'Data' },
  { name: 'Redis', category: 'Data' },
  { name: 'Docker', category: 'DevOps' },
  { name: 'Kubernetes', category: 'DevOps' },
  { name: 'Terraform', category: 'DevOps' },
  { name: 'NGINX', category: 'DevOps' },
  { name: 'Tailwind CSS', category: 'Frontend' },
  { name: 'Figma', category: 'Design' },
  { name: 'GitHub Actions', category: 'DevOps' },
] as const;

export const PROCESS_STEPS = [
  {
    step: '01',
    title: 'Discover',
    description:
      'One to two weeks of focused discovery: goals, users, constraints, and risks. You get a scoped plan, architecture proposal, and a fixed quote per milestone.',
  },
  {
    step: '02',
    title: 'Design',
    description:
      'Flows, wireframes, and high-fidelity UI validated with your team before a line of code is written. Design systems keep everything consistent from day one.',
  },
  {
    step: '03',
    title: 'Build',
    description:
      'Two-week sprints with demos at the end of each. You watch progress live in your client dashboard — tasks, milestones, and time, fully transparent.',
  },
  {
    step: '04',
    title: 'Launch & grow',
    description:
      'Zero-downtime deployment, monitoring, and a 30-day stabilization window. Then we iterate: analytics-driven improvements, new features, ongoing support.',
  },
] as const;

export const COMPANY_VALUES = [
  {
    title: 'Senior by default',
    description:
      'No bait-and-switch staffing. The engineers who scope your project are the engineers who build it.',
  },
  {
    title: 'Radical transparency',
    description:
      'Live dashboards, honest estimates, and bad news delivered early. You always know exactly where your project stands.',
  },
  {
    title: 'Built to hand over',
    description:
      'Documentation, tests, and clean architecture — your team can take over the codebase the day we leave.',
  },
  {
    title: 'Security is not a feature',
    description:
      'Threat modeling, dependency scanning, and OWASP reviews are part of every engagement, not a paid extra.',
  },
] as const;

export const TEAM = [
  { name: 'Ava Reyes', role: 'Founder & CEO', bio: 'Ex-principal engineer. 15 years shipping products from seed-stage to IPO.' },
  { name: 'Noah Kim', role: 'Delivery Manager', bio: 'Turns chaos into two-week sprints. Certified in getting things shipped.' },
  { name: 'Lina Haddad', role: 'Lead Engineer', bio: 'Full-stack architect with a soft spot for query planners and clean domain models.' },
  { name: 'Marco Ruiz', role: 'Head of Design', bio: 'Design systems evangelist. Believes software should feel inevitable.' },
  { name: 'Priya Nair', role: 'DevOps Lead', bio: 'Keeps deployments boring and dashboards green across nine production clusters.' },
  { name: 'Tomás Weber', role: 'Security Engineer', bio: 'Breaks things professionally so your customers never see them broken.' },
] as const;
