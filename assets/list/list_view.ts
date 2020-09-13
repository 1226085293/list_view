import item_base from "./item_base";
import list_anim_base from "./list_anim_base";

const {ccclass, property} = cc._decorator;

module _list_view {
    export enum state {
        /**空闲 */
        idle,
        /**重置中 */
        reset,
        /**更新中 */
        update,
    }
}

/**列表组件 */
@ccclass
export class list_view<T> extends cc.Component {
    /* --------------------------------segmentation-------------------------------- */
    /* *****************private***************** */
    private _view_o: cc.Node = null;
    private _content_o: cc.Node = null;
    private _pool_o = new cc.NodePool;
    /**当前状态 */
    private _state_e = _list_view.state.idle;
    /**上次超过边界状态 */
    private _last_exceed_bs: boolean[] = [];
    /**上次滑动坐标 */
    private _last_pos_o = new cc.Vec2;
    /**item首尾间隔 */
    private _interval_n: number;
    /**item列表 */
    private _item_os: cc.Node[] = [];
    /* *****************public***************** */
    /**列表数据 */
    public data_as: T[] = [];
    /* *****************组件***************** */
    @property({ displayName: "item", type: cc.Prefab })
    item_o: cc.Prefab = null;
    @property({ displayName: "请求重置数据事件", type: cc.Component.EventHandler })
    request_reset_o: cc.Component.EventHandler = null;
    @property({ displayName: "请求下页数据事件", type: cc.Component.EventHandler })
    request_next_o: cc.Component.EventHandler = null;
    @property({ displayName: "列表动画", type: list_anim_base })
    anim_o: list_anim_base = null;
    /* --------------------------------segmentation-------------------------------- */
    onLoad() {
        // ------------------初始化数据
        this._content_o = this.node.scroll_view.content;
        this._view_o = this._content_o.parent;
        this._content_o.getPosition(this._last_pos_o);
        this._content_o.layout.enabled = false;
        // ------------------触控监听
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, ()=> {
            this._update_state(false);
        }, this);
        this.node.on(cc.Node.EventType.TOUCH_END, ()=> {
            this._update_state(false);
        }, this);
        // ------------------滑动监听
        this.node.on("scrolling", this._event_slide, this);
        this.node.on("scroll-ended", this._event_slide_end, this);
        // ------------------绑定数据
        const self = this;
        const array = this.data_as;
        (<any>this.data_as).__proto__ = class customize<T> extends Array { 
            set(new_as: any[]): any {
                super.splice(0);
                super.push(...new_as);
                // ------------------更新列表
                self.reset_data();
                self.state_e = _list_view.state.idle;
                // ------------------更新状态
                self.anim_o && self.anim_o.finish_notice(list_anim_base.finish_type.reset);
                cc.log("重置完成");
            }
            push(...v_as: any[]): any {
                if (!v_as.length) {
                    return;
                }
                let result_n = super.push(...v_as);
                // ------------------更新列表
                self.refresh_data();
                self.state_e = _list_view.state.idle;
                // ------------------更新状态
                self.anim_o && self.anim_o.finish_notice(list_anim_base.finish_type.update);
                cc.log("更新完成");
                return result_n;
            }
            pop(): any {
                let result_a = super.pop();
                // ------------------更新列表
                self.refresh_data();
                return result_a;
            }
            unshift(...v_as: any[]): any {
                if (!v_as.length) {
                    return;
                }
                let result_n = super.unshift(...v_as);
                // ------------------更新列表
                self.refresh_data();
                self.state_e = _list_view.state.idle;
                // ------------------更新状态
                self.anim_o && self.anim_o.finish_notice(list_anim_base.finish_type.update);
                cc.log("更新完成");
                return result_n;
            }
            shift(): any {
                let result_a = super.shift();
                // ------------------更新列表
                self.refresh_data();
                return result_a;
            }
            splice(start_n: number, count_n?: number): T[];
            splice(start_n: number, count_n?: number, ...item_as: any[]): any {
                let result_as = super.splice(start_n, count_n, ...item_as);
                // ------------------更新列表
                self.refresh_data();
                return result_as;
            }
            sort(compare_f_?: (a_a: T, b_a: T) => number): any {
                let result_o = super.sort(compare_f_);
                // ------------------更新列表
                self.refresh_data();
                return result_o;
            }
        }.prototype;
        Object.defineProperty(this, "data_as", {
            get: function () {
                return array;
            },
            set: (function (new_a: any) {
                if (array !== new_a) {
                    array["set"](new_a);
                }
            }).bind(this),
        });
    }
    onDestroy() {
        delete this.data_as;
    }
    /* --------------------------------segmentation-------------------------------- */
    /* *****************功能函数***************** */
    /**更新列表大小 */
    public reset_size(): void {
        if (!this.node.scroll_view.horizontal && this.node.scroll_view.vertical) {
            // content高度 = paddingTop + data_n * (item高度 + spacingY) - spacingY + paddingBottom;
            let temp1_n = this._content_o.y;
            this._content_o.height = this._content_o.layout.paddingTop + this._content_o.layout.paddingBottom + this.data_as.length * (this.item_o.data.height + this._content_o.layout.spacingY) - this._content_o.layout.spacingY;
            this._content_o.y = temp1_n;
            // 更新item首尾间隔
            this._interval_n = this._item_os.length * (this.item_o.data.height + this._content_o.layout.spacingY);
        }
    }
    /**刷新item */
    public refresh_item(): void {
        // ------------------准备参数
        let temp1_n: number;
        let temp1_o: cc.Node, temp2_o: item_base<T>;
        // ------------------计算生成数量
        let generate_n = 1;
        if (!this.node.scroll_view.horizontal && this.node.scroll_view.vertical) {
            // 删除节点后新增节点
            // generate_n += Math.ceil((this._view_o.height - (this._content_o.layout.paddingTop + this._content_o.layout.paddingBottom) + this._content_o.layout.spacingY) / (this.item_o.data.height + this._content_o.layout.spacingY));
            generate_n += Math.ceil((this._view_o.height + this._content_o.layout.spacingY) / (this.item_o.data.height + this._content_o.layout.spacingY));
        }
        if (generate_n > this.data_as.length) {
            generate_n = this.data_as.length;
        }
        // ------------------删除节点
        if (generate_n < this._item_os.length) {
            temp1_n = this._item_os.length - generate_n;
            for (let k1_n = 0; k1_n < temp1_n; ++k1_n) {
                temp1_o = this._item_os.pop();
                this._pool_o.put(temp1_o);
                temp1_o.removeFromParent();
            }
        }
        // ------------------新增节点
        else if (generate_n > this._item_os.length) {
            temp1_n = generate_n - this._item_os.length;
            for (let k1_n = 0; k1_n < temp1_n; ++k1_n) {
                temp1_o = (this._pool_o.size() ? this._pool_o.get() : cc.instantiate(this.item_o));
                this._item_os.push(temp1_o);
                this._content_o.addChild(temp1_o);
            }
        }
        // ------------------重置item数据
        this._item_os.forEach((v1_o, k1_n)=> {
            // 更新数据
            temp2_o = v1_o.component(item_base);
            if (temp2_o.index_n < 0) {
                temp2_o.index_n = k1_n;
            }
            // 更新坐标
            temp2_o.refresh(this.data_as[temp2_o.index_n]);
            v1_o.y = -this._content_o.layout.paddingTop - temp2_o.index_n * this.item_o.data.height - temp2_o.index_n * this._content_o.layout.spacingY - this.item_o.data.height * 0.5;
        });
        this.reset_size();
    }
    /**刷新数据 */
    public refresh_data(): void {
        this.refresh_item();
        this._event_slide();
    }
    /**重置数据 */
    public reset_data(): void {
        // ------------------准备参数
        let temp1_o: item_base<any>;
        // ------------------重置列表状态
        this.node.scroll_view.stopAutoScroll();
        this._content_o.setPosition(0, this._view_o.height * 0.5);
        // ------------------更新数据下标
        this._item_os.forEach((v1_o, k1_n)=> {
            temp1_o = v1_o.component(item_base);
            temp1_o.index_n = k1_n;
        });
        this.refresh_item();
    }
    /* *****************自定义事件***************** */
    /**滑动 */
    private _event_slide(): void {
        const self = this;
        let temp1_n: number;
        let temp1_o: item_base<any>;
        if (!this.node.scroll_view.horizontal && this.node.scroll_view.vertical) {
            let top_n = this._content_o.y - this._view_o.height * 0.5;
            let bottom_n = this._content_o.y + this._view_o.height * 0.5;
            // 向上滑动
            if (this._last_pos_o.y > this._content_o.y) {
                // ------------------更新item
                this._item_os.forEach(node_o=> {
                    if (node_o.y + node_o.height * 0.5 < -bottom_n) {
                        if (((temp1_n = node_o.y + self._interval_n) + self._content_o.layout.paddingTop) < 0) {
                            // 数据更新
                            temp1_o = node_o.component(item_base);
                            temp1_o.index_n -= self._item_os.length;
                            temp1_o.refresh(self.data_as[temp1_o.index_n]);
                            // 坐标更新
                            node_o.y = temp1_n;
                        }
                    }
                });
            }
            // 向下滑动
            else {
                // ------------------更新item
                this._item_os.forEach(node_o=> {
                    if (node_o.y - node_o.height * 0.5 > -top_n) {
                        if (((temp1_n = node_o.y - self._interval_n) - self._content_o.layout.paddingBottom) > -self._content_o.height) {
                            // 数据更新
                            temp1_o = node_o.component(item_base);
                            if (temp1_o.index_n + self._item_os.length < self.data_as.length) {
                                temp1_o.index_n += self._item_os.length;
                                temp1_o.refresh(self.data_as[temp1_o.index_n]);
                            }
                            // 坐标更新
                            node_o.y = temp1_n;
                        }
                    }
                });
            }
            this._update_state(true);
            // cc.log(this._last_pos_o.y > this._content_o.y ? "向上滑动" : "向下滑动");
            this._content_o.getPosition(this._last_pos_o);
        }
    }
    /**滑动结束 */
    private _event_slide_end(): void {
        let top_n = this._content_o.y - this._view_o.height * 0.5;
        let bottom_n = this._content_o.y + this._view_o.height * 0.5;
        this._last_exceed_bs[list_view.dire.top] = Number(Math.abs(top_n).toFixed(1)) < 0;
        this._last_exceed_bs[list_view.dire.bottom] = Number((bottom_n - this._content_o.height).toFixed(1)) > 0;
    }
    /**更新当前状态 */
    private _update_state(touch_b_: boolean): void {
        let temp1_b: boolean;
        if (!this.node.scroll_view.horizontal && this.node.scroll_view.vertical) {
            let top_n = this._view_o.height * 0.5 - this._content_o.y;
            let bottom_n = this._content_o.y + this._view_o.height * 0.5 - this._content_o.height;
            // ------------------更新当前状态
            temp1_b = false;
            if (this.request_reset_o && top_n > 0) {
                if (this.anim_o) {
                    if (this.anim_o.slide_state(list_view.dire.top,  top_n, touch_b_) && (!touch_b_ || (touch_b_ && !this._last_exceed_bs[list_view.dire.top]))) {
                        temp1_b = true;
                    }
                } else if (!touch_b_ || (touch_b_ && !this._last_exceed_bs[list_view.dire.top])) {
                    temp1_b = true;
                }
            }
            // cc.log(this._last_pos_o.y, this._content_o.y);
            if (this.anim_o) {
                // 更新上次超出状态
                this._last_exceed_bs[list_view.dire.top] = top_n > 0;
                if (temp1_b) {
                    // cc.log("重置");
                    this.state_e = _list_view.state.reset;
                }
            } else if (this._last_pos_o.y > this._content_o.y) {
                // 更新上次超出状态
                this._last_exceed_bs[list_view.dire.top] = top_n > 0;
                if (temp1_b) {
                    // cc.log("重置");
                    this.state_e = _list_view.state.reset;
                }
            }
            temp1_b = false;
            if (this.request_next_o && bottom_n > 0) {
                if (this.anim_o) {
                    if (this.anim_o.slide_state(list_view.dire.bottom,  bottom_n, touch_b_) && (!touch_b_ || (touch_b_ && !this._last_exceed_bs[list_view.dire.bottom]))) {
                        temp1_b = true;
                    }
                } else if (!touch_b_ || (touch_b_ && !this._last_exceed_bs[list_view.dire.bottom])) {
                    temp1_b = true;
                }
            }
            if (this._last_pos_o.y <= this._content_o.y) {
                // 更新上次超出状态
                this._last_exceed_bs[list_view.dire.bottom] = bottom_n > 0;
                if (temp1_b) {
                    // cc.log("下一页");
                    this.state_e = _list_view.state.update;
                }
            }
        }
    }
    /* *****************读/写重载***************** */
    private get state_e() { return this._state_e; }
    private set state_e(v_e_) {
        if (this._state_e == _list_view.state.idle) {
            switch (v_e_) {
                case _list_view.state.reset: {
                    cc.log("请求重置");
                    this._state_e = v_e_;
                    this.request_reset_o && this.request_reset_o.emit(null);
                } break;
                case _list_view.state.update: {
                    cc.log("请求下页");
                    this._state_e = v_e_;
                    this.request_next_o && this.request_next_o.emit(null);
                } break;
            }
        } else {
            this._state_e = v_e_;
        }
    }
    public set over(v_b_: boolean) {
        v_b_ && this.anim_o.finish_notice(list_anim_base.finish_type.over);
    }
}

export module list_view {
    export enum dire {
        null,
        top,
        bottom,
        left,
        right,
    }
}

export default list_view;