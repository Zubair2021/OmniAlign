import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ComparisonResult } from "@/pages/Index";

interface AlignmentViewProps {
  comparisonResult: ComparisonResult;
}

export const AlignmentView = ({ comparisonResult }: AlignmentViewProps) => {
  const { reference, variants, multiAlignment, noReferenceMode } = comparisonResult;

  const getResidueClass = (refChar: string, varChar: string, isConsensus?: boolean) => {
    if (isConsensus) {
      return "bg-primary/20 text-primary border-primary/30 font-bold";
    }
    if (refChar === varChar) {
      return "bg-match/20 text-match border-match/30";
    } else if (varChar === "-" || refChar === "-") {
      return "bg-gap/20 text-gap border-gap/30";
    } else {
      return "bg-mismatch/20 text-mismatch border-mismatch/30";
    }
  };

  const getConsensusSequence = (sequences: Array<{ sequence: string }>) => {
    if (sequences.length === 0) return "";
    const len = sequences[0].sequence.length;
    let consensus = "";
    
    for (let i = 0; i < len; i++) {
      const chars: { [key: string]: number } = {};
      sequences.forEach(seq => {
        const char = seq.sequence[i];
        chars[char] = (chars[char] || 0) + 1;
      });
      
      // Find most common character
      let maxCount = 0;
      let maxChar = "-";
      Object.entries(chars).forEach(([char, count]) => {
        if (count > maxCount) {
          maxCount = count;
          maxChar = char;
        }
      });
      consensus += maxChar;
    }
    return consensus;
  };

  if (noReferenceMode && multiAlignment) {
    const consensus = getConsensusSequence(multiAlignment);
    
    return (
      <Card className="p-5">
        <h3 className="text-lg font-semibold mb-4">
          Multi-Sequence Alignment ({multiAlignment.length} sequences)
        </h3>
        
        <ScrollArea className="w-full">
          <div className="space-y-2 pb-4">
            {/* Position markers */}
            <div className="flex gap-2 items-center">
              <div className="w-32 text-xs font-semibold text-muted-foreground">Position</div>
              <div className="flex gap-0.5">
                {consensus.split("").map((_, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 flex items-center justify-center text-[10px] font-mono text-muted-foreground"
                  >
                    {(i + 1) % 10 === 0 ? i + 1 : "·"}
                  </div>
                ))}
              </div>
            </div>

            {/* Consensus sequence */}
            <div className="flex gap-2 items-center border-b border-border pb-2">
              <div className="w-32 text-sm font-bold truncate text-primary">Consensus</div>
              <div className="flex gap-0.5">
                {consensus.split("").map((char, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-7 h-7 flex items-center justify-center font-mono text-xs rounded border transition-colors",
                      getResidueClass("", "", true)
                    )}
                  >
                    {char}
                  </div>
                ))}
              </div>
            </div>

            {/* All sequences */}
            {multiAlignment.map((seq, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <div className="w-32 text-sm font-semibold truncate" title={seq.header}>
                  {seq.header}
                </div>
                <div className="flex gap-0.5">
                  {seq.sequence.split("").map((char, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-7 h-7 flex items-center justify-center font-mono text-xs rounded border transition-colors",
                        getResidueClass(consensus[i], char)
                      )}
                    >
                      {char}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary/20 border border-primary/30" />
            <span className="text-muted-foreground">Consensus</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-match/20 border border-match/30" />
            <span className="text-muted-foreground">Match</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-mismatch/20 border border-mismatch/30" />
            <span className="text-muted-foreground">Mismatch</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gap/20 border border-gap/30" />
            <span className="text-muted-foreground">Gap</span>
          </div>
        </div>
      </Card>
    );
  }

  if (!reference) return null;

  return (
    <div className="space-y-6">
      {variants.map((variant, idx) => (
        <Card key={idx} className="p-5">
          <h3 className="text-lg font-semibold mb-4">
            {reference.header} vs {variant.header}
          </h3>
          
          <ScrollArea className="w-full">
            <div className="space-y-3 pb-4">
              {/* Position markers */}
              <div className="flex gap-2 items-center">
                <div className="w-24 text-xs font-semibold text-muted-foreground">Position</div>
                <div className="flex gap-0.5">
                  {reference.sequence.split("").map((_, i) => (
                    <div
                      key={i}
                      className="w-7 h-7 flex items-center justify-center text-[10px] font-mono text-muted-foreground"
                    >
                      {(i + 1) % 10 === 0 ? i + 1 : "·"}
                    </div>
                  ))}
                </div>
              </div>

              {/* Reference sequence */}
              <div className="flex gap-2 items-center">
                <div className="w-24 text-sm font-semibold truncate">Reference</div>
                <div className="flex gap-0.5">
                  {reference.sequence.split("").map((char, i) => (
                    <div
                      key={i}
                      className="w-7 h-7 flex items-center justify-center font-mono text-xs bg-muted/30 rounded border border-border/50"
                    >
                      {char}
                    </div>
                  ))}
                </div>
              </div>

              {/* Variant sequence */}
              <div className="flex gap-2 items-center">
                <div className="w-24 text-sm font-semibold truncate">Variant</div>
                <div className="flex gap-0.5">
                  {variant.sequence.split("").map((char, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-7 h-7 flex items-center justify-center font-mono text-xs font-semibold rounded border transition-colors",
                        getResidueClass(reference.sequence[i], char)
                      )}
                    >
                      {char}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-match/20 border border-match/30" />
              <span className="text-muted-foreground">Match</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-mismatch/20 border border-mismatch/30" />
              <span className="text-muted-foreground">Mismatch</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gap/20 border border-gap/30" />
              <span className="text-muted-foreground">Gap</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
