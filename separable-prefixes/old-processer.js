const fs = require('fs')
    , Converter = require("csvtojson").Converter
    , converter = new Converter({});

class CsvToJson {

    constructor({csv, imageUrl, podcastUrl, pathToSave}) {
        this.file = csv
        this.imageUrl = imageUrl
        this.podcastUrl = podcastUrl
        this.pathToSave = pathToSave
    }

    //How to
    createColumnist(info) {
        const {code, name} = info
            , {replaceCode, imageUrl, podcastUrl} = this

        return {
            name,
            image: replaceCode(imageUrl, code),
            xml: replaceCode(podcastUrl, code)
        }
    }

    replaceCode(url, code) {
        return url.replace('CODE', code)
    }

    addDetails(columnists) {

        const createColumnist = this.createColumnist.bind(this)

        return new Promise((resolve, reject) => {
            resolve({
                columnists: columnists.map((info) => {
                    return createColumnist(info)
                })
            })
        })
    }

    saveJson(json) {
        fs.writeFile(this.pathToSave, JSON.stringify(json, null, 4))
    }

    convert() {
        const {file} = this
            , addDetails = this.addDetails.bind(this)

        const task = (resolve, reject) => {
            converter.fromFile(file, function (err, result) {
                if (err) reject(err)
                else resolve(addDetails(result))
            });
        }

        return new Promise(task)
    }


    printError(error) {
        console.log(error)
    }

    process() {
        const { printError } = this
            , saveJson = this.saveJson.bind(this)

        this.convert().then(saveJson).catch(printError)
    }
}

module.exports = CsvToJson