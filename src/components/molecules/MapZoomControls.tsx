import { LocateFixed, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface MapZoomControlsProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onLocate?: () => void;
}

export function MapZoomControls({
  onZoomIn,
  onZoomOut,
  onLocate,
}: MapZoomControlsProps) {
  return (
    <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2">
      <Button
        aria-label="Zoom in"
        size="icon"
        variant="secondary"
        onClick={onZoomIn}
      >
        <Plus aria-hidden="true" className="h-5 w-5" />
      </Button>
      <Button
        aria-label="Zoom out"
        size="icon"
        variant="secondary"
        onClick={onZoomOut}
      >
        <Minus aria-hidden="true" className="h-5 w-5" />
      </Button>
      <Button
        aria-label="Locate me"
        size="icon"
        onClick={onLocate}
      >
        <LocateFixed aria-hidden="true" className="h-5 w-5" />
      </Button>
    </div>
  );
}
