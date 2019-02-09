const fs = require('fs');
const esprima = require('esprima');

//Create the SPA bundle from the source files in "App" directory
module.exports = {

    initStatic: function() {
        fs.copyFileSync('src/index.html', 'public/index.html');
        fs.copyFileSync('corg/main.js', 'public/main.js');
    },

    finalizeStatic: function() {
        fs.appendFileSync('public/main.js', 
                "app.renderComponent('comp-app');");
    },

    createStatic: function(path) {
       
        var bundle = ''; var model = '{'; var new_comp = {};

        fs.readdirSync(path).forEach(file => {
            if(file.indexOf('.') == -1) {
                //Directory encasing an app
                this.createStatic(path + '/' + file);
            }
            else {
                var segs = file.split('.');
                var ext = segs[segs.length - 1];
                new_comp.compname = 'comp-' + segs[0];
                new_comp.isRoot = segs[0] == 'app';

                if(ext == 'html' || ext == 'htm') {
                    //View file
                    new_comp.view = fs.readFileSync(path + '/' + file).toString();
                }
                else if(ext == 'js') {
                    //Class file - compile with esprima
                    var source = fs.readFileSync(path + '/' + file).toString();
                    source = this.replaceThis(source);

                    var parsed = esprima.parseScript(source, {range: true});
                    if(parsed.body.length > 0 && parsed.body[0].type == 'ClassDeclaration') {
                        var classbody = parsed.body[0].body.body;
                        classbody.forEach((value, index, array) => {
                            if(value.type == 'MethodDefinition' && value.key.name == 'constructor') {
                                //Add all the vars as keys to model
                                var statements = value.value.body.body;
                                statements.forEach((value, index, array) => {
                                    if(value.type == 'ExpressionStatement' && 
                                        value.expression.type == 'AssignmentExpression') {
                                            var prop = value.expression.left.property;
                                            var prop_value = value.expression.right;
                                            model += prop.name + ':';
                                            model += source.substring(prop_value.range[0],
                                                prop_value.range[1]) + ',';
                                    }
                                });
                            }
                            else if(value.type == 'MethodDefinition') {
                                model += value.key.name + ': function(_this, my';
                                var body = source.substring(value.value.body.range[0],
                                    value.value.body.range[1]);
                                model = value.value.params.length > 0 ? model + ',' : model;
                                for(var p = 0;p<value.value.params.length;p++) {
                                    model += value.value.params[p].name;
                                    if(p < value.value.params.length - 1) model += ',';
                                }
                                model += ')' + body + ',';
                            }
                        });
                    }
                    else {
                        console.error("No Class Declaration found for component comp-" + segs[0]);
                    }
                }
                else if(ext == 'css') {
                    //style file
                    new_comp.style = fs.readFileSync(path + '/' + file).toString();
                }
            }
        })

        model += '}';
        new_comp.model = model;

        fs.appendFileSync('public/main.js', this.getComponentEndCode(new_comp));
    },

    getComponentEndCode: function(component) {
        var ret = 'app.addComponent(';
        ret += "'" + component.compname + "', ";
        ret += '`' + component.view + '`, ';
        ret += component.model + ', ' + component.isRoot.toString() + ');'

        console.log(ret);
        return ret;
    },

    replaceThis: function(source) {
        var ret = ''; var state = 0;

        for(var i=0;i<source.length;i++) {
            var curchar = source.charAt(i);
            if(state == 0) {
                if(curchar == 't') {
                    state = 1;
                    start = i;
                }
                else {
                    ret += curchar;
                }
            }
            else if(state == 1) {
                if(curchar == 'h') {
                    state = 2;
                }
                else {
                    ret += 't' + curchar;
                    state = 0;
                }
            }
            else if(state == 2) {
                if(curchar == 'i') {
                    state = 3;
                }
                else {
                    ret += 'th' + curchar;
                    state = 0;
                }
            }
            else if(state == 3) {
                if(curchar == 's') {
                    state = 4;
                }
                else {
                    ret += 'thi' + curchar;
                    state = 0;
                }
            }
            else if(state == 4) {
                if(/[^a-zA-Z0-9]/.test(curchar.toString())) {
                    //"this" has occured - replace
                    ret += '_this' + curchar;
                    state = 0;
                }
                else {
                    ret += 'this' + curchar;
                    state = 0;
                }
            }
        }

        return ret;
    }
}