/**
 * ====================================================================
 * OmniCalc Pro - Application Controller & User Interface Engine
 * ====================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Math Engine
  const engine = new CalculatorEngine();

  // --- State Variables ---
  let expression = "";
  let currentVal = "0";
  let isResultState = false;
  let currentMode = "scientific"; // 'scientific', 'standard', 'programmer', 'converter'
  let historyList = [];
  let soundEnabled = true;

  // --- DOM Elements ---
  const mainDisplay = document.getElementById('mainDisplay');
  const expressionDisplay = document.getElementById('expressionDisplay');
  const livePreview = document.getElementById('livePreview');
  const modeBadge = document.getElementById('modeBadge');
  const angleBadge = document.getElementById('angleBadge');
  const memoryIndicator = document.getElementById('memoryIndicator');
  const memoryValueSpan = document.getElementById('memoryValue');
  const calculatorChassis = document.getElementById('calculatorChassis');
  const scientificKeypad = document.getElementById('scientificKeypad');
  const programmerKeypad = document.getElementById('programmerKeypad');
  const programmerPanel = document.getElementById('programmerPanel');
  const converterChassis = document.getElementById('converterChassis');

  // Programmer Mode Elements
  const hexVal = document.getElementById('hexVal');
  const decVal = document.getElementById('decVal');
  const octVal = document.getElementById('octVal');
  const binVal = document.getElementById('binVal');

  // Modals & Drawers
  const shortcutsModal = document.getElementById('shortcutsModal');
  const projectModal = document.getElementById('projectModal');
  const historySidebar = document.getElementById('historySidebar');
  const historyListContainer = document.getElementById('historyList');
  const historyBadge = document.getElementById('historyBadge');
  const emptyHistoryMsg = document.getElementById('emptyHistoryMsg');
  const toast = document.getElementById('toast');

  // Toolbar & Menus
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeMenu = document.getElementById('themeMenu');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundOnIcon = document.getElementById('soundOnIcon');
  const soundOffIcon = document.getElementById('soundOffIcon');
  const shortcutsBtn = document.getElementById('shortcutsBtn');
  const closeShortcutsBtn = document.getElementById('closeShortcutsBtn');
  const projectInfoBtn = document.getElementById('projectInfoBtn');
  const closeProjectModalBtn = document.getElementById('closeProjectModalBtn');
  const historyToggleBtn = document.getElementById('historyToggleBtn');
  const closeHistoryBtn = document.getElementById('closeHistoryBtn');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const copyDisplayBtn = document.getElementById('copyDisplayBtn');
  const angleToggleBtn = document.getElementById('angleToggleBtn');

  // Mode Tabs
  const modeTabs = document.querySelectorAll('.mode-tab');

  // Unit Converter Elements
  const converterCategoryBar = document.getElementById('converterCategoryBar');
  const convFromUnit = document.getElementById('convFromUnit');
  const convToUnit = document.getElementById('convToUnit');
  const convFromInput = document.getElementById('convFromInput');
  const convToInput = document.getElementById('convToInput');
  const convSwapBtn = document.getElementById('convSwapBtn');
  const convFormulaText = document.getElementById('convFormulaText');
  const quickTableGrid = document.getElementById('quickTableGrid');
  const convFromClear = document.getElementById('convFromClear');
  const convCopyBtn = document.getElementById('convCopyBtn');

  // --- Web Audio API Synthesizer ---
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playSound(type = 'click') {
    if (!soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      const now = audioCtx.currentTime;

      if (type === 'click') {
        // Crisp soft micro click
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === 'equals') {
        // High harmonic success chime
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.06); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.12); // G5
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'clear') {
        // Soft low dismiss
        osc.type = 'sine';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      }
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  // --- Toast Notification Helper ---
  let toastTimer = null;
  function showToast(message) {
    if (toastTimer) clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('show');
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2400);
  }

  // --- Display Scaling & Render ---
  function updateDisplay() {
    mainDisplay.textContent = currentVal;
    expressionDisplay.textContent = expression;

    // Dynamic font resizing for long formulas
    const valLength = currentVal.length;
    mainDisplay.classList.remove('long-text', 'very-long-text');
    if (valLength > 16) {
      mainDisplay.classList.add('very-long-text');
    } else if (valLength > 10) {
      mainDisplay.classList.add('long-text');
    }

    // Scroll to end of expression
    expressionDisplay.scrollLeft = expressionDisplay.scrollWidth;
    mainDisplay.scrollLeft = mainDisplay.scrollWidth;

    // Live preview evaluation
    updateLivePreview();

    // Update Programmer Bits if active
    if (currentMode === 'programmer') {
      updateProgrammerBits();
    }
  }

  // --- Live Dynamic Expression Preview ---
  function updateLivePreview() {
    if (isResultState || currentMode === 'converter') {
      livePreview.textContent = "";
      return;
    }

    let fullExpr = expression + (currentVal !== "0" && currentVal !== "" ? currentVal : "");
    if (!fullExpr || fullExpr.trim() === "") {
      livePreview.textContent = "";
      return;
    }

    // Don't preview if ends with dangling operator
    const trimmed = fullExpr.trim();
    if (/[+\-−×÷*/^,]$/.test(trimmed)) {
      livePreview.textContent = "";
      return;
    }

    try {
      // Auto-close missing open parentheses for preview
      let openCount = (fullExpr.match(/\(/g) || []).length;
      let closeCount = (fullExpr.match(/\)/g) || []).length;
      let previewExpr = fullExpr;
      while (openCount > closeCount) {
        previewExpr += ")";
        closeCount++;
      }

      const res = engine.calculate(previewExpr);
      if (res !== undefined && !isNaN(res) && isFinite(res) && String(res) !== currentVal) {
        livePreview.textContent = `= ${res}`;
      } else {
        livePreview.textContent = "";
      }
    } catch (e) {
      livePreview.textContent = "";
    }
  }

  // --- Programmer Mode Radix Renderer ---
  function updateProgrammerBits() {
    let numToConvert = currentVal;
    if (numToConvert.endsWith('.')) numToConvert = numToConvert.slice(0, -1);
    const bases = engine.toProgrammerBases(numToConvert);

    hexVal.textContent = bases.hex;
    decVal.textContent = bases.dec;
    octVal.textContent = bases.oct;
    binVal.textContent = bases.bin;
  }

  // --- Core Calculation Logic ---
  function appendNumber(numStr) {
    playSound('click');
    if (isResultState) {
      currentVal = numStr;
      expression = "";
      isResultState = false;
    } else {
      if (currentVal === "0" && numStr !== "00") {
        currentVal = numStr;
      } else if (currentVal === "0" && numStr === "00") {
        currentVal = "0";
      } else {
        currentVal += numStr;
      }
    }
    updateDisplay();
  }

  function appendDecimal() {
    playSound('click');
    if (isResultState) {
      currentVal = "0.";
      expression = "";
      isResultState = false;
    } else {
      if (!currentVal.includes('.')) {
        currentVal += ".";
      }
    }
    updateDisplay();
  }

  function appendOperator(op) {
    playSound('click');
    if (isResultState) {
      isResultState = false;
      expression = currentVal + ` ${op} `;
      currentVal = "0";
    } else {
      if (currentVal !== "") {
        expression += `${currentVal} ${op} `;
        currentVal = "0";
      } else if (expression !== "") {
        // Replace last operator if already ended with one
        expression = expression.trim().replace(/[+\-−×÷*/^]$/, op) + " ";
      }
    }
    updateDisplay();
  }

  function appendFunction(funcName) {
    playSound('click');
    if (isResultState) {
      expression = `${funcName}`;
      currentVal = "0";
      isResultState = false;
    } else {
      if (currentVal !== "0" && currentVal !== "") {
        expression += `${funcName}${currentVal})`;
        currentVal = "0";
      } else {
        expression += `${funcName}`;
      }
    }
    updateDisplay();
  }

  function appendParenthesis(paren) {
    playSound('click');
    if (paren === '(') {
      if (isResultState) {
        expression = "(";
        currentVal = "0";
        isResultState = false;
      } else {
        if (currentVal !== "0" && currentVal !== "") {
          expression += `${currentVal} × (`;
          currentVal = "0";
        } else {
          expression += "(";
        }
      }
    } else {
      // Closing ')'
      if (currentVal !== "0" && currentVal !== "") {
        expression += `${currentVal})`;
        currentVal = "0";
      } else {
        expression += ")";
      }
    }
    updateDisplay();
  }

  function executeEquals() {
    let fullExpr = expression + (currentVal !== "0" && currentVal !== "" ? currentVal : "");
    if (!fullExpr.trim()) return;

    // Check for open parentheses and auto-close them
    let openCount = (fullExpr.match(/\(/g) || []).length;
    let closeCount = (fullExpr.match(/\)/g) || []).length;
    while (openCount > closeCount) {
      fullExpr += ")";
      closeCount++;
    }

    try {
      const result = engine.calculate(fullExpr);
      playSound('equals');

      // Save to History
      addHistoryItem(fullExpr, result);

      expressionDisplay.textContent = fullExpr + " =";
      currentVal = String(result);
      expression = "";
      isResultState = true;
      livePreview.textContent = "";

      updateDisplay();
    } catch (err) {
      playSound('clear');
      mainDisplay.textContent = err.message || "Error";
      livePreview.textContent = "";
      isResultState = true;
    }
  }

  function clearAll() {
    playSound('clear');
    expression = "";
    currentVal = "0";
    isResultState = false;
    updateDisplay();
  }

  function clearEntry() {
    playSound('clear');
    currentVal = "0";
    updateDisplay();
  }

  function backspace() {
    playSound('click');
    if (isResultState) {
      clearAll();
      return;
    }
    if (currentVal.length > 1) {
      currentVal = currentVal.slice(0, -1);
    } else {
      currentVal = "0";
    }
    updateDisplay();
  }

  function negate() {
    playSound('click');
    if (currentVal !== "0" && currentVal !== "") {
      if (currentVal.startsWith('-')) {
        currentVal = currentVal.slice(1);
      } else {
        currentVal = '-' + currentVal;
      }
      updateDisplay();
    }
  }

  function percentage() {
    playSound('click');
    try {
      const num = Number(currentVal);
      if (!isNaN(num)) {
        currentVal = String(engine.cleanPrecision(num / 100));
        updateDisplay();
      }
    } catch (e) {}
  }

  function square() {
    playSound('click');
    try {
      const num = Number(currentVal);
      if (!isNaN(num)) {
        const res = engine.cleanPrecision(num * num);
        addHistoryItem(`(${num})²`, res);
        currentVal = String(res);
        isResultState = true;
        updateDisplay();
      }
    } catch (e) {}
  }

  function cube() {
    playSound('click');
    try {
      const num = Number(currentVal);
      if (!isNaN(num)) {
        const res = engine.cleanPrecision(num * num * num);
        addHistoryItem(`(${num})³`, res);
        currentVal = String(res);
        isResultState = true;
        updateDisplay();
      }
    } catch (e) {}
  }

  function invert() {
    playSound('click');
    try {
      const num = Number(currentVal);
      if (num === 0) {
        showToast("Cannot divide by 0");
        return;
      }
      const res = engine.cleanPrecision(1 / num);
      addHistoryItem(`1/(${num})`, res);
      currentVal = String(res);
      isResultState = true;
      updateDisplay();
    } catch (e) {}
  }

  // --- History System ---
  function loadHistoryFromStorage() {
    try {
      const saved = localStorage.getItem('omnicalc_history');
      if (saved) {
        historyList = JSON.parse(saved);
      }
    } catch (e) {
      historyList = [];
    }
    renderHistory();
  }

  function saveHistoryToStorage() {
    try {
      localStorage.setItem('omnicalc_history', JSON.stringify(historyList));
    } catch (e) {}
  }

  function addHistoryItem(expr, res) {
    const item = {
      id: Date.now(),
      expr: expr,
      res: res,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    historyList.unshift(item);
    if (historyList.length > 50) historyList.pop(); // Keep max 50
    saveHistoryToStorage();
    renderHistory();
  }

  function renderHistory() {
    historyBadge.textContent = historyList.length;

    if (historyList.length === 0) {
      emptyHistoryMsg.classList.remove('hidden');
      historyListContainer.innerHTML = '';
      historyListContainer.appendChild(emptyHistoryMsg);
      return;
    }

    emptyHistoryMsg.classList.add('hidden');
    historyListContainer.innerHTML = '';

    historyList.forEach(item => {
      const div = document.createElement('div');
      div.className = 'history-item';
      div.setAttribute('title', 'Click to recall this result');
      div.innerHTML = `
        <div class="history-meta-row">
          <span>${item.time}</span>
          <span>Click to use</span>
        </div>
        <div class="history-expr">${escapeHtml(item.expr)}</div>
        <div class="history-res">${escapeHtml(String(item.res))}</div>
      `;

      div.addEventListener('click', () => {
        playSound('click');
        currentVal = String(item.res);
        isResultState = true;
        updateDisplay();
        showToast(`Loaded ${item.res}`);
      });

      historyListContainer.appendChild(div);
    });
  }

  function clearHistory() {
    if (confirm("Clear all calculation history?")) {
      playSound('clear');
      historyList = [];
      saveHistoryToStorage();
      renderHistory();
      showToast("History cleared");
    }
  }

  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // --- Mode Switching Controller ---
  function setMode(mode) {
    currentMode = mode;

    modeTabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.mode === mode);
    });

    modeBadge.textContent = mode.toUpperCase();

    // Mode UI states
    if (mode === 'standard') {
      calculatorChassis.classList.remove('hidden');
      calculatorChassis.classList.add('standard-mode');
      scientificKeypad.classList.add('hidden');
      programmerKeypad.classList.add('hidden');
      programmerPanel.classList.add('hidden');
      converterChassis.classList.add('hidden');
    } else if (mode === 'scientific') {
      calculatorChassis.classList.remove('hidden', 'standard-mode');
      scientificKeypad.classList.remove('hidden');
      programmerKeypad.classList.add('hidden');
      programmerPanel.classList.add('hidden');
      converterChassis.classList.add('hidden');
    } else if (mode === 'programmer') {
      calculatorChassis.classList.remove('hidden', 'standard-mode');
      scientificKeypad.classList.add('hidden');
      programmerKeypad.classList.remove('hidden');
      programmerPanel.classList.remove('hidden');
      converterChassis.classList.add('hidden');
      updateProgrammerBits();
    } else if (mode === 'converter') {
      calculatorChassis.classList.add('hidden');
      converterChassis.classList.remove('hidden');
      updateConverterUI();
    }

    playSound('click');
    updateDisplay();
  }

  // --- Memory Function Handlers ---
  function handleMemory(action) {
    playSound('click');
    const val = Number(currentVal);

    switch (action) {
      case 'mc':
        engine.memoryClear();
        memoryIndicator.classList.add('hidden');
        showToast("Memory Cleared (0)");
        break;
      case 'mr':
        currentVal = String(engine.memoryRecall());
        isResultState = true;
        updateDisplay();
        showToast(`Memory Recalled: ${currentVal}`);
        break;
      case 'm-plus':
        engine.memoryAdd(val);
        updateMemoryBadge();
        showToast(`Added to Memory (+${val})`);
        break;
      case 'm-minus':
        engine.memorySubtract(val);
        updateMemoryBadge();
        showToast(`Subtracted from Memory (-${val})`);
        break;
      case 'ms':
        engine.memoryStore(val);
        updateMemoryBadge();
        showToast(`Memory Stored: ${val}`);
        break;
      case 'rand':
        const randVal = engine.cleanPrecision(Math.random(), 6);
        currentVal = String(randVal);
        isResultState = true;
        updateDisplay();
        break;
    }
  }

  function updateMemoryBadge() {
    const memVal = engine.memoryRecall();
    if (memVal !== 0) {
      memoryIndicator.classList.remove('hidden');
      memoryValueSpan.textContent = memVal;
    } else {
      memoryIndicator.classList.add('hidden');
    }
  }

  // --- Keypad Click Router ---
  document.addEventListener('click', (e) => {
    const key = e.target.closest('.key');
    if (!key) return;

    // Number keys
    if (key.dataset.num !== undefined) {
      appendNumber(key.dataset.num);
      return;
    }

    // Actions
    const action = key.dataset.action;
    const val = key.dataset.val;

    switch (action) {
      case 'op':
        appendOperator(val);
        break;
      case 'equals':
        executeEquals();
        break;
      case 'clear-all':
        clearAll();
        break;
      case 'clear-entry':
        clearEntry();
        break;
      case 'backspace':
        backspace();
        break;
      case 'dot':
        appendDecimal();
        break;
      case 'paren':
        appendParenthesis(val);
        break;
      case 'negate':
        negate();
        break;
      case 'percent':
        percentage();
        break;
      case 'square':
        square();
        break;
      case 'cube':
        cube();
        break;
      case 'prefix-inv':
        invert();
        break;
      case 'func':
        appendFunction(val);
        break;
      case 'insert':
        playSound('click');
        if (isResultState || currentVal === "0") {
          currentVal = val;
          isResultState = false;
        } else {
          currentVal += val;
        }
        updateDisplay();
        break;
      case 'postfix':
        playSound('click');
        if (currentVal !== "0" && currentVal !== "") {
          currentVal += val;
          updateDisplay();
        }
        break;
      case 'mod':
        appendOperator('%');
        break;
      case 'bitwise':
        if (val === 'NOT') {
          const res = engine.bitwiseOp(currentVal, 'NOT');
          addHistoryItem(`NOT(${currentVal})`, res);
          currentVal = String(res);
          isResultState = true;
          updateDisplay();
        } else {
          appendOperator(val);
        }
        break;
    }

    // Hex A-F keys
    if (key.classList.contains('hex-key') && key.dataset.val) {
      playSound('click');
      if (isResultState) {
        currentVal = key.dataset.val;
        isResultState = false;
      } else {
        if (currentVal === "0") currentVal = key.dataset.val;
        else currentVal += key.dataset.val;
      }
      updateDisplay();
    }
  });

  // Memory Bar Clicks
  document.getElementById('memoryBar').addEventListener('click', (e) => {
    const btn = e.target.closest('.mem-btn');
    if (!btn) return;
    if (btn.dataset.action) {
      handleMemory(btn.dataset.action);
    }
  });

  // Angle Mode (DEG / RAD) Toggle
  angleToggleBtn.addEventListener('click', () => {
    playSound('click');
    const newMode = engine.toggleAngleMode();
    angleBadge.textContent = newMode;
    angleToggleBtn.textContent = newMode;
    showToast(`Angle Mode: ${newMode}`);
    updateDisplay();
  });

  // Mode Navigation Tabs
  modeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      setMode(tab.dataset.mode);
    });
  });

  // --- Unit Converter Logic ---
  let currentConvCategory = "length";

  function initConverter() {
    populateConverterDropdowns(currentConvCategory);
    calculateConversion();

    // Category chip clicks
    converterCategoryBar.addEventListener('click', (e) => {
      const chip = e.target.closest('.cat-chip');
      if (!chip) return;
      playSound('click');
      document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentConvCategory = chip.dataset.cat;
      populateConverterDropdowns(currentConvCategory);
      calculateConversion();
    });

    // Input changes
    convFromInput.addEventListener('input', calculateConversion);
    convFromUnit.addEventListener('change', calculateConversion);
    convToUnit.addEventListener('change', calculateConversion);

    // Clear input
    convFromClear.addEventListener('click', () => {
      convFromInput.value = "";
      convToInput.value = "";
      convFormulaText.textContent = "";
      convFromInput.focus();
    });

    // Swap units
    convSwapBtn.addEventListener('click', () => {
      playSound('click');
      const temp = convFromUnit.value;
      convFromUnit.value = convToUnit.value;
      convToUnit.value = temp;
      calculateConversion();
    });

    // Copy result
    convCopyBtn.addEventListener('click', () => {
      if (convToInput.value) {
        navigator.clipboard.writeText(convToInput.value);
        showToast("Converted value copied!");
      }
    });
  }

  function populateConverterDropdowns(categoryKey) {
    const categories = CalculatorEngine.getUnitCategories();
    const cat = categories[categoryKey];
    if (!cat) return;

    convFromUnit.innerHTML = '';
    convToUnit.innerHTML = '';

    const keys = Object.keys(cat.units);
    keys.forEach((unitKey, idx) => {
      const unit = cat.units[unitKey];
      const optFrom = new Option(unit.name, unitKey);
      const optTo = new Option(unit.name, unitKey);
      convFromUnit.add(optFrom);
      convToUnit.add(optTo);
    });

    // Sensible defaults (first and second unit)
    if (keys.length > 1) {
      convFromUnit.selectedIndex = 0;
      convToUnit.selectedIndex = 1;
    }
  }

  function calculateConversion() {
    const val = convFromInput.value;
    if (val === "" || isNaN(Number(val))) {
      convToInput.value = "";
      convFormulaText.textContent = "Please enter a valid numeric value";
      return;
    }

    const from = convFromUnit.value;
    const to = convToUnit.value;
    const result = CalculatorEngine.convertUnit(currentConvCategory, from, to, val);
    const cleaned = engine.cleanPrecision(result, 8);

    convToInput.value = cleaned;

    // Update Formula Card
    const unit1Res = CalculatorEngine.convertUnit(currentConvCategory, from, to, 1);
    const fromName = convFromUnit.options[convFromUnit.selectedIndex]?.text.split(' (')[0] || from;
    const toName = convToUnit.options[convToUnit.selectedIndex]?.text.split(' (')[0] || to;
    convFormulaText.textContent = `1 ${fromName} = ${engine.cleanPrecision(unit1Res, 6)} ${toName}`;

    // Render Quick Reference Table
    renderQuickTable(currentConvCategory, from, to);
  }

  function renderQuickTable(catKey, fromKey, toKey) {
    quickTableGrid.innerHTML = '';
    const sampleValues = [1, 5, 10, 25, 50, 100];
    const fromSymbol = convFromUnit.options[convFromUnit.selectedIndex]?.text.match(/\(([^)]+)\)/)?.[1] || "";
    const toSymbol = convToUnit.options[convToUnit.selectedIndex]?.text.match(/\(([^)]+)\)/)?.[1] || "";

    sampleValues.forEach(v => {
      const converted = engine.cleanPrecision(CalculatorEngine.convertUnit(catKey, fromKey, toKey, v), 4);
      const chip = document.createElement('div');
      chip.className = 'quick-chip';
      chip.innerHTML = `
        <span class="quick-chip-val">${converted} ${toSymbol}</span>
        <span class="quick-chip-label">${v} ${fromSymbol}</span>
      `;
      chip.addEventListener('click', () => {
        convFromInput.value = v;
        calculateConversion();
      });
      quickTableGrid.appendChild(chip);
    });
  }

  function updateConverterUI() {
    calculateConversion();
  }

  // --- Copy Display to Clipboard ---
  copyDisplayBtn.addEventListener('click', () => {
    const textToCopy = mainDisplay.textContent;
    if (textToCopy && textToCopy !== "Error") {
      navigator.clipboard.writeText(textToCopy).then(() => {
        showToast(`Copied ${textToCopy} to clipboard!`);
      });
    }
  });

  // --- Theme Manager ---
  function initTheme() {
    const savedTheme = localStorage.getItem('omnicalc_theme') || 'midnight';
    applyTheme(savedTheme);

    themeToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      themeMenu.classList.toggle('show');
    });

    document.querySelectorAll('.theme-opt').forEach(opt => {
      opt.addEventListener('click', () => {
        const theme = opt.dataset.theme;
        applyTheme(theme);
        themeMenu.classList.remove('show');
      });
    });

    // Close menu on click outside
    document.addEventListener('click', (e) => {
      if (!themeMenu.contains(e.target) && !themeToggleBtn.contains(e.target)) {
        themeMenu.classList.remove('show');
      }
    });
  }

  function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('omnicalc_theme', theme);

    document.querySelectorAll('.theme-opt').forEach(opt => {
      opt.classList.toggle('active', opt.dataset.theme === theme);
    });
  }

  // --- Sound Toggle ---
  function initSound() {
    const savedSound = localStorage.getItem('omnicalc_sound');
    soundEnabled = savedSound !== 'false';
    updateSoundIcons();

    soundToggleBtn.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      localStorage.setItem('omnicalc_sound', String(soundEnabled));
      updateSoundIcons();
      if (soundEnabled) playSound('click');
      showToast(soundEnabled ? "Audio feedback enabled" : "Audio muted");
    });
  }

  function updateSoundIcons() {
    if (soundEnabled) {
      soundOnIcon.classList.remove('hidden');
      soundOffIcon.classList.add('hidden');
    } else {
      soundOnIcon.classList.add('hidden');
      soundOffIcon.classList.remove('hidden');
    }
  }

  // --- Modals & Drawers Interactivity ---
  shortcutsBtn.addEventListener('click', () => {
    shortcutsModal.classList.remove('hidden');
  });

  closeShortcutsBtn.addEventListener('click', () => {
    shortcutsModal.classList.add('hidden');
  });

  projectInfoBtn.addEventListener('click', () => {
    projectModal.classList.remove('hidden');
  });

  closeProjectModalBtn.addEventListener('click', () => {
    projectModal.classList.add('hidden');
  });

  // Close modals on clicking backdrop
  [shortcutsModal, projectModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    });
  });

  // History Drawer Controls
  historyToggleBtn.addEventListener('click', () => {
    historySidebar.classList.toggle('hidden');
  });

  closeHistoryBtn.addEventListener('click', () => {
    historySidebar.classList.add('hidden');
  });

  clearHistoryBtn.addEventListener('click', clearHistory);

  // --- Complete Physical Keyboard Listener ---
  window.addEventListener('keydown', (e) => {
    // If user is focused on an input box in Converter or elsewhere, don't hijack
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      return;
    }

    // Number keys
    if (e.key >= '0' && e.key <= '9') {
      appendNumber(e.key);
      return;
    }

    // Arithmetic operators
    if (e.key === '+') {
      appendOperator('+');
      return;
    }
    if (e.key === '-') {
      appendOperator('−');
      return;
    }
    if (e.key === '*' || e.key === 'x') {
      appendOperator('×');
      return;
    }
    if (e.key === '/') {
      e.preventDefault();
      appendOperator('÷');
      return;
    }
    if (e.key === '%') {
      percentage();
      return;
    }
    if (e.key === '^') {
      appendOperator('^');
      return;
    }
    if (e.key === '.') {
      appendDecimal();
      return;
    }
    if (e.key === '(' || e.key === ')') {
      appendParenthesis(e.key);
      return;
    }

    // Enter or Equals
    if (e.key === 'Enter' || e.key === '=') {
      e.preventDefault();
      executeEquals();
      return;
    }

    // Backspace
    if (e.key === 'Backspace') {
      backspace();
      return;
    }

    // Clear All (Escape or c / C)
    if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
      clearAll();
      return;
    }

    // Functions hotkeys
    if (e.key === 's') { appendFunction('sin('); return; }
    if (e.key === 'o') { appendFunction('cos('); return; }
    if (e.key === 't') { appendFunction('tan('); return; }
    if (e.key === 'l') { appendFunction('log('); return; }
    if (e.key === 'n') { appendFunction('ln('); return; }
    if (e.key === 'r') { appendFunction('sqrt('); return; }
    if (e.key === 'p') {
      if (isResultState || currentVal === "0") {
        currentVal = "π";
        isResultState = false;
      } else {
        currentVal += "π";
      }
      updateDisplay();
      return;
    }
    if (e.key === 'h') {
      historySidebar.classList.toggle('hidden');
      return;
    }
    if (e.key === 'm') {
      angleToggleBtn.click();
      return;
    }
  });

  // --- Initial Startup ---
  initTheme();
  initSound();
  initConverter();
  loadHistoryFromStorage();
  updateDisplay();
});
