export const catalogVersion = "starter-1.0";
export type Chapter = {
  id: string;
  title: string;
  subject: string;
  grade: 11 | 12;
  topics: string[];
  objective: string;
  notes: string;
};
export const chapters: Chapter[] = [
  {
    id: "work-energy",
    title: "Work, Energy and Power",
    subject: "Physics",
    grade: 11,
    topics: ["Work", "Kinetic energy", "Conservation"],
    objective: "Connect net work with changes in kinetic energy.",
    notes:
      "For a constant force, W = F s cos θ. Net work equals the change in kinetic energy: W(net) = Δ(½mv²). For conservative forces, W = −ΔU. If only conservative forces act, K + U stays constant. Check whether external work or dissipation changes the mechanical energy before using conservation.",
  },
  {
    id: "mole",
    title: "Some Basic Concepts of Chemistry",
    subject: "Chemistry",
    grade: 11,
    topics: ["Moles", "Stoichiometry", "Limiting reagent"],
    objective:
      "Translate mass into chemical amounts and use balanced equations.",
    notes:
      "Amount n = mass / molar mass. Particle count N = n × Nₐ. A balanced chemical equation gives mole ratios, not mass ratios. Compare available moles divided by stoichiometric coefficients to identify the limiting reactant. Use that reactant to calculate the theoretical product.",
  },
  {
    id: "binomial",
    title: "Binomial Theorem",
    subject: "Mathematics",
    grade: 11,
    topics: ["General term", "Coefficients", "Middle terms"],
    objective:
      "Find coefficients and individual terms without expanding every term.",
    notes:
      "For nonnegative integer n, (a+b)ⁿ = Σ C(n,r)aⁿ⁻ʳbʳ, r = 0…n. The (r+1)th term uses index r. To find a coefficient of xᵏ, equate the total power of x to k. The sum of coefficients of a polynomial P(x) is P(1).",
  },
  {
    id: "cells",
    title: "Cell: The Unit of Life",
    subject: "Biology",
    grade: 11,
    topics: ["Organelles", "Membranes", "Prokaryotes"],
    objective: "Relate cell structures to their functions.",
    notes:
      "Cell membranes regulate transport. Ribosomes synthesize proteins. Mitochondria participate in aerobic ATP production. Prokaryotic cells lack a membrane-bound nucleus; eukaryotic cells possess one. Plant cells have a cell wall and often a large central vacuole. Avoid assuming every eukaryotic cell contains every organelle.",
  },
  {
    id: "electrostatics",
    title: "Electric Charges and Fields",
    subject: "Physics",
    grade: 12,
    topics: ["Coulomb force", "Superposition", "Electric field"],
    objective: "Calculate fields and forces with consistent directions.",
    notes:
      "Coulomb force magnitude is k|q₁q₂|/r². Electric field is force per unit positive test charge: E = F/q. Add fields as vectors. Doubling separation reduces the point-charge field to one quarter. The field direction points away from positive charges and toward negative charges.",
  },
  {
    id: "solutions",
    title: "Solutions",
    subject: "Chemistry",
    grade: 12,
    topics: ["Concentration", "Molarity", "Dilution"],
    objective: "Calculate concentration using solution volume.",
    notes:
      "Molarity M = moles of solute / litres of solution. For dilution without reaction, M₁V₁ = M₂V₂. Molarity depends on temperature because volume can change. Molality uses kilograms of solvent instead. Distinguish solution mass from solvent mass.",
  },
];
export const tracks = ["JEE Main", "JEE Advanced", "NEET"] as const;
export function trackChapters(track: string) {
  return chapters.filter((c) =>
    track === "NEET" ? c.subject !== "Mathematics" : c.subject !== "Biology",
  );
}
