import React, { useState, useRef, useEffect } from "react";
import { Pen, Type, Upload, RotateCcw, Check, X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSignature: (signatureDataUrl: string) => void;
}

export const SignatureModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirmSignature,
}) => {
  const [tab, setTab] = useState<"draw" | "type" | "upload">("draw");
  const [typedName, setTypedName] = useState("John Doe");
  const [selectedFont, setSelectedFont] = useState<"cursive" | "serif" | "brush">("cursive");
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen && tab === "draw") {
      clearCanvas();
    }
  }, [isOpen, tab]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    ctx.strokeStyle = "#1e1b4b"; // deep indigo ink
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleSave = () => {
    if (tab === "draw") {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dataUrl = canvas.toDataURL("image/png");
      onConfirmSignature(dataUrl);
    } else if (tab === "type") {
      // Render typed text into offscreen canvas
      const offscreen = document.createElement("canvas");
      offscreen.width = 400;
      offscreen.height = 160;
      const ctx = offscreen.getContext("2d");
      if (ctx) {
        ctx.font = selectedFont === "cursive" ? "italic 44px 'Brush Script MT', cursive, sans-serif" : "italic 40px 'Times New Roman', serif";
        ctx.fillStyle = "#1e1b4b";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(typedName || "Signature", 200, 80);
        onConfirmSignature(offscreen.toDataURL("image/png"));
      }
    }
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onConfirmSignature(event.target.result as string);
          onClose();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Create Digital Signature
          </h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selector */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
          <button
            onClick={() => setTab("draw")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              tab === "draw" ? "bg-white dark:bg-slate-700 shadow-xs text-indigo-600 dark:text-indigo-300" : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <Pen className="w-3.5 h-3.5" /> Draw
          </button>
          <button
            onClick={() => setTab("type")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              tab === "type" ? "bg-white dark:bg-slate-700 shadow-xs text-indigo-600 dark:text-indigo-300" : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <Type className="w-3.5 h-3.5" /> Type
          </button>
          <button
            onClick={() => setTab("upload")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              tab === "upload" ? "bg-white dark:bg-slate-700 shadow-xs text-indigo-600 dark:text-indigo-300" : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> Upload Image
          </button>
        </div>

        {/* Draw Tab */}
        {tab === "draw" && (
          <div className="space-y-3">
            <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-950/50 overflow-hidden">
              <canvas
                ref={canvasRef}
                width={460}
                height={180}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-44 cursor-crosshair touch-none"
              />
              {!hasDrawn && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-400 text-xs font-medium">
                  Draw your signature here with finger or mouse
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={clearCanvas}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                <RotateCcw className="w-3 h-3" /> Clear canvas
              </button>
            </div>
          </div>
        )}

        {/* Type Tab */}
        {tab === "type" && (
          <div className="space-y-4">
            <input
              type="text"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder="Type your full name"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500"
            />
            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-6 bg-slate-50 dark:bg-slate-950/40 text-center min-h-[120px] flex items-center justify-center">
              <span
                className="text-4xl text-indigo-950 dark:text-indigo-200"
                style={{
                  fontFamily: selectedFont === "cursive" ? "cursive, 'Brush Script MT', sans-serif" : "serif",
                  fontStyle: "italic",
                }}
              >
                {typedName || "Signature Preview"}
              </span>
            </div>
          </div>
        )}

        {/* Upload Tab */}
        {tab === "upload" && (
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center bg-slate-50 dark:bg-slate-950/40">
            <input
              type="file"
              accept="image/png, image/jpeg"
              onChange={handleFileUpload}
              className="hidden"
              id="signature-file-input"
            />
            <label
              htmlFor="signature-file-input"
              className="cursor-pointer flex flex-col items-center justify-center gap-2"
            >
              <Upload className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                Upload PNG or JPG signature
              </span>
              <span className="text-xs text-slate-400">Transparent PNG recommended</span>
            </label>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          {tab !== "upload" && (
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20"
            >
              <Check className="w-4 h-4" /> Apply Signature
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
