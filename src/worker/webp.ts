import './windowShim';
// @ts-ignore
import WebP from 'node-webpmux';

self.onmessage = async (e) => {
  const { frames, width, height, quality, outputFps } = e.data;
  console.log('outputFps', outputFps);
  console.log('frames', frames.length);
  console.log('width', width);
  console.log('height', height);
  console.log('quality', quality);
  try {
    // await WebP.Image.initLib();
    const img = await WebP.Image.getEmptyImage();
    img.convertToAnim();
    for (const [i, frame] of frames.entries()) {
      const webpFrame = await WebP.Image.generateFrame({
        buffer: new Uint8Array(frame),
        delay: 1000 / outputFps
      });
      await img.setFrameData(i, webpFrame, {
        width,
        height,
        quality,
        lossless: quality === 100
      });
    }
    const buffer = await img.save(null);

    // @ts-ignore
    self.postMessage({ webp: buffer }, [buffer]);
  } catch (error) {
    self.postMessage({
      error: error instanceof Error ? error.message : String(error)
    });
  }
};
