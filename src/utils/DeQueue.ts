interface QueueItem {
    [key:number]:any
}
interface QueueType {
    size():number
    pop():any
    push(item:any):void
    clear():any
    getAll():void
}
interface DeQueueType extends QueueType {
    shift():any
    unshift(item:any):void
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
export class DeQueue implements DeQueueType {
    /** 队列大小 */
    private count:number = 0;
    /**队列头部元素指针 */
    private headIndex:number = 0;
    /** 队列实体 */
    private queue:QueueItem = {};
    constructor(){
        this.init()
    }
    /** 初始化方法 */
   private init(){
        this.count = 0;
        this.headIndex = 0;
        this.queue = {}
    }
    /** 推入一个元素到队列尾部 */
    push(item:any){
        this.queue[this.count] = item;
        this.count++
    }
    /** 获取队列的大小 */
    size(){
        return this.count - this.headIndex
    }
    /** 弹出队列尾部元素 */
    pop(){
        const len = this.size();
        if(len<=0) return undefined;
        const result = this.queue[this.count-1];
        delete this.queue[this.count-1];
        this.count --;
        return result
    }
    /** 弹出队列头部元素 */
    shift(){
        const len = this.size();
        if(len<=0) return undefined;
        const result = this.queue[this.headIndex];
        delete this.queue[this.headIndex];
        this.headIndex ++;
        return result
    }
    /** 插入元素到队列头部 */
    unshift(item:any){
        if(this.size()<=0){
            this.push(item);
        }else{
            if(this.headIndex>0){
                // 队首元素指针不为0时
                this.headIndex --;
                this.queue[this.headIndex] = item;
            }else{
                // 队首元素指针为0，我们需要将将队列里的0号key空出来，其他数据整体向后移动一位。
        for (let i = this.count; i > 0; i--){
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
    clear(){
       this.init()
    }
    /** 打印队列内部所有元素 */
    getAll(){
        const result:any[] = [];
        for(let i=this.headIndex;i<this.count;i++){
            result.push(this.queue[i])
        }
        console.log(result)
    }
}