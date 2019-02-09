///////////////////////////// APP /////////////////////////////

function App() {
    this.init();
}

//Fetch the element with 'corg-app' tag and set it as root
App.prototype.init = function() {
    var roots = document.getElementsByTagName('corg-app');
    if(roots.length > 1) {
        console.error("Multiple corg-app roots found!" +
        "There should be only one root");
    }
    else {
        this.root = roots[0];
        this.components = [];
    }
    this.events = [];
    this.postevents = [];
    this.looptemplates = [];
}

App.prototype.reRender = function() {

    this.root.innerHTML = '';
    this.events = [];
    this.looptemplates = [];

    for(var i=0;i<this.postevents.length;i++) {
        this.postevents[i].action(this.postevents[i].data);
    }

    this.postevents = [];
    this.renderComponent('comp-app');
}

//Update the app to reflect model changes
App.prototype.updateApp = function(compname) {

    var all = this.root.getElementsByTagName("*");;

    var postupdate = [];

    if(compname == null) {
        var component = this.components.filter(comp => 
            comp.name == 'comp-app')[0];
    }
    else {
        var component = this.components.filter(comp => 
            comp.name == compname)[0];

        console.log(component.rendered);
        var all = component.rendered.getElementsByTagName("*");
    }

    for(var i=0;i<all.length;i++) {

        if(all[i].getAttribute('comp') != null) {
            postupdate.push(all[i].getAttribute('comp'));
        }
        else if(all[i].getAttribute('in') != null) {
            data_attrib = all[i].getAttribute('in');
            all[i].setAttribute("value", this.iterateStaticModel(component.model, data_attrib));
        }
        else if(all[i].getAttribute('out') != null) {

            data_attrib = all[i].getAttribute('out');

            var modelvalue = this.iterateStaticModel(component.model, data_attrib);

            console.log(component.model);
            console.log(data_attrib);
            console.log(modelvalue);

            if(!Array.isArray(modelvalue)) {
                var inner_html = this.renderTemplate(all[i].innerHTML,
                    this.iterateStaticModel(component.model, data_attrib));
    
                if(inner_html === all[i].innerHTML) {
                    all[i].innerHTML = 
                    this.iterateStaticModel(component.model, data_attrib);
                }
                else {
                    all[i].innerHTML = inner_html;
                }
            }
            else {

                //1. Get the child template from looptemplates
                var ltid = parseInt(all[i].getAttribute('ltid'));
                var child = this.looptemplates[ltid];

                //2. Remove the existing children
                all[i].innerHTML = '';

                //3. Loop over the model elements and create children
                modelvalue.forEach(element => {
                    var curnode = child.cloneNode(true);
                    //4. Render the child
                    curnode.innerHTML = this.renderTemplate(curnode.innerHTML, element);
                    
                    var curnode_elems = curnode.getElementsByTagName("*");
                    if(curnode_elems.length == 0) {
                        curnode_elems = [curnode];
                    }

                    _element = element;
                    curnode_elems.forEach(element => {
                        //Event Binding - click
                        if(element.getAttribute('click') != null) {
                            var clickhandler = element.getAttribute('click');
                            this.events.push({ handler: this.iterateStaticModel(component.model, clickhandler),
                                                data: component.model,
                                                my: _element,
                                                type: "click"
                                            });
                            element.setAttribute("clickevt", this.events.length - 1);
                        }
                    });

                    all[i].appendChild(curnode);
                });
            }
        }

        postupdate.forEach(element => {
            console.log(element);
            this.updateApp(element);
        });
    }
}

//Iterate a model object and return the element pointed to by "path"
App.prototype.iterateStaticModel = function(model, path) {

    var stack = path.split('.');  
    while(stack.length>1){
        model = model[stack.shift()];
    }
    return model[stack.shift()];
}

//Iterate object and update a node
App.prototype.updateObject = function(object, newValue, path){
    var stack = path.split('.');  
    while(stack.length>1){
      object = object[stack.shift()];
    }
    object[stack.shift()] = newValue;
}

//Validate a view against its model
App.prototype.validateComponent = function(html, model) {
    let dom_helper = new DOMHelper();
    var html_dom = dom_helper.createElementFromHTML(html);

    var all = html_dom.getElementsByTagName("*");
    for(var i=0;i<all.length;i++) {

        var data_attrib = null;

        if(all[i].getAttribute('in') != null)
            data_attrib = all[i].getAttribute('in');
        if(all[i].getAttribute('out') != null)
            data_attrib = all[i].getAttribute('out');
        if(all[i].getAttribute('inout') != null)
            data_attrib = all[i].getAttribute('inout'); 
    }

    return true;
}

//add a component to the app (consist of name, view, model and root indicator)
App.prototype.addComponent = function(name, html, model, isRoot) {
    if(this.validateComponent(html, model)) {
        this.components.push({name: name, html: html, model: model, 
                                isRoot: isRoot});
        if(isRoot) {
            this.root.innerHTML = html;
        }
    }
    else
        console.error("Invalid Component not pushed to app");
}

//Render a view with the given model "render_obj"
//elements specified within { } are replaced by their values
App.prototype.renderTemplate = function(inner_html, render_obj) {
    var started = false; var sub_attrib = ''; var matches = [];
    for(var k = 0;k<inner_html.length;k++) {
        if(!started) {
            if(inner_html.charAt(k) == '{') started = true;
        }
        else if(started) {
            if(inner_html.charAt(k)!='}')
                sub_attrib += inner_html.charAt(k);
            else {
                started = false;
                matches.push({text: sub_attrib, end: k - 1, start: k - 1 - sub_attrib.length});
                sub_attrib = '';
            }
        }
    }

    for(var k=0;k<matches.length;k++) {
        inner_html = inner_html.replace('{' + matches[k].text + '}', 
        this.iterateStaticModel(render_obj, matches[k].text));
    }

    return inner_html;

}

//Renders a component by generating the final HTML
App.prototype.renderComponent = function(comp_name) {

    var component = this.components.filter(comp => 
                                        comp.name == comp_name);
    if(component.length == 0) {
        console.error('The component ' + comp_name + ' is not present in the app');
        return;
    }
    else {
        component = component[0];
    }

    var comp_html = new DOMHelper().createElementFromHTML(component.html);
    component.rendered = comp_html;

    var all = comp_html.getElementsByTagName("*");
    for(var i=0;i<all.length;i++) {

        if(all[i].getAttribute('in') != null) {
            data_attrib = all[i].getAttribute('in');
            all[i].setAttribute("value", this.iterateStaticModel(component.model, data_attrib));

            //Bind onchange event to the element to reflect in model
            this.events.push({ handler: function(_this, my, value) {
                                            _this.update(_this.model, value, _this.path);
                                        },
                                data: {
                                    path: data_attrib,
                                    model: component.model,
                                    update: this.updateObject
                                },
                                my: null,
                                type: "change"
                            });
            all[i].setAttribute("changeevt", this.events.length - 1);

        }
        if(all[i].getAttribute('out') != null) { 

            data_attrib = all[i].getAttribute('out');

            var modelvalue = this.iterateStaticModel(component.model, data_attrib);

            if(!Array.isArray(modelvalue)) {
                var inner_html = this.renderTemplate(all[i].innerHTML,
                    this.iterateStaticModel(component.model, data_attrib));
    
                if(inner_html === all[i].innerHTML) {
                    all[i].innerHTML = 
                    this.iterateStaticModel(component.model, data_attrib);
                }
                else {
                    all[i].innerHTML = inner_html;
                }
            }
            else {
                //loop over elements and create new nodes
                //1. Child node to repeat -> child
                var children = all[i].getElementsByTagName("*");
                var child = children[0];
                if(children.length > 1) {
                    var super_child = document.createElement('div');
                    console.log(children);
                    children.forEach(element => {
                        super_child.appendChild(element);
                    });
                    child = super_child;
                }

                //2. Copy the child template for later use (component updation)
                this.looptemplates.push(child);
                all[i].setAttribute('ltid', (this.looptemplates.length - 1).toString());

                //3. Remove the existing children
                all[i].innerHTML = '';

                //4. Loop over the model elements and create children
                modelvalue.forEach(element => {
                    var curnode = child.cloneNode(true);
                    //5. Render the child
                    curnode.innerHTML = this.renderTemplate(curnode.innerHTML, element);

                    var _element = element;
                    var curnode_elems = curnode.getElementsByTagName("*");
                    if(curnode_elems.length == 0) {
                        curnode_elems = [curnode];
                    }
                    curnode_elems.forEach(element => {
                        //Event Binding - click
                        if(element.getAttribute('click') != null) {
                            var clickhandler = element.getAttribute('click');
                            this.events.push({ handler: this.iterateStaticModel(component.model, clickhandler),
                                                data: component.model,
                                                my: _element,
                                                type: "click"
                                            });
                            element.setAttribute("clickevt", this.events.length - 1);
                        }
                    });
                   
                    all[i].appendChild(curnode);
                });
            }
        }
        if(all[i].getAttribute('inout') != null) //two-way binding
            data_attrib = all[i].getAttribute('inout'); 

        //Event Binding - click
        if(all[i].getAttribute('click') != null) {
            var clickhandler = all[i].getAttribute('click');
            this.events.push({ handler: this.iterateStaticModel(component.model, clickhandler),
                                data: component.model,
                                my: null,
                                type: "click"
                            });
            all[i].setAttribute("clickevt", this.events.length - 1);
        }

        //Event Binding - change
        if(all[i].getAttribute('change') != null) {
            var clickhandler = all[i].getAttribute('change');
            this.events.push({ handler: this.iterateStaticModel(component.model, clickhandler),
                                data: component.model,
                                my: null,
                                type: "change"
                            });
            all[i].setAttribute("changeevt", this.events.length - 1);
        }
    }
 
    var child_comps = comp_html.getElementsByTagName("*");
    let dom_helper = new DOMHelper();
    for(var i=0;i<child_comps.length;i++) {
        if(child_comps[i].tagName.toLowerCase().indexOf('comp-') == 0) {

            var new_child = dom_helper.createElementFromHTML
            (this.renderComponent(child_comps[i].tagName.toLowerCase()));

            new_child.setAttribute('comp', child_comps[i].tagName.toLowerCase());

            child_comps[i].parentNode.replaceChild(new_child, child_comps[i]);
        }
    }
    
    component.html = comp_html.outerHTML;

    if(component.isRoot) {
        //Bind events based on clickevt props
        var _this = this;

        var clickhandlerfn = function(event) {
            if(event.srcElement.getAttribute("clickevt") != null) {
                _this.events[parseInt(event.srcElement.getAttribute("clickevt"))].handler(
                    _this.events[parseInt(event.srcElement.getAttribute("clickevt"))].data, 
                    _this.events[parseInt(event.srcElement.getAttribute("clickevt"))].my,
                );
                _this.updateApp();
            }
        };

        var changehandlerfn = function(event) {
            if(event.srcElement.getAttribute("changeevt") != null) {
                _this.events[parseInt(event.srcElement.getAttribute("changeevt"))].handler(
                    _this.events[parseInt(event.srcElement.getAttribute("changeevt"))].data,
                    _this.events[parseInt(event.srcElement.getAttribute("changeevt"))].my,
                    event.srcElement.value
                );
                _this.updateApp();
            }
        };

        this.postevents.push({
            action: function(data) {
                document.body.removeEventListener('click', data);
            },
            data: clickhandlerfn
        });

        this.postevents.push({
            action: function(data) {
                document.body.removeEventListener('change', data);
            },
            data: changehandlerfn
        });

        document.body.addEventListener('click', clickhandlerfn);
        document.body.addEventListener('change', changehandlerfn);

        this.root.innerHTML = component.html;

        this.updateApp();
    }

    return component.html;
}

////////////////////////////// DOM HELPER //////////////////////////////////

function DOMHelper() {}

DOMHelper.prototype.createElementFromHTML = function(html) {
    var div = document.createElement('div');
    if(html == null)
        return null;
    div.innerHTML = html.trim();
    return div.firstChild;
}

let app = new App();app.addComponent('comp-child', `<div>
    <ul out="arr">
        <li click="handleChildClick">{name}</li>
    </ul>
</div>`, {arr:[
            {name: "XYZ"},
            {name: "123"}
        ],handleChildClick: function(_this, my){
        console.log(my.name);
    },}, false);app.addComponent('comp-app', `<div>
    <ul out="users">
        <li click="handleElemClick">{fname} {lname}</li>
    </ul>

    <input in="fname" type="text"/>
    <input in="lname" type="text"/>
    <button click="handleAdd">Add</button>

    <comp-child></comp-child>
</div>`, {users:[{
            fname: "ABC", lname: "DEF"    
        }],fname:"",lname:"",handleAdd: function(_this, my){
        _this.users.push({
            fname: _this.fname,
            lname: _this.lname
        });
    },handleElemClick: function(_this, my){
        console.log(_this);
        alert(my.fname + ' ' + my.lname);
    },}, true);app.renderComponent('comp-app');