import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import Tesseract from 'tesseract.js'
import { cards } from './data/cards'

function App() {
  const formatNumber = (value) => {
    const onlyNumber = String(value).replace(/[^0-9]/g, '')
    return onlyNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  const getNumber = (value) => Number(String(value).replace(/[^0-9]/g, '')) || 0

  const [step, setStep] = useState(1)
  const [age, setAge] = useState('')
  const [job, setJob] = useState('')
  const [cardType, setCardType] = useState('신용카드')

  const [food, setFood] = useState('')
  const [transport, setTransport] = useState('')
  const [cafe, setCafe] = useState('')
  const [shopping, setShopping] = useState('')
  const [fuel, setFuel] = useState('')
  const [etc, setEtc] = useState('')

  const [statementRows, setStatementRows] = useState([])
  const [analysisSource, setAnalysisSource] = useState('manual')
  const [uploadMessage, setUploadMessage] = useState('')
  const [selectedFileName, setSelectedFileName] = useState('')

  const [results, setResults] = useState([])
  const [message, setMessage] = useState('')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  const [ocrText, setOcrText] = useState('')
  const [ocrRows, setOcrRows] = useState([])
  const [ocrLoading, setOcrLoading] = useState(false)

  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('favorites')
    return saved ? JSON.parse(saved) : []
  })

  const [crawledCards, setCrawledCards] = useState([])

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites))
  }, [favorites])

  useEffect(() => {
    fetch('/cards.json')
      .then((res) => res.json())
      .then((data) => setCrawledCards(data))
      .catch((err) => console.error('cards.json 불러오기 실패:', err))
  }, [])

  const colors = ['#1F6FEB', '#7C3AED', '#059669', '#EA580C', '#DB2777', '#0F766E']
  const getCardColor = (id) => colors[((id || 1) - 1) % colors.length]

  const pageStyle = {
    minHeight: '100vh',
    width: '100%',
    minWidth: 0,
    maxWidth: '100%',
    overflowX: 'hidden',
    background:
      'radial-gradient(circle at 12% 8%, rgba(37, 99, 235, 0.18) 0, transparent 28%), radial-gradient(circle at 88% 12%, rgba(124, 58, 237, 0.16) 0, transparent 26%), linear-gradient(180deg, #f8fbff 0%, #eef4ff 42%, #ffffff 100%)',
    color: '#101828',
    fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  }

  const containerStyle = { width: '100%', maxWidth: '1440px', margin: '0 auto', padding: '42px clamp(18px, 4vw, 56px) 72px', boxSizing: 'border-box', overflow: 'hidden' }
  const panelStyle = {
    background: 'rgba(255, 255, 255, 0.86)',
    border: '1px solid rgba(255, 255, 255, 0.78)',
    borderRadius: '32px',
    boxShadow: '0 28px 80px rgba(15, 23, 42, 0.12)',
    backdropFilter: 'blur(18px)',
  }
  const inputStyle = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '17px 18px',
    borderRadius: '18px',
    border: '1px solid rgba(148, 163, 184, 0.34)',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    color: '#101828',
    fontSize: '15px',
    outline: 'none',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9)',
  }
  const buttonPrimary = {
    padding: '16px 22px',
    borderRadius: '18px',
    border: 'none',
    background: 'linear-gradient(135deg, #111827 0%, #2563eb 52%, #7c3aed 100%)',
    color: 'white',
    fontWeight: 900,
    cursor: 'pointer',
    fontSize: '16px',
    boxShadow: '0 18px 38px rgba(37, 99, 235, 0.28)',
  }
  const buttonSecondary = {
    padding: '15px 20px',
    borderRadius: '18px',
    border: '1px solid rgba(148, 163, 184, 0.34)',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    color: '#344054',
    cursor: 'pointer',
    fontWeight: 800,
    fontSize: '15px',
    boxShadow: '0 10px 24px rgba(15, 23, 42, 0.06)',
  }
  const optionButton = (selected) => ({
    flex: 1,
    padding: '17px 14px',
    borderRadius: '20px',
    border: selected ? '1px solid rgba(37, 99, 235, 0.7)' : '1px solid rgba(148, 163, 184, 0.28)',
    background: selected ? 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)' : 'rgba(255,255,255,0.76)',
    color: selected ? '#1d4ed8' : '#475467',
    cursor: 'pointer',
    fontWeight: selected ? 900 : 700,
    fontSize: '15px',
    boxShadow: selected ? '0 12px 30px rgba(37, 99, 235, 0.12)' : 'none',
  })
  const sectionTitleStyle = { margin: 0, fontSize: '24px', letterSpacing: '-0.04em', color: '#111827', fontWeight: 950 }
  const tagStyle = {
    padding: '9px 14px',
    borderRadius: '999px',
    background: 'rgba(239, 246, 255, 0.9)',
    color: '#1d4ed8',
    fontSize: '13px',
    fontWeight: 900,
    border: '1px solid rgba(37, 99, 235, 0.14)',
  }

  const categoryLabels = {
    food: '식비',
    transport: '교통',
    cafe: '카페',
    shopping: '쇼핑',
    fuel: '주유',
    etc: '기타',
  }

  const categoryIcons = {
    food: '🍽️',
    transport: '🚇',
    cafe: '☕',
    shopping: '🛍️',
    fuel: '⛽',
    etc: '📌',
  }



  const normalizeHeader = (value) => {
    return String(value || '')
      .toLowerCase()
      .replace(/\s/g, '')
      .replace(/[()\[\]{}.,_\-\/\\]/g, '')
      .replace(/㈜|\(주\)|주식회사/g, '')
  }

  const findColumnIndex = (headers, candidates) => {
    return headers.findIndex((header) =>
      candidates.some((candidate) => header.includes(normalizeHeader(candidate)))
    )
  }

  const dateColumnCandidates = [
    '이용일', '이용일자', '거래일', '거래일자', '승인일', '승인일자', '매출일', '결제일', '사용일', '일자', '날짜', 'date'
  ]

  const merchantColumnCandidates = [
    '가맹점명', '가맹점', '이용가맹점', '사용처', '사용처명', '상호', '상호명', '매장명', '거래처', '결제처', '이용점', '업체명', 'merchant', 'store'
  ]

  const amountColumnCandidates = [
    '이용금액', '결제금액', '승인금액', '사용금액', '매출금액', '청구금액', '결제원금', '원금', '금액', 'amount'
  ]

  // 실제 카드 명세서에는 브랜드명이 아니라 법인명/PG사명으로 찍히는 경우가 많아서
  // 단순 키워드가 아니라 "실제 명세서 표기명" 기준으로 최대한 넓게 분류합니다.
  const normalizeMerchantName = (value) => {
    return String(value || '')
      .toLowerCase()
      .replace(/\s/g, '')
      .replace(/[()\[\]{}.,_\-\/\\]/g, '')
      .replace(/㈜|\(주\)|주식회사|유한회사|합자회사|재단법인|사단법인/g, '')
      .replace(/the/g, '')
  }

  const merchantCategoryMap = {
    // 식비
    우아한형제들: 'food',
    우아한청년들: 'food',
    배달의민족: 'food',
    배민: 'food',
    요기요: 'food',
    위대한상상: 'food',
    쿠팡이츠: 'food',
  
    // 카페
    스타벅스: 'cafe',
    투썸플레이스: 'cafe',
    메가엠지씨커피: 'cafe',
    메가커피: 'cafe',
    컴포즈커피: 'cafe',
    빽다방: 'cafe',
    이디야: 'cafe',
    공차: 'cafe',
    설빙: 'cafe',
    파리바게뜨: 'cafe',
    파리바게트: 'cafe',
    뚜레쥬르: 'cafe',
  
    // 교통
    카카오택시: 'transport',
    카카오T: 'transport',
    티머니: 'transport',
    캐시비: 'transport',
    코레일: 'transport',
    KTX: 'transport',
    SRT: 'transport',
    하이패스: 'transport',
    쏘카: 'transport',
    그린카: 'transport',
    주차장: 'transport',
  
    // 주유
    GS칼텍스: 'fuel',
    SK에너지: 'fuel',
    에쓰오일: 'fuel',
    'S-OIL': 'fuel',
    현대오일뱅크: 'fuel',
    알뜰주유소: 'fuel',
  
    // 쇼핑
    쿠팡: 'shopping',
    네이버페이: 'shopping',
    네이버파이낸셜: 'shopping',
    스마트스토어: 'shopping',
    카카오페이: 'shopping',
    토스페이: 'shopping',
    다이소: 'shopping',
    올리브영: 'shopping',
    무신사: 'shopping',
    지그재그: 'shopping',
    에이블리: 'shopping',
    이마트: 'shopping',
    롯데마트: 'shopping',
    홈플러스: 'shopping',
    코스트코: 'shopping',
    GS25: 'shopping',
    CU: 'shopping',
    세븐일레븐: 'shopping',
    이마트24: 'shopping',
  }

  const categoryKeywords = {
    food: [
      // 배달앱 / 배달앱 운영사명
      '우아한형제들', '우아한청년들', '배달의민족', '배민', 'baemin',
      '요기요', '위대한상상', 'yogiyo', '쿠팡이츠', 'coupangeats', '땡겨요', '먹깨비',

      // 패스트푸드 / 프랜차이즈
      '맥도날드', 'mcdonald', '버거킹', 'burgerking', '롯데리아', 'lotteria', '맘스터치', 'momstouch',
      'kfc', '써브웨이', '서브웨이', 'subway', '노브랜드버거', '프랭크버거', '쉐이크쉑',

      // 치킨 / 피자 / 야식
      '교촌', '교촌치킨', 'bbq', '비비큐', 'bhc', '처갓집', '굽네', '푸라닭', '네네치킨', '페리카나',
      '자담치킨', '호식이', '도미노피자', 'dominopizza', '피자헛', 'pizzahut', '미스터피자', '청년피자',
      '족발', '보쌈', '곱창', '막창', '닭발',

      // 일반 음식점 키워드
      '식당', '음식', '음식점', '한식', '중식', '일식', '양식', '분식', '뷔페', '레스토랑', 'restaurant',
      '김밥', '국밥', '국수', '칼국수', '냉면', '찌개', '탕', '덮밥', '비빔밥', '죽', '도시락',
      '고기', '갈비', '삼겹살', '소고기', '돼지', '마라탕', '마라샹궈', '떡볶이', '라멘', '우동',
      '초밥', '스시', '돈까스', '돈카츠', '파스타', '샤브', '샤브샤브', '쌀국수', '포', '만두',
      '닭갈비', '닭강정', '토스트', '이삭토스트', '한솥', '본죽', '봉구스', '포케', '샐러드',

      // 술집/포차도 외식으로 처리
      '포차', '호프', '주점', '술집', '이자카야', '맥주', '비어', 'pub',

      '빵'
    ],

    cafe: [
      // 카페 브랜드
      '스타벅스', 'starbucks', '스벅', '투썸', '투썸플레이스', 'twosome', '이디야', 'ediya',
      '메가커피', '메가엠지씨', 'megacoffee', '컴포즈', 'compose', '빽다방', 'paik',
      '커피빈', 'coffeebean', '할리스', 'hollys', '엔제리너스', 'angelinus', '폴바셋', 'paulbassett',
      '공차', 'gongcha', '더벤티', 'venti', '탐앤탐스', 'tomntoms', '파스쿠찌', 'pascucci',
      '블루보틀', 'bluebottle', '카페베네', 'caffebene', '매머드커피', 'mammoth', '하삼동커피',
      '커피나무', '커피에반하다', '텐퍼센트커피', '감성커피', '커피베이',

      // 카페 일반 키워드
      '카페', '커피', 'coffee', 'cafe', 'espresso', '에스프레소', '라떼', '디저트', 'dessert',

      // 베이커리/디저트는 카페로 분류
      '파리바게뜨', '파리바게트', 'parisbaguette', '뚜레쥬르', 'tlj', '성심당', '던킨', 'dunkin',
      '크리스피', 'krispy', '노티드', 'knotted', '설빙', '배스킨', '베스킨', 'baskin', '아이스크림',
      '와플', '도넛', '마카롱', '베이커리', 'bakery', '빵집'
    ],

    transport: [
      // 대중교통/택시/모빌리티
      '교통', '버스', '지하철', '택시', 'taxi', '카카오t', '카카오택시', 'kakaot', '티머니', 'tmoney',
      '캐시비', 'cashbee', '코레일', 'korail', 'ktx', 'srt', '철도', '기차', '레츠코레일',
      '고속버스', '시외버스', '공항버스', '버스타고', '고속도로', '하이패스', 'hipass',
      '주차', '주차장', '파킹', 'parking', '쏘카', 'socar', '그린카', 'greencar', '렌터카', '렌트카',
      '킥보드', '씽씽', '지쿠', 'beam', '일레클', '따릉이'
    ],

    fuel: [
      '주유', '주유소', '충전소', 'gs칼텍스', 'gscaltex', 'sk에너지', 'sk주유', 's-oil', 'soil', '에쓰오일',
      '현대오일뱅크', '오일뱅크', 'hd현대오일', '알뜰주유소', 'e1', 'sk가스', 'lpg'
    ],

    shopping: [
      // 온라인 쇼핑/PG 표기
      '쿠팡', 'coupang', '네이버페이', 'naverpay', '네이버파이낸셜', '스마트스토어', 'smartstore',
      '11번가', '11st', 'g마켓', '지마켓', 'gmarket', '옥션', 'auction', 'ssg', '쓱', '이베이',
      '카카오페이', 'kakaopay', '토스페이', 'tosspay', '페이코', 'payco',

      // 대형마트/편의점/생활
      '이마트', 'emart', '롯데마트', '홈플러스', 'homeplus', '코스트코', 'costco', '트레이더스',
      '다이소', 'daiso', '올리브영', 'oliveyoung', 'gs25', 'cu', '씨유', '세븐일레븐', '7eleven',
      '이마트24', 'emart24', '편의점', '마트', '슈퍼', '백화점', '아울렛', 'mall', '몰','스타필드',

      // 패션/뷰티/라이프스타일
      '무신사', 'musinsa', '지그재그', 'zigzag', '에이블리', 'ably', '브랜디', '29cm', 'w컨셉', 'wconcept',
      '오늘의집', 'ohou', '마켓컬리', '컬리', 'kurly', '인터파크', '티몬', '위메프', '알리익스프레스',
      'aliexpress', '아마존', 'amazon', '유니클로', 'uniqlo', '자라', 'zara', 'h&m', 'hm', '스파오',
      '탑텐', 'abc마트', 'abc-mart', '신발', '의류', '패션', '화장품',

      // 전자/서점/문구
      '하이마트', '전자랜드', '애플', 'apple', '삼성전자', 'samsung', '교보문고', '영풍문고', '알라딘',
      'yes24', '문구', '서점', '문구점', '핫트랙스'
    ],

    etc: []
  }

  const classifyMerchant = (merchant) => {
    const name = normalizeMerchantName(merchant)
    if (!name) return 'etc'

      // 0순위: 실제 명세서 표기명 직접 매핑
    for (const [merchantKeyword, category] of Object.entries(merchantCategoryMap)) {
      if (name.includes(normalizeMerchantName(merchantKeyword))) {
        return category
      }
    }

    // 1순위: 명확한 예외 처리
    // 쿠팡은 일반 쿠팡은 쇼핑, 쿠팡이츠는 식비로 분리해야 함
    if (name.includes('쿠팡이츠') || name.includes('coupangeats')) return 'food'
    if (name.includes('우아한형제들') || name.includes('배달의민족') || name.includes('배민')) return 'food'
    if (name.includes('요기요') || name.includes('위대한상상')) return 'food'
    if (name.includes('쿠팡') || name.includes('coupang')) return 'shopping'

    // 편의점은 식비로도 볼 수 있지만 카드추천 소비분석에서는 보통 쇼핑/생활소비로 처리
    if (['gs25', 'cu', '씨유', '세븐일레븐', '7eleven', '이마트24', 'emart24'].some((k) => name.includes(k))) {
      return 'shopping'
    }

    // 2순위: 카테고리 우선순위
    // 카페 브랜드가 "베이커리/디저트"와 겹칠 수 있어서 cafe를 food보다 먼저 검사
    // 주유/교통은 쇼핑보다 먼저 검사해서 주차장/하이패스 등이 기타로 빠지지 않게 함
    const priority = ['cafe', 'food', 'fuel', 'transport', 'shopping']

    for (const category of priority) {
      const keywords = categoryKeywords[category] || []
      if (keywords.some((keyword) => name.includes(normalizeMerchantName(keyword)))) {
        return category
      }
    }

    // 3순위: 일반 단어 fallback
    if (/(식당|음식점|분식|고기|치킨|피자|버거|국밥|김밥|떡볶이|마라|초밥|스시|라멘|우동|돈까스|샤브)/.test(name)) return 'food'
    if (/(카페|커피|coffee|cafe|베이커리|디저트|아이스크림|빵집)/.test(name)) return 'cafe'
    if (/(택시|버스|지하철|철도|기차|주차|하이패스|렌터카|렌트카)/.test(name)) return 'transport'
    if (/(주유|주유소|충전소|오일|oil|lpg)/.test(name)) return 'fuel'
    if (/(마트|쇼핑|스토어|백화점|아울렛|편의점|문구|서점|패션|의류|화장품)/.test(name)) return 'shopping'

    return 'etc'
  }

  const ignoredMerchantKeywords = ['합계', '총계', '소계', '미리입금', '할인,면제', '취소', '입금후잔액']

  const parseCsvLine = (line) => {
    const result = []
    let current = ''
    let insideQuote = false

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i]
      const next = line[i + 1]

      if (char === '"' && insideQuote && next === '"') {
        current += '"'
        i += 1
      } else if (char === '"') {
        insideQuote = !insideQuote
      } else if (char === ',' && !insideQuote) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  const parseAmount = (value) => {
    const text = String(value || '').trim()
    if (!text) return 0
    const isNegative = text.includes('-') || text.includes('취소')
    const number = Number(text.replace(/[^0-9.]/g, '')) || 0
    return isNegative ? -number : number
  }

  const normalizeDateText = (value) => {
    const text = String(value || '').trim()
    const digits = text.replace(/[^0-9]/g, '')
    if (digits.length >= 8) return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`
    if (digits.length === 6) return `${digits.slice(0, 4)}-${digits.slice(4, 6)}`
    return text
  }

  const getMonthKey = (date) => {
    const normalized = normalizeDateText(date)
    const digits = String(normalized).replace(/[^0-9]/g, '')
    if (digits.length >= 6) return `${digits.slice(0, 4)}-${digits.slice(4, 6)}`
    return ''
  }

  const findHeaderRowIndex = (matrix) => {
    let best = { index: -1, score: -1 }

    matrix.forEach((row, index) => {
      const headers = row.map((cell) => normalizeHeader(cell))
      const dateIndex = findColumnIndex(headers, dateColumnCandidates)
      const merchantIndex = findColumnIndex(headers, merchantColumnCandidates)
      const amountIndex = findColumnIndex(headers, amountColumnCandidates)
      let score = 0
      if (dateIndex >= 0) score += 1
      if (merchantIndex >= 0) score += 2
      if (amountIndex >= 0) score += 2
      if (score > best.score) best = { index, score }
    })

    return best.score >= 4 ? best.index : -1
  }

  const parseRowsFromMatrix = (matrix, sheetName = '') => {
    const usableRows = matrix
      .map((row) => row.map((cell) => String(cell ?? '').trim()))
      .filter((row) => row.some((cell) => cell !== ''))

    if (usableRows.length < 2) return []

    const headerRowIndex = findHeaderRowIndex(usableRows)
    if (headerRowIndex < 0) return []

    const rawHeaders = usableRows[headerRowIndex]
    const headers = rawHeaders.map((header) => normalizeHeader(header))
    const dateIndex = findColumnIndex(headers, dateColumnCandidates)
    const merchantIndex = findColumnIndex(headers, merchantColumnCandidates)
    const amountIndex = findColumnIndex(headers, amountColumnCandidates)

    console.log(`${sheetName || '명세서'} 컬럼명:`, rawHeaders)
    console.log(`${sheetName || '명세서'} 자동 탐색 결과:`, {
      dateColumn: dateIndex >= 0 ? rawHeaders[dateIndex] : '못 찾음',
      merchantColumn: merchantIndex >= 0 ? rawHeaders[merchantIndex] : '못 찾음',
      amountColumn: amountIndex >= 0 ? rawHeaders[amountIndex] : '못 찾음',
    })

    if (merchantIndex < 0 || amountIndex < 0) return []

    return usableRows.slice(headerRowIndex + 1).map((cells) => {
      const merchant = cells[merchantIndex] || ''
      const amount = parseAmount(cells[amountIndex])
      const category = classifyMerchant(merchant)

      return {
        date: dateIndex >= 0 ? normalizeDateText(cells[dateIndex] || '') : '',
        merchant,
        amount,
        category,
        sheetName,
      }
    }).filter((row) => {
      const merchantText = String(row.merchant || '').replace(/\s/g, '')
      const isIgnored = ignoredMerchantKeywords.some((keyword) => merchantText.includes(keyword.replace(/\s/g, '')))
      return row.merchant && row.amount > 0 && !isIgnored
    })
  }

  const parseStatementCsvText = (text) => {
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
    const matrix = lines.map((line) => parseCsvLine(line))
    const parsed = parseRowsFromMatrix(matrix, 'CSV')
    return parsed.length > 0 ? parsed : parseRowsByPattern(matrix, 'CSV')
  }

  const parseStatementWorkbook = (arrayBuffer) => {
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array', raw: false, cellDates: false })
    const rows = []

    workbook.SheetNames.forEach((sheetName) => {
      if (String(sheetName).includes('취소')) return
      const worksheet = workbook.Sheets[sheetName]
      const matrix = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false })
      let parsedSheetRows = parseRowsFromMatrix(matrix, sheetName)
      if (parsedSheetRows.length === 0) {
        console.warn(`${sheetName} 헤더 기반 파싱 실패, 패턴 기반 파싱으로 재시도`)
        parsedSheetRows = parseRowsByPattern(matrix, sheetName)
      }
      rows.push(...parsedSheetRows)
    })

    return rows
  }


  // 헤더 탐색이 실패해도 삼성카드처럼 표 구조가 일정한 파일을 최대한 읽기 위한 보조 파서
  const parseRowsByPattern = (matrix, sheetName = '') => {
    const rows = matrix
      .map((row) => row.map((cell) => String(cell ?? '').trim()))
      .filter((row) => row.some((cell) => cell !== ''))

    const parsed = []

    rows.forEach((cells) => {
      const nonEmpty = cells.filter(Boolean)
      const rowText = nonEmpty.join(' ')
      if (!rowText) return
      if (ignoredMerchantKeywords.some((keyword) => rowText.replace(/\s/g, '').includes(keyword.replace(/\s/g, '')))) return

      // 날짜 후보: 20260301, 2026-03-01 같은 값
      const dateCell = cells.find((cell) => /^\d{8}$/.test(cell.replace(/[^0-9]/g, '')) || /^\d{4}[-./]\d{1,2}[-./]\d{1,2}/.test(cell)) || ''

      // 금액 후보: 9,220 / 9220 / 32,900 처럼 숫자성 값
      const amountCandidates = cells
        .map((cell, index) => ({ cell, index, amount: parseAmount(cell) }))
        .filter((item) => item.amount > 0 && /[0-9]/.test(item.cell))

      if (amountCandidates.length === 0) return

      // 삼성카드는 이용금액이 앞쪽에 있고, 원금/적립금액 등 중복 금액이 뒤에 있으므로 가장 왼쪽 금액을 우선 사용
      const amountItem = amountCandidates[0]

      // 가맹점 후보: 날짜/이용구분/금액이 아닌 텍스트 중 가장 가맹점명처럼 보이는 값
      const merchantCandidates = cells
        .map((cell, index) => ({ cell, index }))
        .filter(({ cell, index }) => {
          if (!cell) return false
          if (index === amountItem.index) return false
          if (cell === dateCell) return false
          if (/^\d+$/.test(cell.replace(/[^0-9]/g, ''))) return false
          if (cell.includes('본 인') || cell.includes('가족') || cell.includes('일시불') || cell.includes('할부')) return false
          if (['이용일', '이용구분', '가맹점', '이용금액', '총할부금액', '원금', '포인트명', '적립금액'].some((h) => cell.includes(h))) return false
          return true
        })

      if (merchantCandidates.length === 0) return

      // 보통 이용구분 다음 컬럼이 가맹점이므로, 금액보다 왼쪽에 있는 마지막 텍스트를 우선 사용
      const beforeAmount = merchantCandidates.filter((item) => item.index < amountItem.index)
      const merchant = (beforeAmount.at(-1) || merchantCandidates[0]).cell

      parsed.push({
        date: normalizeDateText(dateCell),
        merchant,
        amount: amountItem.amount,
        category: classifyMerchant(merchant),
        sheetName,
      })
    })

    return parsed
  }

  const calculateStatementSummary = (rows) => {
    const totals = { food: 0, transport: 0, cafe: 0, shopping: 0, fuel: 0, etc: 0 }
    rows.forEach((row) => {
      totals[row.category] = (totals[row.category] || 0) + row.amount
    })

    const months = new Set(rows.map((row) => getMonthKey(row.date)).filter(Boolean))
    const monthCount = Math.max(months.size, 1)

    return {
      totalRows: rows.length,
      totalAmount: Object.values(totals).reduce((sum, value) => sum + value, 0),
      months: monthCount,
      monthlyAverage: {
        food: Math.round(totals.food / monthCount),
        transport: Math.round(totals.transport / monthCount),
        cafe: Math.round(totals.cafe / monthCount),
        shopping: Math.round(totals.shopping / monthCount),
        fuel: Math.round(totals.fuel / monthCount),
        etc: Math.round(totals.etc / monthCount),
      },
    }
  }

  const getEtcAnalysis = (rows) => {
    const etcRows = rows.filter((row) => row.category === 'etc')
    const totalAmount = rows.reduce((sum, row) => sum + row.amount, 0)
    const etcAmount = etcRows.reduce((sum, row) => sum + row.amount, 0)
  
    const merchantMap = {}
  
    etcRows.forEach((row) => {
      const key = row.merchant
      if (!merchantMap[key]) {
        merchantMap[key] = {
          merchant: key,
          amount: 0,
          count: 0,
        }
      }
  
      merchantMap[key].amount += row.amount
      merchantMap[key].count += 1
    })
  
    return {
      etcRate: totalAmount > 0 ? Math.round((etcAmount / totalAmount) * 100) : 0,
      etcAmount,
      merchants: Object.values(merchantMap)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10),
    }
  }

  const parseRowsFromOcrText = (text) => {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
  
    const parsed = []
  
    lines.forEach((line) => {
      const cleanLine = line.replace(/\s+/g, ' ')
  
      // 금액 추출: 5,800 / 5800 / 18,900원 형태
      const amountMatch = cleanLine.match(/(\d{1,3}(,\d{3})+|\d{4,})(원)?/g)
      if (!amountMatch || amountMatch.length === 0) return
  
      const amountText = amountMatch[amountMatch.length - 1]
      const amount = parseAmount(amountText)
      if (amount <= 0) return
  
      // 날짜 추출: 2026.05.01 / 2026-05-01 / 05.01 형태
      const dateMatch = cleanLine.match(/(\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2}|\d{1,2}[.\-/]\d{1,2})/)
      const date = dateMatch ? normalizeDateText(dateMatch[0]) : ''
  
      // 가맹점명 추출: 날짜와 금액 제거
      let merchant = cleanLine
        .replace(dateMatch?.[0] || '', '')
        .replace(amountText, '')
        .replace(/승인|일시불|체크|신용|국내|이용|결제|원/g, '')
        .trim()
  
      // 너무 짧거나 숫자만 남으면 제외
      if (!merchant || merchant.length < 2 || /^[0-9\s,.-]+$/.test(merchant)) return
  
      const category = classifyMerchant(merchant)
  
      parsed.push({
        date,
        merchant,
        amount,
        category,
        sheetName: 'OCR',
      })
    })
  
    return parsed
  }

  const handleImageStatementUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
  
    try {
      setSelectedFileName(file.name)
      setOcrLoading(true)
      setUploadMessage('이미지 명세서에서 텍스트를 추출하는 중입니다. 잠시만 기다려주세요.')
  
      const result = await Tesseract.recognize(file, 'kor+eng', {
        logger: (m) => console.log(m),
      })
  
      const text = result.data.text || ''
      setOcrText(text)
  
      const rows = parseRowsFromOcrText(text)
      setOcrRows(rows)
  
      if (rows.length === 0) {
        setUploadMessage('이미지에서 거래내역을 자동으로 읽지 못했습니다. 날짜, 가맹점명, 금액이 한 줄에 보이도록 캡처한 이미지로 다시 시도해주세요.')
        return
      }
  
      const summary = calculateStatementSummary(rows)
  
      setStatementRows(rows)
      setAnalysisSource('statement')
      setFood(formatNumber(String(summary.monthlyAverage.food)))
      setTransport(formatNumber(String(summary.monthlyAverage.transport)))
      setCafe(formatNumber(String(summary.monthlyAverage.cafe)))
      setShopping(formatNumber(String(summary.monthlyAverage.shopping)))
      setFuel(formatNumber(String(summary.monthlyAverage.fuel)))
      setEtc(formatNumber(String(summary.monthlyAverage.etc)))
  
      setUploadMessage(`${rows.length}건의 소비내역 분석이 완료되었습니다.`)
    } catch (error) {
      console.error(error)
      setUploadMessage('이미지 OCR 처리 중 오류가 발생했습니다.')
    } finally {
      setOcrLoading(false)
    }
  }

  const handleUnifiedStatementUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const isImageFile = file.type.startsWith('image/')
    if (isImageFile) {
      handleImageStatementUpload(event)
      return
    }

    handleStatementUpload(event)
  }

  const handleStatementUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setSelectedFileName(file.name)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target.result
        let rows = []

        try {
          rows = parseStatementWorkbook(arrayBuffer)
        } catch (workbookError) {
          console.warn('엑셀 파싱 실패, CSV 텍스트 파싱으로 재시도:', workbookError)
          const text = new TextDecoder('utf-8').decode(arrayBuffer)
          rows = parseStatementCsvText(text)
        }

        console.log('명세서 분석 결과:', rows)

        if (rows.length === 0) {
          setUploadMessage('명세서에서 사용 내역을 읽지 못했습니다. 파일이 엑셀에서 정상적으로 열리는지, 그리고 가맹점/이용금액 컬럼이 있는지 확인해주세요. 콘솔(F12) 로그도 확인해주세요.')
          return
        }

        const summary = calculateStatementSummary(rows)
        setStatementRows(rows)
        setAnalysisSource('statement')
        setFood(formatNumber(String(summary.monthlyAverage.food)))
        setTransport(formatNumber(String(summary.monthlyAverage.transport)))
        setCafe(formatNumber(String(summary.monthlyAverage.cafe)))
        setShopping(formatNumber(String(summary.monthlyAverage.shopping)))
        setFuel(formatNumber(String(summary.monthlyAverage.fuel)))
        setEtc(formatNumber(String(summary.monthlyAverage.etc)))
        setUploadMessage(`${rows.length}건의 소비내역 분석이 완료되었습니다.`)
      } catch (error) {
        console.error(error)
        setUploadMessage('명세서 분석 중 오류가 발생했습니다. CSV 또는 엑셀 파일 형식인지 확인해주세요.')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const clearCsvData = () => {
    setStatementRows([])
    setOcrText('')
    setOcrRows([])
    setAnalysisSource('manual')
    setUploadMessage('')
    setSelectedFileName('')
  }

  const getReason = (cardName) => {
    if (cardName === '삼성 taptap O 카드') return '식비와 카페 소비 비중이 높은 사용자에게 잘 맞는 카드입니다.'
    if (cardName === '현대 ZERO Edition2 카드' || cardName === '현대 ZERO 카드') return '여러 소비 항목에서 고르게 활용하기 좋은 균형형 카드입니다.'
    if (cardName === '롯데 LIKIT FUN 카드') return '쇼핑과 온라인 결제 비중이 높은 사용자에게 유리한 카드입니다.'
    if (cardName === '신한 Deep Dream 카드') return '교통과 생활 영역 중심 소비자에게 적합한 카드입니다.'
    if (cardName === '신한 Deep Dream 체크') return '생활 소비 전반에서 무난하게 쓰기 좋은 체크카드입니다.'
    if (cardName === 'KB 국민 노리 체크카드') return '교통과 카페 소비가 많은 사용자에게 잘 맞는 체크카드입니다.'
    return '소비 패턴 전반을 고려했을 때 활용성이 높은 카드입니다.'
  }

  const getBenefitRate = (card, key) => {
    const oldKeyMap = {
      food: 'foodBenefit',
      transport: 'transportBenefit',
      cafe: 'cafeBenefit',
      shopping: 'shoppingBenefit',
      fuel: 'fuelBenefit',
    }

    const benefitData = card.benefits?.[key]
    if (typeof benefitData === 'number') return benefitData
    if (typeof benefitData === 'object' && benefitData !== null) return benefitData.rate || 0
    return Number(card[oldKeyMap[key]]) || 0
  }

  const getBenefitType = (card, key) => {
    const benefitData = card.benefits?.[key]
    if (typeof benefitData === 'object' && benefitData !== null && benefitData.type) return benefitData.type
    return card.benefitTypes?.[key] || (getBenefitRate(card, key) > 0 ? '할인/적립' : '혜택 없음')
  }

  const getBenefitLimit = (card, key) => {
    const benefitData = card.benefits?.[key]
    if (typeof benefitData === 'object' && benefitData !== null && benefitData.limit !== undefined) return benefitData.limit
    if (card.limits?.[key] !== undefined) return card.limits[key]
    return 999999
  }

  const calculateBenefitByCategory = (amount, rate, limit) => Math.min(amount * rate, limit)

  const calculateCardScore = (card, spending) => {
    const keys = ['food', 'transport', 'cafe', 'shopping', 'fuel', 'etc']
    const totalSpending = keys.reduce((sum, key) => sum + spending[key], 0)
    const requiredPreviousMonth = Number(card.previousMonth || card.minSpend || 0)
    const annualFee = Number(card.annualFee || 0)
    const isEligible = totalSpending >= requiredPreviousMonth

    // 졸업작품 시연에서는 3개월 명세서 기반 '예상 혜택'을 보여주는 것이 핵심이므로,
    // 전월실적 미달이어도 예상 혜택은 계산하고, 최종점수에서만 감점합니다.
    // 이렇게 해야 CSV 샘플 금액이 작아도 결과가 전부 0점으로 보이지 않습니다.
    const eligibilityNotice = !isEligible && requiredPreviousMonth > 0
      ? ` 단, 월평균 소비금액이 전월실적 조건 ${requiredPreviousMonth.toLocaleString()}원보다 낮아 실제 혜택 적용에는 제한이 있을 수 있습니다.`
      : ''

    const categoryBenefits = keys.reduce((acc, key) => {
      acc[key] = calculateBenefitByCategory(spending[key], getBenefitRate(card, key), getBenefitLimit(card, key))
      return acc
    }, {})

    const totalBenefit = Object.values(categoryBenefits).reduce((sum, value) => sum + value, 0)
    const estimatedPoint = Math.round(totalBenefit * 0.4)
    const estimatedDiscount = Math.round(totalBenefit * 0.6)

    const spendingWeights = keys.reduce((acc, key) => {
      acc[key] = totalSpending > 0 ? spending[key] / totalSpending : 0
      return acc
    }, {})

    const weightedBenefitRate = keys.reduce((sum, key) => sum + getBenefitRate(card, key) * spendingWeights[key], 0)
    const benefitScore = Math.min(totalBenefit / Math.max(totalSpending * 0.05, 1), 1) * 70
    const fitScore = Math.min(weightedBenefitRate / 0.1, 1) * 20
    const feeScore = annualFee === 0 ? 10 : Math.max(0, 10 - annualFee / 2000)
    const eligibilityPenalty = !isEligible && requiredPreviousMonth > 0 ? 10 : 0
    const finalScore = Math.max(0, Math.round((benefitScore + fitScore + feeScore - eligibilityPenalty) * 10) / 10)
    const matchRate = Math.min(100, Math.round(finalScore))

    const topCategory = Object.entries(categoryBenefits).sort((a, b) => b[1] - a[1])[0]
    const topCategoryText = topCategory && topCategory[1] > 0
      ? `${categoryLabels[topCategory[0]]}에서 약 ${Math.round(topCategory[1]).toLocaleString()}원의 혜택이 가장 크게 계산되었습니다.`
      : '입력한 소비 항목에서 계산 가능한 혜택이 크지 않습니다.'

    const availableBenefits = keys
      .filter((key) => getBenefitRate(card, key) > 0)
      .map((key) => `${categoryLabels[key]} ${Math.round(getBenefitRate(card, key) * 100)}% ${getBenefitType(card, key)}`)
      .join(' · ')

    return {
      ...card,
      previousMonth: requiredPreviousMonth,
      annualFee,
      totalBenefit,
      estimatedPoint,
      estimatedDiscount,
      matchRate,
      finalScore,
      categoryBenefits,
      availableBenefits,
      reason: `${getReason(card.name)} ${topCategoryText}${eligibilityNotice}`,
      isEligible,
    }
  }

  const spending = useMemo(() => ({
    food: getNumber(food),
    transport: getNumber(transport),
    cafe: getNumber(cafe),
    shopping: getNumber(shopping),
    fuel: getNumber(fuel),
    etc: getNumber(etc),
  }), [food, transport, cafe, shopping, fuel, etc])

  const totalConsumption = Object.values(spending).reduce((sum, value) => sum + value, 0)
  const statementSummary = useMemo(() => calculateStatementSummary(statementRows), [statementRows])

  const getSummary = () => {
    const items = Object.entries(spending).map(([key, value]) => ({ label: categoryLabels[key], value }))
    const top = [...items].sort((a, b) => b.value - a.value)[0]
    if (!top || top.value === 0) return '입력한 소비 패턴을 바탕으로 카드를 추천했습니다.'
    const sourceText = analysisSource === 'statement' ? '최근 3개월 명세서 기반 월평균 소비에서' : '직접 입력한 소비금액에서'
    return `${sourceText} ${top.label} 비중이 높은 것으로 분석되어 추천 결과를 정리했습니다.`
  }

  const getReasonTags = () => {
    const entries = Object.entries(spending).filter(([, value]) => value > 0).sort((a, b) => b[1] - a[1])
    const tags = entries.slice(0, 2).map(([key]) => `${categoryLabels[key]} 중심`)
    tags.push(cardType === '신용카드' ? '신용카드 선호' : '체크카드 선호')
    if (analysisSource === 'statement') tags.push('3개월 명세서 분석')
    return tags
  }

  const handleRecommend = () => {
    if (totalConsumption === 0) {
      setMessage('소비 금액을 한 항목 이상 입력하거나 CSV/엑셀 명세서를 업로드해주세요.')
      setResults([])
      return
    }

    const baseCards = cards

    const filteredCards = baseCards.filter((card) => {
      if (cardType === '신용카드') return card.cardType === 'credit'
      if (cardType === '체크카드') return card.cardType === 'check'
      return true
    })

    const calculated = filteredCards.map((card) => calculateCardScore(card, spending))

    if (calculated.length === 0) {
      setMessage('추천 가능한 카드가 없습니다. cards.js에 해당 유형의 카드를 추가해주세요.')
      setResults([])
      return
    }

    const sorted = calculated.sort((a, b) => b.finalScore - a.finalScore).slice(0, 3)
    setResults(sorted)
    setMessage('')
    setShowFavoritesOnly(false)
    setStep(3)
  }

  const resetSurvey = () => {
    setStep(2)
    setResults([])
    setMessage('')
    setShowFavoritesOnly(false)
  }

  const toggleFavorite = (cardId) => {
    setFavorites((prev) => (prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]))
  }

  const displayedResults = showFavoritesOnly ? results.filter((card) => favorites.includes(card.id)) : results
  const maxBenefitValue = displayedResults.length > 0 ? Math.max(...displayedResults.map((card) => card.totalBenefit)) : 0
  const minAnnualFee = displayedResults.length > 0 ? Math.min(...displayedResults.map((card) => card.annualFee)) : 0

  const spendingItems = [
    { key: 'food', label: '식비', value: spending.food, icon: '🍽️' },
    { key: 'transport', label: '교통', value: spending.transport, icon: '🚇' },
    { key: 'cafe', label: '카페', value: spending.cafe, icon: '☕' },
    { key: 'shopping', label: '쇼핑', value: spending.shopping, icon: '🛍️' },
    { key: 'fuel', label: '주유', value: spending.fuel, icon: '⛽' },
    { key: 'etc', label: '기타', value: spending.etc, icon: '📌' },
  ]

  const sampleRows = statementRows.slice(0, 5)

  const CardVisual = ({ card }) => (
    <div style={{
      width: '210px', height: '132px', borderRadius: '22px', padding: '18px', boxSizing: 'border-box',
      background: `linear-gradient(135deg, ${getCardColor(card.id)} 0%, #111827 100%)`, color: '#ffffff',
      boxShadow: '0 26px 52px rgba(15, 23, 42, 0.30)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transform: 'rotate(-3deg)', border: '1px solid rgba(255,255,255,0.28)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', opacity: 0.82 }}>{card.company}</span>
        <span style={{ width: '34px', height: '24px', borderRadius: '8px', background: 'rgba(255,255,255,0.32)' }} />
      </div>
      <div>
        <div style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '-0.04em' }}>{card.name}</div>
        <div style={{ marginTop: '8px', fontSize: '12px', opacity: 0.8 }}>****  ****  ****  {String(card.id || 1).padStart(4, '0')}</div>
      </div>
    </div>
  )


  const MotionStyles = () => (
    <style>{`
      html, body, #root {
        width: 100%;
        max-width: 100%;
        min-width: 0;
        min-height: 100%;
        margin: 0 !important;
        padding: 0 !important;
        background: #f8fbff !important;
        overflow-x: hidden !important;
      }

      body { display: block !important; }

      #root {
        max-width: none !important;
        text-align: initial !important;
      }

      * { box-sizing: border-box; }
      body * { max-width: 100%; }

      .spend-input-card,
      .result-spend-card,
      .recommend-card,
      .primary-action,
      .upload-card {
        transition: transform 220ms cubic-bezier(.2,.8,.2,1), box-shadow 220ms ease, border-color 220ms ease, background 220ms ease;
      }

      .spend-input-card,
      .result-spend-card,
      .recommend-card {
        animation: cardRise 520ms cubic-bezier(.2,.8,.2,1) both;
      }

      .spend-input-card:hover,
      .result-spend-card:hover,
      .recommend-card:hover {
        transform: translateY(-8px) scale(1.012);
        box-shadow: 0 30px 70px rgba(15, 23, 42, 0.14) !important;
        border-color: rgba(37, 99, 235, 0.32) !important;
      }

      .primary-action:hover {
        transform: translateY(-4px) scale(1.01);
        box-shadow: 0 28px 60px rgba(37, 99, 235, 0.32) !important;
      }

      .upload-card { animation: softGlow 3.2s ease-in-out infinite alternate; }

      .spend-bar {
        animation: growBar 900ms cubic-bezier(.2,.8,.2,1) both;
        transform-origin: left center;
      }

      .match-ring { animation: ringPop 760ms cubic-bezier(.2,.8,.2,1) both; }

      .benefit-chip { transition: transform 180ms ease, background 180ms ease; }

      .recommend-card:hover .benefit-chip {
        transform: translateY(-2px);
        background: rgba(239,246,255,0.98) !important;
      }

      .card-visual-wrap { transition: transform 260ms cubic-bezier(.2,.8,.2,1); }

      .recommend-card:hover .card-visual-wrap { transform: rotate(2deg) scale(1.04); }

      .amount-pill { transition: background 180ms ease, border-color 180ms ease, transform 180ms ease; }

      .spend-input-card:hover .amount-pill {
        background: #f8fbff !important;
        border-color: rgba(37, 99, 235, 0.28) !important;
      }

      @media (max-width: 1180px) {
        .result-summary-grid { grid-template-columns: 1fr !important; }
        .spend-result-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        .recommend-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
      }

      @media (max-width: 760px) {
        .hero-grid,
        .result-summary-grid,
        .result-analysis-top,
        .recommend-grid,
        .spend-result-grid,
        .form-grid-2,
        .spend-form-grid {
          grid-template-columns: 1fr !important;
        }

        .hero-grid {
          padding: 30px 22px !important;
          gap: 28px !important;
          min-height: auto !important;
          border-radius: 28px !important;
        }

        .hero-grid h1 {
          font-size: 54px !important;
          line-height: 1.05 !important;
          word-break: keep-all !important;
        }

        .hero-grid p {
          font-size: 16px !important;
          line-height: 1.6 !important;
          word-break: keep-all !important;
        }

        .upload-card {
          padding: 24px 18px !important;
          border-radius: 28px !important;
        }

        .upload-card h2 {
          font-size: 24px !important;
          line-height: 1.25 !important;
        }

        .upload-card label {
          flex-direction: column !important;
          align-items: flex-start !important;
          gap: 8px !important;
          padding: 18px !important;
        }

        .upload-card label span {
          width: 100% !important;
          white-space: normal !important;
          word-break: keep-all !important;
        }

        .spend-input-card {
          padding: 20px !important;
          border-radius: 24px !important;
        }

        .spend-input-card:hover,
        .result-spend-card:hover,
        .recommend-card:hover,
        .primary-action:hover {
          transform: none !important;
        }

        .amount-pill input {
          padding-right: 54px !important;
          font-size: 16px !important;
          text-align: right !important;
        }

        .amount-pill span {
          right: 16px !important;
          font-size: 15px !important;
          pointer-events: none !important;
        }

        .result-header-panel {
          padding: 28px 22px !important;
          margin-bottom: 24px !important;
          border-radius: 28px !important;
        }

        .result-header-title {
          font-size: 36px !important;
          line-height: 1.12 !important;
          word-break: keep-all !important;
        }

        .result-analysis-top {
          gap: 18px !important;
          margin-bottom: 22px !important;
        }

        .result-analysis-top h2 {
          font-size: 28px !important;
          line-height: 1.15 !important;
          word-break: keep-all !important;
          text-align: center !important;
        }

        .result-analysis-top p {
          text-align: center !important;
          font-size: 15px !important;
        }

        .result-analysis-top > div:last-child {
          width: 100% !important;
          text-align: center !important;
          padding: 18px 20px !important;
        }

        .spend-result-grid {
          gap: 14px !important;
        }

        .result-spend-card {
          padding: 20px !important;
          border-radius: 24px !important;
          min-height: auto !important;
        }

        .result-spend-card > div:first-child {
          width: 70px !important;
          height: 70px !important;
          right: -20px !important;
          top: -20px !important;
        }

        .result-spend-card [data-amount='true'] {
          font-size: 22px !important;
          line-height: 1.15 !important;
          word-break: keep-all !important;
        }

        .recommend-card {
          padding: 24px !important;
          border-radius: 28px !important;
          width: 100% !important;
        }

        .recommend-card h2 {
          font-size: 26px !important;
          line-height: 1.15 !important;
          word-break: keep-all !important;
        }

        .card-visual-wrap > div {
          width: 100% !important;
          max-width: 260px !important;
        }

        button { max-width: 100% !important; }
      }

      @keyframes growBar {
        from { transform: scaleX(0); }
        to { transform: scaleX(1); }
      }

      @keyframes cardRise {
        from { opacity: 0; transform: translateY(18px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @keyframes ringPop {
        from { opacity: 0; transform: scale(.84) rotate(-12deg); }
        to { opacity: 1; transform: scale(1) rotate(0deg); }
      }

      @keyframes softGlow {
        from { box-shadow: 0 24px 56px rgba(37,99,235,0.22); }
        to { box-shadow: 0 32px 72px rgba(124,58,237,0.28); }
      }
    `}</style>
  )

  if (step === 1) {
    return (
      <div style={pageStyle}>
        <MotionStyles />



        <div style={containerStyle}>
        <div
          className="hero-grid"
          style={{
            ...panelStyle,
            minHeight: '76vh',
            padding: '54px',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.1fr) minmax(300px, 0.9fr)',
            gap: '42px',
            alignItems: 'center',
          }}
        >
            <div>
              <div style={{ ...tagStyle, display: 'inline-flex', marginBottom: '22px' }}>CARD FIT RECOMMENDER</div>
              <h1 style={{ fontSize: '72px', lineHeight: 1.02, margin: '0 0 20px', letterSpacing: '-0.09em', color: '#111827', fontWeight: 950 }}>카드핏</h1>
              <p style={{ fontSize: '20px', lineHeight: 1.7, color: '#344054', margin: '0 0 34px', fontWeight: 500 }}>
                내 소비내역을 바탕으로 혜택이 가장 잘 맞는 카드를 찾아드립니다.
              </p>
              <button className="primary-action" onClick={() => setStep(2)} style={{ ...buttonPrimary, padding: '18px 30px' }}>맞춤 카드 찾기 시작하기</button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
              <div style={{ position: 'absolute', width: '260px', height: '260px', borderRadius: '50%', background: '#dbeafe', filter: 'blur(8px)' }} />
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <CardVisual card={{ id: 1, name: 'Benefit Pick', company: 'JINI CARD' }} />
                <div style={{ marginLeft: '42px' }}><CardVisual card={{ id: 2, name: 'Smart Match', company: 'CARD AI' }} /></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (step === 2) {
    return (
      <div style={pageStyle}>
        <MotionStyles />
        <div style={containerStyle}>
          <div style={{ textAlign: 'center', marginBottom: '34px' }}>
            <div style={{ ...tagStyle, display: 'inline-flex', marginBottom: '14px' }}>STEP 01</div>
            <h1 style={{ fontSize: '46px', margin: '0 0 12px', letterSpacing: '-0.06em', color: '#111827' }}>소비 정보 입력</h1>
            <p style={{ color: '#344054', fontSize: '18px', margin: 0, fontWeight: 600 }}>엑셀, CSV, 이미지 명세서를 업로드하거나 직접 월평균 소비금액을 입력하세요.</p>
          </div>

          <div style={{ ...panelStyle, maxWidth: '900px', margin: '0 auto', padding: '34px' }}>
            <div className="upload-card" style={{ padding: '30px', borderRadius: '30px', background: 'linear-gradient(135deg, #111827 0%, #1d4ed8 58%, #7c3aed 100%)', border: '1px solid rgba(255,255,255,0.34)', marginBottom: '24px', color: '#ffffff', boxShadow: '0 24px 56px rgba(37,99,235,0.26)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: '-70px', top: '-90px', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'inline-flex', padding: '8px 12px', borderRadius: '999px', background: 'rgba(255,255,255,0.16)', fontSize: '13px', fontWeight: 900, marginBottom: '14px' }}>명세서 자동 분석</div>
                <h2 style={{ ...sectionTitleStyle, fontSize: '28px', color: '#ffffff', textAlign: 'center' }}>최근 소비내역 업로드</h2>
                <p style={{ color: 'rgba(255,255,255,0.82)', lineHeight: 1.6, fontWeight: 700, textAlign: 'center', margin: '10px 0 24px' }}>
                  파일 한 번으로 소비패턴을 분석하고 월평균 금액을 자동 입력합니다.
                </p>

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', padding: '18px 20px', borderRadius: '22px', background: 'rgba(255,255,255,0.96)', color: '#111827', cursor: ocrLoading ? 'not-allowed' : 'pointer', boxShadow: '0 18px 38px rgba(15,23,42,0.18)', border: '1px solid rgba(255,255,255,0.65)' }}>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls,image/*,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                    onChange={handleUnifiedStatementUpload}
                    style={{ display: 'none' }}
                    disabled={ocrLoading}
                  />
                  <span style={{ fontWeight: 950, color: '#1d4ed8' }}>{ocrLoading ? '분석 중입니다...' : '엑셀 · CSV · 이미지 업로드'}</span>
                  <span style={{ color: '#667085', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFileName || '선택된 파일 없음'}</span>
                </label>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '16px' }}>
                  <span style={{ padding: '7px 11px', borderRadius: '999px', background: 'rgba(255,255,255,0.14)', fontSize: '13px', fontWeight: 850 }}>Excel</span>
                  <span style={{ padding: '7px 11px', borderRadius: '999px', background: 'rgba(255,255,255,0.14)', fontSize: '13px', fontWeight: 850 }}>CSV</span>
                  <span style={{ padding: '7px 11px', borderRadius: '999px', background: 'rgba(255,255,255,0.14)', fontSize: '13px', fontWeight: 850 }}>Image</span>
                  {statementRows.length > 0 && <button type="button" onClick={clearCsvData} style={{ ...buttonSecondary, padding: '7px 12px', borderRadius: '999px', fontSize: '13px' }}>초기화</button>}
                </div>

                {uploadMessage && (
                  <div style={{ marginTop: '18px', padding: '16px 18px', borderRadius: '18px', background: statementRows.length > 0 ? 'rgba(16,185,129,0.16)' : 'rgba(239,68,68,0.16)', color: '#ffffff', fontWeight: 900, textAlign: 'center' }}>
                    {uploadMessage}
                  </div>
                )}
              </div>
            </div>

            <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <select value={age} onChange={(e) => setAge(e.target.value)} style={inputStyle}>
                <option value="">연령대 선택</option><option value="10">10대</option><option value="20">20대</option><option value="30">30대</option><option value="40">40대</option><option value="50">50대 이상</option>
              </select>
              <select value={job} onChange={(e) => setJob(e.target.value)} style={inputStyle}>
                <option value="">직업 선택</option><option value="대학생">대학생</option><option value="직장인">직장인</option><option value="프리랜서">프리랜서</option><option value="자영업">자영업</option><option value="기타">기타</option>
              </select>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <p style={{ margin: '0 0 10px', color: '#344054', fontWeight: 800 }}>카드 유형</p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setCardType('신용카드')} style={optionButton(cardType === '신용카드')}>신용카드</button>
                <button type="button" onClick={() => setCardType('체크카드')} style={optionButton(cardType === '체크카드')}>체크카드</button>
              </div>
            </div>

            <div style={{ margin: '22px 0 14px', textAlign: 'center' }}>
              <h2 style={{ ...sectionTitleStyle, fontSize: '24px' }}>소비 패턴 입력</h2>
              <p style={{ margin: '8px 0 0', color: '#667085', fontWeight: 700 }}>업로드 결과를 확인하거나 직접 수정할 수 있어요.</p>
            </div>

            <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              {[
                { label: '식비', icon: '🍽️', value: food, setter: setFood, placeholder: '월 식비' },
                { label: '교통', icon: '🚇', value: transport, setter: setTransport, placeholder: '월 교통비' },
                { label: '카페', icon: '☕', value: cafe, setter: setCafe, placeholder: '월 카페비' },
                { label: '쇼핑', icon: '🛍️', value: shopping, setter: setShopping, placeholder: '월 쇼핑비' },
                { label: '주유', icon: '⛽', value: fuel, setter: setFuel, placeholder: '월 주유비' },
                { label: '기타', icon: '📌', value: etc, setter: setEtc, placeholder: '월 기타 소비' },
              ].map((item, index) => (
                <div key={item.label} className="spend-input-card" style={{ animationDelay: `${index * 70}ms`, padding: '22px', borderRadius: '26px', background: '#ffffff', border: '1px solid rgba(148,163,184,0.22)', boxShadow: '0 16px 36px rgba(15,23,42,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', color: '#344054', fontWeight: 950, fontSize: '20px' }}>
                    <span style={{ fontSize: '22px' }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  <div className="amount-pill" style={{ position: 'relative', borderRadius: '18px' }}>
                    <input
                      type="text"
                      placeholder={item.placeholder}
                      value={item.value}
                      onChange={(e) => { setAnalysisSource('manual'); item.setter(formatNumber(e.target.value)) }}
                      style={{ ...inputStyle, borderRadius: '18px', boxShadow: 'none', paddingRight: '58px', fontSize: '18px', fontWeight: 850, textAlign: 'right', letterSpacing: '-0.03em' }}
                    />
                    {item.value && <span style={{ position: 'absolute', right: '18px', top: '50%', transform: 'translateY(-50%)', color: '#667085', fontWeight: 950, fontSize: '17px' }}>원</span>}
                  </div>
                </div>
              ))}
            </div>

            {totalConsumption > 0 && (
              <div style={{ marginTop: '18px', padding: '18px 20px', borderRadius: '22px', background: '#f8fbff', border: '1px solid rgba(37,99,235,0.14)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px' }}>
                <span style={{ color: '#344054', fontWeight: 900 }}>월 평균 총 소비</span>
                <span style={{ color: '#1d4ed8', fontWeight: 950, fontSize: '24px', letterSpacing: '-0.04em' }}>{totalConsumption.toLocaleString()}원</span>
              </div>
            )}



            {message && <p style={{ color: '#ef4444', margin: '16px 0 0', fontWeight: 700 }}>{message}</p>}
            <button className="primary-action" onClick={handleRecommend} style={{ ...buttonPrimary, width: '100%', marginTop: '22px' }}>카드 추천받기</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      <MotionStyles />
      <div style={containerStyle}>
        <div className="result-header-panel" style={{ ...panelStyle, padding: '46px 38px', textAlign: 'center', marginBottom: '48px', background: 'linear-gradient(135deg, rgba(239,246,255,0.96), rgba(245,243,255,0.96))' }}>
          <div style={{ ...tagStyle, display: 'inline-flex', marginBottom: '18px' }}>STEP 02</div>
          <h1 className="result-header-title" style={{ fontSize: '56px', margin: '0 0 18px', letterSpacing: '-0.07em', color: '#111827', fontWeight: 950 }}>추천 결과</h1>
          <p style={{ color: '#344054', fontSize: '19px', lineHeight: 1.65, margin: '0 auto', maxWidth: '760px', fontWeight: 800 }}>{getSummary()}</p>
        </div>

        <div style={{ ...panelStyle, padding: '38px', marginBottom: '40px' }}>
          <div className="result-analysis-top" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '28px', alignItems: 'center', marginBottom: '30px' }}>
            <div>
              <h2 style={{ ...sectionTitleStyle, fontSize: '34px', margin: 0, textAlign: 'left' }}>소비패턴 분석</h2>
              <p style={{ color: '#667085', fontWeight: 800, margin: '12px 0 0', fontSize: '17px', lineHeight: 1.6 }}>
                {analysisSource === 'statement'
                  ? `명세서 ${statementSummary.totalRows}건을 ${statementSummary.months}개월 월평균으로 환산했습니다.`
                  : '입력한 월평균 소비금액을 기준으로 분석했습니다.'}
              </p>
            </div>
            <div style={{ minWidth: 0, padding: '20px 26px', borderRadius: '26px', background: 'linear-gradient(135deg, #111827 0%, #1d4ed8 100%)', color: '#ffffff', textAlign: 'right', boxShadow: '0 20px 44px rgba(29,78,216,0.22)' }}>
              <div style={{ fontSize: '14px', fontWeight: 800, opacity: 0.75, marginBottom: '6px' }}>월 평균 총 소비</div>
              <div style={{ fontWeight: 950, fontSize: '28px', letterSpacing: '-0.05em' }}>{totalConsumption.toLocaleString()}원</div>
            </div>
          </div>

          <div className="spend-result-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '18px', width: '100%' }}>
            {spendingItems.map((item, index) => {
              const percent = totalConsumption ? Math.round((item.value / totalConsumption) * 100) : 0
              return (
                <div key={item.key} className="result-spend-card" style={{ animationDelay: `${index * 80}ms`, background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)', borderRadius: '26px', padding: '24px', border: '1px solid rgba(148,163,184,0.18)', boxShadow: '0 16px 38px rgba(15, 23, 42, 0.07)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', right: '-28px', top: '-28px', width: '90px', height: '90px', borderRadius: '50%', background: 'rgba(37,99,235,0.07)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '15px', background: '#eef4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>{item.icon}</div>
                      <div style={{ color: '#111827', fontWeight: 950, fontSize: '18px', letterSpacing: '-0.04em' }}>{item.label}</div>
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 950, letterSpacing: '-0.05em', color: '#2563eb' }}>{percent}%</div>
                  </div>
                  <div data-amount="true" style={{ color: '#111827', fontSize: '23px', fontWeight: 950, letterSpacing: '-0.05em' }}>{item.value.toLocaleString()}원</div>
                  <div style={{ marginTop: '16px', height: '8px', background: '#eef2f7', borderRadius: '999px', overflow: 'hidden' }}>
                    <div className="spend-bar" style={{ width: `${percent}%`, height: '100%', background: 'linear-gradient(90deg, #2563eb, #7c3aed)', borderRadius: '999px' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="result-summary-grid" style={{ marginBottom: '22px', display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '22px', alignItems: 'stretch' }}>
          <div style={{ ...panelStyle, padding: '30px', background: 'linear-gradient(135deg, #111827 0%, #1d4ed8 58%, #7c3aed 100%)', color: '#ffffff', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: '-70px', top: '-80px', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(255,255,255,0.13)' }} />
            <div style={{ position: 'absolute', right: '70px', bottom: '-90px', width: '190px', height: '190px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'inline-flex', padding: '8px 13px', borderRadius: '999px', background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.18)', fontWeight: 900, fontSize: '13px', marginBottom: '18px' }}>CARD FIT RESULT</div>
              <h2 style={{ margin: 0, fontSize: '34px', letterSpacing: '-0.06em', fontWeight: 950 }}>가장 잘 맞는 카드 TOP {displayedResults.length}</h2>
              <p style={{ margin: '12px 0 0', color: 'rgba(255,255,255,0.78)', fontWeight: 700, lineHeight: 1.6 }}>
                소비패턴과 주요 혜택을 기준으로 어울리는 카드를 정리했어요.
              </p>
            </div>
          </div>

          <div style={{ ...panelStyle, padding: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <button onClick={() => setShowFavoritesOnly(!showFavoritesOnly)} style={{ ...buttonSecondary, padding: '16px 28px', borderRadius: '18px', fontSize: '15px', boxShadow: '0 14px 30px rgba(15,23,42,0.08)' }}>
              {showFavoritesOnly ? '전체 카드 보기' : '찜한 카드만 보기'}
            </button>
          </div>
        </div>

        <div className="recommend-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '24px', marginBottom: '28px' }}>
          {displayedResults.map((card, index) => {
            const isBest = index === 0
            const benefitPercent = maxBenefitValue ? Math.round((card.totalBenefit / maxBenefitValue) * 100) : 0
            const topBenefit = Object.entries(card.categoryBenefits || {}).sort((a, b) => b[1] - a[1])[0]
            const topBenefitLabel = topBenefit ? categoryLabels[topBenefit[0]] : '혜택'
            const topBenefitValue = topBenefit ? Math.round(topBenefit[1]) : 0
            return (
              <div
                key={card.id}
                className="recommend-card"
                style={{
                  ...panelStyle,
                  padding: isBest ? '30px' : '26px',
                  position: 'relative',
                  overflow: 'hidden',
                  background: isBest
                    ? 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(239,246,255,0.96) 100%)'
                    : 'rgba(255,255,255,0.92)',
                  border: isBest ? '1px solid rgba(37,99,235,0.32)' : '1px solid rgba(255,255,255,0.78)',
                  animationDelay: `${index * 110}ms`,
                }}
              >
                <div style={{ position: 'absolute', right: '-46px', top: '-50px', width: '160px', height: '160px', borderRadius: '50%', background: isBest ? 'rgba(37,99,235,0.10)' : 'rgba(15,23,42,0.04)' }} />
                <div style={{ marginBottom: '22px', position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px', marginBottom: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
                      <span style={{ ...tagStyle, background: isBest ? '#111827' : '#eef4ff', color: isBest ? '#ffffff' : '#1d4ed8' }}>TOP {index + 1}</span>
                      {isBest && <span style={{ ...tagStyle, background: '#fff7ed', color: '#ea580c', borderColor: 'rgba(234,88,12,0.16)' }}>BEST PICK</span>}
                      <span style={{ ...tagStyle, background: '#f8fafc', color: '#475467', borderColor: 'rgba(148,163,184,0.18)' }}>{card.cardType === 'credit' ? '신용카드' : '체크카드'}</span>
                    </div>
                    <button
                      onClick={() => toggleFavorite(card.id)}
                      aria-label="찜하기"
                      style={{ flex: '0 0 auto', width: '46px', height: '46px', borderRadius: '16px', border: '1px solid rgba(148,163,184,0.18)', background: favorites.includes(card.id) ? 'rgba(254,242,242,0.96)' : 'rgba(255,255,255,0.92)', color: favorites.includes(card.id) ? '#ef4444' : '#cbd5e1', fontSize: '23px', cursor: 'pointer', zIndex: 2, boxShadow: '0 10px 24px rgba(15,23,42,0.06)', lineHeight: 1 }}
                    >♥</button>
                  </div>
                  <h2 style={{ margin: '0 0 8px', fontSize: isBest ? '30px' : '25px', letterSpacing: '-0.06em', color: '#111827', fontWeight: 950 }}>{card.name}</h2>
                  <p style={{ color: '#667085', margin: 0, fontWeight: 850 }}>{card.company}</p>
                </div>

                <div className="card-visual-wrap" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 1 }}><CardVisual card={card} /></div>


                <div style={{ background: 'rgba(248,250,252,0.82)', borderRadius: '22px', padding: '18px', marginBottom: '16px', border: '1px solid rgba(226,232,240,0.85)' }}>
                  <div style={{ color: '#667085', fontSize: '13px', fontWeight: 900, marginBottom: '12px' }}>주요 혜택</div>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {(card.benefitLines || ['카드 혜택 정보 없음']).slice(0, 3).map((line, benefitIndex) => (
                      <div key={benefitIndex} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', color: '#111827', fontWeight: 850, lineHeight: 1.45 }}>
                        <span style={{ color: '#2563eb', fontWeight: 950 }}>✓</span>
                        <span>{line}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={() => window.open(card.link, '_blank')} style={{ ...buttonPrimary, width: '100%', padding: '15px 18px', borderRadius: '18px' }}>카드사에서 자세히 보기</button>
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button onClick={resetSurvey} style={buttonSecondary}>다시 설문하기</button>
          <button onClick={() => setStep(1)} style={buttonPrimary}>처음으로</button>
        </div>
      </div>
    </div>
  )
}

export default App
