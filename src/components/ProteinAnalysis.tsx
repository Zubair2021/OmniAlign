import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Beaker, Zap, Eye, Copy } from "lucide-react";
import type { ComparisonResult } from "@/pages/Index";
import { calculateProteinProperties, predictSecondaryStructure } from "@/lib/proteinUtils";
import { useState } from "react";
import { toast } from "sonner";

interface ProteinAnalysisProps {
  comparisonResult: ComparisonResult;
}

export const ProteinAnalysis = ({ comparisonResult }: ProteinAnalysisProps) => {
  const [predictingStructure, setPredictingStructure] = useState(false);
  
  if (comparisonResult.sequenceType !== "protein") {
    return (
      <Card className="p-6 text-center text-sm text-muted-foreground">
        Switch to protein mode to unlock molecular properties and structure predictions.
      </Card>
    );
  }

  const allSequences = comparisonResult.noReferenceMode 
    ? comparisonResult.multiAlignment || []
    : comparisonResult.reference 
      ? [comparisonResult.reference, ...comparisonResult.variants]
      : comparisonResult.variants;

  const handlePredictStructure = async (sequence: string, header: string) => {
    setPredictingStructure(true);
    try {
      toast.info("Structure prediction would connect to ESMFold API. This is a demo showing the feature capability.");
      // In production, would call: await predictStructure(sequence);
    } catch (error) {
      toast.error("Structure prediction failed");
    } finally {
      setPredictingStructure(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-6">
      {allSequences.map((seq, idx) => {
        const props = calculateProteinProperties(seq.sequence);
        const secondaryStructure = predictSecondaryStructure(seq.sequence);
        
        return (
          <Card key={idx} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold">{seq.header}</h3>
              <Badge variant="outline" className="font-mono">{seq.sequence.length} aa</Badge>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Protein Properties */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Beaker className="w-4 h-4" />
                  Protein Properties
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm text-muted-foreground">Molecular Weight</span>
                    <span className="font-semibold">{props.molecularWeight.toFixed(2)} Da</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm text-muted-foreground">Theoretical pI</span>
                    <span className="font-semibold">{props.isoelectricPoint.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm text-muted-foreground">Hydrophobicity (GRAVY)</span>
                    <span className="font-semibold">{props.gravy.toFixed(3)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm text-muted-foreground">Instability Index</span>
                    <Badge variant={props.instabilityIndex > 40 ? "destructive" : "default"}>
                      {props.instabilityIndex.toFixed(2)} ({props.instabilityIndex > 40 ? "Unstable" : "Stable"})
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm text-muted-foreground">Charge at pH 7</span>
                    <span className="font-semibold">{props.netCharge > 0 ? "+" : ""}{props.netCharge.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Secondary Structure Prediction */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-accent">
                  <Zap className="w-4 h-4" />
                  Secondary Structure Prediction
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm text-muted-foreground">α-Helix</span>
                    <span className="font-semibold">{secondaryStructure.helix.toFixed(1)}%</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm text-muted-foreground">β-Sheet</span>
                    <span className="font-semibold">{secondaryStructure.sheet.toFixed(1)}%</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm text-muted-foreground">Random Coil</span>
                    <span className="font-semibold">{secondaryStructure.coil.toFixed(1)}%</span>
                  </div>

                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-2">Visual Distribution</div>
                    <div className="h-4 flex rounded-md overflow-hidden">
                      <div 
                        className="bg-primary/80" 
                        style={{ width: `${secondaryStructure.helix}%` }}
                        title={`Helix: ${secondaryStructure.helix.toFixed(1)}%`}
                      />
                      <div 
                        className="bg-accent/80" 
                        style={{ width: `${secondaryStructure.sheet}%` }}
                        title={`Sheet: ${secondaryStructure.sheet.toFixed(1)}%`}
                      />
                      <div 
                        className="bg-muted" 
                        style={{ width: `${secondaryStructure.coil}%` }}
                        title={`Coil: ${secondaryStructure.coil.toFixed(1)}%`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                onClick={() => handlePredictStructure(seq.sequence, seq.header)}
                disabled={predictingStructure}
                variant="secondary"
                size="sm"
              >
                <Eye className="w-4 h-4 mr-2" />
                {predictingStructure ? "Predicting..." : "Predict 3D Structure (ESMFold)"}
              </Button>

              <Button
                onClick={() => copyToClipboard(seq.sequence)}
                variant="outline"
                size="sm"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Sequence
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
