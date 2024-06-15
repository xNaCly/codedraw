// implements text parsing and converting the given input into a list of lexemes
/**
 * @typedef{{operation: number, arguments: (string|number)[]}} Instruction
 */

/**
 * @param {string} input
 * @returns {Instruction[]}
 */
function convert(input) {
  /**@type{Instruction[]}*/
  let r = [];
  let lines = input.split("\n");
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    // ignore comments and whitespace lines
    if (line.substring(0, 2) === "//" || line === "") {
      continue;
    }
    let lexemes = line.split(" ");
    console.log(lexemes);
  }
  return r;
}

console.log(
  convert(
    `// set the color to red
COLOR #ff0000
// draw a red box at 256 256
BOX 256 256 1 1

// set the color to green
COLOR green
// draw a line from 0x0 to 10x10
LINE 0 0 10 10

// write text at 128x128
TEXT 128 128 Hello World`
  )
);
