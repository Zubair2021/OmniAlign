import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { SequenceInputs } from "@/components/SequenceInputs";
import { ResultsTabs } from "@/components/ResultsTabs";
import {
  parseFASTAEntries,
  validateSequence,
  compareSequences,
  multiSequenceAlignment,
  type SequenceType,
} from "@/lib/sequenceUtils";
import { summarizeNucleotideAlignment, type NucleotideSummary } from "@/lib/nucleotideUtils";
import { ExperienceSpotlight } from "@/components/ExperienceSpotlight";
import { toast } from "sonner";

export interface ComparisonResult {
  reference: { header: string; sequence: string } | null;
  variants: Array<{
    header: string;
    sequence: string;
    differences: string[];
    residues: number[];
    identity: number;
  }>;
  multiAlignment?: Array<{
    header: string;
    sequence: string;
  }>;
  noReferenceMode: boolean;
  sequenceType: SequenceType;
  nucleotideSummary?: NucleotideSummary;
}

const Index = () => {
  const [referenceText, setReferenceText] = useState("");
  const [variantText, setVariantText] = useState("");
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [selectedReferenceIndex, setSelectedReferenceIndex] = useState(0);
  const [noReferenceMode, setNoReferenceMode] = useState(false);
  const [sequenceType, setSequenceType] = useState<SequenceType>("protein");
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(true);

  const allSequences = useMemo(() => {
    const refEntries = parseFASTAEntries(referenceText, sequenceType);
    const varEntries = parseFASTAEntries(variantText, sequenceType);
    return [...refEntries, ...varEntries];
  }, [referenceText, variantText, sequenceType]);

  const availableSequences = useMemo(() => {
    return allSequences.map((seq, index) => ({
      header: seq.header,
      index,
    }));
  }, [allSequences]);

  useEffect(() => {
    setComparisonResult(null);
  }, [sequenceType]);

  const handleSequenceTypeChange = (nextType: SequenceType) => {
    if (nextType === sequenceType) return;
    setSequenceType(nextType);
    toast.info(`${nextType === "protein" ? "Protein" : "Nucleotide"} workflow ready`, {
      id: "sequence-mode",
    });
  };

  const handleCompare = async () => {
    setIsComparing(true);
    
    try {
      if (noReferenceMode) {
        // Multi-sequence alignment mode
      if (allSequences.length < 2) {
        toast.error("Please provide at least 2 sequences for alignment");
        return;
      }

      for (const seq of allSequences) {
        const validation = validateSequence(seq.sequence, seq.header, sequenceType);
        if (!validation.isValid) {
          toast.error(validation.message);
          return;
        }
      }

      const aligned = multiSequenceAlignment(allSequences, sequenceType);
      const nucleotideSummary =
        sequenceType === "nucleotide"
          ? summarizeNucleotideAlignment(
              null,
              aligned.map((entry) => ({
                header: entry.header,
                sequence: entry.sequence.replace(/-/g, ""),
              })),
            )
          : undefined;
      setComparisonResult({
        reference: null,
        variants: [],
        multiAlignment: aligned,
        noReferenceMode: true,
        sequenceType,
        nucleotideSummary,
      });
      toast.success(`Aligned ${aligned.length} sequences successfully`);
    } else {
      // Reference-based comparison mode
      if (allSequences.length === 0) {
          toast.error("Please provide sequences");
          return;
        }

        if (selectedReferenceIndex >= allSequences.length) {
          toast.error("Invalid reference selection");
          return;
      }

      const reference = allSequences[selectedReferenceIndex];
      const refValidation = validateSequence(reference.sequence, "Reference", sequenceType);
      if (!refValidation.isValid) {
        toast.error(refValidation.message);
        return;
      }

      const otherSequences = allSequences.filter((_, idx) => idx !== selectedReferenceIndex);
      if (otherSequences.length === 0) {
        toast.error("Please provide at least one sequence to compare");
        return;
      }

      const variants = [];
      for (const variant of otherSequences) {
        const varValidation = validateSequence(variant.sequence, variant.header, sequenceType);
        if (!varValidation.isValid) {
          toast.error(varValidation.message);
          return;
        }

        const comparison = compareSequences(reference.sequence, variant.sequence, sequenceType);
        variants.push({
          header: variant.header,
          sequence: variant.sequence,
          differences: comparison.differences,
          residues: comparison.residues,
          identity: comparison.identity,
        });
      }

      const nucleotideSummary =
        sequenceType === "nucleotide"
          ? summarizeNucleotideAlignment(reference, otherSequences)
          : undefined;

      setComparisonResult({
        reference,
        variants,
        noReferenceMode: false,
        sequenceType,
        nucleotideSummary,
      });
      toast.success(`Compared ${variants.length} sequence(s) successfully`);
    }
    } catch (error) {
      toast.error("An error occurred during analysis");
      console.error(error);
    } finally {
      setIsComparing(false);
    }
  };

  const handleClear = () => {
    setReferenceText("");
    setVariantText("");
    setComparisonResult(null);
    toast.info("Inputs cleared");
  };

  const handleLoadFile = async (type: "reference" | "combined") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".fasta,.fa,.faa,.fsa,.fst,.fas,.txt";
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const text = await file.text();
      
      if (type === "reference") {
        setReferenceText(text);
        toast.success("Reference file loaded");
      } else {
        const entries = parseFASTAEntries(text, sequenceType);
        if (entries.length === 0) {
          toast.error("No valid sequences found in file");
          return;
        }

        if (entries.length === 1) {
          setReferenceText(text);
          toast.info("Only one sequence found, loaded as reference");
        } else {
          setReferenceText(`>${entries[0].header}\n${entries[0].sequence}`);
          const variants = entries.slice(1).map(e => `>${e.header}\n${e.sequence}`).join("\n");
          setVariantText(variants);
          toast.success(`Loaded ${entries.length} sequences (1 reference, ${entries.length - 1} variants)`);
        }
      }
    };
    
    input.click();
  };

  return (
    <div className="min-h-screen">
      <Header />
      <ExperienceSpotlight
        open={isSpotlightOpen}
        onOpenChange={setIsSpotlightOpen}
        activeMode={sequenceType}
        onModeSelect={handleSequenceTypeChange}
      />
      
      <main className="container mx-auto px-4 py-8 space-y-8 max-w-7xl">
        <SequenceInputs
          referenceText={referenceText}
          variantText={variantText}
          onReferenceChange={setReferenceText}
          onVariantChange={setVariantText}
          onCompare={handleCompare}
          onClear={handleClear}
          onLoadFile={handleLoadFile}
          isComparing={isComparing}
          availableSequences={availableSequences}
          selectedReferenceIndex={selectedReferenceIndex}
          onReferenceIndexChange={setSelectedReferenceIndex}
          noReferenceMode={noReferenceMode}
          onNoReferenceModeChange={setNoReferenceMode}
          sequenceType={sequenceType}
          onSequenceTypeChange={handleSequenceTypeChange}
        />

        <ResultsTabs comparisonResult={comparisonResult} />
      </main>
    </div>
  );
};

export default Index;
