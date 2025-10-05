import type { FASTAEntry } from "./sequenceUtils";
import { compareSequences, normalizeSequence } from "./sequenceUtils";

const PURINES = new Set(["A", "G"]);
const PYRIMIDINES = new Set(["C", "T"]);

const BASE_KEYS = ["A", "C", "G", "T", "N"] as const;

export type NucleotideBaseKey = (typeof BASE_KEYS)[number] | "others";

export interface NucleotideSequenceStats {
  header: string;
  length: number;
  gcContent: number;
  atContent: number;
  gcSkew: number;
  nCount: number;
  baseCounts: Record<NucleotideBaseKey, number>;
}

export interface NucleotideComparisonStats {
  variantHeader: string;
  transitions: number;
  transversions: number;
  gaps: number;
  ambiguous: number;
  differenceCount: number;
  transitionTransversionRatio: number | null;
  identity: number;
  gcDelta: number;
}

export interface NucleotideSummary {
  sequences: NucleotideSequenceStats[];
  comparisons: NucleotideComparisonStats[];
}

const createBaseCountRecord = () => ({
  A: 0,
  C: 0,
  G: 0,
  T: 0,
  N: 0,
  others: 0,
});

export const calculateNucleotideSequenceStats = (
  sequence: string,
  header: string
): NucleotideSequenceStats => {
  const counts = createBaseCountRecord();
  const normalized = normalizeSequence(sequence, "nucleotide");

  for (const base of normalized) {
    if (base in counts) {
      counts[base as NucleotideBaseKey] += 1;
    } else {
      counts.others += 1;
    }
  }

  const length = normalized.length;
  const gc = counts.G + counts.C;
  const at = counts.A + counts.T;
  const denominatorGC = gc === 0 ? 1 : gc;
  const gcSkew = gc === 0 ? 0 : (counts.G - counts.C) / denominatorGC;

  return {
    header,
    length,
    gcContent: length ? (gc / length) * 100 : 0,
    atContent: length ? (at / length) * 100 : 0,
    gcSkew,
    nCount: counts.N,
    baseCounts: counts,
  };
};

const isInformativeBase = (base: string) => PURINES.has(base) || PYRIMIDINES.has(base);

const classifyDifference = (reference: string, variant: string) => {
  if (reference === "-" || variant === "-") {
    return "gap" as const;
  }

  if (!isInformativeBase(reference) || !isInformativeBase(variant)) {
    return "ambiguous" as const;
  }

  const sameClass =
    (PURINES.has(reference) && PURINES.has(variant)) ||
    (PYRIMIDINES.has(reference) && PYRIMIDINES.has(variant));

  return sameClass ? ("transition" as const) : ("transversion" as const);
};

export const summarizeNucleotideAlignment = (
  reference: FASTAEntry | null,
  variants: FASTAEntry[]
): NucleotideSummary => {
  const sequences: NucleotideSequenceStats[] = [];
  const comparisons: NucleotideComparisonStats[] = [];

  if (reference) {
    sequences.push(calculateNucleotideSequenceStats(reference.sequence, reference.header));
  }

  for (const variant of variants) {
    sequences.push(calculateNucleotideSequenceStats(variant.sequence, variant.header));
  }

  if (reference) {
    const referenceStats = calculateNucleotideSequenceStats(reference.sequence, reference.header);

    for (const variant of variants) {
      const variantStats = calculateNucleotideSequenceStats(variant.sequence, variant.header);
      const { identity } = compareSequences(reference.sequence, variant.sequence, "nucleotide");

      let transitions = 0;
      let transversions = 0;
      let gaps = 0;
      let ambiguous = 0;

      const maxLen = Math.max(reference.sequence.length, variant.sequence.length);

      for (let i = 0; i < maxLen; i++) {
        const refBase = i < reference.sequence.length ? reference.sequence[i] : "-";
        const varBase = i < variant.sequence.length ? variant.sequence[i] : "-";

        if (refBase === varBase) continue;

        const classification = classifyDifference(refBase, varBase);

        if (classification === "transition") transitions += 1;
        if (classification === "transversion") transversions += 1;
        if (classification === "gap") gaps += 1;
        if (classification === "ambiguous") ambiguous += 1;
      }

      const differenceCount = transitions + transversions + gaps + ambiguous;
      const ratio = transversions === 0 ? null : transitions / transversions;

      comparisons.push({
        variantHeader: variant.header,
        transitions,
        transversions,
        gaps,
        ambiguous,
        differenceCount,
        transitionTransversionRatio: ratio,
        identity,
        gcDelta: variantStats.gcContent - referenceStats.gcContent,
      });
    }
  }

  return { sequences, comparisons };
};

