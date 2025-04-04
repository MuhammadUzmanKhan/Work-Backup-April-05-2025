function sum($input1: number | string, $input2: number | string) {
    let result: number | string;
    if (typeof $input1 === 'number' && typeof $input2 === 'number') {
        return result = $input1 + $input2
    } else if (typeof $input1 === 'string' && typeof $input2 === 'string') {
        return result = $input1 + $input2;
    }
}



console.log(sum("Ali", "Ahmad"));
console.log(sum(1, 4));