# Tuff

Tuff is a *Typescript UI Frontend Framework*.
It is designed to create dynamic, client-side web applications driven by type-safe, declarative code.


## Usage

Tuff has *no dependencies* dependencies and can be integrated into any new or existing Typescript project. 

### Parts

The basic building blocks of Tuff applications are **Parts**.
A Part is similar to a class-based React component.
They're classes that inherit from the `Part` generic class and implement a `render()` method.

```typescript
type CounterState = {
    count: number
}

// each part is parameterized by a state type
class Counter extends Part<CounterState> {
    
    // the render method accepts an HTML builder object that lets the 
    // part declaratively build the interface
    render(parent: Div) {
        // the CounterState object passed to this part is 
        // accessible as this.state
        parent.span({text: `Count: ${this.state.count}`})
    }

}
```

### Declarative UI

The argument of a Part's `render()` method is a HTML builder element -
specifically a `div` element - where the part can build its UI.

On each builder element, you can pass zero to many arguments that are one of:

1. A string containing CSS selector-style classes and/or an id, e.g. `".foo.bar#foo1"` will generate `class="foo bar" id="foo-1"`
2. An object literal containing attributes (like `title`, `href`, etc.) and/or a `text` value that will populate the literal body of the element
3. A function literal that takes the element as an argument and allows you to specify children of the element in the function body

For example, this element declaration:

```typescript
render(parent: Div) {
    parent.div(".container", c => {
        c.span(".value", {text: "Hello"})
        c.a(".link", {href: "#", text: "Click Me"})
    })
}
```

will generate the following markup:

```html
<div class="container">
    <span class="value">Hello</span>
    <a class="link" href="#">Click Me</a>
</div>
```

Since the `render()` method is plain Typescript, it can incorporate arbitrary control flow and logic:

```typescript
render(parent: Div) {
    for (let s in ['Foo', 'Bar', 'Baz']) {
        parent.a({href: `/page/${s.toLowerCase()}`, text: s})
    }
    if (this.state.count > 4) {
        parent.span({text: "Count is greater than 4"})
    }
}
```

### Initialization

Parts can define an `init()` method that will get called once before the first `render()` call:

```typescript
class Counter extends Part<CounterState> {

    // this is guaranteed to be called only once,
    // before the render() method is called for the first time
    init() {
    }
    
    // this will get called at least once, but possibly many
    // times as the UI is updated
    render(parent: Div) {
    }

}
```


### Child Parts

Each part can have nested _child_ parts such that the UI is composed of an arbitrary tree of parts. Child parts are created by the parent calling `makePart` (usually in the `init()` method) and are rendered to the UI with the `part` method on a DOM element in the `render()` method:

```typescript
type ButtonState = {text: string}

class Button extends Part<ButtonState> {
    render(parent: Div) {
        parent.a(".button", {text: this.state.text})
    }
}

type ToolbarState = {count: number}

class Toolbar extends Part<ToolbarState> {
    buttons = Array<Button>()

    init() {
        // populate the this.buttons array of child parts
        for (let i=0; i<this.state.count; i++) {
            this.buttons.push(
                this.makePart(Button, {text: `Button ${i}`})
            )
        }
    }

    render(parent: Div) {
        // render the button parts to the parent div
        for (let button of this.buttons) {
            parent.part(button)
        }
    }
}
```

### Dirty Tracking

Unlike React or other reactive UI libraries, the update of Tuff UIs does not happen automatically when state changes.
Instead, parts must explicitly mark themselves as dirty using the `dirty()` method when they're state has changed.

This was a conscious design decision to make the re-paint logic easier to reason about and more predictable. So, instead of knowing if/when a call to e.g. React's `forceUpdate` is needed, the updating is always precisely controlled.

When a part calls `dirty()`, the UI is not rendered immediately.
Instead, an update is scheduled for the next animation frame and only dirty parts are re-rendered. This has several effects:

1. Multiple `dirty()` calls at the same time will only result in a single render
2. Rendering happens only during the browser-specified animation frames, so even rapid calls to `dirty()` will result in smooth UI updates
3. As longs as the UI is composed of relatively fine-grained parts, updating small parts of the interface will result in only small re-renders, not a global virtual DOM diff


### Messages

Instead of traditional DOM event handlers, events in Tuff are handled through a custom _messages_ system. It is necessary due to the detached nature of the declarative UI and the actual DOM manipulation, but also offers some advantages over traditional event handlers:

1. The ability to passively handle messages that happen outside of a part's particular branch of the DOM tree
2. Easily attach multiple message keys to the same element and multiple handlers for the same message key
3. Use a single handler for messages emitted from many different elements down the DOM tree (similar to jQuery's `.on()`)
4. Decouple the emitting and handling of messages while leveraging the type system for correctness (message keys are statically typed and don't rely on strings)

Messages are identified by *keys* (instead of e.g. strings) to allow the type system to force correctness and avoid typos.
New message keys are created with the `makeKey()` global function and are used to declare which messages are emitted from a particular element:

```typescript
const FooKey = makeKey()

class Button extends Part<ButtonState> {
    render(parent: Div) {
        // .click(key) is a shortcut for 
        // .emit("click", key)
        parent.a(".button", {text: this.state.text})
            .click(FooKey)
    }
}
```

Then, either the same part or another part in the tree can declare that it will handle the message:

```typescript
class Toolbar extends Part<ToolbarState> {
    init() {
        // .onClick(key, ...) is a shortcut for 
        // .handle("click", key, ...)
        this.onClick(FooKey, message => {
            // the message argument contains:
            //  type: the string event type ("click")
            //  event: the raw HTMLElementEvent
            //  element: the HTMLELement on which the event originated
            this.state.foo = 'bar'
            this.dirty()
        })
    }
}
```

Parts that are not in the same branch of the DOM/Part tree can listen for messages as well with the "passive" argument:

```typescript
class OtherPart extends Part<OtherState> {
    init() {
        // this part will handle the FooKey message even though
        // it's not a parent of the emitting Button parts
        this.onClick(FooKey, m => {
            this.state.numClicked += 1
            this.dirty()
        }, "passive")
    }
}
```


## Development

Tuff uses <a href="https://pnpm.io/">pnpm</a> to manage dependencies and run scripts.

To run the demo application, clone this repository and run:

```
pnpm install
```

then:

```
pnpm run dev
```

to start the development server, which will serve the demo application at http://localhost:3000/.


## License (MIT)

Copyright 2021 <a href="https://terrier.tech">Terrier Technologies LLC</a>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.