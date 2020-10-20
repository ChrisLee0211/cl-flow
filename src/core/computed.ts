/**
 * 根据排列方向计算下一个节点的推荐坐标
 * @param direction 方向
 * @param node 当前节点
 * @returns {x,y}
 * @author chrislee
 * @Time 2020/9/8
 */
export const countNextNodePosition = (direction: directionType, node: nodeInfo): { x: number; y: number } => {
    const { x, y } = node;
    const result = { x: 0, y: 0 };
    if (direction === "horizontal") {
        result.x = (x ?? 0) + (node.size as number) * 4;
        result.y = y ?? 0;
    } else {
        result.y = (y ?? 0) + (node.size as number) * 4;
        result.x = x ?? 0;
    }
    return result;
};

/**
 * 根据布局流向和两个点的相对位置计算锚点（用于回流防粘连）
 * @param direction 方向
 * @param source 当前节点
 * @param target 目标节点
 * @returns {number} 锚点索引
 * @author chrislee
 * @Time 2020/10/13
 */
export const countRebackAnchor = (direction:directionType,source:nodeInfo,target:nodeInfo):number => {
    // 水平布局用y比较，垂直布局用x比较
    // 坐标系是画布左上角为0，0
    const sourceBaseLocate = (direction === "horizontal"? source.y : source.x) as number;
    const targetBaseLocate = (direction === "horizontal"? target.y : target.x) as number;
    let anchor:number = 0;
    if(direction==="horizontal"){
        anchor = sourceBaseLocate > targetBaseLocate?2:0
    }else{
        anchor = sourceBaseLocate > targetBaseLocate?1:3
    }
    return anchor
}