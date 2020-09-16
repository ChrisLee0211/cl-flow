import G6 from "@antv/g6";
import { IShape } from '@antv/g-canvas/lib/interfaces';
import { ClConfig } from "src/core";
import { ColorReverse } from "src/utils/ColorReverse";

export function nodeRegisterInit(instance: typeof G6,baseConfig:ClConfig):void{

    const reNodeColor = ColorReverse(baseConfig["baseNodeColor"] as string);
    const nodeColor = baseConfig["baseNodeColor"];
    /**
     * 圆角方框型节点注册逻辑
     * @author chrislee
     * @Time 2020/5/10
     */
    instance.registerNode("rect-node", {
        draw(cfg, group) {
            let shape: IShape = {} as any;
            const rectWidth: number = cfg?.size instanceof Array ? cfg.size[0] : cfg?.size ?? 100;
            const rectHeight: number = Number(rectWidth) / 2;
            if (group) {
                shape = group.addShape("rect", {
                    attrs: {
                        x: 0,
                        y: 0,
                        width: rectWidth * 2,
                        height: rectHeight * 2,
                        stroke: "#1890FF",
                        fill:nodeColor,
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
                        text: cfg?.label,
                        fontSize: cfg?.labelCfg?.style?.fontSize,
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
                [0.5, 0], // 顶部中间
                [1, 0.5], // 右侧中间
                [0.5, 1], // 底部中间
                [0, 0.5], // 左侧中间
            ];
        },
    });
}