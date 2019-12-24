
class Test {
    name = 'lichun'
    getName = () => {
        return this.name
    }

}

const t = new Test();

for(var i in t) {
    console.log(i)
}
console.log(Test.prototype)
