import {vec} from 'excalibur';
import {Grid} from './grid';

export const installTitle = (grid: Grid) => {
    const titleOffset = vec(0, 1);
    // T
    grid.addBlock(titleOffset.y, titleOffset.x);
    grid.addBlock(titleOffset.y, titleOffset.x + 1);
    grid.addBlock(titleOffset.y, titleOffset.x + 2);
    grid.addBlock(titleOffset.y + 1, titleOffset.x + 1);
    grid.addBlock(titleOffset.y + 2, titleOffset.x + 1);
    grid.addBlock(titleOffset.y + 3, titleOffset.x + 1);
    grid.addBlock(titleOffset.y + 4, titleOffset.x + 1);
    // E
    grid.addBlock(titleOffset.y, titleOffset.x + 4);
    grid.addBlock(titleOffset.y, titleOffset.x + 5);
    grid.addBlock(titleOffset.y + 1, titleOffset.x + 4);
    grid.addBlock(titleOffset.y + 2, titleOffset.x + 4);
    grid.addBlock(titleOffset.y + 2, titleOffset.x + 5);
    grid.addBlock(titleOffset.y + 3, titleOffset.x + 4);
    grid.addBlock(titleOffset.y + 4, titleOffset.x + 4);
    grid.addBlock(titleOffset.y + 4, titleOffset.x + 5);
    // T
    grid.addBlock(titleOffset.y, titleOffset.x + 7);
    grid.addBlock(titleOffset.y, titleOffset.x + 8);
    grid.addBlock(titleOffset.y, titleOffset.x + 9);
    grid.addBlock(titleOffset.y + 1, titleOffset.x + 8);
    grid.addBlock(titleOffset.y + 2, titleOffset.x + 8);
    grid.addBlock(titleOffset.y + 3, titleOffset.x + 8);
    grid.addBlock(titleOffset.y + 4, titleOffset.x + 8);
    // R
    grid.addBlock(titleOffset.y + 6, titleOffset.x);
    grid.addBlock(titleOffset.y + 6, titleOffset.x + 1);
    grid.addBlock(titleOffset.y + 7, titleOffset.x);
    grid.addBlock(titleOffset.y + 7, titleOffset.x + 2);
    grid.addBlock(titleOffset.y + 8, titleOffset.x);
    grid.addBlock(titleOffset.y + 8, titleOffset.x + 1);
    grid.addBlock(titleOffset.y + 9, titleOffset.x);
    grid.addBlock(titleOffset.y + 9, titleOffset.x + 2);
    grid.addBlock(titleOffset.y + 10, titleOffset.x);
    grid.addBlock(titleOffset.y + 10, titleOffset.x + 2);
    // I
    grid.addBlock(titleOffset.y + 6, titleOffset.x + 4);
    grid.addBlock(titleOffset.y + 7, titleOffset.x + 4);
    // grid.addBlock(titleOffset.y + 8, titleOffset.x + 4);
    // grid.addBlock(titleOffset.y + 9, titleOffset.x + 4);
    // grid.addBlock(titleOffset.y + 10, titleOffset.x + 4);
    grid.addBlock(titleOffset.y + 8, titleOffset.x + 4);
    // grid.addBlock(titleOffset.y + 6, titleOffset.x + 5);
    // grid.addBlock(titleOffset.y + 7, titleOffset.x + 5);
    grid.addBlock(titleOffset.y + 8, titleOffset.x + 5);
    grid.addBlock(titleOffset.y + 9, titleOffset.x + 5);
    grid.addBlock(titleOffset.y + 10, titleOffset.x + 5);
    // S
    grid.addBlock(titleOffset.y + 6, titleOffset.x + 8);
    grid.addBlock(titleOffset.y + 6, titleOffset.x + 9);
    grid.addBlock(titleOffset.y + 7, titleOffset.x + 7);
    grid.addBlock(titleOffset.y + 8, titleOffset.x + 8);
    grid.addBlock(titleOffset.y + 9, titleOffset.x + 9);
    grid.addBlock(titleOffset.y + 10, titleOffset.x + 7);
    grid.addBlock(titleOffset.y + 10, titleOffset.x + 8);
};
