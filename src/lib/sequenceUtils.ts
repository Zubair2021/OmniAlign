const MAX_SEQUENCE_LENGTH = 10000;

export type SequenceType = "protein" | "nucleotide";

const PROTEIN_ALPHABET = new Set("ACDEFGHIKLMNPQRSTVWYBXZ*-".split(""));
const NUCLEOTIDE_ALPHABET = new Set("ACGTRYSWKMBDHVN-".split(""));

export interface FASTAEntry {
  header: string;
  sequence: string;
}

export interface ValidationResult {
  isValid: boolean;
  message: string;
}

export interface ComparisonData {
  differences: string[];
  residues: number[];
  identity: number;
}

const getAlphabet = (sequenceType: SequenceType) =>
  sequenceType === "protein" ? PROTEIN_ALPHABET : NUCLEOTIDE_ALPHABET;

export const normalizeSequence = (text: string, sequenceType: SequenceType): string => {
  if (!text) return "";
  let normalized = text.replace(/\s+/g, "").toUpperCase();
  if (sequenceType === "nucleotide") {
    normalized = normalized.replace(/U/g, "T");
  }
  return normalized;
};

const collectInvalidCharacters = (sequence: string, sequenceType: SequenceType) => {
  const alphabet = getAlphabet(sequenceType);
  const invalid = new Set<string>();
  for (const char of sequence) {
    if (!alphabet.has(char)) {
      invalid.add(char);
    }
  }
  return Array.from(invalid);
};

export function parseFASTAEntries(text: string, sequenceType: SequenceType = "protein"): FASTAEntry[] {
  if (!text || typeof text !== "string") {
    return [];
  }

  const entries: FASTAEntry[] = [];
  const lines = text.split(/\r?\n/);
  let currentHeader: string | null = null;
  let sequenceLines: string[] = [];

  const addEntry = () => {
    if (sequenceLines.length === 0) return;

    const normalized = normalizeSequence(sequenceLines.join(""), sequenceType);
    if (!normalized) {
      sequenceLines = [];
      return;
    }

    const index = entries.length + 1;
    const header = currentHeader && currentHeader.length > 0 ? currentHeader : `Sequence ${index}`;
    entries.push({ header, sequence: normalized });
    sequenceLines = [];
  };

  for (const line of lines) {
    if (line.startsWith(">")) {
      addEntry();
      currentHeader = line.slice(1).trim();
    } else if (line.trim() !== "") {
      sequenceLines.push(line.trim());
    }
  }

  addEntry();

  if (entries.length === 0) {
    const normalized = normalizeSequence(text, sequenceType);
    if (normalized) {
      entries.push({ header: "Sequence 1", sequence: normalized });
    }
  }

  return entries.map((entry, index) => ({
    header: entry.header || `Sequence ${index + 1}`,
    sequence: entry.sequence,
  }));
}

export function validateSequence(sequence: string, name: string, sequenceType: SequenceType = "protein"): ValidationResult {
  if (!sequence) {
    return { isValid: false, message: `${name} sequence is empty.` };
  }

  if (sequence.length > MAX_SEQUENCE_LENGTH) {
    return {
      isValid: false,
      message: `${name} sequence is too long (${sequence.length} > ${MAX_SEQUENCE_LENGTH}).`,
    };
  }

  const normalized = normalizeSequence(sequence, sequenceType);
  const invalidChars = collectInvalidCharacters(normalized, sequenceType);

  if (invalidChars.length > 0) {
    return {
      isValid: false,
      message:
        sequenceType === "protein"
          ? `${name} sequence contains invalid characters (${invalidChars.join(", ")}). Only standard amino acids (ACDEFGHIKLMNPQRSTVWYBXZ*-) are allowed.`
          : `${name} sequence contains invalid characters (${invalidChars.join(", ")}). Only standard nucleotides (ACGTRYSWKMBDHVN-) are allowed.`,
    };
  }

  return { isValid: true, message: "" };
}

export function compareSequences(
  refSeq: string,
  querySeq: string,
  sequenceType: SequenceType = "protein"
): ComparisonData {
  const reference = normalizeSequence(refSeq, sequenceType);
  const query = normalizeSequence(querySeq, sequenceType);
  const differences: string[] = [];
  const residues: number[] = [];
  let matches = 0;

  const maxLen = Math.max(reference.length, query.length);

  for (let i = 0; i < maxLen; i++) {
    const refChar = i < reference.length ? reference[i] : "-";
    const queryChar = i < query.length ? query[i] : "-";

    if (refChar !== queryChar) {
      differences.push(`${refChar}${i + 1}${queryChar}`);
      residues.push(i + 1);
    } else if (refChar !== "-") {
      matches++;
    }
  }

  const identity = maxLen > 0 ? (matches / maxLen) * 100 : 0;

  return {
    differences,
    residues,
    identity,
  };
}

export function multiSequenceAlignment(
  sequences: FASTAEntry[],
  sequenceType: SequenceType = "protein"
): Array<{ header: string; sequence: string }> {
  if (sequences.length === 0) return [];

  const normalizedSequences = sequences.map((seq) => ({
    header: seq.header,
    sequence: normalizeSequence(seq.sequence, sequenceType),
  }));

  const maxLen = Math.max(...normalizedSequences.map((s) => s.sequence.length));

  return normalizedSequences.map((seq) => ({
    header: seq.header,
    sequence: seq.sequence.padEnd(maxLen, "-"),
  }));
}
