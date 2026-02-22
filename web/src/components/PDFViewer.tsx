"use client";

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from "@/components/ui/button";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set worker source for pdf.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFViewerProps {
  url: string;
}

export default function PDFViewer({ url }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  return (
    <div className="flex flex-col items-center w-full h-full overflow-hidden">
      <div className="flex gap-4 mb-4 z-10 bg-background/80 p-2 rounded-lg backdrop-blur-sm sticky top-0">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
          disabled={pageNumber <= 1}
        >
          Previous
        </Button>
        <span className="flex items-center text-sm">
          Page {pageNumber} of {numPages}
        </span>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages))}
          disabled={pageNumber >= numPages}
        >
          Next
        </Button>
        <div className="border-l mx-2 h-6"></div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setScale(prev => Math.max(prev - 0.1, 0.5))}
        >
          -
        </Button>
        <span className="flex items-center text-sm">{Math.round(scale * 100)}%</span>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setScale(prev => Math.min(prev + 0.1, 2.0))}
        >
          +
        </Button>
      </div>

      <div className="flex-grow overflow-auto w-full flex justify-center bg-muted/20 p-4">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          className="shadow-lg"
          loading={
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          }
          error={
            <div className="text-red-500 p-4 border border-red-200 rounded bg-red-50">
              Failed to load PDF. Please check the file URL.
            </div>
          }
        >
          <Page 
            pageNumber={pageNumber} 
            scale={scale}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="bg-white"
          />
        </Document>
      </div>
    </div>
  );
}
