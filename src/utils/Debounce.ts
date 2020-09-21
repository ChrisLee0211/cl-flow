/**
 * 函数防抖
 * @param fn 要进行防抖的函数
 * @param delay 防抖的间隔事件，单位ms
 * @author chrislee
 * @Time 2020/6/24
 */
export const debounce = (fn: Function, delay = 500): Function => {
    let timer= null as any;
    return function (this: any, ...args: any): void {
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(() => {
            fn.apply(this, args);
        }, delay);
    };
};