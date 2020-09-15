import G6, { Graph } from "@antv/g6";
import { GraphData } from "@antv/g6/lib/types";
import MiniMap from "@antv/g6/lib/plugins/minimap";
import {validateConfig} from "./validate";
import {countNextNodePosition} from "./computed";

import {isArray} from "../utils";
import {Resizer} from "../utils/ResizeObserver";
import {DeQueue} from "../utils/DeQueue";

interface ClFlowClass {
    instance:typeof G6;
    init(data:GraphData):ClFlowClass;
    createNode(cfg:nodeInfo):void;
    addRelation(source:nodeInfo,target:nodeInfo,type:"single"|"multi"):void;
    updateNode(cfg:any):void;
    deleteNode(id:string):void;
    addReback(cfg):void;
    bindEvent(eventType:eventType,fn:(item:any)=>void);
    redo():void;
    undo():void;
    clean():void;
    destory():void;
}



export interface ClConfig{
    /**
     * 容器元素
     */
    container:HTMLElement;
    /** 画布宽度 */
    width: number;
    /** 画布高度 */
    height: number;
    /** 缩略图配置项 */
    minimap?:{
        size:[number,number]|number,
        className:string,
    };
    /** 布局方向: "vertical"=>垂直|"horizontal"=>水平*/
    direction:directionType;
    /** 是否开启画布自适应容器功能(有一定性能损耗)，默认关闭 */
    fitview?:boolean;
    /** 默认的节点样式(非必传) */
    defaultNode?:{
        /** 节点类型 */
        type:string;
        /** 节点大小 */
        size:number;
        labelCfg:{
            style:{
                fill:string;
                fontSize:number
            }
        };
        style:{
            stroke:string;
            fill:string;
            width:number
        }
    };
    /** 默认的节点各种状态下的样式(非必传) */
    nodeStateStyles?:{
        selected?:{
            stroke:string;
            fill:string;
        }
    };
    /** 最大记忆操作数（撤销/恢复的最大步数） */
    backStep?:number;
    /** 渲染模式，svg|canvas （只有svg才支持自定义dom图形，但性能上canvas最好） */
    renderer:"svg"|"canvas"
}

/**
 * cl-flow核心逻辑
 * @author chrislee
 * @Time 2020/9/15
 */
class ClFlowCore implements ClFlowClass {
    instance:typeof G6 = G6;
    private graph:Graph|null = null;
    private config:ClConfig ;
    private resizer:Resizer|null = null;
    private undoDeQueue:DeQueue|null = null;
    private redoDeQueue:DeQueue|null = null;
    private maxStep:number = 0;
    constructor(config:ClConfig){
        const validate:boolean = validateConfig(config);
        if(validate){
            this.config = config
        }else{
            throw new Error("please check the config type");
        }
    }

    /**
     * 初始化一个流程图
     * @param data 图数据
     * @author chrislee
     * @Time 2020/9/15
     */
    init(data:GraphData){
        let minimap:MiniMap|null = null;
        if(this.config.minimap){
            const checkKey = Object.keys(this.config.minimap).includes("size")&&Object.keys(this.config.minimap).includes("className");
            if(checkKey&&(isArray(this.config.minimap.size)||typeof this.config.minimap.size ==="number")){
                minimap = new G6.Minimap({
                    size:this.config.minimap.size??[100,100],
                    className:this.config.minimap.className??"",
                    type:"delegate"
                })
            }
        }
        const graph = new G6.Graph({
            container: this.config["container"],
            width: this.config["width"],
            height: this.config["height"],
            animate:true,
            enabledStack: true,
            modes: {
                default: ["drag-canvas", "zoom-canvas", "drag-node", "click-select"],
                focus: ["drag-canvas"]
            },
            layout: {
                type: "dagre",
                rankdir: this.config.direction==="horizontal"?"LR":"TB",
                align: "UL",
                controlPoints: true,
                workerEnabled: true
            },
            fitView: this.config.fitview??false,
            defaultNode: {
                type: "node",
                size: 200,
                labelCfg: {
                    style: {
                        fill: "#0000A6",
                        fontSize: 10,
                    },
                },
                style: {
                    stroke: "#72CC4A",
                    fill: "#1890FF",
                    width: 200,
                },
                ...this.config.defaultNode??{}
            },
            // 要支持dom自定义图形，必须使用svg来渲染，虽然性能没有canvas好，但是，本身工作流不涉及复杂的交互
            renderer: "svg",
            nodeStateStyles: {
                selected: {
                    stroke: "#666",
                    lineWidth: 2,
                    fill: "lightBlue",
                },
                default: {
                    size: 200,
                    fill: "#1890FF",
                    stroke: "#72CC4A",
                    width: 200,
                },
                ...this.config.nodeStateStyles??{}
            },
            defaultEdge: {
                type: "line",
                labelCfg: {
                    style: {
                        fontSize: 20,
                    },
                },
                style: {
                    stroke: "#F6BD16",
                    radius: 10,
                    lineWidth: 10,
                    endArrow: {
                        path: "M 0,0 L -2,1 L 0,0 L -2,-1 L 0,0",
                        fill: "#333",
                        stroke: "#666",
                    }
                },
            },
            plugins: this.config.minimap?[minimap]:[]
        });
        graph.data({...data});
        graph.render();
        this.graph = graph;
        this.config.fitview&&this.registerResizer(this.config.container,graph);
        this.createDequeue(this.config.backStep??0)
        return this
    }

    /**
     * 注册一个检测dom元素的size变化监听器
     * @param dom 目标dom
     * @param graph 图实例
     * @author chrislee
     * @Time 2020/9/15
     */
    private registerResizer(dom:HTMLElement,graph:Graph){
        let id = dom.id;
        const resizer = new Resizer(id);
        resizer.init();
        resizer.resizer((rect)=>{
            graph.changeSize(rect.width,rect.height)
        })
        this.resizer = resizer;
    }

    /**
     * 创建双端队列用于记忆可恢复/撤销的状态快照
     * @param steps 最大恢复步数
     * @returns {void}
     * @author chrislee
     * @Time 2020/9/15
     */
    private createDequeue(steps:number){
        if(steps<=0) return;
        this.maxStep = steps;
        this.undoDeQueue = new DeQueue();
        this.redoDeQueue = new DeQueue();
    }

    /**
     * 推入一个快照到撤销队列尾部，并根据最大步数维持长度
     * @param item 操作快照对象
     * @author chrislee
     * @Time 2020/9/15
     */
    private enterUndoQueue(item:snapshot){
        if(this.redoDeQueue===null) return
        this.redoDeQueue.push(item);
        let size = this.redoDeQueue.size();
        while(size>this.maxStep){
            this.redoDeQueue.shift();
            size = this.redoDeQueue.size()
        }
    }

    /**
     * 清空恢复队列
     * @author chrislee
     * @Time 2020/9/15
     */
    private cleanRedoQueue(){
        if(this.redoDeQueue===null) return
        this.redoDeQueue.clear()
    }

    /**
     * 创建一个新节点
     * @param info 节点信息
     * @author chrislee
     * @Time 2020/9/15
     */
    createNode(info:nodeInfo){
        const nodeData = {
            id:info.id,
            x:info.x??100,
            y:info.y??100,
            size:info.size??100,
            anchorPoints:info.anchorPoints??[[0.5,0],[1,0.5],[0.5,1],[0,0.5]],
            type:info.type??"node",
            extra:info.extra??{},
            style:info.style,
            label:info.label??"",
        }
        try{
            this.graph?.addItem("node",nodeData);
            this.enterUndoQueue({action:"create",payload:nodeData});
            this.cleanRedoQueue()
        }catch(e){
            console.error(e);
        }
    }

    /**
     * 以一个节点为基础生成指向另一个节点的关系
     * @param source 起始节点
     * @param target 目标节点
     * @param type 生成单节点还是条件节点 single=>单节点| multi=>条件节点
     */
    addRelation(source:nodeInfo,target:nodeInfo,type:"single"|"multi"){
        const direction = this.config.direction;
        const {nodes,edges} = this.graph?.save()  as GraphData
        const nodeType = source.type;
        const position = countNextNodePosition(direction, source);
        const nodeData = {
            id:target.id??`node${(nodes?.length ?? 0) + 1}`,
            label:target.label??"",
            type:target.type??"node",
            x:position.x,
            y:position.y,
            size:target.size??100,
            labelCfg: { style: { fontSize: Number((target.size??100) / 5) }},
        }
        const edgeData = {
            id: `edge${(edges?.length ?? 0) + 1}`,
            source: source.id,
            target: target.id??`node${(nodes?.length ?? 0) + 1}`
        }
        try{
            this.graph?.addItem("node",nodeData);
            this.graph?.addItem("edge",edgeData);
        }catch(e){
            console.error(e)
        }
        if(type === "multi"){
            
        }
        this.enterUndoQueue({action:"addRelation",payload:{source:source,target:nodeData,edge:edgeData}});
        this.cleanRedoQueue()

    }

    updateNode
    deleteNode
    addReback
    bindEvent
    redo
    undo
    clean
    destory
}