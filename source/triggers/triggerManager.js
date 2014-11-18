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

this.initialize = function() {
    this.triggerSet$ = {};

    // We have to create these here because VWF doesn't give our children
    //   to objects that extend us.
    this.children.create( "conditionFactory", 
                          "source/triggers/booleanFunctionFactory.vwf" );

    this.children.create( "actionFactory",
                          "source/triggers/actionFactory.vwf" );
}

this.loadTriggers = function( context ) {
    if ( !this.isEmpty() ) {
        this.logger.warnx( "loadTriggers", "Loading a new set of triggers, " +
                           "but we still had some there from a previous set!" );
    }

    this.loadTriggerList( this.triggers, context );
}

this.loadTriggerList = function( triggerList, context ) {
    for ( var key in triggerList ) {
        if ( !triggerList.hasOwnProperty( key ) ) {
            continue;
        }

        this.addTrigger( key, triggerList[ key ], context );
    }
}

this.addTrigger = function( triggerName, trigger, context ) {
    this.triggerSet$[ triggerName ] = new Trigger( this.conditionFactory, 
                                                   this.actionFactory, 
                                                   context, 
                                                   trigger, 
                                                   this.logger,
                                                   triggerName );
}

this.clearTriggers = function() {
    for ( var key in this.triggerSet$ ) {
        if ( !this.triggerSet$.hasOwnProperty( key ) ) {
            continue;
        }

        this.triggerSet$[ key ].isDeleted = true;
        delete this.triggerSet$[ key ];
    }

    if ( !this.isEmpty() ) {
        this.logger.errorx( "clearTriggers", "How do we still have triggers?!" );
    }
}

this.clearTriggerList = function( triggerList ) {
    for ( var key in triggerList ) {
        if ( !triggerList.hasOwnProperty( key ) ) {
            continue;
        }

        if ( this.triggerSet$[ key ] !== undefined ) {
            this.triggerSet$[ key ].isDeleted = true;
            delete this.triggerSet$[ key ];
        } 
    }
}

this.isEmpty = function() {
    for ( var key in this.triggerSet$ ) {
        if ( this.triggerSet$.hasOwnProperty( key ) ) {
            return false;
        }
    }

    return true;
}

function Trigger( conditionFactory, actionFactory, context, definition, 
                  logger, triggerName ) {

    this.initialize( conditionFactory, actionFactory, context, definition, 
                     logger, triggerName );
    return this;
}

Trigger.prototype = {
    // Our name - also the key in the trigger list.  Used for debugging.
    name: "",

    // The conditions that we check to see if the trigger should fire
    triggerCondition: undefined,

    // The actions we take when the trigger fires
    actions: undefined,

    // This doesn't appear to be getting deleted properly, so redundantly 
    //   disable it if it should be deleted.
    isDeleted: undefined,

    // A logger.  Also used for debugging.
    logger: undefined,

    initialize: function( conditionFactory, actionFactory, context, definition, 
                          logger, triggerName ) {
        if ( !definition.triggerCondition || 
             ( definition.triggerCondition.length !== 1 ) ) {

            logger.errorx( triggerName + ".initialize", "There must be " +
                           "exactly one trigger condition.  Try using 'and' " +
                           "or 'or'." );
            return undefined;
        } 

        if ( !definition.actions || ( definition.actions.length < 1 )) {
            logger.errorx( triggerName + ".initialize", "There must be at " +
                           "least one action." );
            return undefined;
        }

        this.name = triggerName;

        this.isDeleted = false;

        this.triggerCondition = 
            conditionFactory.executeFunction( definition.triggerCondition[0],
                                              context, 
                                              this.checkFire.bind( this ) );

        this.actions = [];
        for ( var i = 0; i < definition.actions.length; ++i ) {
            var action = actionFactory.executeFunction( definition.actions[ i ], 
                                                        context );
            action && this.actions.push( action );
        }

        this.logger = logger;
    },

    // Check our conditions, and take action if they're true
    checkFire: function() {
        if ( !this.isDeleted && 
             this.triggerCondition && this.triggerCondition() ) {

            // this.logger.logx( this.name + ".checkFire", "Firing actions " +
            //                   "for trigger '" + this.name + "'.");

            for ( var i = 0; i < this.actions.length; ++i ) {

                // this.logger.logx( this.name + ".checkFire", "    Action " + 
                //                   i + " starting.");
                this.actions[ i ] && this.actions[ i ]();
                // this.logger.logx( this.name + ".checkFire", "    Action " + 
                //                   i + " complete.");
            }

            // this.logger.logx( this.name + ".checkFire", "All actions " +
            //                   "complete for trigger '" + this.name + "'.");
        }
    },
}

//@ sourceURL=source/triggers/triggerManager.js
