/**
 * 自定义Promise函数模块：IIFE
 *  */
(function (window) {
  const PENDING = 'pending';
  const RESOLVED = 'resolved';
  const REJECTED = 'rejected';

  class Promise {
    constructor(excutor) {
      // 将当前Promise对象保存起来
      const _this = this;
      // promise状态属性，初始值为pending
      _this.status = PENDING;
      // 存储结果数据的属性
      _this.data = undefined;
      // 每个元素结构 { onResolved(){}, onREjected(){} }
      _this.callbacks = [];
      
      function resolve(value) {
        // 状态只能改一次，只能在pending状态改变
        if (_this.status !== PENDING) {
          return;
        }
        
        // 将状态改为 resolved
        _this.status = RESOLVED;

        // 保存数据
        _this.data = value;

        // 如果有待执行的callback函数，立即异步执行回调
        if (_this.callbacks.length > 0) {
          // 放入队列中执行所有成功的回调
          setTimeout(() => {
            _this.callbacks.forEach(item => {
              item.onResolved(value);
            });
          });
        }
      }

      function reject(reason) {
        // 状态只能改一次，只能在pending状态改变
        if (_this.status !== PENDING) {
          return;
        }

        // 将状态改为 rejected
        _this.status = REJECTED;

        // 保存数据
        _this.data = reason;

        // 如果有待执行的callback函数，立即异步执行回调
        if (_this.callbacks.length > 0) {
          // 放入队列中执行所有成功的回调
          setTimeout(() => {
            _this.callbacks.forEach(item => {
              item.onRejected(reason);
            });
          });
        }
      }

      // 立即同步执行
      try {
        excutor(resolve, reject);
      } catch (error) {
        // 如果执行器抛出异常，promise变为rejected状态
        reject(error);
      }
    }

    /**
    * Promise原型对象的 then 方法
    * @param {*} onResolved 
    * @param {*} onRejected 
    * desc: 指定成功和失败的回调函数，返回一个新的Promise对象
    */
    then (onResolved, onRejected) {
      const _this = this;

      // 返回一个新的Promise对象
      return new Promise((resolve, reject) => {
        onResolved = typeof onResolved === 'function' ? onResolved : value => value;
        // 指定默认的失败的回调(实现错误/异常传透的关键点)
        onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason };
        
        // 调用指定回调函数，根据执行结果，改变return的Promise的状态
        function handle(callback) {
          /**
           * 1、如果抛出异常，return的Promise就会失败，reason就是error
           * 2、如果回调函数返回非Promise，return的Promise就会成功，value就是返回的值
           * 3、如果回调函数返回Promise，return的Promise结果就是这个Promise的结果
           */
          try {
            const result = callback(_this.data);

            if (result instanceof Promise) {
              // result.then(
              //   value => resolve(value),
              //   reason => reject(reason),
              // );
              result.then(resolve, reject);
            } else {
              resolve(result)
            }
          } catch (error) {
            reject(error);
          }
        }

        // pending状态
        if (_this.status === PENDING) {
          _this.callbacks.push({
            onResolved() {
              handle(onResolved);
            },
            onRejected() {
              handle(onRejected);
            },
          });
        }

        // resolved状态
        if (_this.status === RESOLVED) {
          setTimeout(() => {
            handle(onResolved);
          });
        }

        // rejected状态
        if (_this.status === REJECTED) {
          setTimeout(() => {
            handle(onRejected);
          });
        }
      });
    }

    /**
     * Promise原型对象的 catch 方法
     * @param {*} onRejected 
     * desc: 指定失败的回调函数，返回一个新的Promise对象
     */
    catch (onRejected) {
      this.then(undefined, onRejected);
    }

    /**
     * Promise函数对象的 resolve 方法
     * @param {*} value
     * desc: 返回指定成功结果的promise 
     */
    static resolve = function (value) {
      return new Promise((resolve, reject) => {
        if (value instanceof Promise) {
          value.then(resolve, reject);
        } else {
          resolve(value);
        }
      });
    }

    /**
     * Promise函数对象的 reject 方法
     * @param {*} reason 
     * desc: 返回指定失败结果的promise 
     */
    static reject = function (reason) {
      return new Promise((resolve, reject) => {
        reject(reason);
      });
    }

    /**
     * Promise函数对象的 all 方法
     * @param {*} promises 
     * desc: 只有所有promise都成功才成功，返回一个promise
     */
    static all = function (promises) {
      const values = [];
      let count = 0;

      return new Promise((resolve, reject) => {
        promises.forEach((p, index) => {
          // promises中元素可能不是一个Promise，需要用Promise.resolve()处理下
          Promise.resolve(p).then(value=> {
            count++;
            values[index] = value;

            if (count === promises.length) {
              resolve(values);
            }
          }, reason => {
            reject(reason);
          });
        });
      });
    }

    /**
     * Promise函数对象的 race 方法
     * @param {*} promises 
     * desc: 结果由第一个完成的promise决定，返回一个promise
     */
    static race = function (promises) {
      return new Promise((resolve, reject) => {
        promises.forEach((p) => {
          Promise.resolve(p).then(value=> {
            resolve(value);
          }, reason => {
            reject(reason);
          });
        });
      });
    }

    /**
     * Promise函数对象的 resolveDelay 方法
     * @param {*} value 
     * @param {*} time 
     * desc: 返回一个promise对象，在指定时间才确定结果
     */
    static resolveDelay = function(value, time) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (value instanceof Promise) {
            value.then(resolve, reject);
          } else {
            resolve(value);
          }
        }, time);
      });
    }

    /**
     * Promise函数对象的 rejectDelay 方法
     * @param {*} reason 
     * @param {*} time 
     * desc: 返回一个promise对象，在指定时间才确定结果
     */
    static rejectDelay = function(reason, time) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(reason);
        }, time);
      });
    }
  }

  window.Promise = Promise;
})(window)