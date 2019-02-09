class App {
    constructor() {
        this.users = [];
        this.fname = "";
        this.lname = "";
    }

    handleAdd() {
        this.users.push({
            fname: this.fname,
            lname: this.lname
        })
    }
}