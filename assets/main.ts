import list_view from "./list/list_view";


const {ccclass, property} = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {
    @property(list_view)
    list: list_view<number> = null;
    /* -------------------------------delimiter------------------------------- */
    start() {
        let temp1_as = [];
        for(let i = 0; i < 20; temp1_as.push(i++));
        this.list.data_as.push(...temp1_as);
    }
    /* -------------------------------delimiter------------------------------- */
    /**重置列表数据 */
    public event_reset_list(): void {
        this.scheduleOnce(()=> {
            let data_as = [];
            for (let k1_n = 0; k1_n < 10; ++k1_n) {
                data_as.push(k1_n);
            }
            this.list.data_as = data_as;
        }, 2);
    }
    /**获取下页数据 */
    public event_next_page(): void {
        this.scheduleOnce(()=> {
            let data_as = [];
            let len_n = this.list.data_as.length;
            for (let k1_n = len_n; k1_n < len_n + 10; ++k1_n) {
                data_as.push(k1_n);
            }
            this.list.data_as.push(...data_as);
        }, 2);
    }
}