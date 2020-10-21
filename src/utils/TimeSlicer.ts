/**
 * 时间分片包装器
 * @param {Generator} generator函数
 * @returns {Function} 时间分片启动函数，直接调用即可
 * @author chrislee
 * @Time 2020/10/20
 */
function timeSlice(gen:GeneratorFunction):Function|void{
    if(typeof gen!=="function") throw new Error(`TypeError: the param expect a generator function`)
    const g = gen();
    if(!g||typeof g.next !== "function") return;
    return function next(){
        const start = performance.now();
        let res:IteratorResult<any,any>;
        do{
            res = g.next();
        }while(res.done!==true&&performance.now()-start<25);
        if(res.done) return
        setTimeout(next)
    }
}


/**
 * 时间分片器构造函数参数选项
 */
interface timeSlicerOption {
    /** 分片间隔时间，默认为25ms,因为谷歌最新的性能指标把超过50ms的任务都视为需要优化的长任务 */
    duration?:number
}

class TimeSlicer {
    private cacheMap:Map<number,Function> = new Map();
    private duration:number = 25;
    private uuid:number;
    constructor(opt?:timeSlicerOption){
        this.duration = opt?.duration??25;
        this.uuid = Number(new Date());
    }

    /**
     * 添加一个函数到时间分片器中，供后序启动时执行
     * @param {Function} fn 执行分片的函数
     * @returns {number} 返回该函数在时间分片器中的唯一id
     */
    add(fn:Function):number{
        if(typeof fn !=="function") throw new Error(`TypeError: please add a function!`)
        const size = this.cacheMap.size+1;
        const uuid = this.uuid + size;
        if(this.cacheMap.has(uuid)) return uuid
        this.cacheMap.set(uuid,fn);
        return uuid
    }

    /**
     * 删除指定id的函数
     * @param {number} uuid
     * @returns {void}
     */
    remove(uuid:number):void{
        if(this.cacheMap.has(uuid)){
            this.cacheMap.delete(uuid)
        }
    }

    /**
     * 启动时间分片器
     */
    run(){
        const gen = this.useGenerator(this.cacheMap);
        this.timeSlice(gen)
    }

    /**
     * 时间分片核心逻辑
     * @param {Generator} 生成器函数
     * @returns {void}
     */
    private timeSlice(gen:()=>Generator):Function|void{
        if(typeof gen!=="function") throw new Error(`TypeError: the param expect a generator function`)
        const g = gen();
        if(!g||typeof g.next !== "function") return;
        return function next(){
            const start = performance.now();
            let res:IteratorResult<any,any>;
            do{
                res = g.next();
            }while(res.done!==true&&performance.now()-start<25);
            if(res.done) return
            setTimeout(next)
        }
    }

    /**
     * 将cacheMap中函数包装为genertor
     * @param {Map} cacheMap 内部的map
     * @returns {GeneratorFunction}
     */
    private useGenerator(map:Map<number,Function>):()=>Generator{
        const eventList:Function[] = [];
        map.forEach((fn)=>{
            eventList.push(fn)
        });
        return function* gen(){
            let len = eventList.length;
            while(len>0){
                yield eventList[len-1]();
                len--
            }
        }
    }
}