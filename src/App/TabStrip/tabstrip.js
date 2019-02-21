class TabStrip {
    constructor() {
        this.curTabStat = [];
    }

    onRefresh() {
        this.curTabStat = this.props.tabstat;
    }
}