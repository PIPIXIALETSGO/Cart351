/* Pairs of (y, x) values to be added to the first cubes coordinates to create 
   the coordinates of a new cube in the block.
   Cube 1 found in the centre of the block as it is the centre point and so the 
   rotation point. */

/*  2
    1
    3 4
*/
const L1 = [[0, 0], [1, 0], [-1, 0], [-1, -1]]
/* Clockwise rotations */
/*  3 1 2
    4 
*/
const L2 = [[0, 0], [0, -1], [0, 1], [-1, 1]]
/*  4 3
      1
      2
*/
const L3 = [[0, 0], [-1, 0], [1, 0], [1, 1]]
/*      4
    2 1 3
*/
const L4 = [[0, 0], [0, -1], [0, 1], [1, 1]]


/*    2
      1
    4 3
*/
const bkwdsL1 = [[0, 0], [1, 0], [-1, 0], [-1, 1]]
/* Clockwise rotations */
/*  4
    3 1 2
*/
const bkwdsL2 = [[0, 0], [0, -1], [0, 1], [1, 1]]
/*  3 4
    1
    2
*/
const bkwdsL3 = [[0, 0], [1, 0], [-2, 0], [-2, 1]]
/*  2 1 3
        4
*/
const bkwdsL4 = [[0, 0], [0, -1], [0, 1], [-1, -1]]


/*  2
    1
    3
    4
*/
const line1 = [[0, 0], [1, 0], [-1, 0], [-2, 0]]
/*  2 1 3 4
*/
const line2 = [[0, 0], [0, 1], [0, -1], [0, -2]]


/*  1 2
    3 4
*/
const square1 = [[0, 0], [0, -1], [-1, 0], [-1, -1]]


/*  2
    1 3
      4
*/
const S1 = [[0, 0], [-1, 0], [-1, -1], [-2, -1]]
/*    1 2
    4 3
*/
const S2 = [[0, 0], [0, -1], [-1, 0], [-1, 1]]


/*    2 
    3 1 
    4  
*/
const bkwdsS1 = [[0, 0], [-1, 0], [-1, 1], [-2, 1]]
/*  4 3
      1 2
*/
const bkwdsS2 = [[0, 0], [0, -1], [1, 0], [1, 1]]

/*    3 
    2 1 4 
*/
const T1 = [[0, 0], [-1, 1], [-1, 0], [-1, -1]]
/*  2 r
    1 3
    4 
*/
const T2 = [[0, 0], [1, 0], [0, -1], [-1, 0]]
/*  4 1 2
      3 
*/
const T3 = [[0, 0], [0, -1], [-1, 0], [0, 1]]
/*    4
    3 1
      2
*/
const T4 = [[0, 0], [-1, 0], [0, 1], [1, 0]]

/*  2
    1
    3 4
*/
function createL(startPos,color) {
  return new Block(startPos, [L1, L2, L3, L4],color)
}

/*    2
      1
    4 3
*/
function createBkwdsL(startPos,color) {
  return new Block(startPos, [bkwdsL1, bkwdsL2, bkwdsL3, bkwdsL4],color);
}

/*  2
    1
    3
    4
*/
function createLine(startPos,color) {
  return new Block(startPos, [line1, line2],color);
}

/*  1 2
    3 4
*/
function createSquare(startPos,color) {
  return new Block(startPos, [square1],color);
}

/*  2 
    1 3
      4
*/
function createS(startPos,color) {
  return new Block(startPos, [S1, S2],color);
}

/*    2 
    3 1 
    4  
*/
function createBkwdsS(startPos,color) {
  return new Block(startPos, [bkwdsS1, bkwdsS2],color);
}

/*    3 
    2 1 4 
*/
function createT(startPos,color) {
  return new Block(startPos, [T1, T2, T3, T4],color);
}

/* Selects a random block from the Tetris collection */
function randomBlock(startPos, shape, color) {
  if (shape == "createL") {
    return createL(startPos, color);
  } else if (shape == "createBkwdsL") {
    return createBkwdsL(startPos, color);
  } else if (shape == "createLine") {
    return createLine(startPos, color);
  } else if (shape == "createSquare") {
    return createSquare(startPos, color);
  } else if (shape == "createS") {
    return createS(startPos, color); 
  } else if (shape == "createBkwdsS") {
    return createBkwdsS(startPos, color);
  } else if (shape == "createT") {
    return createT(startPos, color);
  }
}
