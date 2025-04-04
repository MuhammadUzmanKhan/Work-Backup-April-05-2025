function addHandler($n1: number, $n2: number, cb: ($number: number) => void) {
    const result  = $n1 + $n2;
    cb(result);
}


addHandler(11, 12, (result) => {
    console.log(result);
});


