// indexing property:  where you don't know what properties it might be or how many properties it might be

interface ErrorMessage{
    [props:string]:string;
}

const errorBag:ErrorMessage={
    email:"invalid Email",
    username:"Username must start with capital character!"
}


