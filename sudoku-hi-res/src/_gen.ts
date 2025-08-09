import {SudokuCreator} from '@algorithm.ts/sudoku';

const creator = new SudokuCreator({ childMatrixWidth: 3 });

for (let i = 0; i < 1000; ++i) {
    const gen = creator.createSudoku(0.9);
    console.log(JSON.stringify(gen));
}
