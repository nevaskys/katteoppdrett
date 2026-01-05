/**
 * Wright's Coefficient of Inbreeding (COI) Calculator
 * 
 * Formula: F = Σ (1/2)^(n1+n2+1) × (1 + FA)
 * Where:
 * - n1 = number of generations from sire to common ancestor
 * - n2 = number of generations from dam to common ancestor
 * - FA = inbreeding coefficient of the common ancestor (usually 0 if unknown)
 */

export interface Ancestor {
  name: string;
  registration?: string;
}

export interface PedigreeData {
  name?: string;
  registration?: string;
  sire?: Ancestor;
  dam?: Ancestor;
  sire_sire?: Ancestor;
  sire_dam?: Ancestor;
  dam_sire?: Ancestor;
  dam_dam?: Ancestor;
  // Generation 3
  sire_sire_sire?: Ancestor;
  sire_sire_dam?: Ancestor;
  sire_dam_sire?: Ancestor;
  sire_dam_dam?: Ancestor;
  dam_sire_sire?: Ancestor;
  dam_sire_dam?: Ancestor;
  dam_dam_sire?: Ancestor;
  dam_dam_dam?: Ancestor;
  // Generation 4
  sire_sire_sire_sire?: Ancestor;
  sire_sire_sire_dam?: Ancestor;
  sire_sire_dam_sire?: Ancestor;
  sire_sire_dam_dam?: Ancestor;
  sire_dam_sire_sire?: Ancestor;
  sire_dam_sire_dam?: Ancestor;
  sire_dam_dam_sire?: Ancestor;
  sire_dam_dam_dam?: Ancestor;
  dam_sire_sire_sire?: Ancestor;
  dam_sire_sire_dam?: Ancestor;
  dam_sire_dam_sire?: Ancestor;
  dam_sire_dam_dam?: Ancestor;
  dam_dam_sire_sire?: Ancestor;
  dam_dam_sire_dam?: Ancestor;
  dam_dam_dam_sire?: Ancestor;
  dam_dam_dam_dam?: Ancestor;
}

interface AncestorNode {
  name: string;
  registration?: string;
  generation: number; // Distance from the cat whose pedigree this is
}

/**
 * Normalize ancestor name for comparison
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[`´']/g, "'") // Normalize apostrophes
    .replace(/[^a-zA-Z0-9æøåäö']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if two ancestors are the same individual
 */
function isSameAncestor(a: Ancestor | undefined, b: Ancestor | undefined): boolean {
  if (!a || !b) return false;
  
  // If both have registration numbers, compare those
  if (a.registration && b.registration) {
    const regA = a.registration.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const regB = b.registration.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    if (regA === regB) return true;
  }
  
  // Compare names
  const nameA = normalizeName(a.name);
  const nameB = normalizeName(b.name);
  
  // Exact match
  if (nameA === nameB) return true;
  
  // Check if one contains the other (for abbreviated names)
  if (nameA.length > 5 && nameB.length > 5) {
    if (nameA.includes(nameB) || nameB.includes(nameA)) return true;
  }
  
  return false;
}

/**
 * Build complete ancestor list from a cat's pedigree
 * Returns all ancestors with their generation distance from the cat
 */
function buildAllAncestors(pedigree: PedigreeData): AncestorNode[] {
  const ancestors: AncestorNode[] = [];
  
  const addAncestor = (ancestor: Ancestor | undefined, generation: number) => {
    if (ancestor?.name) {
      ancestors.push({ name: ancestor.name, registration: ancestor.registration, generation });
    }
  };
  
  // Generation 1 (parents)
  addAncestor(pedigree.sire, 1);
  addAncestor(pedigree.dam, 1);
  
  // Generation 2 (grandparents)
  addAncestor(pedigree.sire_sire, 2);
  addAncestor(pedigree.sire_dam, 2);
  addAncestor(pedigree.dam_sire, 2);
  addAncestor(pedigree.dam_dam, 2);
  
  // Generation 3 (great-grandparents)
  addAncestor(pedigree.sire_sire_sire, 3);
  addAncestor(pedigree.sire_sire_dam, 3);
  addAncestor(pedigree.sire_dam_sire, 3);
  addAncestor(pedigree.sire_dam_dam, 3);
  addAncestor(pedigree.dam_sire_sire, 3);
  addAncestor(pedigree.dam_sire_dam, 3);
  addAncestor(pedigree.dam_dam_sire, 3);
  addAncestor(pedigree.dam_dam_dam, 3);
  
  // Generation 4 (great-great-grandparents)
  addAncestor(pedigree.sire_sire_sire_sire, 4);
  addAncestor(pedigree.sire_sire_sire_dam, 4);
  addAncestor(pedigree.sire_sire_dam_sire, 4);
  addAncestor(pedigree.sire_sire_dam_dam, 4);
  addAncestor(pedigree.sire_dam_sire_sire, 4);
  addAncestor(pedigree.sire_dam_sire_dam, 4);
  addAncestor(pedigree.sire_dam_dam_sire, 4);
  addAncestor(pedigree.sire_dam_dam_dam, 4);
  addAncestor(pedigree.dam_sire_sire_sire, 4);
  addAncestor(pedigree.dam_sire_sire_dam, 4);
  addAncestor(pedigree.dam_sire_dam_sire, 4);
  addAncestor(pedigree.dam_sire_dam_dam, 4);
  addAncestor(pedigree.dam_dam_sire_sire, 4);
  addAncestor(pedigree.dam_dam_sire_dam, 4);
  addAncestor(pedigree.dam_dam_dam_sire, 4);
  addAncestor(pedigree.dam_dam_dam_dam, 4);
  
  return ancestors;
}

export interface CommonAncestor {
  name: string;
  sireGenerations: number[];
  damGenerations: number[];
  contribution: number;
}

/**
 * Calculate COI for offspring of two cats
 * 
 * sirePedigree = pedigree of the MALE (father of potential offspring)
 * damPedigree = pedigree of the FEMALE (mother of potential offspring)
 * 
 * We look for common ancestors between the two pedigrees.
 * 
 * Wright's Formula: F = Σ (1/2)^(n1+n2+1)
 * Where n1 = generations from SIRE to common ancestor
 *       n2 = generations from DAM to common ancestor
 */
export function calculateCOI(
  sirePedigree: PedigreeData,
  damPedigree: PedigreeData
): { coi: number; commonAncestors: CommonAncestor[] } {
  const commonAncestorsMap = new Map<string, CommonAncestor>();
  let totalCOI = 0;
  
  // Build ancestor lists for both parents
  const sireAncestors = buildAllAncestors(sirePedigree);
  const damAncestors = buildAllAncestors(damPedigree);
  
  console.log('Sire ancestors:', sireAncestors.map(a => `${a.name} (gen ${a.generation})`));
  console.log('Dam ancestors:', damAncestors.map(a => `${a.name} (gen ${a.generation})`));
  
  // Track processed path pairs to avoid double counting
  const processedPairs = new Set<string>();
  
  // Find common ancestors
  for (const sireAnc of sireAncestors) {
    for (const damAnc of damAncestors) {
      if (isSameAncestor(
        { name: sireAnc.name, registration: sireAnc.registration }, 
        { name: damAnc.name, registration: damAnc.registration }
      )) {
        // Create unique key for this specific path combination
        const pairKey = `${normalizeName(sireAnc.name)}|${sireAnc.generation}|${damAnc.generation}`;
        
        if (!processedPairs.has(pairKey)) {
          processedPairs.add(pairKey);
          
          // n1 = generations from sire to common ancestor
          // n2 = generations from dam to common ancestor
          const n1 = sireAnc.generation;
          const n2 = damAnc.generation;
          
          // Wright's formula: F = (1/2)^(n1+n2+1)
          const contribution = Math.pow(0.5, n1 + n2 + 1);
          
          console.log(`Common ancestor: ${sireAnc.name}, n1=${n1}, n2=${n2}, contribution=${(contribution * 100).toFixed(4)}%`);
          
          // Aggregate by ancestor name
          const normalizedName = normalizeName(sireAnc.name);
          const existing = commonAncestorsMap.get(normalizedName);
          
          if (existing) {
            existing.sireGenerations.push(n1);
            existing.damGenerations.push(n2);
            existing.contribution += contribution;
          } else {
            commonAncestorsMap.set(normalizedName, {
              name: sireAnc.name,
              sireGenerations: [n1],
              damGenerations: [n2],
              contribution
            });
          }
          
          totalCOI += contribution;
        }
      }
    }
  }
  
  const commonAncestors = Array.from(commonAncestorsMap.values());
  
  console.log(`Total COI: ${(totalCOI * 100).toFixed(4)}%`);
  console.log('Common ancestors found:', commonAncestors);
  
  return {
    coi: totalCOI * 100, // Convert to percentage
    commonAncestors
  };
}

/**
 * Get risk level description for COI
 */
export function getCOIRiskLevel(coi: number): {
  level: 'low' | 'moderate' | 'high' | 'very-high';
  color: string;
  description: string;
} {
  if (coi < 3) {
    return { level: 'low', color: 'text-green-500', description: 'Lav innavelsgrad ✓' };
  } else if (coi < 6.25) {
    return { level: 'moderate', color: 'text-yellow-500', description: 'Moderat innavelsgrad' };
  } else if (coi < 12.5) {
    return { level: 'high', color: 'text-orange-500', description: 'Høy innavelsgrad ⚠' };
  } else {
    return { level: 'very-high', color: 'text-red-500', description: 'Svært høy innavelsgrad ⚠⚠' };
  }
}
