"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Filter, X } from "lucide-react";
import type { ProjektStatus } from "@/types";

interface AnalyseFilterProps {
  onFilterChange: (filters: {
    status?: ProjektStatus;
    datumVon?: Date;
    datumBis?: Date;
  }) => void;
}

export function AnalyseFilter({ onFilterChange }: AnalyseFilterProps) {
  const [status, setStatus] = useState<ProjektStatus | "alle">("alle");
  const [datumVon, setDatumVon] = useState<string>("");
  const [datumBis, setDatumBis] = useState<string>("");

  const handleApply = () => {
    onFilterChange({
      status: status !== "alle" ? status : undefined,
      datumVon: datumVon ? new Date(datumVon) : undefined,
      datumBis: datumBis ? new Date(datumBis) : undefined,
    });
  };

  const handleReset = () => {
    setStatus("alle");
    setDatumVon("");
    setDatumBis("");
    onFilterChange({});
  };

  const hasFilters =
    status !== "alle" ||
    datumVon !== "" ||
    datumBis !== "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Status Filter */}
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as ProjektStatus | "alle")}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alle">Alle</SelectItem>
                <SelectItem value="planung">Planung</SelectItem>
                <SelectItem value="in_bearbeitung">In Bearbeitung</SelectItem>
                <SelectItem value="abgeschlossen">Abgeschlossen</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Datum Von */}
          <div>
            <Label htmlFor="datumVon">Von</Label>
            <Input
              id="datumVon"
              type="date"
              value={datumVon}
              onChange={(e) => setDatumVon(e.target.value)}
            />
          </div>

          {/* Datum Bis */}
          <div>
            <Label htmlFor="datumBis">Bis</Label>
            <Input
              id="datumBis"
              type="date"
              value={datumBis}
              onChange={(e) => setDatumBis(e.target.value)}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <Button onClick={handleApply} className="flex-1">
            Filter anwenden
          </Button>
          {hasFilters && (
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Zurücksetzen
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

