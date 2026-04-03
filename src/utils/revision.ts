import type {
  AutoItemParams,
  ElectronicsItemParams,
  ItemFull,
  RealEstateItemParams,
} from '../types/item'

export function missingFieldLabels(item: ItemFull): string[] {
  const out: string[] = []
  if (!item.description?.trim()) out.push('Описание')

  if (item.category === 'electronics') {
    const p = item.params as ElectronicsItemParams
    if (!p.type) out.push('Тип устройства')
    if (!p.brand?.trim()) out.push('Бренд')
    if (!p.model?.trim()) out.push('Модель')
    if (!p.condition) out.push('Состояние')
    if (!p.color?.trim()) out.push('Цвет')
  }

  if (item.category === 'auto') {
    const p = item.params as AutoItemParams
    if (!p.brand?.trim()) out.push('Марка')
    if (!p.model?.trim()) out.push('Модель')
    if (p.yearOfManufacture == null) out.push('Год выпуска')
    if (!p.transmission) out.push('Коробка передач')
    if (p.mileage == null) out.push('Пробег')
    if (p.enginePower == null) out.push('Мощность двигателя')
  }

  if (item.category === 'real_estate') {
    const p = item.params as RealEstateItemParams
    if (!p.type) out.push('Тип объекта')
    if (!p.address?.trim()) out.push('Адрес')
    if (p.area == null) out.push('Площадь')
    if (p.floor == null) out.push('Этаж')
  }

  return out
}
