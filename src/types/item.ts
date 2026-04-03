export type Category = 'auto' | 'real_estate' | 'electronics'

export type AutoItemParams = {
  brand?: string
  model?: string
  yearOfManufacture?: number
  transmission?: 'automatic' | 'manual'
  mileage?: number
  enginePower?: number
}

export type RealEstateItemParams = {
  type?: 'flat' | 'house' | 'room'
  address?: string
  area?: number
  floor?: number
}

export type ElectronicsItemParams = {
  type?: 'phone' | 'laptop' | 'misc'
  brand?: string
  model?: string
  condition?: 'new' | 'used'
  color?: string
}

export type ItemParams = AutoItemParams | RealEstateItemParams | ElectronicsItemParams

export type ItemListEntry = {
  id: string
  category: Category
  title: string
  price: number
  needsRevision: boolean
}

export type ItemFull = ItemListEntry & {
  description?: string
  createdAt: string
  params: ItemParams
}

export type ItemsListResponse = {
  items: ItemListEntry[]
  total: number
}

export type ItemsGetResponse = {
  items: ItemFull[]
  total: number
}

export type ItemUpdateIn = {
  category: Category
  title: string
  description?: string
  price: number
  params: AutoItemParams | RealEstateItemParams | ElectronicsItemParams
}
