import Hls from 'hls.js';
import type { PlaybackAdapter } from './types';

const hlsAdapter: PlaybackAdapter = {
  id: 'hls',
  label: 'HLS',
  canHandle: (url) => /\.m3u8(?:$|[?#])/i.test(url) && Hls.isSupported(),
  mount(video, url, onFatalError) {
    const hls = new Hls({ enableWorker: true, capLevelToPlayerSize: true });
    hls.loadSource(url);
    hls.attachMedia(video);
    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (data.fatal) onFatalError(`HLS 播放错误：${data.type} / ${data.details}`);
    });
    return () => { hls.destroy(); };
  },
};

const nativeAdapter: PlaybackAdapter = {
  id: 'native',
  label: 'HTML5 原生',
  canHandle: () => true,
  mount(video, url, onFatalError) {
    const onError = () => onFatalError('浏览器无法解码该媒体。请检查格式、地址、跨域策略及访问权限。');
    video.addEventListener('error', onError);
    video.src = url;
    video.load();
    return () => {
      video.removeEventListener('error', onError);
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  },
};

const adapters: PlaybackAdapter[] = [hlsAdapter, nativeAdapter];
export function resolvePlaybackAdapter(url: string): PlaybackAdapter {
  return adapters.find((adapter) => adapter.canHandle(url)) ?? nativeAdapter;
}
export function listPlaybackAdapters() {
  return adapters.map(({ id, label }) => ({ id, label }));
}
