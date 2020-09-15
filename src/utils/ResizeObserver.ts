import {debounce} from "./Debounce"
interface ResizeObserverType {
    dom:HTMLElement,
    init():void,
    resizer(fn:(cfg:ResizeObserverEntry["contentRect"])=>void):void,
    off():void
}
type callback = (rect:ResizeObserverEntry["contentRect"])=>void
/**
 * 单元素尺寸改变监听器
 * @author chrislee
 * @Time 2020/8/23
 */
export class Resizer implements ResizeObserverType{
    dom:HTMLElement;
    private ins:ResizeObserver|null = null;
    private isWrongParam:boolean = false
    /**
     * 实例化一个元素尺寸监听器
     * @param id 要监听的目标元素id
     */
    constructor(id:string){
        let target:HTMLElement|null;
        try{
            target = document.getElementById(id);
            if(target){
                this.dom = target;
            }else{
                this.isWrongParam = true
                throw new Error('the element id is invalid')
            }
        }catch(e){
            this.isWrongParam = true
            this.dom = document.documentElement
        }
    }
    /**
     * 初始化操作,验证是否支持ResizeObserver API
     * @author chrislee
     * @Time 2020/9/14
     */
    init(){
        if(this.isWrongParam){
            throw new Error(`please use a correct element id`)
        }
        if(!window.ResizeObserver){
            throw new Error(`the browser can not suppose "ResizeObserver",please change or update browser`)
        }
    }
    resizer(fn:callback){
        const cb = debounce((cfg:ResizeObserverEntry["contentRect"])=>{
            fn(cfg)
        },100)
        this.ins = new ResizeObserver((entries)=>{
            if(entries.length > 0){
                cb(entries[0].contentRect)
            }
        });
        this.ins.observe(this.dom,{box:"border-box"})
    }
    off(){
        this.ins?.unobserve(this.dom)
    }
}