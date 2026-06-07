import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

export async function parsePDF(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('pdf.worker.min.js');
  const doc = await getDocument({ data: buffer }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => 'str' in item ? item.str : '').join(' ');
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
