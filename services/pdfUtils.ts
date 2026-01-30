import * as pdfjsModule from 'pdfjs-dist';

// Robustly handle the default export or named export based on the environment
const pdfjs = (pdfjsModule as any).default || pdfjsModule;

// Explicitly set the worker source. 
// Switching to cdnjs for the worker as it often provides a more stable classic script build for the worker 
// compared to esm.sh which might serve ESM that fails in standard Worker context without specific config.
if (pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

export const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Add a timeout promise to race against the PDF load
    const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error("PDF load timed out. The file might be corrupted or too large.")), 20000)
    );

    // Ensure the document loading task handles potential errors
    const loadingTask = pdfjs.getDocument({ 
        data: arrayBuffer,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/', // Use reliable CDN for cmaps
        cMapPacked: true,
    });

    // Race the loading against the timeout
    const pdf = await Promise.race([loadingTask.promise, timeoutPromise]);
    
    let fullText = '';
    const numPages = pdf.numPages;
    
    // Iterate through all pages
    for (let i = 1; i <= numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Improve text joining: add spaces between items, but handle newlines if possible
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        fullText += `--- Page ${i} ---\n${pageText}\n\n`;
      } catch (pageError) {
        console.warn(`Error extracting text from page ${i}:`, pageError);
        fullText += `--- Page ${i} (Extraction Failed) ---\n\n`;
      }
    }
    
    if (!fullText.trim()) {
       throw new Error("No text content could be extracted from this PDF.");
    }

    return fullText;
  } catch (error: any) {
    console.error('Error extracting text from PDF:', error);
    // Provide a more user-friendly error message
    throw new Error(`Failed to parse PDF: ${error.message || 'Unknown error'}`);
  }
};