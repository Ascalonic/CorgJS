///////////////////////////// APP /////////////////////////////

var x = null;
var y = null;
document.addEventListener('mousemove', onMouseUpdate, false);

function onMouseUpdate(e) {
    x = e.pageX;
    y = e.pageY;
}

function getMouseX() {
    return x;
}

function getMouseY() {
    return y;
}
////////

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
    this.events = []; //to store events
    this.postevents = []; //to store event unbinding functions
    this.looptemplates = []; //to store templates for updating array elements
    this.ap_elems = []; //to store the Attribute Plugged Elements (APEs)
    this.comp_params = []; //to store the component parameters (attribs)
}

//clear the app root and re-render all
App.prototype.reRender = function() {

    this.root.innerHTML = '';
    this.events = [];
    this.looptemplates = [];
    this.ap_elems = [];
    this.comp_params = [];

    for(var i=0;i<this.postevents.length;i++) {
        this.postevents[i].action(this.postevents[i].data);
    }

    this.postevents = [];
    this.renderComponent('comp-app');
}

//Update the app to reflect model changes
App.prototype.updateApp = function(startroot, compname) {

    var updatequeue = []; //make the update Breadth-First

    var root = startroot;
    var component = null;

    if(compname == null) {
        compname = 'comp-app';

        if(root == null) {
            root = this.root;
            component = this.components[this.components.length - 1];
        }
    }
    else if(compname!=null) {

        component = this.components.filter(comp => 
            comp.name == compname)[0];

        if(root == null)
            root = startroot;
    }

    //Resolve the model
    if(root == this.root) {
        model = this.components.filter(comp => 
            comp.name == 'comp-app')[0].model;
    }
    else if(component!=null) {
        model = component.model;
    }

    if(component.model.onRefresh != null) {
        component.model.onRefresh(component.model);
    }

    //Update the AP Elements
    root.childNodes.forEach(element => {
        if(typeof element.getAttribute === 'function') {
            if(element.getAttribute('ap-elem')!=null) {
                var ap_elem = parseInt(element.getAttribute('ap-elem').toString());
                element.parentNode.replaceChild(this.ap_elems[ap_elem], element);
            }
        }
    });

    root.childNodes.forEach(element => {
        if(typeof element.getAttribute === 'function') {

            //plug-in attributes from model
            if(element.getAttribute('no-show')!=null) {
                var attr = element.getAttribute('no-show').toString();
                if(attr[0] == '{' && attr[attr.length - 1] == '}') {
                    attr = attr.substring(1, attr.length - 1);
                    var elem_copy = element.cloneNode(true);
                    this.ap_elems.push(elem_copy);
                    element.setAttribute('ap-elem', this.ap_elems.length -1);
                    element.setAttribute('no-show', this.iterateStaticModel(component.model, attr))
                }
            }

            if(element.getAttribute('no-show')!=null) {
                if(element.getAttribute('no-show') == 'true') {
                    
                    var placeholder = document.createElement('div');
                    if(element.getAttribute('ap-elem')!=null) {
                        var ap_elem = parseInt(element.getAttribute('ap-elem').toString());
                        placeholder.setAttribute('ap-elem', ap_elem);
                        element.parentNode.replaceChild(placeholder, element);
                    }
                }
            }

            if(element.getAttribute('comp')!=null) {

                updatequeue.push({element: element, compname: element.getAttribute('comp')});

                //this.updateApp(element, element.getAttribute('comp'));
            }
            else if(component!=null) {

                //Check for any component param update
                var component_params = this.comp_params.filter(comp => 
                    comp.comp == component.name)[0];

                if(component_params!=null) {
                    component.model.props[component_params.param_name] = 
                        this.iterateStaticModel(component_params.model, component_params.ptr);

                }
                //////

                this.updateApp(element, component.name);

                if(element.getAttribute('in') != null) {

                    data_attrib = element.getAttribute('in');

                    element.setAttribute("value", this.iterateStaticModel(model, data_attrib));
                    element.value= this.iterateStaticModel(model, data_attrib);

                }
                else if(element.getAttribute('out') != null) {

                    data_attrib = element.getAttribute('out');
        
                    var modelvalue = this.iterateStaticModel(component.model, data_attrib);
        
                    if(!Array.isArray(modelvalue)) {
                        var inner_html = this.renderTemplate(element.innerHTML,
                            this.iterateStaticModel(component.model, data_attrib));
            
                        if(inner_html === element.innerHTML) {
                            element.innerHTML = 
                            this.iterateStaticModel(component.model, data_attrib);
                        }
                        else {
                            element.innerHTML = inner_html;
                        }
                    }
                    else {
        
                        //1. Get the child template from looptemplates
                        var ltid = parseInt(element.getAttribute('ltid'));
                        var child = this.looptemplates[ltid];
        
                        //2. Remove the existing children
                        element.innerHTML = '';
                        
                        //3. Loop over the model elements and create children
                        modelvalue.forEach(modelelem => {
                            var curnode = child.cloneNode(true);
                            //4. Render the child
                            curnode.innerHTML = this.renderTemplate(curnode.innerHTML, modelelem);

                            var curnode_elems = curnode.getElementsByTagName("*");
                            curnode_elems = Array.prototype.slice.call(curnode_elems);

                            if(curnode_elems.length == 0) {
                                curnode_elems = [curnode];
                            }
                            else {
                                curnode_elems.push(curnode);
                            }

                            _element = modelelem;
                            for(var k=0;k<curnode_elems.length;k++) {
                                //Event Binding - click
                                if(curnode_elems[k].getAttribute('click') != null) {
                                    var clickhandler = curnode_elems[k].getAttribute('click');
                                    this.events.push({ handler: this.iterateStaticModel(component.model, clickhandler),
                                                        data: component.model,
                                                        my: _element,
                                                        type: "click"
                                                    });
                                    curnode_elems[k].setAttribute("clickevt", this.events.length - 1);
}
                            }

                            element.appendChild(curnode);
                        });
                        
                    }
                }
            }
            else {
                console.err('Component Updation failed for ' + element);
            }

            updatequeue.forEach(update => {
                this.updateApp(update.element, update.compname);
            });
        }
    });

    if(component.model.refreshFinished != null) {
        component.model.refreshFinished(component.model);
    }

}

//Iterate a model object and return the element pointed to by "path"
App.prototype.iterateStaticModel = function(model, path) {

    var stack = path.split('.');  
    while(stack.length>1){
        if(stack.toString().endsWith("]")) {
            var index = stack.toString().split('[')[1];
            index = index.substring(0, index.length - 1);
            index = parseInt(index);

            model = model[stack.toString().split('[')[0]];
            model =  model[index];
        }
        else {
            model = model[stack.shift()];
        }
    }

    if(stack.toString().endsWith("]")) {
        var index = stack.toString().split('[')[1];
        index = index.substring(0, index.length - 1);
        index = parseInt(index);
        model = model[stack.toString().split('[')[0]];
        return model[index];
    }
    else {
        return model[stack.shift()];
    }
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
                    child.inner_html = all[i].inner_html;
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

                    for(var k=0;k<curnode_elems.length;k++) {
                        //Event Binding - click
                        if(curnode_elems[k].getAttribute('click') != null) {
                            var clickhandler = curnode_elems[k].getAttribute('click');
                            this.events.push({ handler: this.iterateStaticModel(component.model, clickhandler),
                                                data: component.model,
                                                my: _element,
                                                type: "click"
                                            });
                                            
                            curnode_elems[k].setAttribute("clickevt", this.events.length - 1);
                        }
                    }
                   
                    all[i].appendChild(curnode);
                });
            }
        }
        if(all[i].getAttribute('inout') != null) //two-way binding
            data_attrib = all[i].getAttribute('inout'); 

        //Event Binding - click
        if(all[i].getAttribute('click') != null && all[i].getAttribute('clickevt')==null) {
            var clickhandler = all[i].getAttribute('click');
            this.events.push({ handler: this.iterateStaticModel(component.model, clickhandler),
                                data: component.model,
                                my: null,
                                type: "click"
                            });
            all[i].setAttribute("clickevt", this.events.length - 1);
        }

        //Event Binding - change
        if(all[i].getAttribute('change') != null&& all[i].getAttribute('changeevt')==null) {
            var clickhandler = all[i].getAttribute('change');
            this.events.push({ handler: this.iterateStaticModel(component.model, clickhandler),
                                data: component.model,
                                my: null,
                                type: "change"
                            });
            all[i].setAttribute("changeevt", this.events.length - 1);
        }

        //Event Binding - Keydown
        if(all[i].getAttribute('keydown') != null&& all[i].getAttribute('keydownevt')==null) {
            var clickhandler = all[i].getAttribute('keydown');
            this.events.push({ handler: this.iterateStaticModel(component.model, clickhandler),
                                data: component.model,
                                my: null,
                                type: "keydown"
                            });
            all[i].setAttribute("keydownevt", this.events.length - 1);
        }
    }
 
    var child_comps = comp_html.getElementsByTagName("*");
    let dom_helper = new DOMHelper();
    for(var i=0;i<child_comps.length;i++) {
        if(child_comps[i].tagName.toLowerCase().indexOf('comp-') == 0) {

            //Get all attribs of the tag and plug it into the model
            var child_component = this.components.filter(comp => 
                comp.name == child_comps[i].tagName.toLowerCase())[0];

            var attrs = new DOMHelper().getAllAttributes(child_comps[i]);

            attrs.forEach(attr => {
                if(child_component.model.props == null) child_component.model.props = {};
                if(attr.value[0] == '{' && attr.value[attr.value.length - 1] == '}') {
                    //resolve value from current component's model
                    var attr_model_ptr = attr.value.substring(1, attr.value.length - 1);
                    
                    this.comp_params.push({comp: child_comps[i].tagName.toLowerCase(), 
                        model: component.model, 
                        ptr: attr_model_ptr,
                        param_name: attr.name});

                    child_component.model.props[attr.name] = 
                    this.iterateStaticModel(component.model, attr_model_ptr);
                }
                else {
                    child_component.model.props[attr.name] = attr.value;
                }
            });
            ////////

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
                document.elementFromPoint(getMouseX(), getMouseY()).click();
                _this.updateApp();
            }
        };

        var keydownhandlerfn = function(event) {
            if(event.srcElement.getAttribute("keydownevt") != null) {
                _this.events[parseInt(event.srcElement.getAttribute("keydownevt"))].handler(
                    _this.events[parseInt(event.srcElement.getAttribute("keydownevt"))].data,
                    _this.events[parseInt(event.srcElement.getAttribute("keydownevt"))].my,
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

        this.postevents.push({
            action: function(data) {
                document.body.removeEventListener('keydown', data);
            },
            data: keydownhandlerfn
        });
        

        document.body.addEventListener('click', clickhandlerfn);
        document.body.addEventListener('change', changehandlerfn);
        document.body.addEventListener('keydown', keydownhandlerfn);

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

DOMHelper.prototype.getAllAttributes = function(el) {
    var ret = [];
    for(var att, i=0, atts = el.attributes, n = atts.length; i<n; i++) {
        att = atts[i];
        ret.push({name: att.nodeName, value: att.nodeValue.toString()});
    }
    return ret;
}

let app = new App();