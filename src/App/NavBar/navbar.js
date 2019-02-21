class NavBar {
    constructor() {
        this.searchq = "Search Products";
    }

    clearph() {
        if(this.searchq == "Search Products") {
            this.searchq = "";
        }
    }

    searchboxKeyDown() {
        console.log(this.searchq);
    }
}