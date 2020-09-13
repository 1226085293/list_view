import item_base from "../../item_base";

const {ccclass, property} = cc._decorator;

@ccclass
export default class item extends item_base<number> {
    protected _refresh(): void {
        this.node.child("text").label.string = this._data_a.toString();
    }
}