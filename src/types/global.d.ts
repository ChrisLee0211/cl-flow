declare interface Window {
        ResizeObserver:ResizeObserver
    }

//监听器回调函数中的参数类型，自带元素本身(target)与对应的只读位置、大小信息(contentRect)
interface ResizeObserverEntry {
    target: HTMLElement | null;
    contentRect: ResizeObserverEntry["target"] extends null? null : DOMRectReadOnly
}
// 监听器构造函数所需要传入的回调函数
type EntriesFuntion = (entries:Array<ResizeObserverEntry>)=>void;
/**
 * 元素大小、位置变化监听器
 */
declare class ResizeObserver {
    /**
     * 元素大小、位置变化监听器
     * @param entriesFn 关于挂载到监听器的回调函数
     * @returns {Observer} 返回一个监听器对象
     */
    constructor(entriesFn:EntriesFuntion);
    /**
     * 执行目标元素的监听
     * @param target 要执行监听的目标元素
     * @param options 可选像，设置元素的盒子模型，默认为content-box
     * @returns {void}
     */
    observe(target:HTMLElement|null,options?:{box:'border-box'|"content-box"}):void;

    /**
     * 取消目标元素的监听
     * @param target 要取消执行监听的目标元素
     * @returns {void}
     */
    unobserve(target:HTMLElement|null):void

    /**
     * 取消所有元素监听
     */
    disconnect():void
}

interface nodeInfo {
    /** 节点的id，必须唯一 */
    id:string;
    /** 节点类型 */
    type?:string;
    /** 节点的横纵坐标，不传时默认画布左上角 */
    x?:number;
    y?:number;
    /** 节点大小，默认100 */
    size?:number;
    /** 连接点的坐标（锚点） */
    anchorPoints?:Array<[number,number]>
    /** 节点中的内容 */
    label?:string;
    /** 节点的样式,属性基本和svg标签一样 */
    style:{
        [key:string]:any
    };
    /** 节点存储的额外业务信息 */
    extra?:{
        [key:string]:any
    }
}

interface edgeInfo {
    /** edge唯一id */
    id:string,
    /** 起始节点id */
    source:string,
    /** 目标节点id */
    target:string,
    /** 指向线条的类型 */
    type?:string,
    /** 起始节点的锚点 */
    sourceAnchor?:number,
    /** 目标节点的锚点 */
    targetAnchor?:number,
}

type directionType = "vertical" | "horizontal";
type eventType = "node:click" | 
"node:dblclick" | 
"node:mouseover" | 
"node:mouseleave" | 
"node:contextmenu" | 
"node:dragstart" |
"node:dragend" | 
"node:drop"
type snapshot = createAction|addRelationAction|multiNodeAction|updateAction|deleteAction|clearAction

type createAction = {
    action:"create",
    payload:{
        nodeData:nodeInfo
    }
}

type addRelationAction = {
    action:"addRelation",
    payload:{
        source:nodeInfo,
        target:nodeInfo,
        edge:edgeInfo
    }
}

type multiNodeAction = {
    action:"multiNode",
    payload:{
        source:nodeInfo,
        target:nodeInfo,
        edge:edgeInfo,
        multiInfo:{
            onNode:nodeInfo,
            onEdge:edgeInfo,
            offNode:nodeInfo,
            offEdge:edgeInfo
        }
    }
}

type updateAction = {
    action: "update",
    payload:{
        before:{nodeData:nodeInfo},
        after:{nodeData:nodeInfo}
    }
}

type deleteAction = {
    action: "delete",
    payload:{
        nodeData:nodeInfo
    }
}

type clearAction = {
    action: "clear",
    payload:{
        graph:any
    }
}