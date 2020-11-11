import list_anim_base from "../../list_anim_base";
import list_view from "../../list_view";

const {ccclass, property} = cc._decorator;

@ccclass
export default class list_anim1 extends list_anim_base {
    /* --------------------------------segmentation-------------------------------- */
    /* *****************private***************** */
    private _list_o: list_view<any>;
    private _item_o: cc.Node;
    private _update_e = list_view.dire.null;
    private _add_top_n = 0;
    private _add_bottom_n = 0;
    private _over_b = false;
    /* *****************组件***************** */
    @property({ displayName: "item", type: cc.Prefab })
    item_o: cc.Prefab = null;
    /* --------------------------------segmentation-------------------------------- */
    start() {
        this._list_o = this.list_o.node.component(list_view);
        this._item_o = cc.instantiate(this.item_o);
    }
    /* -------------------------------delimiter------------------------------- */
    public slide_state(dire_e_: list_view.dire, dist_n_: number, touch_b_: boolean): boolean {
        if (!this._item_o) {
            return;
        }
        if (touch_b_) {
            // ----------------初始化
            if (!this._item_o.parent) {
                this.list_o.content.addChild(this._item_o);
                switch (dire_e_) {
                    case list_view.dire.top: {
                        if (!this._over_b) {
                            this._item_o.setPosition(0, this._item_o.height * 0.5);
                            this._item_o.child("prompt_text").label.string = "下拉刷新";
                        }
                    } break;
                    case list_view.dire.bottom: {
                        this._item_o.setPosition(0, -this.list_o.content.height - this._item_o.height * 0.5);
                        if (!this._over_b) {
                            this._item_o.child("prompt_text").label.string = "上拉刷新";
                        }
                    } break;
                }
            }
            // ----------------更新
            else {
                switch (dire_e_) {
                    case list_view.dire.top: {
                        switch (this._update_e) {
                            case list_view.dire.null: {
                                this._item_o.child("prompt_text").label.string = dist_n_ < this._item_o.height ? "下拉刷新" : "松开刷新";
                            } break;
                            case list_view.dire.top: {
                                this._item_o.y = dist_n_ - this._item_o.height * 0.5;
                            } break;
                        }
                    } break;
                    case list_view.dire.bottom: {
                        switch (this._update_e) {
                            case list_view.dire.null: {
                                if (!this._over_b) {
                                    this._item_o.child("prompt_text").label.string = dist_n_ < this._item_o.height ? "上拉刷新" : "松开刷新";
                                }
                            } break;
                            case list_view.dire.bottom: {
                                this._item_o.y = -this.list_o.content.height - dist_n_ + this._item_o.height * 0.5;
                            } break;
                        }
                    } break;
                }
            }
        } else {
            // ----------------清理
            switch (dire_e_) {
                case list_view.dire.top: {
                    if (this._update_e == list_view.dire.null && dist_n_ > this._item_o.height) {
                        cc.log("正在刷新", dist_n_);
                        this._item_o.child("prompt_text").label.string = "正在刷新";
                        // 更新状态
                        this._update_e = list_view.dire.top;
                        // 更新视图
                        this.list_o.content.layout.paddingTop += this._add_top_n = this._item_o.height;
                        this._list_o.refresh_item();
                        return true;
                    }
                } break;
                case list_view.dire.bottom: {
                    if (!this._over_b && this._update_e == list_view.dire.null && dist_n_ > this._item_o.height) {
                        cc.log("正在获取下一页", dist_n_);
                        this._item_o.child("prompt_text").label.string = "正在获取下一页";
                        // 更新状态
                        this._update_e = list_view.dire.bottom;
                        // 更新视图
                        this.list_o.content.layout.paddingBottom += this._add_bottom_n = this._item_o.height;
                        (<any>this.list_o)._outOfBoundaryAmount.y += this._item_o.height;
                        this._list_o.reset_size();
                        return true;
                    }
                } break;
            }
        }
        return false;
    }
    public finish_notice(type_e_: list_anim_base.finish_type): void {
        if (!this._item_o) {
            return;
        }
        switch (type_e_) {
            case list_anim_base.finish_type.update:
            case list_anim_base.finish_type.reset: {
                this.list_o.content.layout.paddingBottom -= this._add_bottom_n;
                this._add_bottom_n = 0;
                this.list_o.content.layout.paddingTop -= this._add_top_n;
                this._add_top_n = 0;
                this._item_o.removeFromParent();
                this._list_o.refresh_item();
            }
        }
        switch (type_e_) {
            case list_anim_base.finish_type.update: {
                cc.log("更新动画结束");
                this._update_e = list_view.dire.null;
            } break;
            case list_anim_base.finish_type.reset: {
                cc.log("重置动画结束");
                this._update_e = list_view.dire.null;
                this._over_b = false;
            } break;
            case list_anim_base.finish_type.over: {
                if (!this._over_b) {
                    this._over_b = true;
                    this._item_o.child("prompt_text").label.string = "已拉取完成";
                }
            } break;
        }
    }
}