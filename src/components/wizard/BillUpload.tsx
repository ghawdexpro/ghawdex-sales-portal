'use client';

import { useState, useCallback, useRef } from 'react';
import { useWizard } from './WizardContext';

interface BillUploadProps {
  onUploadComplete?: (url: string) => void;
}

export default function BillUpload({ onUploadComplete }: BillUploadProps) {
  const { state, dispatch } = useWizard();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisSuccess, setAnalysisSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: File[]) => {
    setError(null);
    setIsUploading(true);
    setAnalysisSuccess(false);

    try {
      const uploadedUrls: string[] = [];

      // Upload files
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload/bill', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `Failed to upload ${file.name}`);
        }

        uploadedUrls.push(data.url);
      }

      // Update state with all URLs (comma-separated if multiple)
      const allUrls = [...uploadedFiles, ...uploadedUrls];
      dispatch({
        type: 'SET_BILL_FILE',
        payload: { billFileUrl: allUrls.join(',') },
      });
      setUploadedFiles(allUrls);
      setIsUploading(false);

      // Trigger bill analysis for auto-fill
      setIsAnalyzing(true);
      try {
        const analysisResponse = await fetch('/api/analyze-bill', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ billFileUrls: allUrls }),
        });

        if (analysisResponse.ok) {
          const analysis = await analysisResponse.json();
          if (analysis.success) {
            // Store analysis in wizard state
            dispatch({
              type: 'SET_BILL_ANALYSIS',
              payload: {
                name: analysis.name || undefined,
                locality: analysis.locality || undefined,
                meterNumber: analysis.meterNumber || undefined,
                armsAccount: analysis.armsAccount || undefined,
                consumptionKwh: analysis.consumptionKwh || undefined,
                rawAnalysis: analysis.rawAnalysis || undefined,
              },
            });

            // Show success if we extracted useful data
            if (analysis.name || analysis.meterNumber || analysis.armsAccount) {
              setAnalysisSuccess(true);
            }
          }
        }
      } catch (analysisError) {
        // Soft fail - don't block user, bill is still uploaded
        console.error('Bill analysis failed:', analysisError);
      }
      setIsAnalyzing(false);

      onUploadComplete?.(allUrls.join(','));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  }, [dispatch, onUploadComplete, uploadedFiles]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const handleRemove = () => {
    dispatch({
      type: 'SET_BILL_FILE',
      payload: { billFileUrl: null },
    });
    // Also clear bill analysis when removing file
    dispatch({
      type: 'SET_BILL_ANALYSIS',
      payload: {},
    });
    setUploadedFiles([]);
    setError(null);
    setAnalysisSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // If already uploaded - show success state
  const fileCount = state.billFileUrl ? state.billFileUrl.split(',').length : 0;
  const hasAnalysis = state.billAnalysis?.name || state.billAnalysis?.meterNumber;

  if (state.billFileUrl) {
    return (
      <div className={`border rounded-xl p-4 ${
        hasAnalysis
          ? 'bg-green-500/10 border-green-500/30'
          : 'bg-amber-500/10 border-amber-500/30'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              hasAnalysis ? 'bg-green-500/20' : 'bg-amber-500/20'
            }`}>
              <svg className={`w-5 h-5 ${hasAnalysis ? 'text-green-400' : 'text-amber-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <div className="text-white font-medium text-sm">
                {hasAnalysis
                  ? 'We found your details!'
                  : fileCount === 1 ? 'Bill uploaded' : `${fileCount} files uploaded`
                }
              </div>
              <div className={`text-xs ${hasAnalysis ? 'text-green-400' : 'text-amber-400'}`}>
                {hasAnalysis
                  ? `${state.billAnalysis?.name ? 'Name' : ''}${state.billAnalysis?.name && state.billAnalysis?.meterNumber ? ' & ' : ''}${state.billAnalysis?.meterNumber ? 'Meter' : ''} detected`
                  : 'Bill will be analyzed after submission'
                }
              </div>
            </div>
          </div>
          <button
            onClick={handleRemove}
            className="text-gray-400 hover:text-white transition-colors p-2"
            title="Remove files"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      {/* Header with optional badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          <span className="text-sm text-gray-300">Upload your electricity bill</span>
        </div>
        <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
          Optional
        </span>
      </div>

      {/* Drop zone */}
      <div
        onClick={!isUploading && !isAnalyzing ? handleClick : undefined}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-lg p-4 text-center transition-all
          ${isDragging
            ? 'border-amber-500 bg-amber-500/10'
            : 'border-white/20 hover:border-white/40 hover:bg-white/5'
          }
          ${isUploading || isAnalyzing ? 'pointer-events-none opacity-60' : 'cursor-pointer'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          multiple
          onChange={handleInputChange}
          className="hidden"
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <svg className="animate-spin w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm text-gray-400">Uploading...</span>
          </div>
        ) : isAnalyzing ? (
          <div className="flex flex-col items-center gap-2">
            <svg className="animate-spin w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm text-green-400">Analyzing your bill...</span>
            <span className="text-xs text-gray-500">This helps auto-fill your details</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <div>
              <span className="text-sm text-gray-300">Drop file or </span>
              <span className="text-sm text-amber-400">browse</span>
            </div>
            <span className="text-xs text-gray-500">JPG, PNG, or PDF (max 100MB)</span>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-2 text-red-400 text-xs flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Helper text */}
      <div className="mt-3 flex items-start gap-2 text-xs text-gray-500">
        <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>
          Upload your bill to auto-fill your details and verify consumption for a more accurate quote.
        </span>
      </div>
    </div>
  );
}
