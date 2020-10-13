import G6 from "@antv/g6";
import { IShape } from '@antv/g-canvas/lib/interfaces';
import { ModelConfig, EdgeConfig } from "@antv/g6/lib/types";
import { ClConfig } from "src/core";
import {ColorReverse} from "../utils/ColorReverse";

export function edgeRegisterInit(instance:typeof G6,baseConfig:ClConfig):void{

    const edgeColor = baseConfig["baseEdgeColor"]
    /**
     * 条件指向线图形注册逻辑(水平流向)
     * @author chrislee
     * @Time 2020/9/10
     */
    instance.registerEdge("mutex-line-horizontal", {
        draw(cfg, group) {
            let shape: IShape = null as any;
            let startAnchorPoint: {x: number;y: number;index: number} | null = null;
            const sourceAnchorIndex: number = ((cfg as ModelConfig)?.sourceAnchor as number) ?? 0;
            if ((cfg as any).sourceNode) {
                startAnchorPoint = (cfg as any).sourceNode._cfg.anchorPointsCache[sourceAnchorIndex];
            }
            const startPoint = startAnchorPoint ?? { x: 0, y: 0 };
            const endPoint = cfg?.endPoint ?? { x: 0, y: 0 };
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
            let shape: IShape = null as any;
            let startAnchorPoint: {x: number;y: number;index: number} | null = null;
            const sourceAnchorIndex: number = ((cfg as ModelConfig)?.sourceAnchor as number) ?? 0;
            if ((cfg as any).sourceNode) {
                startAnchorPoint = (cfg as any).sourceNode._cfg.anchorPointsCache[sourceAnchorIndex];
            }
            const startPoint = startAnchorPoint ?? { x: 0, y: 0 };
            const endPoint = cfg?.endPoint ?? { x: 0, y: 0 };
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
            let shape: IShape = null as any;
            let startAnchorPoint: {x: number;y: number;index: number} | null = null;
            const sourceAnchorIndex: number = ((cfg as ModelConfig)?.sourceAnchor as number) ?? 0;
            if ((cfg as any).sourceNode) {
                startAnchorPoint = (cfg as any).sourceNode._cfg.anchorPointsCache[sourceAnchorIndex];
            }
            const startPoint = startAnchorPoint ?? { x: 0, y: 0 };
            const endPoint = cfg?.endPoint ?? { x: 0, y: 0 };
            const sourceNodeSize = ((cfg as EdgeConfig).sourceNode?._cfg.model?.size) ?? 200;
            const path = sourceAnchorIndex === 2 ? [
                ["M", startPoint.x, startPoint.y],
                ["L", startPoint.x, startPoint.y + (sourceNodeSize as number)],
                ["L", endPoint.x, startPoint.y + (sourceNodeSize as number)],
                ["L", endPoint.x, endPoint.y]
            ] : [
                    ["M", startPoint.x, startPoint.y],
                    ["L", startPoint.x, startPoint.y - (sourceNodeSize as number)],
                    ["L", endPoint.x, startPoint.y - (sourceNodeSize as number)],
                    ["L", endPoint.x, endPoint.y]
                ]
            if (group) {
                shape = group.addShape("path", {
                    attrs: {
                        stroke: edgeColor,
                        path:path,
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
            let shape: IShape = null as any;
            let startAnchorPoint: {x: number;y: number;index: number} | null = null;
            const sourceAnchorIndex: number = ((cfg as ModelConfig)?.sourceAnchor as number) ?? 0;
            if ((cfg as any).sourceNode) {
                startAnchorPoint = (cfg as any).sourceNode._cfg.anchorPointsCache[sourceAnchorIndex];
            }
            const startPoint = startAnchorPoint ?? { x: 0, y: 0 };
            const endPoint = cfg?.endPoint ?? { x: 0, y: 0 };
            const sourceNodeSize = ((cfg as EdgeConfig).sourceNode?._cfg.model?.size) ?? 200;
            const path = sourceAnchorIndex === 1 ? [
                ["M", startPoint.x, startPoint.y],
                ["L", startPoint.x + (sourceNodeSize as number), startPoint.y],
                ["L", startPoint.x + (sourceNodeSize as number), endPoint.y],
                ["L", endPoint.x, endPoint.y]
            ] : [
                    ["M", startPoint.x, startPoint.y],
                    ["L", startPoint.x - (sourceNodeSize as number), startPoint.y],
                    ["L", startPoint.x - (sourceNodeSize as number), endPoint.y],
                    ["L", endPoint.x, endPoint.y]
                ]
            if (group) {
                shape = group.addShape("path", {
                    attrs: {
                        stroke: edgeColor,
                        path: path,
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