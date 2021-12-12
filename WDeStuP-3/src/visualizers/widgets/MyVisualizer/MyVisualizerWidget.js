/*globals define, WebGMEGlobal*/

/**
 * Generated by VisualizerGenerator 1.7.0 from webgme on Sat Nov 28 2020 22:21:18 GMT-0600 (北美中部标准时间).
 */

define(['jointjs','css!./styles/MyVisualizerWidget.css','css!jointjscss'], function (jointjs) {
    'use strict';

    var WIDGET_CLASS = 'my-visualizer';
    const pn = jointjs.shapes.pn;

    function MyVisualizerWidget(logger, container) {
        console.log(jointjs);
        this._logger = logger.fork('Widget');

        this._el = container;

        this.nodes = {};
        this._initialize();

        this._logger.debug('ctor finished');
    }

    function collectInplaces(transition,arcs1) {
        let inplaces = [];
        for (let i = 0; i < arcs1.length; i++) {
            if (arcs1[i].getTargetElement() === transition) {
                inplaces.push(arcs1[i].getSourceElement());
            }
        }
        return inplaces;
    };


    function collectOutplaces(transition,arcs2) {
        let outplaces = [];
        for (let i = 0; i < arcs2.length; i++) {
            if (arcs2[i].getSourceElement() === transition) {
                outplaces.push(arcs2[i].getTargetElement());
            }
        }
        return outplaces;
    };

    MyVisualizerWidget.prototype._initialize = function () {
        var width = this._el.width(),
            height = this._el.height(),
            self = this;

        this._el.addClass(WIDGET_CLASS);
        this._graph = null;
        this._paper = null;
        this._graph = new jointjs.dia.Graph();
        this._paper = new jointjs.dia.Paper({
            el: $(this._el),
            width: width,
            height: height,
            gridSize: 10,
            defaultAnchor: {name:'perpendicular'},
            defaultConnectionPoint: {name:'boundary'},
            model: this._graph
        });

        this._paper.setInteractivity(false);
        this._paper.removeTools();

        this._paper.on('element:pointerdown',function(elementView) {
            var currentElement = elementView.model;
            console.log(currentElement);
            if (currentElement['attributes']['type'] === "pn.Transition") {
                console.info(isFirable(currentElement,this._arcs1,this._arcs2));
                if (isFirable(currentElement,this._arcs1,this._arcs2)) {
                    console.info("Fire!")
                    fireTransition(currentElement,this._arcs1,this._arcs2);
                    updateTransitions(this._transitions,this._arcs1,this._arcs2);
                }
            };
        });
    };

    function isFirable(transition,arcs1,arcs2) {
        let inplaces = collectInplaces(transition,arcs1),
            outplaces = collectOutplaces(transition,arcs2),
            flag = true;
        for (let i = 0; i < inplaces.length; i++) {
            flag = (flag && (inplaces[i].get('tokens') > 0));
        };
        flag = (flag && (inplaces.length > 0) && (outplaces.length > 0));
        return flag;
    };

    //=============================================================
    // this fire function would be invoked if users click on a enable transition
    function fireTransition(transition,arcs1,arcs2) {
        let inplaces = collectInplaces(transition,arcs1),
            outplaces = collectOutplaces(transition,arcs2);
        for (let i = 0; i < inplaces.length; i++) {
            inplaces[i].set('tokens',inplaces[i].get('tokens') - 1);
        }
        for (let i = 0; i < outplaces.length; i++) {
            outplaces[i].set('tokens',outplaces[i].get('tokens') + 1);
        }
    }


    MyVisualizerWidget.prototype.onWidgetContainerResize = function (width, height) {

        this._logger.debug('Widget is resizing...');
        if (this._paper) {
            this._paper.setDimensions(width,height);
            this._paper.scaleContentToFit();
        }

    };

    // Adding/Removing/Updating items
    MyVisualizerWidget.prototype.addNode = function (desc) {
    };

    MyVisualizerWidget.prototype.removeNode = function (gmeId) {
    };

    MyVisualizerWidget.prototype.updateNode = function (desc) {
    };

    MyVisualizerWidget.prototype.processPluginMessage = function (nums,pluginMessage) {

        //console.info(nums);
        //console.info(pluginMessage);
        let message_places = [],
            message_transitions = [],
            message_arcs1 = [],
            message_arcs2 = [];

        function checkPath(list,target_path) {
            for (let j = 0; j < list.length; j++) {
                if (list[j]['path'] === target_path) {
                    return j;
                }
            }
        };
        for (let i = 0; i < pluginMessage.length; i++) {
            let message_split = pluginMessage[i].split(" ");
            if (i < nums[0]) {
                message_places.push({'name':message_split[0],'path':message_split[1],'marking':parseInt(message_split[2])});
            }
            else if (i >= nums[0] && i < (nums[0] + nums[1])) {
                message_transitions.push({'name':message_split[0],'path':message_split[1]});
            }
            else if (i >= (nums[0] + nums[1]) && i < (nums[0] + nums[1] + nums[2])) {
                message_arcs1.push({'name':message_split[0],'path':message_split[1],'src':checkPath(message_places,message_split[2]),'dst':checkPath(message_transitions,message_split[3])});
            }
            else {
                message_arcs2.push({'name':message_split[0],'path':message_split[1],'src':checkPath(message_transitions,message_split[2]),'dst':checkPath(message_places,message_split[3])});
            }
        }
        return {'message_places':message_places,'message_transitions':message_transitions,'message_arcs1':message_arcs1,'message_arcs2':message_arcs2};
    };

    function updateTransitions(transitions,arcs1,arcs2) {
        for (let i = 0; i < transitions.length; i++) {
            if (isFirable(transitions[i],arcs1,arcs2)) {
                transitions[i].attr('.root/fill', '#228b22');
                transitions[i].attr('.root/stroke', '#228b22');
                transitions[i].attr('.label/fill', '#228b22');
            } else {
                transitions[i].attr('.root/fill', '#dc143c');
                transitions[i].attr('.root/stroke', '#dc143c');
                transitions[i].attr('.label/fill', '#dc143c');
            }
        };
    };

    //=============================================================
    // for initialize the whole model
    MyVisualizerWidget.prototype.initNetwork = function (nums,pluginMessage) {

        var places = [],
            transitions = [],
            arcs1 = [],
            arcs2 = [];
        var obj = this.processPluginMessage(nums,pluginMessage);
        var message_places = obj['message_places'],
            message_transitions = obj['message_transitions'],
            message_arcs1 = obj['message_arcs1'],
            message_arcs2 = obj['message_arcs2'];

        console.info(message_arcs1);
        //console.info(message_arcs2);
        console.info(nums);

        for (let i = 0; i < nums[0]; i++) {
            var place = new pn.Place({
                position: {
                    x:200,
                    y:100*(i+1)
                },
                attrs:{
                    '.label': {
                        text: message_places[i]['name'] + "-" + message_places[i]['marking'],
                        fill: '#7c68fc'
                    },
                    '.root': {
                        'stroke':'#9856fd',
                        'stroke-width':3
                    },
                    '.tokens > circle': {
                        'fill': '#000000'
                    }
                },
                tokens: message_places[i]['marking']
            });
            places.push(place);
        };

        for (let i = 0; i < nums[1]; i++) {
            var transition = new pn.Transition({
                position: {x:400,y:100*(i+1)},
                attrs:{
                    '.label': {
                        'text': message_transitions[i]['name'],
                        'fill': '#dc143c'
                    },
                    '.root': {
                        'fill':'#dc143c',
                        'stroke':'#dc143c'
                    }
                }
            });
            transitions.push(transition);
        };

        for (let i = 0; i < nums[2]; i++) {
            var link1 = this.createPNLink(places[message_arcs1[i]['src']],transitions[message_arcs1[i]['dst']]);
            arcs1.push(link1);
        };

        for (let i = 0; i < nums[3]; i++) {
            var link2 = this.createPNLink(transitions[message_arcs2[i]['src']],places[message_arcs2[i]['dst']]);
            arcs2.push(link2);
        };

        this._paper._places = places;
        this._paper._transitions = transitions;
        this._paper._arcs1 = arcs1;
        this._paper._arcs2 = arcs2;

        this._graph.addCell(this._paper._places);
        this._graph.addCell(this._paper._transitions);
        this._graph.addCell(this._paper._arcs1);
        this._graph.addCell(this._paper._arcs2);

        updateTransitions(this._paper._transitions,this._paper._arcs1,this._paper._arcs2);

    };

    //=============================================================
    // for updating the colors of transtions (usually after firing operations)


    //=============================================================
    // for creating PN links, just a wrapper of link attributes
    // borrowed from "https://github.com/clientIO/joint/blob/master/demo/petri%20nets/src/pn.js"
    MyVisualizerWidget.prototype.createPNLink = function (a,b) {
        return new pn.Link({
            source: { id: a.id, selector: '.root' },
            target: { id: b.id, selector: '.root' },
            attrs: {
                '.connection': {
                    'fill': 'none',
                    'stroke-linejoin': 'round',
                    'stroke-width': '2',
                    'stroke': '#000000'
                }
            }
        });
    };

    /* * * * * * * * Visualizer event handlers * * * * * * * */
    MyVisualizerWidget.prototype.onElementClick = function (elementView,event) {
        event.stopPropagation();
        console.log(elementView);
    };

    /* * * * * * * * Visualizer life cycle callbacks * * * * * * * */
    MyVisualizerWidget.prototype.destroy = function () {
    };

    MyVisualizerWidget.prototype.onActivate = function () {
        this._logger.debug('MyVisualizerWidget has been activated');
    };

    MyVisualizerWidget.prototype.onDeactivate = function () {
        this._logger.debug('MyVisualizerWidget has been deactivated');
    };

    return MyVisualizerWidget;
});