import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, RotateCcw, Upload, FileText, Sparkles } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { SequenceType } from "@/lib/sequenceUtils";

interface SequenceInputsProps {
  referenceText: string;
  variantText: string;
  onReferenceChange: (text: string) => void;
  onVariantChange: (text: string) => void;
  onCompare: () => void;
  onClear: () => void;
  onLoadFile: (type: "reference" | "combined") => void;
  isComparing: boolean;
  availableSequences: Array<{ header: string; index: number }>;
  selectedReferenceIndex: number | null;
  onReferenceIndexChange: (index: number) => void;
  noReferenceMode: boolean;
  onNoReferenceModeChange: (enabled: boolean) => void;
  sequenceType: SequenceType;
  onSequenceTypeChange: (sequenceType: SequenceType) => void;
}

export const SequenceInputs = ({
  referenceText,
  variantText,
  onReferenceChange,
  onVariantChange,
  onCompare,
  onClear,
  onLoadFile,
  isComparing,
  availableSequences,
  selectedReferenceIndex,
  onReferenceIndexChange,
  noReferenceMode,
  onNoReferenceModeChange,
  sequenceType,
  onSequenceTypeChange,
}: SequenceInputsProps) => {
  const referencePlaceholder =
    sequenceType === "protein"
      ? ">reference\nMTEYKLVVVGAGGVGKSALTIQLIQNH..."
      : ">reference\nATGGCGTACGTTGCTAGCTAGCTAG...";

  const variantPlaceholder =
    sequenceType === "protein"
      ? ">variant_1\nMTEYKLVVVGAGGIGKSALTIQLIQNH...\n>variant_2\nMTEYKLVVVGAAGVGKSALTIQLIQNH..."
      : ">variant_1\nATGGCGTACGTTGCTAGCTAGATAG...\n>variant_2\nATGGCGTACGTCGCTAGCTAGCTAG...";

  const trimmedReference = referenceText.trim();
  const trimmedVariant = variantText.trim();
  const hasReferenceSelection = selectedReferenceIndex !== null || Boolean(trimmedReference);
  const hasComparisonSequences = Boolean(trimmedVariant);

  const canCompare = noReferenceMode
    ? Boolean(trimmedReference || trimmedVariant)
    : Boolean(hasReferenceSelection && hasComparisonSequences);

  return (
    <Card className="p-6 shadow-medium border-border/50 bg-card/80 backdrop-blur-sm animate-fade-in">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-accent" />
              OmniAlign Modes
            </p>
            <h2 className="text-2xl font-semibold">Choose your sequence universe</h2>
            <p className="text-sm text-muted-foreground max-w-xl">
              Seamlessly switch between amino acid and nucleotide workflows. We auto-tune validation and stats for each mode.
            </p>
          </div>

          <ToggleGroup
            type="single"
            value={sequenceType}
            onValueChange={(val) => val && onSequenceTypeChange(val as SequenceType)}
            className="bg-muted/40 rounded-lg p-1 border border-border/60"
          >
            <ToggleGroupItem value="protein" className="min-w-[120px]">
              Protein
            </ToggleGroupItem>
            <ToggleGroupItem value="nucleotide" className="min-w-[120px]">
              Nucleotide
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="variants" className="text-base font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-accent" />
                Variant Sequences
              </Label>
              <Button
                onClick={() => onLoadFile("combined")}
                variant="secondary"
                size="sm"
                className="bg-accent/10 hover:bg-accent/20 text-accent border-accent/30"
              >
                <Upload className="w-4 h-4 mr-2" />
                Load Combined FASTA
              </Button>
            </div>
            <Textarea
              id="variants"
              value={variantText}
              onChange={(e) => onVariantChange(e.target.value)}
              placeholder={variantPlaceholder}
              className="min-h-[200px] font-mono text-sm resize-none"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="reference" className="text-base font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Reference Sequence
              </Label>
              <Button
                onClick={() => onLoadFile("reference")}
                variant="secondary"
                size="sm"
                className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/30"
              >
                <Upload className="w-4 h-4 mr-2" />
                Load Reference FASTA
              </Button>
            </div>
            <Textarea
              id="reference"
              value={referenceText}
              onChange={(e) => onReferenceChange(e.target.value)}
              placeholder={referencePlaceholder}
              className="min-h-[200px] font-mono text-sm resize-none"
            />
          </div>
        </div>

        {/* Alignment Mode Toggle */}
        <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border border-border/50">
          <div className="flex items-center gap-3 flex-1">
            <Switch
              id="no-reference-mode"
              checked={noReferenceMode}
              onCheckedChange={onNoReferenceModeChange}
            />
            <Label htmlFor="no-reference-mode" className="text-sm font-medium cursor-pointer">
              Multi-sequence alignment (no reference)
            </Label>
          </div>
          
          {!noReferenceMode && availableSequences.length > 0 && (
            <div className="flex items-center gap-3">
              <Label htmlFor="reference-select" className="text-sm font-medium whitespace-nowrap">
                Reference:
              </Label>
              <Select
                value={selectedReferenceIndex !== null ? selectedReferenceIndex.toString() : undefined}
                onValueChange={(val) => onReferenceIndexChange(parseInt(val, 10))}
              >
                <SelectTrigger id="reference-select" className="w-[200px]">
                  <SelectValue placeholder="Select reference" />
                </SelectTrigger>
                <SelectContent>
                  {availableSequences.map((seq) => (
                    <SelectItem key={seq.index} value={seq.index.toString()}>
                      {seq.header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex justify-center gap-3">
          <Button
            onClick={onCompare}
            disabled={isComparing || !canCompare}
            className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-medium"
            size="lg"
          >
            <Play className="w-4 h-4 mr-2" />
            {isComparing ? "Analyzing..." : noReferenceMode ? "Align Sequences" : "Compare Sequences"}
          </Button>

          <Button
            onClick={onClear}
            variant="outline"
            size="lg"
            className="border-border/50"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>
    </Card>
  );
};
