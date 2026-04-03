import express from 'express'
import cors from 'cors'

const PORT = Number(process.env.PORT) || 8080

/** @typedef {'auto' | 'real_estate' | 'electronics'} Category */

function computeNeedsRevision(item) {
  if (!item.description || !String(item.description).trim()) return true
  const p = item.params || {}
  if (item.category === 'electronics') {
    return !p.type || !p.brand || !p.model || !p.condition || !p.color
  }
  if (item.category === 'auto') {
    return (
      !p.brand ||
      !p.model ||
      p.yearOfManufacture == null ||
      !p.transmission ||
      p.mileage == null ||
      p.enginePower == null
    )
  }
  if (item.category === 'real_estate') {
    return (
      !p.type || !p.address || p.area == null || p.floor == null
    )
  }
  return false
}

const seed = [
  {
    id: '1',
    category: 'electronics',
    title: 'iPhone 14 Pro 256 ГБ',
    description: 'Отличное состояние, комплект полный.',
    price: 74990,
    createdAt: '2025-12-01T10:00:00.000Z',
    params: {
      type: 'phone',
      brand: 'Apple',
      model: 'iPhone 14 Pro',
      condition: 'used',
      color: 'чёрный',
    },
  },
  {
    id: '2',
    category: 'electronics',
    title: 'Ноутбук Lenovo ThinkPad',
    description: '',
    price: 42000,
    createdAt: '2025-11-20T14:30:00.000Z',
    params: {
      type: 'laptop',
      brand: 'Lenovo',
      model: 'T14',
      condition: 'used',
      color: 'серый',
    },
  },
  {
    id: '3',
    category: 'auto',
    title: 'Toyota Camry 2019',
    description: 'Один владелец, сервисная история.',
    price: 1850000,
    createdAt: '2025-10-05T09:15:00.000Z',
    params: {
      brand: 'Toyota',
      model: 'Camry',
      yearOfManufacture: 2019,
      transmission: 'automatic',
      mileage: 78000,
      enginePower: 181,
    },
  },
  {
    id: '4',
    category: 'real_estate',
    title: '2-к. квартира, 54 м², 5/9 этаж',
    description: 'Тихий двор, рядом метро.',
    price: 11200000,
    createdAt: '2025-09-12T11:45:00.000Z',
    params: {
      type: 'flat',
      address: 'Москва, ул. Примерная, 10',
      area: 54,
      floor: 5,
    },
  },
  {
    id: '5',
    category: 'electronics',
    title: 'Наушники Sony WH-1000XM5',
    description: '',
    price: 22990,
    createdAt: '2025-12-18T16:20:00.000Z',
    params: {
      type: 'misc',
      brand: 'Sony',
      model: 'WH-1000XM5',
      condition: 'new',
      color: 'чёрный',
    },
  },
  {
    id: '6',
    category: 'auto',
    title: 'Lada Vesta 2021',
    description: '',
    price: 950000,
    createdAt: '2025-08-01T08:00:00.000Z',
    params: {
      brand: 'Lada',
      model: 'Vesta',
      yearOfManufacture: 2021,
      transmission: 'manual',
      mileage: 45000,
      enginePower: 122,
    },
  },
  {
    id: '7',
    category: 'real_estate',
    title: 'Дом 120 м² с участком',
    description: '',
    price: 8900000,
    createdAt: '2025-07-22T13:10:00.000Z',
    params: {
      type: 'house',
      address: 'МО, д. Примерное',
      area: 120,
      floor: 2,
    },
  },
  {
    id: '8',
    category: 'electronics',
    title: 'Планшет Samsung Galaxy Tab',
    description: 'Без царапин.',
    price: 18900,
    createdAt: '2025-11-30T19:00:00.000Z',
    params: {
      type: 'misc',
      brand: 'Samsung',
      model: 'Tab S9',
      condition: 'used',
      color: 'серебристый',
    },
  },
  {
    id: '9',
    category: 'auto',
    title: 'Kia Rio 2018',
    description: 'Экономичный городской авто.',
    price: 780000,
    createdAt: '2025-06-10T12:00:00.000Z',
    params: {
      brand: 'Kia',
      model: 'Rio',
      yearOfManufacture: 2018,
      transmission: 'automatic',
      mileage: 92000,
      enginePower: 123,
    },
  },
  {
    id: '10',
    category: 'real_estate',
    title: 'Комната 18 м² в 3-к квартире',
    description: '',
    price: 3200000,
    createdAt: '2025-05-01T10:00:00.000Z',
    params: {
      type: 'room',
      address: 'СПб, пр. Примерный, 3',
      area: 18,
      floor: 4,
    },
  },
  {
    id: '11',
    category: 'electronics',
    title: 'Монитор LG 27"',
    description: 'IPS, 144 Гц.',
    price: 21990,
    createdAt: '2025-04-15T09:30:00.000Z',
    params: {
      type: 'misc',
      brand: 'LG',
      model: '27GN800',
      condition: 'used',
      color: 'чёрный',
    },
  },
  {
    id: '12',
    category: 'auto',
    title: 'BMW X5 2017',
    description: '',
    price: 2650000,
    createdAt: '2025-03-20T15:40:00.000Z',
    params: {
      brand: 'BMW',
      model: 'X5',
      yearOfManufacture: 2017,
      transmission: 'automatic',
      mileage: 125000,
      enginePower: 249,
    },
  },
  {
    id: '13',
    category: 'real_estate',
    title: 'Студия 28 м²',
    description: 'С ремонтом.',
    price: 6700000,
    createdAt: '2025-02-11T11:11:00.000Z',
    params: {
      type: 'flat',
      address: 'Казань, ул. Примерная, 7',
      area: 28,
      floor: 12,
    },
  },
  {
    id: '14',
    category: 'electronics',
    title: 'Игровая приставка PlayStation 5',
    description: '',
    price: 45990,
    createdAt: '2025-01-05T18:00:00.000Z',
    params: {
      type: 'misc',
      brand: 'Sony',
      model: 'PS5',
      condition: 'new',
      color: 'белый',
    },
  },
  {
    id: '15',
    category: 'auto',
    title: 'Hyundai Solaris 2020',
    description: 'Сервис у дилера.',
    price: 1050000,
    createdAt: '2024-12-01T08:20:00.000Z',
    params: {
      brand: 'Hyundai',
      model: 'Solaris',
      yearOfManufacture: 2020,
      transmission: 'automatic',
      mileage: 56000,
      enginePower: 123,
    },
  },
  {
    id: '16',
    category: 'real_estate',
    title: 'Участок 8 соток',
    description: '',
    price: 2100000,
    createdAt: '2024-11-15T14:00:00.000Z',
    params: {
      type: 'house',
      address: 'ЛО, пос. Примерный',
      area: 8,
      floor: 0,
    },
  },
  {
    id: '17',
    category: 'electronics',
    title: 'Умные часы Apple Watch',
    description: 'Series 9, 45 мм.',
    price: 27990,
    createdAt: '2024-10-30T12:12:00.000Z',
    params: {
      type: 'misc',
      brand: 'Apple',
      model: 'Watch S9',
      condition: 'used',
      color: 'титан',
    },
  },
  {
    id: '18',
    category: 'auto',
    title: 'Mercedes-Benz E-класс 2016',
    description: '',
    price: 2150000,
    createdAt: '2024-09-09T09:09:00.000Z',
    params: {
      brand: 'Mercedes-Benz',
      model: 'E200',
      yearOfManufacture: 2016,
      transmission: 'automatic',
      mileage: 142000,
      enginePower: 184,
    },
  },
  {
    id: '19',
    category: 'real_estate',
    title: '3-к. квартира, 78 м²',
    description: 'Панельный дом.',
    price: 13900000,
    createdAt: '2024-08-08T08:08:00.000Z',
    params: {
      type: 'flat',
      address: 'Екатеринбург, ул. Примерная, 1',
      area: 78,
      floor: 7,
    },
  },
  {
    id: '20',
    category: 'electronics',
    title: 'Клавиатура Keychron K2',
    description: '',
    price: 8900,
    createdAt: '2024-07-07T07:07:00.000Z',
    params: {
      type: 'misc',
      brand: 'Keychron',
      model: 'K2',
      condition: 'new',
      color: 'чёрный',
    },
  },
  {
    id: '21',
    category: 'auto',
    title: 'Skoda Octavia 2019',
    description: 'Универсал, дизель.',
    price: 1280000,
    createdAt: '2024-06-06T06:06:00.000Z',
    params: {
      brand: 'Skoda',
      model: 'Octavia',
      yearOfManufacture: 2019,
      transmission: 'manual',
      mileage: 88000,
      enginePower: 150,
    },
  },
  {
    id: '22',
    category: 'real_estate',
    title: 'Таунхаус 95 м²',
    description: '',
    price: 12500000,
    createdAt: '2024-05-05T05:05:00.000Z',
    params: {
      type: 'house',
      address: 'Новосибирск, жк Примерный',
      area: 95,
      floor: 3,
    },
  },
  {
    id: '23',
    category: 'electronics',
    title: 'Роутер TP-Link Archer',
    description: 'Wi‑Fi 6.',
    price: 4990,
    createdAt: '2024-04-04T04:04:00.000Z',
    params: {
      type: 'misc',
      brand: 'TP-Link',
      model: 'Archer AX50',
      condition: 'used',
      color: 'чёрный',
    },
  },
  {
    id: '24',
    category: 'auto',
    title: 'Volkswagen Polo 2015',
    description: '',
    price: 690000,
    createdAt: '2024-03-03T03:03:00.000Z',
    params: {
      brand: 'Volkswagen',
      model: 'Polo',
      yearOfManufacture: 2015,
      transmission: 'manual',
      mileage: 134000,
      enginePower: 110,
    },
  },
  {
    id: '25',
    category: 'real_estate',
    title: 'Гараж 18 м²',
    description: '',
    price: 950000,
    createdAt: '2024-02-02T02:02:00.000Z',
    params: {
      type: 'flat',
      address: 'Москва, ул. Гаражная, 2',
      area: 18,
      floor: 1,
    },
  },
]

let items = structuredClone(seed).map((it) => ({
  ...it,
  needsRevision: computeNeedsRevision(it),
}))

const app = express()
app.use(cors())
app.use(express.json())

function listItemShape(it) {
  return {
    id: it.id,
    category: it.category,
    title: it.title,
    price: it.price,
    needsRevision: computeNeedsRevision(it),
  }
}

app.get('/items', (req, res) => {
  const q = (req.query.q || '').toString().toLowerCase().trim()
  const limit = Math.min(Number(req.query.limit) || 10, 100)
  const skip = Math.max(Number(req.query.skip) || 0, 0)
  const needsRevision =
    req.query.needsRevision === 'true' ? true : undefined
  const catsRaw = (req.query.categories || '').toString()
  const categories = catsRaw
    ? catsRaw.split(',').map((c) => c.trim()).filter(Boolean)
    : []
  const sortColumn = (req.query.sortColumn || 'createdAt').toString()
  const sortDirection = (req.query.sortDirection || 'desc').toString()

  let filtered = items.filter((it) => {
    if (q && !it.title.toLowerCase().includes(q)) return false
    if (needsRevision && !computeNeedsRevision(it)) return false
    if (categories.length && !categories.includes(it.category)) return false
    return true
  })

  const dir = sortDirection === 'asc' ? 1 : -1
  filtered = [...filtered].sort((a, b) => {
    if (sortColumn === 'title') {
      return a.title.localeCompare(b.title, 'ru') * dir
    }
    if (sortColumn === 'price') {
      return (a.price - b.price) * dir
    }
    return (
      (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir
    )
  })

  const total = filtered.length
  const page = filtered.slice(skip, skip + limit)
  res.json({
    items: page.map(listItemShape),
    total,
  })
})

app.get('/items/:id', (req, res) => {
  const it = items.find((x) => x.id === req.params.id)
  if (!it) {
    return res.status(404).json({ error: 'Not found' })
  }
  const full = { ...it, needsRevision: computeNeedsRevision(it) }
  res.json({ items: [full], total: 1 })
})

app.put('/items/:id', (req, res) => {
  const idx = items.findIndex((x) => x.id === req.params.id)
  if (idx === -1) {
    return res.status(404).json({ error: 'Not found' })
  }
  const body = req.body
  if (!body || !body.category || !body.title || body.price == null) {
    return res.status(400).json({ error: 'Invalid body' })
  }
  const updated = {
    ...items[idx],
    category: body.category,
    title: body.title,
    description: body.description,
    price: Number(body.price),
    params: body.params || {},
  }
  items[idx] = updated
  const full = { ...updated, needsRevision: computeNeedsRevision(updated) }
  res.json({ items: [full], total: 1 })
})

app.listen(PORT, () => {
  console.log(`Items API listening on http://localhost:${PORT}`)
})
