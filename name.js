const Hangul = require("hangul-js");
/**
 * 한글 문자의 획수를 저장한 딕셔너리
 */
const STROKES_DICTIONARY = {
  ㄱ: 2,
  ㄴ: 2,
  ㄷ: 3,
  ㄹ: 5,
  ㅁ: 4,
  ㅂ: 4,
  ㅅ: 2,
  ㅇ: 1,
  ㅈ: 3,
  ㅊ: 4,
  ㅋ: 3,
  ㅌ: 4,
  ㅍ: 4,
  ㅎ: 3,
  ㄲ: 4,
  ㄸ: 6,
  ㅃ: 8,
  ㅆ: 4,
  ㅉ: 6,
  ㅏ: 2,
  ㅑ: 3,
  ㅓ: 2,
  ㅕ: 3,
  ㅗ: 2,
  ㅛ: 3,
  ㅜ: 2,
  ㅠ: 3,
  ㅡ: 1,
  ㅣ: 1,
  ㅘ: 4,
  ㅚ: 3,
  ㅙ: 5,
  ㅝ: 4,
  ㅞ: 5,
  ㅢ: 2,
  ㅐ: 3,
  ㅔ: 3,
  ㅟ: 3,
  ㅖ: 4,
  ㅒ: 4,
};

/**
 * 한글 문자의 총 획수를 계산
 * @param {string} character - 분석할 한글 문자
 * @param {boolean} keepOriginal - true면 10 이상이어도 그대로 유지, false면 한 자릿수로 변환
 * @returns {number} 총 획수
 */
function getStrokes(character, keepOriginal = false) {
  let totalStrokes = 0;
  for (let i = 0; i < character.length; i++) {
    if (character[i] in STROKES_DICTIONARY) {
      totalStrokes += STROKES_DICTIONARY[character[i]];
      // keepOriginal이 false일 때만 10 이상이면 10을 빼서 한 자릿수로 만듦
      if (!keepOriginal && totalStrokes >= 10) {
        totalStrokes -= 10;
      }
    }
  }
  return totalStrokes;
}

/**
 * 두 이름 중 더 긴 길이를 반환
 * @param {string} name - 첫 번째 이름
 * @param {string} name2 - 두 번째 이름
 * @returns {number} 최대 길이
 */
function nameLength(name, name2) {
  return Math.max(name.length, name2.length);
}

/**
 * 두 이름을 한 글자씩 번갈아 가며 배열로 결합
 * @param {string} name - 첫 번째 이름
 * @param {string} name2 - 두 번째 이름
 * @returns {string[]} 번갈아 배치된 글자 배열
 */
function nameCombine(name, name2) {
  const combinedChars = [];
  let maxLength = nameLength(name, name2);

  // 두 이름을 한 글자씩 번갈아가며 배치 (예: "철수", "영희" → ["철", "영", "수", "희"])
  for (let i = 0; i < maxLength; i++) {
    if (i < name.length) {
      combinedChars.push(name[i]);
    }
    if (i < name2.length) {
      combinedChars.push(name2[i]);
    }
  }

  return combinedChars;
}

/**
 * 한글 문자 배열의 각 획수를 계산
 * @param {string[]} nameArray - 한글 문자 배열
 * @returns {number[]} 획수 배열
 */
function nameStrokes(nameArray) {
  let strokeNumbers = [];

  // 각 글자를 자모로 분해하여 획수 계산 (예: "철" → ["ㅊ", "ㅓ", "ㄹ"] → 4+2+5=11)
  for (let i = 0; i < nameArray.length; i++) {
    let decomposedChar = Hangul.disassemble(nameArray[i]);
    let strokeCount = getStrokes(decomposedChar, true); // 원래 획수 유지
    strokeNumbers.push(strokeCount);
  }
  return strokeNumbers;
}

/**
 * 전통 획수 계산법을 사용한 한글 이름 궁합 계산
 *
 * 알고리즘 설명:
 * 1. 두 이름을 한 글자씩 번갈아 배치 (예: "철수" + "영희" → ["철", "영", "수", "희"])
 * 2. 각 글자를 자모로 분해하여 획수 계산 (예: "철" = ㅊ(4) + ㅓ(2) + ㄹ(5) = 11 → 1)
 * 3. 인접한 숫자들을 더해가며 반복 (예: [1,8,2,9] → [9,0,1] → [9,1] → 궁합점수: 91점)
 * 4. 최종 2자리 숫자가 궁합 점수
 *
 * @param {string} name - 첫 번째 이름
 * @param {string} name2 - 두 번째 이름
 * @returns {Object} 궁합 계산 상세 정보를 포함한 객체
 */
function nameDestiny(name, name2) {
  // 1단계: 두 이름을 번갈아 배치
  let combinedNameArray = nameCombine(name, name2);

  let calculationSteps = [];

  // 2단계: 첫 번째 획수 계산 - 인접한 글자들의 획수 합산
  let firstStepNumbers = [];
  for (let i = 0; i < combinedNameArray.length - 1; i++) {
    let combinedChars = Hangul.disassemble([
      combinedNameArray[i],
      combinedNameArray[i + 1],
    ]);
    let combinedStroke = getStrokes(combinedChars); // 기본값: 10 이상이면 한 자릿수로 변환
    firstStepNumbers.push(combinedStroke);
  }

  let currentNumbers = firstStepNumbers;
  calculationSteps.push(currentNumbers);
  let isFinished = false;
  let finalCompatibility;

  // 3단계: 숫자가 2개가 될 때까지 반복 계산
  while (!isFinished) {
    let nextStepNumbers = [];

    // 인접한 숫자끼리 더하기 (예: [1,2,3,4] → [3,5,7])
    for (let i = 0; i < currentNumbers.length - 1; i++) {
      let sum = currentNumbers[i] + currentNumbers[i + 1];
      if (sum >= 10) {
        sum -= 10; // 한 자릿수로 만들기
      }
      nextStepNumbers.push(sum);
    }

    currentNumbers = nextStepNumbers;

    // 숫자가 2개가 되면 완료
    if (currentNumbers.length == 2) {
      finalCompatibility = currentNumbers;
      isFinished = true;
      break;
    }
    calculationSteps.push(currentNumbers);
  }

  // 최종 결과 객체 생성
  let compatibilityResult = {
    name1: name, // 첫 번째 이름
    name2: name2, // 두 번째 이름
    combinedNameArray: combinedNameArray, // 번갈아 배치된 이름 (예: ["철", "영", "수", "희"])
    nameStrokeArray: nameStrokes(combinedNameArray), // 각 글자의 획수 (예: [11, 5, 4, 5])
    processArray: calculationSteps, // 단계별 계산 과정
    result: finalCompatibility, // 최종 궁합 결과 (2자리 숫자)
  };

  return compatibilityResult;
}

module.exports = { nameDestiny };

// 아래 주석 해제하고 node name.js 터미널에 실행해서 로직 테스트
// console.log(nameDestiny("홍길동", "아무개"));
