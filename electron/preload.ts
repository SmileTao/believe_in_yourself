import { contextBridge, ipcRenderer } from 'electron';
import type { ShibieApi } from '@shared/contracts';

/**
 * preload 通信层：通过 contextBridge 暴露 window.api。
 * 禁止 nodeIntegration，渲染层只依赖接口契约 ShibieApi。
 */
const api: ShibieApi = {
  dbInfo: () => ipcRenderer.invoke('db:info'),
  ping: () => ipcRenderer.invoke('app:ping'),
  notify: (title, body) => ipcRenderer.invoke('notify', title, body),
  setFullScreen: (on) => ipcRenderer.invoke('win:setFullScreen', on),
  exportData: () => ipcRenderer.invoke('data:export'),
  importData: () => ipcRenderer.invoke('data:import'),
  selectAttachment: (opts) => ipcRenderer.invoke('attachment:select', opts),
  getAttachmentUrl: (relPath) => ipcRenderer.invoke('attachment:getUrl', relPath),

  plan: {
    list: () => ipcRenderer.invoke('plan:list'),
    create: (input) => ipcRenderer.invoke('plan:create', input),
    update: (id, patch) => ipcRenderer.invoke('plan:update', id, patch),
    remove: (id) => ipcRenderer.invoke('plan:remove', id)
  },

  checkin: {
    getByPlanAndDay: (planId, dayKey) => ipcRenderer.invoke('checkin:get', planId, dayKey),
    getByPlan: (planId) => ipcRenderer.invoke('checkin:getByPlan', planId),
    check: (input) => ipcRenderer.invoke('checkin:check', input),
    uncheck: (planId, dayKey) => ipcRenderer.invoke('checkin:uncheck', planId, dayKey),
    getStreak: (planId) => ipcRenderer.invoke('checkin:streak', planId),
    getHeatmap: (year) => ipcRenderer.invoke('checkin:heatmap', year),
    getCompletionRate: (planId, range) => ipcRenderer.invoke('checkin:rate', planId, range),
    getWpmSeries: (planId, days) => ipcRenderer.invoke('checkin:wpm', planId, days)
  },

  skill: {
    list: () => ipcRenderer.invoke('skill:list'),
    updateStatus: (code, status, note) => ipcRenderer.invoke('skill:updateStatus', code, status, note),
    update: (code, patch) => ipcRenderer.invoke('skill:update', code, patch)
  },

  frog: {
    listByDay: (dayKey) => ipcRenderer.invoke('frog:list', dayKey),
    create: (input) => ipcRenderer.invoke('frog:create', input),
    toggle: (id, done) => ipcRenderer.invoke('frog:toggle', id, done),
    remove: (id) => ipcRenderer.invoke('frog:remove', id)
  },

  pomodoro: {
    start: (input) => ipcRenderer.invoke('pomodoro:start', input),
    finish: (id, durationMinutes) => ipcRenderer.invoke('pomodoro:finish', id, durationMinutes),
    getFocusCountByDay: (dayKey: string) => ipcRenderer.invoke('pomodoro:focusCount', dayKey)
  },

  journal: {
    getByDay: (dayKey) => ipcRenderer.invoke('journal:get', dayKey),
    getRecent: (limit) => ipcRenderer.invoke('journal:getRecent', limit),
    upsert: (input) => ipcRenderer.invoke('journal:upsert', input)
  },

  setting: {
    get: (key, fallback) => ipcRenderer.invoke('setting:get', key, fallback),
    set: (key, value) => ipcRenderer.invoke('setting:set', key, value),
    getAll: () => ipcRenderer.invoke('setting:all')
  },

  achievement: {
    list: () => ipcRenderer.invoke('achievement:list'),
    unlock: (code) => ipcRenderer.invoke('achievement:unlock', code)
  }
};

contextBridge.exposeInMainWorld('api', api);
