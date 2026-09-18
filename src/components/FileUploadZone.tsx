import React, { useState, useRef } from "react";
import { Upload, FileUp, Sparkles, Shield, AlertCircle } from "lucide-react";
import { SAMPLE_DOCS, createSamplePdfFile } from "../services/sampleDocs";

interface Props {
  acceptedExtensions: string[];
  maxFiles?: number;
  maxSizeBytes?: number; // default 50MB
  onFilesSelected: (files: File[]) => void;
  existingFileNames?: string[];
  title?: string;
  subtitle?: string;
  allowSampleLoader?: boolean;
}

export const FileUploadZone: React.FC<Props> = ({
  acceptedExtensions,
  maxFiles = 10,
  maxSizeBytes = 50 * 1024 * 1024, // 50MB
  onFilesSelected,
  existingFileNames = [],
  title = "Drop your files here",
  subtitle = "or Browse Files",
  allowSampleLoader = true,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingSample, setLoadingSample] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndProcessFiles = (rawFiles: FileList | File[]) => {
    setErrorMessage(null);
    const filesArray = Array.from(rawFiles);

    if (filesArray.length === 0) return;

    if (maxFiles === 1 && filesArray.length > 1) {
      setErrorMessage("This tool accepts a single file at a time. Please select 1 file.");
      return;
    }

    if (filesArray.length > maxFiles) {
      setErrorMessage(`Maximum ${maxFiles} files allowed at once.`);
      return;
    }

    const validFiles: File[] = [];

    for (const file of filesArray) {
      // 1. Size check
      if (file.size > maxSizeBytes) {
        setErrorMessage(`"${file.name}" exceeds the allowed size limit of ${(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB.`);
        return;
      }

      // 2. Extension check
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      const isExtAccepted = acceptedExtensions.some(
        (acc) => acc.toLowerCase() === ext || acc.toLowerCase() === "*/*"
      );

      if (!isExtAccepted && acceptedExtensions.length > 0) {
        setErrorMessage(
          `Unsupported file type for "${file.name}". Allowed types: ${acceptedExtensions.join(", ")}`
        );
        return;
      }

      // 3. Duplicate check
      if (existingFileNames.includes(file.name)) {
        setErrorMessage(`"${file.name}" is already in the upload queue.`);
        return;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      validateAndProcessFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleLoadSample = async (sampleId: string) => {
    try {
      setLoadingSample(true);
      setErrorMessage(null);
      const sampleFile = await createSamplePdfFile(sampleId);
      onFilesSelected([sampleFile]);
    } catch (err: any) {
      setErrorMessage("Failed to generate sample PDF: " + err.message);
    } finally {
      setLoadingSample(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Drag & Drop Card */}
      <div
        id="file-dropzone-container"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group cursor-pointer border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all ${
          isDragOver
            ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 dark:border-indigo-400 scale-[1.01]"
            : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:border-indigo-500 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 shadow-sm"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={maxFiles > 1}
          accept={acceptedExtensions.join(",")}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              validateAndProcessFiles(e.target.files);
            }
          }}
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-100 to-purple-100 dark:from-indigo-950 dark:to-purple-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform shadow-inner">
            <Upload className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">
              {title}
            </h3>
            <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-1">
              <FileUp className="w-4 h-4 inline" /> {subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              Supported formats:
            </span>
            {acceptedExtensions.map((ext) => (
              <span
                key={ext}
                className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/70"
              >
                {ext.replace(".", "")}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 pt-2">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>Your files are processed securely & deleted automatically</span>
          </div>
        </div>
      </div>

      {/* Error message if validation failed */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center gap-3 text-rose-700 dark:text-rose-300 text-sm animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Quick Test with Sample Document (Demo Helper) */}
      {allowSampleLoader && (
        <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-indigo-950 dark:text-indigo-200">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="font-semibold">Don't have a document handy?</span>
            <span className="text-slate-500 dark:text-slate-400">
              Load a verified sample to test right now:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {SAMPLE_DOCS.map((sample) => (
              <button
                key={sample.id}
                type="button"
                disabled={loadingSample}
                onClick={(e) => {
                  e.stopPropagation();
                  handleLoadSample(sample.id);
                }}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200/60 dark:border-indigo-800/60 shadow-xs transition-colors disabled:opacity-50"
              >
                {loadingSample ? "Loading..." : sample.category}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
