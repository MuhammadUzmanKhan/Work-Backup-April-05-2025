// Types

type Listener = (items: Project[]) => void;

// Enums

enum ProjectStatus {
    Active,
    Finished
}

// reuseable Validator

interface Validatable {
    value: string | number;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
}

function validate(validatableInput: Validatable) {
    let isValid = true;

    if (validatableInput.required) isValid = isValid && validatableInput.value.toString().trim().length !== 0;
    if (validatableInput.minLength != null && typeof validatableInput.value === 'string') isValid = isValid && validatableInput.value.length >= validatableInput.minLength;
    if (validatableInput.maxLength != null && typeof validatableInput.value === 'string') isValid = isValid && validatableInput.value.length <= validatableInput.maxLength;
    if (validatableInput.min != null && typeof validatableInput.value === 'number') isValid = isValid && validatableInput.value >= validatableInput.min;
    if (validatableInput.max != null && typeof validatableInput.value === 'number') isValid = isValid && validatableInput.value <= validatableInput.max;

    return isValid;
}
// autoBind Decorator

function autoBind<T>(_: T, _2: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const adjustedDescriptor: PropertyDescriptor = {
        configurable: true,
        enumerable: false,
        get() {
            const boundFn = originalMethod.bind(this);
            return boundFn;
        }
    }
    return adjustedDescriptor;
}

// Project State Management

class Project {
    constructor(
        public id: string,
        public title: string,
        public description: string,
        public people: number,
        public status: ProjectStatus
    ) { }
}

class ProjectState {
    private static instance: ProjectState;
    private constructor(private projects: any[] = [], private listeners: Listener[] = []) { };

    static getInstance() {
        if (this.instance) return this.instance;
        return this.instance = new ProjectState();
    }


    addListener(listenerFn: Listener): void {
        this.listeners.push(listenerFn);
    }

    addProject(title: string, description: string, noOfPeople: number) {
        const newProject = new Project(
            Date.now().toString(),
            title,
            description,
            noOfPeople,
            ProjectStatus.Active
        );
        this.projects.push(newProject);

        // Run all listener functions
        for (const listenerFn of this.listeners) {
            listenerFn(this.projects.slice());
        }
    };
}


const projectState = ProjectState.getInstance();

class ProjectList {
    templateElement: HTMLTemplateElement;
    hostElement: HTMLDivElement;
    element: HTMLElement;
    private assignedProjects: Project[] = [];

    constructor(private type: 'active' | 'finished') {
        this.templateElement = document.getElementById('project-list')! as HTMLTemplateElement;
        this.hostElement = document.getElementById('app')! as HTMLDivElement;

        const importedNode = document.importNode(this.templateElement.content, true);
        this.element = importedNode.firstElementChild as HTMLElement;
        this.element.id = `${this.type}-projects`;


        projectState.addListener((projects: Project[]) => {
            const relevantProject = projects.filter(prj => {
                if (this.type === 'active') {
                    return prj.status === ProjectStatus.Active
                }
                return prj.status === ProjectStatus.Finished
            })
            this.assignedProjects = relevantProject;
            this.renderProjects();
        })

        projectState.addListener((projects: Project[]) => {
            console.log("2nd listener", projects)
            // this.renderProjects();
        })

        this.attach();
        this.renderContent();
    }
      
    private renderContent() {
        const listId = `${this.type}-projects-list`;
        this.element.querySelector('ul')!.id = listId;
        this.element.querySelector('h2')!.textContent = this.type.toUpperCase() + ' PROJECTS';
    }

    private renderProjects() {
        const listEl = document.getElementById(`${this.type}-projects-list`)! as HTMLUListElement;
        listEl.innerHTML = ''; // whenever add item to list previous list element set to default
        for (const projItem of this.assignedProjects) {
            const listItem = document.createElement('li');
            listItem.textContent = projItem.title;
            listEl.appendChild(listItem);
        }
    }

    private attach() {
        this.hostElement.insertAdjacentElement('beforeend', this.element);
    }
}


class ProjectInput {
    templateElement: HTMLTemplateElement;
    hostElement: HTMLDivElement;
    element: HTMLElement;
    titleInputElement: HTMLInputElement;
    descriptionElement: HTMLInputElement;
    peopleInputElement: HTMLInputElement;


    constructor() {

        // selecting logic

        this.templateElement = document.getElementById('project-input')! as HTMLTemplateElement;
        this.hostElement = document.getElementById('app')! as HTMLDivElement;

        const importedNode = document.importNode(this.templateElement.content, true);
        this.element = importedNode.firstElementChild as HTMLFormElement;
        this.element.id = 'user-input';

        this.titleInputElement = this.element.querySelector('#title') as HTMLInputElement;
        this.descriptionElement = this.element.querySelector('#description') as HTMLInputElement;
        this.peopleInputElement = this.element.querySelector('#people') as HTMLInputElement;
        this.attach();
        this.configure();
    }

    //rendering logic

    private attach() {
        this.hostElement.insertAdjacentElement('afterbegin', this.element);
    }

    private gatherUserInput(): [string, string, number] | void {
        const enteredTitle = this.titleInputElement.value;
        const enteredDescription = this.descriptionElement.value;
        const enteredPeople = this.peopleInputElement.value;

        const titleValidate: Validatable = {
            value: enteredTitle,
            required: true,
            minLength: 2,
        }
        const descriptionValidate: Validatable = {
            value: enteredDescription,
            minLength: 2,
            maxLength: 100
        }
        const peopleValidate: Validatable = {
            value: +enteredPeople,
            required: true,
            min: 1
        }


        if (!validate(titleValidate) || !validate(descriptionValidate) || !validate(peopleValidate)) {
            alert("Invalid Input!")
            return
        };
        return [enteredTitle, enteredDescription, +enteredPeople];
    }

    private clearInputs() {
        this.titleInputElement.value = '';
        this.descriptionElement.value = '';
        this.peopleInputElement.value = '';
    }

    @autoBind
    private submitHandler(event: Event) {
        event.preventDefault();
        const userInput = this.gatherUserInput();
        if (Array.isArray(userInput)) {
            const [title, desc, people] = userInput;
            projectState.addProject(title, desc, people);
            this.clearInputs();
        }
    }

    private configure() {
        this.hostElement.addEventListener('submit', this.submitHandler);
    }
}

const form = new ProjectInput();
const activePrjList = new ProjectList('active');
const finishedPrjList = new ProjectList('finished');

