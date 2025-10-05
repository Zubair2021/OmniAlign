import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { BarChart3, AlignLeft, Code2, Atom, Dna } from "lucide-react";
import { DifferencesView } from "./DifferencesView";
import { AlignmentView } from "./AlignmentView";
import { PyMOLView } from "./PyMOLView";
import { ProteinAnalysis } from "./ProteinAnalysis";
import { NucleotideInsights } from "./NucleotideInsights";
import type { ComparisonResult } from "@/pages/Index";

interface ResultsTabsProps {
  comparisonResult: ComparisonResult | null;
}

export const ResultsTabs = ({ comparisonResult }: ResultsTabsProps) => {
  if (!comparisonResult) {
    return (
      <Card className="p-12 text-center shadow-medium border-dashed border-2 border-border/50 bg-card/50 animate-fade-in">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <BarChart3 className="w-16 h-16 opacity-20" />
          <div>
            <p className="text-lg font-medium">No Comparison Results Yet</p>
            <p className="text-sm mt-1">Enter sequences above and click "Compare Sequences" to see results</p>
          </div>
        </div>
      </Card>
    );
  }

  const isProteinMode = comparisonResult.sequenceType === "protein";
  const isNucleotideMode = comparisonResult.sequenceType === "nucleotide";

  return (
    <Card className="shadow-large border-border/50 bg-card/80 backdrop-blur-sm animate-fade-in">
      <Tabs defaultValue="alignment" className="w-full">
        <TabsList className="w-full grid grid-cols-4 h-auto p-2 bg-muted/50">
          <TabsTrigger value="alignment" className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-soft py-3">
            <AlignLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Alignment</span>
            <span className="sm:hidden">Align</span>
          </TabsTrigger>
          <TabsTrigger value="differences" className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-soft py-3">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Statistics</span>
            <span className="sm:hidden">Stats</span>
          </TabsTrigger>
          {isProteinMode ? (
            <TabsTrigger value="protein" className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-soft py-3">
              <Atom className="w-4 h-4" />
              <span className="hidden sm:inline">Protein Analysis</span>
              <span className="sm:hidden">Protein</span>
            </TabsTrigger>
          ) : (
            <TabsTrigger value="nucleotide" className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-soft py-3">
              <Dna className="w-4 h-4" />
              <span className="hidden sm:inline">Nucleotide Insights</span>
              <span className="sm:hidden">DNA/RNA</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="pymol" className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-soft py-3">
            <Code2 className="w-4 h-4" />
            <span>PyMOL</span>
          </TabsTrigger>
        </TabsList>

        <div className="p-6">
          <TabsContent value="alignment" className="mt-0">
            <AlignmentView comparisonResult={comparisonResult} />
          </TabsContent>
          <TabsContent value="differences" className="mt-0">
            <DifferencesView comparisonResult={comparisonResult} />
          </TabsContent>
          {isProteinMode && (
            <TabsContent value="protein" className="mt-0">
              <ProteinAnalysis comparisonResult={comparisonResult} />
            </TabsContent>
          )}
          {isNucleotideMode && (
            <TabsContent value="nucleotide" className="mt-0">
              <NucleotideInsights comparisonResult={comparisonResult} />
            </TabsContent>
          )}
          <TabsContent value="pymol" className="mt-0">
            <PyMOLView comparisonResult={comparisonResult} />
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  );
};
