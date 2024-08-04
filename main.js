/**
 * @param {string} input
 * @returns {Instruction[]}
 */
function parser(input) {
  /**
   * @typedef{{operation: string, arguments: (string|number)[], line: number, column: number}} Instruction
   */
  /**@type{Instruction[]}*/
  let r = [];
  let lines = input.split("\n");
  let line = 0;
  let column = 0;
  try {
    for (; line < lines.length; line++) {
      let chars = lines[line].split("");
      let lexemes = [];
      for (column = 0; column < chars.length; column++) {
        let char = chars[column];
        switch (char) {
          // skip whitespace
          case "\t":
          case "":
          case " ":
            continue;
          case "/": // skip comment
            if (chars[column + 1] === "/") {
              while (column < chars.length) {
                column++;
                char = chars[column];
              }
              continue;
            }
          case '"': {
            column++; // skip "
            char = chars[column];
            let start = column;
            while (column < chars.length && char !== '"') {
              column++;
              char = chars[column];
            }
            if (char !== '"') {
              throw {
                name: "LexerError",
                message: "Unterminated String",
                from: start,
                to: column,
              };
            }
            lexemes.push(lines[line].substring(start, column++));
            break;
          }
          default: {
            let start = column;
            while (column < chars.length && char !== " ") {
              column++;
              char = chars[column];
            }
            let l = lines[line].substring(start, column);
            let firstChar = l.charAt(0);
            if (firstChar >= "0" && firstChar <= "9") {
              lexemes.push(parseInt(l));
            } else {
              lexemes.push(l);
            }
          }
        }
      }
      if (lexemes.length) {
        r.push({
          operation: lexemes[0],
          arguments: lexemes.slice(1),
          line,
          column,
        });
      }
    }
  } catch (e) {
    throw new Error(
      `${e.message} in line ${line + 1} and column ${column + 1}`
    );
  }
  return r;
}

class Draw {
  /**
   * @type {HTMLCanvasElement|null}
   */
  board;
  /**
   * @type {CanvasRenderingContext2D|null}
   */
  #ctx;

  constructor() {
    this.board = document.getElementById("board");
    if (this.board === null) {
      throw new Error("Failed to access canvas board");
    }
    this.#ctx = this.board.getContext("2d");
    this.board.height = 512;
    this.board.width = 512;
  }

  genErr(instruction, msg) {
    return {
      name: "ExecutionError",
      message: msg,
      from: instruction.column - instruction.operation.length,
      to: instruction.column,
    };
  }

  /**
   * @param {Instruction[]} instructions
   */
  execute(instructions) {
    this.#ctx.clearRect(0, 0, this.board.width, this.board.height);
    for (let i = 0; i < instructions.length; i++) {
      let instruction = instructions[i];
      try {
        switch (instruction.operation) {
          case "COLOR":
            if (instruction.arguments.length !== 1) {
              throw this.genErr(
                instruction,
                "COLOR requires exactly one argument"
              );
            }
            this.#ctx.fillStyle = instruction.arguments[0];
            this.#ctx.strokeStyle = instruction.arguments[0];
            break;
          case "BOX": {
            if (instruction.arguments.length !== 4) {
              throw this.genErr(
                instruction,
                "BOX requires exactly four arguments (x,y,w,h)"
              );
            }
            let [x, y, w, h] = instruction.arguments;
            this.#ctx.fillRect(x, y, w, h);
            break;
          }
          case "WIDTH": {
            if (instruction.arguments.length !== 1) {
              throw this.genErr(
                instruction,
                "WIDTH requires exactly one argument (width)"
              );
            }
            this.#ctx.lineWidth = instruction.arguments[0];
            break;
          }
          case "LINE": {
            if (instruction.arguments.length !== 4) {
              throw this.genErr(
                instruction,
                "LINE requires exactly four arguments (sx,sy,ex,ey)"
              );
            }
            let [x, y, x1, y1] = instruction.arguments;
            this.#ctx.beginPath();
            this.#ctx.moveTo(x, y);
            this.#ctx.lineTo(x1, y1);
            this.#ctx.stroke();
            break;
          }
          case "FONT": {
            if (instruction.arguments.length != 1) {
              throw this.genErr(
                instruction,
                "FONT requires exactly one argument (font)"
              );
            }
            this.#ctx.font = instruction.arguments[0];
            break;
          }
          case "TEXT": {
            if (instruction.arguments.length < 3) {
              throw this.genErr(
                instruction,
                "TEXT requires exactly three arguments (x,y,text)"
              );
            }
            let [x, y, text] = instruction.arguments;
            this.#ctx.fillText(text, x, y);
            break;
          }
          default:
            throw this.genErr(
              instruction,
              `Operation "${instruction.operation}" not defined (args:${instruction.arguments})`
            );
        }
        updateToast("");
      } catch (e) {
        let { line, column } = instruction;
        throw new Error(
          `${e.message} in line ${line + 1} and column ${column + 1}`
        );
      }
    }
  }
}

let editor = null;
let draw = null;
/**@type{HTMLSpanElement|null}*/
let errorToast = null;
/**@type{HTMLDivElement|null}*/
let docs = null;

function toggleDocs() {
  docs.classList.toggle("hidden");
}

function updateToast(text) {
  if (text) {
    errorToast.innerText = text;
    errorToast.classList.remove("hidden");
  } else {
    errorToast.classList.add("hidden");
  }
}

function shareURL() {
  if (!navigator.clipboard) {
    throw new Error("Failed to copy to clipboard");
  }
  errorToast.innerText =
    "Copied the link to your creation to your clipboard :^)";
  errorToast.classList.remove("hidden");
  setTimeout(() => {
    errorToast.classList.add("hidden");
  }, 3000);
  navigator.clipboard.writeText(
    window.location.href.split("?")[0] + "?i=" + btoa(editor?.getValue())
  );
}

function exportImg() {
  let url = draw?.board.toDataURL();
  window.open(url, "_blank");
}

window.onerror = (msg) => {
  updateToast(msg);
  return false;
};

document.addEventListener("DOMContentLoaded", () => {
  CodeMirror.defineSimpleMode("codedraw", {
    start: [
      { regex: /"(?:[^\\]|\\.)*?(?:"|$)/, token: "string" },
      { regex: /[A-Z]/, token: "keyword" },
      { regex: /[a-z#]/, token: "atom" },
      {
        regex: /0x[a-f\d]+|[-+]?(?:\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/i,
        token: "number",
      },
      { regex: /[,\)\(]/, token: "operator" },
      { regex: /\/\/.*/, token: "comment" },
    ],
    meta: {
      lineComment: "//",
    },
  });
  errorToast = document.getElementById("error");
  docs = document.getElementById("documentation");

  editor = CodeMirror.fromTextArea(document.getElementById("code"), {
    lineNumbers: true,
    mode: "codedraw",
    theme: "neo",
  });

  let args = new URLSearchParams(location.search).get("i");
  let text = `// click on [Documentation] for a list of instructions
// click on [Share] to share your creations with friends
// click on [Export] to generate an image from your drawing
COLOR rgba(117,67,138,1)
BOX 0 0 512 512
COLOR white
FONT "48px monospace"
TEXT 130 260 "HELLO WORLD"
TEXT 240 350 "<3"
// made with <3 by xnacly :^)`;

  if (args?.length) {
    text = atob(args);
  } else {
    let t = localStorage.getItem("content");
    if (t) {
      text = t;
    }
  }

  draw = new Draw();
  editor.on("update", function () {
    let val = editor.getValue();
    if (val.length && !args?.length) {
      localStorage.setItem("content", val);
    }
    try {
      let instructions = parser(val);
      draw.execute(instructions);
    } catch (e) {
      console.table(e);
      updateToast(e.message);
    }
  });
  editor?.setOption("value", text);
});
