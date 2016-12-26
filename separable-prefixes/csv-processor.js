var fs = require('fs'), request = require('request'), Converter = require("csvtojson").Converter, converter = new Converter({});
var AnkiInfo = (function () {
    function AnkiInfo(mediaFolder) {
        this.mediaFolder = mediaFolder;
        this.csv = '';
    }
    AnkiInfo.prototype.normalizeWord = function (word) {
        return word.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    };
    AnkiInfo.prototype.getUrl = function (word) {
        return "http://bing-translate-tts-demo.craic.com/text_to_speech_web_audio_api?query=%22" + encodeURIComponent(word) + "%22&language=de";
    };
    AnkiInfo.prototype.downloadAudio = function (word) {
        var url = this.getUrl(word), soundPath = this.normalizeWord(word) + ".mp3", pathToSave = this.mediaFolder + '/' + soundPath;
        return new Promise(function (resolve, reject) {
            var stream = request(url).pipe(fs.createWriteStream(pathToSave));
            stream.on('finish', function () { return resolve(soundPath); });
            stream.on('error', function (error) { return reject(error); });
        });
    };
    AnkiInfo.prototype.processLine = function (line) {
        var prefix = line.prefix, translation = line.translation, word = line.word;
        return this.downloadAudio(word).then(function (soundPath) {
            return "\"" + prefix + "\", \"" + word + "\", \"" + translation + "\", [sound:" + soundPath + "]";
        })["catch"](function (error) { return console.log(error); });
    };
    AnkiInfo.prototype.processAllLines = function (lines) {
        var _this = this;
        return lines.map(function (line) {
            return _this.processLine(line);
        }, this);
    };
    AnkiInfo.prototype.getNewCvs = function (oldCsvLines) {
        var asyncTasks = this.processAllLines(oldCsvLines);
        return Promise.all(asyncTasks).then(function (lines) {
            return lines.join('\r\n');
        });
    };
    AnkiInfo.prototype.followRecipe = function (csvLines) {
        return this.getNewCvs(csvLines);
    };
    return AnkiInfo;
}());
var CvsTransformer = (function () {
    function CvsTransformer() {
    }
    return CvsTransformer;
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
        console.log(content);
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
var fileToOpen = './german-separable-prefixes.csv';
var pathToSave = './lero.csv';
var recipe = new AnkiInfo('/home/hellon/Dropbox/Anki/hellon/collection.media');
var processor = new CvsProcessor(fileToOpen, pathToSave, recipe);
processor.startTranformation();
