/**
 * ====================================================================
 * OmniCalc Pro - Computational Mathematics & Parsing Engine
 * ====================================================================
 * - Robust Shunting-Yard Tokenizer & AST Expression Evaluator (No eval)
 * - Strict BODMAS / PEMDAS Order of Precedence
 * - Nested Parentheses & Implicit Multiplication Resolution
 * - Trig Functions with DEG / RAD Angular Modes
 * - Floating-point IEEE 754 Precision Sanitizer (0.1 + 0.2 = 0.3)
 * - Programmer Mode (HEX, DEC, OCT, BIN, Bitwise Ops)
 * - Multi-system Unit Conversion Matrix
 */

class CalculatorEngine {
  constructor() {
    this.angleMode = 'DEG'; // 'DEG' or 'RAD'
    this.memoryValue = 0;
  }

  setAngleMode(mode) {
    if (mode === 'DEG' || mode === 'RAD') {
      this.angleMode = mode;
    }
  }

  toggleAngleMode() {
    this.angleMode = this.angleMode === 'DEG' ? 'RAD' : 'DEG';
    return this.angleMode;
  }

  // --- Memory Operations ---
  memoryClear() {
    this.memoryValue = 0;
    return this.memoryValue;
  }

  memoryRecall() {
    return this.memoryValue;
  }

  memoryAdd(val) {
    const num = Number(val);
    if (!isNaN(num)) {
      this.memoryValue = this.cleanPrecision(this.memoryValue + num);
    }
    return this.memoryValue;
  }

  memorySubtract(val) {
    const num = Number(val);
    if (!isNaN(num)) {
      this.memoryValue = this.cleanPrecision(this.memoryValue - num);
    }
    return this.memoryValue;
  }

  memoryStore(val) {
    const num = Number(val);
    if (!isNaN(num)) {
      this.memoryValue = this.cleanPrecision(num);
    }
    return this.memoryValue;
  }

  // --- Floating Point Precision Fixer ---
  cleanPrecision(num, digits = 12) {
    if (typeof num !== 'number' || isNaN(num) || !isFinite(num)) {
      return num;
    }
    // Exponential notation for extreme numbers
    if (Math.abs(num) > 1e15 || (Math.abs(num) < 1e-7 && Math.abs(num) > 0)) {
      return parseFloat(num.toPrecision(10));
    }
    // Round to avoid 0.1 + 0.2 = 0.30000000000000004
    const factor = Math.pow(10, digits);
    const rounded = Math.round(num * factor) / factor;
    return Object.is(rounded, -0) ? 0 : rounded;
  }

  // --- Factorial calculation ---
  factorial(n) {
    if (n < 0) throw new Error("Factorial of negative number undefined");
    if (!Number.isInteger(n)) throw new Error("Factorial requires integer");
    if (n > 170) return Infinity; // Overflow in 64-bit float
    let res = 1;
    for (let i = 2; i <= n; i++) {
      res *= i;
    }
    return res;
  }

  // --- Expression Normalizer & Tokenizer ---
  normalizeExpression(rawExpr) {
    if (!rawExpr) return "";
    let expr = rawExpr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/\s+/g, '')
      .replace(/π/g, `${Math.PI}`)
      .replace(/(?<![a-zA-Z])e(?![a-zA-Z])/g, `${Math.E}`);

    // Implicit multiplication fixes:
    // e.g. 5( -> 5*(, )5 -> )*5, )( -> )*(, 5sin( -> 5*sin(
    expr = expr.replace(/(\d)(\()/g, '$1*$2');
    expr = expr.replace(/(\))(\d)/g, '$1*$2');
    expr = expr.replace(/(\))(\()/g, '$1*$2');
    expr = expr.replace(/(\d)([a-z]+)/gi, '$1*$2');
    expr = expr.replace(/(\))([a-z]+)/gi, '$1*$2');

    return expr;
  }

  tokenize(expr) {
    const tokens = [];
    let i = 0;
    const len = expr.length;

    while (i < len) {
      const char = expr[i];

      // White space
      if (/\s/.test(char)) {
        i++;
        continue;
      }

      // Numbers (including decimals and exponents)
      if (/\d/.test(char) || (char === '.' && i + 1 < len && /\d/.test(expr[i + 1]))) {
        let numStr = "";
        let hasDot = false;
        while (i < len && (/\d/.test(expr[i]) || expr[i] === '.')) {
          if (expr[i] === '.') {
            if (hasDot) break;
            hasDot = true;
          }
          numStr += expr[i++];
        }
        tokens.push({ type: 'NUMBER', value: parseFloat(numStr) });
        continue;
      }

      // Word / Functions (sin, cos, tan, log, etc.)
      if (/[a-zA-Z]/.test(char)) {
        let word = "";
        while (i < len && /[a-zA-Z0-9]/.test(expr[i])) {
          word += expr[i++];
        }
        tokens.push({ type: 'FUNCTION', value: word.toLowerCase() });
        continue;
      }

      // Unary minus detection: if '-' is preceded by another operator or '(', or at index 0
      if (char === '-') {
        const prevToken = tokens[tokens.length - 1];
        if (!prevToken || prevToken.type === 'OPERATOR' || (prevToken.type === 'PAREN' && prevToken.value === '(')) {
          tokens.push({ type: 'UNARY_MINUS', value: 'u-' });
          i++;
          continue;
        }
      }

      // Operators
      if (['+', '-', '*', '/', '%', '^', '!'].includes(char)) {
        tokens.push({ type: 'OPERATOR', value: char });
        i++;
        continue;
      }

      // Parentheses
      if (char === '(' || char === ')') {
        tokens.push({ type: 'PAREN', value: char });
        i++;
        continue;
      }

      // Commas (for multi-arg functions)
      if (char === ',') {
        tokens.push({ type: 'COMMA', value: ',' });
        i++;
        continue;
      }

      // Unknown character skip
      i++;
    }

    return tokens;
  }

  // --- Shunting-Yard: Infix to RPN ---
  toRPN(tokens) {
    const outputQueue = [];
    const opStack = [];

    const precedence = {
      'u-': 5,
      '!': 5,
      '^': 4,
      '*': 3,
      '/': 3,
      '%': 3,
      '+': 2,
      '-': 2
    };

    const associativity = {
      'u-': 'Right',
      '^': 'Right',
      '!': 'Left',
      '*': 'Left',
      '/': 'Left',
      '%': 'Left',
      '+': 'Left',
      '-': 'Left'
    };

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (token.type === 'NUMBER') {
        outputQueue.push(token);
      } else if (token.type === 'FUNCTION') {
        opStack.push(token);
      } else if (token.type === 'OPERATOR' || token.type === 'UNARY_MINUS') {
        const o1 = token.value;
        while (
          opStack.length > 0 &&
          opStack[opStack.length - 1].type !== 'PAREN' &&
          (
            (opStack[opStack.length - 1].type === 'FUNCTION') ||
            (precedence[opStack[opStack.length - 1].value] > precedence[o1]) ||
            (precedence[opStack[opStack.length - 1].value] === precedence[o1] && associativity[o1] === 'Left')
          )
        ) {
          outputQueue.push(opStack.pop());
        }
        opStack.push(token);
      } else if (token.type === 'PAREN' && token.value === '(') {
        opStack.push(token);
      } else if (token.type === 'PAREN' && token.value === ')') {
        let foundOpen = false;
        while (opStack.length > 0) {
          const top = opStack.pop();
          if (top.type === 'PAREN' && top.value === '(') {
            foundOpen = true;
            break;
          }
          outputQueue.push(top);
        }
        if (!foundOpen) {
          throw new Error("Mismatched parentheses");
        }
        if (opStack.length > 0 && opStack[opStack.length - 1].type === 'FUNCTION') {
          outputQueue.push(opStack.pop());
        }
      }
    }

    while (opStack.length > 0) {
      const top = opStack.pop();
      if (top.type === 'PAREN') {
        throw new Error("Mismatched parentheses");
      }
      outputQueue.push(top);
    }

    return outputQueue;
  }

  // --- Evaluate RPN Stack ---
  evaluateRPN(rpn) {
    const stack = [];

    const toRadians = (deg) => (deg * Math.PI) / 180;
    const toDegrees = (rad) => (rad * 180) / Math.PI;

    for (let i = 0; i < rpn.length; i++) {
      const token = rpn[i];

      if (token.type === 'NUMBER') {
        stack.push(token.value);
      } else if (token.type === 'UNARY_MINUS') {
        if (stack.length < 1) throw new Error("Invalid expression");
        const val = stack.pop();
        stack.push(-val);
      } else if (token.type === 'OPERATOR') {
        if (token.value === '!') {
          if (stack.length < 1) throw new Error("Invalid expression");
          const a = stack.pop();
          stack.push(this.factorial(a));
          continue;
        }

        if (stack.length < 2) throw new Error("Invalid expression");
        const b = stack.pop();
        const a = stack.pop();

        switch (token.value) {
          case '+': stack.push(a + b); break;
          case '-': stack.push(a - b); break;
          case '*': stack.push(a * b); break;
          case '/':
            if (b === 0) throw new Error("Cannot divide by 0");
            stack.push(a / b);
            break;
          case '%':
            if (b === 0) throw new Error("Modulo by 0");
            stack.push(a % b);
            break;
          case '^':
            stack.push(Math.pow(a, b));
            break;
          default:
            throw new Error(`Unknown operator: ${token.value}`);
        }
      } else if (token.type === 'FUNCTION') {
        if (stack.length < 1) throw new Error("Function missing argument");
        const arg = stack.pop();
        const fn = token.value;

        let res;
        switch (fn) {
          case 'sin':
            res = Math.sin(this.angleMode === 'DEG' ? toRadians(arg) : arg);
            // Handle precision zero like sin(180)
            if (Math.abs(res) < 1e-15) res = 0;
            break;
          case 'cos':
            res = Math.cos(this.angleMode === 'DEG' ? toRadians(arg) : arg);
            if (Math.abs(res) < 1e-15) res = 0;
            break;
          case 'tan': {
            const radVal = this.angleMode === 'DEG' ? toRadians(arg) : arg;
            if (Math.abs(Math.cos(radVal)) < 1e-15) throw new Error("Undefined (tan 90°)");
            res = Math.tan(radVal);
            if (Math.abs(res) < 1e-15) res = 0;
            break;
          }
          case 'asin':
            if (arg < -1 || arg > 1) throw new Error("Invalid domain for asin [-1, 1]");
            res = Math.asin(arg);
            if (this.angleMode === 'DEG') res = toDegrees(res);
            break;
          case 'acos':
            if (arg < -1 || arg > 1) throw new Error("Invalid domain for acos [-1, 1]");
            res = Math.acos(arg);
            if (this.angleMode === 'DEG') res = toDegrees(res);
            break;
          case 'atan':
            res = Math.atan(arg);
            if (this.angleMode === 'DEG') res = toDegrees(res);
            break;
          case 'sinh': res = Math.sinh(arg); break;
          case 'cosh': res = Math.cosh(arg); break;
          case 'tanh': res = Math.tanh(arg); break;
          case 'ln':
            if (arg <= 0) throw new Error("Invalid domain for ln (must be > 0)");
            res = Math.log(arg);
            break;
          case 'log':
          case 'log10':
            if (arg <= 0) throw new Error("Invalid domain for log10 (must be > 0)");
            res = Math.log10(arg);
            break;
          case 'log2':
            if (arg <= 0) throw new Error("Invalid domain for log2 (must be > 0)");
            res = Math.log2(arg);
            break;
          case 'sqrt':
            if (arg < 0) throw new Error("Negative square root undefined in ℝ");
            res = Math.sqrt(arg);
            break;
          case 'cbrt':
            res = Math.cbrt(arg);
            break;
          case 'abs':
            res = Math.abs(arg);
            break;
          case 'exp':
            res = Math.exp(arg);
            break;
          case 'inv':
            if (arg === 0) throw new Error("Cannot divide by 0");
            res = 1 / arg;
            break;
          default:
            throw new Error(`Unknown function: ${fn}`);
        }
        stack.push(res);
      }
    }

    if (stack.length !== 1) {
      throw new Error("Syntax error in calculation");
    }

    return this.cleanPrecision(stack[0]);
  }

  // --- Primary Public Compute Method ---
  calculate(rawExpression) {
    if (!rawExpression || rawExpression.trim() === '') {
      return 0;
    }

    const normalized = this.normalizeExpression(rawExpression);
    const tokens = this.tokenize(normalized);
    if (tokens.length === 0) return 0;

    const rpn = this.toRPN(tokens);
    return this.evaluateRPN(rpn);
  }

  // --- Programmer Mode Radix Conversions & Bitwise Operations ---
  toProgrammerBases(val) {
    let intVal = parseInt(val, 10);
    if (isNaN(intVal)) intVal = 0;

    // Convert to 32-bit integer for standard bitwise operations
    const int32 = intVal | 0;
    const uint32 = intVal >>> 0;

    // Binary with 4-bit nibble spacing
    let binStr = uint32.toString(2).padStart(8, '0');
    // Group into 4 bits
    binStr = binStr.replace(/\B(?=(\d{4})+(?!\d))/g, ' ');

    return {
      hex: uint32.toString(16).toUpperCase(),
      dec: int32.toString(10),
      oct: uint32.toString(8),
      bin: binStr,
      rawDec: int32
    };
  }

  bitwiseOp(a, op, b = null) {
    const numA = parseInt(a, 10) | 0;
    const numB = b !== null ? parseInt(b, 10) | 0 : 0;

    switch (op) {
      case 'AND': return (numA & numB) | 0;
      case 'OR': return (numA | numB) | 0;
      case 'XOR': return (numA ^ numB) | 0;
      case 'NOT': return (~numA) | 0;
      case '<<': return (numA << numB) | 0;
      case '>>': return (numA >> numB) | 0;
      default: return numA;
    }
  }

  // --- Unit Converter Matrix ---
  static getUnitCategories() {
    return {
      length: {
        name: "Length",
        units: {
          m: { name: "Meter (m)", factor: 1 },
          km: { name: "Kilometer (km)", factor: 1000 },
          cm: { name: "Centimeter (cm)", factor: 0.01 },
          mm: { name: "Millimeter (mm)", factor: 0.001 },
          mi: { name: "Mile (mi)", factor: 1609.344 },
          yd: { name: "Yard (yd)", factor: 0.9144 },
          ft: { name: "Foot (ft)", factor: 0.3048 },
          in: { name: "Inch (in)", factor: 0.0254 },
          nmi: { name: "Nautical Mile (NM)", factor: 1852 }
        }
      },
      mass: {
        name: "Weight / Mass",
        units: {
          kg: { name: "Kilogram (kg)", factor: 1 },
          g: { name: "Gram (g)", factor: 0.001 },
          mg: { name: "Milligram (mg)", factor: 0.000001 },
          t: { name: "Metric Ton (t)", factor: 1000 },
          lb: { name: "Pound (lb)", factor: 0.45359237 },
          oz: { name: "Ounce (oz)", factor: 0.028349523125 }
        }
      },
      temperature: {
        name: "Temperature",
        units: {
          c: { name: "Celsius (°C)" },
          f: { name: "Fahrenheit (°F)" },
          k: { name: "Kelvin (K)" }
        }
      },
      speed: {
        name: "Speed",
        units: {
          mps: { name: "Meters/sec (m/s)", factor: 1 },
          kmh: { name: "Kilometers/hour (km/h)", factor: 0.277777778 },
          mph: { name: "Miles/hour (mph)", factor: 0.44704 },
          knot: { name: "Knot (kn)", factor: 0.514444 },
          fps: { name: "Feet/sec (ft/s)", factor: 0.3048 }
        }
      },
      digital: {
        name: "Digital Data",
        units: {
          b: { name: "Byte (B)", factor: 1 },
          kb: { name: "Kilobyte (KB)", factor: 1024 },
          mb: { name: "Megabyte (MB)", factor: 1048576 },
          gb: { name: "Gigabyte (GB)", factor: 1073741824 },
          tb: { name: "Terabyte (TB)", factor: 1099511627776 }
        }
      },
      area: {
        name: "Area",
        units: {
          sqm: { name: "Square Meter (m²)", factor: 1 },
          sqkm: { name: "Square Kilometer (km²)", factor: 1e6 },
          sqft: { name: "Square Foot (ft²)", factor: 0.092903 },
          acre: { name: "Acre (ac)", factor: 4046.856 },
          hectare: { name: "Hectare (ha)", factor: 10000 }
        }
      },
      time: {
        name: "Time",
        units: {
          sec: { name: "Second (s)", factor: 1 },
          ms: { name: "Millisecond (ms)", factor: 0.001 },
          min: { name: "Minute (min)", factor: 60 },
          hr: { name: "Hour (hr)", factor: 3600 },
          day: { name: "Day (d)", factor: 86400 },
          wk: { name: "Week (wk)", factor: 604800 },
          yr: { name: "Year (yr)", factor: 31536000 }
        }
      }
    };
  }

  static convertUnit(categoryKey, fromUnit, toUnit, value) {
    const categories = CalculatorEngine.getUnitCategories();
    const cat = categories[categoryKey];
    if (!cat) return 0;

    const val = Number(value);
    if (isNaN(val)) return 0;

    // Temperature special handling
    if (categoryKey === 'temperature') {
      let celsius = val;
      if (fromUnit === 'f') {
        celsius = (val - 32) * (5 / 9);
      } else if (fromUnit === 'k') {
        celsius = val - 273.15;
      }

      if (toUnit === 'c') return celsius;
      if (toUnit === 'f') return celsius * (9 / 5) + 32;
      if (toUnit === 'k') return celsius + 273.15;
      return celsius;
    }

    // Standard linear conversions
    const fromFactor = cat.units[fromUnit]?.factor || 1;
    const toFactor = cat.units[toUnit]?.factor || 1;

    // Convert to base, then to target
    const baseVal = val * fromFactor;
    return baseVal / toFactor;
  }
}

// Export for usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CalculatorEngine;
}
