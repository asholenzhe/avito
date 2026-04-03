import type {
  AutoItemParams,
  Category,
  ElectronicsItemParams,
  RealEstateItemParams,
} from '../types/item'

export function defaultParamsForCategory(
  category: Category,
): AutoItemParams | RealEstateItemParams | ElectronicsItemParams {
  switch (category) {
    case 'auto':
      return {
        brand: '',
        model: '',
        yearOfManufacture: undefined,
        transmission: undefined,
        mileage: undefined,
        enginePower: undefined,
      }
    case 'real_estate':
      return {
        type: undefined,
        address: '',
        area: undefined,
        floor: undefined,
      }
    case 'electronics':
      return {
        type: undefined,
        brand: '',
        model: '',
        condition: undefined,
        color: '',
      }
  }
}

function isEmpty(v: unknown): boolean {
  if (v === undefined || v === null) return true
  if (typeof v === 'string') return v.trim() === ''
  return false
}

export function cleanParams(
  category: Category,
  params: AutoItemParams | RealEstateItemParams | ElectronicsItemParams,
): AutoItemParams | RealEstateItemParams | ElectronicsItemParams {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(params)) {
    if (!isEmpty(v)) out[k] = v
  }
  if (category === 'auto') {
    const p = out as AutoItemParams
    if (p.yearOfManufacture !== undefined)
      p.yearOfManufacture = Number(p.yearOfManufacture)
    if (p.mileage !== undefined) p.mileage = Number(p.mileage)
    if (p.enginePower !== undefined) p.enginePower = Number(p.enginePower)
  }
  if (category === 'real_estate') {
    const p = out as RealEstateItemParams
    if (p.area !== undefined) p.area = Number(p.area)
    if (p.floor !== undefined) p.floor = Number(p.floor)
  }
  return out as AutoItemParams | RealEstateItemParams | ElectronicsItemParams
}
