<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from 'vue';
import type { VideoSource, WatchEntry, SourceKind } from './types';
import { loadSources, saveSources, loadHistory, saveHistory } from './store';
import { resolvePlaybackAdapter, listPlaybackAdapters } from './adapters/registry';
import { probeMediaUrl } from './services/mediaProbe';
import { createBackup, parseBackup } from './services/backup';

const sources = ref<VideoSource[]>(loadSources());
const history = ref<WatchEntry[]>(loadHistory());
const tab = ref<'home' | 'favorites' | 'history' | 'settings'>('home');
const query = ref('');
const name = ref('');
const url = ref('');
const kind = ref<SourceKind>('website');
const category = ref('视频');
const playerUrl = ref('');
const playerTitle = ref('');
const subtitleUrl = ref('');
const video = ref<HTMLVideoElement | null>(null);
const notice = ref('欢迎使用 Video Hub。添加你有权访问的网站或媒体地址即可开始。');
const health = ref<Record<string, string>>({});
const activeAdapter = ref('');
const backupInput = ref<HTMLInputElement | null>(null);
let disposePlayback: (() => void) | null = null;

const visible = computed(() => {
  const list = tab.value === 'favorites' ? sources.value.filter((item) => item.favorite) : sources.value;
  const q = query.value.trim().toLowerCase();
  return list.filter((item) => !q || [item.name, item.url, item.category].some((v) => v.toLowerCase().includes(q)));
});

function validUrl(raw: string): string | null {
  try {
    const parsed = new URL(raw.trim());
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function add() {
  const safe = validUrl(url.value);
  if (!name.value.trim() || !safe) {
    notice.value = '请填写名称和有效的 HTTP/HTTPS 地址。';
    return;
  }
  if (sources.value.some((item) => item.url === safe)) {
    notice.value = '该地址已经存在。';
    return;
  }
  sources.value.unshift({
    id: crypto.randomUUID(),
    name: name.value.trim(),
    url: safe,
    kind: kind.value,
    category: category.value || '其他',
    authorized: true,
    favorite: false,
    createdAt: Date.now(),
  });
  saveSources(sources.value);
  name.value = '';
  url.value = '';
  notice.value = '来源已添加。请确认你拥有访问内容及接口的合法授权。';
}

function remove(id: string) {
  sources.value = sources.value.filter((item) => item.id !== id);
  saveSources(sources.value);
}

function favorite(source: VideoSource) {
  source.favorite = !source.favorite;
  saveSources(sources.value);
}

function open(source: VideoSource) {
  if (source.kind === 'media') play(source.url, source.name);
  else window.open(source.url, '_blank', 'noopener,noreferrer');
}

async function check(source: VideoSource) {
  health.value[source.id] = '检测中…';
  const result = await probeMediaUrl(source.url);
  health.value[source.id] = result.message;
}

function attach() {
  if (!video.value || !playerUrl.value) return;
  disposePlayback?.();
  const adapter = resolvePlaybackAdapter(playerUrl.value);
  activeAdapter.value = adapter.label;
  disposePlayback = adapter.mount(video.value, playerUrl.value, (message) => {
    notice.value = message;
  });
}

function play(raw: string, title = '媒体播放') {
  const safe = validUrl(raw);
  if (!safe) {
    notice.value = '播放地址无效，仅支持 HTTP/HTTPS。';
    return;
  }
  playerUrl.value = safe;
  playerTitle.value = title;
  history.value = [{
    id: crypto.randomUUID(),
    title,
    url: safe,
    watchedAt: Date.now(),
  }, ...history.value.filter((item) => item.url !== safe)].slice(0, 100);
  saveHistory(history.value);
  notice.value = '媒体地址已载入。若无法播放，请检查格式、CORS 和内容访问权限。';
  void nextTick(attach);
}

function retry() {
  void nextTick(attach);
}

function clear() {
  history.value = [];
  saveHistory(history.value);
}

function exportData() {
  const blob = new Blob([createBackup(sources.value, history.value)], { type: 'application/json' });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = `video-hub-backup-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
  notice.value = '备份文件已生成。请妥善保管，其中包含你的来源地址和播放历史。';
}

function importData(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = parseBackup(String(reader.result ?? ''));
      if (!window.confirm(`将导入 ${imported.sources.length} 个来源和 ${imported.history.length} 条历史记录，并替换当前数据。继续吗？`)) return;
      sources.value = imported.sources;
      history.value = imported.history;
      saveSources(sources.value);
      saveHistory(history.value);
      notice.value = '备份导入成功。';
    } catch (error) {
      notice.value = error instanceof Error ? error.message : '备份导入失败';
    } finally {
      input.value = '';
    }
  };
  reader.onerror = () => { notice.value = '无法读取备份文件。'; input.value = ''; };
  reader.readAsText(file);
}

onBeforeUnmount(() => disposePlayback?.());
</script>

<template>
  <div class="shell">
    <aside class="side">
      <div class="brand"><b>▶</b><div><strong>VIDEO HUB</strong><small>个人视频中心</small></div></div>
      <nav>
        <button :class="{ on: tab === 'home' }" @click="tab = 'home'">⌂　发现</button>
        <button :class="{ on: tab === 'favorites' }" @click="tab = 'favorites'">☆　我的收藏</button>
        <button :class="{ on: tab === 'history' }" @click="tab = 'history'">◷　播放历史</button>
        <button :class="{ on: tab === 'settings' }" @click="tab = 'settings'">⚙　来源管理</button>
      </nav>
      <small class="local">● 本地数据已启用</small>
    </aside>

    <main>
      <header>
        <div><small class="eyebrow">YOUR MEDIA SPACE</small><h1>{{ ({ home: '发现内容', favorites: '我的收藏', history: '播放历史', settings: '来源管理' } as const)[tab] }}</h1></div>
        <input v-model="query" class="search" placeholder="搜索来源、分类或网址">
      </header>

      <section v-if="tab === 'home' || tab === 'favorites'">
        <div class="hero">
          <div><small class="eyebrow">ONE PLACE, YOUR CONTENT</small><h2>把常用视频入口<br><em>收纳在一起。</em></h2><p>管理你有权访问的网站与媒体，使用统一播放器播放直接媒体链接。</p></div>
          <span class="orb">▶</span>
        </div>
        <div class="section"><div><h3>{{ tab === 'favorites' ? '收藏来源' : '常用入口' }}</h3><small>{{ visible.length }} 个来源</small></div><button class="link" @click="tab = 'settings'">＋ 添加来源</button></div>
        <div class="grid">
          <article v-for="source in visible" :key="source.id" class="card">
            <div class="cardtop"><span class="icon">{{ source.kind === 'media' ? '♫' : source.name.slice(0, 1) }}</span><button class="star" :class="{ chosen: source.favorite }" @click="favorite(source)">★</button></div>
            <h4>{{ source.name }}</h4><small>{{ source.category }} · {{ source.kind === 'media' ? '媒体地址' : '网站入口' }}</small>
            <div class="actions"><button class="primary mini" @click="open(source)">{{ source.kind === 'media' ? '立即播放' : '打开网站' }} ↗</button><button class="ghost" @click="check(source)">检测</button></div>
            <small v-if="health[source.id]" class="health">{{ health[source.id] }}</small>
          </article>
          <div v-if="!visible.length" class="empty">没有匹配来源，请到来源管理添加。</div>
        </div>
      </section>

      <section v-else-if="tab === 'history'">
        <div class="section"><div><h3>最近播放</h3><small>记录保存在当前设备</small></div><button class="link" @click="clear">清空历史</button></div>
        <div class="list">
          <article v-for="entry in history" :key="entry.id" class="row">
            <span class="icon">▶</span><div class="rowtext"><b>{{ entry.title }}</b><small>{{ entry.url }}</small><small>{{ new Date(entry.watchedAt).toLocaleString() }}</small></div>
            <button class="primary mini" @click="play(entry.url, entry.title)">继续播放</button>
          </article>
          <div v-if="!history.length" class="empty">暂无播放记录。</div>
        </div>
      </section>

      <section v-else class="settings">
        <div class="panel">
          <h3>添加视频来源</h3><small>网站入口或可直接播放的媒体 URL</small>
          <form @submit.prevent="add">
            <label>来源名称<input v-model="name" required maxlength="60" placeholder="例如：我的媒体库"></label>
            <label>访问地址<input v-model="url" required type="url" placeholder="https://example.com 或媒体 URL"></label>
            <div class="twocol">
              <label>类型<select v-model="kind"><option value="website">网站入口</option><option value="media">直接媒体</option></select></label>
              <label>分类<input v-model="category" maxlength="30"></label>
            </div>
            <p class="hint">仅添加你有权访问和分发的内容。本项目不提供付费墙绕过、DRM 破解或未授权解析功能。</p>
            <button class="primary">＋ 保存来源</button>
          </form>
        </div>
        <div class="panel">
          <h3>已配置来源 <small>· {{ sources.length }} 个</small></h3>
          <div class="list">
            <div v-for="source in sources" :key="source.id" class="managed"><div><b>{{ source.name }}</b><small>{{ source.url }}</small></div><button class="danger" @click="remove(source.id)">删除</button></div>
            <div v-if="!sources.length" class="empty">尚未添加来源。</div>
          </div>
        </div>
        <div class="panel backup-panel">
          <h3>数据备份与迁移</h3><small>导出来源和播放历史，或从 JSON 备份恢复。</small>
          <div class="actions"><button class="primary mini" @click="exportData">导出备份</button><button class="ghost" @click="backupInput?.click()">导入备份</button><input ref="backupInput" class="hidden-input" type="file" accept="application/json,.json" @change="importData"></div>
          <p class="hint">导入会替换当前设备上的来源和历史记录。备份文件可能包含私人媒体地址，请勿公开分享。</p>
        </div>
      </section>

      <section class="player">
        <div class="section"><div><small class="eyebrow">PLAYER</small><h3>{{ playerTitle || '统一媒体播放器' }}</h3></div><small>{{ activeAdapter || 'HTML5 · HLS' }}</small></div>
        <video v-if="playerUrl" ref="video" controls playsinline>
          <track v-if="subtitleUrl" kind="subtitles" :src="subtitleUrl" srclang="zh" label="字幕" default>
        </video>
        <div v-else class="placeholder"><b>▶</b><strong>播放你有权访问的媒体</strong><small>支持浏览器原生格式及 HLS（.m3u8）</small></div>
        <div class="playform"><input v-model="playerUrl" type="url" placeholder="粘贴直接媒体地址（MP4 / WebM / M3U8）"><button class="primary" @click="play(playerUrl, playerTitle || '媒体播放')">载入播放</button><button class="ghost" :disabled="!playerUrl" @click="retry">重新加载</button></div>
        <div class="playform subtitle-form"><input v-model="subtitleUrl" type="url" placeholder="可选：WebVTT 字幕地址（.vtt）"><small>字幕地址须可由浏览器访问</small></div>
      </section>

      <footer>{{ notice }}<span>Video Hub · 0.2.0</span></footer>
    </main>
  </div>
</template>