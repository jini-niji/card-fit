const fs = require('fs')
const path = require('path')

const inputFiles = [
  './publicData/seoul.csv',
  './publicData/gyeonggi.csv',
]

const outputFile = './src/data/publicMerchantDB.js'

const mapBusinessToCategory = (large, middle, small) => {
  const text = `${large} ${middle} ${small}`

  if (
    text.includes('커피') ||
    text.includes('카페') ||
    text.includes('다방')
  ) {
    return 'cafe'
  }

  if (
    text.includes('음식') ||
    text.includes('한식') ||
    text.includes('중식') ||
    text.includes('일식') ||
    text.includes('양식') ||
    text.includes('분식') ||
    text.includes('치킨') ||
    text.includes('패스트푸드') ||
    text.includes('제과') ||
    text.includes('제빵')
  ) {
    return 'food'
  }

  if (
    text.includes('주유') ||
    text.includes('충전소') ||
    text.includes('LPG')
  ) {
    return 'fuel'
  }

  if (
    text.includes('소매') ||
    text.includes('마트') ||
    text.includes('편의점') ||
    text.includes('백화점') ||
    text.includes('화장품') ||
    text.includes('의류') ||
    text.includes('슈퍼')
  ) {
    return 'shopping'
  }

  if (
    text.includes('운송') ||
    text.includes('교통') ||
    text.includes('택시') ||
    text.includes('버스') ||
    text.includes('철도')
  ) {
    return 'transport'
  }

  return 'etc'
}

const parseCsvLine = (line) => {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }

  result.push(current)
  return result.map((v) => v.replace(/^"|"$/g, '').trim())
}

const normalizeName = (name) => {
  return String(name || '')
    .replace(/\s/g, '')
    .replace(/\(주\)/g, '')
    .replace(/주식회사/g, '')
    .replace(/[0-9]/g, '')
    .trim()
}

const merchantMap = new Map()

inputFiles.forEach((filePath) => {
  const fullPath = path.resolve(filePath)

  if (!fs.existsSync(fullPath)) {
    console.log(`파일 없음: ${filePath}`)
    return
  }

  const raw = fs.readFileSync(fullPath, 'utf-8')
  const lines = raw.split(/\r?\n/).filter(Boolean)

  const headers = parseCsvLine(lines[0])

  const nameIndex = headers.indexOf('상호명')
  const largeIndex = headers.indexOf('상권업종대분류명')
  const middleIndex = headers.indexOf('상권업종중분류명')
  const smallIndex = headers.indexOf('상권업종소분류명')

  if (nameIndex === -1) {
    console.log(`${filePath}에서 상호명 컬럼을 못 찾음`)
    return
  }

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i])

    const name = normalizeName(cols[nameIndex])
    const large = cols[largeIndex] || ''
    const middle = cols[middleIndex] || ''
    const small = cols[smallIndex] || ''

    if (!name || name.length < 2) continue

    const category = mapBusinessToCategory(large, middle, small)

    if (category === 'etc') continue

    merchantMap.set(name, {
      name,
      category,
      businessType: `${large} > ${middle} > ${small}`,
    })
  }
})

const merchants = Array.from(merchantMap.values())

const fileContent = `export const publicMerchantDB = ${JSON.stringify(
  merchants,
  null,
  2
)}
`

fs.writeFileSync(outputFile, fileContent, 'utf-8')

console.log(`완료: ${merchants.length}개 가맹점 저장됨`)
console.log(`저장 위치: ${outputFile}`)