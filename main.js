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
}

document.addEventListener("DOMContentLoaded", () => {
  new Draw();
});
