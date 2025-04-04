//Build-in generic type 

// A generic type is a type which is kind of connected to the other type and is really flexible regarding which exact type other type is .

// like array can store a number or  string or any other type means ' its identity is connected with the data it will store in itself '

// for that generics type is used and describe as usual 'Array<what it holds>' or what it holds[]  

const names: Array<string> = [];  // or string[]


// similarly promises are also a generic type 

const promise: Promise<string> = new Promise((resolve, reject) => { // if you hover over constant promise variable without defining its type you will se that promise of type unknown 
    // ts will not know what will be its type once it get resolve we can define that using Promise <string> as we are passing string as an argument on resolve  
    setTimeout(() => {
        resolve("this is done!")
    }, 2000)
});


// Custom generic function 


// function merge(objA: object, objB: object) {
//     return Object.assign(objA, objB);
// }

// const mergedObj = merge({ name: "ali" }, { age: "3" }); 

// mergedObj.age

// on above code  ts doesn't able to understand that return obj will be an intersection of both objA and objB here generic types could help us

// object on above code is highly unspecified type that's y ts didn't understand that

function merge<T extends object, U extends object>(objA: T, objB: U) { // 'generic type with constraints' that it will be of object type  
    return Object.assign(objA, objB);
}

const mergedObj = merge({ name: "ali" }, { age: 3 });
mergedObj.name


//Another Generic Function 

// when you are not too specific about the data structure you are providing to the function

// and we get to know that our work will be done by a specific property we can build a interface and extends that to generic function

interface Lengthy {
    length: number;
}
function countAndDescribe<T extends Lengthy>(element: T): [T, string] {
    let descriptionText = 'Got no values.';
    if (element.length === 1) descriptionText = 'Got 1 element.'
    else if (element.length > 1) descriptionText = 'Got' + element.length + 'elements';
    return [element, descriptionText];
}

// without interface on line 51 ts complaining about the length of an element we can fix that by extending the 'generic type with our custom interface' and putting the required 


// the 'keyof' constraint 


function extractAndConvert<T extends object, U extends keyof T>(objA: T, key: U) { // the keyof constraint tells ts that this property lies in the first property
    return objA[key];
}

extractAndConvert({ name: "max" }, 'name');

// Generic Classes


class DataStorage<T extends string | number | boolean> {
    private data: T[] = []; // it could be of string ,number or object and we might not care what type of data goes into the data array

    addItem(item: T) {
        this.data.push(item);
    }

    removeItem(item: T) {
        this.data.splice(this.data.indexOf(item), 1)
    }

    getItems() {
        return [...this.data];
    }
}

const textStorage = new DataStorage<string>();

textStorage.addItem("Ali");
textStorage.addItem("Ahmad");
textStorage.removeItem("Ali");

console.log(textStorage.getItems());

const numberStorage = new DataStorage<number>(); // using generic class it is now flexible(accepting different types) and perfectly typed also  

numberStorage.addItem(11); // hence generic type gives us flexibility and type safety


// generic Utility types 

// build-in utility types in ts which utilizes generics types

interface CourseGoal {
    title: string;
    description: string;
}

function createCourseGoal(title: string, description: string): CourseGoal {
    let courseGoal: Partial<CourseGoal> = {}

    courseGoal.title = title;
    courseGoal.description = description; // t.s doesn't understands this one by one addition to the object's properties to make it consider we can use 'Partial utility type' which tells t.s that it is partially {} but later it will be as described as return type 

    return courseGoal as CourseGoal;
}

const users: Readonly<string[]> = ['Max', 'Anna']; // users.push('Manu'); // push or pop now will not works because of 'utility type Readonly'




