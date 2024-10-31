import { useEffect, useRef, useState } from 'react';
import SequencesToAnimated, {
  EncodeOpts,
  FileWithPreview
} from './SequencesToAnimated';

const SequencesToGIF = () => {
  const [gifBlob, setGifBlob] = useState<Blob | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    workerRef.current = new Worker(new URL('./worker/gif', import.meta.url), {
      type: 'module'
    });
    workerRef.current.onmessage = (e) => {
      if (e.data.gif) {
        const blob = new Blob([e.data.gif], { type: 'image/gif' });
        setGifBlob(blob);
      } else if (e.data.error) {
        console.error('Conversion error:', e.data.error);
      }

      setConverting(false);
    };

    return () => workerRef.current?.terminate();
  }, []);

  function loadImage(file: FileWithPreview) {
    return new Promise<HTMLImageElement>((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve(img);
      };
      img.src = file.preview;
    });
  }
  async function startEncode(opts: EncodeOpts) {
    const frames: ImageData[] = [];
    const canvas = document.createElement('canvas');
    canvas.width = opts.width;
    canvas.height = opts.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

    const transferables: Transferable[] = [];
    setConverting(true);

    for (let file of opts.files) {
      const img = await loadImage(file);
      ctx.clearRect(0, 0, opts.width, opts.height);
      ctx.drawImage(img, 0, 0, opts.width, opts.height);
      const imageData = ctx.getImageData(0, 0, opts.width, opts.height);
      transferables.push(imageData.data.buffer);
      frames.push(imageData);
    }

    workerRef.current?.postMessage(
      {
        frames,
        width: opts.width,
        height: opts.height,
        quality: opts.quality,
        outputFps: opts.outputFps
      },
      transferables
    );
  }

  return (
    <SequencesToAnimated
      title="Image Sequences to GIF"
      startEncode={startEncode}
      encodedBlob={gifBlob}
      converting={converting}
      format="gif"
    />
  );
};

export default SequencesToGIF;
