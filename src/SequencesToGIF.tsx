'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Github, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { logEvent } from './utils/analytics';

interface FileWithPreview extends File {
  preview: string;
}

export default function SequencesToGif() {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [converting, setConverting] = useState(false);
  // const [gifBlob, setGifBlob] = useState<Blob | null>(null);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const workerRef = useRef<Worker | null>(null);
  const filesSorted = useMemo(() => {
    return [...files].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true })
    );
  }, [files]);
  const [gifWidth, setGifWidth] = useState(500);
  const [gifHeight, setGifHeight] = useState(500);
  const [quality, setQuality] = useState(100);
  const [gifSize, setGifSize] = useState<string | null>(null);
  const [originalWidth, setOriginalWidth] = useState(0);
  const [originalHeight, setOriginalHeight] = useState(0);
  const [sequenceFps, setSequenceFps] = useState(30);
  const [gifFps, setGifFps] = useState(20);

  const frameDownsample = useMemo(() => {
    return Math.max(1, Math.round(sequenceFps / gifFps));
  }, [sequenceFps, gifFps]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(
      acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file)
        })
      )
    );

    // Set GIF dimensions based on the first image
    if (acceptedFiles.length > 0) {
      const img = new Image();
      img.onload = () => {
        setOriginalWidth(img.width);
        setOriginalHeight(img.height);
        setGifWidth(img.width);
        setGifHeight(img.height);
      };
      img.src = URL.createObjectURL(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': []
    }
  });

  useEffect(() => {
    return () => files.forEach((file) => URL.revokeObjectURL(file.preview));
  }, [files]);

  function loadImage(file: FileWithPreview) {
    return new Promise<HTMLImageElement>((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve(img);
      };
      img.src = file.preview;
    });
  }

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('./convertWorker', import.meta.url),
      { type: 'module' }
    );
    workerRef.current.onmessage = (e) => {
      if (e.data.gif) {
        const blob = new Blob([e.data.gif], { type: 'image/gif' });
        const url = URL.createObjectURL(blob);
        setGifUrl(url);
        setConverting(false);
        setProgress(100);

        // Calculate and set the file size
        const sizeMB = (blob.size / (1024 * 1024)).toFixed(2);
        setGifSize(`${sizeMB} MB`);
      } else if (e.data.error) {
        console.error('Conversion error:', e.data.error);
        setConverting(false);
      }
    };

    return () => workerRef.current?.terminate();
  }, []);

  async function handleConvert() {
    logEvent('Conversion', 'Started GIF conversion');
    setConverting(true);
    setProgress(0);
    const frames: ImageData[] = [];
    const canvas = document.createElement('canvas');
    canvas.width = gifWidth;
    canvas.height = gifHeight;
    const ctx = canvas.getContext('2d')!;

    let idx = 0;
    const transferables: Transferable[] = [];

    for (let i = 0; i < filesSorted.length; i += frameDownsample) {
      const file = filesSorted[i];
      const img = await loadImage(file);
      ctx.clearRect(0, 0, gifWidth, gifHeight);
      ctx.drawImage(img, 0, 0, gifWidth, gifHeight);
      const imageData = ctx.getImageData(0, 0, gifWidth, gifHeight);
      transferables.push(imageData.data.buffer);
      frames.push(imageData);
      setProgress(
        Math.round((idx++ / (filesSorted.length / frameDownsample)) * 90)
      ); // Leave 10% for actual conversion
    }

    workerRef.current?.postMessage(
      { frames, gifWidth, gifHeight, quality, sequenceFps, gifFps },
      transferables
    );
  }

  function downloadGif() {
    logEvent('Download', 'Downloaded GIF');
    if (gifUrl) {
      const a = document.createElement('a');
      a.href = gifUrl;
      a.download = 'output.gif';
      a.click();
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">
          Image Sequences to GIF
        </h1>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 mb-6 text-center cursor-pointer transition-colors
            ${
              isDragActive
                ? 'border-primary bg-primary/10'
                : 'border-muted-foreground'
            }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          {isDragActive ? (
            <p className="text-lg">Drop the files here ...</p>
          ) : (
            <p className="text-lg">
              Drop image sequences, or click to select images
            </p>
          )}
        </div>

        {filesSorted.length > 0 && (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Uploaded files:</h2>
              <ScrollArea className="h-[300px] rounded-md border">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 p-4">
                  {filesSorted.map((file) => (
                    <div key={file.name} className="text-center">
                      <div className="aspect-square w-full mb-2 overflow-hidden rounded-lg">
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-sm truncate">{file.name}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center space-x-2">
                <Label htmlFor="gifWidth" className="w-32">
                  GIF Size:
                </Label>
                <Input
                  id="gifWidth"
                  type="number"
                  value={gifWidth}
                  onChange={(e) =>
                    setGifWidth(Math.min(Number(e.target.value), originalWidth))
                  }
                  className="w-24"
                  min={100}
                  max={originalWidth}
                />
                <span className="text-sm text-muted-foreground">×</span>
                <Input
                  id="gifHeight"
                  type="number"
                  value={gifHeight}
                  onChange={(e) =>
                    setGifHeight(
                      Math.min(Number(e.target.value), originalHeight)
                    )
                  }
                  className="w-24"
                  min={100}
                  max={originalHeight}
                />
                <span className="text-sm text-muted-foreground">px</span>
              </div>

              <div className="flex items-center space-x-2">
                <Label htmlFor="sequenceFps" className="w-32">
                  FPS:
                </Label>
                <Input
                  id="sequenceFps"
                  type="number"
                  value={sequenceFps}
                  onChange={(e) =>
                    setSequenceFps(
                      Math.min(Math.max(Number(e.target.value), 1), 60)
                    )
                  }
                  className="w-24"
                  min={1}
                  max={60}
                />
                <span className="text-sm text-muted-foreground">→</span>
                <Input
                  id="gifFps"
                  type="number"
                  value={gifFps}
                  onChange={(e) =>
                    setGifFps(Math.min(Math.max(Number(e.target.value), 1), 50))
                  }
                  className="w-24"
                  min={1}
                  max={sequenceFps}
                />
                <span className="text-sm text-muted-foreground">
                  frames/sec
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <Label htmlFor="quality" className="w-32">
                  Quality:
                </Label>
                <Slider
                  id="quality"
                  min={1}
                  max={100}
                  step={1}
                  value={[quality]}
                  onValueChange={(value) => setQuality(value[0])}
                  className="w-64"
                />
                <span className="w-12 text-sm text-muted-foreground">
                  {quality}
                </span>
              </div>
            </div>
          </>
        )}

        <Button
          onClick={handleConvert}
          className="w-full py-2 text-lg mb-6"
          disabled={files.length === 0 || converting}
        >
          {converting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Converting
              {/* Converting... {progress}% */}
            </>
          ) : (
            'Convert'
          )}
        </Button>

        {gifUrl && (
          <div className="mt-6 text-center">
            <h2 className="text-lg font-semibold mb-2">Generated GIF:</h2>
            <img
              src={gifUrl}
              alt="Generated GIF"
              className="mx-auto max-w-full h-auto"
            />
            {gifSize && (
              <p className="mt-2 text-sm text-muted-foreground">
                File size: {gifSize}
              </p>
            )}
            <Button onClick={downloadGif} className="mt-4">
              Download GIF
            </Button>
          </div>
        )}
      </main>

      <footer className="bg-muted py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <a
              href="https://github.com/pissang/sequences-to-gif"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center hover:text-primary"
            >
              <Github className="mr-2 h-5 w-5" />
              GitHub
            </a>
            <a
              href="https://github.com/jamsinclair/gifski-wasm"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary text-sm opacity-50"
            >
              Powered by gifski-wasm
            </a>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              Other Products:
            </span>
            <a
              href="https://www.figma.com/community/plugin/1264600219316901594/vector-to-3d"
              className="hover:text-primary"
            >
              Vector to 3D
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
