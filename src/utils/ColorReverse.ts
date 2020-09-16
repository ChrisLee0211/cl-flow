/**
 * 颜色取反
 * @param OldColorValue 十六进制颜色码
 * @returns color 取反后的十六进制颜色码
 * @author chrislee
 * @Time 2020/9/16
 */
export function ColorReverse(OldColorValue: string) {
    const reverse = `0x${OldColorValue.replace(/#/g, "")}`;
    const str = `000000${(0xffffff - (reverse as any)).toString(16)}`;
    return `#${str.substring(str.length - 6, str.length)}`;
}