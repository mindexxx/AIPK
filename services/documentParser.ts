import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { extractTextFromPDF } from './pdfUtils';

export const extractTextFromFile = async (file: File): Promise<string> => {
  const extension = file.name.split('.').pop()?.toLowerCase();

  try {
    switch (extension) {
      case 'pdf':
        return await extractTextFromPDF(file);
      case 'xlsx':
      case 'xls':
      case 'csv':
        return await extractTextFromExcel(file);
      case 'docx':
        return await extractTextFromWord(file);
      case 'txt':
      case 'md':
      case 'json':
      case 'xml':
        return await extractTextFromText(file);
      default:
        throw new Error(`Unsupported file extension: .${extension}. Please use PDF, Excel, Word, or Text files.`);
    }
  } catch (error: any) {
    console.error(`Failed to parse ${extension} file:`, error);
    throw new Error(`File parsing error: ${error.message || 'Unknown error'}`);
  }
};

const extractTextFromExcel = async (file: File): Promise<string> => {
  const data = await file.arrayBuffer();
  // Read the workbook
  const workbook = XLSX.read(data, { type: 'array' });
  
  let fullText = '';
  
  // Iterate through sheets
  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    // Convert to CSV for structure preservation which helps AI understand tables
    const csvData = XLSX.utils.sheet_to_csv(sheet);
    if (csvData.trim()) {
        fullText += `--- Sheet: ${sheetName} ---\n`;
        fullText += csvData;
        fullText += '\n\n';
    }
  });

  if (!fullText.trim()) {
      throw new Error("No readable text found in Excel file.");
  }
  return fullText;
};

const extractTextFromWord = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  // Mammoth extracts raw text from docx
  const result = await mammoth.extractRawText({ arrayBuffer });
  
  if (result.messages && result.messages.length > 0) {
      console.warn("Mammoth messages:", result.messages);
  }
  
  if (!result.value.trim()) {
       throw new Error("No readable text found in Word document.");
  }

  return result.value;
};

const extractTextFromText = async (file: File): Promise<string> => {
  return await file.text();
};
