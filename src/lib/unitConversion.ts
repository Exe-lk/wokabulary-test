// Unit conversion utilities for ingredients

export type UnitType = 'g' | 'kg' | 'ml' | 'L';

export interface UnitConversion {
  fromUnit: UnitType;
  toUnit: UnitType;
  factor: number;
}

// Conversion factors to base units (g for weight, ml for volume)
const CONVERSION_FACTORS: Record<UnitType, number> = {
  g: 1,
  kg: 1000,
  ml: 1,
  L: 1000,
};

// Check if two units are compatible (same type - weight or volume)
export function areUnitsCompatible(unit1: UnitType, unit2: UnitType): boolean {
  const weightUnits: UnitType[] = ['g', 'kg'];
  const volumeUnits: UnitType[] = ['ml', 'L'];
  
  return (
    (weightUnits.includes(unit1) && weightUnits.includes(unit2)) ||
    (volumeUnits.includes(unit1) && volumeUnits.includes(unit2))
  );
}

// Convert quantity from one unit to another
export function convertQuantity(
  quantity: number,
  fromUnit: UnitType,
  toUnit: UnitType
): number {
  if (!areUnitsCompatible(fromUnit, toUnit)) {
    throw new Error(`Cannot convert between ${fromUnit} and ${toUnit} - incompatible unit types`);
  }
  
  if (fromUnit === toUnit) {
    return quantity;
  }
  
  // Convert to base unit first, then to target unit
  const baseQuantity = quantity * CONVERSION_FACTORS[fromUnit];
  return baseQuantity / CONVERSION_FACTORS[toUnit];
}

// Get available units for a given ingredient unit
export function getAvailableUnits(ingredientUnit: UnitType): UnitType[] {
  const weightUnits: UnitType[] = ['g', 'kg'];
  const volumeUnits: UnitType[] = ['ml', 'L'];
  
  if (weightUnits.includes(ingredientUnit)) {
    return weightUnits;
  } else if (volumeUnits.includes(ingredientUnit)) {
    return volumeUnits;
  }
  
  return [ingredientUnit];
}

// Convert quantity to the ingredient's base unit for database storage
export function convertToBaseUnit(quantity: number, unit: UnitType): number {
  return quantity * CONVERSION_FACTORS[unit];
}

// Convert quantity from user's selected unit to the ingredient's base unit
export function convertToIngredientBaseUnit(
  quantity: number, 
  userSelectedUnit: UnitType, 
  ingredientBaseUnit: UnitType
): number {
  // If units are the same, no conversion needed
  if (userSelectedUnit === ingredientBaseUnit) {
    return quantity;
  }
  
  // Convert from user's unit to ingredient's base unit
  return convertQuantity(quantity, userSelectedUnit, ingredientBaseUnit);
}

// Format quantity with unit for display
export function formatQuantityWithUnit(quantity: number, unit: UnitType): string {
  return `${quantity} ${unit}`;
}
