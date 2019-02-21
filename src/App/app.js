class App {
    constructor() {
        this.tabStat = [false, true];
        this.tabTo = 1;
        this.hideSideNav = true;

        this.searchq = "";
    }

    changeTab() {
        this.showSideNav(this);
        for(var i=0;i<this.tabStat.length;i++) {
            if(i == this.tabTo) this.tabStat[i] = false;
            else this.tabStat[i] = true;
        }
    }

    showSideNav() {
        this.hideSideNav = false;
    }

    closeSideNav() {
        this.hideSideNav = true;
    }
}