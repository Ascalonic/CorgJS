# CorgJS
Corg web framework for Single Page Applications

## About Corg.JS

Corg.JS is a SPA framework developed by Ascalonic. Corg supports latest specification ES6. Code can be written in component structure.
Application code written in **ES6** is compiled by builder.js into a single bundle of javascript along with the runtime 
code necessary to run in all the modern browser.

## Features

### Component Driven Development

Borrowing concepts from Angular and React, you can develop applications as components. Each component consists of a class which
defines the properties and behavior of the component, the view file (HTML file defining the view of the component) and style script 
for styling the component. You can also dock components inside another.

Parent Component View:
```
<p>This is the Parent Component</p>
<comp-child></comp-child>
```

Child Component View:
```
<p>This is the Child Component</p>
```

will render as:

```
This is the Parent Component
This is the Child Component
```

### Flexible Data binding

Bind view elements with models one-way or two-way using in, out and inout attributes. 

* `in` : Input - Used for elements which reads data from the user
* `out` : Output - Used for elements with output only
* `inout` : Input and Output - Two way bind the element with the model

```
class App
{
  constructor() {
    this.message = "Hello, World";
  }
}
```

will render the following view:
`<p out="message"></p>`

as

`Hello, World`

More flexible and powerful component rendering is also possible

```
<p out="user">{lname}, {fname}</p>
```

```
class App
{
  constructor() {
    this.user = {
      fname: "Varghese",
      lname: "Mathai"
    };
  }
}
```

will render as: 

`Mathai, Varghese`

By plugging in the model object

You can render iterative components easier than ever:

```
<ul out="products">
  <li>{name}</li>
</ul>
```

will render the following model object:

```
[
  { name: "Shoes" },
  { name: "Laptop" }
]
```

as:

```
* Shoes
* Laptop
```

## Source Code

Backbone of Corg are the two following files:

### builder.js

It compiles the components into **Javascript objects** called Unified Component Models (UCM) which enapsulates the **methods as well as the model data** defined for each
component. The views of the component along with the UCMs are used to instantiate the components. In short, builder.js append the component
generation code to the runtime support script.

### main.js

The runtime script which handles everything the framework does :

* Data binding
* Component rendering
* Event handling

etc
