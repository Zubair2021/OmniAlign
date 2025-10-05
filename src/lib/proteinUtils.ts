// Molecular weight of amino acids (Da)
const MW_DATA: { [key: string]: number } = {
  A: 89.09, C: 121.15, D: 133.10, E: 147.13, F: 165.19,
  G: 75.07, H: 155.16, I: 131.17, K: 146.19, L: 131.17,
  M: 149.21, N: 132.12, P: 115.13, Q: 146.15, R: 174.20,
  S: 105.09, T: 119.12, V: 117.15, W: 204.23, Y: 181.19,
};

// pKa values for amino acids
const PKA_DATA: { [key: string]: { [key: string]: number } } = {
  C: { sidechain: 8.18 },
  D: { sidechain: 3.65 },
  E: { sidechain: 4.25 },
  H: { sidechain: 6.00 },
  K: { sidechain: 10.53 },
  R: { sidechain: 12.48 },
  Y: { sidechain: 10.07 },
};

// GRAVY (Grand Average of Hydropathy) values
const GRAVY_DATA: { [key: string]: number } = {
  A: 1.8, C: 2.5, D: -3.5, E: -3.5, F: 2.8,
  G: -0.4, H: -3.2, I: 4.5, K: -3.9, L: 3.8,
  M: 1.9, N: -3.5, P: -1.6, Q: -3.5, R: -4.5,
  S: -0.8, T: -0.7, V: 4.2, W: -0.9, Y: -1.3,
};

// Chou-Fasman parameters for secondary structure prediction
const HELIX_PROPENSITY: { [key: string]: number } = {
  A: 1.42, C: 0.70, D: 1.01, E: 1.51, F: 1.13,
  G: 0.57, H: 1.00, I: 1.08, K: 1.16, L: 1.21,
  M: 1.45, N: 0.67, P: 0.57, Q: 1.11, R: 0.98,
  S: 0.77, T: 0.83, V: 1.06, W: 1.08, Y: 0.69,
};

const SHEET_PROPENSITY: { [key: string]: number } = {
  A: 0.83, C: 1.19, D: 0.54, E: 0.37, F: 1.38,
  G: 0.75, H: 0.87, I: 1.60, K: 0.74, L: 1.30,
  M: 1.05, N: 0.89, P: 0.55, Q: 1.10, R: 0.93,
  S: 0.75, T: 1.19, V: 1.70, W: 1.37, Y: 1.47,
};

export interface ProteinProperties {
  molecularWeight: number;
  isoelectricPoint: number;
  gravy: number;
  instabilityIndex: number;
  netCharge: number;
}

export interface SecondaryStructure {
  helix: number;
  sheet: number;
  coil: number;
}

export function calculateProteinProperties(sequence: string): ProteinProperties {
  const cleanSeq = sequence.replace(/-/g, "");
  
  // Molecular Weight
  let molecularWeight = 0;
  for (const aa of cleanSeq) {
    molecularWeight += MW_DATA[aa] || 0;
  }
  molecularWeight -= (cleanSeq.length - 1) * 18.015; // Subtract water for peptide bonds

  // GRAVY score
  let gravySum = 0;
  for (const aa of cleanSeq) {
    gravySum += GRAVY_DATA[aa] || 0;
  }
  const gravy = gravySum / cleanSeq.length;

  // Simplified pI calculation (approximate)
  const isoelectricPoint = calculatePI(cleanSeq);

  // Instability Index (simplified version)
  const instabilityIndex = calculateInstabilityIndex(cleanSeq);

  // Net charge at pH 7
  const netCharge = calculateNetCharge(cleanSeq, 7.0);

  return {
    molecularWeight,
    isoelectricPoint,
    gravy,
    instabilityIndex,
    netCharge,
  };
}

function calculatePI(sequence: string): number {
  // Simplified pI calculation
  let positiveCount = 0;
  let negativeCount = 0;

  for (const aa of sequence) {
    if (aa === "K" || aa === "R" || aa === "H") positiveCount++;
    if (aa === "D" || aa === "E") negativeCount++;
  }

  // Very rough approximation
  const ratio = positiveCount / (negativeCount + 1);
  return 6.5 + (ratio - 1) * 2; // Crude estimate
}

function calculateInstabilityIndex(sequence: string): number {
  // Simplified instability index
  let score = 0;
  const unstableAA = ["P", "G"];
  
  for (const aa of sequence) {
    if (unstableAA.includes(aa)) score += 10;
  }
  
  return (score / sequence.length) * 100;
}

function calculateNetCharge(sequence: string, pH: number): number {
  let charge = 0;
  
  for (const aa of sequence) {
    if (aa === "K" || aa === "R") charge += 1;
    if (aa === "D" || aa === "E") charge -= 1;
    if (aa === "H" && pH < 6.5) charge += 0.5;
  }
  
  return charge;
}

export function predictSecondaryStructure(sequence: string): SecondaryStructure {
  const cleanSeq = sequence.replace(/-/g, "");
  let helixScore = 0;
  let sheetScore = 0;

  for (const aa of cleanSeq) {
    helixScore += HELIX_PROPENSITY[aa] || 1.0;
    sheetScore += SHEET_PROPENSITY[aa] || 1.0;
  }

  const helixAvg = helixScore / cleanSeq.length;
  const sheetAvg = sheetScore / cleanSeq.length;

  // Normalize to percentages (rough approximation)
  let helix = Math.max(0, (helixAvg - 0.9) * 60);
  let sheet = Math.max(0, (sheetAvg - 0.9) * 50);
  let coil = 100 - helix - sheet;

  // Ensure values are reasonable
  if (coil < 0) {
    const excess = -coil;
    helix = helix / (helix + sheet) * (100 - 20);
    sheet = sheet / (helix + sheet) * (100 - 20);
    coil = 20;
  }

  return {
    helix: Math.round(helix * 10) / 10,
    sheet: Math.round(sheet * 10) / 10,
    coil: Math.round(coil * 10) / 10,
  };
}
