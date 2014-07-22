this.objCount = 0;
this.selectedObject;

var lastPointerPosition, lastPointerDownTime, lastPointerDownID, tileHeight;

this.initialize = function() {
    this.camera.transform = [
        -0.6877578496932983,0.7259325385093689,2.705990027607186e-7,0,
        -0.6843284964561462,-0.6483430862426758,-0.3336801826953888,0,
        -0.24222907423973083,-0.2294914275407791,0.9426885843276978,0,
        100,100.00012969970703,50.0000114440918,1
    ];

    this.camera.far = 10000;

    this.future( 0 ).onSceneReady();
}

this.onSceneReady = function() {
    this.setUpListeners();
}

this.setUpListeners = function() {
    var scene = this;

    this.editTool.grid.gridUpdated = function() {
        scene.removeEditToolGrid();
        scene.createEditToolGrid();
    }

    this.editTool.grid.gridMoved = function( lastOrigin ) {
        var scene = this.find( "/" )[ 0 ];
        var diff = [
            this.gridOriginInSpace[ 0 ] - lastOrigin[ 0 ],
            this.gridOriginInSpace[ 1 ] - lastOrigin[ 1 ]
        ];
        scene.graph.editToolGrid.translateBy( [ diff[ 0 ], diff[ 1 ], 0 ] );
    }
}

this.createEditToolGrid = function() {
    var grid = this.editTool.grid;
    var ORIGIN_COLOR = [ 220, 220, 255 ];
    var PASSABLE_COLOR = [ 220, 255, 220 ];
    var IMPASSABLE_COLOR = [ 255, 220, 220 ];
    var OPACITY = 0.5;
    var NORMAL = [ 0, 0, 1 ];
    var ROTATION = 90;
    var RENDERTOP = true;
    var SIZE = 0.9;
    var origin, name, color;
    var tiles = new Array;

    var offset = new Array(); 
    offset.push( grid.gridOriginInSpace[ 0 ] / grid.gridSquareLength );
    offset.push( grid.gridOriginInSpace[ 1 ] / grid.gridSquareLength );

    for ( var x = 0; x < grid.boundaryValues.length; x++ ) {

        for ( var y = 0; y < grid.boundaryValues[ x ].length; y++ ) {

            name = "tile_" + x + "_" + y;

            origin = [
                offset[ 0 ] + ( x ),
                offset[ 1 ] + ( y ),
                0
            ];

            if ( x === 0 && y === 0 ) {
                color = ORIGIN_COLOR;
            } else {
                color = grid.boundaryValues[ x ][ y ] === -1 ? IMPASSABLE_COLOR : PASSABLE_COLOR;
            }

            tiles.push( { 
                "plane": {
                "origin": origin,
                "normal": NORMAL,
                "rotationAngle": ROTATION,
                "size": SIZE,
                "color": color,
                "opacity": OPACITY,
                "renderTop": RENDERTOP
            } } );

        }

    }

    this.graph.graphGroup(
        this.graph.tileVisible,
        tiles,
        "editToolGrid"
    );
}

this.removeEditToolGrid = function() {
    if ( this.graph.editToolGrid ) {
        this.graph.children.delete( this.graph.editToolGrid );
    }
}

this.createGridDisplay = function( grid ) {
    var PASSABLE_COLOR = [ 220, 255, 220 ];
    var IMPASSABLE_COLOR = [ 255, 220, 220 ];
    var OPACITY = 0.5;
    var NORMAL = [ 0, 0, 1 ];
    var ROTATION = 90;
    var RENDERTOP = false;
    var SIZE = 0.9;
    var origin, name, color;
    var tiles = new Array;

    var offset = new Array(); 
    offset.push( grid.gridOriginInSpace[ 0 ] / grid.gridSquareLength );
    offset.push( grid.gridOriginInSpace[ 1 ] / grid.gridSquareLength );

    for ( var x = 0; x < grid.boundaryValues.length; x++ ) {

        for ( var y = 0; y < grid.boundaryValues[ x ].length; y++ ) {

            name = "tile_" + x + "_" + y;

            origin = [
                offset[ 0 ] + ( x ),
                offset[ 1 ] + ( y ),
                0
            ];

            color = grid.boundaryValues[ x ][ y ] === -1 ? IMPASSABLE_COLOR : PASSABLE_COLOR;

            tiles.push( { 
                "plane": {
                "origin": origin,
                "normal": NORMAL,
                "rotationAngle": ROTATION,
                "size": SIZE,
                "color": color,
                "opacity": OPACITY,
                "renderTop": RENDERTOP
            } } );

        }

    }

    this.graph.graphGroup(
        this.graph.tileVisible,
        tiles
    );
}

this.removeGridDisplay = function() {
    var graph = this.graph;

    for ( var obj in graph.children ) {
        graph.children.delete( graph.children[ obj ] );
    }
}

this.loadMap = function( path ) {
    if ( this.map ) {
        this.deleteMap();
    }

    this.future( 0 ).createObject( "map", path );
}

this.deleteMap = function() {
    this.children.delete( this.map );
}

this.loadObject = function( path, name ) {
    if ( this.selectedObject !== undefined ) {
        this.deselectObject();
    }

    var objectName = "object_" + this.objCount++;
    var callback = function( object ) {
        this.grid.addToGridFromWorld( object, [ 0, 0, 0 ] );
    }

    this.future( 0 ).createObject( objectName, path, name, callback );
}

this.deleteObject = function( objectID ) {
    var object = this.findByID( this, objectID );
    if ( object !== undefined ) {
        if ( this.selectedObject && object.id === this.selectedObject.id ) {
            this.deselectObject();
        }
        this.children.delete( object );
    }
}

this.createObject = function( objName, path, name, callback ) {
    var objDef = {
        "extends": path,
        "properties": {}
    }

    if ( objName !== "map" ) {
        objDef[ "implements" ] = "editor/editable.vwf";
        objDef.properties[ "nameString" ] = name;
    }

    this.children.create( objName, objDef, callback );
}

this.setActiveTool = function( toolID ) {
    this.activeTool = toolID;
}

this.useTool = function( eventType, pointerInfo, pickInfo ) {
    switch ( this.activeTool ) {
        case "camera":
            if ( eventType === "pointerClick" && pointerInfo.button === "left" ) {
                var object = this.findByID( this, pickInfo.pickID );
                if ( object && object.isEditable ) {
                    this.selectObject( object );
                } else {
                    this.deselectObject();
                }
            }
            break;
        case "translate":
            if ( eventType === "pointerDown" && pointerInfo.buttons.left && this.selectedObject ) {
                lastPointerPosition = pointerInfo.screenPosition;
            } else if ( eventType === "pointerMove" && pointerInfo.buttons.left && this.selectedObject ) {
                if ( lastPointerPosition[ 0 ] !== pointerInfo.screenPosition[ 0 ] ||
                     lastPointerPosition[ 1 ] !== pointerInfo.screenPosition[ 1 ] ) {
                    this.drag( pickInfo );
                    lastPointerPosition = pointerInfo.screenPosition;
                }
            } else if ( eventType === "pointerClick" && pointerInfo.button === "left" ) {
                var object = this.findByID( this, pickInfo.pickID );
                if ( object && object.isEditable ) {
                    this.selectObject( object );
                } else {
                    this.deselectObject();
                }
            }
            break;
        case "rotate":
            if ( eventType === "pointerDown" && pointerInfo.buttons.left && this.selectedObject ) {
                if ( this.selectedObject.isOnGrid ) {
                    lastPointerPosition = pointerInfo.position[ 0 ];
                }
            } else if ( eventType === "pointerMove" && pointerInfo.buttons.left && this.selectedObject ) {
                if ( this.selectedObject.isOnGrid ) {
                    var delta = pointerInfo.position[ 0 ] - lastPointerPosition;
                    if ( delta > 0.05 || delta < -0.05 ) {
                        this.selectedObject.rotateObstacle( delta );
                        this.grid.removeFromGrid( this.selectedObject, 
                            this.selectedObject.currentGridSquare );
                        this.grid.addToGridFromCoord( this.selectedObject, 
                            this.selectedObject.currentGridSquare );
                        this.editTool.grid.updateGrid( this.selectedObject );
                        lastPointerPosition = pointerInfo.position[ 0 ];
                    }
                }
            } else if ( eventType === "pointerUp" ) {
                lastPointerPosition = undefined;
            } else if ( eventType === "pointerClick" && pointerInfo.button === "left" ) {
                var object = this.findByID( this, pickInfo.pickID );
                if ( object && object.isEditable ) {
                    this.selectObject( object );
                } else {
                    this.deselectObject();
                }
            }
            break;
        case "raise_lower":
            if ( eventType === "pointerDown" && pointerInfo.buttons.left && this.selectedObject ) {
                if ( this.selectedObject.isOnGrid ) {
                    if ( this.map ) {
                        var origin = this.selectedObject.translation;
                        origin[ 2 ] += 15;
                        var picks = this.raycast( origin, [ 0, 0, -1 ], 0, Infinity, true, this.map );
                        if ( picks[ 0 ] ) {
                            tileHeight = picks[ 0 ].point.z;
                        } else {
                            tileHeight = 0;
                        }
                    } else {
                        tileHeight = 0;
                    }
                    lastPointerPosition = pointerInfo.position[ 1 ];
                }
            } else if ( eventType === "pointerMove" && pointerInfo.buttons.left && this.selectedObject ) {
                if ( this.selectedObject.isOnGrid && !isNaN( tileHeight ) ) {
                    var cameraPos = new THREE.Vector3(
                            this.camera.worldTransform[ 12 ],
                            this.camera.worldTransform[ 13 ],
                            this.camera.worldTransform[ 14 ]
                        );
                    var targetPos = new THREE.Vector3(
                            this.selectedObject.worldTransform[ 12 ],
                            this.selectedObject.worldTransform[ 13 ],
                            this.selectedObject.worldTransform[ 14 ]
                        );
                    var height = cameraPos.distanceTo( targetPos );
                    var delta = ( pointerInfo.position[ 1 ] - lastPointerPosition ) / 1.5;
                    var trans = this.selectedObject.translation;
                    var adj = trans[ 2 ] - ( height * delta );
                    this.selectedObject.translateTo( [ trans[ 0 ], trans[ 1 ], adj ] );
                    lastPointerPosition = pointerInfo.position[ 1 ];
                }
            } else if ( eventType === "pointerUp" ) {
                tileHeight = undefined;
                lastPointerPosition = undefined;
            } else if ( eventType === "pointerClick" && pointerInfo.button === "left" ) {
                var object = this.findByID( this, pickInfo.pickID );
                if ( object && object.isEditable ) {
                    this.selectObject( object );
                } else {
                    this.deselectObject();
                }
            }
            break;
        case "delete":
            if ( eventType === "pointerClick" && pointerInfo.button === "left" ) {
                var object = this.findByID( this, pickInfo.pickID );
                if ( object && object.isEditable ) {
                    this.requestDelete( object.id, object.nameString );
                } else {
                    this.deselectObject();
                }
            }
            break;
        default:
            if ( eventType === "pointerClick" && pointerInfo.button === "left" ) {
                var object = this.findByID( this, pickInfo.pickID );
                if ( object && object.isEditable ) {
                    this.selectObject( object );
                } else {
                    this.deselectObject();
                }
            }
            break;
    }
}

this.drag = function( pickInfo ) {
    this.selectedObject.terrainName = this.map.name;
    var coord, curCoord;

    if ( pickInfo.pickID !== this.selectedObject.id ) {
        coord = this.grid.getGridFromWorld( pickInfo.globalPosition );
    } else {
        var origin = pickInfo.globalSource;
        var normal = pickInfo.pointerVector;
        if ( origin && normal ) {
            var intersects = this.raycast( origin, normal, 0, Infinity, true, this.map );
            var nearest = findNearestOther( this.selectedObject, intersects );
            if ( nearest ) {
                var point = [
                    nearest.point.x,
                    nearest.point.y,
                    nearest.point.z
                ];
                coord = this.grid.getGridFromWorld( point );
            }
        }
    }

    curCoord = this.selectedObject.currentGridSquare;

    if ( coord[ 0 ] === curCoord[ 0 ] && coord[ 1 ] === curCoord[ 1 ] ) {
        return;
    }

    if ( this.selectedObject.isOnGrid ) {
        this.grid.removeFromGrid( this.selectedObject, this.selectedObject.currentGridSquare );
    }

    this.grid.addToGridFromCoord( this.selectedObject, coord );
    this.editTool.grid.moveGridOrigin( coord );
}

this.stopDrag = function( pointerInfo, pickInfo ) {
    if ( !this.selectedObject ) {
        return;
    }

    this.selectedObject = undefined;
}

this.selectObject = function( object ) {
    if ( this.editTool.selectedObjectId === object.id ) {
        this.deselectObject();
    } else {
        this.editTool.grid.updateGrid( object );
        this.editTool.selectedObjectId = object.id;
        this.selectedObject = object;
    }
}

this.deselectObject = function() {
    this.removeEditToolGrid();
    this.editTool.selectedObjectId = undefined;
    this.selectedObject = undefined;
}

this.pointerOver = function( pointerInfo, pickInfo ) {
    if ( pickInfo.pickID !== lastPointerDownID ) {
        lastPointerDownID = undefined;
        lastPointerDownTime = undefined;
    }
    this.useTool( "pointerOver", pointerInfo, pickInfo );
}

this.pointerOut = function( pointerInfo, pickInfo ) {
    lastPointerDownID = undefined;
    lastPointerDownTime = undefined;
    this.useTool( "pointerOut", pointerInfo, pickInfo );
}

this.pointerDown = function( pointerInfo, pickInfo ) {
    lastPointerDownID = pickInfo.pickID;
    lastPointerDownTime = vwf_view.kernel.time();
    this.useTool( "pointerDown", pointerInfo, pickInfo );
}

this.pointerUp = function( pointerInfo, pickInfo ) {
    this.useTool( "pointerUp", pointerInfo, pickInfo );
}

this.pointerClick = function( pointerInfo, pickInfo ) {
    var time = vwf_view.kernel.time();
    if ( lastPointerDownID && time - lastPointerDownTime < 0.25 ) {
        this.useTool( "pointerClick", pointerInfo, pickInfo );
    }
}

this.pointerMove = function( pointerInfo, pickInfo ) {
    if ( pickInfo.pickID !== lastPointerDownID ) {
        lastPointerDownID = undefined;
        lastPointerDownTime = undefined;
    }
    this.useTool( "pointerMove", pointerInfo, pickInfo );
}

function findNearestOther( dragObj, picks ) {
    for ( var i = 0; i < picks.length; i++ ) {
        var pickID = findNodeID( picks[ i ].object );
        if ( pickID !== dragObj.id ) {
            return picks[ i ];
        }
    }

    return undefined;
}

function findNodeID( object ) {
    var id = undefined;

    while ( !id && object ) {
        if ( object.vwfID ) {
            id = object.vwfID;
        } else {
            object = object.parent;
        }
    }

    return id;
}
//@ sourceURL=editor/scene.js