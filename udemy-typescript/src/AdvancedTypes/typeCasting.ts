// Type Casting 

// ts doesn't go deeper to check which html element js hold it just took it as html element by typecasting we can tell ts what html element it would be

const userInputElement = document.getElementById('user-input');

// const userInputElement= document.getElementById('user-input')! as HTMLInputElement; OR below one

if (userInputElement) (userInputElement as HTMLInputElement).value = "Hi there";