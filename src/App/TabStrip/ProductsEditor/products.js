class Products {
    constructor() {
        this.products = [];
        this.productName = "";
        this.nextProdID = 0;

        this.modProductName = "";
        this.modProductID = -1;
        
        this.alerts = {
            noErrors: true,
            errMessage: ""
        };

        this.noProducts = true;
        this.subtabstate = [false, true];
    }

    handleEditProduct() {
        this.modProductName = my.name;
        this.modProductID = my.id;
        this.subtabstate = [true, false];
    }

    handleAddProduct() {

        this.alerts = {
            noErrors : true,
            errMessage : ""
        };

        if(this.productName == "" || this.productName == null) {
            this.alerts = {
                noErrors : false,
                errMessage : "Please enter a valid product Name"
            }
            return;
        }

        if(this.products.find(prod => prod.name === this.productName) != null) {
            this.alerts = {
                noErrors : false,
                errMessage : "Product Already exists"
            }
            this.productName = "";
            return;
        }

        this.products.push({
            name: this.productName, 
            id: this.nextProdID++
        });

        this.noProducts = false;
        this.productName = "";
    }

    handleModProductName() {
        var modproduct = this.products.find((value, index, obj) => {
            if(value.id === this.modProductID) return value;
        });

        if(modproduct!=null) {
            modproduct.name = this.modProductName;
        }

        this.subtabstate = [false, true];
        this.noProducts = (this.products.length == 0);
    }

    handleRemoveProduct() {
        this.products = this.products.filter((value, index, array) => {
            if(value.id !== this.modProductID) return value;
        });
        this.subtabstate = [false, true];
        this.noProducts = (this.products.length == 0);
    }

    handleCancelProductMod() {
        this.subtabstate = [false, true];
    }
}