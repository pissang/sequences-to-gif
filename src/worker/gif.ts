// @ts-ignore
import gifski from 'gifski-wasm/multi-thread';

self.onmessage = async (e) => {
  const { frames, width, height, quality, outputFps } = e.data;
  console.log('outputFps', outputFps);
  console.log('frames', frames.length);
  console.log('width', width);
  console.log('height', height);
  console.log('quality', quality);
  try {
    const gif = await gifski({
      frames,
      fps: outputFps,
      width,
      height,
      max_threads: 16,
      quality
    });

    // @ts-ignore
    self.postMessage({ gif }, [gif.buffer]);
  } catch (error) {
    self.postMessage({
      error: error instanceof Error ? error.message : String(error)
    });
  }
};
