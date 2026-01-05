/**
 * Wright's Coefficient of Inbreeding (COI) Calculator
 * According to FIFe breeding regulations
 * 
 * Formula: COI = Σ (1/2)^(n1 + n2 + 1) × (1 + FA)
 * Where:
 * - n1 = number of generations from sire to common ancestor
 * - n2 = number of generations from dam to common ancestor
 * - FA = inbreeding coefficient of the common ancestor (0 if unknown)
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
  // Generation 5
  sire_sire_sire_sire_sire?: Ancestor;
  sire_sire_sire_sire_dam?: Ancestor;
  sire_sire_sire_dam_sire?: Ancestor;
  sire_sire_sire_dam_dam?: Ancestor;
  sire_sire_dam_sire_sire?: Ancestor;
  sire_sire_dam_sire_dam?: Ancestor;
  sire_sire_dam_dam_sire?: Ancestor;
  sire_sire_dam_dam_dam?: Ancestor;
  sire_dam_sire_sire_sire?: Ancestor;
  sire_dam_sire_sire_dam?: Ancestor;
  sire_dam_sire_dam_sire?: Ancestor;
  sire_dam_sire_dam_dam?: Ancestor;
  sire_dam_dam_sire_sire?: Ancestor;
  sire_dam_dam_sire_dam?: Ancestor;
  sire_dam_dam_dam_sire?: Ancestor;
  sire_dam_dam_dam_dam?: Ancestor;
  dam_sire_sire_sire_sire?: Ancestor;
  dam_sire_sire_sire_dam?: Ancestor;
  dam_sire_sire_dam_sire?: Ancestor;
  dam_sire_sire_dam_dam?: Ancestor;
  dam_sire_dam_sire_sire?: Ancestor;
  dam_sire_dam_sire_dam?: Ancestor;
  dam_sire_dam_dam_sire?: Ancestor;
  dam_sire_dam_dam_dam?: Ancestor;
  dam_dam_sire_sire_sire?: Ancestor;
  dam_dam_sire_sire_dam?: Ancestor;
  dam_dam_sire_dam_sire?: Ancestor;
  dam_dam_sire_dam_dam?: Ancestor;
  dam_dam_dam_sire_sire?: Ancestor;
  dam_dam_dam_sire_dam?: Ancestor;
  dam_dam_dam_dam_sire?: Ancestor;
  dam_dam_dam_dam_dam?: Ancestor;
}

interface AncestorWithPath {
  name: string;
  registration?: string;
  generation: number; // Distance from the parent (sire=0 or dam=0), so from offspring: generation + 1
  path: string; // e.g., "sire_sire_dam" for tracking unique paths
}

/**
 * Normalize ancestor name for comparison
 */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[`´']/g, "'")
    .replace(/[@]/g, '*')
    .replace(/[^a-zA-Z0-9æøåäö'*]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if two ancestors are the same individual
 */
function isSameAncestor(a: Ancestor | undefined, b: Ancestor | undefined): boolean {
  if (!a || !b) return false;
  if (!a.name || !b.name) return false;
  
  // If both have registration numbers, compare those
  if (a.registration && b.registration) {
    const regA = a.registration.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const regB = b.registration.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    if (regA === regB && regA.length > 3) return true;
  }
  
  // Compare normalized names
  const nameA = normalizeName(a.name);
  const nameB = normalizeName(b.name);
  
  if (nameA === nameB) return true;
  
  // Check if one contains the other (for abbreviated names)
  if (nameA.length > 8 && nameB.length > 8) {
    if (nameA.includes(nameB) || nameB.includes(nameA)) return true;
  }
  
  return false;
}

/**
 * Build a complete ancestor list from a pedigree with path tracking
 * Each ancestor includes their generation (0 = the parent itself, 1 = grandparent, etc.)
 * and a unique path identifier
 */
function buildAncestorList(pedigree: PedigreeData, side: 'sire' | 'dam'): AncestorWithPath[] {
  const ancestors: AncestorWithPath[] = [];
  
  const addIfExists = (ancestor: Ancestor | undefined, gen: number, path: string) => {
    if (ancestor?.name) {
      ancestors.push({
        name: ancestor.name,
        registration: ancestor.registration,
        generation: gen,
        path: path
      });
    }
  };
  
  // NOTE: We start from generation 1 (the parent's parents = grandparents of offspring)
  // We do NOT include the parent itself at generation 0.
  // This is because Wright's formula counts common ANCESTORS, not the parents.
  // The sire and dam are already "accounted for" at n=1 for their offspring.
  // Their contribution comes through their ancestors appearing on both sides.
  
  // Generation 1: Parent's parents (grandparents of the potential offspring)
  addIfExists(pedigree.sire, 1, `${side}_sire`);
  addIfExists(pedigree.dam, 1, `${side}_dam`);
  
  // Generation 2: Great-grandparents
  addIfExists(pedigree.sire_sire, 2, `${side}_sire_sire`);
  addIfExists(pedigree.sire_dam, 2, `${side}_sire_dam`);
  addIfExists(pedigree.dam_sire, 2, `${side}_dam_sire`);
  addIfExists(pedigree.dam_dam, 2, `${side}_dam_dam`);
  
  // Generation 3: Great-great-grandparents
  addIfExists(pedigree.sire_sire_sire, 3, `${side}_sire_sire_sire`);
  addIfExists(pedigree.sire_sire_dam, 3, `${side}_sire_sire_dam`);
  addIfExists(pedigree.sire_dam_sire, 3, `${side}_sire_dam_sire`);
  addIfExists(pedigree.sire_dam_dam, 3, `${side}_sire_dam_dam`);
  addIfExists(pedigree.dam_sire_sire, 3, `${side}_dam_sire_sire`);
  addIfExists(pedigree.dam_sire_dam, 3, `${side}_dam_sire_dam`);
  addIfExists(pedigree.dam_dam_sire, 3, `${side}_dam_dam_sire`);
  addIfExists(pedigree.dam_dam_dam, 3, `${side}_dam_dam_dam`);
  
  // Generation 4
  addIfExists(pedigree.sire_sire_sire_sire, 4, `${side}_sire_sire_sire_sire`);
  addIfExists(pedigree.sire_sire_sire_dam, 4, `${side}_sire_sire_sire_dam`);
  addIfExists(pedigree.sire_sire_dam_sire, 4, `${side}_sire_sire_dam_sire`);
  addIfExists(pedigree.sire_sire_dam_dam, 4, `${side}_sire_sire_dam_dam`);
  addIfExists(pedigree.sire_dam_sire_sire, 4, `${side}_sire_dam_sire_sire`);
  addIfExists(pedigree.sire_dam_sire_dam, 4, `${side}_sire_dam_sire_dam`);
  addIfExists(pedigree.sire_dam_dam_sire, 4, `${side}_sire_dam_dam_sire`);
  addIfExists(pedigree.sire_dam_dam_dam, 4, `${side}_sire_dam_dam_dam`);
  addIfExists(pedigree.dam_sire_sire_sire, 4, `${side}_dam_sire_sire_sire`);
  addIfExists(pedigree.dam_sire_sire_dam, 4, `${side}_dam_sire_sire_dam`);
  addIfExists(pedigree.dam_sire_dam_sire, 4, `${side}_dam_sire_dam_sire`);
  addIfExists(pedigree.dam_sire_dam_dam, 4, `${side}_dam_sire_dam_dam`);
  addIfExists(pedigree.dam_dam_sire_sire, 4, `${side}_dam_dam_sire_sire`);
  addIfExists(pedigree.dam_dam_sire_dam, 4, `${side}_dam_dam_sire_dam`);
  addIfExists(pedigree.dam_dam_dam_sire, 4, `${side}_dam_dam_dam_sire`);
  addIfExists(pedigree.dam_dam_dam_dam, 4, `${side}_dam_dam_dam_dam`);
  
  // Generation 5
  addIfExists(pedigree.sire_sire_sire_sire_sire, 5, `${side}_sire_sire_sire_sire_sire`);
  addIfExists(pedigree.sire_sire_sire_sire_dam, 5, `${side}_sire_sire_sire_sire_dam`);
  addIfExists(pedigree.sire_sire_sire_dam_sire, 5, `${side}_sire_sire_sire_dam_sire`);
  addIfExists(pedigree.sire_sire_sire_dam_dam, 5, `${side}_sire_sire_sire_dam_dam`);
  addIfExists(pedigree.sire_sire_dam_sire_sire, 5, `${side}_sire_sire_dam_sire_sire`);
  addIfExists(pedigree.sire_sire_dam_sire_dam, 5, `${side}_sire_sire_dam_sire_dam`);
  addIfExists(pedigree.sire_sire_dam_dam_sire, 5, `${side}_sire_sire_dam_dam_sire`);
  addIfExists(pedigree.sire_sire_dam_dam_dam, 5, `${side}_sire_sire_dam_dam_dam`);
  addIfExists(pedigree.sire_dam_sire_sire_sire, 5, `${side}_sire_dam_sire_sire_sire`);
  addIfExists(pedigree.sire_dam_sire_sire_dam, 5, `${side}_sire_dam_sire_sire_dam`);
  addIfExists(pedigree.sire_dam_sire_dam_sire, 5, `${side}_sire_dam_sire_dam_sire`);
  addIfExists(pedigree.sire_dam_sire_dam_dam, 5, `${side}_sire_dam_sire_dam_dam`);
  addIfExists(pedigree.sire_dam_dam_sire_sire, 5, `${side}_sire_dam_dam_sire_sire`);
  addIfExists(pedigree.sire_dam_dam_sire_dam, 5, `${side}_sire_dam_dam_sire_dam`);
  addIfExists(pedigree.sire_dam_dam_dam_sire, 5, `${side}_sire_dam_dam_dam_sire`);
  addIfExists(pedigree.sire_dam_dam_dam_dam, 5, `${side}_sire_dam_dam_dam_dam`);
  addIfExists(pedigree.dam_sire_sire_sire_sire, 5, `${side}_dam_sire_sire_sire_sire`);
  addIfExists(pedigree.dam_sire_sire_sire_dam, 5, `${side}_dam_sire_sire_sire_dam`);
  addIfExists(pedigree.dam_sire_sire_dam_sire, 5, `${side}_dam_sire_sire_dam_sire`);
  addIfExists(pedigree.dam_sire_sire_dam_dam, 5, `${side}_dam_sire_sire_dam_dam`);
  addIfExists(pedigree.dam_sire_dam_sire_sire, 5, `${side}_dam_sire_dam_sire_sire`);
  addIfExists(pedigree.dam_sire_dam_sire_dam, 5, `${side}_dam_sire_dam_sire_dam`);
  addIfExists(pedigree.dam_sire_dam_dam_sire, 5, `${side}_dam_sire_dam_dam_sire`);
  addIfExists(pedigree.dam_sire_dam_dam_dam, 5, `${side}_dam_sire_dam_dam_dam`);
  addIfExists(pedigree.dam_dam_sire_sire_sire, 5, `${side}_dam_dam_sire_sire_sire`);
  addIfExists(pedigree.dam_dam_sire_sire_dam, 5, `${side}_dam_dam_sire_sire_dam`);
  addIfExists(pedigree.dam_dam_sire_dam_sire, 5, `${side}_dam_dam_sire_dam_sire`);
  addIfExists(pedigree.dam_dam_sire_dam_dam, 5, `${side}_dam_dam_sire_dam_dam`);
  addIfExists(pedigree.dam_dam_dam_sire_sire, 5, `${side}_dam_dam_dam_sire_sire`);
  addIfExists(pedigree.dam_dam_dam_sire_dam, 5, `${side}_dam_dam_dam_sire_dam`);
  addIfExists(pedigree.dam_dam_dam_dam_sire, 5, `${side}_dam_dam_dam_dam_sire`);
  addIfExists(pedigree.dam_dam_dam_dam_dam, 5, `${side}_dam_dam_dam_dam_dam`);
  
  return ancestors;
}

export interface CommonAncestor {
  name: string;
  paths: { sirePath: string; damPath: string; n1: number; n2: number; contribution: number }[];
  totalContribution: number;
}

/**
 * Calculate COI according to Wright's formula as used by FIFe
 * 
 * For each common ancestor found through different paths:
 * COI contribution = (1/2)^(n1 + n2 + 1) × (1 + FA)
 * 
 * Where:
 * - n1 = generations from offspring to common ancestor through sire's line
 * - n2 = generations from offspring to common ancestor through dam's line
 * - FA = inbreeding coefficient of common ancestor (assumed 0)
 * 
 * Generation numbering:
 * - Generation 1 = sire/dam's parents (offspring's grandparents)
 * - Generation 2 = sire/dam's grandparents (offspring's great-grandparents)
 * etc.
 * 
 * Example: If sire's father is also dam's father (half-siblings):
 * The common grandfather appears at gen=1 on both sides
 * n1=1, n2=1 → Contribution = (1/2)^(1+1+1) = (1/2)^3 = 12.5%
 */
export function calculateCOI(
  sirePedigree: PedigreeData,
  damPedigree: PedigreeData
): { coi: number; commonAncestors: CommonAncestor[] } {
  // Build ancestor lists
  // Generation = distance from the parent (sire or dam)
  // n1, n2 in Wright's formula = this generation value
  const sireAncestors = buildAncestorList(sirePedigree, 'sire');
  const damAncestors = buildAncestorList(damPedigree, 'dam');
  
  console.log('=== COI Calculation (FIFe/Wright) ===');
  console.log('Sire:', sirePedigree.name);
  console.log('Dam:', damPedigree.name);
  console.log('Sire ancestors:', sireAncestors.map(a => `${a.name} (gen ${a.generation}, ${a.path})`));
  console.log('Dam ancestors:', damAncestors.map(a => `${a.name} (gen ${a.generation}, ${a.path})`));
  
  const commonAncestorsMap = new Map<string, CommonAncestor>();
  const processedPathPairs = new Set<string>();
  let totalCOI = 0;
  
  // Find all common ancestors and their path combinations
  for (const sireAnc of sireAncestors) {
    for (const damAnc of damAncestors) {
      if (isSameAncestor(
        { name: sireAnc.name, registration: sireAnc.registration },
        { name: damAnc.name, registration: damAnc.registration }
      )) {
        // Create unique key for this specific path pair
        const pathPairKey = `${sireAnc.path}|${damAnc.path}`;
        
        if (!processedPathPairs.has(pathPairKey)) {
          processedPathPairs.add(pathPairKey);
          
          // n1 = generations from sire to common ancestor
          // n2 = generations from dam to common ancestor
          const n1 = sireAnc.generation;
          const n2 = damAnc.generation;
          
          // Wright's formula: (1/2)^(n1 + n2 + 1) × (1 + FA)
          // FA assumed 0 for now
          const contribution = Math.pow(0.5, n1 + n2 + 1);
          
          console.log(`Common ancestor: ${sireAnc.name}`);
          console.log(`  Sire path: ${sireAnc.path} (n1=${n1})`);
          console.log(`  Dam path: ${damAnc.path} (n2=${n2})`);
          console.log(`  Formula: (1/2)^(${n1}+${n2}+1) = (1/2)^${n1+n2+1} = ${(contribution * 100).toFixed(4)}%`);
          
          totalCOI += contribution;
          
          // Aggregate by normalized ancestor name
          const normalizedName = normalizeName(sireAnc.name);
          const existing = commonAncestorsMap.get(normalizedName);
          
          if (existing) {
            existing.paths.push({
              sirePath: sireAnc.path,
              damPath: damAnc.path,
              n1,
              n2,
              contribution
            });
            existing.totalContribution += contribution;
          } else {
            commonAncestorsMap.set(normalizedName, {
              name: sireAnc.name,
              paths: [{
                sirePath: sireAnc.path,
                damPath: damAnc.path,
                n1,
                n2,
                contribution
              }],
              totalContribution: contribution
            });
          }
        }
      }
    }
  }
  
  const commonAncestors = Array.from(commonAncestorsMap.values())
    .sort((a, b) => b.totalContribution - a.totalContribution);
  
  console.log('=================================');
  console.log(`Total COI: ${(totalCOI * 100).toFixed(2)}%`);
  console.log('Common ancestors summary:');
  for (const ca of commonAncestors) {
    console.log(`  ${ca.name}: ${(ca.totalContribution * 100).toFixed(2)}% (${ca.paths.length} path${ca.paths.length > 1 ? 's' : ''})`);
  }
  console.log('=================================');
  
  return {
    coi: totalCOI * 100,
    commonAncestors
  };
}

/**
 * Get risk level description for COI according to FIFe recommendations
 */
export function getCOIRiskLevel(coi: number): {
  level: 'low' | 'moderate' | 'high' | 'very-high';
  color: string;
  description: string;
} {
  if (coi < 5) {
    return { 
      level: 'low', 
      color: 'text-green-500', 
      description: 'Anbefalt nivå (< 5%)' 
    };
  } else if (coi < 10) {
    return { 
      level: 'moderate', 
      color: 'text-yellow-500', 
      description: 'Høy linjeavl (5-10%)' 
    };
  } else if (coi < 25) {
    return { 
      level: 'high', 
      color: 'text-orange-500', 
      description: 'Høy innavlsgrad (> 10%)' 
    };
  } else {
    return { 
      level: 'very-high', 
      color: 'text-red-500', 
      description: 'Svært høy innavlsgrad (≥ 25%)' 
    };
  }
}
