import { useEffect, useRef, useState } from 'react';
import SequencesToAnimated, {
  EncodeOpts,
  FileWithPreview
} from './SequencesToAnimated';

const SequencesToWebP = () => {
  const [webpBlob, setWebpBlob] = useState<Blob | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    workerRef.current = new Worker(new URL('./worker/webp', import.meta.url), {
      type: 'module'
    });
    workerRef.current.onmessage = (e) => {
      if (e.data.webp) {
        const blob = new Blob([new Uint8Array(e.data.webp)], {
          type: 'image/webp'
        });
        setWebpBlob(blob);
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
    const frames: ArrayBuffer[] = [];
    const canvas = document.createElement('canvas');
    canvas.width = opts.width;
    canvas.height = opts.height;
    const ctx = canvas.getContext('2d')!;

    const transferables: Transferable[] = [];
    setConverting(true);

    for (let file of opts.files) {
      const img = await loadImage(file);
      ctx.clearRect(0, 0, opts.width, opts.height);
      ctx.drawImage(img, 0, 0, opts.width, opts.height);
      const ab = await new Promise<ArrayBuffer>((resolve) => {
        canvas.toBlob(
          (blob) => {
            blob?.arrayBuffer().then(resolve);
          },
          'image/webp',
          1
        );
      });
      frames.push(ab);
      transferables.push(ab);
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
      title="Image Sequences to WebP"
      startEncode={startEncode}
      encodedBlob={webpBlob}
      converting={converting}
    />
  );
};

export default SequencesToWebP;
