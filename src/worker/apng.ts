// @ts-ignore
import UPNG from 'upng-js';

self.onmessage = async (e) => {
  const { frames, width, height, quality, outputFps } = e.data;
  console.log('outputFps', outputFps);
  console.log('frames', frames.length);
  console.log('width', width);
  console.log('height', height);
  console.log('quality', quality);
  try {
    const apng = UPNG.encode(
      frames,
      width,
      height,
      quality === 100 ? 0 : Math.round((4096 * quality) / 100),
      frames.map((_: any, idx: number) => Math.round(1000 / outputFps))
    );

    // @ts-ignore
    self.postMessage({ apng }, [apng]);
  } catch (error) {
    self.postMessage({
      error: error instanceof Error ? error.message : String(error)
    });
  }
};
