export interface MediaProbeResult {
  ok: boolean;
  status?: number;
  contentType?: string;
  message: string;
}

export async function probeMediaUrl(url: string, timeoutMs = 7000): Promise<MediaProbeResult> {
  const parsed = new URL(url);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { ok: false, message: '只允许 HTTP/HTTPS 地址' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let response: Response;
    try {
      response = await fetch(url, { method: 'HEAD', mode: 'cors', signal: controller.signal });
    } catch (error) {
      if (controller.signal.aborted) throw error;
      response = await fetch(url, {
        method: 'GET',
        headers: { Range: 'bytes=0-0' },
        mode: 'cors',
        signal: controller.signal,
      });
    }
    if (response.status === 405 || response.status === 501) {
      response = await fetch(url, {
        method: 'GET',
        headers: { Range: 'bytes=0-0' },
        mode: 'cors',
        signal: controller.signal,
      });
    }
    const contentType = response.headers.get('content-type') ?? undefined;
    const ok = response.ok || response.status === 206;
    const result: MediaProbeResult = {
      ok,
      status: response.status,
      contentType,
      message: ok
        ? `可访问 · HTTP ${response.status}${contentType ? ` · ${contentType}` : ''}`
        : `服务端返回 HTTP ${response.status}`,
    };
    await response.body?.cancel();
    return result;
  } catch (error) {
    const message = error instanceof Error && error.name === 'AbortError'
      ? '检测超时'
      : '浏览器无法读取响应（可能是 CORS、网络或服务端限制）';
    return { ok: false, message };
  } finally {
    clearTimeout(timeout);
  }
}
