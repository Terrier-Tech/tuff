export {}

import { keys } from 'ts-transformer-keys'

const tags = keys<HTMLElementTagNameMap>()
for (let tag of tags) {
    console.log(`tag: ${String(tag)}`)
}


// import { resolve } from "path";

// import * as TJS from "typescript-json-schema";

// // optionally pass argument to schema generator
// const settings: TJS.PartialArgs = {
//     required: true,
// };

// // optionally pass ts compiler options
// const compilerOptions: TJS.CompilerOptions = {
//     strictNullChecks: true,
//     lib: ["es2015"]
// };

// // optionally pass a base path
// const basePath = "../src"

// const program = TJS.getProgramFromFiles(
//   [resolve("part.ts")],
//   compilerOptions,
//   basePath
// )

// // ... or a generator that lets us incrementally get more schemas

// const generator = TJS.buildGenerator(program, settings)!

// // all symbols
// // const symbols = generator.getUserSymbols()
// // for (let s of symbols) {
// //     console.log(`symbol: ${s}`)
// // }

// // Get symbols for different types from generator.
// let def = generator.getSchemaForSymbol("Part");
// console.log('def', def)