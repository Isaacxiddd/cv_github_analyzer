// pdf.js is loaded via the extension's manifest as a web-accessible resource.
// It runs in the popup context (not service worker) because it needs DOM APIs.

declare const pdfjsLib: {
  getDocument: (src: { data: ArrayBuffer }) => { promise: Promise<PDFDocumentProxy> };
  GlobalWorkerOptions: { workerSrc: string };
};

interface PDFDocumentProxy {
  numPages: number;
  getPage: (n: number) => Promise<PDFPageProxy>;
}

interface PDFPageProxy {
  getTextContent: () => Promise<{ items: Array<{ str: string }> }>;
}

export async function parsePDF(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('pdf.worker.min.js');
  const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(' ');
    pages.push(pageText);
  }

  return pages.join('\n');
}

export function validatePDF(file: File): { valid: boolean; error?: string } {
  if (!file.type.includes('pdf') && !file.name.endsWith('.pdf')) {
    return { valid: false, error: 'File must be a PDF' };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: 'PDF must be smaller than 10 MB' };
  }
  return { valid: true };
}
