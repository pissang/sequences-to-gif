import { Github } from 'lucide-react';

export default function Footer() {
  return (
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
          <span className="text-sm text-muted-foreground">Other Products:</span>
          <a
            href="https://www.figma.com/community/plugin/1264600219316901594/vector-to-3d"
            className="hover:text-primary"
          >
            Vector to 3D
          </a>
        </div>
      </div>
    </footer>
  );
}
