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
  sire_sire_sire?: Ancestor;
  sire_sire_dam?: Ancestor;
  sire_dam_sire?: Ancestor;
  sire_dam_dam?: Ancestor;
  dam_sire_sire?: Ancestor;
  dam_sire_dam?: Ancestor;
  dam_dam_sire?: Ancestor;
  dam_dam_dam?: Ancestor;
}

interface AncestorNode {
  name: string;
  registration?: string;
  generation: number;
  path: string; // 'sire' or 'dam' side
}

/**
 * Normalize ancestor name for comparison
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-zA-Z0-9æøåäö]/g, ' ')
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
 * Build ancestor list from pedigree data with generation info
 */
function buildAncestorList(pedigree: PedigreeData, side: 'sire' | 'dam'): AncestorNode[] {
  const ancestors: AncestorNode[] = [];
  
  if (side === 'sire') {
    // Generation 1
    if (pedigree.sire?.name) {
      ancestors.push({ name: pedigree.sire.name, registration: pedigree.sire.registration, generation: 1, path: 'sire' });
    }
    // Generation 2
    if (pedigree.sire_sire?.name) {
      ancestors.push({ name: pedigree.sire_sire.name, registration: pedigree.sire_sire.registration, generation: 2, path: 'sire' });
    }
    if (pedigree.sire_dam?.name) {
      ancestors.push({ name: pedigree.sire_dam.name, registration: pedigree.sire_dam.registration, generation: 2, path: 'sire' });
    }
    // Generation 3
    if (pedigree.sire_sire_sire?.name) {
      ancestors.push({ name: pedigree.sire_sire_sire.name, registration: pedigree.sire_sire_sire.registration, generation: 3, path: 'sire' });
    }
    if (pedigree.sire_sire_dam?.name) {
      ancestors.push({ name: pedigree.sire_sire_dam.name, registration: pedigree.sire_sire_dam.registration, generation: 3, path: 'sire' });
    }
    if (pedigree.sire_dam_sire?.name) {
      ancestors.push({ name: pedigree.sire_dam_sire.name, registration: pedigree.sire_dam_sire.registration, generation: 3, path: 'sire' });
    }
    if (pedigree.sire_dam_dam?.name) {
      ancestors.push({ name: pedigree.sire_dam_dam.name, registration: pedigree.sire_dam_dam.registration, generation: 3, path: 'sire' });
    }
  } else {
    // Generation 1
    if (pedigree.dam?.name) {
      ancestors.push({ name: pedigree.dam.name, registration: pedigree.dam.registration, generation: 1, path: 'dam' });
    }
    // Generation 2
    if (pedigree.dam_sire?.name) {
      ancestors.push({ name: pedigree.dam_sire.name, registration: pedigree.dam_sire.registration, generation: 2, path: 'dam' });
    }
    if (pedigree.dam_dam?.name) {
      ancestors.push({ name: pedigree.dam_dam.name, registration: pedigree.dam_dam.registration, generation: 2, path: 'dam' });
    }
    // Generation 3
    if (pedigree.dam_sire_sire?.name) {
      ancestors.push({ name: pedigree.dam_sire_sire.name, registration: pedigree.dam_sire_sire.registration, generation: 3, path: 'dam' });
    }
    if (pedigree.dam_sire_dam?.name) {
      ancestors.push({ name: pedigree.dam_sire_dam.name, registration: pedigree.dam_sire_dam.registration, generation: 3, path: 'dam' });
    }
    if (pedigree.dam_dam_sire?.name) {
      ancestors.push({ name: pedigree.dam_dam_sire.name, registration: pedigree.dam_dam_sire.registration, generation: 3, path: 'dam' });
    }
    if (pedigree.dam_dam_dam?.name) {
      ancestors.push({ name: pedigree.dam_dam_dam.name, registration: pedigree.dam_dam_dam.registration, generation: 3, path: 'dam' });
    }
  }
  
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
 * Special cases:
 * - Parent-child mating: 25% (one parent is the common ancestor at generation 0 on one side)
 * - Full sibling mating: 25% (share both parents)
 * - Half sibling mating: 12.5% (share one parent)
 * - Grandparent-grandchild: 12.5%
 */
export function calculateCOI(
  sirePedigree: PedigreeData,
  damPedigree: PedigreeData
): { coi: number; commonAncestors: CommonAncestor[] } {
  const commonAncestors: CommonAncestor[] = [];
  let totalCOI = 0;
  
  // Special case: Check if dam IS the sire's mother (son-mother mating)
  // In this case, dam appears at generation 0 on dam side and generation 1 on sire side
  if (sirePedigree.dam?.name && damPedigree.name) {
    if (isSameAncestor(sirePedigree.dam, { name: damPedigree.name, registration: damPedigree.registration })) {
      // Mother-son mating: F = (1/2)^(1+0+1) = 0.25
      const contribution = Math.pow(0.5, 1 + 0 + 1);
      commonAncestors.push({
        name: damPedigree.name,
        sireGenerations: [1],
        damGenerations: [0],
        contribution
      });
      totalCOI += contribution;
    }
  }
  
  // Special case: Check if sire IS the dam's father (father-daughter mating)
  if (damPedigree.sire?.name && sirePedigree.name) {
    if (isSameAncestor(damPedigree.sire, { name: sirePedigree.name, registration: sirePedigree.registration })) {
      // Father-daughter mating: F = (1/2)^(0+1+1) = 0.25
      const contribution = Math.pow(0.5, 0 + 1 + 1);
      commonAncestors.push({
        name: sirePedigree.name,
        sireGenerations: [0],
        damGenerations: [1],
        contribution
      });
      totalCOI += contribution;
    }
  }
  
  // Build ancestor lists from both pedigrees
  const sireAncestors = buildAncestorList(sirePedigree, 'sire');
  const damAncestors = buildAncestorList(damPedigree, 'dam');
  
  // Also include dam's ancestors on dam side
  const damFullAncestors: AncestorNode[] = [
    ...damAncestors,
    ...buildAncestorList(damPedigree, 'sire').map(a => ({ ...a, path: 'dam' as const }))
  ];
  
  // Include sire's ancestors on sire side  
  const sireFullAncestors: AncestorNode[] = [
    ...sireAncestors,
    ...buildAncestorList(sirePedigree, 'dam').map(a => ({ ...a, path: 'sire' as const }))
  ];
  
  // Find common ancestors between sire's pedigree and dam's pedigree
  const processedPairs = new Set<string>();
  
  for (const sireAnc of sireFullAncestors) {
    for (const damAnc of damFullAncestors) {
      if (isSameAncestor({ name: sireAnc.name, registration: sireAnc.registration }, 
                          { name: damAnc.name, registration: damAnc.registration })) {
        const pairKey = normalizeName(sireAnc.name) + '|' + sireAnc.generation + '|' + damAnc.generation;
        
        if (!processedPairs.has(pairKey)) {
          processedPairs.add(pairKey);
          
          // Wright's formula: F = Σ (1/2)^(n1+n2+1)
          // n1 = number of generations from sire to common ancestor
          // n2 = number of generations from dam to common ancestor
          // The generation stored is already the distance from sire/dam to the ancestor
          // We add +1 to account for the path from offspring to sire/dam
          const n1 = sireAnc.generation; // generations from sire to common ancestor
          const n2 = damAnc.generation;  // generations from dam to common ancestor
          
          // Total path: offspring -> sire (1) -> ... -> common ancestor (n1)
          //             offspring -> dam (1) -> ... -> common ancestor (n2)
          // Formula: (1/2)^(n1 + n2 + 1) where n1 and n2 are from parent to ancestor
          const contribution = Math.pow(0.5, n1 + n2 + 1);
          
          // Check if already added
          const existing = commonAncestors.find(ca => normalizeName(ca.name) === normalizeName(sireAnc.name));
          if (existing) {
            existing.sireGenerations.push(n1);
            existing.damGenerations.push(n2);
            existing.contribution += contribution;
          } else {
            commonAncestors.push({
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
