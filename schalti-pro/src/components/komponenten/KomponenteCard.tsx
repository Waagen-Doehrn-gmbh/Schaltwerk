import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { Komponente } from "@/types";
import { getStatusBadge } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface KomponenteCardProps {
  komponente: Komponente;
  isSelected?: boolean;
  showCheckbox?: boolean;
  onCheckboxChange?: (checked: boolean) => void;
  onClick?: () => void;
}

export function KomponenteCard({
  komponente,
  isSelected,
  showCheckbox = false,
  onCheckboxChange,
  onClick,
}: KomponenteCardProps) {
  const statusBadge = getStatusBadge(komponente.status);
  const isAusstehend = komponente.status === "ausstehend";

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleCheckboxChange = (checked: boolean) => {
    if (onCheckboxChange) {
      onCheckboxChange(checked);
    }
  };

  return (
    <Card
      className={cn(
        "p-3 md:p-3 lg:p-3 xl:p-4 hover:shadow-md transition-all duration-200 overflow-hidden",
        isAusstehend && showCheckbox ? "cursor-default" : "cursor-pointer",
        isSelected && "ring-2 ring-blue-500"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 md:gap-3">
        {showCheckbox && isAusstehend && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleCheckboxChange}
            onClick={handleCheckboxClick}
            className="mt-1 flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-900 dark:text-foreground mb-1 text-sm md:text-sm lg:text-sm xl:text-base break-words">
            {komponente.name}
          </h4>
          <p className="text-xs font-mono text-slate-500 dark:text-muted-foreground truncate">
            {komponente.artikelNummer}
          </p>
        </div>
        <Badge className={cn("border flex-shrink-0 text-xs px-2 md:px-2.5 py-0.5 md:py-1", statusBadge.className)}>
          {statusBadge.label}
        </Badge>
      </div>
    </Card>
  );
}

