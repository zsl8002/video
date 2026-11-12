import type { VideoSource, WatchEntry } from '../types';

export interface VideoHubBackup {
  schemaVersion: 1;
  exportedAt: string;
  sources: VideoSource[];
  history: WatchEntry[];
}

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function createBackup(sources: VideoSource[], history: WatchEntry[]): string {
  const payload: VideoHubBackup = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    sources,
    history,
  };
  return JSON.stringify(payload, null, 2);
}

export function parseBackup(raw: string): Pick<VideoHubBackup, 'sources' | 'history'> {
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== 'object') throw new Error('备份文件格式无效');
  const data = value as Record<string, unknown>;
  if (data.schemaVersion !== 1 || !Array.isArray(data.sources) || !Array.isArray(data.history)) {
    throw new Error('不支持的备份版本或缺少必要字段');
  }

  const sources = data.sources.filter((item): item is VideoSource => {
    if (!item || typeof item !== 'object') return false;
    const source = item as Record<string, unknown>;
    return typeof source.id === 'string'
      && typeof source.name === 'string'
      && isHttpUrl(source.url)
      && (source.kind === 'website' || source.kind === 'media')
      && typeof source.category === 'string';
  }).map((source) => ({
    ...source,
    authorized: true,
    favorite: Boolean(source.favorite),
    createdAt: Number(source.createdAt) || Date.now(),
  }));

  const history = data.history.filter((item): item is WatchEntry => {
    if (!item || typeof item !== 'object') return false;
    const entry = item as Record<string, unknown>;
    return typeof entry.id === 'string'
      && typeof entry.title === 'string'
      && isHttpUrl(entry.url)
      && Number.isFinite(Number(entry.watchedAt));
  });

  if (sources.length !== data.sources.length || history.length !== data.history.length) {
    throw new Error('备份包含无效记录，已拒绝导入以避免部分数据丢失');
  }
  return { sources, history };
}
