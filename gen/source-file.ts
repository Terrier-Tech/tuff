import * as fs from 'fs'


// abstracts making modifications to a file in the source tree
export default class SourceFile {

    private body!: string

    constructor(readonly path: string) {
        this.body = fs.readFileSync(path, {encoding:'utf8', flag:'r'})

    }

    print() {
        console.log(`New body for ${this.path}`)
        console.log('--------')
        console.log(this.body)
        console.log('--------')
    }

    // replaces everything between //// Begin <name> and //// End <name> with content
    replaceRegion(name: string, content: string) {
        const begin = `//// Begin ${name}`
        const end = `//// End ${name}`
        
        let comps = this.body.split(begin)
        switch (comps.length) {
            case 1:
                throw `initial string does not containt '${begin}'!`
            case 2:
                break
            default:
                throw `initial string has ${comps.length-1} instances of '${begin}', there should only be one!`
        }
        const head = comps[0]

        comps = comps[1].split(end)
        switch (comps.length) {
            case 1:
                throw `initial string does not containt '${end}'!`
            case 2:
                break
            default:
                throw `initial string has ${comps.length-1} instances of '${end}', there should only be one!`
        }
        const tail = comps[1]

        this.body = `${head}${begin}\n\n${content}\n${end}${tail}`
    }

    write() {
        fs.writeFileSync(this.path, this.body)
    }
}