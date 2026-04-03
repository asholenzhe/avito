import type { Category } from '../types/item'

export const CATEGORY_LABELS: Record<Category, string> = {
  auto: 'Транспорт',
  real_estate: 'Недвижимость',
  electronics: 'Электроника',
}

export const CATEGORIES: Category[] = ['electronics', 'auto', 'real_estate']
