
export type EvaluationResult = [0 | 1 | 2, 0 | 1 | 2, 0 | 1 | 2, 0 | 1 | 2, 0 | 1 | 2];

export function vibed_EvaluateSpelly(candidate: string, solution: string): EvaluationResult {
    const result: EvaluationResult = Array(5).fill(2) as EvaluationResult;
    const used = Array(5).fill(false);

    // Pass 1: exact matches
    for (let i = 0; i < 5; i++) {
        if (candidate[i] === solution[i]) {
            result[i] = 0;
            used[i] = true;
        }
    }

    // Pass 2: in-word mismatches
    for (let i = 0; i < 5; i++) {
        if (result[i] !== 0) {
            for (let j = 0; j < 5; j++) {
                if (!used[j] && candidate[i] === solution[j]) {
                    result[i] = 1;
                    used[j] = true;
                    break;
                }
            }
        }
    }

    return result;
}
