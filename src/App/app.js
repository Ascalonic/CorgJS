class App {
    constructor() {
        this.users = [{
            fname: "ABC", lname: "DEF"    
        }];
        this.fname = "";
        this.lname = "";
    }

    handleAdd() {
        this.users.push({
            fname: this.fname,
            lname: this.lname
        });
    }

    handleElemClick() {
        console.log(this);
        alert(my.fname + ' ' + my.lname);
    }
}