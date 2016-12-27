var fs = require('fs'), request = require('request'), Converter = require("csvtojson").Converter, converter = new Converter({}), ImageDownloader = require('./image-downloader.js');
var AnkiInfo = (function () {
    function AnkiInfo(mediaFolder) {
        this.mediaFolder = mediaFolder;
        this.imageDownloader = new ImageDownloader(mediaFolder);
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
    AnkiInfo.prototype.formatAudioString = function (soundPath) {
        return "[sound:" + soundPath + "]";
    };
    AnkiInfo.prototype.wrapImageTag = function (source) {
        return "<img src=" + source + " />";
    };
    AnkiInfo.prototype.formatImagesString = function (imagesPath) {
        var wrapImageTag = this.wrapImageTag;
        return imagesPath.reduce(function (previous, current) {
            previous = (previous || wrapImageTag(previous));
            return previous + wrapImageTag(current);
        }, '');
    };
    AnkiInfo.prototype.getLineString = function (line, soundPath, imagesPath) {
        var prefix = line.prefix, translation = line.translation, word = line.word, formatAudioString = this.formatAudioString.bind(this), formatImagesString = this.formatImagesString.bind(this);
        return "\"" + prefix + "\", \"" + word + "\", \"" + translation + "\", " + formatAudioString(soundPath) + " " + formatImagesString(imagesPath);
    };
    AnkiInfo.prototype.processLine = function (line) {
        var getLineString = this.getLineString.bind(this), word = line.word, tasks = [this.downloadAudio(word), this.imageDownloader.getImages(word)];
        return Promise.all(tasks).then(function (_a) {
            var soundPath = _a[0], imagesPath = _a[1];
            return getLineString(line, soundPath, imagesPath);
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
var fileToOpen = './test.csv';
var pathToSave = './iota.csv';
var recipe = new AnkiInfo('./media');
var processor = new CvsProcessor(fileToOpen, pathToSave, recipe);
// var fileToOpen = './german-separable-prefixes.csv'
// var pathToSave = './lero.csv'
// var recipe = new AnkiInfo('/home/hellon/Dropbox/Anki/hellon/collection.media')
// var processor = new CvsProcessor(fileToOpen, pathToSave, recipe)
processor.startTranformation();
