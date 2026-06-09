'use client';

/**
 * Scanner QR via la caméra (jsQR). Décode chaque frame ; appelle `onDecode` au
 * premier QR lu. La caméra arrière (`environment`) est préférée. La vérification
 * HMAC reste 100 % backend — ce composant ne fait que lire le contenu du QR.
 */
import jsQR from 'jsqr';
import { useEffect, useRef, useState } from 'react';

interface CameraScannerProps {
  onDecode: (text: string) => void;
  onError?: (message: string) => void;
}

export function CameraScanner({ onDecode, onError }: Readonly<CameraScannerProps>) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;
    let decoded = false;

    const tick = () => {
      const v = videoRef.current;
      const c = canvasRef.current;
      if (!stopped && v && c && v.readyState === v.HAVE_ENOUGH_DATA) {
        c.width = v.videoWidth;
        c.height = v.videoHeight;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(v, 0, 0, c.width, c.height);
          const img = ctx.getImageData(0, 0, c.width, c.height);
          const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
          if (code?.data && !decoded) {
            decoded = true;
            onDecode(code.data);
            return;
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (stopped) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const v = videoRef.current;
        if (!v) return;
        v.srcObject = stream;
        await v.play();
        setReady(true);
        tick();
      } catch {
        onError?.("Accès caméra refusé ou indisponible. Utilisez la saisie manuelle.");
      }
    };

    void start();
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onDecode, onError]);

  return (
    <div className="relative overflow-hidden rounded-xl bg-black">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video ref={videoRef} className="aspect-square w-full object-cover" muted playsInline />
      <canvas ref={canvasRef} className="hidden" />
      {/* Cadre de visée */}
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="size-2/3 rounded-2xl border-2 border-brand-gold/80" />
      </div>
      {!ready && (
        <p className="absolute inset-x-0 bottom-3 text-center text-xs text-white/80">
          Initialisation de la caméra…
        </p>
      )}
    </div>
  );
}
