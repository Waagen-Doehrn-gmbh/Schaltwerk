"use client";

import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Printer, Download } from "lucide-react";
import { useRef } from "react";

interface QRCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projektId: string;
  projektName: string;
  standort?: string;
  schaltschrankNummer?: string;
}

export function QRCodeDialog({
  open,
  onOpenChange,
  projektId,
  projektName,
  standort,
  schaltschrankNummer,
}: QRCodeDialogProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  
  // Kombiniere Name und Standort für die Anzeige
  const projektDisplayName = standort ? `${projektName} ${standort}` : projektName;

  // Erstelle die URL für das Projekt (verwende Schaltschranknummer falls vorhanden)
  const projektIdentifier = schaltschrankNummer || projektId;
  const projektUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/projekte/${projektIdentifier}`
    : `http://localhost:3000/projekte/${projektIdentifier}`;

  const handlePrint = () => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      URL.revokeObjectURL(svgUrl);
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR-Code - ${projektDisplayName}</title>
          <style>
            @page {
              margin: 20mm;
            }
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 0;
            }
            .qr-container {
              text-align: center;
              padding: 60px;
              border: 4px solid #000;
              border-radius: 16px;
              background: white;
              max-width: 800px;
            }
            .qr-title {
              font-size: 40px;
              font-weight: bold;
              margin-bottom: 20px;
            }
            .qr-subtitle {
              font-size: 28px;
              color: #666;
              margin-bottom: 40px;
            }
            .qr-code {
              margin: 40px 0;
              display: flex;
              justify-content: center;
            }
            .qr-url {
              font-size: 22px;
              color: #666;
              word-break: break-all;
              margin-top: 30px;
              padding: 20px;
              background: #f5f5f5;
              border-radius: 8px;
            }
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
              .qr-container {
                border: 4px solid #000;
                padding: 60px;
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="qr-title">${projektDisplayName}</div>
            ${schaltschrankNummer ? `<div class="qr-subtitle">Schaltschrank-Nr.: ${schaltschrankNummer}</div>` : ''}
            <div class="qr-code">
              <img src="${svgUrl}" alt="QR Code" style="width: 400px; height: 400px;" />
            </div>
            <div class="qr-url">${projektUrl}</div>
          </div>
        </body>
      </html>
    `);

    // Warte kurz, dann drucke
    setTimeout(() => {
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      setTimeout(() => {
        printWindow.close();
        URL.revokeObjectURL(svgUrl);
      }, 1000);
    }, 500);
  };

  const handleDownload = () => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `qr-code-${projektDisplayName.replace(/\s+/g, "-")}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>QR-Code für Projekt</DialogTitle>
          <DialogDescription>
            Scannen Sie diesen QR-Code, um direkt zum Projekt "{projektDisplayName}" zu gelangen.
          </DialogDescription>
        </DialogHeader>
        <div ref={qrRef} className="flex flex-col items-center space-y-4 py-4">
          <Card className="p-6">
            <CardContent className="flex flex-col items-center space-y-4">
              <div className="text-center">
                <p className="font-semibold text-3xl mb-4">{projektDisplayName}</p>
                {schaltschrankNummer && (
                  <p className="text-xl text-slate-600 mb-6">Schaltschrank-Nr.: {schaltschrankNummer}</p>
                )}
                <div className="bg-white p-8 rounded-lg inline-block">
                  <QRCodeSVG
                    value={projektUrl}
                    size={400}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <p className="text-sm text-slate-500 mt-8 break-all">
                  {projektUrl}
                </p>
              </div>
            </CardContent>
          </Card>
          <div className="flex gap-2 w-full">
            <Button onClick={handlePrint} className="flex-1 gap-2">
              <Printer className="h-4 w-4" />
              Drucken
            </Button>
            <Button onClick={handleDownload} variant="outline" className="flex-1 gap-2">
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

