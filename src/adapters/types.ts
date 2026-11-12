export interface PlaybackAdapter {
  readonly id: string;
  readonly label: string;
  canHandle(url: string): boolean;
  mount(video: HTMLVideoElement, url: string, onFatalError: (message: string) => void): () => void;
}
