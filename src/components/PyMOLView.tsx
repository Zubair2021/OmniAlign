import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import type { ComparisonResult } from "@/pages/Index";

interface PyMOLViewProps {
  comparisonResult: ComparisonResult;
}

interface AggregatedMutation {
  position: number;
  count: number;
  frequency: number;
  residues: string;
  referenceResidue: string;
}

const frequencyToPercent = (value: number) => (value * 100).toFixed(1);

const buildPyMOLScript = (mutations: AggregatedMutation[]) => {
  if (mutations.length === 0) {
    return "# No mutation sites detected across samples";
  }

  const selection = mutations.map((item) => item.position).join("+");
  const lines = [
    "# Color mutation frequency with a green-to-red ramp",
    "alter all, b=0",
    ...mutations.map((item) => `alter (resi ${item.position}), b=${item.frequency.toFixed(2)}`),
    `spectrum b, green_red, resi ${selection}`,
    `show sticks, resi ${selection}`,
    `select mutation_sites, resi ${selection}`,
  ];

  return lines.join("\n");
};

export const PyMOLView = ({ comparisonResult }: PyMOLViewProps) => {
  const [copied, setCopied] = useState(false);

  if (comparisonResult.sequenceType !== "protein") {
    return (
      <Card className="p-6 text-center text-sm text-muted-foreground">
        PyMOL scripting is available for protein comparisons. Switch to protein mode to generate mutation selections.
      </Card>
    );
  }

  const aggregated = useMemo(() => {
    if (!comparisonResult.reference || comparisonResult.variants.length === 0) {
      return [] as AggregatedMutation[];
    }

    const totals = new Map<number, { count: number; residues: Set<string> }>();

    comparisonResult.variants.forEach((variant) => {
      variant.residues.forEach((position) => {
        const entry = totals.get(position) ?? { count: 0, residues: new Set<string>() };
        entry.count += 1;
        const residue = variant.sequence[position - 1] ?? "-";
        if (residue !== "-") {
          entry.residues.add(residue);
        }
        totals.set(position, entry);
      });
    });

    const totalVariants = comparisonResult.variants.length;

    return Array.from(totals.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([position, data]) => ({
        position,
        count: data.count,
        frequency: data.count / totalVariants,
        residues: data.residues.size > 0 ? Array.from(data.residues).join(", ") : "-",
        referenceResidue: comparisonResult.reference!.sequence[position - 1] ?? "-",
      }));
  }, [comparisonResult]);

  const command = useMemo(() => buildPyMOLScript(aggregated), [aggregated]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      toast.success("Command copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy command");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-5 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <h3 className="text-lg font-semibold">PyMOL mutation heatmap script</h3>
        <p className="text-sm text-muted-foreground">
          Frequencies are aggregated across all samples. Paste the script into PyMOL to color residues from green (rare) to red (common).
        </p>
      </Card>

      <Card className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-base font-semibold">Generated script</h4>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4 text-accent" />
                Copied
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </>
            )}
          </Button>
        </div>
        <div className="rounded-lg border border-border/60 bg-muted/40 p-4">
          <pre className="whitespace-pre-wrap break-words font-mono text-sm text-foreground">{command}</pre>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-semibold">Mutation frequency summary</h4>
          <span className="text-sm text-muted-foreground">
            Samples analysed: {comparisonResult.variants.length}
          </span>
        </div>

        {aggregated.length === 0 ? (
          <p className="text-sm text-muted-foreground">No mutations detected across the provided samples.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b border-border/60">
                  <th className="py-2 font-medium">Position</th>
                  <th className="py-2 font-medium">Reference</th>
                  <th className="py-2 font-medium">Variant residues</th>
                  <th className="py-2 font-medium">Count</th>
                  <th className="py-2 font-medium">Frequency</th>
                </tr>
              </thead>
              <tbody>
                {aggregated.map((item) => (
                  <tr key={item.position} className="border-b border-border/40 last:border-0">
                    <td className="py-2 font-semibold">{item.position}</td>
                    <td className="py-2 font-mono text-muted-foreground">{item.referenceResidue}</td>
                    <td className="py-2 font-mono">{item.residues}</td>
                    <td className="py-2">{item.count}</td>
                    <td className="py-2">{frequencyToPercent(item.frequency)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
