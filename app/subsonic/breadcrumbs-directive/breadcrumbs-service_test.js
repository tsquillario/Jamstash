// jscs:disable validateQuoteMarks
describe("Breadcrumbs service -", function () {
    'use strict';

    var breadcrumbs;
    beforeEach(function () {
        module('jamstash.breadcrumbs.service');

        inject(function (_breadcrumbs_) {
            breadcrumbs = _breadcrumbs_;
        });
    });

    describe("push() -", function () {
        it("Given an item with an id and a name and given the breadcrumbs were empty, when I push it to the breadcrumbs and I get them, then an array of 1 item containing an id and name will be returned", function () {
            breadcrumbs.push({
                id: 240,
                name: "Renee Stuekerjuerge"
            });

            expect(breadcrumbs.get()).toEqual([
                {
                    id: 240,
                    name: "Renee Stuekerjuerge"
                }
            ]);
        });

        it("Given an item with an id and a name and given the breadcrumbs already contained another item, when I push the item to the breadcrumbs and I get them, then an array of 2 items will be returned and the item I pushed will be the second one", function () {
            breadcrumbs.push({
                id: 150,
                name: "Collen Kampmann"
            }).push({
                id: 201,
                name: "Leonardo Berdan"
            });

            expect(breadcrumbs.get()).toEqual([
                {
                    id: 150,
                    name: "Collen Kampmann"
                }, {
                    id: 201,
                    name: "Leonardo Berdan"
                }
            ]);
        });
    });

    describe("popUntil() -", function () {
        it("Given an item with an id and a name, and given the breadcrumbs already contained this item as first element and 2 others, when I pop breadcrumbs until finding the provided item, then an array containing only the provided item will be returned", function () {
            breadcrumbs.push({
                id: 979,
                name: "telescopic Sivatheriinae"
            }).push({
                id: 542,
                name: "fibrinoalbuminous pawnee"
            }).push({
                id: 163,
                name: "semimarking polysarcia"
            });

            var list = breadcrumbs.popUntil({
                id: 979,
                name: "telescopic Sivatheriinae"
            }).get();

            expect(list).toEqual([
                {
                    id: 979,
                    name: "telescopic Sivatheriinae"
                }
            ]);
        });

        it("Given an item with an id and a name, and given the breadcrumbs already contained this item as last element and 2 others, when I pop breadcrumbs until finding the provided item, then an array containing all 3 items will be returned", function () {
            breadcrumbs.push({
                id: 474,
                name: "Kolinsky"
            }).push({
                id: 69,
                name: "Hulburt"
            }).push({
                id: 851,
                name: "Perkerson"
            });

            var list = breadcrumbs.popUntil({
                id: 851,
                name: "Perkerson"
            }).get();

            expect(list).toEqual([
                {
                    id: 474,
                    name: "Kolinsky"
                }, {
                    id: 69,
                    name: "Hulburt"
                }, {
                    id: 851,
                    name: "Perkerson"
                }
            ]);
        });

        it("Given an item with an id and a name that didn't exist in the breadcrumbs, and given the breadcrumbs contained 3 items, when I pop breadcrumbs until finding the provided item, then an array containing all 3 breadcrumbs will be returned", function () {
            breadcrumbs.push({
                id: 46,
                name: "Cordell"
            }).push({
                id: 540,
                name: "Delia"
            }).push({
                id: 571,
                name: "Lashawnda"
            });

            var list = breadcrumbs.popUntil({
                id: 803,
                name: "Wilfredo"
            }).get();

            expect(list).toEqual([
                {
                    id: 46,
                    name: "Cordell"
                }, {
                    id: 540,
                    name: "Delia"
                }, {
                    id: 571,
                    name: "Lashawnda"
                }
            ]);
        });

        it("Given an item with an id and a name, and given the breadcrumbs were empty, when I pop breadcrumbs until finding the provided item, then an empty array will be returned", function () {
            var list = breadcrumbs.popUntil({
                id: 605,
                name: "spacecraft"
            }).get();

            expect(list).toEqual([]);
        });
    });

    describe("reset() -", function () {
        it("Given a breadcrumb had been previously set, when I reset the breadcrumbs, then they will be empty", function () {
            breadcrumbs.push({
                id: 350,
                name: "exterritoriality dubious"
            });

            var list = breadcrumbs.reset().get();

            expect(list).toEqual([]);
        });

        it("Given the breadcrumbs were empty, when I reset them, then they will be empty", function () {
            var list = breadcrumbs.reset().get();

            expect(list).toEqual([]);
        });
    });
});
