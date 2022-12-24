![Tuff Logo](https://raw.githubusercontent.com/Terrier-Tech/tuff/master/assets/tuff-logo.svg)

Tuff is a *Typescript UI Frontend Framework*.
It is designed to create dynamic, client-side web applications driven by type-safe, declarative code.


## Usage

Tuff has *no dependencies* and can be integrated into any new or existing Typescript project. Just install `tuff-core` with your favorite package manager:

```
npm i tuff-core
```

or 

```
yarn add tuff-core
```

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
    render(parent: PartTag) {
        // the CounterState object passed to this part is 
        // accessible as this.state
        parent.span({text: `Count: ${this.state.count}`})
    }

}
```

### Declarative UI

The argument of a Part's `render()` method is an HTML builder element where the part can build its UI.

On each builder element, you can pass zero to many arguments that are one of:

1. A string containing CSS selector-style classes and/or an id, e.g. `".foo.bar#foo1"` will generate `class="foo bar" id="foo1"`
2. An object literal containing attributes (like `title`, `href`, `class`, etc.) and/or a `text` value that will populate the literal body of the element
3. A function that takes the element as an argument and allows you to specify children of the element in the function body

The assignment of attributes from #2 is also exposed as methods on the element.

For example, this element declaration:

```typescript
render(parent: PartTag) {
    parent.div(".container", c => {
        c.span(".value")
         .text("Hello")
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

All attribute arguments are statically-typed and specific to the particular element (e.g. anchor tags can have an `href` attribute while input tags can have a `type` attribute, but not the other way around).

In addition to the proper HTML element attributes, you can assign arbitrary and nested data-attributes using the `.data()` method:

```typescript
render(parent: PartTag) {
    parent.a(".link")
        .text("Click Me")
        .data({foo: 'bar', nested: {hello: 'world'}})
}
```

will generate:

```html
<div>
    <a class="link" data-foo="bar" data-nested-hello="world">
        Click Me
    </a>
</div>
```

You can specify inline styles with the `css()` method:

```typescript
render(parent: PartTag) {
    parent.text("This is centered")
        .css({textAlign: 'center'})
}
```

will generate:

```html
<div style='text-align: center'>
    This is centered
</div>
```

Since the `render()` method is plain Typescript, it can incorporate arbitrary control flow and logic:

```typescript
render(parent: PartTag) {
    for (let s in ['Foo', 'Bar', 'Baz']) {
        parent.a({href: `/page/${s.toLowerCase()}`, text: s})
    }
    if (this.state.count > 4) {
        parent.span({text: "Count is greater than 4"})
    }
}
```

### Init and Load

Parts can define an `init()` method that will get called once before the first `render()` call.
You can also define a `load()` method that will get called after `init()` but before `render()`.

```typescript
class Counter extends Part<CounterState> {

    // this is guaranteed to be called only once,
    // before the render() method is called for the first time
    async init() {
    }

    // this will get called after init() and before the first render()
    // it may be called more than once if the root part is reloaded
    load() {
    }
    
    // this will get called at least once, but possibly many
    // times as the UI is updated
    render(parent: PartTag) {
    }

}
```

The difference between `init()` and `load()` is that `load()` may be called multiple times (when the user navigates, see [Routing and Navigation](#routing-and-navigation)), whereas `init()` is guaranteed to only ever be called once.

`init()` is also `async` since it may need to perform some IO while initializing and the part's `isInitialized` will not get set until after it's complete.


### Update

Each time a Part is actually rendered to the DOM, the `update()` method will get called and passed the corresponding DOM element.
The `update()` method may also get called when a part is marked as `stale`. 

This is useful for executing code that depends on the DOM itself, needs to be called whenever the part's DOM element changes, and possibly more often (e.g. rendering a canvas element based on user input).

```typescript
class Counter extends Part<CounterState> {

    fooKey = messages.untypedKey()

    async init() {
        this.onClick(m => {
            this.stale() // don't force a re-render, only update
        })
    }
    
    render(parent: PartTag) {
        parent.class('foo').a().emitClick(this.fooKey)
    }

    // elem will be the .foo element created by the render() method
    update(elem: HTMLElement) {
        // this gets called once for every call of render()
        // as well as any time the anchor is clicked
    }

}
```


### Mounting

The `Part.mount()` method is used to attach parts to the DOM.
It accepts either a DOM element or an id string as the mount point and an instance of the part's state:

```typescript
// mounts to the element with id 'container':
Part.mount(Counter, 'container', {count: 0})

// which is the same as:
Part.mount(Counter, document.getElementById('container')!, {count: 0})
```

Optionally, you can choose to _capture_ a base path when mounting a part. 
This means Tuff will prevent any navigation to a part starting with that base path by the browser and instead 
push the path to the browser history and reload the mounted Part.

```typescript
// mounts the part and captures any navigation to /path or any of its subpaths
Part.mount(RootPart, 'container', {}, {capturePath: '/path'})
```

Path capture is useful for client-side routing. 
See the [Routing and Navigation](#routing-and-navigation) section.


### Child Parts

Each part can have nested _child_ parts such that the UI is composed of an arbitrary tree of parts. Child parts are created by the parent calling `makePart` (usually in the `init()` method) and are rendered to the UI with the `part` method on a DOM element in the `render()` method:

```typescript
type ButtonState = {text: string}

class Button extends Part<ButtonState> {
    render(parent: PartTag) {
        parent.a(".button", {text: this.state.text})
    }
}

type ToolbarState = {count: number}

class Toolbar extends Part<ToolbarState> {
    buttons = Array<Button>()

    async init() {
        // populate the this.buttons array of child parts
        for (let i=0; i<this.state.count; i++) {
            this.buttons.push(
                this.makePart(Button, {text: `Button ${i}`})
            )
        }
    }

    render(parent: PartTag) {
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


### Routing and Navigation

Tuff supports typesafe client client-side using the [Typesafe Routes](https://github.com/kruschid/typesafe-routes) library.

Routes are declared as a constant composed of calls to `partRoute()` and `redirectRoute()`:

```typescript
const routes = {
    root: partRoute(RootPart, '/', {}),
    fooList: partRoute(FooListPart, '/foos', {}).
    fooShow: partRoute(FooShowPart, '/foos/:id', {
        id: stringParser
    }),
    bar: redirectRoute('/bar', '/foos')
}
```

`partRoute` routes a particular path to the given part.
If the part's state type is non-empty, the route must match each property with a parser (i.e. `stringParser`).
These properties are strongl-typed and matched to the part's state type at compile time.
See the [Typesafe Routes documentation](https://github.com/kruschid/typesafe-routes) for more details about parsers.

`redirectRoute` simply redirects one path to another. 


#### Routers

To actually _use_ a set of routes, you must create a subclass of `RouterPart`:

```typescript
export MyRouter extends RouterPart {
    get routes() {
        return routes
    }

    get defaultPart() {
        return UnknownPathPart
    }

    render(parent: PartTag) {
        parent.div('.child', child => {
            super.render(child)
        })
    }
}
```

A router needs to implement `routes` and `defaultPart` to specify the routes structure and default `Part` class if the current route is not found, respecitely. 
In the `render()` method, it must call `super.render()` and pass the tag in which the matched part will be rendered.

Tuff routers have some special properties that aren't present many other frameworks:
1. Routers do *not* need to be the root (mounted) part
2. You can have *more than one router* as children (or grandchildren, etc.) of the root part
3. The router's `render()` method can call `super.render()` at an arbitrary point in its render tree, acting like a layout

Combined, these properties allow the Tuff routing system to break free from the traditional one-router/one-layout paradigm and enable composable, dynamic UIs that still leverage traditional URL-based routing.


### Navigation

When a part is mounted with path capture (see [Mounting](#mounting)), all anchor tag clicks are intercepted and the mounted part is reloaded instead of the native browser navigation occurring.

You can also programmatically navigate to a different URL using `Nav.visit()`:

```typescript
Part.mount(RootPart, 'container', {}, {capturePath: '/root'})

// will update the URL bar to /root/foos/123 and reload the mounted part without actually reloading the page
Nav.visit("/root/foos/123")

// will perform the native navigation to /other since that's outside of the mounted path
Nav.visit("/other")
```




### Messages

Instead of traditional DOM event handlers, events in Tuff are handled through a custom _messages_ system. It is necessary due to the detached nature of the declarative UI and the actual DOM manipulation, but also offers some advantages over traditional event handlers:

1. The ability to passively handle messages that happen outside of a part's particular branch of the DOM tree
2. Easily attach multiple message keys to the same element and multiple handlers for the same message key
3. Use a single handler for messages emitted from many different elements down the DOM tree (similar to jQuery's `.on()`)
4. Decouple the emitting and handling of messages while leveraging the type system for correctness (message keys are statically typed and don't rely on strings)
5. Force message emitters to pass strongly-typed data, which handlers can then receive

Messages are identified by *keys* (instead of e.g. strings) to allow the type system to force correctness and avoid typos.
New message keys are created with the `messages.untypedKey()` and `messages.typedKey<T>()` functions and are used to declare which messages are emitted from a particular element:

```typescript
const FooKey = messages.untypedKey()

const type BarData = {
    value: number
}
const BarKey = messages.typedKey<BarData>()

class Button extends Part<ButtonState> {
    render(parent: PartTag) {
        // .emitClick(key) is a shortcut for .emit("click", key)
        // passing a typed key forces you to also pass that type
        parent.a(".button", {text: this.state.text})
            .emitClick(FooKey)
            .emitClick(BarKey, {value: 42})
    }
}
```

Then, either the same part or another part in the tree can declare that it will handle the message:

```typescript
class Toolbar extends Part<ToolbarState> {
    async init() {
        // .onClick(key, ...) is a shortcut for .handle("click", key, ...)
        // the message argument contains:
        //  type: the string event type ("click")
        //  event: the raw Event
        //  data: the data passed if the key is typed
        this.onClick(FooKey, message => {
            this.state.foo = 'bar'
            this.dirty()
        })
        this.onClick(BarKey, message => {
            console.log(`Bar clicked with value ${message.data.value}`)
        })
    }
}
```

Parts that are not in the same branch of the DOM/Part tree can listen for messages as well with the "passive" argument:

```typescript
class OtherPart extends Part<OtherState> {
    async init() {
        // this part will handle the FooKey message even though
        // it's not a parent of the emitting Button parts
        this.onClick(FooKey, m => {
            this.state.numClicked += 1
            this.dirty()
        }, "passive")
    }
}
```

### Global Keyboard Events

Unlike mouse and focus events, general keyboard presses bubble directly to the document (unless they're handled by a form input or contenteditable element).
Additionally, the "keypress" event is deprecated in modern Javascript. 

Therefore, Tuff overrides the "keypress" event to to actually handle global keydown events. 
This provides a mechanism for any *Part* to handle global key press events in the same way that other, local events are handled.

In order to ease cross-platform development, special message keys (*KeyPress* objects) are constructed for the global key press events.
Each *KeyPress* takes the key being pressed as well as zero or more *KeyModifiers* that specify the modifier keys in a platform-indepependent manner.

For example, the "control/command" modifier maps to the Command key on macOS and the Control key on other platforms:

```typescript
async init() {
    this.onKeyPress(messages.keyPress("z", "control/command"), m => {
        // this gets called when command+z is pressed on macOS 
        // and control+z if called on Windows and Linux
    })
}
```

Alternatively, you can register a listener for _any_ global keyboard event using `onAnyKeyPress`:

```typescript
async init() {
    this.onAnyKeyPress(m => {
        // this gets called when any key is pressed
        // m.data will contain the key and modifier
    })
}
```


### Logging

Tuff comes with a very simple logging system that you can optionally use for your application. Simply create a `Logger` instance with an arbitrary prefix anywhere you'd like (Tuff libraries tend to do it at the top of the file) and call the usual logging methods (`debug`, `info`, `warn`, `error`):

```typescript
const log = new Logger('MyThing')

// regular log statements
log.info('hello')
// [MyThing] hello

// console-style extra args
log.warn('an object', {foo: 'bar'})
// [MyThing] an object
// {foo: 'bar'}

// log the time it takes to execute a function
log.time('count things', () => {
    // something that takes time to do
})
// [MyThing] count things: 0.312 ms

// set the global minimum log level to filter output
// (default is 'info')
Logger.level = 'warn'
log.info('too much info')
// (won't print anything)

```

### Forms

Tuff provides a special `Part` class, `FormPart`, which provides special methods to generate HTML form elements that are bound directly the properties of its data type.

Simply extend `FormPart` with your form-specific data type and then declare the form fields in the `render()` method with helpers like `textInput()`, `dateInput`, `radio`, and `checkbox`:

```typescript
type MyFormData = {
    text: string
    date: string
    either: "a" | "b"
    isChecked: boolean
}

class MyFormPart extends FormPart<MyFormData> {

    render(parent: PartTag) {
        this.textInput(parent, "text", {placeholder: "Enter Text Here"})
        this.dateInput(parent, "date")
        parent.label(label => {
            this.radio(label, "either", "a")
            label.span({text: "A"})
        })
        parent.label(label => {
            this.radio(label, "either", "b")
            label.span({text: "B"})
        })
        parent.label(label => {
            this.checkbox(label, "isChecked")
            label.span({text: "Is Checked?"})
        })
    }

}
```

This part will render the given form elements and automatically assign the values from its `state` to them.

Whenever an input on the form is changed, the `shouldUpdateState()` method will be called, allowing the part to decide whether or not the new data should override the existing state (default is true if not implemented):

```typescript
class MyFormPart extends FormPart<MyFormData> {

    // render() {...}

    shouldUpdateState(newData: DataType): boolean {
        if (newData.text.length) { // some validation
            return true
        }
        else {
            this.dirty()
            return false
        }
    }

}
```

This is a good place to perform validation and possibly return false and mark the part as dirty - forcing it to re-render.

If `shouldUpdateState()` returns true, the new data is then emitted as a `"datachange"` event that other parts in the tree can handle. The event is keyed with a `TypedKey` called `dataChangeKey` specific to the part:

```typescript

class ParentPart extends Part<{}> {

    myForm!: MyFormPart

    async init() {
        this.myForm = this.makePart(MyFormPart, {
            text: "New Form",
            date: "2022-01-01",
            either: "a",
            isChecked: false
        })

        // this will get called whenever the form part's data changes
        this.onDataChanged(this.myForm.dataChangeKey, m => {
            // m.data has type MyFormData
            log.info(`My form data changed with text=${m.data.text}`, m)
        })
    }

}

```


## Development

To run the demo application, clone this repository and run:

```
npm install
```

then:

```
npm run dev
```

to start the development server, which will serve the demo application at http://localhost:3000/.


### Source Generation

Tuff parses the Typescript DOM type definitions to programmatically generate the tag and event handling code.
In the event that such code needs to be regenerated, run:

```
npm run gen
```

### Publishing

Due to reasons that I cannot fathom, `npm publish` doesn't seem to support publishing just the `dist` directory in a reasonable way.
So, we use a custom script instead:

```
npm run pub
```


## License (MIT)

&copy; 2022 <a href="https://terrier.tech">Terrier Technologies LLC</a>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.