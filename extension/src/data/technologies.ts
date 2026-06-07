export interface TechEntry {
  canonical: string;
  aliases: string[];
  category: TechCategory;
  githubLanguage?: string;
}

export type TechCategory =
  | 'language'
  | 'frontend'
  | 'backend'
  | 'database'
  | 'cloud'
  | 'devops'
  | 'testing'
  | 'mobile'
  | 'api'
  | 'ai_ml'
  | 'tool';

export const TECH_LIST: TechEntry[] = [
  // ── Languages ──────────────────────────────────────────────────────────────
  { canonical: 'JavaScript', aliases: ['JS', 'Javascript', 'javascript'], category: 'language', githubLanguage: 'JavaScript' },
  { canonical: 'TypeScript', aliases: ['TS', 'Typescript', 'typescript'], category: 'language', githubLanguage: 'TypeScript' },
  { canonical: 'Python', aliases: ['python', 'py'], category: 'language', githubLanguage: 'Python' },
  { canonical: 'Java', aliases: ['java'], category: 'language', githubLanguage: 'Java' },
  { canonical: 'Go', aliases: ['Golang', 'golang', 'go'], category: 'language', githubLanguage: 'Go' },
  { canonical: 'Rust', aliases: ['rust'], category: 'language', githubLanguage: 'Rust' },
  { canonical: 'Ruby', aliases: ['ruby'], category: 'language', githubLanguage: 'Ruby' },
  { canonical: 'PHP', aliases: ['php'], category: 'language', githubLanguage: 'PHP' },
  { canonical: 'C++', aliases: ['cpp', 'c plus plus'], category: 'language', githubLanguage: 'C++' },
  { canonical: 'C#', aliases: ['csharp', 'c sharp', 'CSharp'], category: 'language', githubLanguage: 'C#' },
  { canonical: 'Swift', aliases: ['swift'], category: 'language', githubLanguage: 'Swift' },
  { canonical: 'Kotlin', aliases: ['kotlin'], category: 'language', githubLanguage: 'Kotlin' },
  { canonical: 'Scala', aliases: ['scala'], category: 'language', githubLanguage: 'Scala' },
  { canonical: 'R', aliases: [' R ', 'R language'], category: 'language', githubLanguage: 'R' },
  { canonical: 'Dart', aliases: ['dart'], category: 'language', githubLanguage: 'Dart' },
  { canonical: 'Lua', aliases: ['lua'], category: 'language', githubLanguage: 'Lua' },
  { canonical: 'Haskell', aliases: ['haskell'], category: 'language', githubLanguage: 'Haskell' },
  { canonical: 'Elixir', aliases: ['elixir'], category: 'language', githubLanguage: 'Elixir' },
  { canonical: 'Clojure', aliases: ['clojure'], category: 'language', githubLanguage: 'Clojure' },
  { canonical: 'Perl', aliases: ['perl'], category: 'language', githubLanguage: 'Perl' },
  { canonical: 'Bash', aliases: ['bash', 'shell script', 'Shell'], category: 'language', githubLanguage: 'Shell' },
  { canonical: 'Solidity', aliases: ['solidity'], category: 'language', githubLanguage: 'Solidity' },
  { canonical: 'Zig', aliases: ['zig'], category: 'language', githubLanguage: 'Zig' },
  { canonical: 'HTML', aliases: ['html', 'HTML5'], category: 'language', githubLanguage: 'HTML' },
  { canonical: 'CSS', aliases: ['css', 'CSS3'], category: 'language', githubLanguage: 'CSS' },
  // ── Frontend ───────────────────────────────────────────────────────────────
  { canonical: 'React', aliases: ['ReactJS', 'React.js', 'react'], category: 'frontend' },
  { canonical: 'Vue', aliases: ['Vue.js', 'VueJS', 'vue'], category: 'frontend' },
  { canonical: 'Angular', aliases: ['AngularJS', 'angular'], category: 'frontend' },
  { canonical: 'Svelte', aliases: ['svelte', 'SvelteKit'], category: 'frontend' },
  { canonical: 'Next.js', aliases: ['NextJS', 'Next', 'next.js'], category: 'frontend' },
  { canonical: 'Nuxt', aliases: ['Nuxt.js', 'NuxtJS', 'nuxt'], category: 'frontend' },
  { canonical: 'Gatsby', aliases: ['gatsby'], category: 'frontend' },
  { canonical: 'Remix', aliases: ['remix'], category: 'frontend' },
  { canonical: 'Astro', aliases: ['astro'], category: 'frontend' },
  { canonical: 'Solid', aliases: ['SolidJS', 'Solid.js'], category: 'frontend' },
  { canonical: 'Preact', aliases: ['preact'], category: 'frontend' },
  { canonical: 'jQuery', aliases: ['jquery', 'JQuery'], category: 'frontend' },
  { canonical: 'Bootstrap', aliases: ['bootstrap'], category: 'frontend' },
  { canonical: 'Tailwind', aliases: ['TailwindCSS', 'Tailwind CSS', 'tailwind'], category: 'frontend' },
  { canonical: 'Material UI', aliases: ['MUI', 'Material-UI', 'MaterialUI'], category: 'frontend' },
  { canonical: 'Chakra UI', aliases: ['Chakra', 'chakra-ui'], category: 'frontend' },
  { canonical: 'Ant Design', aliases: ['AntDesign', 'antd'], category: 'frontend' },
  { canonical: 'Styled Components', aliases: ['styled-components', 'styled components'], category: 'frontend' },
  { canonical: 'Sass', aliases: ['SCSS', 'sass', 'scss'], category: 'frontend' },
  { canonical: 'Webpack', aliases: ['webpack'], category: 'frontend' },
  { canonical: 'Vite', aliases: ['vite'], category: 'frontend' },
  { canonical: 'Alpine.js', aliases: ['AlpineJS', 'Alpine'], category: 'frontend' },
  { canonical: 'HTMX', aliases: ['htmx'], category: 'frontend' },
  // ── Backend ────────────────────────────────────────────────────────────────
  { canonical: 'Node.js', aliases: ['NodeJS', 'Node', 'node.js', 'nodejs'], category: 'backend' },
  { canonical: 'Express', aliases: ['Express.js', 'ExpressJS', 'express'], category: 'backend' },
  { canonical: 'Fastify', aliases: ['fastify'], category: 'backend' },
  { canonical: 'NestJS', aliases: ['Nest.js', 'Nest', 'nestjs'], category: 'backend' },
  { canonical: 'Django', aliases: ['django'], category: 'backend' },
  { canonical: 'Flask', aliases: ['flask'], category: 'backend' },
  { canonical: 'FastAPI', aliases: ['fastapi', 'fast-api'], category: 'backend' },
  { canonical: 'Spring Boot', aliases: ['Spring', 'spring boot', 'spring-boot'], category: 'backend' },
  { canonical: 'Laravel', aliases: ['laravel'], category: 'backend' },
  { canonical: 'Rails', aliases: ['Ruby on Rails', 'RubyOnRails', 'rails'], category: 'backend' },
  { canonical: 'Gin', aliases: ['gin'], category: 'backend' },
  { canonical: 'Fiber', aliases: ['fiber', 'go-fiber'], category: 'backend' },
  { canonical: 'Phoenix', aliases: ['phoenix'], category: 'backend' },
  { canonical: 'Deno', aliases: ['deno'], category: 'backend' },
  { canonical: 'Bun', aliases: ['bun'], category: 'backend' },
  { canonical: 'Hapi', aliases: ['hapi', 'hapi.js'], category: 'backend' },
  { canonical: 'Koa', aliases: ['koa', 'koa.js'], category: 'backend' },
  // ── Databases ──────────────────────────────────────────────────────────────
  { canonical: 'PostgreSQL', aliases: ['Postgres', 'postgres', 'postgresql'], category: 'database' },
  { canonical: 'MySQL', aliases: ['mysql'], category: 'database' },
  { canonical: 'SQLite', aliases: ['sqlite'], category: 'database' },
  { canonical: 'MongoDB', aliases: ['mongo', 'mongodb'], category: 'database' },
  { canonical: 'Redis', aliases: ['redis'], category: 'database' },
  { canonical: 'Cassandra', aliases: ['cassandra', 'Apache Cassandra'], category: 'database' },
  { canonical: 'DynamoDB', aliases: ['dynamo', 'dynamodb'], category: 'database' },
  { canonical: 'Elasticsearch', aliases: ['elastic', 'elasticsearch'], category: 'database' },
  { canonical: 'Neo4j', aliases: ['neo4j'], category: 'database' },
  { canonical: 'Firebase', aliases: ['firebase', 'Firestore'], category: 'database' },
  { canonical: 'Supabase', aliases: ['supabase'], category: 'database' },
  { canonical: 'Prisma', aliases: ['prisma'], category: 'database' },
  { canonical: 'Drizzle', aliases: ['drizzle-orm', 'drizzle'], category: 'database' },
  { canonical: 'TypeORM', aliases: ['typeorm', 'type-orm'], category: 'database' },
  { canonical: 'Mongoose', aliases: ['mongoose'], category: 'database' },
  // ── Cloud ──────────────────────────────────────────────────────────────────
  { canonical: 'AWS', aliases: ['Amazon Web Services', 'aws'], category: 'cloud' },
  { canonical: 'GCP', aliases: ['Google Cloud', 'Google Cloud Platform', 'gcp'], category: 'cloud' },
  { canonical: 'Azure', aliases: ['Microsoft Azure', 'azure'], category: 'cloud' },
  { canonical: 'Vercel', aliases: ['vercel'], category: 'cloud' },
  { canonical: 'Netlify', aliases: ['netlify'], category: 'cloud' },
  { canonical: 'Heroku', aliases: ['heroku'], category: 'cloud' },
  { canonical: 'DigitalOcean', aliases: ['digital ocean', 'digitalocean'], category: 'cloud' },
  { canonical: 'Cloudflare', aliases: ['cloudflare', 'Cloudflare Workers'], category: 'cloud' },
  { canonical: 'Railway', aliases: ['railway'], category: 'cloud' },
  { canonical: 'Fly.io', aliases: ['fly', 'flyio'], category: 'cloud' },
  // ── DevOps ─────────────────────────────────────────────────────────────────
  { canonical: 'Docker', aliases: ['docker'], category: 'devops' },
  { canonical: 'Kubernetes', aliases: ['K8s', 'k8s', 'kubernetes'], category: 'devops' },
  { canonical: 'Terraform', aliases: ['terraform'], category: 'devops' },
  { canonical: 'Ansible', aliases: ['ansible'], category: 'devops' },
  { canonical: 'Jenkins', aliases: ['jenkins'], category: 'devops' },
  { canonical: 'GitHub Actions', aliases: ['github actions', 'GH Actions'], category: 'devops' },
  { canonical: 'GitLab CI', aliases: ['gitlab ci', 'gitlab-ci', 'GitLab'], category: 'devops' },
  { canonical: 'CircleCI', aliases: ['circleci', 'circle ci'], category: 'devops' },
  { canonical: 'ArgoCD', aliases: ['argocd', 'argo'], category: 'devops' },
  { canonical: 'Helm', aliases: ['helm'], category: 'devops' },
  { canonical: 'Nginx', aliases: ['nginx', 'NGINX'], category: 'devops' },
  { canonical: 'Prometheus', aliases: ['prometheus'], category: 'devops' },
  { canonical: 'Grafana', aliases: ['grafana'], category: 'devops' },
  // ── Testing ────────────────────────────────────────────────────────────────
  { canonical: 'Jest', aliases: ['jest'], category: 'testing' },
  { canonical: 'Vitest', aliases: ['vitest'], category: 'testing' },
  { canonical: 'Mocha', aliases: ['mocha'], category: 'testing' },
  { canonical: 'Cypress', aliases: ['cypress'], category: 'testing' },
  { canonical: 'Playwright', aliases: ['playwright'], category: 'testing' },
  { canonical: 'Selenium', aliases: ['selenium'], category: 'testing' },
  { canonical: 'pytest', aliases: ['Pytest', 'py.test'], category: 'testing' },
  { canonical: 'JUnit', aliases: ['junit'], category: 'testing' },
  { canonical: 'RSpec', aliases: ['rspec'], category: 'testing' },
  // ── Mobile ─────────────────────────────────────────────────────────────────
  { canonical: 'React Native', aliases: ['ReactNative', 'react-native'], category: 'mobile' },
  { canonical: 'Flutter', aliases: ['flutter'], category: 'mobile' },
  { canonical: 'Ionic', aliases: ['ionic'], category: 'mobile' },
  { canonical: 'SwiftUI', aliases: ['swiftui'], category: 'mobile' },
  { canonical: 'Jetpack Compose', aliases: ['jetpack compose', 'compose'], category: 'mobile' },
  { canonical: 'Expo', aliases: ['expo'], category: 'mobile' },
  // ── APIs & Protocols ───────────────────────────────────────────────────────
  { canonical: 'GraphQL', aliases: ['graphql'], category: 'api' },
  { canonical: 'gRPC', aliases: ['grpc'], category: 'api' },
  { canonical: 'WebSocket', aliases: ['websocket', 'websockets', 'ws'], category: 'api' },
  { canonical: 'tRPC', aliases: ['trpc'], category: 'api' },
  { canonical: 'OpenAPI', aliases: ['swagger', 'Swagger', 'openapi'], category: 'api' },
  { canonical: 'Kafka', aliases: ['kafka', 'Apache Kafka'], category: 'api' },
  { canonical: 'RabbitMQ', aliases: ['rabbitmq', 'rabbit mq'], category: 'api' },
  // ── AI / ML ────────────────────────────────────────────────────────────────
  { canonical: 'TensorFlow', aliases: ['tensorflow', 'tf'], category: 'ai_ml' },
  { canonical: 'PyTorch', aliases: ['pytorch', 'torch'], category: 'ai_ml' },
  { canonical: 'scikit-learn', aliases: ['sklearn', 'scikit learn'], category: 'ai_ml' },
  { canonical: 'Keras', aliases: ['keras'], category: 'ai_ml' },
  { canonical: 'OpenAI', aliases: ['openai', 'ChatGPT API', 'GPT-4'], category: 'ai_ml' },
  { canonical: 'LangChain', aliases: ['langchain', 'lang chain'], category: 'ai_ml' },
  { canonical: 'Hugging Face', aliases: ['huggingface', 'transformers'], category: 'ai_ml' },
  { canonical: 'Pandas', aliases: ['pandas'], category: 'ai_ml' },
  { canonical: 'NumPy', aliases: ['numpy'], category: 'ai_ml' },
  // ── Tools ──────────────────────────────────────────────────────────────────
  { canonical: 'Git', aliases: ['git'], category: 'tool' },
  { canonical: 'Linux', aliases: ['linux', 'Ubuntu', 'Debian'], category: 'tool' },
  { canonical: 'Storybook', aliases: ['storybook'], category: 'tool' },
  { canonical: 'Figma', aliases: ['figma'], category: 'tool' },
  { canonical: 'Vim', aliases: ['vim', 'Neovim', 'nvim'], category: 'tool' },
];

export const TECH_MAP = new Map<string, TechEntry>(
  TECH_LIST.flatMap(entry =>
    [entry.canonical, ...entry.aliases].map(name => [name.toLowerCase(), entry])
  )
);
