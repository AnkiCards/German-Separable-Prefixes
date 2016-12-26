var fs = require('fs'), Converter = require("csvtojson").Converter, converter = new Converter({});
var AnkiInfo = (function () {
    function AnkiInfo() {
    }
    AnkiInfo.prototype.stringify = function (input) {
        return JSON.stringify(input, null, 4);
    };
    AnkiInfo.prototype.followRecipe = function (input) {
        console.log(this);
        var string = this.stringify(input);
        var recipe = function (resolve, reject) {
            resolve(string);
        };
        return new Promise(recipe);
    };
    return AnkiInfo;
}());
var CvsProcessor = (function () {
    function CvsProcessor(fileToOpen, pathToSave, recipe) {
        this.recipe = recipe;
        this.fileToOpen = fileToOpen;
        this.pathToSave = pathToSave;
    }
    CvsProcessor.prototype.printError = function (error) {
        console.log(error);
    };
    CvsProcessor.prototype.openFile = function () {
        var fileToOpen = this.fileToOpen;
        var task = function (resolve, reject) {
            converter.fromFile(fileToOpen, function (err, result) {
                if (err)
                    reject(err);
                else
                    resolve(result);
            });
        };
        return new Promise(task);
    };
    CvsProcessor.prototype.saveContent = function (content) {
        var pathToSave = this.pathToSave;
        fs.writeFile(pathToSave, content);
    };
    CvsProcessor.prototype.startTranformation = function () {
        var _a = this, recipe = _a.recipe, saveContent = _a.saveContent, printError = _a.printError;
        this.openFile()
            .then(recipe.followRecipe.bind(recipe))
            .then(saveContent.bind(this))["catch"](printError);
    };
    return CvsProcessor;
}());
var fileToOpen = './aqui.csv';
var pathToSave = 'lero.txt';
var recipe = new AnkiInfo();
var processor = new CvsProcessor(fileToOpen, pathToSave, recipe);
processor.startTranformation();
