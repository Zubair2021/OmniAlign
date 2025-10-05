import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { multiSequenceAlignment } from "@/lib/sequenceUtils";
import type { ComparisonResult } from "@/pages/Index";

interface AlignmentViewProps {
  comparisonResult: ComparisonResult;
}

const DEFAULT_LABEL_WIDTH = 160;
const MIN_LABEL_WIDTH = 100;
const MAX_LABEL_WIDTH = 360;
const MIN_CELL_SIZE = 4;
const MAX_CELL_SIZE = 64;
const DEFAULT_CELL_SIZE = MIN_CELL_SIZE;

export const AlignmentView = ({ comparisonResult }: AlignmentViewProps) => {
  const [cellSize, setCellSize] = useState(DEFAULT_CELL_SIZE);
  const [labelWidth, setLabelWidth] = useState(DEFAULT_LABEL_WIDTH);

  const aligned = useMemo(() => {
    if (comparisonResult.noReferenceMode) {
      return comparisonResult.multiAlignment ?? [];
    }

    const sequences = [] as Array<{ header: string; sequence: string }>;
    if (comparisonResult.reference) {
      sequences.push(comparisonResult.reference);
    }
    comparisonResult.variants.forEach((variant) => {
      sequences.push({ header: variant.header, sequence: variant.sequence });
    });

    if (sequences.length === 0) return [];
    return multiSequenceAlignment(sequences, comparisonResult.sequenceType);
  }, [comparisonResult]);

  const consensus = useMemo(() => {
    if (aligned.length === 0) return "";
    const columns = aligned[0].sequence.length;
    let result = "";

    for (let col = 0; col < columns; col++) {
      const counts: Record<string, number> = {};
      aligned.forEach((seq) => {
        const char = seq.sequence[col];
        counts[char] = (counts[char] || 0) + 1;
      });

      let bestChar = "-";
      let bestCount = 0;
      Object.entries(counts).forEach(([char, count]) => {
        if (count > bestCount) {
          bestChar = char;
          bestCount = count;
        }
      });
      result += bestChar;
    }

    return result;
  }, [aligned]);

  const alignmentRows = useMemo(() => {
    if (aligned.length === 0) return [] as Array<{ header: string; sequence: string; role: "baseline" | "sample" }>;

    if (!comparisonResult.noReferenceMode && aligned.length > 0) {
      const [referenceRow, ...rest] = aligned;
      return [
        { header: referenceRow.header, sequence: referenceRow.sequence, role: "baseline" as const },
        ...rest.map((seq) => ({ header: seq.header, sequence: seq.sequence, role: "sample" as const })),
      ];
    }

    return [
      { header: "Consensus", sequence: consensus, role: "baseline" as const },
      ...aligned.map((seq) => ({ header: seq.header, sequence: seq.sequence, role: "sample" as const })),
    ];
  }, [aligned, comparisonResult.noReferenceMode, consensus]);

  if (alignmentRows.length === 0) {
    return (
      <Card className="p-6 text-center text-sm text-muted-foreground">
        Provide sequences and run an alignment to explore residue-level differences.
      </Card>
    );
  }

  const baselineSequence = alignmentRows[0].sequence;
  const alignmentLength = baselineSequence.length;
  const showResidues = cellSize >= 24;
  const showCellBorders = cellSize >= 14;
  const condensedMode = cellSize <= 12;
  const positionTickInterval = cellSize >= 42 ? 5 : cellSize >= 28 ? 10 : cellSize >= 18 ? 20 : 50;
  const showMinorTicks = cellSize >= 18;
  const rowHeight = showResidues ? Math.max(18, cellSize) : Math.max(8, Math.round(cellSize * 0.8));
  const fontSize = showResidues ? Math.max(10, Math.round(cellSize * 0.45)) : 0;
  const positionFontSize = cellSize >= 32 ? 11 : cellSize >= 24 ? 10 : cellSize >= 16 ? 9 : 8;

  const getVariantClass = (char: string, baselineChar: string) => {
    if (char === baselineChar) {
      return condensedMode ? "bg-transparent" : "bg-match/20 text-match border-match/30";
    }
    if (char === "-" || baselineChar === "-") {
      return condensedMode ? "bg-gap/60" : "bg-gap/20 text-gap border-gap/30";
    }
    return condensedMode ? "bg-mismatch/80" : "bg-mismatch/20 text-mismatch border-mismatch/30";
  };

  return (
    <Card className="overflow-hidden border-border/60">
      <div className="border-b border-border/60 bg-card/95 px-5 py-4">
        <h3 className="text-lg font-semibold">Sequence alignment overview</h3>
        <div className="mt-4 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="whitespace-nowrap">Label width</span>
            <Slider
              value={[labelWidth]}
              min={MIN_LABEL_WIDTH}
              max={MAX_LABEL_WIDTH}
              step={10}
              className="w-[160px]"
              onValueChange={(value) => value[0] && setLabelWidth(value[0])}
              aria-label="Header width"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="whitespace-nowrap">Zoom</span>
            <Slider
              value={[cellSize]}
              min={MIN_CELL_SIZE}
              max={MAX_CELL_SIZE}
              step={1}
              className="w-[160px]"
              onValueChange={(value) => value[0] && setCellSize(value[0])}
              aria-label="Alignment zoom"
            />
          </div>
        </div>
      </div>

      <ScrollArea className="max-h-[60vh]">
        <div className="overflow-x-auto px-5 py-4">
          <div className="min-w-max space-y-2">
            <div className="flex items-center gap-3">
              <div
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                style={{ width: labelWidth, flex: "0 0 auto" }}
              >
                Position
              </div>
              <div className="flex">
                {Array.from({ length: alignmentLength }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-center font-mono text-muted-foreground"
                    style={{
                      width: cellSize,
                      minWidth: cellSize,
                      fontSize: positionFontSize,
                    }}
                  >
                    {(idx + 1) % positionTickInterval === 0
                      ? idx + 1
                      : showMinorTicks
                        ? "·"
                        : ""}
                  </div>
                ))}
              </div>
            </div>

            {alignmentRows.map((row) => (
              <div key={row.header} className="flex items-center gap-3">
                <div
                  className={cn(
                    "font-medium overflow-hidden",
                    row.role === "baseline" ? "text-muted-foreground" : "text-foreground",
                  )}
                  style={{ width: labelWidth, flex: "0 0 auto" }}
                  title={row.header}
                >
                  <span className="block truncate">
                    {row.header.length > 10 ? `${row.header.slice(0, 10)}…` : row.header}
                  </span>
                </div>
                <div className="flex">
                  {row.sequence.split("").map((char, colIndex) => {
                    const baselineChar = baselineSequence[colIndex];
                    const classes =
                      row.role === "baseline"
                        ? condensedMode
                          ? "bg-muted/30"
                          : "bg-muted/60 text-muted-foreground border-border/40"
                        : getVariantClass(char, baselineChar);

                    return (
                      <div
                        key={`${row.header}-${colIndex}`}
                        className={cn(
                          "flex items-center justify-center font-mono transition-colors",
                          showCellBorders ? "border" : "border-none",
                          classes,
                          row.role === "baseline" ? "font-semibold" : "font-bold",
                        )}
                        style={{
                          width: cellSize,
                          minWidth: cellSize,
                          height: rowHeight,
                          fontSize,
                        }}
                      >
                        {showResidues ? char : ""}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>

      <div className="border-t border-border/60 bg-card/80 px-5 py-4 text-sm text-muted-foreground">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded border border-border/40 bg-muted/60" />
            <span>{comparisonResult.noReferenceMode ? "Consensus" : "Reference"}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded border border-match/30 bg-match/20" />
            <span>Match</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded border border-mismatch/30 bg-mismatch/20" />
            <span>Mismatch</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded border border-gap/30 bg-gap/20" />
            <span>Gap</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
