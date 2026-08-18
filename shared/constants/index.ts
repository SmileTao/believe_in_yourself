import type { Plan, SkillNode } from '@shared/types';

/** 应用标识 */
export const APP_NAME_ZH = '士别三日';
export const APP_NAME_EN = 'shibie';
export const APP_SLOGAN = '士别三日，刮目相看。';
export const APP_BUNDLE_ID = 'com.shibie.app';

/** 温柔文案池 */
export const GENTLE_WORDS = [
  '今天没做也没关系，明天从最小一步开始 🌱',
  '哪怕只做一题，也是往前走的一步。',
  '不必完美，只要不停下。',
  '慢慢来，比较快。',
  '今天的你，已经很努力了。'
];

/** 每日重置时间（凌晨 4:00） */
export const RESET_HOUR = 4;

/** 番茄钟默认配置 */
export const DEFAULT_POMODORO = {
  focus: 25,
  shortBreak: 5,
  longBreak: 15,
  roundsBeforeLongBreak: 4
};

/** 打卡类型枚举 */
export const CHECKIN_TYPES = ['boolean', 'numeric'] as const;

/** AI Agent 技能树定义（8 层 35 节点） */
export const SKILL_TREE: ReadonlyArray<{
  level: number;
  nodes: ReadonlyArray<{ code: string; name: string; description: string }>;
}> = [
  {
    level: 1,
    nodes: [
      { code: 'L1-1', name: 'Python 语法', description: '变量、类型、函数、类等核心语法' },
      { code: 'L1-2', name: 'pip + venv', description: '依赖管理与虚拟环境隔离' },
      { code: 'L1-3', name: 'HTTP + JSON', description: '请求/响应、状态码、JSON 解析' },
      { code: 'L1-4', name: '命令行', description: 'Shell 常用命令与脚本基础' }
    ]
  },
  {
    level: 2,
    nodes: [
      { code: 'L2-1', name: 'API 调用', description: '调用 LLM API 完成一次对话' },
      { code: 'L2-2', name: 'Token 计费', description: '理解 token、上下文与成本估算' },
      { code: 'L2-3', name: '流式输出', description: 'SSE 流式返回与逐字渲染' }
    ]
  },
  {
    level: 3,
    nodes: [
      { code: 'L3-1', name: 'Prompt 模板', description: '可复用的系统提示词模板' },
      { code: 'L3-2', name: 'Few-shot', description: '少样本示例引导输出格式' },
      { code: 'L3-3', name: 'CoT 思维链', description: '链式思考提升复杂推理' },
      { code: 'L3-4', name: 'JSON Mode', description: '结构化输出与解析' },
      { code: 'L3-5', name: '评估', description: '构建评估集量化 Prompt 效果' }
    ]
  },
  {
    level: 4,
    nodes: [
      { code: 'L4-1', name: '向量库', description: '向量存储与相似度检索' },
      { code: 'L4-2', name: 'Embedding', description: '文本向量化与维度选择' },
      { code: 'L4-3', name: '检索重排', description: '召回 + Rerank 提升相关性' },
      { code: 'L4-4', name: '幻觉控制', description: '引用溯源与置信度约束' }
    ]
  },
  {
    level: 5,
    nodes: [
      { code: 'L5-1', name: 'LangChain', description: '链式编排与组件体系' },
      { code: 'L5-2', name: 'LlamaIndex', description: '面向数据的 RAG 框架' },
      { code: 'L5-3', name: 'AutoGen | CrewAI', description: '多智能体协作框架' },
      { code: 'L5-4', name: 'Function Calling', description: '工具调用与函数路由' }
    ]
  },
  {
    level: 6,
    nodes: [
      { code: 'L6-1', name: 'MCP', description: 'Model Context Protocol 协议接入' },
      { code: 'L6-2', name: '长记忆', description: '短期/长期记忆与摘要压缩' },
      { code: 'L6-3', name: 'ReAct + Reflexion', description: '推理-行动-反思循环' },
      { code: 'L6-4', name: '可观测性', description: 'Trace、Token 监控与调试' }
    ]
  },
  {
    level: 7,
    nodes: [
      { code: 'L7-1', name: 'FastAPI', description: '构建生产级 API 服务' },
      { code: 'L7-2', name: 'Docker', description: '容器化打包与部署' },
      { code: 'L7-3', name: '部署', description: '云端部署与域名/证书' },
      { code: 'L7-4', name: '成本限流', description: '预算控制、缓存与速率限制' }
    ]
  },
  {
    level: 8,
    nodes: [
      { code: 'L8-1', name: '知识助手', description: '个人/团队知识库问答 Agent' },
      { code: 'L8-2', name: '日报 Agent', description: '自动收集与生成日报' },
      { code: 'L8-3', name: '多 Agent 协作', description: '多角色分工完成复杂任务' }
    ]
  }
];

/** 三大计划初始定义（空启动，不预填打卡记录） */
export const SEED_PLANS: ReadonlyArray<
  Pick<Plan, 'name' | 'icon' | 'goal' | 'min_action' | 'checkin_type' | 'metric_label' | 'sort_order'>
> = [
  {
    name: '英语',
    icon: 'Languages',
    goal: '多邻国每日打卡，保持连续',
    min_action: '做多邻国 1 题',
    checkin_type: 'boolean',
    metric_label: null,
    sort_order: 0
  },
  {
    name: '打字',
    icon: 'Keyboard',
    goal: 'TypingClub 提升击键速度',
    min_action: '完成 1 组打字练习',
    checkin_type: 'numeric',
    metric_label: 'WPM',
    sort_order: 1
  },
  {
    name: 'AI Agent 开发',
    icon: 'Network',
    goal: '按技能树逐节点通关 8 层 35 节点',
    min_action: '完成 1 个技能节点打卡',
    checkin_type: 'boolean',
    metric_label: null,
    sort_order: 2
  }
];
