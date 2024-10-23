// @ts-ignore
import gifski from 'gifski-wasm/multi-thread';

self.onmessage = async (e) => {
  const { frames, gifWidth, gifHeight, quality, sequenceFps, gifFps } = e.data;

  try {
    const gif = await gifski({
      frames,
      fps: gifFps,
      width: gifWidth,
      height: gifHeight,
      max_threads: 16,
      quality
    });

    self.postMessage({ gif });
  } catch (error) {
    self.postMessage({
      error: error instanceof Error ? error.message : String(error)
    });
  }
};
