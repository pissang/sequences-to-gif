'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Github, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
// @ts-ignore
import gifski from 'gifski-wasm';

interface FileWithPreview extends File {
  preview: string;
}

export default function SequencesToGif() {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [converting, setConverting] = useState(false);
  const [gifBlob, setGifBlob] = useState<Blob | null>(null);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  // const [progress, setProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(
      acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file)
        })
      )
    );
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

  async function handleConvert() {
    setConverting(true);
    // setProgress(0);
    const frames: ImageData[] = [];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    let width = 0;
    let height = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const img = await loadImage(file);
      if (!width) {
        width = img.width;
        height = img.height;
        canvas.width = width;
        canvas.height = height;
      }
      ctx.drawImage(img, 0, 0);
      frames.push(ctx.getImageData(0, 0, width, height));
      // setProgress(Math.round(((i + 1) / files.length) * 100));
    }
    const gif = await gifski({
      frames,
      fps: 30,
      width,
      height,
      quality: 100
    });
    setConverting(false);
    // setProgress(0);
    const blob = new Blob([gif], { type: 'image/gif' });
    const url = URL.createObjectURL(blob);
    setGifBlob(blob);
    setGifUrl(url);
  }

  function downloadGif() {
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
          Sequences to GIF
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
              Drag 'n' drop some files here, or click to select files
            </p>
          )}
        </div>

        {files.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Uploaded Files:</h2>
            <ScrollArea className="h-[300px] rounded-md border">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
                {files.map((file) => (
                  <div key={file.name} className="text-center">
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="w-full h-32 object-cover rounded-lg mb-2"
                    />
                    <p className="text-sm truncate">{file.name}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <Button
          onClick={handleConvert}
          className="w-full py-2 text-lg mb-6"
          disabled={files.length === 0 || converting}
        >
          {converting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
            <Button onClick={downloadGif} className="mt-4">
              Download GIF
            </Button>
          </div>
        )}
      </main>

      <footer className="bg-muted py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center hover:text-primary"
          >
            <Github className="mr-2 h-5 w-5" />
            GitHub
          </a>
          <div>
            <a href="#" className="hover:text-primary mr-4">
              Vector to 3D
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
