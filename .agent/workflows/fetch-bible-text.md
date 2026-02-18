---
description: 성경 본문(개역개정) 데이터를 holybible.or.kr에서 가져와 로컬 JSON 파일로 저장하고, 앱에서 로컬 데이터를 우선 사용하는 방법
---

# 성경 본문 데이터 수집 및 관리 스킬

## 개요
이 스킬은 묵상 앱(ReturnHome)에서 사용하는 **개역개정(GAE)** 성경 텍스트를 관리하는 방법을 설명합니다.

## 데이터 소스
- **출처**: [다국어 성경 HolyBible](http://www.holybible.or.kr)
- **URL 패턴**: `http://www.holybible.or.kr/B_GAE/cgi/bibleftxt.php?VR=GAE&VL={책번호}&CN={장번호}&CV=99`
- **인코딩**: `euc-kr` (iconv-lite로 디코딩)

## 파일 구조
```
data/bible/
├── gal/          # 갈라디아서
│   ├── 1.json
│   ├── 2.json
│   └── ...
├── eph/          # 에베소서
├── rom/          # 로마서
└── ...
```

## JSON 파일 포맷
```json
{
  "book": "gal",
  "bookName": "갈라디아서",
  "bookNameEn": "Galatians",
  "chapter": 1,
  "verses": [
    { "verse": 1, "text": "사람들에게서 난 것도 아니요..." },
    { "verse": 2, "text": "함께 있는 모든 형제와..." }
  ],
  "fetchedAt": "2026-02-18T05:00:00.000Z"
}
```

## 사용법: 성경 텍스트 가져오기

### 스크립트 실행
```bash
# 특정 책 전체 가져오기
node scripts/fetch-bible.mjs gal

# 특정 장 범위만 가져오기
node scripts/fetch-bible.mjs rom 1 8

# 사용 가능한 책 코드: rom, co1, co2, gal, eph, phi, col, th1, th2, ti1, ti2, tit, phm
```

### 책 코드 매핑표

| 코드 | 한글명 | 영문명 | VL번호 | 장수 |
|------|--------|--------|--------|------|
| rom | 로마서 | Romans | 45 | 16 |
| co1 | 고린도전서 | 1 Corinthians | 46 | 16 |
| co2 | 고린도후서 | 2 Corinthians | 47 | 13 |
| gal | 갈라디아서 | Galatians | 48 | 6 |
| eph | 에베소서 | Ephesians | 49 | 6 |
| phi | 빌립보서 | Philippians | 50 | 4 |
| col | 골로새서 | Colossians | 51 | 4 |
| th1 | 데살로니가전서 | 1 Thessalonians | 52 | 5 |
| th2 | 데살로니가후서 | 2 Thessalonians | 53 | 3 |
| ti1 | 디모데전서 | 1 Timothy | 54 | 6 |
| ti2 | 디모데후서 | 2 Timothy | 55 | 4 |
| tit | 디도서 | Titus | 56 | 3 |
| phm | 빌레몬서 | Philemon | 57 | 1 |

## 데이터 사용 우선순위

앱에서 성경 본문을 표시할 때 다음 순서로 데이터를 가져옵니다:

1. **로컬 JSON 파일** (`data/bible/{book}/{chapter}.json`) - 우선
2. **Vercel API** (`/api/scrape-bible?book={code}&chapter={num}`) - 로컬에 없을 때
3. **직접 스크래핑** (holybible.or.kr) - 위 두 방법 실패 시

## HTML 파싱 규칙

holybible.or.kr의 HTML 구조:
```html
<li><font class=tk4l>절 본문 <a href="javascript:openDict(...)">사전단어</a> 계속되는 본문</font>
```

- 각 절은 `<li><font class=tk4l>` 태그로 감싸져 있음
- 절 번호는 HTML에 명시 X → 순서대로 1부터 매기기
- `<a>` 태그(사전 링크)는 제거하고 순수 텍스트만 추출

## 트러블슈팅

- **빈 결과**: 서버 인코딩이 `euc-kr`이므로 반드시 `iconv-lite`로 디코딩해야 합니다.
- **타임아웃**: 서버 부하를 줄이기 위해 장 사이에 1초 딜레이를 둡니다.
- **절 번호 불일치**: 원본 HTML에 절 번호가 없으므로 `<li>` 순서로 매김. 간혹 부제목이 섞여 들어올 수 있으니 결과를 확인하세요.
