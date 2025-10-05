import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { ComparisonResult } from "@/pages/Index";

interface PyMOLViewProps {
  comparisonResult: ComparisonResult;
}

export const PyMOLView = ({ comparisonResult }: PyMOLViewProps) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { variants } = comparisonResult;

  if (comparisonResult.sequenceType !== "protein") {
    return (
      <Card className="p-6 text-center text-sm text-muted-foreground">
        PyMOL scripting is available for protein comparisons. Switch to protein mode to generate mutation selections.
      </Card>
    );
  }

  const generatePyMOLCommand = (residues: number[]) => {
    if (residues.length === 0) return "# No mutations to select";
    return `select mutations, resi ${residues.join("+")}`;
  };

  const handleCopy = async (command: string, index: number) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedIndex(index);
      toast.success("Command copied to clipboard");
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      toast.error("Failed to copy command");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-5 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <h3 className="text-lg font-semibold mb-2">PyMOL Commands</h3>
        <p className="text-sm text-muted-foreground">
          Copy these commands to select mutation sites in PyMOL for structural visualization
        </p>
      </Card>

      {variants.map((variant, idx) => {
        const command = generatePyMOLCommand(variant.residues);
        const isCopied = copiedIndex === idx;

        return (
          <Card key={idx} className="p-5 space-y-3 hover:shadow-medium transition-shadow">
            <h3 className="text-base font-semibold">{variant.header}</h3>
            
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted/50 rounded-lg p-4 border border-border/50 overflow-x-auto">
                <code className="font-mono text-sm text-foreground">
                  {command}
                </code>
              </div>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCopy(command, idx)}
                className="shrink-0"
              >
                {isCopied ? (
                  <Check className="w-4 h-4 text-accent" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              {variant.residues.length > 0 
                ? `Selecting ${variant.residues.length} mutation site(s): ${variant.residues.join(", ")}`
                : "No mutations to select"}
            </p>
          </Card>
        );
      })}
    </div>
  );
};
