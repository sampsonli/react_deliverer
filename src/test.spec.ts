import {connect} from './index'

class Test {
    name = 'lichun'
    getName() {
        return this.name
    }

}
const T = connect('hello')(Test)
const test = new T();
console.log(test.getName())
