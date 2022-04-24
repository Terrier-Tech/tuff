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
        this.normalize()
        return this;
    }

    initUnitRadians(deg: number) {
        this.push(Math.cos(deg))
        this.push(Math.sin(deg))
        return this
    }

    initUnitDegrees(deg: number) {
        return this.initUnitRadians(deg* (Math.PI/180))
    }

    normalize(){
        const mag= this.mag()
        for (let i of arrays.range(0, this.length-1)) {
            if(mag == 0) continue
            this[i]=this[i]/mag
        }
        return this
    }

    ceil(n: number){
        for (let i of arrays.range(0, this.length-1)) {
            if(this[i] > n) this[i]=n
        }
        return this
    }

    floor(n: number){
        for (let i of arrays.range(0, this.length-1)) {
            if(this[i] < n) this[i]=n
        }
        return this
    }

    sum(){
        return this.reduce((a, b) => a + b, 0);
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
        return this.map((n, i) => n * v[i]).sum();
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
        return Math.sqrt(this.map(n => n**2).sum())
    }

    map(args: any){
        return new Vector(...super.map(args))
    }

    distanceTo(v: Vector){
        return Math.sqrt((this.x() - v.x() )**2 + (this.y() - v.y() )**2)
    }
}