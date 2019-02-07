class App {
    constructor() {
        this.users = [
            {
                fname: "ABC",
                lname: "XYZ"
            },
            {
                fname: "123",
                lname: "PQR"
            }
        ];
    }

    handleButtonClick() {
        console.log(this.users);
    }
}