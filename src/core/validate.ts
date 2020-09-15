import {ClConfig} from "./index";
import {typeValidate, isDom} from "../utils/index";

type minimapType = {size:[number,number]|number,className:string}

/**
 * 校验配置项信息
 * @param cfg 初始化配置项
 * @author chrislee
 * @Time 2020/9/15
 */
export const validateConfig = (cfg:ClConfig):boolean => {
    // 必传项验证
    const required:Array<string> = ["container","direction","height","renderer","width"];
    const isMatchedRequired:boolean = Object.keys(cfg).every((key) => required.includes(key));
    // 容器类型验证
    const containerValidate:boolean = isDom(cfg["container"]);
    // 布局流向配置验证
    const directionValidate = typeValidate(cfg["direction"],"string") && ["vertical","horizontal"].includes(cfg["direction"]);
    // 高宽验证
    const heightValidate:boolean = typeValidate(cfg["height"],"number");
    const widthValidate:boolean = typeValidate(cfg["width"],"number");
    /** 渲染模式验证 */
    const rendererValidate = typeValidate(cfg["renderer"],"string") && ["svg","canvas"].includes(cfg["renderer"]);
    let allValidate = [isMatchedRequired,
        containerValidate,
        directionValidate,
        heightValidate,
        widthValidate,
        rendererValidate,]
    return allValidate.every(v=>v===true)
}