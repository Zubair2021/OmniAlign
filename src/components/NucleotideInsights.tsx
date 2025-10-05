import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink, Activity } from "lucide-react";
import type { ComparisonResult } from "@/pages/Index";
import {
  summarizeNucleotideAlignment,
  calculateNucleotideSequenceStats,
  type NucleotideSequenceStats,
} from "@/lib/nucleotideUtils";

const buildBlastUrl = (sequence: string) =>
  `https://blast.ncbi.nlm.nih.gov/Blast.cgi?PROGRAM=blastn&PAGE_TYPE=BlastSearch&QUERY=${encodeURIComponent(sequence)}`;

interface NucleotideInsightsProps {
  comparisonResult: ComparisonResult;
}

export const NucleotideInsights = ({ comparisonResult }: NucleotideInsightsProps) => {
  const sequenceLookup = useMemo(() => {
    const map = new Map<string, string>();

    if (comparisonResult.reference) {
      map.set(comparisonResult.reference.header, comparisonResult.reference.sequence);
    }

    comparisonResult.variants.forEach((variant) => {
      map.set(variant.header, variant.sequence);
    });

    comparisonResult.multiAlignment?.forEach((entry) => {
      map.set(entry.header, entry.sequence.replace(/-/g, ""));
    });

    return map;
  }, [comparisonResult]);

  const summary = useMemo(() => {
    if (comparisonResult.nucleotideSummary) {
      return comparisonResult.nucleotideSummary;
    }

    if (comparisonResult.sequenceType === "nucleotide" && comparisonResult.multiAlignment) {
      return summarizeNucleotideAlignment(null, comparisonResult.multiAlignment);
    }

    if (comparisonResult.sequenceType === "nucleotide") {
      const sequences: NucleotideSequenceStats[] = [];

      if (comparisonResult.reference) {
        sequences.push(
          calculateNucleotideSequenceStats(
            comparisonResult.reference.sequence,
            comparisonResult.reference.header,
          ),
        );
      }

      comparisonResult.variants.forEach((variant) => {
        sequences.push(calculateNucleotideSequenceStats(variant.sequence, variant.header));
      });

      return { sequences, comparisons: [] };
    }

    return { sequences: [], comparisons: [] };
  }, [comparisonResult]);

  if (summary.sequences.length === 0) {
    return (
      <Card className="p-6 text-center space-y-2">
        <Activity className="w-10 h-10 mx-auto text-muted-foreground opacity-30" />
        <p className="text-sm text-muted-foreground">
          Run an analysis in nucleotide mode to unlock GC content, transition metrics, and BLAST shortcuts.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-5 bg-gradient-to-br from-accent/10 to-primary/5 border-accent/20">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Nucleotide intelligence summary</h3>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Explore GC balance, base composition, and transition/transversion trends. Launch NCBI BLAST directly with one click for any sequence.
            </p>
          </div>
          <Badge variant="secondary" className="text-xs uppercase tracking-wide">
            Nucleotide Mode
          </Badge>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        {summary.sequences.map((seq) => {
          const sequence = sequenceLookup.get(seq.header) ?? "";
          const blastUrl = sequence ? buildBlastUrl(sequence) : null;

          return (
            <Card key={seq.header} className="p-5 space-y-4 hover:shadow-medium transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold">{seq.header}</h3>
                  <p className="text-xs text-muted-foreground">
                    GC skew {seq.gcSkew.toFixed(2)} • N bases {seq.nCount}
                  </p>
                </div>
                <Badge variant="outline" className="font-mono">
                  {seq.length} bp
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-muted/30 border border-border/60">
                  <p className="text-xs text-muted-foreground">GC content</p>
                  <p className="text-lg font-semibold">{seq.gcContent.toFixed(2)}%</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border border-border/60">
                  <p className="text-xs text-muted-foreground">AT content</p>
                  <p className="text-lg font-semibold">{seq.atContent.toFixed(2)}%</p>
                </div>
              </div>

              <ScrollArea className="w-full">
                <div className="flex gap-2 pb-2 text-xs font-mono">
                  {Object.entries(seq.baseCounts).map(([base, count]) => (
                    <Badge key={base} variant={base === "others" ? "secondary" : "outline"}>
                      {base}: {count}
                    </Badge>
                  ))}
                </div>
              </ScrollArea>

              {blastUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={blastUrl} target="_blank" rel="noopener noreferrer">
                    Blast sequence
                    <ExternalLink className="w-3.5 h-3.5 ml-2" />
                  </a>
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      {summary.comparisons.length > 0 && (
        <Card className="p-5 space-y-4">
          <h3 className="text-base font-semibold">Transition / transversion analysis</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground">
                <tr className="border-b border-border/60 text-left">
                  <th className="py-2 font-medium">Variant</th>
                  <th className="py-2 font-medium">Transitions</th>
                  <th className="py-2 font-medium">Transversions</th>
                  <th className="py-2 font-medium">Gaps</th>
                  <th className="py-2 font-medium">Ambiguous</th>
                  <th className="py-2 font-medium">Ti/Tv</th>
                  <th className="py-2 font-medium">Identity</th>
                  <th className="py-2 font-medium">ΔGC</th>
                </tr>
              </thead>
              <tbody>
                {summary.comparisons.map((item) => (
                  <tr key={item.variantHeader} className="border-b border-border/40 last:border-0">
                    <td className="py-2 font-medium">{item.variantHeader}</td>
                    <td className="py-2">{item.transitions}</td>
                    <td className="py-2">{item.transversions}</td>
                    <td className="py-2">{item.gaps}</td>
                    <td className="py-2">{item.ambiguous}</td>
                    <td className="py-2">
                      {item.transitionTransversionRatio === null
                        ? "∞"
                        : item.transitionTransversionRatio.toFixed(2)}
                    </td>
                    <td className="py-2">{item.identity.toFixed(2)}%</td>
                    <td className="py-2">{item.gcDelta.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

