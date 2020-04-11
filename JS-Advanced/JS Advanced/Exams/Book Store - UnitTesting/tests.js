let BookStore = require('./02. Book Store_Ресурси');
let assert = require('chai').assert;

describe('BookStore', () => {
    describe('Constructor tests', () => {
        it('Test properties - works', () => {
            let store = new BookStore('Store');
            assert.equal(store.name, 'Store');
            assert.deepEqual(store.books, []);
            assert.deepEqual(store._workers, []);
        });
    });
    describe('StockBooks() tests', () => {
        it('Test correct data - works', () => {
            let store = new BookStore('Store');
            let result = store.stockBooks(['Point-Uzi', 'Sniper-John']);
            let expected = [{ title: 'Point', author: 'Uzi' }, { title: 'Sniper', author: 'John' }];
            assert.deepEqual(result, expected);
        });
    });
    describe('Hire() tests', () => {
        it('Test new employee - works', () => {
            let store = new BookStore('Store');
            let result = store.hire('Dido', 'Engeneer');
            let expected = 'Dido started work at Store as Engeneer';
            let obj = { name: 'Dido', position: 'Engeneer', booksSold: 0 };
            assert.equal(result, expected);
            assert.deepEqual(store.workers[store.workers.length - 1], obj);
        });
        it('Test existing employee - throws', () => {
            let store = new BookStore('Store');
            store.hire('Dido', 'Engeneer');
            let result = () => store.hire('Dido', 'Boss');
            let expected = 'This person is our employee';
            assert.throw(result, expected);
        });
    });
    describe('Fire() tests', () => {
        it('Test non existing employee - throws', () => {
            let store = new BookStore('Store');
            let result = () => store.fire('Dido');
            let expected = 'Dido doesn\'t work here';
            assert.throw(result, expected);
        });
        it('Test existing employee - works', () => {
            let store = new BookStore('Store');
            store.hire('Dido', 'Engeneer');
            let result = store.fire('Dido');
            let expected = 'Dido is fired';
            assert.equal(result, expected);
            assert.equal(store.workers.length, 0);
        });
    });
    describe('SellBook() tests', () => {
        it('Test non existing book - throws', () => {
            let store = new BookStore('Store');
            store.hire('Dido', 'Engeneer');
            let result = () => store.sellBook('Uzi', 'Dido');
            let expected = 'This book is out of stock';
            assert.throw(result, expected);
        });
        it('Test non existing employee - throws', () => {
            let store = new BookStore('Store');
            store.stockBooks(['Point-Uzi', 'Sniper-John']);
            store.hire('Dido', 'Engeneer');
            let result = () => store.sellBook('Point', 'Sin');
            let expected = 'Sin is not working here';
            assert.throw(result, expected);
        });
        it('Test correct data - works', () => {
            let store = new BookStore('Store');
            store.stockBooks(['Point-Uzi', 'Sniper-John']);
            store.hire('Dido', 'Engeneer');
            store.sellBook('Point', 'Dido');
            assert.equal(store.workers.find(x => x.name === 'Dido').booksSold, 1);
        });
    });
    describe('PrintWorkers() tests', () => {
        it('Test some workers - works', () => {
            let store = new BookStore('Store');
            store.hire('Dido', 'Engeneer');
            store.hire('Uzi', 'Macro');
            store.stockBooks(['Point-Sin', 'Sniper-John']);
            store.sellBook('Point', 'Uzi');
            let result = store.printWorkers();
            let expected = 'Name:Dido Position:Engeneer BooksSold:0\nName:Uzi Position:Macro BooksSold:1';
            assert.equal(result, expected);
        });
        it('Test no workers - works', () => {
            let store = new BookStore('Store');
            let result = store.printWorkers();
            let expected = '';
            assert.equal(result, expected);
        });
    });
});