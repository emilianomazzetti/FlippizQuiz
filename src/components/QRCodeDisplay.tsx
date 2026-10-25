import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Maximize2, X, Smartphone, Sparkles } from 'lucide-react';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
  pin?: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  size = 200,
  className = '',
  pin
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [largeDataUrl, setLargeDataUrl] = useState<string>('');
  const [isZoomOpen, setIsZoomOpen] = useState<boolean>(false);

  useEffect(() => {
    // Generate regular size
    QRCode.toDataURL(value, {
      width: size,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then((url) => setDataUrl(url))
      .catch((err) => console.error('QR code generation error:', err));

    // Generate high-resolution large size for fullscreen modal
    QRCode.toDataURL(value, {
      width: 520,
      margin: 2,
      color: {
        dark: '#090d16',
        light: '#ffffff'
      }
    })
      .then((url) => setLargeDataUrl(url))
      .catch((err) => console.error('Large QR code generation error:', err));
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center bg-white/10 rounded-xl animate-pulse text-xs text-slate-400"
      >
        Caricamento QR...
      </div>
    );
  }

  return (
    <>
      <div
        onClick={() => setIsZoomOpen(true)}
        className={`relative group p-3 bg-white rounded-2xl shadow-xl inline-block cursor-pointer transition-all duration-200 hover:scale-103 hover:shadow-2xl hover:ring-4 hover:ring-indigo-400/60 ${className}`}
        title="Clicca per ingrandire il QR code a tutto schermo per la classe"
      >
        <img
          src={dataUrl}
          alt={`QR Code per ${value}`}
          width={size}
          height={size}
          className="rounded-lg block"
        />

        {/* Hover Hint Overlay */}
        <div className="absolute inset-0 bg-slate-950/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-2 text-center pointer-events-none">
          <Maximize2 className="w-8 h-8 mb-1 text-amber-300 drop-shadow animate-pulse" />
          <span className="text-xs font-black uppercase tracking-wider text-amber-300">
            Tutto Schermo
          </span>
          <span className="text-[10px] text-slate-200 mt-0.5">
            Facilita la foto dagli smartphone
          </span>
        </div>
      </div>

      {/* Fullscreen QR Code Modal */}
      {isZoomOpen && (
        <div
          onClick={() => setIsZoomOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in cursor-pointer select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border-2 border-indigo-500/50 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl text-center space-y-6 relative cursor-default animate-scale-up"
          >
            {/* Close Button */}
            <button
              onClick={() => setIsZoomOpen(false)}
              className="absolute top-4 right-4 p-2.5 rounded-2xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              title="Chiudi visualizzazione ingrandita"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Modal Header */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-black uppercase tracking-wider border border-indigo-500/30">
                <Smartphone className="w-4 h-4" />
                Ingrandimento per la Classe
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Inquadra il QR Code
              </h2>
              <p className="text-sm text-slate-300 max-w-md mx-auto">
                Punta la fotocamera del tuo smartphone o tablet sul codice per unirti istantaneamente alla sessione!
              </p>
            </div>

            {/* Giant QR Code Container */}
            <div className="p-4 sm:p-6 bg-white rounded-3xl shadow-2xl inline-block border-4 border-amber-400">
              <img
                src={largeDataUrl || dataUrl}
                alt="QR Code Ingrandito"
                className="w-64 h-64 sm:w-80 sm:h-80 mx-auto block rounded-xl"
              />
            </div>

            {/* Room Info & Direct Link */}
            <div className="space-y-3 pt-2">
              {pin && (
                <div className="inline-block px-5 py-2 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-xs text-slate-400 font-bold block">PIN della Stanza:</span>
                  <span className="text-2xl font-black font-mono text-amber-400 tracking-wider">
                    {pin}
                  </span>
                </div>
              )}
              <div className="text-xs text-slate-400">
                Oppure naviga su: <strong className="text-indigo-400 select-all font-mono">{value}</strong>
              </div>
            </div>

            <button
              onClick={() => setIsZoomOpen(false)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-sm rounded-xl transition-colors cursor-pointer"
            >
              Tocca per tornare alla schermata
            </button>
          </div>
        </div>
      )}
    </>
  );
};
