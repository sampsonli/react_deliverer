## react-deliverer react 拯救者
> 基于redux 进一步封装， 更方便使用， 同时结构更清晰
>
### 背景
react+redux 组合已经是目前主流开发模式， 但是使用原生redux开发会遇到很多痛点
1. 组件很容易做成按需加载，而action,reducer 不太方便做成异步加载， 意味着假如一个很大的应用，用户只访问一个页面， 会把很多没必要的业务代码一次性加载进来， 导致页面加载缓慢
2. 使用原生redux开发，需要定义很多常量，维护起来非常麻烦
3. 原生redux开发可读性差， 对于新手很难理解里面的操作逻辑
4. 开发的时候，修改action,reducer里面的内容很难保留老数据，必须刷新页面
5. 使用redux 很难做类型检测， 自动代码提示功能很弱

### react-deliverer解决的问题
1. 模块化
2. 无需定义各种常量
3. 无缝按需加载
4. 使用简单
5. 热更新
6. 维护简单
7. 使用ts开发， 拥有完善的自动代码提示
8. 兼容ie8（保证react+redux版本同时支持ie8）
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

function wait(time) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(999999);
        }, time);
    });
}

@deliver('demo1_home')
class HomeModel {
    loading = false;
    data = null;
    * getData() {
        this.loading = true;
        const data = yield wait(2000);
        this.data = data;
        this.loading = false;
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
        model.getData();
    }
    render() {
        const {data} = this.props;
        return (
            <div className={css.container}>
                --{data.data}-
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

### 说明
1. deliver
    > deliver 注解必须传一字符串，而且全局唯一， 否则可能导致未知异常
2. 使用deliverer 前必须注入 store， 否则无法使用全部功能
3. 相关使用方法可以参考
    1. [reactwithie8](https://github.com/sampsonli/reactwithie8)

    2. [reactwebpack4](https://github.com/sampsonli/reactwebpack4/tree/feature_deliverer)
