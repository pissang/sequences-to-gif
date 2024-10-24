/**
 * Image sequences to animated GIF/WebP/APNG
 */
'use client';

import { useState, useCallback, useEffect, useRef, useMemo, FC } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Github, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { logEvent } from './utils/analytics';

export interface FileWithPreview extends File {
  preview: string;
}

export interface EncodeOpts {
  files: FileWithPreview[];
  width: number;
  height: number;
  quality: number;
  outputFps: number;
}

const SequencesToAnimated: FC<{
  title: string;
  format: 'gif' | 'webp' | 'png';
  startEncode: (opts: EncodeOpts) => void;
  converting: boolean;
  encodedBlob: Blob | null;
}> = ({ title, format, startEncode, converting, encodedBlob }) => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);

  // Revoke the object URL when the blob is updated
  useEffect(() => {
    let url: string | null = null;
    if (encodedBlob) {
      setOutputSize(encodedBlob.size / 1024 / 1024);
      url = URL.createObjectURL(encodedBlob);
      setOutputUrl(url);
    }
    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [encodedBlob]);

  const filesSorted = useMemo(() => {
    return [...files].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true })
    );
  }, [files]);
  const [outputWidth, setOutputWidth] = useState(500);
  const [outputHeight, setOutputHeight] = useState(500);
  const [quality, setQuality] = useState(100);
  const [outputSize, setOutputSize] = useState<number>(0);
  const [originalWidth, setOriginalWidth] = useState(0);
  const [originalHeight, setOriginalHeight] = useState(0);
  const [sequenceFps, setSequenceFps] = useState(30);
  const [outputFps, setOutputFps] = useState(30);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    files.forEach((file) => URL.revokeObjectURL(file.preview));
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
        setOutputWidth(img.width);
        setOutputHeight(img.height);
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

  function downloadOutput() {
    logEvent('Download', 'Downloaded GIF');
    if (outputUrl) {
      const a = document.createElement('a');
      a.href = outputUrl;
      a.download = `output.${format}`;
      a.click();
    }
  }

  function handleDelete(currentFile: FileWithPreview) {
    URL.revokeObjectURL(currentFile.preview);
    setFiles(files.filter((item) => item.name !== currentFile.name));
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">{title}</h1>

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
                    <div key={file.name} className="relative text-center group">
                      <Trash2
                        onClick={() => {
                          handleDelete(file);
                        }}
                        className="hidden group-hover:block h-4 w-4 absolute right-2 top-2 cursor-pointer text-white opacity-0 group-hover:opacity-50"
                      />
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
                  value={outputWidth}
                  onChange={(e) =>
                    setOutputWidth(
                      Math.min(Number(e.target.value), originalWidth)
                    )
                  }
                  className="w-24"
                  min={100}
                  max={originalWidth}
                />
                <span className="text-sm text-muted-foreground">×</span>
                <Input
                  id="gifHeight"
                  type="number"
                  value={outputHeight}
                  onChange={(e) =>
                    setOutputHeight(
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
                  value={outputFps}
                  onChange={(e) =>
                    setOutputFps(
                      Math.min(Math.max(Number(e.target.value), 1), 50)
                    )
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
          onClick={() => {
            logEvent('Conversion', 'Started conversion');

            const downsampleRatio = Math.max(1, sequenceFps / outputFps);
            const filesDownsampled = [];
            for (let i = 0; i < filesSorted.length; i += downsampleRatio) {
              filesDownsampled.push(filesSorted[Math.ceil(i)]);
            }

            startEncode({
              files: filesDownsampled,
              width: outputWidth,
              height: outputHeight,
              quality,
              outputFps
            });
          }}
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

        {outputUrl && (
          <div className="mt-6 text-center">
            <h2 className="text-lg font-semibold mb-2">Generated:</h2>
            <img
              src={outputUrl}
              alt="Generated"
              className="mx-auto max-w-full h-auto"
            />
            {outputSize && (
              <p className="mt-2 text-sm text-muted-foreground">
                File size: {outputSize.toFixed(2)} MB
              </p>
            )}
            <Button onClick={downloadOutput} className="mt-4">
              Download
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default SequencesToAnimated;
