## react-deliverer react 拯救者
> 基于redux 进一步封装， 更方便使用， 同时结构更清晰
>
### 背景
react+redux 组合已经是目前主流开发模式， 但是使用原生redux开发会遇到很多痛点
1. 组件很容易做成按需加载，而action,reducer 不太方便做成异步加载， 意味着假如一个很大的应用，用户只访问一个页面， 会把很多没必要的业务代码一次性加载进来， 导致页面加载缓慢
2. 使用原生redux开发，需要定义很多常量，还有多个文件， 文件来回切换比较繁琐， 而且维护起来非常麻烦
3. 原生redux开发可读性差， 对于新手很难理解里面的操作逻辑
4. 开发的时候，修改action,reducer里面的内容很难保留老数据，大部分都情况下都要刷新页面
5. 使用redux 很难做类型检测， 自动代码提示功能很弱

### react-deliverer解决的问题
1. 模块化
2. 无需定义各种常量
3. 无缝按需加载
4. 使用简单
5. 热更新
6. 维护简单
7. 使用ts开发， 拥有完善的自动代码提示
8. 兼容老版本浏览器（保证react+redux版本同时支持）
9. 热加载数据保留

## 使用方法
1. 安装react-deliverer
~~~bash
yarn add react-deliverer
~~~
2. 获取store
3. 注入deliverer
~~~javascript
import deliverer from 'react-deliverer';
const store = createStore();
deliverer(store, asyncReducers); // asyncReducers是老版本维护的所有reducer， 新开项目可以不用传
~~~
4. 定义model
~~~javascript
import {deliver} from 'react-deliverer';

function wait(time) {  // 模拟http请求， 返回promise
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(new Date());
        }, time);
    });
}

@deliver('hello')
class HomeModel {
    #running = false;

    #time = new Date();

    * getTime() { // 模拟真实案例
        if (this.#running) return;
        this.#running = true;
        this.#time = yield wait(1000);
        let i = 10;
        while (this.i--) {
            this.#time = yield wait(1000);
        }
        console.log('10s later');
        this.#running = false;
    }

    print() {
        console.log(this.#time);
    }
}
export default new HomeModel();

~~~
5. 使用deliverer
~~~jsx harmony
import {connect} from 'react-redux';
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import css from './style.less';
import model from '../../models';

class Home extends Component {
    componentDidMount() {
        model.getTime();
    }
    render() {
        const {data} = this.props;
        return (
            <div className={style.container}>
                <div className={style.content}>
                    {(data.loading && 'loading') || moment(data.time).format('新年好 HH:mm:ss')}
                </div>
            </div>
        );
    }
}
Home.propTypes = {
    history: PropTypes.shape({push: PropTypes.func}).isRequired,
    data: PropTypes.objectOf(PropTypes.any).isRequired,
};
export default connect(state => ({data: state[model.ns]}))(Home);

~~~

新版本react
~~~jsx harmony
import React, {useEffect} from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import {useLocation} from 'react-router-dom';
import style from './style.less';
import model from '../../models';

const Home = () => {
    const data = model.useData();
    const location = useLocation();
    useEffect(() => {
        model.getTime();
    }, [location.search]);
    return (
        <div className={style.container}>
            <div className={style.content}>
                {(data.loading && 'loading') || moment(data.time).format('新年好 HH:mm:ss')}
            </div>

        </div>
    );
};
Home.propTypes = {
    history: PropTypes.shape({push: PropTypes.func}).isRequired,
};
export default Home;

~~~

### 说明
1. deliver
    > deliver 注解必须传一字符串，而且全局唯一， 否则可能导致未知异常
2. 使用deliverer 前必须注入 store， 否则无法使用全部功能
3. model中方法不能为箭头方法， 否则this无法使用， 失去了本库的意义
4. 相关使用方法可以参考
    1. [reactwithie8](https://github.com/sampsonli/reactwithie8)

    2. [reactwebpack4](https://github.com/sampsonli/reactwebpack4/tree/feature_deliverer)
    
    
### 遗留问题
1. 目前model 中generator 方法调用当前model中generator中还有部分小问题，
 被调用的generator里面的逻辑不能对model中的数据进行更新， 否则无法在调用的generator中同步数据（主要是this数据无法同步）， 可以在被调用的数据通过return 相关数据进行数据传递

