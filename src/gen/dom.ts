export {}

import * as fs from 'fs'
import TypescriptTree from './ts-tree'
import * as meta from './dom-meta'
import SourceFile from './source-file'

const info = console.log

const elementTypes: {[name: string]: meta.Element} = {}
const taggedElements: {[name: string]: meta.Element} = {}

const eventTypes: {[name: string]: meta.EventType} = {}

const raw = fs.readFileSync('node_modules/typescript/lib/lib.dom.d.ts', {encoding:'utf8', flag:'r'})

const tst = new TypescriptTree(raw)
let numSkipped = 0
let baseElement: meta.Element | null = null

// Skip these event types because they're deprecated and/or used internally.
const eventTypeBlacklist = ['keypress']
const skipEventType: {[type: string]: boolean} = {}
for (let t of eventTypeBlacklist) {
    skipEventType[t] = true
}

tst.eachInterface(iface => {
    const name = tst.text(iface.name)

    // tag name map
    if (name == 'HTMLElementTagNameMap') {
        for (let prop of tst.getProperties(iface)) {
            const elem = elementTypes[prop.type]
            if (elem) {
                taggedElements[prop.name] = elem
            }
            else {
                numSkipped += 1
            }
        }
    }

    // event type map
    else if (name == 'ElementEventMap' ||
            name == 'DocumentAndElementEventHandlersEventMap' ||
            name == 'GlobalEventHandlersEventMap') 
    {
        for (let prop of tst.getProperties(iface)) {
            if (!skipEventType[prop.name]) {
                eventTypes[prop.name] = new meta.EventType(prop.name, prop.type)
            }
        }
    }
    
    // HTMLElement
    else if (name == 'HTMLElement') {
        const elem = new meta.Element(name, iface, tst)
        elementTypes[name] = elem
        baseElement = elem
    }
    
    // HTMLElement subclass
    else if (tst.interfaceExtends(iface, 'HTMLElement')) {
        const comment = tst.fullText(iface).split('interface')[0]
        if (!comment.includes('@deprecated')) { // skip deprecated elements
            const elem = new meta.Element(name, iface, tst)
            elementTypes[name] = elem
        }
    }
})

if (!baseElement) {
    throw "No HTMLElement declaration!"
}

info(`Parsed ${Object.entries(taggedElements).length} tagged element types (skipped ${numSkipped})`)

info(`Parsed ${Object.entries(eventTypes).length} event types`)

const eventNames = Object.keys(eventTypes).sort()


/// inject tag classes and methods into tags.ts

const tagsFile = new SourceFile('src/tags.ts')

// tag class declarations
const classDeclarations = Object.values(elementTypes).map(elem => {
    return elem.classDeclaration(baseElement!)
}).join("")
tagsFile.replaceRegion("Tag Classes", classDeclarations)

// tag methods
const tagMethods = Object.entries(taggedElements).map(([tag, elem]) => {
    return elem.tagMethod(tag)
}).join("")
tagsFile.replaceRegion("Tag Methods", tagMethods)

// event emit methods
const emitMethods = eventNames.map(name => {
    return eventTypes[name].emitMethod()
}).join("")
tagsFile.replaceRegion("Emit Methods", emitMethods)

tagsFile.write()


/// inject HTML element event types into parts.ts

const partsFile = new SourceFile('src/parts.ts')

// event listen methods
const listenMethods = eventNames.map(name => {
    return eventTypes[name].listenMethod()
}).join("")
partsFile.replaceRegion("Listen Methods", listenMethods)

partsFile.write()