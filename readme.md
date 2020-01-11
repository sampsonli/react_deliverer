# react-deliverer 拯救者
## What is react-deliverer?
react-deliverer 是一个react+redux模块化管理工具， 基于redux 进一步封装， 更方便使用， 同时结构更清晰
## 为什么使用 react-deliverer?
react+redux 组合已经是目前主流开发模式， 但是使用原生redux开发会遇到很多痛点
1. 组件很容易做成按需加载，而action,reducer 不太方便做成异步加载， 意味着假如一个很大的应用，用户只访问一个页面， 会把很多没必要的业务代码一次性加载进来， 导致页面加载缓慢
2. 使用原生redux开发，需要定义很多常量，还有多个文件， 文件来回切换比较繁琐， 而且维护起来非常麻烦
3. 原生redux开发可读性差， 对于新手很难理解里面的操作逻辑
4. 开发的时候，修改action,reducer里面的内容很难保留老数据，大部分都情况下都要刷新页面
5. 使用redux 很难做类型检测， 自动代码提示功能很弱

## react-deliverer 解决的问题
1. 模块化
2. 无需定义各种常量， 多个文件
3. 模块无缝按需加载
4. 完全基于面向对象思想，使用简单
5. 完美支持异步操作
6. 可读性强
7. 完美支持ts开发， 拥有完善的自动代码提示
8. 兼容老版本浏览器（保证react+redux版本同时支持）
9. 热更新数据保留

## 参考项目
相关使用方法可以参考

1.  [reactwithie8（兼容老版本浏览器版本）](https://github.com/sampsonli/reactwithie8)
2.  [reactwebpack4（现代浏览器版本）](https://github.com/sampsonli/reactwebpack4)

## 快速开始
> 实现一个简单的demo， 一个页面有两个按钮，一个点击+1， 一个点击-1，输出当前数字
1. 安装react-deliverer
~~~bash
yarn add react-deliverer
~~~
2. 定义store并注入到deliverer中
~~~javascript
import deliverer from 'react-deliverer';
const store = createStore();
deliverer(store, asyncReducers); // asyncReducers是老版本维护的所有reducer， 新开项目可以不用传
~~~
4. 定义model
~~~javascript
import {deliver} from 'react-deliverer';
@deliver('demo')
class DemoModel {
    #number = 100;

    addOne() {
		this.#number = this.#number + 1;
	}

    minusOne() {
		this.#number--;
	}
}
export default new DemoModel();
~~~
>定义model主要由三部分组成
	1. 名字空间;
		>名字空间必须全局唯一,  声明名字空间有多种方式， 后面有更详细说明
	2. 类属性;
		>类中的属性会同步到redux store中，类属性可以是私有属性（推荐），也可以是公共属性， 私有属性同步到redux store中会移除'#'， 比如上面案例中 '#number' 保存到redux中会变为'number'
	3. 类方法;
		>类方法总this代表当前model对于在store中state的副本， 可以直接读取对应属性也可以修改对应属性， 每次修改完成后会同步到store中state， <font color="red">切记</font>类方法不能为箭头方法， 否则this无法使用。
	4. 定义模块引入了注解， 需要安装相关babel插件
5. 使用deliverer
>老版本react, 不支持react新api hooks

~~~javascript
import {connect} from 'react-redux';
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import css from './style.less';
import model from '../../demoModel';

class Demo extends Component {
    render() {
        const {data: {number}} = this.props;
        return (
            <div className={style.container}>
                <div className={style.addBtn} onClick={model.addOne}>
                    +
                </div>
				<div>{number}</div>
				<div className={style.minusBtn} onClick={model.minusOne}>
                    -
                </div>
            </div>
        );
    }
}
Demo.propTypes = {
    data: PropTypes.objectOf(PropTypes.any).isRequired,
};
export default connect(state => ({data: state[model.ns]}))(Demo);
~~~

>新版本react, 使用最新的hooks api；
~~~javascript
import React from 'react';
import style from './style.less';
import model from '../../demoModel';

const Demo = () => {
    const {number} = model.useData();
    return (
        <div className={style.container}>
			<div className={style.addBtn} onClick={model.addOne}>
				+
			</div>
			<div>{number}</div>
			<div className={style.minusBtn} onClick={model.minusOne}>
				-
			</div>
		</div>
    );
};
export default Demo;

~~~

>说明
		1. 使用新api 可以移除react-redux依赖包；
		2. model导出来的方法已经绑定过this了， 无需再绑定；

## 深入了解react-deliverer
> 通过简单的快速入手， 相信大家已经觉得此库很强大了， 首先完全基于面向对象， 其次使用简单。但是，以上demo只能满足小部分应用场景， 真实应用场景远比此demo复杂。
### 异步方法
> 异步方法是本库的最大特色之一， 相比其他类似库，功能更强大， 使用更简单。
> 异步请求是最常见应用场景，想象一下有这么一个应用场景， 一个页面，进来需要加载远程数据， 远程数据没有加载进来之前， 首先要有个loading动画， 数据加载完毕后， 移除loading
#### 原始react+redux+react-redux
1. 字符串定义定义为常量到一个 constant.js

~~~javascript
export const LOADING_TODOS = 'LOADING_TODOS'
export const LOAD_TODOS_SUCCESS = 'LOAD_TODOS_SUCCESS'
export const LOAD_TODOS_ERROR = 'LOAD_TODOS_ERROR'
~~~

2. 然后，编写异步的 action, actions.js:

~~~javascript
import { LOADING_TODOS, LOAD_TODOS_SUCCESS, LOAD_TODOS_ERROR } from '../constant'
export function fetchTodos() {
  return dispatch => {
    dispatch({ type: LOADING_TODOS })
    return fetch('https://jsonplaceholder.typicode.com/todo')
      .then(response => response.json())
      .then(todos => {
        dispatch({
          type: LOAD_TODOS_SUCCESS,
          todos,
        })
      })
      .catch(error => {
        dispatch({
          type: LOAD_TODOS_ERROR,
          error,
        })
      })
  }
}
~~~

3. 接着，在 reducer 中处理数据，reducer.js

~~~javascript
import { LOADING_TODOS, LOAD_TODOS_SUCCESS, LOAD_TODOS_ERROR } from '../constant'
const initialState = {
  todos: {
    loading: false,
    data: [],
    error: null,
  },
}
export default function(state = initalState, action) {
  switch (action.type) {
    case LOADING_TODOS:
      const { todos } = state
      return { ...state, todos: { ...todos, loading: true } }
    case LOAD_TODOS_SUCCESS:
      const { todos } = state
      return { ...state, todos: { ...todos, data: action.todos } }
    case LOAD_TODOS_ERROR:
      const { todos } = state
      return { ...state, todos: { ...todos, error: action.error } }
    default:
      return state
  }
}
~~~

4. 还没完，最后，在组件中使用:
~~~javascript
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { fetchTodos } from '../actions'
class Todos extends Component {
  componentDidMount() {
    const { dispatch } = this.props
    dispatch(fetchTodos)
  }
  render() {
    const { loading, items, error } = this.props
    if (loading) return <span>loading...</span>
    if (error) return <span>error!</span>
    return (
      <ul>
        {items.map(item => (
          <li key={item.id}>{item.title}</li>
        ))}
      </ul>
    )
  }
}
const mapStateToProps = state => {
  const { todos } = state
  return {
    loading: todos.loaing,
    items: todos.data,
    error: todos.error,
  }
}
export default connect(mapStateToProps)(Todos)
~~~

#### 使用deliverer
1. 定义model

~~~javascript
import {deliver} from 'react-deliverer';
@deliver('todo')
class DemoModel {
    #loading = false;
	
	#error;
	
	#items;

    * fetchData() {
		this.#loading = true;
		try {
			this.#items = yield fetch('https://jsonplaceholder.typicode.com/todo').then(response => response.json());
			this.#loading = false;
		}catch(e) {
			this.#loading = false;
			this.#error = e;
		}
		
	}
}
export default new DemoModel();
~~~

2. 定义页面

~~~javascript
import React, { useEffect } from 'react'
import style from './style.less';
import model from '../../demoModel';

export default() => {
	useEffect(() => {
		model.fetchData();
	}, [])
	
	const data = model.useData();
	const { loading, items, error } = data;
    if (loading) return <span>loading...</span>
    if (error) return <span>error!</span>
	return (
      <ul>
        {items.map(item => (
          <li key={item.id}>{item.title}</li>
        ))}
      </ul>
    )
}

~~~

>我们可以发现，使用 Redux 管理异步数据，代码量激增，是 react-deliverer 5 倍以上的代码量，
不管开发效率还是开发体验，亦或是可以维护性和可读性，个人认为，类似的 redux 这样的解决方案并不优秀。 Hooks 简单直观，Redux 本地冗长，并且链路太长，需维护多个文件，更多的代码量。
### 异步方法说明
* 异步方法最好是使用 generator方法， 不要使用async/await，否则可能会引发未知异常， 其实只需要把 async 替换成*， await 替换成yield即可；
* yield 后面必须跟promise实例；
* 异步方法默认返回promise实例， 也就是说可以直接调用当前实例的异步方法调用作为yield后面的对象, 例如：
~~~javascript
// 此demo无业务意义， 只是为了展示此库功能强大，两个异步方法调用之间的数据修改， 会同步到store中的state中
function wait(time) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(time);
        }, time);
    });
}
@deliver('demo2')
class HomeModel {
    #time = 100;
    * setTime() {
        let i = 20;
        while (i--) {
            yield wait(100);
            this.#time++;
        }
        return '新年快乐！';
    }
    * getTime() {
        this.#time = 500;
        const info = yield this.setTime();
        while (this.#time > 0) {
            this.#time = yield wait(this.#time - 10);
        }
        this.#time = info;
    }
}
~~~
* 不建议在类方法中写回调方法， 而回调方法中修改this中的数据， 否则所修改的数据不会同步到store中。

## Api接口说明

1. deliverer(store, asyncReducers)
* store: redux全局唯一实例
* asyncReducers: 其他reducer， 方便与其他库一起集成（可以不传）
2. 注解deliver 
> 此注解实现了两个功能， 给模块设置命名空间，注册model到redux中， 给模块命名有如下用法
~~~javascript
// 1.
@deliver
class Demo1 {
	ns = 'demo1';
}
export default new Demo1();
// 2.
@deliver('demo2')
class Demo2 {
}
export default new Demo2();
// 3. 
@deliver
class Demo3 {
}
export default new Demo2('demo3'); // 底层已经帮你赋值了
@deliver
class Demo4 {
    constructor(ns) {
        this.ns = ns;
    }
}
export default new Demo2('demo4');
~~~
3. 模块实例方法/属性
	1. ns 模块导出来具有ns属性， 值是模块命名空间名
	2. useData(selector) // 只有高版本react可用
		* selector 为空， 返回值是模块对应的state
		* selector 为方法， selector 返回模块中的属性， 参数是当前模块
		* selector 为字符串， 返回模块某个字段
	3. reset() 辅助方法， 用来恢复当前模块初始值
	
### 最佳实践
>react 组件/页面 开发基于function+hooks， 数据模型基于class， 而react-deliverer 是一款比较成熟的数据模型管理库， 解决了基于redux 开发一系列痛点。
	
