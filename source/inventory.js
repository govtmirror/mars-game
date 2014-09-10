// Copyright 2014 Lockheed Martin Corporation
//
// Licensed under the Apache License, Version 2.0 (the "License"); you may 
// not use this file except in compliance with the License. You may obtain 
// a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software 
// distributed under the License is distributed on an "AS IS" BASIS, 
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and 
// limitations under the License.

this.add = function( object ) {
    var index = this.slots.length;
    if ( !validIndex( index, this.capacity ) ) {
        return;
    }
    if ( object && object.isInventoriable ) {
        if ( object.parent_ === this ) {
            return;
        }
        object.parent_ = this;
        this.slots[ index ] = object;
        object.visible = this.inventoryIsVisible;
        object.pickedUp( object.iconSrc, index, this.id );
    }
}

this.swap = function( index1, index2 ) {
    if ( !validIndex( index1, this.capacity || !validIndex( index2, this.capacity ) ) ) {
        return;
    }
    var tmp = this.slots[ index1 ];
    this.slots[ index1 ] = this.slots[ index2 ];
    this.slots[ index2 ] = tmp;
}

this.remove = function( object ) {
    if ( object && object.parent === this ) {
        var index = this.slots.indexOf( object );
        for ( var i = index; i < this.slots.length - 1; i++ ) {
            this.slots[ i ] = this.slots[ i + 1 ];
        }
        this.slots.length--;
        object.parent_ = this.find( "//pickups" )[ 0 ];
        object.visible = true;
        object.dropped();
    }
}

this.empty = function() {
    while ( this.slots.length > 0 ) {
        this.remove( this.slots[ 0 ] );
    }
}

function validIndex( index, capacity ) {
    if ( isNaN( index ) || index >= capacity || index < 0 ) {
        return false;
    }
    return true;
} 

//@ sourceURL=source/inventory.js