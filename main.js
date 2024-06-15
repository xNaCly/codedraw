class Draw {
  /**
   * @type {HTMLCanvasElement|null}
   */
  #board;
  /**
   * @type {CanvasRenderingContext2D|null}
   */
  #ctx;

  constructor() {
    this.#board = document.getElementById("board");
    if (this.#board === null) {
      throw new Error("Failed to access canvas board");
    }
    this.#ctx = this.#board.getContext("2d");
    this.#setup();
  }

  #setup() {
    this.#board.height = 512;
    this.#board.width = 512;
  }

  #execute(instructions) {}
}

document.addEventListener("DOMContentLoaded", () => {
  let editor = CodeMirror.fromTextArea(document.getElementById("code"), {
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
  editor.setOption("value", text);
  new Draw();
});
