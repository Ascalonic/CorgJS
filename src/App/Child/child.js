class Child {
    constructor() {
        this.arr = [
            {name: "XYZ"},
            {name: "123"}
        ];
        this.new_name = "";
    }

    handleChildClick() {
        console.log(my.name);
    }

    addNewName() {
        this.arr.push({name: this.new_name});
        this.new_name = "";
    }
}