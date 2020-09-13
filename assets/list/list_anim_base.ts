import list_view from "./list_view";

const {ccclass, property} = cc._decorator;

/**item基类 */
@ccclass
export abstract class list_anim_base extends cc.Component {
    // @property({ displayName: "列表", type: list_view })
    // protected list: list_view<T> = null;
    @property({ displayName: "列表", type: cc.ScrollView })
    protected list_o: cc.ScrollView = null;
    /* -------------------------------delimiter------------------------------- */
    /**滑动状态(返回true通知更新) */
    public abstract slide_state(dire_e_: list_view.dire, dist_n_: number, touch_b_: boolean): boolean;
    /**完成通知 */
    public abstract finish_notice(type_e_: list_anim_base.finish_type): void;
}

export module list_anim_base {
    /**完成类型 */
    export enum finish_type {
        reset,
        update,
        over,
    }
}

export default list_anim_base;