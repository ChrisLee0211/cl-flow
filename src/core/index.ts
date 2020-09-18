import G6, { Graph,Algorithm } from "@antv/g6";
import { GraphData, NodeConfig, EdgeConfig } from "@antv/g6/lib/types";
import MiniMap from "@antv/g6/lib/plugins/minimap";
import {validateConfig} from "./validate";
import {countNextNodePosition} from "./computed";
import {nodeRegisterInit,edgeRegisterInit} from "./g6Config";

import {isArray} from "../utils";
import {Resizer} from "../utils/ResizeObserver";
import {DeQueue} from "../utils/DeQueue";
import { ColorReverse } from "src/utils/ColorReverse";

interface ClFlowClass {
    instance:typeof G6;
    init(data:GraphData):ClFlowClass;
    createNode(cfg:nodeInfo):void;
    addRelation(source:nodeInfo,target:nodeInfo,type:"single"|"multi"):void;
    updateNode(cfg:any):void;
    deleteNode(id:string):void;
    addReback(sourceId:string,targetId:string):void;
    getRebackNodes(id:string):Array<any>
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
    /** 节点和边的基础颜色,必须要是16进制颜色码，因为内部有颜色翻转的逻辑 */
    baseNodeColor?:string;
    baseEdgeColor?:string;
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
    /** 用于记录没有父节点的起始节点*/
    private freeNodes:string[] = [];
    constructor(config:ClConfig){
        const validate:boolean = validateConfig(config);
        if(validate){
            this.config = config;
            this.config["baseEdgeColor"] = this.config.baseEdgeColor??"#000A34";
            this.config["baseNodeColor"] = this.config.baseNodeColor??"#FFFFFF";
        }else{
            throw new Error("please check the config type");
        };
        nodeRegisterInit(G6,this.config);
        edgeRegisterInit(G6,this.config);
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
                        fill: ColorReverse(this.config.baseNodeColor as string),
                        fontSize: 10,
                    },
                },
                style: {
                    stroke: "#72CC4A",
                    fill: this.config.baseNodeColor,
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
                    fill: this.config.baseNodeColor,
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
                    stroke: this.config.baseEdgeColor,
                    radius: 10,
                    lineWidth: 10,
                    endArrow: {
                        path: "M 0,0 L -2,1 L 0,0 L -2,-1 L 0,0",
                        fill: this.config.baseEdgeColor,
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
     * 检测是否存在graph对象(是否已初始化)
     * @author chrislee
     * @Time 2020/9/16
     */
    private checkGraph(){
        if(this.graph===null){
            throw new Error(`please run method "init()" first!`)
        }else{
            return this.graph
        }
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
        const graph = this.checkGraph()
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
            graph.addItem("node",nodeData);
            this.freeNodes.includes(info.id)===false && this.freeNodes.push(info.id);
            this.enterUndoQueue({action:"create",payload:{nodeData}});
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
        const graph = this.checkGraph();
        const direction = this.config.direction;
        const {nodes,edges} = this.graph?.save()  as GraphData
        const targetId:string = target.id??`node${(nodes?.length ?? 0) + 1}`;
        // 计算下一个节点在指定的流向布局中应该绘制的坐标
        const position = countNextNodePosition(direction, source);
        // 对于添加单个点来说，创建一个指向只需要新增一个节点和一条从当前节点指向它的边即可
        const nodeData = {
            id:targetId,
            label:target.label??"",
            type:target.type??"node",
            style:target.style??{},
            x:position.x,
            y:position.y,
            size:target.size??100,
            labelCfg: { style: { fontSize: Number((target.size??100) / 5) }},
        }
        const edgeData = {
            id: `edge${(edges?.length ?? 0) + 1}`,
            source: source.id,
            target: targetId
        }
        try{
            graph.addItem("node",nodeData);
            graph.addItem("edge",edgeData);
        }catch(e){
            console.error(e)
        }
        // 创建一次快照
        let snapshot:snapshot = {action:"addRelation",payload:{source:source,target:nodeData,edge:edgeData}};
        // 对于创建条件分支节点来说（比如网关等流程），那么就需要在以上的情况下，再衍生出两条指向和两个点形成分支的关系
        if(type === "multi"){
            const sourceAnchor: number[] = direction === "horizontal" ? [0, 2] : [1, 3];
            const targetAnchor: number = direction === "horizontal" ? 3 : 0;
            const childPositon = countNextNodePosition(direction, nodeData);
            const onNode = {
                id: target.id?target.id+"1":`node${(nodes?.length ?? 0) + 2}`,
                label: target.label ? target.label+"1" : "",
                type: "node",
                style:{},
                size: target.size??100,
                labelCfg: { style: { fontSize: Number((target.size??100) / 5) }},
                x: direction === "horizontal" ? childPositon.x : childPositon.x + 200,
                y: direction === "horizontal" ? childPositon.y - 200 : childPositon.y
            };
            const offNode = {
                id: target.id?target.id+"2":`node${(nodes?.length ?? 0) + 3}`,
                label: target.label ? target.label+"2" : "",
                type: "node",
                style:{},
                size: target.size??100,
                labelCfg: { style: { fontSize: Number((target.size??100)  / 5) }},
                x: direction === "horizontal" ? childPositon.x : childPositon.x - 200,
                y: direction === "horizontal" ? childPositon.y + 200 : childPositon.y
            };
            const onEdge = {
                id: `edge${(edges?.length ?? 0) + 2}`,
                source: targetId,
                type: `mutex-line-${direction}`,
                target: target.id?target.id+"1":`node${(nodes?.length ?? 0) + 2}`,
                sourceAnchor: sourceAnchor[0],
                targetAnchor
            };
            const offEdge = {
                id: target.id?target.id+"2":`node${(nodes?.length ?? 0) + 3}`,
                source: targetId,
                type: `mutex-line-${direction}`,
                target: `node${(nodes?.length ?? 0) + 3}`,
                sourceAnchor: sourceAnchor[1],
                targetAnchor
            };
            try{
                graph.addItem("node", onNode);
                graph.addItem("node", offNode);
                graph.addItem("edge", onEdge);
                graph.addItem("edge", offEdge);
                snapshot = {
                    action:"multiNode",
                    payload:{
                        source:source,
                        target:nodeData,
                        edge:edgeData,
                        multiInfo:{
                            onNode,
                            onEdge,
                            offNode,
                            offEdge
                        }
                    }
                }
            }catch(e){
                console.error(e)
            }
        }
        this.enterUndoQueue(snapshot)
        this.cleanRedoQueue()
    }

    /**
     * 更新一个节点的信息，包括移动、业务信息、节点形态等变换
     * @param nodeData 节点信息
     * @author chrislee
     * @Time 2020/9/16
     */
    updateNode(nodeData:nodeInfo){
        const graph = this.checkGraph();
        let originNodeData = graph.findById(nodeData.id).getModel() as NodeConfig;
        try{
            graph.updateItem("node",nodeData as NodeConfig)
        }catch(e){
            console.error(e)
        }
        this.enterUndoQueue({
            action:"update",
            payload:{
                before:{nodeData:(originNodeData as nodeInfo)},
                after:{nodeData}
            }
        });
        this.cleanRedoQueue()
    }

    /**
     * 删除一个节点
     * @param id 节点的id
     * @author chrislee
     * @Time 2020/09/16
     */
    deleteNode(id:string){
        const graph = this.checkGraph();
        let originNodeData = graph.findById(id).getModel() as NodeConfig;
        try{
            graph.removeItem(id);
            this.enterUndoQueue({
                action:"delete",
                payload:{
                    nodeData:originNodeData as nodeInfo
                }
            });
        }catch(e){
            console.error(e)
        }
    }

    /**
     * 添加一组回流关系(调用前请确保通过getRebackNodes获取可以创建回流的节点列表)
     * @param sourceId 源头节点id
     * @param targetId 目标节点id
     * @author chrislee
     * @Time 2020/9/16
     */
    addReback(sourceId:string,targetId:string){
        const graph = this.checkGraph();
        const {direction} = this.config;
        const {edges} = graph.save() as GraphData;
        const sourceNode = graph.findById(sourceId).getModel() as NodeConfig;
        const targetNode = graph.findById(targetId).getModel() as NodeConfig;
        if(!sourceNode||!targetNode) throw new Error(`The node id is invalid`)
        // 理论上每次更新一个节点的回流关系，都要先移除他上一次建立的关系
        const lastRebackNode = (sourceNode as nodeInfo).reback??null;
        if (lastRebackNode) {
            const targetEdge = edges?.find((edge) => {
                return edge.source === sourceId && edge.target === lastRebackNode.id
            });
            if (targetEdge) {
                graph.remove(targetEdge.id as string);
            }
        }
        const anchor = direction === "horizontal" ? 0 : 3;
        const edgeData: EdgeConfig = {
            id: `edge${(edges?.length ?? 0) + 1}`,
            type: `reback-line-${direction}`,
            source: sourceId,
            target: targetId,
            sourceAnchor: anchor,
            targetAnchor: anchor
        };
        graph.addItem("edge", edgeData);
        graph.updateItem(sourceId,{...sourceNode,...{reback:{id:targetId}}});
        this.enterUndoQueue({
            action:"addReback",
            payload:{
                edge:edgeData
            }
        })
    }

    
    /**
     * 查找目标节点可创建回流关系的可用节点
     * @param id 查找目标id
     * @returns {array} 返回所有可用的节点信息
     * @author chrislee
     * @Time 2020/9/16
     */
    getRebackNodes(id):Array<any>{
        if(this.freeNodes.includes(id)) return []
        const graph = this.checkGraph();
        const {findAllPath} = Algorithm;
        // 查找所有
        const allPaths = this.freeNodes.map(nodeId => {
            return findAllPath(graph,nodeId,id,true)
        }).filter(path => path.length>0);
        const result:Array<any> = [];
        allPaths.forEach(path => {
            for(let i=0;i<path.length;i++){
                if(path[i]!==id){
                    let node = graph.findById(path[i]);
                    result.push(node)
                }
            }
        });
        return result
    }

    bindEvent
    redo
    undo
    clean
    destory
}