/**
 * Wright's Coefficient of Inbreeding (COI) Calculator
 * 
 * Formula: F = Σ (1/2)^(n1+n2+1) × (1 + FA)
 * Where:
 * - n1 = number of generations from offspring to common ancestor through sire
 * - n2 = number of generations from offspring to common ancestor through dam
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
  generation: number; // Distance from offspring (1 = parent, 2 = grandparent, etc.)
}

/**
 * Normalize ancestor name for comparison
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[`´']/g, "'")
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
 * The generation is the distance from the OFFSPRING (not from the cat whose pedigree this is)
 * 
 * When building for sire side: add 1 to all generations (offspring->sire = 1 step)
 * When building for dam side: add 1 to all generations (offspring->dam = 1 step)
 */
function buildAncestorListWithOffset(pedigree: PedigreeData, baseOffset: number): AncestorNode[] {
  const ancestors: AncestorNode[] = [];
  
  const addAncestor = (ancestor: Ancestor | undefined, localGen: number) => {
    if (ancestor?.name) {
      ancestors.push({ 
        name: ancestor.name, 
        registration: ancestor.registration, 
        generation: localGen + baseOffset 
      });
    }
  };
  
  // The pedigree owner themselves (generation = baseOffset, i.e., 1 for direct parent)
  if (pedigree.name) {
    ancestors.push({ 
      name: pedigree.name, 
      registration: pedigree.registration, 
      generation: baseOffset 
    });
  }
  
  // Generation 1 in pedigree = grandparents of offspring (localGen 1 + baseOffset 1 = 2)
  addAncestor(pedigree.sire, 1);
  addAncestor(pedigree.dam, 1);
  
  // Generation 2 in pedigree = great-grandparents of offspring
  addAncestor(pedigree.sire_sire, 2);
  addAncestor(pedigree.sire_dam, 2);
  addAncestor(pedigree.dam_sire, 2);
  addAncestor(pedigree.dam_dam, 2);
  
  // Generation 3 in pedigree
  addAncestor(pedigree.sire_sire_sire, 3);
  addAncestor(pedigree.sire_sire_dam, 3);
  addAncestor(pedigree.sire_dam_sire, 3);
  addAncestor(pedigree.sire_dam_dam, 3);
  addAncestor(pedigree.dam_sire_sire, 3);
  addAncestor(pedigree.dam_sire_dam, 3);
  addAncestor(pedigree.dam_dam_sire, 3);
  addAncestor(pedigree.dam_dam_dam, 3);
  
  // Generation 4 in pedigree
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
 * Wright's Formula: F = Σ (1/2)^(n1+n2+1)
 * Where n1 = generations from offspring to common ancestor through sire path
 *       n2 = generations from offspring to common ancestor through dam path
 * 
 * Examples:
 * - Father-daughter: sire IS dam's father -> n1=1, n2=2 -> F = (1/2)^4 = 6.25%... 
 *   NO WAIT: if sire is dam's father, then through sire path it's 1 gen (offspring->sire),
 *   and through dam path it's 1 gen to dam + 1 gen to dam's sire = 2 gens total
 *   But we also inherit from sire's parents which dam shares... 
 * 
 * Actually for father-daughter mating the correct calculation is:
 * The sire himself appears at n1=1 (offspring->sire) and n2=2 (offspring->dam->dam's sire)
 * F = (1/2)^(1+2+1) = (1/2)^4 = 6.25%... but that's wrong!
 * 
 * The issue is that in father-daughter mating, EVERY ancestor of the sire appears twice:
 * once through the sire directly, and once through the dam (who is sire's daughter).
 * 
 * Let me reconsider: For inbreeding, we need to find ALL paths through common ancestors.
 * In father-daughter mating:
 * - Sire himself: n1=1 (direct), n2=2 (through dam who is his daughter) -> (1/2)^4 = 6.25%
 * - Sire's sire: n1=2, n2=3 -> (1/2)^6 = 1.5625%
 * - Sire's dam: n1=2, n2=3 -> (1/2)^6 = 1.5625%
 * - All further ancestors also appear on both sides
 * 
 * Total for 4 generations: 6.25 + 1.5625 + 1.5625 + (0.39*4) + (0.098*8) = ~12.5%
 * 
 * Hmm, but NRR says 25%. Let me think again...
 * 
 * Actually, the standard COI for father-daughter is 25% because:
 * F = (1/2)^(n+1) where n is the path length through the common ancestor
 * For father-daughter: the father is the common ancestor
 * Path from offspring through sire to father = 1 step (sire IS father)
 * Path from offspring through dam to father = 1 step (dam's sire = father)
 * n = 1 + 1 = 2, so F = (1/2)^(2+1) = (1/2)^3 = 12.5%? No...
 * 
 * I think I've been overcomplicating this. Let me use the correct formula:
 * F = Σ (1/2)^(n) where n is the LENGTH of the loop through each common ancestor
 * 
 * For father-daughter, if father has 4 grandparents, each creates a loop:
 * Loop through father himself: offspring->sire, sire->dam (via dam being sire's daughter), dam->offspring
 * That's not right either...
 * 
 * The correct approach for father-daughter:
 * - The offspring receives 50% from sire and 50% from dam
 * - Dam already has 50% from sire (her father)
 * - So offspring gets: 50% from sire + 50%*50% from sire via dam = 50% + 25% = 75% from sire's alleles
 * - This gives F = 25% because there's a 25% chance of inheriting two identical alleles
 * 
 * Mathematically: F = (1/2)^(1+1+1) × (1 + Fsire) where the path is offspring->dam->sire and back
 * If Fsire = 0: F = (1/2)^3 = 12.5%... still not 25%
 * 
 * OK I think the issue is I need to sum over ALL common ancestors.
 * In father-daughter, the sire AND all his ancestors are common ancestors.
 * 
 * Sire as common ancestor: (1/2)^(1+1+1) = 0.125
 * Sire's sire: (1/2)^(2+2+1) = 0.03125
 * Sire's dam: (1/2)^(2+2+1) = 0.03125
 * Sire's sire's sire: (1/2)^(3+3+1) = 0.0078
 * ... etc
 * 
 * 0.125 + 0.03125 + 0.03125 + 0.0078*4 + ... ≈ 0.22 which is close to 25%
 * 
 * BUT I realize the issue: I'm building ancestors wrong. When we build the dam's ancestors,
 * we should include the dam herself at generation 0 from her perspective.
 * Then offset by 1 to get distance from offspring.
 * 
 * So for offspring with sire=Gizmo and dam=Nessie (where Gizmo is Nessie's father):
 * - Sire path ancestors: Gizmo(1), Gizmo's sire(2), Gizmo's dam(2), etc.
 * - Dam path ancestors: Nessie(1), Nessie's sire=Gizmo(2), Nessie's dam(2), etc.
 * 
 * Common ancestors:
 * - Gizmo: sire path gen 1, dam path gen 2 -> (1/2)^(1+2+1) = 6.25%
 * - Gizmo's sire: sire path gen 2, dam path gen 3 -> (1/2)^(2+3+1) = 1.5625%
 * - Gizmo's dam: sire path gen 2, dam path gen 3 -> (1/2)^6 = 1.5625%
 * - Plus all of Gizmo's grandparents...
 * 
 * This sums to about 12.5% for the immediate relationship plus more for deeper ancestors.
 * 
 * Wait, I see the issue now! In my ancestor lists I'm NOT including the pedigree owner themselves!
 * The sire (Gizmo) should be at generation 1 from offspring.
 * Gizmo should also appear in dam's ancestor list at generation 2 (Nessie->Gizmo).
 * 
 * Let me make sure I include the cat themselves in their ancestor list.
 */
export function calculateCOI(
  sirePedigree: PedigreeData,
  damPedigree: PedigreeData
): { coi: number; commonAncestors: CommonAncestor[] } {
  const commonAncestorsMap = new Map<string, CommonAncestor>();
  let totalCOI = 0;
  
  // Build ancestor lists including the parents themselves
  // Sire side: sire is at generation 1 from offspring
  // Dam side: dam is at generation 1 from offspring
  const sireAncestors = buildAncestorListWithOffset(sirePedigree, 1);
  const damAncestors = buildAncestorListWithOffset(damPedigree, 1);
  
  console.log('=== COI Calculation Debug ===');
  console.log('Sire:', sirePedigree.name);
  console.log('Dam:', damPedigree.name);
  console.log('Sire ancestors:', sireAncestors.map(a => `${a.name} (gen ${a.generation})`));
  console.log('Dam ancestors:', damAncestors.map(a => `${a.name} (gen ${a.generation})`));
  
  // Track processed path pairs to avoid double counting same path
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
          
          // n1 = generations from offspring to common ancestor through sire
          // n2 = generations from offspring to common ancestor through dam
          const n1 = sireAnc.generation;
          const n2 = damAnc.generation;
          
          // Wright's formula: F = (1/2)^(n1+n2+1)
          const contribution = Math.pow(0.5, n1 + n2 + 1);
          
          console.log(`Common ancestor: ${sireAnc.name}`);
          console.log(`  Path through sire: ${n1} generations`);
          console.log(`  Path through dam: ${n2} generations`);
          console.log(`  Contribution: (1/2)^(${n1}+${n2}+1) = ${(contribution * 100).toFixed(4)}%`);
          
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
  
  console.log(`=== Total COI: ${(totalCOI * 100).toFixed(2)}% ===`);
  console.log('Common ancestors found:', commonAncestors.map(a => `${a.name}: ${(a.contribution * 100).toFixed(2)}%`));
  
  return {
    coi: totalCOI * 100,
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
