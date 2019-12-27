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
import {connect, action} from 'react-deliverer';

@connect('demo_home')
class HomeModel {
    number = 0;

    @action
    setNumber(number) {
        // console.log('----1233344');
        this.number = number;
    }

    getNumber(){
        console.log(this.number); // 获取实例字段
        // 模拟接口请求数据
        setTimeout(() => {
            this.setNumber(Math.floor(Math.random() * 1000));
        }, 300);
    }
}
export default new HomeModel();

~~~
5. 使用deliverer
~~~jsx harmony
import model from '../model/homeModel';
// 可以写成 基于function组件
class Home extends Component {
    render() {
        const {number} = this.props.data;
        return (
            <div className={classNames('l-full l-flex-column', css.container)}>
                <div className={css.header}>
                    <div className={css['h-ct']} onClick={() => store.getNumber()}>
                        <i className={css['h-back']} />
                        <span className={css['h-title']}>漫话历史-{number}</span>
                    </div>
                </div>
                <div className="l-flex-1 l-relative">
                    <div className={css['time-line']} />
                    <div className="l-full l-scroll-y">
                        <ul>
                            <li className={classNames(css.item, css.period)}>
                                <div><i className={css.logo_01} />
                                    <span className={css['l-title']}>春秋战国</span>
                                    <span className={css['s-title']}>公元前770年—公元前221年22222444</span>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

            </div>
        );
    }
}
export default connect(state => ({data: state[model.ns]}))(Home);

~~~

### 说明
1. action 
    > action 修饰的方法会修改原方法， 所修饰的方法不能是箭头方法，因为箭头无法无法注入this
    > 除了action修饰的方法， 其他方法建议使用箭头方法， action修饰的方法只能传一个参数， 如果要传多个的花， 可以考虑解构赋值
2. connect
    > connect 注解必须传一字符串，而且全局唯一， 否则可能导致未知异常
3. 使用deliverer 前必须注入 store， 否则无法使用全部功能
4. 相关使用方法可以参考
    1. [reactwithie8](https://github.com/sampsonli/reactwithie8)

    2. [reactwebpack4](https://github.com/sampsonli/reactwebpack4/tree/feature_deliverer)
