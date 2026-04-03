import { describe, expect, it } from 'vitest'
import { formatPriceRub } from './format'

describe('formatPriceRub', () => {
  it('formats integer rubles in ru-RU', () => {
    expect(formatPriceRub(74990)).toMatch(/74\s?990/)
  })
})
