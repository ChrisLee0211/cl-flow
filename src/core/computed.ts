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