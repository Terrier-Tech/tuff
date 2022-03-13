export {}

import * as fs from 'fs'
import TypescriptTree from './ts-tree'
import * as meta from './dom-meta'
import SourceFile from './source-file'

const info = console.log

const eventTypes: {[name: string]: meta.EventType} = {}

const raw = fs.readFileSync('node_modules/typescript/lib/lib.dom.d.ts', {encoding:'utf8', flag:'r'})

const tst = new TypescriptTree(raw)

// Skip these event types because they're deprecated and/or used internally.
const eventTypeBlacklist = ['keypress']
const skipEventType: {[type: string]: boolean} = {}
for (let t of eventTypeBlacklist) {
    skipEventType[t] = true
}

interface ConfigType {
    elementBaseInterfaces: ReadonlyArray<string>
    tagBaseClass: string
}


type ElementMap = {[name: string]: meta.Element}

const configs: {[type: string]: ConfigType} = {
    "html": {
        elementBaseInterfaces: ["HTMLElement"],
        tagBaseClass: "HtmlTagBase"
    },
    "svg": {
        elementBaseInterfaces: ["SVGElement", "SVGGraphicsElement", "SVGGeometryElement", "SVGGradientElement", "SVGFitToViewBox"],
        tagBaseClass: "SvgTagBase"
    }
} as const
type TagType = keyof typeof configs
const tagTypes = Object.keys(configs)
const numSkipped: {[type: TagType]: number} = {}
const taggedElements: {[type: TagType]: ElementMap} = {}
const elementTypes: {[type: TagType]: ElementMap} = {}

for (let t of tagTypes) {
    taggedElements[t] = {}
    elementTypes[t] = {}
    numSkipped[t] = 0
}

tst.eachInterface(iface => {
    const name = tst.text(iface.name)

    for (let t of tagTypes) {

        // tag name map
        if (name == `${t.toUpperCase()}ElementTagNameMap`) {
            for (let prop of tst.getProperties(iface)) {
                const elem = elementTypes[t][prop.type]
                if (elem) {
                    taggedElements[t][prop.name] = elem
                }
                else {
                    numSkipped[t] += 1
                }
            }
        }
    
        // base element
        else if (configs[t].elementBaseInterfaces.includes(name)) {
            const elem = new meta.Element(t, name, [name], iface, tst)
            elementTypes[t][name] = elem
        }

        // element subclass
        else if (configs[t].elementBaseInterfaces.some(i => tst.interfaceExtends(iface, i))) {
            const comment = tst.fullText(iface).split('interface')[0]
            if (!comment.includes('@deprecated')) { // skip deprecated elements
                const baseNames = configs[t].elementBaseInterfaces.filter(i => tst.interfaceExtends(iface, i))
                const elem = new meta.Element(t, name, baseNames, iface, tst)
                elementTypes[t][name] = elem
            }
        }

    }

    // event type map
    if (name == 'ElementEventMap' ||
            name == 'DocumentAndElementEventHandlersEventMap' ||
            name == 'GlobalEventHandlersEventMap') 
    {
        for (let prop of tst.getProperties(iface)) {
            if (!skipEventType[prop.name]) {
                eventTypes[prop.name] = new meta.EventType(prop.name, prop.type)
            }
        }
    }
})


for (let t of tagTypes) {
    info(`Parsed ${Object.entries(taggedElements[t]).length} tagged ${t} element types (skipped ${numSkipped[t]})`)

    const file = new SourceFile(`src/${t}.ts`)

    // tag class declarations
    const classDeclarations = Object.values(elementTypes[t]).map(elem => {
        return elem.classDeclaration(elem.baseNames.map(n => {return elementTypes[t][n]}), configs[t].tagBaseClass)
    }).join("")
    file.replaceRegion("Tag Classes", classDeclarations)
    
    // tag methods
    const tagMethods = Object.entries(taggedElements[t]).map(([tag, elem]) => {
        return elem.tagMethod(tag)
    }).join("")
    file.replaceRegion("Tag Methods", tagMethods)

    file.write()
}

info(`Parsed ${Object.entries(eventTypes).length} event types`)

const eventNames = Object.keys(eventTypes).sort()

// event emit methods in tags.ts
const tagsFile = new SourceFile('src/tags.ts')
const emitMethods = eventNames.map(name => {
    return eventTypes[name].emitMethod()
}).join("")
tagsFile.replaceRegion("Emit Methods", emitMethods)
tagsFile.write()


/// event listen methods in parts.ts
const partsFile = new SourceFile('src/parts.ts')
const listenMethods = eventNames.map(name => {
    return eventTypes[name].listenMethod()
}).join("")
partsFile.replaceRegion("Listen Methods", listenMethods)
partsFile.write()
