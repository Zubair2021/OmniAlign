import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { SequenceInputs } from "@/components/SequenceInputs";
import { ResultsTabs } from "@/components/ResultsTabs";
import { ToolSidebar } from "@/components/ToolSidebar";
import {
  parseFASTAEntries,
  validateSequence,
  compareSequences,
  multiSequenceAlignment,
  type SequenceType,
} from "@/lib/sequenceUtils";
import { summarizeNucleotideAlignment, type NucleotideSummary } from "@/lib/nucleotideUtils";
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
  const [selectedReferenceIndex, setSelectedReferenceIndex] = useState<number | null>(null);
  const [noReferenceMode, setNoReferenceMode] = useState(false);
  const [sequenceType, setSequenceType] = useState<SequenceType>("protein");

  const referenceEntries = useMemo(
    () => parseFASTAEntries(referenceText, sequenceType),
    [referenceText, sequenceType],
  );

  const variantEntries = useMemo(
    () => parseFASTAEntries(variantText, sequenceType),
    [variantText, sequenceType],
  );

  const allSequences = useMemo(
    () => [...referenceEntries, ...variantEntries],
    [referenceEntries, variantEntries],
  );

  const availableSequences = useMemo(
    () =>
      allSequences.map((seq, index) => ({
        header: seq.header,
        index,
      })),
    [allSequences],
  );

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

  useEffect(() => {
    if (noReferenceMode) {
      setSelectedReferenceIndex(null);
    }
  }, [noReferenceMode]);

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

      const effectiveIndex =
        selectedReferenceIndex !== null ? selectedReferenceIndex : referenceEntries.length > 0 ? 0 : null;

      if (effectiveIndex === null || effectiveIndex >= allSequences.length) {
        toast.error("Select a reference sequence using the dropdown below");
        return;
      }

      const reference = allSequences[effectiveIndex];
      const refValidation = validateSequence(reference.sequence, "Reference", sequenceType);
      if (!refValidation.isValid) {
        toast.error(refValidation.message);
        return;
      }

      const otherSequences = allSequences.filter((_, idx) => idx !== effectiveIndex);
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
    setSelectedReferenceIndex(null);
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
        setComparisonResult(null);
        toast.success("Reference file loaded");
      } else {
        const entries = parseFASTAEntries(text, sequenceType);
        if (entries.length === 0) {
          toast.error("No valid sequences found in file");
          return;
        }
        setReferenceText("");
        setVariantText(
          entries.map((entry) => `>${entry.header}\n${entry.sequence}`).join("\n"),
        );
        setSelectedReferenceIndex(null);
        setComparisonResult(null);
        toast.success(
          entries.length === 1
            ? "Loaded 1 sequence. Choose a reference below or paste one manually."
            : `Loaded ${entries.length} sequences. Select a reference below or enable multi-alignment.`,
        );
      }
    };
    
    input.click();
  };

  const handleReferenceSelection = (index: number) => {
    if (allSequences.length === 0) {
      setSelectedReferenceIndex(null);
      return;
    }

    if (Number.isNaN(index) || index < 0 || index >= allSequences.length) {
      toast.error("Invalid reference selection");
      setSelectedReferenceIndex(null);
      return;
    }

    const selected = allSequences[index];
    if (!selected) {
      toast.error("Unable to use the selected sequence");
      setSelectedReferenceIndex(null);
      return;
    }

    const remaining = allSequences.filter((_, idx) => idx !== index);

    setReferenceText(`>${selected.header}\n${selected.sequence}`);
    setVariantText(
      remaining.map((entry) => `>${entry.header}\n${entry.sequence}`).join("\n"),
    );
    setComparisonResult(null);
    setSelectedReferenceIndex(0);
  };

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          <ToolSidebar />

          <main className="flex-1 space-y-8">
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
              onReferenceIndexChange={handleReferenceSelection}
              noReferenceMode={noReferenceMode}
              onNoReferenceModeChange={setNoReferenceMode}
              sequenceType={sequenceType}
              onSequenceTypeChange={handleSequenceTypeChange}
            />

            <ResultsTabs comparisonResult={comparisonResult} />
          </main>
        </div>
      </div>
    </div>
  );
};

export default Index;
