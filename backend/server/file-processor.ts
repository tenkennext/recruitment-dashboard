import * as fs from 'fs';
import * as path from 'path';
import * as mammoth from 'mammoth';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

export interface FileProcessingResult {
  filename: string;
  fileType: 'pdf' | 'docx' | 'txt';
  status: 'success' | 'error' | 'scanned-pdf';
  text?: string;
  error?: string;
}

export interface PDFAnalysisResult {
  hasText: boolean;
  textLength: number;
  pageCount: number;
  isScanned: boolean;
}

/**
 * Analiza un PDF para detectar si contiene texto legible o solo imágenes escaneadas
 */
async function analyzePDF(filePath: string): Promise<PDFAnalysisResult> {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);

    const pageCount = data.numpages || data.numPages || 0;
    const text = data.text || '';
    const textLength = text.trim().length;

    // Si el PDF tiene menos del 10% de una página de texto por página en promedio,
    // es probable que sea solo imágenes escaneadas
    const avgTextPerPage = textLength / Math.max(pageCount, 1);
    const isScanned = avgTextPerPage < 50; // Menos de 50 caracteres promedio por página

    return {
      hasText: textLength > 0,
      textLength,
      pageCount,
      isScanned,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Procesa un PDF y extrae su texto
 */
async function processPDF(filePath: string): Promise<FileProcessingResult> {
  try {
    const analysis = await analyzePDF(filePath);

    if (analysis.isScanned) {
      return {
        filename: path.basename(filePath),
        fileType: 'pdf',
        status: 'scanned-pdf',
        error: 'El PDF parece contener solo imágenes escaneadas. Por favor, solicita una versión digital del CV con texto extraíble.',
      };
    }

    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);

    return {
      filename: path.basename(filePath),
      fileType: 'pdf',
      status: 'success',
      text: data.text || '',
    };
  } catch (error) {
    return {
      filename: path.basename(filePath),
      fileType: 'pdf',
      status: 'error',
      error: `Error al procesar PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`,
    };
  }
}

/**
 * Procesa un archivo Word (.docx) y extrae su texto
 */
async function processDocX(filePath: string): Promise<FileProcessingResult> {
  try {
    const arrayBuffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ arrayBuffer });

    return {
      filename: path.basename(filePath),
      fileType: 'docx',
      status: 'success',
      text: result.value || '',
    };
  } catch (error) {
    return {
      filename: path.basename(filePath),
      fileType: 'docx',
      status: 'error',
      error: `Error al procesar Word: ${error instanceof Error ? error.message : 'Error desconocido'}`,
    };
  }
}

/**
 * Procesa un archivo de texto (.txt)
 */
async function processTXT(filePath: string): Promise<FileProcessingResult> {
  try {
    const text = fs.readFileSync(filePath, 'utf-8');

    return {
      filename: path.basename(filePath),
      fileType: 'txt',
      status: 'success',
      text,
    };
  } catch (error) {
    return {
      filename: path.basename(filePath),
      fileType: 'txt',
      status: 'error',
      error: `Error al procesar TXT: ${error instanceof Error ? error.message : 'Error desconocido'}`,
    };
  }
}

/**
 * Detecta el tipo de archivo por extensión
 */
function getFileType(filename: string): 'pdf' | 'docx' | 'txt' | null {
  const ext = path.extname(filename).toLowerCase();

  switch (ext) {
    case '.pdf':
      return 'pdf';
    case '.docx':
    case '.doc':
      return 'docx';
    case '.txt':
      return 'txt';
    default:
      return null;
  }
}

/**
 * Procesa un archivo según su tipo
 */
export async function processFile(filePath: string): Promise<FileProcessingResult> {
  const fileType = getFileType(filePath);

  if (!fileType) {
    return {
      filename: path.basename(filePath),
      fileType: 'txt' as const,
      status: 'error',
      error: 'Tipo de archivo no soportado. Solo se aceptan PDF, Word (.docx) y TXT.',
    };
  }

  switch (fileType) {
    case 'pdf':
      return processPDF(filePath);
    case 'docx':
      return processDocX(filePath);
    case 'txt':
      return processTXT(filePath);
    default:
      return {
        filename: path.basename(filePath),
        fileType: 'txt',
        status: 'error',
        error: 'Tipo de archivo no soportado',
      };
  }
}
