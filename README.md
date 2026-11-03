# OmniCalc Pro &mdash; Advanced Engineering & Mathematical Computing Suite

> **Academic Project Submission**  
> **Course / Discipline:** Computer Science & Engineering / Web Technologies / Software Development  
> **Technology Stack:** Pure HTML5 Semantic Standard, Vanilla CSS3 (Custom Design System & Glassmorphism Tokens), Modern JavaScript (ES6+), Web Audio API Synthesizer, AST & Shunting-Yard Parsing Engine.

---

## 🌟 Executive Summary

**OmniCalc Pro** is a modern, high-precision multi-mode computational platform developed for academic presentation and real-world utility. Moving far beyond trivial four-function calculators, OmniCalc Pro delivers an industrial-grade algebraic parsing system compliant with the international mathematical order of operations (**BODMAS / PEMDAS**), a complete **Scientific Computing Suite**, a 32-bit/64-bit **Programmer Radix Engine**, and a **Multi-Dimensional Unit Converter Matrix**.

Designed with **glassmorphism aesthetics, dynamic ambient glows, Web Audio synthesis, interactive themes, calculation history persistence, and complete keyboard accessibility**, OmniCalc Pro is engineered to impress evaluators and project viva panels.

---

## 🚀 Key Functional Modules

### 1. 🧮 Mathematical Engine & Parser
- **Shunting-Yard Algorithm:** Converts mathematical expressions into Reverse Polish Notation (RPN) and evaluates them via an abstract stack, eliminating unsafe `eval()` executions.
- **Strict BODMAS / PEMDAS:** Accurately resolves operator hierarchy:
  $$\text{Parentheses} \rightarrow \text{Exponents} \rightarrow \text{Multiplication \& Division} \rightarrow \text{Addition \& Subtraction}$$
- **Implicit Multiplication:** Dynamically tokenizes formats such as `5(2 + 3)`, `(4)(5)`, `2π`, and `3sin(30)` without requiring explicit `×` operator inputs.
- **Floating-Point Guard (IEEE 754 Clean):** Neutralizes standard binary arithmetic errors (e.g. `0.1 + 0.2 = 0.3`, instead of `0.30000000000000004`).
- **Parentheses Auto-Completion:** Automatically balances unclosed opening parentheses upon calculation execution.

### 2. 🔬 Scientific Functions Suite
- **Trigonometry & Inverse Trig:** `sin`, `cos`, `tan`, `sin⁻¹`, `cos⁻¹`, `tan⁻¹`, `sinh`, `cosh`, `tanh`.
- **Dual Angular Modes:** Instant toggle between **DEG** (Degrees) and **RAD** (Radians) with live angle indicator badge.
- **Logarithms & Exponentials:** Natural logarithm (`ln`), common base-10 logarithm (`log₁₀`), base-2 binary logarithm (`log₂`), natural exponent (`eˣ`), and arbitrary powers ($x^y$).
- **Roots & Factorials:** Square root ($\sqrt{x}$), cube root ($\sqrt[3]{x}$), factorials ($x!$), reciprocal ($1/x$), absolute value ($|x|$), and random generator ($[0, 1)$).
- **Fundamental Constants:** $\pi$ ($3.14159265...$) and Euler's number $e$ ($2.71828182...$).

### 3. 💻 Programmer Mode (Multi-Radix & Bitwise Engine)
- **Synchronized Radix Converter:** Live, simultaneous conversion across 4 key computing number systems:
  - **HEX** (Hexadecimal &mdash; Base 16)
  - **DEC** (Decimal &mdash; Base 10)
  - **OCT** (Octal &mdash; Base 8)
  - **BIN** (Binary &mdash; Base 2 with formatted 4-bit nibbles, e.g. `0000 1101`)
- **Bitwise Logic Operations:** `AND`, `OR`, `XOR`, `NOT`, `<<` (Left Bit Shift), and `>>` (Right Bit Shift).

### 4. 📐 Multi-Dimensional Unit Converter Matrix
Supports instant linear and non-linear physical dimension conversions with live formula explanations and quick-reference sample charts:
- **Length:** Meter, Kilometer, Centimeter, Millimeter, Mile, Yard, Foot, Inch, Nautical Mile.
- **Mass / Weight:** Kilogram, Gram, Milligram, Metric Ton, Pound, Ounce.
- **Temperature:** Celsius (°C), Fahrenheit (°F), Kelvin (K) with bidirectional non-linear equations.
- **Speed:** m/s, km/h, mph, knot, ft/s.
- **Data Storage:** Byte (B), Kilobyte (KB), Megabyte (MB), Gigabyte (GB), Terabyte (TB).
- **Area:** Square Meter, Square Kilometer, Square Foot, Acre, Hectare.
- **Time:** Millisecond, Second, Minute, Hour, Day, Week, Year.

### 5. 🎨 UI/UX & Design Architecture
- **Aesthetic Glassmorphism:** Layered frosted glass panels with dynamic backdrop filters (`backdrop-filter: blur(28px)`), radial ambient lighting, and refined border gradients.
- **5 Curated Color Themes:**
  1. *Midnight Glass* (Deep Obsidian + Royal Indigo)
  2. *Cyber Neon* (Cyberpunk Fuchsia + Cyan)
  3. *Aurora Emerald* (Forest Jade + Mint Green)
  4. *Solar Amber* (Warm Graphite + Fiery Amber)
  5. *Arctic Light* (Frosted Crystal + Sapphire Blue)
- **Audio Synthesis Engine:** Real-time procedural sound generator using the browser's native `AudioContext` (pure synthetic oscillators & gain envelopes, no MP3 dependencies).
- **Calculation History Log:** Drawer panel displaying historical calculations with timestamps; click any historical result to instantly load it into current memory.

---

## ⌨️ Complete Keyboard Shortcuts Reference

| Key / Shortcut | Mathematical Action |
| :--- | :--- |
| `0` - `9` | Digit Entry |
| `.` | Decimal Point |
| `+`, `-`, `*`, `/` | Standard Arithmetic Operators ($+$, $-$, $\times$, $\div$) |
| `Enter` or `=` | Calculate / Evaluate Expression |
| `Backspace` | Delete Last Input Character |
| `Escape` or `c` | Clear All (AC) |
| `(` and `)` | Parentheses Framing |
| `^` | Exponentiation ($x^y$) |
| `%` | Percentage / Modulo |
| `s` / `o` / `t` | `sin(` / `cos(` / `tan(` Functions |
| `l` / `n` | `log(` / `ln(` Logarithms |
| `r` | Square Root ($\sqrt{x}$) |
| `p` / `e` | Mathematical Constants $\pi$ and $e$ |
| `h` | Toggle Calculation History Drawer |
| `m` | Toggle Angle Mode (DEG $\leftrightarrow$ RAD) |

---

## 📂 Project Architecture

```
calculator/
│
├── index.html              # Semantic HTML5 markup, accessibility attributes & layout
├── style.css               # Glassmorphism tokens, CSS custom properties, responsive design
├── calculator-engine.js    # Mathematical parser, Shunting-Yard AST, precision sanitizer
├── app.js                  # State coordinator, Web Audio synthesizer, event listeners
└── README.md               # Academic project documentation & viva preparation guide
```

---

## 🎓 College Viva & Defense Questions

When presenting this project to your professor or viva examiner, you can highlight these key architectural decisions:

1. **Q: Why didn't you use `eval()` to calculate expressions?**  
   *A:* `eval()` introduces serious security vulnerabilities (code injection / XSS) and cannot handle custom domain functions, angle modes (DEG vs RAD), or implicit multiplication cleanly. OmniCalc Pro implements an industrial **Shunting-Yard Tokenizer and Reverse Polish Notation (RPN) stack evaluator**, giving complete control over operator precedence, domain validations, and error handling.

2. **Q: How does OmniCalc Pro solve the JavaScript floating point bug `0.1 + 0.2 = 0.30000000000000004`?**  
   *A:* JavaScript stores numbers in IEEE 754 64-bit binary floating-point representation. OmniCalc Pro includes a specialized `cleanPrecision()` method that applies factor rounding to 12 significant figures and converts extreme magnitudes to clean exponential notation.

3. **Q: How does the Audio feedback work without external sound files?**  
   *A:* It uses the browser's native **Web Audio API (`AudioContext`)** to synthesize sinusoidal and triangular wave sound envelopes dynamically. This guarantees zero network latency, offline functionality, and featherlight footprint.

---

## 💻 How to Run

1. Open `index.html` directly in any modern browser (Google Chrome, Mozilla Firefox, Safari, Microsoft Edge).
2. Alternatively, serve via any local development server:
   ```bash
   npx serve .
   # or
   python3 -m http.server 3000
   ```
3. Enjoy an immaculate, presentation-ready computational experience!
