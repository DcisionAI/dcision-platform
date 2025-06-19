import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { parse as csvParse } from 'csv-parse/sync';
import { Poppler } from 'pdf-poppler';
import Tesseract from 'tesseract.js';
import { execSync } from 'child_process';

export async function extractTextFromPDF(filePath: string): Promise<string> {
  // Try pdftotext (poppler-utils) first
  try {
    const output = execSync(`pdftotext -layout "${filePath}" -`, { encoding: 'utf-8' });
    if (output && output.trim().length > 50) {
      return output;
    }
  } catch (err) {
    console.error('pdftotext error:', err);
  }
  // Fallback to pdf-parse
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    if (data.text && data.text.trim().length > 50) {
      return data.text;
    }
  } catch (err) {
    console.error('pdf-parse error:', err);
  }
  // Fallback to OCR
  try {
    const outputDir = path.join('/tmp', `pdf_ocr_${Date.now()}`);
    fs.mkdirSync(outputDir, { recursive: true });
    const poppler = new Poppler();
    await poppler.pdfToCairo(filePath, outputDir, {
      format: 'png',
      singleFile: false,
      resolution: 300,
    });
    const imageFiles = fs.readdirSync(outputDir)
      .filter(f => f.endsWith('.png'))
      .map(f => path.join(outputDir, f));
    let ocrText = '';
    for (const imgPath of imageFiles) {
      const { data: { text } } = await Tesseract.recognize(imgPath, 'eng');
      ocrText += text + '\n';
    }
    for (const imgPath of imageFiles) fs.unlinkSync(imgPath);
    fs.rmdirSync(outputDir);
    return ocrText.trim();
  } catch (err) {
    console.error('OCR fallback error:', err);
  }
  return '';
}

export async function extractTextFromDocx(filePath: string): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    console.log('Mammoth extracted text:', result.value.slice(0, 500));
    return result.value;
  } catch (err) {
    console.error('Mammoth error:', err);
    return '';
  }
}

export async function extractTextFromXlsx(filePath: string): Promise<string> {
  const workbook = XLSX.readFile(filePath);
  let text = '';
  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    text += (data as unknown[]).map((row) => Array.isArray(row) ? row.join(' ') : String(row)).join('\n') + '\n';
  });
  return text;
}

export async function extractTextFromCSV(filePath: string): Promise<string> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const records = csvParse(content, { columns: true });
  return records.map((row: any) => Object.values(row).join(' ')).join('\n');
}

export async function extractTextFromTXT(filePath: string): Promise<string> {
  return fs.readFileSync(filePath, 'utf-8');
}

export async function extractTextFromFile(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  if (!ext) {
    // Treat as plain text if no extension
    return extractTextFromTXT(filePath);
  }
  if (ext === '.pdf') return extractTextFromPDF(filePath);
  if (ext === '.docx') return extractTextFromDocx(filePath);
  if (ext === '.xlsx' || ext === '.xls') return extractTextFromXlsx(filePath);
  if (ext === '.csv') return extractTextFromCSV(filePath);
  if (ext === '.txt') return extractTextFromTXT(filePath);
  throw new Error(`Unsupported file type: ${ext}`);
}

export async function extractTextFromHTML(html: string): Promise<string> {
  // TODO: Use cheerio or similar to extract text from HTML string
  // Example: const $ = cheerio.load(html); return $('body').text();
  return '[HTML text extraction not implemented]';
}

export async function extractTextFromURL(url: string): Promise<string> {
  // TODO: Fetch the URL and extract text from the HTML
  // Example: const html = await fetch(url).then(res => res.text()); return extractTextFromHTML(html);
  return '[URL text extraction not implemented]';
} 