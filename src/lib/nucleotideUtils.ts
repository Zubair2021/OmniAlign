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

const GENETIC_CODE: Record<string, string> = {
  TTT: "F", TTC: "F", TTA: "L", TTG: "L",
  TCT: "S", TCC: "S", TCA: "S", TCG: "S",
  TAT: "Y", TAC: "Y", TAA: "*", TAG: "*",
  TGT: "C", TGC: "C", TGA: "*", TGG: "W",
  CTT: "L", CTC: "L", CTA: "L", CTG: "L",
  CCT: "P", CCC: "P", CCA: "P", CCG: "P",
  CAT: "H", CAC: "H", CAA: "Q", CAG: "Q",
  CGT: "R", CGC: "R", CGA: "R", CGG: "R",
  ATT: "I", ATC: "I", ATA: "I", ATG: "M",
  ACT: "T", ACC: "T", ACA: "T", ACG: "T",
  AAT: "N", AAC: "N", AAA: "K", AAG: "K",
  AGT: "S", AGC: "S", AGA: "R", AGG: "R",
  GTT: "V", GTC: "V", GTA: "V", GTG: "V",
  GCT: "A", GCC: "A", GCA: "A", GCG: "A",
  GAT: "D", GAC: "D", GAA: "E", GAG: "E",
  GGT: "G", GGC: "G", GGA: "G", GGG: "G",
  NNN: "X",
};

const AMBIGUOUS_TO_N = /[BDHVRSWKMY]/g;

export const translateNucleotideSequence = (sequence: string, frame: number = 0): string => {
  if (frame < 0 || frame > 2) {
    throw new Error("Reading frame must be 0, 1, or 2");
  }

  const normalized = normalizeSequence(sequence, "nucleotide");
  const sanitized = normalized.replace(/-/g, "");
  let protein = "";

  for (let i = frame; i + 2 < sanitized.length; i += 3) {
    const codon = sanitized
      .slice(i, i + 3)
      .replace(AMBIGUOUS_TO_N, "N");
    protein += GENETIC_CODE[codon] ?? "X";
  }

  return protein;
};

export const translateSequencesToProteins = (
  entries: FASTAEntry[],
  frame: number = 0,
): FASTAEntry[] => {
  return entries
    .map((entry) => ({
      header: `${entry.header}|frame${frame + 1}`,
      sequence: translateNucleotideSequence(entry.sequence, frame),
    }))
    .filter((entry) => entry.sequence.length > 0);
};

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
