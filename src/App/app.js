class App {
    constructor() {
        this.users = [{
            fname: "ABC", lname: "DEF" 
        }];
        this.fname = "";
        this.lname = "";

        this.loaded = true;
    }

    handleAdd() {
        this.users.push({
            fname: this.fname,
            lname: this.lname
        });
        this.fname = ""; this.lname = "";
    }

    handleElemClick() {
        this.loaded = false;
        setTimeout(() => {
            this.loaded = true;
            //alert(my.fname + ' ' + my.lname);
            app.updateApp();
        }, 1000);
    }
}