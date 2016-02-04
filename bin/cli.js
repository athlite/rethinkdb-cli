'use strict';

const R = require('rethinkdb');
const Each = require('lodash/each');
const GetOpt = require('node-getopt');
const Recli = require('../index');
const Readfile = Recli.Readfile;
const Command = Recli.Commander;

const Opts = [
    ['l' ,'ls'                , 'list dbs'],
    ['T' , 'tables'           , 'list tables'],
    ['t' , 'table='           , 'list table content'],
    [''  , 'filter='          , 'filter by attribute:value'],
    [''  , 'return-changes'   , 'return changes'],
    ['I' , 'insert='          , 'fixture.json'],
    ['D' , 'delete='          , 'delete table contents'],
    ['C' , 'tablecreate='     , 'create table'],
    [''  , 'tabledrop='       , 'drop table'],
    [''  , 'dbcreate='        , 'create db'],
    [''  , 'dbdrop='          , 'drop db'],
    ['h'  , 'help'            , 'display this help'],
    ['v' , 'version'          , 'show version'],
    [''  , 'verbose'          , 'be verbose'],
    [''  , 'db='              , 'db name'],
    [''  , 'host='            , 'hostname'],
    [''  , 'port='            , 'port number'],
    [''  , 'auth_key='        , 'authentication key']
];

const Config = function (options) {
    return {
        db: options.db || 'test',
        host: options.host,
        port: options.port,
        auth_key: options.auth_key
    }
};

const opts = GetOpt.create(Opts)
    .bindHelp();

const commander = new Command();

commander.on('connect', (msg) => {
    if (getOpt.options.verbose) {
        console.log(msg);
    }
    runner(getOpt.options,getOpt.argv);
});

commander.on('message', (msg) => {
    console.log(msg);
    commander.close()
});

commander.on('error', (err) => {
    console.log(err);
    commander.close();
});

const getOpt = opts.parseSystem();

if (getOpt.options.version) {
    Readfile('./package.json').then( (pkg) => {
        console.log('Version ' + pkg.version);
    });
} 
else if (Object.keys(getOpt.options).length < 1 ) {
    opts.showHelp();
}
else {
    commander.connect(Config(getOpt.options));    
}

const runner = function (options,args) {
    
    if (options.dbcreate) {
        return commander.exec('dbCreate', [options.dbcreate]);
    }
    
    if (options.dbdrop) {
        return commander.exec('dbDrop', [options.dbdrop]);
    }

    if (options.ls) {
        return commander.exec('dbs');
    }

    if (options.tables) {
        return commander.exec('tables');
    }

    if (options.table) {
        return commander.exec('table', [options.table,options.filter]);
    }
    
    if (options.tablecreate) {
        return commander.exec('tableCreate', [options.tablecreate]);
    }
    
    if (options.tabledrop) {
        return commander.exec('tableDrop', [options.tabledrop]);
    }
    
    if (options.delete) {
        return commander.exec('delete', [options.delete]);
    }

    if (options.insert) {
        return Readfile(options.insert).then( (data) => {
            commander.exec('insert', [data, options['return-changes']]);
        }, (err) => {
            commander.fire('error',[err.msg]);
        });
    }

    console.log('Noop for ' + Object.keys(options));
    commander.close();
};
