import G6, { Algorithm } from '@antv/g6';

const typeEnum = {
    "string": "[object String]",
    "number": "[object Number]",
    "boolean": "[object Boolean]",
    "undefined": "object Undefined]",
    "null": "object Null]",
    "object": "[object Object]",
    "function": "[object Function]",
    "array": "[object Array]",
    "date": "[object Date]",
    "reg": "[object RegExp]"
};
/**
 * Verify that a value is an array
 * @param {any} obj
 * @returns {boolean}
 * @author chrislee
 * @Time 2020/7/12
 */
const isArray = (obj) => {
    let res;
    if (obj instanceof Array || Object.prototype.toString.call(obj) === typeEnum["array"]) {
        res = true;
    }
    else {
        res = false;
    }
    return res;
};
const isDom = (obj) => {
    let res;
    if (typeof window.HTMLElement === "object") {
        res = obj instanceof window.HTMLElement;
    }
    else {
        res = obj && typeof obj === 'object' && obj.nodeType === 1 && typeof obj.nodeName === 'string';
    }
    return res;
};
const typeValidate = (obj, type, constant = `The value of target`) => {
    let res;
    if (Object.prototype.toString.call(obj) === typeEnum[type]) {
        res = true;
    }
    else {
        let currentType = `undefined`;
        for (const key in typeEnum) {
            if (typeEnum[key] === Object.prototype.toString.call(obj)) {
                currentType = key;
            }
        }
        throw TypeError(`${constant} expect a ${type},but got ${currentType}`);
    }
    return res;
};

/**
 * 校验配置项信息
 * @param cfg 初始化配置项
 * @author chrislee
 * @Time 2020/9/15
 */
const validateConfig = (cfg) => {
    // 必传项验证
    const required = ["container", "direction", "height", "renderer", "width"];
    const isMatchedRequired = Object.keys(cfg).every((key) => required.includes(key));
    // 容器类型验证
    const containerValidate = isDom(cfg["container"]);
    // 布局流向配置验证
    const directionValidate = typeValidate(cfg["direction"], "string") && ["vertical", "horizontal"].includes(cfg["direction"]);
    // 高宽验证
    const heightValidate = typeValidate(cfg["height"], "number");
    const widthValidate = typeValidate(cfg["width"], "number");
    /** 渲染模式验证 */
    const rendererValidate = typeValidate(cfg["renderer"], "string") && ["svg", "canvas"].includes(cfg["renderer"]);
    let allValidate = [isMatchedRequired,
        containerValidate,
        directionValidate,
        heightValidate,
        widthValidate,
        rendererValidate,];
    return allValidate.every(v => v === true);
};

/**
 * 根据排列方向计算下一个节点的推荐坐标
 * @param direction 方向
 * @param node 当前节点
 * @returns {x,y}
 * @author chrislee
 * @Time 2020/9/8
 */
const countNextNodePosition = (direction, node) => {
    const { x, y } = node;
    const result = { x: 0, y: 0 };
    if (direction === "horizontal") {
        result.x = (x !== null && x !== void 0 ? x : 0) + node.size * 4;
        result.y = y !== null && y !== void 0 ? y : 0;
    }
    else {
        result.y = (y !== null && y !== void 0 ? y : 0) + node.size * 4;
        result.x = x !== null && x !== void 0 ? x : 0;
    }
    return result;
};

/**
 * 颜色取反
 * @param OldColorValue 十六进制颜色码
 * @returns color 取反后的十六进制颜色码
 * @author chrislee
 * @Time 2020/9/16
 */
function ColorReverse(OldColorValue) {
    const reverse = `0x${OldColorValue.replace(/#/g, "")}`;
    const str = `000000${(0xffffff - reverse).toString(16)}`;
    return `#${str.substring(str.length - 6, str.length)}`;
}

function nodeRegisterInit(instance, baseConfig) {
    const reNodeColor = ColorReverse(baseConfig["baseNodeColor"]);
    const nodeColor = baseConfig["baseNodeColor"];
    /**
     * 圆角方框型节点注册逻辑
     * @author chrislee
     * @Time 2020/5/10
     */
    instance.registerNode("rect-node", {
        draw(cfg, group) {
            var _a, _b, _c;
            let shape = {};
            const rectWidth = (cfg === null || cfg === void 0 ? void 0 : cfg.size) instanceof Array ? cfg.size[0] : (_a = cfg === null || cfg === void 0 ? void 0 : cfg.size) !== null && _a !== void 0 ? _a : 100;
            const rectHeight = Number(rectWidth) / 2;
            if (group) {
                shape = group.addShape("rect", {
                    attrs: {
                        x: 0,
                        y: 0,
                        width: rectWidth * 2,
                        height: rectHeight * 2,
                        stroke: "#1890FF",
                        fill: nodeColor,
                        lineWidth: 10,
                        radius: 5,
                    },
                    name: "rectNode",
                    draggable: true
                });
                group.addShape("text", {
                    attrs: {
                        x: rectWidth,
                        y: rectHeight,
                        text: cfg === null || cfg === void 0 ? void 0 : cfg.label,
                        fontSize: (_c = (_b = cfg === null || cfg === void 0 ? void 0 : cfg.labelCfg) === null || _b === void 0 ? void 0 : _b.style) === null || _c === void 0 ? void 0 : _c.fontSize,
                        fill: reNodeColor,
                        width: rectWidth,
                        height: rectHeight,
                        textAlign: "center",
                        textBaseline: "middle",
                        lineHeight: rectHeight,
                    },
                    name: "rectNode-text",
                    draggable: true
                });
            }
            return shape;
        },
        // 其他方法
        getAnchorPoints() {
            return [
                [0.5, 0],
                [1, 0.5],
                [0.5, 1],
                [0, 0.5],
            ];
        },
    });
}

function edgeRegisterInit(instance, baseConfig) {
    const edgeColor = baseConfig["baseEdgeColor"];
    /**
     * 条件指向线图形注册逻辑(水平流向)
     * @author chrislee
     * @Time 2020/9/10
     */
    instance.registerEdge("mutex-line-horizontal", {
        draw(cfg, group) {
            var _a, _b, _c;
            let shape = null;
            let startAnchorPoint = null;
            const sourceAnchorIndex = (_b = (_a = cfg) === null || _a === void 0 ? void 0 : _a.sourceAnchor) !== null && _b !== void 0 ? _b : 0;
            if (cfg.sourceNode) {
                startAnchorPoint = cfg.sourceNode._cfg.anchorPointsCache[sourceAnchorIndex];
            }
            const startPoint = startAnchorPoint !== null && startAnchorPoint !== void 0 ? startAnchorPoint : { x: 0, y: 0 };
            const endPoint = (_c = cfg === null || cfg === void 0 ? void 0 : cfg.endPoint) !== null && _c !== void 0 ? _c : { x: 0, y: 0 };
            // const centerPoint: { x: number; y: number } = {
            //     x: (startPoint.x + endPoint.x) / 2,
            //     y: (startPoint.y + endPoint.y) / 2
            // };
            if (group) {
                shape = group.addShape("path", {
                    attrs: {
                        stroke: edgeColor,
                        path: [
                            ["M", startPoint.x, startPoint.y],
                            ["L", startPoint.x, endPoint.y / 3 + (2 / 3) * endPoint.y],
                            ["L", endPoint.x, endPoint.y],
                        ],
                        lineWidth: 10,
                        endArrow: {
                            path: "M 0,0 L -2,1 L 0,0 L -2,-1 L 0,0",
                            fill: edgeColor,
                            stroke: "#666",
                            opacity: 0.8,
                        }
                    },
                    name: "mutexLineHorizontal"
                });
            }
            return shape;
        }
    });
    /**
     * 条件指向线图形注册逻辑(垂直流向)
     * @author chrislee
     * @Time 2020/9/10
     */
    instance.registerEdge("mutex-line-vertical", {
        draw(cfg, group) {
            var _a, _b, _c;
            let shape = null;
            let startAnchorPoint = null;
            const sourceAnchorIndex = (_b = (_a = cfg) === null || _a === void 0 ? void 0 : _a.sourceAnchor) !== null && _b !== void 0 ? _b : 0;
            if (cfg.sourceNode) {
                startAnchorPoint = cfg.sourceNode._cfg.anchorPointsCache[sourceAnchorIndex];
            }
            const startPoint = startAnchorPoint !== null && startAnchorPoint !== void 0 ? startAnchorPoint : { x: 0, y: 0 };
            const endPoint = (_c = cfg === null || cfg === void 0 ? void 0 : cfg.endPoint) !== null && _c !== void 0 ? _c : { x: 0, y: 0 };
            if (group) {
                shape = group.addShape("path", {
                    attrs: {
                        stroke: edgeColor,
                        path: [
                            ["M", startPoint.x, startPoint.y],
                            ["L", startPoint.x * (1 / 3) * startPoint.y, startPoint.y],
                            ["L", endPoint.x, endPoint.y],
                        ],
                        lineWidth: 10,
                        endArrow: {
                            path: "M 0,0 L -2,1 L 0,0 L -2,-1 L 0,0",
                            fill: edgeColor,
                            stroke: "#666",
                            opacity: 0.8,
                        }
                    },
                    name: "mutexLineVertical"
                });
            }
            return shape;
        }
    });
    /**
     * 回流线注册逻辑(水平流向)
     * @author chrislee
     * @Time 2020/9/10
     */
    instance.registerEdge("reback-line-horizontal", {
        draw(cfg, group) {
            var _a, _b, _c, _d, _e, _f;
            let shape = null;
            let startAnchorPoint = null;
            const sourceAnchorIndex = (_b = (_a = cfg) === null || _a === void 0 ? void 0 : _a.sourceAnchor) !== null && _b !== void 0 ? _b : 0;
            if (cfg.sourceNode) {
                startAnchorPoint = cfg.sourceNode._cfg.anchorPointsCache[sourceAnchorIndex];
            }
            const startPoint = startAnchorPoint !== null && startAnchorPoint !== void 0 ? startAnchorPoint : { x: 0, y: 0 };
            const endPoint = (_c = cfg === null || cfg === void 0 ? void 0 : cfg.endPoint) !== null && _c !== void 0 ? _c : { x: 0, y: 0 };
            const sourceNodeSize = (_f = ((_e = (_d = cfg.sourceNode) === null || _d === void 0 ? void 0 : _d._cfg.model) === null || _e === void 0 ? void 0 : _e.size)) !== null && _f !== void 0 ? _f : 200;
            if (group) {
                shape = group.addShape("path", {
                    attrs: {
                        stroke: edgeColor,
                        path: [
                            ["M", startPoint.x, startPoint.y],
                            ["L", startPoint.x, startPoint.y - sourceNodeSize],
                            ["L", endPoint.x, startPoint.y - sourceNodeSize],
                            ["L", endPoint.x, endPoint.y]
                        ],
                        lineWidth: 10,
                        endArrow: {
                            path: "M 0,0 L -2,1 L 0,0 L -2,-1 L 0,0",
                            fill: "#333",
                            stroke: "#666",
                            opacity: 0.8,
                        }
                    },
                    name: "rebackLineHorizontal"
                });
            }
            return shape;
        }
    });
    /**
     * 回流线注册逻辑(垂直流向)
     * @author chrislee
     * @Time 2020/9/10
     */
    instance.registerEdge("reback-line-vertical", {
        draw(cfg, group) {
            var _a, _b, _c, _d, _e, _f;
            let shape = null;
            let startAnchorPoint = null;
            const sourceAnchorIndex = (_b = (_a = cfg) === null || _a === void 0 ? void 0 : _a.sourceAnchor) !== null && _b !== void 0 ? _b : 0;
            if (cfg.sourceNode) {
                startAnchorPoint = cfg.sourceNode._cfg.anchorPointsCache[sourceAnchorIndex];
            }
            const startPoint = startAnchorPoint !== null && startAnchorPoint !== void 0 ? startAnchorPoint : { x: 0, y: 0 };
            const endPoint = (_c = cfg === null || cfg === void 0 ? void 0 : cfg.endPoint) !== null && _c !== void 0 ? _c : { x: 0, y: 0 };
            const sourceNodeSize = (_f = ((_e = (_d = cfg.sourceNode) === null || _d === void 0 ? void 0 : _d._cfg.model) === null || _e === void 0 ? void 0 : _e.size)) !== null && _f !== void 0 ? _f : 200;
            if (group) {
                shape = group.addShape("path", {
                    attrs: {
                        stroke: edgeColor,
                        path: [
                            ["M", startPoint.x, startPoint.y],
                            ["L", startPoint.x - sourceNodeSize, startPoint.y],
                            ["L", startPoint.x - sourceNodeSize, endPoint.y],
                            ["L", endPoint.x, endPoint.y]
                        ],
                        lineWidth: 10,
                        endArrow: {
                            path: "M 0,0 L -2,1 L 0,0 L -2,-1 L 0,0",
                            fill: "#333",
                            stroke: "#666",
                            opacity: 0.8,
                        }
                    },
                    name: "rebackLineVertical"
                });
            }
            return shape;
        }
    });
}

/**
 * 函数防抖
 * @param fn 要进行防抖的函数
 * @param delay 防抖的间隔事件，单位ms
 * @author chrislee
 * @Time 2020/6/24
 */
const debounce = (fn, delay = 500) => {
    let timer = null;
    return function (...args) {
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(() => {
            fn.apply(this, args);
        }, delay);
    };
};

/**
 * 单元素尺寸改变监听器
 * @author chrislee
 * @Time 2020/8/23
 */
class Resizer {
    /**
     * 实例化一个元素尺寸监听器
     * @param id 要监听的目标元素id
     */
    constructor(id) {
        this.ins = null;
        this.isWrongParam = false;
        let target;
        try {
            target = document.getElementById(id);
            if (target) {
                this.dom = target;
            }
            else {
                this.isWrongParam = true;
                throw new Error('the element id is invalid');
            }
        }
        catch (e) {
            this.isWrongParam = true;
            this.dom = document.documentElement;
        }
    }
    /**
     * 初始化操作,验证是否支持ResizeObserver API
     * @author chrislee
     * @Time 2020/9/14
     */
    init() {
        if (this.isWrongParam) {
            throw new Error(`please use a correct element id`);
        }
        if (!window.ResizeObserver) {
            throw new Error(`the browser can not suppose "ResizeObserver",please change or update browser`);
        }
    }
    resizer(fn) {
        const cb = debounce((cfg) => {
            fn(cfg);
        }, 100);
        this.ins = new ResizeObserver((entries) => {
            if (entries.length > 0) {
                cb(entries[0].contentRect);
            }
        });
        this.ins.observe(this.dom, { box: "border-box" });
    }
    off() {
        var _a;
        (_a = this.ins) === null || _a === void 0 ? void 0 : _a.unobserve(this.dom);
    }
}

/**
 * 双端队列生成器
 * size:属性，当前队列长度
 * pop:出列操作，弹出队列尾部元素并返回
 * shift: 弹出队列头部元素并返回
 * unshift: 插入元素到队列头部
 * push:插入元素到队列尾部
 * clear:清空队列
 * getAll:打印队列中所有的元素
 */
class DeQueue {
    constructor() {
        /** 队列大小 */
        this.count = 0;
        /**队列头部元素指针 */
        this.headIndex = 0;
        /** 队列实体 */
        this.queue = {};
        this.init();
    }
    /** 初始化方法 */
    init() {
        this.count = 0;
        this.headIndex = 0;
        this.queue = {};
    }
    /** 推入一个元素到队列尾部 */
    push(item) {
        this.queue[this.count] = item;
        this.count++;
    }
    /** 获取队列的大小 */
    size() {
        return this.count - this.headIndex;
    }
    /** 弹出队列尾部元素 */
    pop() {
        const len = this.size();
        if (len <= 0)
            return undefined;
        const result = this.queue[this.count - 1];
        delete this.queue[this.count - 1];
        this.count--;
        return result;
    }
    /** 弹出队列头部元素 */
    shift() {
        const len = this.size();
        if (len <= 0)
            return undefined;
        const result = this.queue[this.headIndex];
        delete this.queue[this.headIndex];
        this.headIndex++;
        return result;
    }
    /** 插入元素到队列头部 */
    unshift(item) {
        if (this.size() <= 0) {
            this.push(item);
        }
        else {
            if (this.headIndex > 0) {
                // 队首元素指针不为0时
                this.headIndex--;
                this.queue[this.headIndex] = item;
            }
            else {
                // 队首元素指针为0，我们需要将将队列里的0号key空出来，其他数据整体向后移动一位。
                for (let i = this.count; i > 0; i--) {
                    this.queue[i] = this.queue[i - 1];
                }
                // 队列长度自增
                this.count++;
                // 队首元素设为0
                this.headIndex = 0;
                // 为队首的0号key添加当前元素
                this.queue[0] = item;
            }
        }
    }
    /** 清空队列 */
    clear() {
        this.init();
    }
    /** 打印队列内部所有元素 */
    getAll() {
        const result = [];
        for (let i = this.headIndex; i < this.count; i++) {
            result.push(this.queue[i]);
        }
        console.log(result);
    }
}

/**
 * cl-flow核心逻辑
 * @author chrislee
 * @Time 2020/9/15
 */
class ClFlowCore {
    constructor(config) {
        var _a, _b;
        /** G6图形底层实例 */
        this.instance = G6;
        /** 图实例对象 */
        this.graph = null;
        /** 元素监听器 */
        this.resizer = null;
        /** 撤销对象双端队列 */
        this.undoDeQueue = null;
        /** 恢复对象双端队列 */
        this.redoDeQueue = null;
        /** 最大可恢复步数 */
        this.maxStep = 0;
        /** 用于记录没有父节点的起始节点*/
        this.freeNodes = [];
        /** 事件注册存储器 */
        this.events = [];
        /** 储存正在移动的节点图形关键信息（用于在撤销/恢复中模拟轨迹还原） */
        this.movingNode = null;
        const validate = validateConfig(config);
        if (validate) {
            this.config = config;
            this.config["baseEdgeColor"] = (_a = this.config.baseEdgeColor) !== null && _a !== void 0 ? _a : "#000A34";
            this.config["baseNodeColor"] = (_b = this.config.baseNodeColor) !== null && _b !== void 0 ? _b : "#FFFFFF";
        }
        else {
            throw new Error("please check the config type");
        }
        nodeRegisterInit(G6, this.config);
        edgeRegisterInit(G6, this.config);
        this.initEventProxy();
    }
    /**
     * 初始化一个流程图
     * @param data 图数据
     * @author chrislee
     * @Time 2020/9/15
     */
    init(data) {
        var _a, _b, _c, _d, _e, _f;
        let minimap = null;
        if (this.config.minimap) {
            const checkKey = Object.keys(this.config.minimap).includes("size") && Object.keys(this.config.minimap).includes("className");
            if (checkKey && (isArray(this.config.minimap.size) || typeof this.config.minimap.size === "number")) {
                minimap = new G6.Minimap({
                    size: (_a = this.config.minimap.size) !== null && _a !== void 0 ? _a : [100, 100],
                    className: (_b = this.config.minimap.className) !== null && _b !== void 0 ? _b : "",
                    type: "delegate"
                });
            }
        }
        const graph = new G6.Graph({
            container: this.config["container"],
            width: this.config["width"],
            height: this.config["height"],
            animate: true,
            enabledStack: true,
            modes: {
                default: ["drag-canvas", "zoom-canvas", "drag-node", "click-select"],
                focus: ["drag-canvas"]
            },
            layout: {
                type: "dagre",
                rankdir: this.config.direction === "horizontal" ? "LR" : "TB",
                align: "UL",
                controlPoints: true,
                workerEnabled: true
            },
            fitView: (_c = this.config.fitview) !== null && _c !== void 0 ? _c : false,
            defaultNode: Object.assign({ type: "node", size: 200, labelCfg: {
                    style: {
                        fill: ColorReverse(this.config.baseNodeColor),
                        fontSize: 10,
                    },
                }, style: {
                    stroke: "#72CC4A",
                    fill: this.config.baseNodeColor,
                    width: 200,
                } }, (_d = this.config.defaultNode) !== null && _d !== void 0 ? _d : {}),
            // 要支持dom自定义图形，必须使用svg来渲染，虽然性能没有canvas好，但是，本身工作流不涉及复杂的交互
            renderer: "svg",
            nodeStateStyles: Object.assign({ selected: {
                    stroke: "#666",
                    lineWidth: 2,
                    fill: "lightBlue",
                }, default: {
                    size: 200,
                    fill: this.config.baseNodeColor,
                    stroke: "#72CC4A",
                    width: 200,
                } }, (_e = this.config.nodeStateStyles) !== null && _e !== void 0 ? _e : {}),
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
            plugins: this.config.minimap ? [minimap] : []
        });
        graph.data(Object.assign({}, data));
        graph.render();
        this.graph = graph;
        this.config.fitview && this.registerResizer(this.config.container, graph);
        this.createDequeue((_f = this.config.backStep) !== null && _f !== void 0 ? _f : 0);
        this.registeEvent();
        return this;
    }
    /**
     * 检测是否存在graph对象(是否已初始化)
     * @author chrislee
     * @Time 2020/9/16
     */
    checkGraph() {
        if (this.graph === null) {
            throw new Error(`please run method "init()" first!`);
        }
        else {
            return this.graph;
        }
    }
    /**
     * 注册一个检测dom元素的size变化监听器
     * @param dom 目标dom
     * @param graph 图实例
     * @author chrislee
     * @Time 2020/9/15
     */
    registerResizer(dom, graph) {
        let id = dom.id;
        const resizer = new Resizer(id);
        resizer.init();
        resizer.resizer((rect) => {
            graph.changeSize(rect.width, rect.height);
        });
        this.resizer = resizer;
    }
    /**
     * 创建双端队列用于记忆可恢复/撤销的状态快照
     * @param steps 最大恢复步数
     * @returns {void}
     * @author chrislee
     * @Time 2020/9/15
     */
    createDequeue(steps) {
        if (steps <= 0)
            return;
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
    enterUndoQueue(item) {
        if (this.redoDeQueue === null)
            return;
        this.redoDeQueue.push(item);
        let size = this.redoDeQueue.size();
        while (size > this.maxStep) {
            this.redoDeQueue.shift();
            size = this.redoDeQueue.size();
        }
    }
    /**
     * 清空恢复队列
     * @author chrislee
     * @Time 2020/9/15
     */
    cleanRedoQueue() {
        if (this.redoDeQueue === null)
            return;
        this.redoDeQueue.clear();
    }
    /**
     * 使用proxy初始化一个事件存储器，自动过滤重复类型的事件
     * @author chrislee
     * @Time 2020/9/18
     */
    initEventProxy() {
        this.events = new Proxy([], {
            set(target, key, value) {
                if (key !== "length") {
                    let eventIdx = target.findIndex(event => event.type === value.type);
                    if (eventIdx === -1) {
                        target.push(value);
                    }
                    else {
                        target[eventIdx] = value;
                    }
                    return true;
                }
                else {
                    return Reflect.set(target, key, Object.keys(target).length);
                }
            }
        });
    }
    /**
     * 注册所有event储存器里的事件(对于节点拖拽移动事件，内置记录轨迹状态逻辑)
     * @author chrislee
     * @Time 2020/9/18
     */
    registeEvent() {
        const graph = this.checkGraph();
        const len = this.events.length;
        for (let i = 0; i < len; i++) {
            graph.on(this.events[i].type, (evt) => {
                var _a, _b, _c;
                if (this.events[i].type === "node:dragstart") {
                    this.movingNode = { x: evt.x, y: evt.y, id: (_c = (_b = (_a = evt === null || evt === void 0 ? void 0 : evt.item) === null || _a === void 0 ? void 0 : _a._cfg) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : null };
                    if (this.movingNode.id === null) {
                        return;
                    }
                }
                if (this.events[i].type === "node:dragend") {
                    const moveTarget = evt.item._cfg.model;
                    if (this.movingNode && moveTarget.id === this.movingNode.id) {
                        const nodeData = graph.findById(moveTarget.id).getModel();
                        this.enterUndoQueue({
                            action: "update",
                            payload: {
                                before: { nodeData: Object.assign(Object.assign({}, nodeData), { x: this.movingNode.x, y: this.movingNode.y }) },
                                after: { nodeData: Object.assign({}, nodeData) }
                            }
                        });
                        this.cleanRedoQueue();
                        this.movingNode = null;
                    }
                }
                this.events[i].fn(evt);
            });
        }
    }
    /**
     * 创建一个新节点
     * @param info 节点信息
     * @author chrislee
     * @Time 2020/9/15
     */
    createNode(info) {
        var _a, _b, _c, _d, _e, _f, _g;
        const graph = this.checkGraph();
        const nodeData = {
            id: info.id,
            x: (_a = info.x) !== null && _a !== void 0 ? _a : 100,
            y: (_b = info.y) !== null && _b !== void 0 ? _b : 100,
            size: (_c = info.size) !== null && _c !== void 0 ? _c : 100,
            anchorPoints: (_d = info.anchorPoints) !== null && _d !== void 0 ? _d : [[0.5, 0], [1, 0.5], [0.5, 1], [0, 0.5]],
            type: (_e = info.type) !== null && _e !== void 0 ? _e : "node",
            extra: (_f = info.extra) !== null && _f !== void 0 ? _f : {},
            style: info.style,
            label: (_g = info.label) !== null && _g !== void 0 ? _g : "",
        };
        try {
            graph.addItem("node", nodeData);
            this.freeNodes.includes(info.id) === false && this.freeNodes.push(info.id);
            this.enterUndoQueue({ action: "create", payload: { nodeData } });
            this.cleanRedoQueue();
        }
        catch (e) {
            console.error(e);
        }
    }
    /**
     * 以一个节点为基础生成指向另一个节点的关系
     * @param source 起始节点
     * @param target 目标节点
     * @param type 生成单节点还是条件节点 single=>单节点| multi=>条件节点
     */
    addRelation(source, target, type) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u;
        const graph = this.checkGraph();
        const direction = this.config.direction;
        const { nodes, edges } = (_a = this.graph) === null || _a === void 0 ? void 0 : _a.save();
        const targetId = (_b = target.id) !== null && _b !== void 0 ? _b : `node${((_c = nodes === null || nodes === void 0 ? void 0 : nodes.length) !== null && _c !== void 0 ? _c : 0) + 1}`;
        // 计算下一个节点在指定的流向布局中应该绘制的坐标
        const position = countNextNodePosition(direction, source);
        // 对于添加单个点来说，创建一个指向只需要新增一个节点和一条从当前节点指向它的边即可
        const nodeData = {
            id: targetId,
            label: (_d = target.label) !== null && _d !== void 0 ? _d : "",
            type: (_e = target.type) !== null && _e !== void 0 ? _e : "node",
            style: (_f = target.style) !== null && _f !== void 0 ? _f : {},
            x: position.x,
            y: position.y,
            size: (_g = target.size) !== null && _g !== void 0 ? _g : 100,
            labelCfg: { style: { fontSize: Number(((_h = target.size) !== null && _h !== void 0 ? _h : 100) / 5) } },
        };
        const edgeData = {
            id: `edge${((_j = edges === null || edges === void 0 ? void 0 : edges.length) !== null && _j !== void 0 ? _j : 0) + 1}`,
            source: source.id,
            target: targetId
        };
        try {
            graph.addItem("node", nodeData);
            graph.addItem("edge", edgeData);
        }
        catch (e) {
            console.error(e);
        }
        // 创建一次快照
        let snapshot = { action: "addRelation", payload: { source: source, target: nodeData, edge: edgeData } };
        // 对于创建条件分支节点来说（比如网关等流程），那么就需要在以上的情况下，再衍生出两条指向和两个点形成分支的关系
        if (type === "multi") {
            const sourceAnchor = direction === "horizontal" ? [0, 2] : [1, 3];
            const targetAnchor = direction === "horizontal" ? 3 : 0;
            const childPositon = countNextNodePosition(direction, nodeData);
            const onNode = {
                id: target.id ? target.id + "1" : `node${((_k = nodes === null || nodes === void 0 ? void 0 : nodes.length) !== null && _k !== void 0 ? _k : 0) + 2}`,
                label: target.label ? target.label + "1" : "",
                type: "node",
                style: {},
                size: (_l = target.size) !== null && _l !== void 0 ? _l : 100,
                labelCfg: { style: { fontSize: Number(((_m = target.size) !== null && _m !== void 0 ? _m : 100) / 5) } },
                x: direction === "horizontal" ? childPositon.x : childPositon.x + 200,
                y: direction === "horizontal" ? childPositon.y - 200 : childPositon.y
            };
            const offNode = {
                id: target.id ? target.id + "2" : `node${((_o = nodes === null || nodes === void 0 ? void 0 : nodes.length) !== null && _o !== void 0 ? _o : 0) + 3}`,
                label: target.label ? target.label + "2" : "",
                type: "node",
                style: {},
                size: (_p = target.size) !== null && _p !== void 0 ? _p : 100,
                labelCfg: { style: { fontSize: Number(((_q = target.size) !== null && _q !== void 0 ? _q : 100) / 5) } },
                x: direction === "horizontal" ? childPositon.x : childPositon.x - 200,
                y: direction === "horizontal" ? childPositon.y + 200 : childPositon.y
            };
            const onEdge = {
                id: `edge${((_r = edges === null || edges === void 0 ? void 0 : edges.length) !== null && _r !== void 0 ? _r : 0) + 2}`,
                source: targetId,
                type: `mutex-line-${direction}`,
                target: target.id ? target.id + "1" : `node${((_s = nodes === null || nodes === void 0 ? void 0 : nodes.length) !== null && _s !== void 0 ? _s : 0) + 2}`,
                sourceAnchor: sourceAnchor[0],
                targetAnchor
            };
            const offEdge = {
                id: target.id ? target.id + "2" : `node${((_t = nodes === null || nodes === void 0 ? void 0 : nodes.length) !== null && _t !== void 0 ? _t : 0) + 3}`,
                source: targetId,
                type: `mutex-line-${direction}`,
                target: `node${((_u = nodes === null || nodes === void 0 ? void 0 : nodes.length) !== null && _u !== void 0 ? _u : 0) + 3}`,
                sourceAnchor: sourceAnchor[1],
                targetAnchor
            };
            try {
                graph.addItem("node", onNode);
                graph.addItem("node", offNode);
                graph.addItem("edge", onEdge);
                graph.addItem("edge", offEdge);
                snapshot = {
                    action: "multiNode",
                    payload: {
                        source: source,
                        target: nodeData,
                        edge: edgeData,
                        multiInfo: {
                            onNode,
                            onEdge,
                            offNode,
                            offEdge
                        }
                    }
                };
            }
            catch (e) {
                console.error(e);
            }
        }
        this.enterUndoQueue(snapshot);
        this.cleanRedoQueue();
    }
    /**
     * 更新一个节点的信息，包括移动、业务信息、节点形态等变换
     * @param nodeData 节点信息
     * @author chrislee
     * @Time 2020/9/16
     */
    updateNode(nodeData) {
        const graph = this.checkGraph();
        let originNodeData = Object.assign({}, graph.findById(nodeData.id).getModel());
        try {
            graph.updateItem("node", nodeData);
        }
        catch (e) {
            console.error(e);
        }
        this.enterUndoQueue({
            action: "update",
            payload: {
                before: { nodeData: originNodeData },
                after: { nodeData }
            }
        });
        this.cleanRedoQueue();
    }
    /**
     * 删除一个节点
     * @param id 节点的id
     * @author chrislee
     * @Time 2020/09/16
     */
    deleteNode(id) {
        const graph = this.checkGraph();
        let originNodeData = graph.findById(id).getModel();
        try {
            graph.removeItem(id);
            this.enterUndoQueue({
                action: "delete",
                payload: {
                    nodeData: originNodeData
                }
            });
            this.cleanRedoQueue();
        }
        catch (e) {
            console.error(e);
        }
    }
    /**
     * 添加一组回流关系(调用前请确保通过getRebackNodes获取可以创建回流的节点列表)
     * @param sourceId 源头节点id
     * @param targetId 目标节点id
     * @author chrislee
     * @Time 2020/9/16
     */
    addReback(sourceId, targetId) {
        var _a, _b;
        const graph = this.checkGraph();
        const { direction } = this.config;
        const { edges } = graph.save();
        const sourceNode = graph.findById(sourceId).getModel();
        const targetNode = graph.findById(targetId).getModel();
        if (!sourceNode || !targetNode)
            throw new Error(`The node id is invalid`);
        // 理论上每次更新一个节点的回流关系，都要先移除他上一次建立的关系
        const lastRebackNode = (_a = sourceNode.reback) !== null && _a !== void 0 ? _a : null;
        if (lastRebackNode) {
            const targetEdge = edges === null || edges === void 0 ? void 0 : edges.find((edge) => {
                return edge.source === sourceId && edge.target === lastRebackNode.id;
            });
            if (targetEdge) {
                graph.remove(targetEdge.id);
            }
        }
        const anchor = direction === "horizontal" ? 0 : 3;
        const edgeData = {
            id: `edge${((_b = edges === null || edges === void 0 ? void 0 : edges.length) !== null && _b !== void 0 ? _b : 0) + 1}`,
            type: `reback-line-${direction}`,
            source: sourceId,
            target: targetId,
            sourceAnchor: anchor,
            targetAnchor: anchor
        };
        graph.addItem("edge", edgeData);
        graph.updateItem(sourceId, Object.assign(Object.assign({}, sourceNode), { reback: { id: targetId } }));
        this.enterUndoQueue({
            action: "addReback",
            payload: {
                edge: edgeData,
                source: Object.assign(Object.assign({}, sourceNode), { reback: { id: targetId } })
            }
        });
        this.cleanRedoQueue();
    }
    /**
     * 查找目标节点可创建回流关系的可用节点
     * @param id 查找目标id
     * @returns {array} 返回所有可用的节点信息
     * @author chrislee
     * @Time 2020/9/16
     */
    getRebackNodes(id) {
        if (this.freeNodes.includes(id))
            return [];
        const graph = this.checkGraph();
        const { findAllPath } = Algorithm;
        // 查找所有
        const allPaths = this.freeNodes.map(nodeId => {
            return findAllPath(graph, nodeId, id, true);
        }).filter(path => path.length > 0);
        const result = [];
        allPaths.forEach(path => {
            for (let i = 0; i < path.length; i++) {
                if (path[i] !== id) {
                    let node = graph.findById(path[i]);
                    result.push(node);
                }
            }
        });
        return result;
    }
    /**
     * 获取最大可撤回步数
     * @author chrislee
     * @Time 2020/9/21
     */
    getUndoSteps() {
        var _a, _b;
        return (_b = (_a = this.undoDeQueue) === null || _a === void 0 ? void 0 : _a.size()) !== null && _b !== void 0 ? _b : 0;
    }
    /**
     * 获取最大可恢复步数
     * @author chrislee
     * @Time 2020/9/21
     */
    getRedoSteps() {
        var _a, _b;
        return (_b = (_a = this.redoDeQueue) === null || _a === void 0 ? void 0 : _a.size()) !== null && _b !== void 0 ? _b : 0;
    }
    /**
     * 清除流程图画布内容
     * @author chrislee
     * @Time 2020/9/18
     */
    clean() {
        const graph = this.checkGraph();
        const { nodes, edges } = graph.save();
        this.enterUndoQueue({
            action: "clear",
            payload: {
                graph: Object.assign(Object.assign({}, nodes), edges)
            }
        });
        graph.clear();
        this.cleanRedoQueue();
    }
    /**
     * 销毁graph实例
     * @author chrislee
     * @Time 2020/9/18
     */
    destory() {
        const graph = this.checkGraph();
        graph.destroy();
        this.graph = null;
    }
    /**
     * 绑定事件（实际上会在初始化graph实例后就马上进行绑定），意味着应该在初始化前就定义好
     * @param eventType 事件类型
     * @param fn 具体执行逻辑
     * @author chrislee
     * @Time 2020/9/18
     */
    bindEvent(eventType, fn) {
        this.events.push({ type: eventType, fn });
    }
    /**
    * 执行撤销操作(核心逻辑是给每个操作打上tag和那一次用到得数据载荷，进行靶向回溯而不是全量更新节点树)
    * @author chrislee
    * @Time 2020/9/18
    */
    undo() {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        if (this.undoDeQueue === null)
            return;
        const graph = this.checkGraph();
        const snapshot = this.undoDeQueue.pop();
        if (!snapshot)
            return;
        let resloveSuccess = true;
        switch (snapshot.action) {
            case "create":
                const createNode = snapshot.payload.nodeData;
                try {
                    graph.removeItem(createNode.id);
                }
                catch (e) {
                    console.error(e);
                    resloveSuccess = false;
                }
                break;
            case "delete":
                const deleteNode = snapshot.payload.nodeData;
                const nodeData = {
                    id: deleteNode.id,
                    x: (_a = deleteNode.x) !== null && _a !== void 0 ? _a : 100,
                    y: (_b = deleteNode.y) !== null && _b !== void 0 ? _b : 100,
                    size: (_c = deleteNode.size) !== null && _c !== void 0 ? _c : 100,
                    anchorPoints: (_d = deleteNode.anchorPoints) !== null && _d !== void 0 ? _d : [[0.5, 0], [1, 0.5], [0.5, 1], [0, 0.5]],
                    type: (_e = deleteNode.type) !== null && _e !== void 0 ? _e : "node",
                    extra: (_f = deleteNode.extra) !== null && _f !== void 0 ? _f : {},
                    style: deleteNode.style,
                    label: (_g = deleteNode.label) !== null && _g !== void 0 ? _g : "",
                };
                try {
                    graph.addItem("node", nodeData);
                }
                catch (e) {
                    console.error(e);
                    resloveSuccess = false;
                }
                break;
            case "update":
                const beforeNode = snapshot.payload.before.nodeData;
                graph.updateItem(beforeNode.id, beforeNode);
                break;
            case "multiNode":
                const multiNodeTarget = snapshot.payload.target;
                const multiNodeEdge = snapshot.payload.edge;
                const multiInfo = snapshot.payload.multiInfo;
                try {
                    graph.removeItem(multiNodeTarget.id);
                    graph.removeItem(multiNodeEdge.id);
                    graph.removeItem(multiInfo.onNode.id);
                    graph.removeItem(multiInfo.onEdge.id);
                    graph.removeItem(multiInfo.offNode.id);
                    graph.removeItem(multiInfo.offEdge.id);
                }
                catch (e) {
                    console.error(e);
                    resloveSuccess = false;
                }
                break;
            case "clear":
                const originGraphData = snapshot.payload.graph;
                try {
                    graph.changeData(originGraphData);
                }
                catch (e) {
                    console.error(e);
                    resloveSuccess = false;
                }
                break;
            case "addReback":
                const rebackEdge = snapshot.payload.edge;
                const source = snapshot.payload.source;
                try {
                    graph.updateItem(source.id, Object.assign(Object.assign({}, source), { reback: null }));
                    graph.removeItem(rebackEdge.id);
                }
                catch (e) {
                    console.error(e);
                    resloveSuccess = false;
                }
                break;
            case "addRelation":
                const relationTarget = snapshot.payload.target;
                const relationEdge = snapshot.payload.edge;
                try {
                    graph.removeItem(relationEdge.id);
                    graph.removeItem(relationTarget.id);
                }
                catch (e) {
                    console.error(e);
                    resloveSuccess = false;
                }
                break;
            default:
                return;
        }
        if (resloveSuccess) {
            (_h = this.redoDeQueue) === null || _h === void 0 ? void 0 : _h.push(snapshot);
        }
    }
    /**
     * 执行恢复操作
     * @author chrislee
     * @Time 2020/9/18
     */
    redo() {
        if (this.redoDeQueue === null)
            return;
        const graph = this.checkGraph();
        const snapshot = this.redoDeQueue.pop();
        if (!snapshot)
            return;
        let resloveSuccess = true;
        switch (snapshot.action) {
            case "create":
                const createNode = snapshot.payload.nodeData;
                try {
                    graph.addItem("node", createNode);
                }
                catch (e) {
                    console.error(e);
                    resloveSuccess = false;
                }
                break;
            case "delete":
                const deleteNode = snapshot.payload.nodeData;
                try {
                    graph.removeItem(deleteNode.id);
                }
                catch (e) {
                    console.error(e);
                    resloveSuccess = false;
                }
                break;
            case "update":
                const updateNode = snapshot.payload.after.nodeData;
                try {
                    graph.updateItem(updateNode.id, updateNode);
                }
                catch (e) {
                    console.error(e);
                    resloveSuccess = false;
                }
                break;
            case "clear":
                graph.clear();
                break;
            case "multiNode":
                const multiTargetNode = snapshot.payload.target;
                const multiEdge = snapshot.payload.edge;
                try {
                    graph.addItem("node", multiTargetNode);
                    graph.addItem("edge", multiEdge);
                    graph.addItem("node", snapshot.payload.multiInfo.onNode);
                    graph.addItem("node", snapshot.payload.multiInfo.offNode);
                    graph.addItem("edge", snapshot.payload.multiInfo.onEdge);
                    graph.addItem("edge", snapshot.payload.multiInfo.offEdge);
                }
                catch (e) {
                    console.error(e);
                    resloveSuccess = false;
                }
                break;
            case "addReback":
                const rebackSource = snapshot.payload.source;
                const rebackEdge = snapshot.payload.edge;
                const targetId = rebackEdge.target;
                try {
                    graph.updateItem(rebackSource.id, Object.assign(Object.assign({}, rebackSource), { reback: { id: targetId } }));
                    graph.addItem("edge", rebackEdge);
                }
                catch (e) {
                    console.error(e);
                    resloveSuccess = false;
                }
                break;
            case "addRelation":
                const relationTarget = snapshot.payload.target;
                const relationEdge = snapshot.payload.edge;
                try {
                    graph.addItem("node", relationTarget);
                    graph.addItem("edge", relationEdge);
                }
                catch (e) {
                    console.error(e);
                    resloveSuccess = false;
                }
                break;
            default:
                return;
        }
        if (resloveSuccess) {
            this.enterUndoQueue(snapshot);
        }
    }
}

export default ClFlowCore;
//# sourceMappingURL=bundle.esm.js.map
