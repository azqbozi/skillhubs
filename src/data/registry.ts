/**
 * Skill 注册表数据
 * 与 src-tauri/assets/registry.json 结构一致
 */
export interface RegistrySkill {
  id: string;
  name: string;
  repo: string;
  subPath?: string;
  description: string;
  category: string;
  tags: string[];
  platforms: ('claude' | 'cursor')[];
  stars: number;
  install_mode: 'sparse' | 'full';
  author: string;
}

export const registrySkills: RegistrySkill[] = [
  {
    id: 'react-performance-expert',
    name: 'React Performance Expert',
    repo: 'vercel-labs/agent-skills',
    subPath: 'skills/react-best-practices',
    description: 'React性能优化专家，帮助优化React应用的性能和用户体验',
    category: '前端开发',
    tags: ['react', 'nextjs', 'performance'],
    platforms: ['claude', 'cursor'],
    stars: 2100,
    install_mode: 'sparse',
    author: 'vercel-labs',
  },
  {
    id: 'python-data-analysis',
    name: 'Python Data Analysis',
    repo: 'huggingface/agent-skills',
    subPath: 'data-science',
    description: 'Python数据分析专家，擅长pandas、numpy、matplotlib等数据处理和可视化工具',
    category: '数据科学',
    tags: ['python', 'pandas', 'data-analysis'],
    platforms: ['claude', 'cursor'],
    stars: 1800,
    install_mode: 'sparse',
    author: 'huggingface',
  },
  {
    id: 'go-microservices',
    name: 'Go Microservices',
    repo: 'docker/agent-skills',
    subPath: 'microservices-go',
    description: 'Go语言微服务架构专家，专注于云原生应用设计和容器化部署',
    category: '后端开发',
    tags: ['go', 'microservices', 'docker'],
    platforms: ['claude', 'cursor'],
    stars: 1500,
    install_mode: 'sparse',
    author: 'docker',
  },
  {
    id: 'rust-system-programming',
    name: 'Rust System Programming',
    repo: 'rust-lang/agent-skills',
    subPath: 'system-programming',
    description: 'Rust系统编程专家，高性能、安全的底层系统开发',
    category: '系统开发',
    tags: ['rust', 'systems', 'performance'],
    platforms: ['claude', 'cursor'],
    stars: 2300,
    install_mode: 'sparse',
    author: 'rust-lang',
  },
  {
    id: 'docker-devops',
    name: 'Docker DevOps',
    repo: 'docker/agent-skills',
    subPath: 'containerization',
    description: 'Docker和DevOps专家，自动化部署和容器编排',
    category: '运维开发',
    tags: ['docker', 'kubernetes', 'devops'],
    platforms: ['claude', 'cursor'],
    stars: 1950,
    install_mode: 'sparse',
    author: 'docker',
  },
];
