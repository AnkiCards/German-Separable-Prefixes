
const fs = require('fs')
    , request = require('request')
    , Converter = require("csvtojson").Converter
    , converter = new Converter({})
    , ImageDownloader = require('./image-downloader.js')

interface Recipe {
    followRecipe: (input: Object) => Promise<string>,
}

interface Line {
    prefix: string,
    translation: string,
    word: string
}

class AnkiInfo implements Recipe {

    mediaFolder: string
    imageDownloader: ImageDownloader

    constructor(mediaFolder: string) {
        this.mediaFolder = mediaFolder
        this.imageDownloader = new ImageDownloader(mediaFolder)
    }

    normalizeWord(word: string): string {
        return word.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    }

    getUrl(word): string {
        return `http://bing-translate-tts-demo.craic.com/text_to_speech_web_audio_api?query=%22${encodeURIComponent(word)}%22&language=de`

    }

    downloadAudio(word: string): Promise<string> {
        const url = this.getUrl(word)
            , soundPath = `${this.normalizeWord(word)}.mp3`
            , pathToSave = this.mediaFolder + '/' + soundPath

        return new Promise((resolve, reject) => {
            const stream = request(url).pipe(fs.createWriteStream(pathToSave))
            stream.on('finish', () => resolve(soundPath))
            stream.on('error', (error) => reject(error))
        })
    }

    formatAudioString(soundPath: string): string {
        return `[sound:${soundPath}]`
    }

    wrapImageTag(source: string): string {
        return `<img src=${source} />`
    }

    formatImagesString(imagesPath: Array<string>): string {
        const {wrapImageTag} = this

        return imagesPath.reduce((previous, current) => {
            previous = (previous || wrapImageTag(previous))             
            return previous + wrapImageTag(current)
        }, '')

    }

    getLineString(line: Line, soundPath: string, imagesPath: Array<string>): string {
        const {prefix, translation, word} = line
            , formatAudioString = this.formatAudioString.bind(this)
            , formatImagesString = this.formatImagesString.bind(this)

        return `"${prefix}", "${word}", "${translation}", ${formatAudioString(soundPath)} ${formatImagesString(imagesPath)}`
    }

    processLine(line: Line): Promise<string> {

        const getLineString = this.getLineString.bind(this)
            , {word} = line
            , tasks = [this.downloadAudio(word), this.imageDownloader.getImages(word)]

        return Promise.all(tasks).then(([soundPath, imagesPath]) => {
            return getLineString(line, soundPath, imagesPath)
        }).catch(error => console.log(error))

    }

    processAllLines(lines: Array<Line>): Array<Promise<string>> {
        return lines.map(line => {
            return this.processLine(line)
        }, this)
    }

    getNewCvs(oldCsvLines: Array<Line>): Promise<string> {
        const asyncTasks = this.processAllLines(oldCsvLines)
        return Promise.all(asyncTasks).then(lines => {
            return lines.join('\r\n')
        })
    }

    followRecipe(csvLines: Array<Line>) {
        return this.getNewCvs(csvLines)
    }

}

class CvsTransformer {

}


class CvsProcessor {

    recipe: Recipe
    fileToOpen: string
    pathToSave: string

    constructor(fileToOpen: string, pathToSave: string, recipe: Recipe) {
        this.recipe = recipe
        this.fileToOpen = fileToOpen
        this.pathToSave = pathToSave
    }

    private printError(error) {
        console.log(error)
    }

    private openFile(): Promise<Object> {

        const {fileToOpen} = this

        const task = function (resolve, reject) {
            converter.fromFile(fileToOpen, function (err, result) {
                if (err) reject(err)
                else resolve(result)
            });
        }

        return new Promise(task)
    }

    private saveContent(content: string) {
        const {pathToSave} = this
        fs.writeFile(pathToSave, content)
    }

    public startTranformation() {

        const {recipe, saveContent, printError} = this

        this.openFile()
            .then(recipe.followRecipe.bind(recipe))
            .then(saveContent.bind(this))
            .catch(printError)
    }

}


var fileToOpen = './test.csv'
var pathToSave = './iota.csv'
var recipe = new AnkiInfo('./media')
var processor = new CvsProcessor(fileToOpen, pathToSave, recipe)


// var fileToOpen = './german-separable-prefixes.csv'
// var pathToSave = './lero.csv'
// var recipe = new AnkiInfo('/home/hellon/Dropbox/Anki/hellon/collection.media')
// var processor = new CvsProcessor(fileToOpen, pathToSave, recipe)

processor.startTranformation()



