const {ccclass, property} = cc._decorator;

/**item基类 */
@ccclass
export default abstract class item_base<T> extends cc.Component {
    constructor() {
        super();
        if (CC_EDITOR) {
            return;
        }
        this._init_task_o = new Promise(resolve_o=> {
            // cc.log("resolve_o");
            resolve_o();
            if (this._isOnLoadCalled) {
                resolve_o();
            } else {
                this._resolve_o = resolve_o;
            }
        })
    }
    /* *****************private***************** */
    private _resolve_o: (value?: T | PromiseLike<T>)=> void;
    /* *****************protected***************** */
    protected _data_a: T;
    protected _init_task_o: Promise<T>;
    /* *****************public***************** */
    /**数据下标 */
    public index_n = -1;
    /* -------------------------------delimiter------------------------------- */
    onLoad() {
        this._resolve_o && this._resolve_o();
    }
    /* -------------------------------delimiter------------------------------- */
    public readonly refresh = async (data_a_: T)=> {
        if (data_a_ == undefined) {
            let a = 0;
        }
        this._data_a = data_a_;
        await this._init_task_o;
        // cc.log("reseted");
        this._refresh();
    };

    protected abstract _refresh(): void;
}