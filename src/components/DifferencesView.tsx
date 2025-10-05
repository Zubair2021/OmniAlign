import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ComparisonResult } from "@/pages/Index";

interface DifferencesViewProps {
  comparisonResult: ComparisonResult;
}

export const DifferencesView = ({ comparisonResult }: DifferencesViewProps) => {
  const { reference, variants, noReferenceMode } = comparisonResult;

  if (noReferenceMode) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">
          Statistics view is not available for multi-sequence alignment mode.
          Switch to the Alignment or Protein Analysis tabs to view results.
        </p>
      </Card>
    );
  }

  if (!reference) return null;

  return (
    <div className="space-y-6">
      <Card className="p-5 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Reference: {reference.header}
        </h3>
        <p className="text-sm text-muted-foreground">
          Length: <span className="font-mono font-semibold">{reference.sequence.length}</span> residues
        </p>
      </Card>

      {variants.map((variant, idx) => (
        <Card key={idx} className="p-5 space-y-4 hover:shadow-medium transition-shadow">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-lg font-semibold mb-1">{variant.header}</h3>
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <span>
                  Length: <span className="font-mono font-semibold">{variant.sequence.length}</span>
                </span>
                <span>•</span>
                <span>
                  Differences: <span className="font-semibold text-destructive">{variant.differences.length}</span>
                </span>
              </div>
            </div>
            <Badge variant="secondary" className="text-base px-4 py-1">
              {variant.identity.toFixed(1)}% Identity
            </Badge>
          </div>

          {variant.differences.length > 0 ? (
            <div className="bg-muted/50 rounded-lg p-4 border border-border/50">
              <p className="text-sm font-semibold mb-2 text-muted-foreground">Mutations:</p>
              <div className="flex flex-wrap gap-2">
                {variant.differences.map((diff, i) => (
                  <Badge key={i} variant="destructive" className="font-mono text-xs">
                    {diff}
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-accent/10 rounded-lg p-4 border border-accent/20">
              <p className="text-sm font-medium text-accent flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent" />
                Perfect match - no mutations detected
              </p>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};
