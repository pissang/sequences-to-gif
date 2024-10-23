// @ts-ignore
import gifski from 'gifski-wasm/multi-thread';

self.onmessage = async function (e) {
  const { frames, width, height } = e.data;

  try {
    const gif = await gifski({
      frames,
      fps: 30,
      width,
      height,
      quality: 100
    });

    self.postMessage({ gif });
  } catch (error: any) {
    self.postMessage({ error: error.message });
  }
};
