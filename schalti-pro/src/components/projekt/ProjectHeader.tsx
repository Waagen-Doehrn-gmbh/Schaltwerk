"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Projekt } from "@/types";
import { getStatusBadge } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Edit2, Check, X, QrCode } from "lucide-react";
import { QRCodeDialog } from "./QRCodeDialog";

interface ProjectHeaderProps {
  projekt: Projekt;
  onSchaltschrankNummerChange?: (nummer: string | undefined) => void;
}

export function ProjectHeader({ projekt, onSchaltschrankNummerChange }: ProjectHeaderProps) {
  const statusBadge = getStatusBadge(projekt.status);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(projekt.schaltschrankNummer || "");
  const [qrCodeDialogOpen, setQrCodeDialogOpen] = useState(false);

  // Aktualisiere editValue, wenn sich die Schaltschranknummer ändert
  useEffect(() => {
    if (!isEditing) {
      setEditValue(projekt.schaltschrankNummer || "");
    }
  }, [projekt.schaltschrankNummer, isEditing]);

  const handleSave = () => {
    const trimmedValue = editValue.trim();
    const finalValue = trimmedValue === "" ? undefined : trimmedValue;
    
    if (onSchaltschrankNummerChange) {
      onSchaltschrankNummerChange(finalValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(projekt.schaltschrankNummer || "");
    setIsEditing(false);
  };

  return (
    <>
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-4 md:p-4 lg:p-4 xl:p-8 text-white mb-6 md:mb-6 lg:mb-6 xl:mb-8 overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl lg:text-2xl xl:text-4xl font-bold mb-2 break-words">{projekt.name}</h1>
          <p className="text-blue-100 text-xs md:text-sm lg:text-sm xl:text-lg mb-2 break-words">
            {projekt.standort}
          </p>
          
          {/* Schaltschranknummer */}
          <div className="mb-3 md:mb-4 flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-blue-100 text-xs md:text-sm font-medium">Schaltschrank-Nr.:</span>
            {isEditing ? (
              <div className="flex items-center gap-2 flex-wrap">
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                    if (e.key === "Escape") handleCancel();
                  }}
                  className="h-8 w-full sm:w-48 text-slate-900 bg-white"
                  placeholder="z.B. SS-2024-001"
                  autoFocus
                />
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={handleSave}
                  className="text-white hover:bg-white/20"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={handleCancel}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white font-semibold text-sm md:text-base break-words">
                  {projekt.schaltschrankNummer || "Nicht vergeben"}
                </span>
                {onSchaltschrankNummerChange && (
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => setIsEditing(true)}
                    className="text-white hover:bg-white/20 h-6 w-6"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}
          </div>

          <Badge
            className={cn(
              "border border-blue-400 bg-white/20 text-white hover:bg-white/30",
              "text-xs md:text-sm lg:text-sm xl:text-sm px-3 md:px-4 lg:px-4 xl:px-4 py-1 md:py-1.5 lg:py-1.5 xl:py-1.5 w-fit"
            )}
          >
            {statusBadge.label}
          </Badge>
        </div>
        <div className="flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setQrCodeDialogOpen(true)}
            className="text-white hover:bg-white/20 gap-2"
          >
            <QrCode className="h-4 w-4" />
            <span className="hidden sm:inline">QR-Code</span>
          </Button>
        </div>
      </div>
      </div>

      {/* QR-Code Dialog */}
      <QRCodeDialog
        open={qrCodeDialogOpen}
        onOpenChange={setQrCodeDialogOpen}
        projektId={projekt.id}
        projektName={projekt.name}
        standort={projekt.standort}
        schaltschrankNummer={projekt.schaltschrankNummer}
      />
    </>
  );
}

