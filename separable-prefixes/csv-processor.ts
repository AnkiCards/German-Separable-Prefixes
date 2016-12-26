

const fs = require('fs')
    , Converter = require("csvtojson").Converter
    , converter = new Converter({});

var fileToOpen = './aqui.csv'
var pathToSave = 'lero.txt'
var recipe = new AnkiInfo('./media')
var processor = new CvsProcessor(fileToOpen, pathToSave, recipe)

processor.startTranformation()


interface Recipe {
    followRecipe: (input: Object) => Promise<string>,
}

class AnkiInfo implements Recipe {

    mediaFolder: string

    constructor(mediaFolder :string){
        this.mediaFolder = mediaFolder
    }

    stringify(input: Object) {
        return JSON.stringify(input, null, 4)
    }

    followRecipe(input: Object) {
        const {stringify} = this

        const recipe = (resolve, reject) => {
            resolve(stringify(input))
        }

        return new Promise(recipe)

    }

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



