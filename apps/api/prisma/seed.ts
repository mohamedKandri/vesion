import { PrismaClient, UserRole, PostStatus, TaskStatus, TaskPriority, ProjectStatus, BillingInterval } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const ROUNDS = parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10);
const SEED_PASSWORD = process.env.SEED_PASSWORD ?? 'ChangeMe!2026';

async function seedUsers() {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, ROUNDS);
  const now = new Date();

  const admin = await prisma.user.upsert({
    where: { email: 'admin@vesion.dev' },
    update: {},
    create: {
      email: 'admin@vesion.dev',
      passwordHash,
      firstName: 'Ava',
      lastName: 'Reyes',
      role: UserRole.ADMIN,
      jobTitle: 'Founder & CEO',
      emailVerifiedAt: now,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@vesion.dev' },
    update: {},
    create: {
      email: 'manager@vesion.dev',
      passwordHash,
      firstName: 'Noah',
      lastName: 'Kim',
      role: UserRole.MANAGER,
      jobTitle: 'Delivery Manager',
      emailVerifiedAt: now,
    },
  });

  const developer = await prisma.user.upsert({
    where: { email: 'dev@vesion.dev' },
    update: {},
    create: {
      email: 'dev@vesion.dev',
      passwordHash,
      firstName: 'Lina',
      lastName: 'Haddad',
      role: UserRole.DEVELOPER,
      jobTitle: 'Senior Full-Stack Engineer',
      emailVerifiedAt: now,
    },
  });

  const company = await prisma.company.create({
    data: {
      name: 'Northwind Logistics',
      website: 'https://northwind.example.com',
      industry: 'Logistics & Supply Chain',
      city: 'Rotterdam',
      country: 'Netherlands',
    },
  });

  const client = await prisma.user.upsert({
    where: { email: 'client@northwind.example.com' },
    update: {},
    create: {
      email: 'client@northwind.example.com',
      passwordHash,
      firstName: 'Emma',
      lastName: 'de Vries',
      role: UserRole.CLIENT,
      jobTitle: 'Head of Digital',
      emailVerifiedAt: now,
      companyId: company.id,
    },
  });

  return { admin, manager, developer, client, company };
}

async function seedBilling(companyId: string) {
  await prisma.taxRate.createMany({
    data: [
      { name: 'VAT 21%', ratePercent: 21, isDefault: true },
      { name: 'VAT 9%', ratePercent: 9 },
      { name: 'Zero-rated', ratePercent: 0 },
    ],
  });

  await prisma.plan.createMany({
    data: [
      {
        name: 'Starter',
        slug: 'starter',
        description: 'For teams that need a reliable partner for a focused product.',
        price: 2900,
        interval: BillingInterval.MONTHLY,
        order: 1,
        features: [
          'Dedicated engineer',
          'Up to 2 active workstreams',
          'Weekly progress reports',
          'Business-hours support',
          'Client dashboard access',
        ],
      },
      {
        name: 'Growth',
        slug: 'growth',
        description: 'A cross-functional squad shipping continuously.',
        price: 7900,
        interval: BillingInterval.MONTHLY,
        isPopular: true,
        order: 2,
        features: [
          'Product squad (3 engineers + designer)',
          'Unlimited workstreams',
          'Dedicated delivery manager',
          'Priority support (4h response)',
          'Quarterly architecture reviews',
          'Security audits included',
        ],
      },
      {
        name: 'Enterprise',
        slug: 'enterprise',
        description: 'Custom engagement for mission-critical platforms.',
        price: 19900,
        interval: BillingInterval.MONTHLY,
        order: 3,
        features: [
          'Custom team composition',
          'SLA-backed 24/7 support',
          'On-premise & air-gapped deployments',
          'Compliance & penetration testing',
          'Dedicated solutions architect',
          'Executive reporting',
        ],
      },
    ],
  });

  const vat = await prisma.taxRate.findFirst({ where: { isDefault: true } });
  const invoice = await prisma.invoice.create({
    data: {
      number: 'INV-2026-0001',
      companyId,
      status: 'SENT',
      dueDate: new Date(Date.now() + 14 * 86_400_000),
      taxRateId: vat?.id,
      subtotal: 12500,
      taxAmount: 2625,
      total: 15125,
      sentAt: new Date(),
      items: {
        create: [
          { description: 'Discovery & technical architecture', quantity: 1, unitPrice: 4500, amount: 4500 },
          { description: 'Sprint 1 — customer portal foundation', quantity: 2, unitPrice: 4000, amount: 8000 },
        ],
      },
    },
  });
  return invoice;
}

async function seedProject(companyId: string, managerId: string, developerId: string, clientId: string) {
  const project = await prisma.project.create({
    data: {
      name: 'Northwind Customer Portal',
      slug: 'northwind-customer-portal',
      description:
        'A self-service portal for Northwind customers: shipment tracking, invoicing, and real-time notifications.',
      status: ProjectStatus.IN_PROGRESS,
      progress: 45,
      budget: 86000,
      startDate: new Date('2026-05-04'),
      dueDate: new Date('2026-10-30'),
      companyId,
      managerId,
      members: {
        create: [
          { userId: managerId, roleTitle: 'Delivery Manager' },
          { userId: developerId, roleTitle: 'Lead Engineer' },
          { userId: clientId, roleTitle: 'Product Owner' },
        ],
      },
      milestones: {
        create: [
          { title: 'Discovery & UX', status: 'COMPLETED', order: 1, dueDate: new Date('2026-05-29') },
          { title: 'Portal foundation', status: 'IN_PROGRESS', order: 2, dueDate: new Date('2026-08-14') },
          { title: 'Tracking & notifications', status: 'PENDING', order: 3, dueDate: new Date('2026-09-25') },
          { title: 'Launch & hardening', status: 'PENDING', order: 4, dueDate: new Date('2026-10-30') },
        ],
      },
    },
    include: { milestones: true },
  });

  const foundation = project.milestones.find((m) => m.title === 'Portal foundation');
  await prisma.task.createMany({
    data: [
      {
        projectId: project.id,
        milestoneId: foundation?.id,
        title: 'Implement authentication flows',
        description: 'Login, registration, password reset with 2FA support.',
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        assigneeId: developerId,
        reporterId: managerId,
        order: 1,
        labels: ['backend', 'security'],
      },
      {
        projectId: project.id,
        milestoneId: foundation?.id,
        title: 'Shipment list & detail views',
        description: 'Paginated shipment table with status filters and detail drawer.',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        assigneeId: developerId,
        reporterId: managerId,
        order: 2,
        labels: ['frontend'],
      },
      {
        projectId: project.id,
        milestoneId: foundation?.id,
        title: 'Invoice PDF export',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        reporterId: managerId,
        order: 3,
        labels: ['backend', 'billing'],
      },
      {
        projectId: project.id,
        title: 'Load testing plan',
        status: TaskStatus.BACKLOG,
        priority: TaskPriority.LOW,
        reporterId: managerId,
        order: 4,
        labels: ['devops'],
      },
    ],
  });

  return project;
}

async function seedSupport() {
  await prisma.ticketCategory.createMany({
    data: [
      { name: 'Technical issue', slug: 'technical-issue' },
      { name: 'Billing', slug: 'billing' },
      { name: 'Feature request', slug: 'feature-request' },
      { name: 'General question', slug: 'general-question' },
    ],
  });
}

async function seedKnowledgeBase(authorId: string) {
  const gettingStarted = await prisma.kbCategory.create({
    data: { name: 'Getting started', slug: 'getting-started', order: 1 },
  });
  const billing = await prisma.kbCategory.create({
    data: { name: 'Billing & invoices', slug: 'billing-invoices', order: 2 },
  });
  const projects = await prisma.kbCategory.create({
    data: { name: 'Projects & delivery', slug: 'projects-delivery', order: 3 },
  });

  await prisma.kbArticle.createMany({
    data: [
      {
        title: 'Welcome to your Vesion client dashboard',
        slug: 'welcome-to-your-dashboard',
        excerpt: 'A tour of the client dashboard: projects, invoices, files, and support.',
        body: `Your dashboard is the single place to follow everything we build together.\n\n## Projects\nEach engagement appears as a project with live progress, milestones, and a task board.\n\n## Invoices & payments\nAll invoices are available under **Billing**, including payment history and receipts.\n\n## Files\nDeliverables, designs, and documents are shared in the **Files** section of each project.\n\n## Support\nOpen a ticket any time from **Support** — our team responds within one business day on all plans.`,
        categoryId: gettingStarted.id,
        authorId,
        status: PostStatus.PUBLISHED,
        keywords: ['dashboard', 'getting started', 'tour', 'overview'],
        publishedAt: new Date(),
      },
      {
        title: 'How invoicing and payments work',
        slug: 'how-invoicing-works',
        excerpt: 'Invoice lifecycle, payment methods, taxes, and receipts explained.',
        body: `Invoices are issued per milestone or per billing period, depending on your engagement.\n\n## Lifecycle\nDraft → Sent → Paid (or Partially paid). Overdue invoices are flagged automatically.\n\n## Payment methods\nWe accept bank transfer as the primary method. Payment details are included on every invoice PDF.\n\n## Taxes\nVAT is applied according to your billing country. Your tax ID can be set in **Settings → Company profile**.\n\n## Receipts\nOnce a payment is recorded, a receipt is available on the invoice page and you receive an email confirmation.`,
        categoryId: billing.id,
        authorId,
        status: PostStatus.PUBLISHED,
        keywords: ['invoice', 'payment', 'billing', 'vat', 'tax', 'receipt', 'bank transfer'],
        publishedAt: new Date(),
      },
      {
        title: 'Understanding project milestones and progress',
        slug: 'project-milestones-progress',
        excerpt: 'How we structure delivery into milestones and how progress is calculated.',
        body: `Every project is broken into milestones with clear acceptance criteria.\n\n## Milestones\nA milestone bundles related tasks. Its status moves from Pending → In progress → Completed.\n\n## Progress\nProject progress is the weighted completion of tasks across all milestones, updated in real time.\n\n## Reviews\nAt the end of each milestone we hold a review call and share a written summary in your dashboard.`,
        categoryId: projects.id,
        authorId,
        status: PostStatus.PUBLISHED,
        keywords: ['milestone', 'progress', 'delivery', 'review', 'timeline'],
        publishedAt: new Date(),
      },
      {
        title: 'Opening and tracking support tickets',
        slug: 'support-tickets-guide',
        excerpt: 'Create tickets, set priorities, attach files, and follow resolution.',
        body: `## Creating a ticket\nGo to **Support → New ticket**, pick a category and priority, and describe the issue. Attach screenshots or logs if useful.\n\n## Priorities\n- **Urgent** — production down, we respond immediately.\n- **High** — major feature impaired.\n- **Medium/Low** — questions and minor issues.\n\n## Tracking\nEvery reply triggers an email notification. Tickets close automatically 7 days after resolution.`,
        categoryId: gettingStarted.id,
        authorId,
        status: PostStatus.PUBLISHED,
        keywords: ['support', 'ticket', 'help', 'priority', 'sla'],
        publishedAt: new Date(),
      },
    ],
  });
}

async function seedFaq() {
  await prisma.faqItem.createMany({
    data: [
      {
        question: 'What does a typical engagement look like?',
        answer:
          'We start with a 1–2 week discovery to align on scope, architecture, and a milestone plan. Delivery then runs in two-week sprints with demos at the end of each sprint and a shared dashboard for full transparency.',
        category: 'Process',
        order: 1,
      },
      {
        question: 'How do you price projects?',
        answer:
          'Fixed-scope projects are quoted per milestone after discovery. Ongoing product work runs on monthly plans (Starter, Growth, Enterprise). Every quote itemizes deliverables so there are no surprises.',
        category: 'Pricing',
        order: 2,
      },
      {
        question: 'Who owns the code and IP?',
        answer:
          'You do. All code, designs, and documentation are transferred to you in full upon payment, including repository history. We use permissive open-source dependencies and document every license.',
        category: 'Legal',
        order: 3,
      },
      {
        question: 'What technologies do you work with?',
        answer:
          'TypeScript, React/Next.js, Node.js/NestJS, Python, PostgreSQL, Redis, Docker, and Kubernetes form our core stack. For mobile we use React Native and native Swift/Kotlin; for desktop, Electron and Tauri.',
        category: 'Technology',
        order: 4,
      },
      {
        question: 'Do you provide support after launch?',
        answer:
          'Yes. Every launch includes a 30-day stabilization window. After that, our support plans cover monitoring, security patches, and feature iterations with SLA-backed response times.',
        category: 'Support',
        order: 5,
      },
      {
        question: 'How do you handle security and data protection?',
        answer:
          'Security is built in from day one: OWASP-aligned reviews, dependency scanning, encrypted secrets, least-privilege access, and GDPR-compliant data handling. Enterprise engagements include penetration testing.',
        category: 'Security',
        order: 6,
      },
      {
        question: 'Can you take over an existing codebase?',
        answer:
          'Absolutely. We begin with a technical audit covering architecture, code quality, security, and infrastructure, then propose a stabilization and improvement roadmap before taking ownership of delivery.',
        category: 'Process',
        order: 7,
      },
      {
        question: 'Where is your team located?',
        answer:
          'We are a remote-first team across Europe with overlap hours for North American clients. For Enterprise engagements we can arrange on-site workshops.',
        category: 'Company',
        order: 8,
      },
    ],
  });
}

async function seedCms(authorId: string) {
  const engineering = await prisma.blogCategory.create({ data: { name: 'Engineering', slug: 'engineering' } });
  const design = await prisma.blogCategory.create({ data: { name: 'Design', slug: 'design' } });
  const business = await prisma.blogCategory.create({ data: { name: 'Business', slug: 'business' } });

  await prisma.blogPost.createMany({
    data: [
      {
        title: 'Choosing the right architecture for a product that must scale',
        slug: 'choosing-architecture-that-scales',
        excerpt:
          'Monolith, modular monolith, or microservices? A pragmatic framework for deciding based on team size, domain complexity, and operational maturity.',
        content: `Most scaling problems are organizational before they are technical. This post walks through the decision framework we apply on every engagement.\n\n## Start with the team, not the diagram\nA service boundary you cannot staff is a liability. Below ~15 engineers, a modular monolith with enforced module boundaries almost always wins: one deployable, one database with clear schema ownership, and module-level APIs that can later become network APIs.\n\n## The extraction test\nBefore extracting a service ask: does it have independent scaling needs, an independent release cadence, or an independent failure domain? If none apply, extraction adds latency and operational cost for nothing.\n\n## What we actually do\nWe ship modular monoliths with clean architecture (domain, application, infrastructure layers), event-driven seams via a message queue, and observability from day one. When a module earns extraction, the seam already exists.\n\n## Takeaway\nArchitecture is a sequence of reversible decisions. Optimize for the ability to change your mind cheaply.`,
        categoryId: engineering.id,
        authorId,
        status: PostStatus.PUBLISHED,
        tags: ['architecture', 'scalability', 'microservices'],
        readingMinutes: 7,
        publishedAt: new Date('2026-06-10'),
      },
      {
        title: 'Design systems that survive their second year',
        slug: 'design-systems-second-year',
        excerpt:
          'Most design systems die of neglect, not bad tokens. How we structure governance, contribution, and versioning so systems keep paying dividends.',
        content: `A design system is a product with internal customers. Treat it like one.\n\n## The failure mode\nYear one: excitement, tokens, a Figma library. Year two: drift, forks, "we'll fix it later". The root cause is always governance, not tooling.\n\n## What works\n- A named owner with dedicated time, not a committee.\n- Semantic tokens (intent, not value): \`surface-raised\`, not \`gray-800\`.\n- Contribution ladders: propose → RFC → implement → document.\n- Versioned releases with codemods for breaking changes.\n\n## Measuring value\nTrack adoption (percentage of screens on system components) and velocity (time from design to shipped UI). If neither improves, the system is decoration.`,
        categoryId: design.id,
        authorId,
        status: PostStatus.PUBLISHED,
        tags: ['design-systems', 'ui', 'process'],
        readingMinutes: 6,
        publishedAt: new Date('2026-05-22'),
      },
      {
        title: 'The real cost of a slow website (and how to fix it)',
        slug: 'real-cost-of-slow-website',
        excerpt:
          'Every 100ms of latency costs conversion. A field guide to the performance work that actually moves business metrics.',
        content: `Performance is a business lever, not an engineering vanity metric.\n\n## Where the money leaks\nStudies consistently show conversion drops of 4–7% per additional second of load time. For a store doing $2M/year, shaving two seconds is six figures.\n\n## The 80/20 of web performance\n1. **Ship less JavaScript.** Server components, code-splitting, and deleting unused dependencies beat any micro-optimization.\n2. **Optimize images.** Modern formats, responsive sizes, lazy loading below the fold.\n3. **Cache aggressively.** CDN for static assets, HTTP caching for pages, Redis for hot data.\n4. **Measure real users.** Lab scores lie; Core Web Vitals from the field do not.\n\n## Our process\nEvery project gets a performance budget enforced in CI. If a PR pushes the bundle past budget, it does not merge.`,
        categoryId: business.id,
        authorId,
        status: PostStatus.PUBLISHED,
        tags: ['performance', 'web-vitals', 'conversion'],
        readingMinutes: 5,
        publishedAt: new Date('2026-04-15'),
      },
    ],
  });

  await prisma.portfolioItem.createMany({
    data: [
      {
        title: 'Northwind Logistics — Customer Portal',
        slug: 'northwind-customer-portal',
        summary:
          'Self-service portal for a European logistics leader: real-time shipment tracking, invoicing, and notifications for 40k monthly users.',
        content: `Northwind needed to replace phone-and-email customer service with a modern self-service portal.\n\nWe designed and built a Next.js portal backed by a NestJS API, integrating with their existing ERP over a message queue. The portal handles 40,000 monthly active users with p95 response times under 180ms.`,
        industry: 'Logistics',
        technologies: ['Next.js', 'NestJS', 'PostgreSQL', 'Redis', 'Docker'],
        isCaseStudy: true,
        challenge:
          'Customer service was drowning: 60% of inbound calls were "where is my shipment?" questions, and invoice disputes took days to resolve because data lived in three disconnected systems.',
        solution:
          'A unified customer portal with real-time shipment tracking, self-service invoicing, and proactive delay notifications — integrated with the legacy ERP through an event-driven sync layer so no ERP migration was required.',
        results:
          'Support call volume dropped 58% in the first quarter. Invoice dispute resolution went from 4 days to same-day. NPS rose 22 points.',
        metrics: [
          { label: 'Support calls', value: '-58%' },
          { label: 'Dispute resolution', value: '4 days → same-day' },
          { label: 'NPS', value: '+22 pts' },
          { label: 'p95 latency', value: '180ms' },
        ],
        featured: true,
        status: PostStatus.PUBLISHED,
        order: 1,
      },
      {
        title: 'Meridian Health — Patient Scheduling Platform',
        slug: 'meridian-patient-scheduling',
        summary:
          'HIPAA-grade scheduling and telehealth platform for a clinic network, cutting no-show rates by a third.',
        content: `Meridian operates 14 clinics and struggled with fragmented scheduling and high no-show rates.\n\nWe delivered a patient-facing scheduling web app and staff console with automated reminders, waitlist backfill, and telehealth video visits — all with end-to-end encryption and a full audit trail.`,
        industry: 'Healthcare',
        technologies: ['React', 'Node.js', 'PostgreSQL', 'WebRTC', 'Kubernetes'],
        isCaseStudy: true,
        challenge:
          'Fourteen clinics ran three different scheduling systems. No-show rates averaged 19%, and staff spent hours daily on manual reminder calls.',
        solution:
          'A single scheduling platform with smart reminders (SMS/email), automatic waitlist backfill when slots free up, and integrated telehealth visits — deployed on an auditable, encrypted infrastructure.',
        results:
          'No-shows fell from 19% to 12.5%. Waitlist backfill recovered ~$38k/month in previously lost appointment revenue.',
        metrics: [
          { label: 'No-show rate', value: '19% → 12.5%' },
          { label: 'Recovered revenue', value: '$38k/mo' },
          { label: 'Booking time', value: '-70%' },
        ],
        featured: true,
        status: PostStatus.PUBLISHED,
        order: 2,
      },
      {
        title: 'Atlas Commerce — Headless Storefront Replatform',
        slug: 'atlas-headless-storefront',
        summary:
          'Headless commerce replatform for a fashion retailer: 2.1s faster loads and a 31% conversion lift.',
        content: `Atlas was losing mobile customers to a slow monolithic storefront.\n\nWe replatformed to a headless architecture: a Next.js storefront with edge caching in front of their existing commerce engine, plus a design refresh focused on mobile checkout.`,
        industry: 'E-commerce',
        technologies: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Redis', 'NGINX'],
        isCaseStudy: true,
        challenge:
          'Mobile pages took 5.4s to become interactive; checkout abandonment on mobile was 82%. The legacy theme system made every change risky and slow.',
        solution:
          'A headless Next.js storefront with aggressive edge caching, a rebuilt one-page checkout, and a component design system that lets the marketing team compose landing pages without engineering.',
        results:
          'Largest Contentful Paint improved from 5.4s to 1.9s on mobile. Conversion rose 31%, and landing-page turnaround went from two weeks to same-day.',
        metrics: [
          { label: 'LCP (mobile)', value: '5.4s → 1.9s' },
          { label: 'Conversion', value: '+31%' },
          { label: 'Landing pages', value: '2 weeks → same-day' },
        ],
        featured: true,
        status: PostStatus.PUBLISHED,
        order: 3,
      },
      {
        title: 'Forge Robotics — Fleet Operations Dashboard',
        slug: 'forge-fleet-dashboard',
        summary: 'Real-time operations dashboard for an industrial robotics fleet across 9 factories.',
        content: `Forge needed a single pane of glass for hundreds of robots across nine factories.\n\nWe built a real-time dashboard ingesting telemetry over MQTT, with anomaly alerts, maintenance scheduling, and role-based views for operators, engineers, and executives.`,
        industry: 'Manufacturing',
        technologies: ['React', 'NestJS', 'TimescaleDB', 'MQTT', 'Grafana'],
        status: PostStatus.PUBLISHED,
        order: 4,
      },
    ],
  });

  await prisma.testimonial.createMany({
    data: [
      {
        authorName: 'Emma de Vries',
        authorRole: 'Head of Digital',
        companyName: 'Northwind Logistics',
        quote:
          'Vesion delivered in five months what our previous vendor could not in two years. The dashboard transparency alone changed how we run digital projects.',
        rating: 5,
        order: 1,
      },
      {
        authorName: 'Dr. Marcus Chen',
        authorRole: 'COO',
        companyName: 'Meridian Health',
        quote:
          'They treated compliance as a design constraint, not an afterthought. Our no-show rate dropped by a third and the staff actually loves the software.',
        rating: 5,
        order: 2,
      },
      {
        authorName: 'Sofia Marino',
        authorRole: 'VP of E-commerce',
        companyName: 'Atlas Commerce',
        quote:
          'A 31% conversion lift speaks for itself. The team is senior, direct, and relentless about performance.',
        rating: 5,
        order: 3,
      },
      {
        authorName: 'James Okafor',
        authorRole: 'CTO',
        companyName: 'Forge Robotics',
        quote:
          'Rare to find a partner comfortable from MQTT telemetry to executive dashboards. Vesion is that partner.',
        rating: 5,
        order: 4,
      },
    ],
  });
}

async function seedCareers() {
  await prisma.jobPosting.createMany({
    data: [
      {
        title: 'Senior Full-Stack Engineer (TypeScript)',
        slug: 'senior-fullstack-engineer',
        department: 'Engineering',
        location: 'Remote (EU)',
        type: 'FULL_TIME',
        salaryRange: '€75k–€95k',
        description: `You will own features end-to-end across our client projects: from data model to pixel. Our stack is TypeScript everywhere — Next.js, NestJS, PostgreSQL, Redis — deployed with Docker and CI/CD.\n\nYou will work directly with clients, participate in architecture decisions, and mentor mid-level engineers.`,
        requirements: [
          '5+ years building production web applications',
          'Deep TypeScript, React, and Node.js experience',
          'Strong SQL and data-modeling skills',
          'Comfortable owning client communication',
          'Experience with testing, CI/CD, and observability',
        ],
      },
      {
        title: 'Product Designer (UI/UX)',
        slug: 'product-designer',
        department: 'Design',
        location: 'Remote (EU)',
        type: 'FULL_TIME',
        salaryRange: '€60k–€80k',
        description: `Design end-to-end product experiences for our clients: research, flows, high-fidelity UI, and design systems. You will pair closely with engineers and see your work shipped within weeks, not quarters.`,
        requirements: [
          '4+ years of product design experience',
          'A portfolio showing shipped, complex products',
          'Fluency with design systems and tokens',
          'Ability to prototype interactions',
          'Excellent written communication',
        ],
      },
      {
        title: 'DevOps Engineer',
        slug: 'devops-engineer',
        department: 'Engineering',
        location: 'Remote (EU)',
        type: 'CONTRACT',
        salaryRange: '€500–€650/day',
        description: `Own infrastructure across client projects: Docker, Kubernetes, CI/CD pipelines, monitoring, and incident response. Help us keep deployments boring.`,
        requirements: [
          'Production Kubernetes experience',
          'Strong CI/CD pipeline design (GitHub Actions)',
          'Observability stack experience (Prometheus/Grafana/Loki)',
          'Security-first mindset',
        ],
      },
    ],
  });
}

async function seedSettings() {
  await prisma.setting.createMany({
    data: [
      { key: 'billing.invoicePrefix', value: 'INV' },
      { key: 'billing.quotePrefix', value: 'QTE' },
      { key: 'billing.defaultDueDays', value: 14 },
      { key: 'company.name', value: 'Vesion' },
      { key: 'company.email', value: 'hello@vesion.dev' },
      { key: 'support.autoCloseResolvedAfterDays', value: 7 },
    ],
  });
}

async function main() {
  console.log('Seeding database…');
  const { admin, manager, developer, client, company } = await seedUsers();
  await seedBilling(company.id);
  await seedProject(company.id, manager.id, developer.id, client.id);
  await seedSupport();
  await seedKnowledgeBase(admin.id);
  await seedFaq();
  await seedCms(admin.id);
  await seedCareers();
  await seedSettings();
  console.log('Seed complete.');
  console.log(`Login accounts (password: ${SEED_PASSWORD}):`);
  console.log('  admin@vesion.dev / manager@vesion.dev / dev@vesion.dev / client@northwind.example.com');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
