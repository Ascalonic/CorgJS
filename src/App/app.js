class App {
    constructor() {
        this.loginInfo = {
            username: "",
            password: ""
        }
        this.message = "Login";
    }

    handleLogin() {
        console.log("Login");
        console.log(this.loginInfo);

        this.message = "Login Initiated";
    }
}