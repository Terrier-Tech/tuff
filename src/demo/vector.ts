import {arrays} from "../main";

export default class Vector extends Array {

    x=(): number=>this[0]
    y=(): number=>this[1]
    setX=(n:number): this=>{this[0]=n; return this}
    setY=(n:number): this=>{this[1]=n; return this}

    constructor(...nums: number[]) {
        super()
        for (let n of nums) this.push(n)
        return this
    }

    initRandUnitVector(dims: number){
        for (let _ of arrays.range(0, dims-1)) this.push(2*Math.random()-1)
        const mag= this.mag()
        for (let i of arrays.range(0, dims-1)) this[i]=this[i]/mag
        return this
    }

    initUnitRadians(deg: number) {
        this.push(Math.cos(deg))
        this.push(Math.sin(deg))
        return this
    }

    initUnitDegrees(deg: number) {
        return this.initUnitRadians(deg* (Math.PI/180))
    }

    add(v: Vector | number){
        if ( typeof(v) === 'number' ) {
            const multiplied: number[] = this.map((e) => e + v)
            return new Vector(...multiplied)
        } else if ( typeof v == 'object' ) {
            const multiplied : number[] = this.map((e,i) => e + v[i])
            return new Vector(...multiplied)
        } else {
            throw("Wat?")
        }
        return this
    }

    mul(v: Vector | number){
        if ( typeof(v) === 'number' ) {
            const multiplied: number[] = this.map((e) => e * v)
            return new Vector(...multiplied)
        } else if ( typeof v == 'object' ) {
            const multiplied : number[] = this.map((e,i) => e * v[i])
            return new Vector(...multiplied)
        } else {
            throw("Wat?")
        }
        return this
    }

    minus(v: Vector | number){
        if ( typeof(v) === 'number' ) {
            const multiplied: number[] = this.map((e) => e - v)
            return new Vector(...multiplied)
        } else if ( typeof v == 'object' ) {
            const multiplied : number[] = this.map((e,i) => e - v[i])
            return new Vector(...multiplied)
        } else {
            throw("Wat?")
        }
        return this
    }

    div(v: Vector | number){
        if ( typeof(v) === 'number' ) {
            const multiplied: number[] = this.map((e) => e / v)
            return new Vector(...multiplied)
        } else if ( typeof v == 'object' ) {
            const multiplied : number[] = this.map((e,i) => e / v[i])
            return new Vector(...multiplied)
        } else {
            throw("Wat?")
        }
        return this
    }

    dot(v: Vector){
        return this.map((n, i) => n * v[i]).reduce((a, b) => a + b, 0);
    }

    // in radians
    angleBetween(v2: Vector){
        const v1=this;
        return Math.atan2(
            v1.x()*v2.y() - v1.y()*v2.x(),
            v1.x()*v2.x() + v1.y()*v2.y(),
        ) * -1
    }

    // from basis
    radians(){
        return this.angleBetween(new Vector(1, 0));
    }

    // from basis, -180 to pos 180
    degrees(){
        return this.radians() * (180/Math.PI);
    }

    // magnitude
    mag(){
        return Math.sqrt(this.map(n => n**2).reduce((a, b) => a + b, 0))
    }

    distanceTo(v: Vector){
        return Math.sqrt((this.x() - v.x() )**2 + (this.y() - v.y() )**2)
    }
}