/**
 * @typedef{{operation: string, arguments: (string|number)[]}} Instruction
 */

/**
 * @param {string} input
 * @returns {Instruction[]}
 */
function parser(input) {
  /**@type{Instruction[]}*/
  let r = [];
  let lines = input.split("\n");
  for (let i = 0; i < lines.length; i++) {
    let chars = lines[i].split("");
    let lexemes = [];
    for (let j = 0; j < chars.length; j++) {
      let char = chars[j];
      switch (char) {
        // skip whitespace
        case "\t":
        case "":
        case " ":
          continue;
        case "/" && chars[j + 1]: // skip comment
          while (j < chars.length) {
            j++;
            char = chars[j];
          }
          continue;
        case '"': {
          j++; // skip "
          char = chars[j];
          let start = j;
          while (j < chars.length && char !== '"') {
            j++;
            char = chars[j];
          }
          if (char !== '"') {
            throw new Error(`Unterminated string in line ${i} and column ${j}`);
          }
          lexemes.push(lines[i].substring(start, j++));
          break;
        }
        default: {
          let start = j;
          while (j < chars.length && char !== " ") {
            j++;
            char = chars[j];
          }
          let l = lines[i].substring(start, j);
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
      r.push({ operation: lexemes[0], arguments: lexemes.slice(1) });
    }
  }
  return r;
}

class Draw {
  /**
   * @type {HTMLCanvasElement|null}
   */
  #board;
  /**
   * @type {CanvasRenderingContext2D|null}
   */
  #ctx;

  constructor(editor) {
    this.#board = document.getElementById("board");
    if (this.#board === null) {
      throw new Error("Failed to access canvas board");
    }
    this.#ctx = this.#board.getContext("2d");
    this.#board.height = 512;
    this.#board.width = 512;
  }

  /**
   * @type {Instruction[]} instructions
   */
  execute(instructions) {
    for (let i = 0; i < instructions.length; i++) {
      let instruction = instructions[i];
      switch (instruction) {
        // TODO: implement instructions
        default:
          throw new Error(
            `Operation "${instruction.operation}" not defined (args:${instruction.arguments})`
          );
      }
    }
  }
}

let editor = null;
function shareURL() {
  window.location.href =
    window.location.href.split("?")[0] + "?i=" + btoa(editor?.getValue());
}

document.addEventListener("DOMContentLoaded", () => {
  editor = CodeMirror.fromTextArea(document.getElementById("code"), {
    lineNumbers: true,
    mode: "text/plain",
    theme: "base16-light",
  });
  let args = new URLSearchParams(location.search).get("i");
  let text = `// set the color to red
COLOR #ff0000
// draw a red box at 256 256
BOX 256 256 1 1

// set the color to green
COLOR green
// draw a line from 0x0 to 10x10
LINE 0 0 10 10

// write text at 128x128
TEXT 128 128 Hello World`;

  if (args?.length) {
    text = atob(args);
  }
  editor?.setOption("value", text);
  let d = new Draw();
  editor.on("update", function () {
    let instructions = parser(editor.getValue());
    d.execute(instructions);
  });
});
