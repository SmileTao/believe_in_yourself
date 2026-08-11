import type { Database as DB } from 'better-sqlite3';
import type {
  PlanRepository,
  CheckinRepository,
  FrogRepository,
  PomodoroRepository,
  JournalRepository,
  SkillRepository,
  AchievementRepository,
  SettingRepository
} from '@shared/contracts';
import { planRepository } from './plans';
import { checkinRepository } from './checkins';
import { frogRepository } from './frogs';
import { pomodoroRepository } from './pomodoro';
import { journalRepository } from './journal';
import { skillRepository } from './skills';
import { achievementRepository } from './achievement';
import { settingRepository } from './setting';
import { SKILL_TREE, SEED_PLANS } from '@shared/constants';
import { uuid } from './base';

export const repos = {
  plan: planRepository,
  checkin: checkinRepository,
  frog: frogRepository,
  pomodoro: pomodoroRepository,
  journal: journalRepository,
  skill: skillRepository,
  achievement: achievementRepository,
  setting: settingRepository
};

/** 成就勋章定义 */
const ACHIEVEMENT_DEFS = [
  { code: 'streak_7', title: '一周不熄', description: '连续打卡 7 天' },
  { code: 'streak_30', title: '月升不息', description: '连续打卡 30 天' },
  { code: 'streak_100', title: '百日筑基', description: '连续打卡 100 天' },
  { code: 'hours_100', title: '百时淬炼', description: '累计专注 100 小时' },
  { code: 'skill_half', title: '过半之径', description: 'AI Agent 技能树完成过半' },
  { code: 'first_heart', title: '初心', description: '种下第一颗改变的种子' }
];

/**
 * 种子数据：三大计划 + AI Agent 全 8 层 35 节点 + 成就勋章。
 * 打卡记录为空（空启动，不预填历史）。幂等：已存在则跳过。
 */
export function seedAll(db: DB): { plans: number; skills: number; achievements: number } {
  const result = { plans: 0, skills: 0, achievements: 0 };

  // 计划
  const planCount = (db.prepare(`SELECT COUNT(*) AS c FROM plans WHERE deleted_at IS NULL`).get() as {
    c: number;
  }).c;
  if (planCount === 0) {
    const insertPlan = db.prepare(
      `INSERT INTO plans (id, name, icon, goal, min_action, checkin_type, metric_label, sort_order)
       VALUES (@id, @name, @icon, @goal, @min_action, @checkin_type, @metric_label, @sort_order)`
    );
    for (const p of SEED_PLANS) {
      insertPlan.run({ id: uuid(), ...p });
      result.plans += 1;
    }
  }

  // 技能树
  const skillCount = (db.prepare(`SELECT COUNT(*) AS c FROM skill_nodes`).get() as { c: number }).c;
  if (skillCount === 0) {
    const insertSkill = db.prepare(
      `INSERT OR IGNORE INTO skill_nodes
       (id, level, code, name, description, parent_code, status, est_hours, sort_order)
       VALUES (@id, @level, @code, @name, @description, @parentCode, @status, @estHours, @sortOrder)`
    );
    // 计算每层前一个节点作为 parent（形成层内链）
    for (const layer of SKILL_TREE) {
      const nodes = [...layer.nodes];
      nodes.forEach((node, idx) => {
        insertSkill.run({
          id: uuid(),
          level: layer.level,
          code: node.code,
          name: node.name,
          description: node.description,
          parentCode: idx === 0 ? null : nodes[idx - 1].code,
          status: layer.level === 1 ? 'available' : 'locked',
          estHours: layer.level <= 3 ? 4 : layer.level <= 6 ? 8 : 12,
          sortOrder: idx
        });
        result.skills += 1;
      });
    }
  }

  // 成就
  const achCount = (db.prepare(`SELECT COUNT(*) AS c FROM achievements`).get() as { c: number }).c;
  if (achCount === 0) {
    const insertAch = db.prepare(
      `INSERT OR IGNORE INTO achievements (id, code, title, description) VALUES (@id, @code, @title, @description)`
    );
    for (const a of ACHIEVEMENT_DEFS) {
      insertAch.run({ id: uuid(), ...a });
      result.achievements += 1;
    }
  }

  return result;
}
