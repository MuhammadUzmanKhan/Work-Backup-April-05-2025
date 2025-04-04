// you can use namespace interface name as DDInterface(Drag-drop interface) a specific name but at the end it is splitting and exporting the interfaces and to use this
// we would have to wrap our whole code so its good to use it as a general name

export interface Draggable {
    dragStartHandler: (event: DragEvent) => void;
    dragEndHandler: (event: DragEvent) => void;
}

export interface DragTarget {
    dragOverHandler(event: DragEvent): void;
    dropHandler(event: DragEvent): void;
    dragLeaveHandler(event: DragEvent): void;
}