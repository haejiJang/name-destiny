const { nameDestiny } = require("./name.js");

// 앱 전체 설정값들
const CONFIG = Object.freeze({
  KOREAN_REGEX: /^[ㄱ-ㅎ|가-힣|]+$/, // 한글만 입력 가능
  MIN_NAME_LENGTH: 2, // 최소 이름 길이
  MAX_NAME_DIFF: 2, // 두 이름 길이 차이 최대값
  ANIMATION_DELAY: 1500, // 애니메이션 지연 시간 (밀리초)
  LONG_NAME_TOTAL_LENGTH: 7, // 긴 이름 조합의 총 글자수 (4+3)

  // 글꼴 크기 설정
  FONT_SIZES: Object.freeze({
    CHAR: "40px", // 기본 글자 크기
    STROKE: "32px", // 기본 획수 크기
    CHAR_SMALL: "32px", // 4글자 이름용 글자 크기
    STROKE_SMALL: "26px", // 4글자 이름용 획수 크기
    RESULT_SMALL: "32px", // 4글자 이름용 결과 크기
  }),

  // 색상 설정
  COLORS: Object.freeze({
    STROKE: "#bb2372", // 획수 표시 색상
  }),

  // 간격 설정
  GAPS: Object.freeze({
    NORMAL: "65px", // 기본 글자 간격
    SMALL: "55px", // 4글자 이름용 글자 간격
  }),

  // 이미지 크기 설정
  IMAGE_SIZES: Object.freeze({
    VLINE_NORMAL: "53px", // 기본 세로선 높이
    VLINE_SMALL: "42px", // 4글자 이름용 세로선 높이
  }),
});

// HTML 요소들을 쉽게 찾고 관리하는 클래스
class DOMManager {
  constructor() {
    this.elements = {
      mainScreen: document.getElementById("main-screen"),
      destinyResult: document.getElementById("destiny-result-container"),
      p1Input: document.getElementById("p1-input"),
      p2Input: document.getElementById("p2-input"),
      startButton: document.getElementById("start-button"),
      closeButton: document.getElementById("close-button"),
    };
  }

  get(elementName) {
    return this.elements[elementName];
  }

  hide(elementName) {
    const element = this.get(elementName);
    if (element) element.style.display = "none";
  }

  show(elementName, display = "flex") {
    const element = this.get(elementName);
    if (element) element.style.display = display;
  }
}

// 입력된 이름이 올바른지 확인하는 클래스
class Validator {
  static isValidKorean(text) {
    return CONFIG.KOREAN_REGEX.test(text);
  }

  static isValidLength(text) {
    return text.length >= CONFIG.MIN_NAME_LENGTH;
  }

  static isValidNamePair(name1, name2) {
    // 두 이름이 두 글자 이상 차이가 나면 계산 불가
    return Math.abs(name1.length - name2.length) < CONFIG.MAX_NAME_DIFF;
  }
}

// 이름 궁합 테스트의 모든 기능을 담은 메인 클래스
class NameDestinyApp {
  constructor() {
    this.dom = new DOMManager();
    this.phase1 = null;
    this.firstNameInput = "";
    this.secondNameInput = "";

    this.init();
  }

  init() {
    this.dom.hide("destinyResult");
    this.showMainScreen();
    this.setupEventListeners();
  }

  showMainScreen() {
    this.dom.show("mainScreen");
    const p1Input = this.dom.get("p1Input");
    if (p1Input) p1Input.focus();
  }

  // 게임 시작 - 이름 입력을 받아서 궁합 계산 시작
  startGame() {
    const p1Input = this.dom.get("p1Input");
    const p2Input = this.dom.get("p2Input");

    if (!p1Input || !p2Input) return;

    const name1 = p1Input.value;
    const name2 = p2Input.value;

    if (!Validator.isValidLength(name1) || !Validator.isValidLength(name2)) {
      alert("두 이름 모두 2글자 이상 입력해주세요.");
      return;
    }

    if (!Validator.isValidNamePair(name1, name2)) {
      alert(
        "이름은 2~4 글자 사이, 두 이름의 글자 수 차이는 1글자 이내만 가능합니다."
      );
      return;
    }

    this.firstNameInput = name1;
    this.secondNameInput = name2;
    this.phase1 = nameDestiny(name1, name2);
    this.showResult();
  }

  // 결과 화면 보여주기
  showResult() {
    this.dom.hide("mainScreen"); // 메인 화면 숨기기
    this.dom.show("destinyResult"); // 결과 화면 보여주기

    this.resultReveal(this.phase1); // 결과 애니메이션 시작
  }

  // 궁합 결과를 단계별로 애니메이션과 함께 보여주기
  resultReveal(phase) {
    // 화면에 입력받은 두 이름을 표시
    this.displayNames(phase);

    // 두 이름의 글자들과 각 글자의 획수를 화면에 표시
    this.displayNameCombination(phase);

    this.showFirstIteration().then(() => {
      this.showDestinyProcess(phase).then(() => {
        this.displayResults(phase);
        this.displayFinalResult(phase);
      });
    });
  }

  displayNames(phase) {
    const name1 = document.getElementById("result-name1");
    const name2 = document.getElementById("result-name2");
    if (name1) name1.textContent = phase.name1;
    if (name2) name2.textContent = phase.name2;
  }

  displayNameCombination(phase) {
    const nameCombine = document.getElementById("result-nameCombine");
    if (!nameCombine) return;

    // 긴 이름 조합인지 확인 (4글자 + 3글자 = 총 7글자)
    const isLongNameCombination =
      phase.combinedNameArray.length === CONFIG.LONG_NAME_TOTAL_LENGTH;

    // 긴 이름일 때 글자 간격 줄이기
    if (isLongNameCombination) {
      nameCombine.style.gap = CONFIG.GAPS.SMALL;
    }

    phase.combinedNameArray.forEach((char, i) => {
      const charContainer = this.createCharContainer(
        char,
        phase.nameStrokeArray[i],
        isLongNameCombination
      );
      nameCombine.appendChild(charContainer);
    });

    // 긴 이름일 때 획수 표시 글꼴 크기 줄이기
    const nameStrokeResult = document.getElementById("result-nameStrokeResult");
    if (nameStrokeResult && isLongNameCombination) {
      nameStrokeResult.style.fontSize = CONFIG.FONT_SIZES.RESULT_SMALL;
    }
  }

  createCharContainer(char, stroke, isLongNameCombination = false) {
    const charContainer = document.createElement("div");
    charContainer.classList.add("char-container");
    Object.assign(charContainer.style, {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "10px",
    });

    const nameDiv = document.createElement("div");
    nameDiv.classList.add("char-name");
    nameDiv.textContent = char;
    nameDiv.style.fontSize = isLongNameCombination
      ? CONFIG.FONT_SIZES.CHAR_SMALL
      : CONFIG.FONT_SIZES.CHAR;

    const strokeDiv = document.createElement("div");
    strokeDiv.classList.add("char-stroke");
    strokeDiv.textContent = stroke;
    Object.assign(strokeDiv.style, {
      fontSize: isLongNameCombination
        ? CONFIG.FONT_SIZES.STROKE_SMALL
        : CONFIG.FONT_SIZES.STROKE,
      color: CONFIG.COLORS.STROKE,
    });

    charContainer.appendChild(nameDiv);
    charContainer.appendChild(strokeDiv);
    return charContainer;
  }

  displayResults(phase) {
    const result = document.getElementById("result-process");
    if (!result) return;

    const isLongNameCombination =
      phase.combinedNameArray.length === CONFIG.LONG_NAME_TOTAL_LENGTH;

    phase.result.forEach((value) => {
      const processDiv = document.createElement("div");
      processDiv.classList.add("process-div");
      this.createVLine(processDiv, isLongNameCombination);
      this.createFigure(processDiv, value);
      result.appendChild(processDiv);
    });
  }

  displayFinalResult(phase) {
    setTimeout(() => {
      const result = document.getElementById("result-final");
      if (!result) return;

      const isLongNameCombination =
        phase.combinedNameArray.length === CONFIG.LONG_NAME_TOTAL_LENGTH;

      const newDiv = document.createElement("div");
      newDiv.classList.add("process-div");
      result.appendChild(newDiv);

      const resultNum =
        parseInt(phase.result[0].toString() + phase.result[1].toString()) + "%";
      this.createVLine(newDiv, isLongNameCombination);
      this.createFigureFinal(newDiv, resultNum);
    }, CONFIG.ANIMATION_DELAY);
  }

  async showFirstIteration() {
    const nameStrokeResult = document.getElementById("result-nameStrokeResult");
    if (nameStrokeResult) nameStrokeResult.style.display = "none";

    return new Promise((resolve) => {
      setTimeout(() => resolve(), 1000);
    });
  }

  async showDestinyProcess(phase) {
    const destinyProcess = document.getElementById("result-destinyProcess");
    if (!destinyProcess) return;

    const isLongNameCombination =
      phase.combinedNameArray.length === CONFIG.LONG_NAME_TOTAL_LENGTH;

    return new Promise((resolve) => {
      phase.processArray.forEach((processRow, i) => {
        setTimeout(() => {
          const resultDiv = document.createElement("div");
          resultDiv.classList.add("result-div");
          destinyProcess.appendChild(resultDiv);

          processRow.forEach((value) => {
            const processDiv = document.createElement("div");
            processDiv.classList.add("process-div");
            resultDiv.appendChild(processDiv);
            this.createVLine(processDiv, isLongNameCombination);
            this.createFigure(processDiv, value);
          });

          if (i === phase.processArray.length - 1) {
            setTimeout(() => resolve(), CONFIG.ANIMATION_DELAY);
          }
        }, i * CONFIG.ANIMATION_DELAY);
      });
    });
  }

  createVLine(parentDiv, isLongNameCombination = false) {
    const vLine = document.createElement("div");
    vLine.classList.add("v-line");

    if (isLongNameCombination) {
      vLine.style.height = CONFIG.IMAGE_SIZES.VLINE_SMALL;
    }

    const image = document.createElement("img");
    image.src = "./assets/images/v-line.png";

    if (isLongNameCombination) {
      image.style.height = CONFIG.IMAGE_SIZES.VLINE_SMALL;
    }

    vLine.appendChild(image);
    parentDiv.appendChild(vLine);
  }

  createFigure(parentDiv, val) {
    const figureContainer = document.createElement("div");
    figureContainer.classList.add("figure-container");
    const figure = document.createElement("div");
    figure.classList.add("figure");
    figure.textContent = val;
    figureContainer.appendChild(figure);
    parentDiv.appendChild(figureContainer);
  }

  createFigureFinal(parentDiv, val) {
    const figureContainer = document.createElement("div");
    figureContainer.classList.add("figure-container", "final-result");
    const figure = document.createElement("div");
    figure.classList.add("figure");
    figure.textContent = val;
    figureContainer.appendChild(figure);
    parentDiv.appendChild(figureContainer);
  }

  setupEventListeners() {
    this.setupHeaderControls();
    this.setupInputHandlers();
    this.setupStartButton();
  }

  setupHeaderControls() {
    const closeButton = this.dom.get("closeButton");

    if (closeButton) {
      closeButton.addEventListener("click", () => {
        window.close();
      });
    }
  }

  setupInputHandlers() {
    const p1Input = this.dom.get("p1Input");
    const p2Input = this.dom.get("p2Input");

    if (p1Input) {
      p1Input.addEventListener("keyup", (e) => {
        if (e.key === "Enter" && Validator.isValidLength(p1Input.value)) {
          if (p2Input) p2Input.focus();
        }
        if (!Validator.isValidKorean(p1Input.value)) {
          p1Input.value = "";
        }
      });
    }

    if (p2Input) {
      p2Input.addEventListener("keyup", (e) => {
        if (e.key === "Enter" && Validator.isValidLength(p2Input.value)) {
          this.startGame();
        }
        if (!Validator.isValidKorean(p2Input.value)) {
          p2Input.value = "";
        }
      });
    }
  }

  setupStartButton() {
    const startButton = this.dom.get("startButton");
    if (startButton) {
      startButton.addEventListener("click", () => {
        this.startGame();
      });
    }
  }
}

// 웹페이지가 모두 로드되면 이름 궁합 앱을 시작
window.onload = () => {
  new NameDestinyApp();
};
