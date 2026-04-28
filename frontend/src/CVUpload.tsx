import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  FileText,
  File,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader,
  X,
  FileIcon,
} from 'lucide-react';

interface FileUploadItem {
  id: string;
  name: string;
  fileType: 'pdf' | 'docx' | 'txt';
  status: 'pending' | 'loading' | 'success' | 'error' | 'scanned-pdf';
  progress: number;
  text?: string;
  error?: string;
}

interface CVUploadProps {
  onFilesProcessed?: (files: FileUploadItem[]) => void;
}

const getFileIcon = (fileType: string) => {
  switch (fileType) {
    case 'pdf':
      return <File className="w-4 h-4 text-red-500" />;
    case 'docx':
      return <FileText className="w-4 h-4 text-blue-500" />;
    case 'txt':
      return <FileText className="w-4 h-4 text-gray-500" />;
    default:
      return <FileIcon className="w-4 h-4 text-gray-500" />;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'success':
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    case 'error':
      return <XCircle className="w-5 h-5 text-red-500" />;
    case 'scanned-pdf':
      return <AlertCircle className="w-5 h-5 text-amber-500" />;
    case 'loading':
      return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
    default:
      return <Upload className="w-5 h-5 text-gray-400" />;
  }
};

export default function CVUpload({ onFilesProcessed }: CVUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<FileUploadItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    // Crear items para los archivos
    const newFiles: FileUploadItem[] = acceptedFiles.map((file) => ({
      id: `${file.name}-${Date.now()}`,
      name: file.name,
      fileType: getFileTypeFromName(file.name),
      status: 'pending' as const,
      progress: 0,
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);
    setIsProcessing(true);

    try {
      // Convertir archivos a base64
      const filesData = await Promise.all(
        acceptedFiles.map(
          (file) =>
            new Promise<{ name: string; data: string }>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                const base64 = (reader.result as string).split(',')[1];
                resolve({ name: file.name, data: base64 });
              };
              reader.onerror = reject;
              reader.readAsDataURL(file);
            })
        )
      );

      // Procesar archivos en el backend
      const API_BASE = import.meta.env.VITE_API_BASE ?? '';
      const response = await fetch(`${API_BASE}/api/process-cvs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: filesData }),
      });

      if (!response.ok) {
        throw new Error('Error al procesar archivos');
      }

      const result = await response.json();

      // Actualizar estados de los archivos
      setUploadedFiles((prev) =>
        prev.map((file) => {
          const processed = result.results.find(
            (r: any) => r.filename === file.name
          );
          if (processed) {
            return {
              ...file,
              status: processed.status === 'success' ? 'success' : processed.status === 'scanned-pdf' ? 'scanned-pdf' : 'error',
              text: processed.text,
              error: processed.error,
              progress: 100,
            };
          }
          return file;
        })
      );

      if (onFilesProcessed) {
        onFilesProcessed(uploadedFiles);
      }
    } catch (error) {
      // Marcar todos como error
      setUploadedFiles((prev) =>
        prev.map((file) => ({
          ...file,
          status: 'error' as const,
          error: error instanceof Error ? error.message : 'Error desconocido',
          progress: 100,
        }))
      );
    } finally {
      setIsProcessing(false);
    }
  }, [onFilesProcessed]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
        '.docx',
      ],
      'application/msword': ['.doc'],
      'text/plain': ['.txt'],
    },
    multiple: true,
  } as any);

  const stats = {
    total: uploadedFiles.length,
    success: uploadedFiles.filter((f) => f.status === 'success').length,
    scanned: uploadedFiles.filter((f) => f.status === 'scanned-pdf').length,
    errors: uploadedFiles.filter((f) => f.status === 'error').length,
    pending: uploadedFiles.filter((f) => f.status === 'pending').length,
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-slate-50 rounded-lg">
      <h2 className="text-2xl font-bold text-slate-900 mb-4">Cargar CVs</h2>

      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-slate-300 bg-white hover:border-blue-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 mx-auto mb-2 text-slate-400" />
        {isDragActive ? (
          <p className="text-blue-600 font-semibold">
            Suelta los archivos aquí...
          </p>
        ) : (
          <div>
            <p className="text-slate-900 font-semibold">
              Arrastra y suelta los CVs aquí
            </p>
            <p className="text-slate-500 text-sm">
              o haz clic para seleccionar (PDF, Word, TXT)
            </p>
          </div>
        )}
      </div>

      {/* Stats */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6 grid grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-blue-600">Total cargados</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{stats.success}</div>
            <div className="text-sm text-green-600">Procesados</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-amber-600">{stats.scanned}</div>
            <div className="text-sm text-amber-600">PDFs escaneados</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
            <div className="text-sm text-red-600">Errores</div>
          </div>
        </div>
      )}

      {/* Processing Status */}
      {isProcessing && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
          <Loader className="w-5 h-5 text-blue-600 animate-spin" />
          <span className="text-blue-600">
            Procesando {uploadedFiles.filter((f) => f.status === 'loading').length} archivo(s)...
          </span>
        </div>
      )}

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6 space-y-2">
          <h3 className="font-semibold text-slate-900">
            Archivos cargados ({uploadedFiles.length})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  file.status === 'success'
                    ? 'bg-green-50 border-green-200'
                    : file.status === 'error'
                    ? 'bg-red-50 border-red-200'
                    : file.status === 'scanned-pdf'
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex-shrink-0">
                  {getFileIcon(file.fileType)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {file.name}
                  </p>
                  {file.error && (
                    <p className="text-xs text-red-600 mt-1">{file.error}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {file.status === 'loading' && (
                    <span className="text-xs text-slate-500">Procesando...</span>
                  )}
                  {getStatusIcon(file.status)}
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-1 hover:bg-slate-200 rounded-md transition-colors"
                  >
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ready for Evaluation */}
      {stats.success > 0 && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <span className="text-green-600">
            ¡{stats.success} CV{stats.success !== 1 ? 's' : ''} listo{stats.success !== 1 ? 's' : ''} para evaluar!
          </span>
        </div>
      )}
    </div>
  );
}

function getFileTypeFromName(filename: string): 'pdf' | 'docx' | 'txt' {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return 'pdf';
    case 'docx':
    case 'doc':
      return 'docx';
    default:
      return 'txt';
  }
}
