let AutoService = require('./02. Auto Service_Ресурси');
let assert = require('chai').assert;

describe('Test AutoService', function () {
    describe('Test Constructor', function () {
        it('Test with correct parameters', function () {
            let autoService = new AutoService(12);
            assert.equal(autoService.garageCapacity, 12);
            assert.deepEqual(autoService.workInProgress, []);
            assert.deepEqual(autoService.backlogWork, []);
        })
    })
    describe('Test SignUpForReview', function () {
        it('Test with correct parameters and with space available', function () {
            let autoService = new AutoService(12);
            autoService.signUpForReview('Uzi', '0821', { 'engine': 'MFRGG23', 'transmission': 'FF4418ZZ', 'doors': 'broken' });
            let expected = {
                plateNumber: '0821',
                clientName: 'Uzi',
                carInfo: { 'engine': 'MFRGG23', 'transmission': 'FF4418ZZ', 'doors': 'broken' }
            }
            assert.deepEqual(autoService.workInProgress[autoService.workInProgress.length - 1], expected);
        })
        it('Test with correct parameters and with no space', function () {
            let autoService = new AutoService(0);
            autoService.signUpForReview('Uzi', '0821', { 'engine': 'MFRGG23', 'transmission': 'FF4418ZZ', 'doors': 'broken' });
            let expected = {
                plateNumber: '0821',
                clientName: 'Uzi',
                carInfo: { 'engine': 'MFRGG23', 'transmission': 'FF4418ZZ', 'doors': 'broken' }
            }
            assert.deepEqual(autoService.backlogWork[autoService.backlogWork.length - 1], expected);
        })
    })
    describe('Test RepairCar', function () {
        it('Test with correct parameters, clients and broken parts', function () {
            let autoService = new AutoService(12);
            autoService.signUpForReview('Uzi', '0821', { 'engine': 'MFRGG23', 'transmission': 'FF4418ZZ', 'doors': 'broken', 'wheel': 'broken' });
            let result = autoService.repairCar();
            let expected = `Your doors and wheel were repaired.`;
            assert.equal(result, expected);
        })
        it('Test with correct parameters, clients and no broken parts', function () {
            let autoService = new AutoService(12);
            autoService.signUpForReview('Uzi', '0821', { 'engine': 'MFRGG23', 'transmission': 'FF4418ZZ', 'doors': 'cool', 'wheel': 'cool' });
            let result = autoService.repairCar();
            let expected = `Your car was fine, nothing was repaired.`;
            assert.equal(result, expected);
        })
        it('Test with correct parameters and no clients', function () {
            let autoService = new AutoService(12);
            let result = autoService.repairCar();
            assert.equal(result, 'No clients, we are just chilling...');
        })
        it('Test with correct parameters, clients and no broken parts', function () {
            let autoService = new AutoService(0);
            autoService.signUpForReview('Uzi', '0821', { 'engine': 'MFRGG23', 'transmission': 'FF4418ZZ', 'doors': 'cool', 'wheel': 'cool' });
            let result = autoService.repairCar();
            let expected = `Your car was fine, nothing was repaired.`;
            assert.equal(result, expected);
        })
    })
    describe('Test CarInfo', function () {
        it('Test with correct parameters', function () {
            let autoService = new AutoService(12);
            autoService.signUpForReview('Uzi', '0821', { 'engine': 'MFRGG23', 'transmission': 'FF4418ZZ', 'doors': 'broken' });
            let result = autoService.carInfo('0821', 'Uzi');
            let expected = {
                plateNumber: '0821',
                clientName: 'Uzi',
                carInfo: { 'engine': 'MFRGG23', 'transmission': 'FF4418ZZ', 'doors': 'broken' }
            }
            assert.deepEqual(result, expected);
        })
        it('Test with correct parameters', function () {
            let autoService = new AutoService(0);
            autoService.signUpForReview('Uzi', '0821', { 'engine': 'MFRGG23', 'transmission': 'FF4418ZZ', 'doors': 'broken' });
            let result = autoService.carInfo('0821', 'Uzi');
            let expected = {
                plateNumber: '0821',
                clientName: 'Uzi',
                carInfo: { 'engine': 'MFRGG23', 'transmission': 'FF4418ZZ', 'doors': 'broken' }
            }
            assert.deepEqual(result, expected);
        })
        it('Test with incorrect parameters', function () {
            let autoService = new AutoService(12);
            autoService.signUpForReview('Uzis', '0821', { 'engine': 'MFRGG23', 'transmission': 'FF4418ZZ', 'doors': 'broken' });
            let result = autoService.carInfo('0821', 'Uzi');
            let expected = 'There is no car with platenumber 0821 and owner Uzi.';
            assert.equal(result, expected);
        })
    })
    describe('Test AvailableSpace', function () {
        it('Test with correct parameters', function () {
            let autoService = new AutoService(12);
            autoService.signUpForReview('Uzi', '0821', { 'engine': 'MFRGG23', 'transmission': 'FF4418ZZ', 'doors': 'broken' });
            let result = autoService.availableSpace;
            assert.equal(result, 11);
        })
    })
})