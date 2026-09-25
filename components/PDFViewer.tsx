import React, { useState, useEffect } from "react";
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Maximize,
  Minimize,
  Download,
  Printer,
  X,
  FileText,
} from "lucide-react";

interface Props {
  fileOrBlob: File | Blob | null;
  fileName?: string;
  onClose?: () => void;
  initialPage?: number;
}

export const PDFViewer: React.FC<Props> = ({
  fileOrBlob,
  fileName = "Document.pdf",
  onClose,
  initialPage = 1,
}) => {
  const [objectUrl, setObjectUrl] = useState<string>("");
  const [scale, setScale] = useState<number>(100);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    if (fileOrBlob) {
      const url = URL.createObjectURL(fileOrBlob);
      setObjectUrl(url);
      // Rough page estimate if unknown
      if ("size" in fileOrBlob) {
        setTotalPages(Math.max(1, Math.min(10, Math.ceil(fileOrBlob.size / (1024 * 45)))));
      }
      return () => URL.revokeObjectURL(url);
    }
  }, [fileOrBlob]);

  const handlePrint = () => {
    if (objectUrl) {
      const printWindow = window.open(objectUrl);
      printWindow?.print();
    }
  };

  const handleDownload = () => {
    if (!objectUrl) return;
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const toggleFullscreen = () => {
    const elem = document.getElementById("pdf-viewer-modal-container");
    if (!elem) return;
    if (!isFullscreen) {
      elem.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  if (!fileOrBlob) return null;

  return (
    <div
      id="pdf-viewer-modal-container"
      className="fixed inset-0 z-50 flex flex-col bg-slate-900/90 backdrop-blur-md animate-in fade-in"
    >
      {/* Top Toolbar */}
      <div className="h-14 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold truncate max-w-[200px] sm:max-w-md">{fileName}</h3>
            <span className="text-[11px] text-slate-400">
              Page {currentPage} of {totalPages}
            </span>
          </div>
        </div>

        {/* Center Controls: Zoom, Rotate */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setScale((s) => Math.max(50, s - 15))}
            className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-medium px-1.5 text-slate-200">{scale}%</span>
          <button
            onClick={() => setScale((s) => Math.min(200, s + 15))}
            className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="h-4 w-[1px] bg-slate-700 mx-1"></div>

          <button
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
            title="Rotate 90° Clockwise"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
            title="Print Document"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download</span>
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white hidden sm:block"
            title="Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg ml-1"
              title="Close Viewer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center bg-slate-950/60">
        <div
          className="transition-all duration-150 flex items-center justify-center max-w-full"
          style={{
            transform: `scale(${scale / 100}) rotate(${rotation}deg)`,
            transformOrigin: "center center",
          }}
        >
          {objectUrl ? (
            <iframe
              src={`${objectUrl}#toolbar=0&navpanes=0`}
              title="PDF Preview"
              className="w-[800px] h-[950px] max-w-[90vw] max-h-[80vh] rounded-lg shadow-2xl bg-white border border-slate-700"
            />
          ) : (
            <div className="w-[600px] h-[800px] bg-white rounded-lg shadow-xl flex items-center justify-center text-slate-400">
              Loading document preview...
            </div>
          )}
        </div>
      </div>

      {/* Bottom Paging Footer */}
      <div className="h-12 bg-slate-900 border-t border-slate-800 px-4 flex items-center justify-center gap-4 text-white text-xs">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage <= 1}
          className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-medium">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-30"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
