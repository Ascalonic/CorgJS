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
}

//Iterate a model object and return the element pointed to by "path"
App.prototype.iterateStaticModel = function(model, path) {
    
    var var_segs = path.split('.'); var model_ptr = model; 
    for(var j=0;j<var_segs.length;j++) {

        //Array element
        if(/[A-Za-z0-9]*\[[0-9]+\]$/.test(var_segs[j])) {
            var var_strip = var_segs[j].substring(0, var_segs[j].indexOf('['));
            model_ptr = model_ptr[var_strip];
            model_ptr = model_ptr[parseInt(var_segs[j].
                substring(var_segs[j].indexOf('[') + 1, 
            var_segs[j].indexOf(']')))];
        }
        else {
            model_ptr = model_ptr[var_segs[j]];
        }
    }

    return model_ptr;
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

    var all = comp_html.getElementsByTagName("*");
    for(var i=0;i<all.length;i++) {

        if(all[i].getAttribute('in') != null) {
            data_attrib = all[i].getAttribute('in');
        }
        if(all[i].getAttribute('out') != null) { 

            data_attrib = all[i].getAttribute('out');

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
        if(all[i].getAttribute('inout') != null) //two-way binding
            data_attrib = all[i].getAttribute('inout'); 

        //Event Binding - onclick
        if(all[i].getAttribute('clickhandler') != null) {
            var clickhandler = all[i].getAttribute('clickhandler');
            this.events.push({ handler: this.iterateStaticModel(component.model, clickhandler),
                                data: component.model
                            });
            all[i].setAttribute("bindevent", this.events.length - 1);
        }
    }
 
    var child_comps = comp_html.getElementsByTagName("*");
    let dom_helper = new DOMHelper();
    for(var i=0;i<child_comps.length;i++) {
        if(child_comps[i].tagName.toLowerCase().indexOf('comp-') == 0) {
            child_comps[i].parentNode.replaceChild(dom_helper.createElementFromHTML
                (this.renderComponent(child_comps[i].tagName.toLowerCase())), child_comps[i]);
        }
    }
    
    component.html = comp_html.outerHTML;

    if(component.isRoot) {
        //Bind events based on bindevent props
        var _this = this;
        document.body.addEventListener('click', function(event) {
            if(event.srcElement.getAttribute("bindevent") != null) {
                _this.events[parseInt(event.srcElement.getAttribute("bindevent"))].handler(
                    _this.events[parseInt(event.srcElement.getAttribute("bindevent"))].data
                );
            }
        });

        this.root.innerHTML = component.html;
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
    <p out="sum" clickhandler="handleDisplaySum"></p>
    <button clickhandler="handleChangeSum">Change</button>
</div>`, {sum:50,handleChangeSum: function(_this){
        _this.sum = 25;
    },handleDisplaySum: function(_this){
        console.log(_this.sum);
    },}, false);app.addComponent('comp-app', `<div>
    <p out="users[0]" >{fname} {lname}</p>
    <p out="users[1]">{fname} {lname}</p>
    <comp-child></comp-child>
    <button id="btn-test" clickhandler="handleButtonClick">OK</button>
</div>`, {users:[
            {
                fname: "ABC",
                lname: "XYZ"
            },
            {
                fname: "123",
                lname: "PQR"
            }
        ],handleButtonClick: function(_this){
        console.log(_this.users);
    },}, true);app.renderComponent('comp-app');