import {deliver} from './index'

class Test {
    name = 'lichun'
    getName() {
        return this.name
    }

}
const T = deliver('hello')(Test)
const test = new T();
console.log(test.getName())
