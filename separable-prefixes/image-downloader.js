const request = require('request')
    , fs = require('fs')

class ImageDownloader {

    constructor(mediaFolder) {
        this.mediaFolder = mediaFolder
    }

    requestOptions(word) {
        return {
            url: 'https://www.googleapis.com/customsearch/v1',
            qs: {
                q: encodeURIComponent(word),
                cx: '012944261312582723912:gsym5e1q-v8',
                searchType: 'image',
                key: 'AIzaSyCicqM_kUWs00ph_6gFXoQTzrEqdDCb-p8',
                safe: "off",
            }
        }
    }


    searchImage(word) {
        const {processImagesInfo, requestOptions, currentApiKey} = this
            , options = requestOptions.call(this, word)

        return new Promise((resolve, reject) => {
            request(options, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    resolve(processImagesInfo(body))
                }
                reject({ error, response: response.statusMessage })
            })
        })
    }

    processImagesInfo(info) {
        const {items} = JSON.parse(info)

        if (items) {
            return items.map(imageInfo => {
                const {link: url, title} = imageInfo
                return { url, name: title }
            })
        }

        return []
    }

    removeIllegalCharacters(name) {
        return name.replace(/([^a-zA-Z0-9.-]|\.)/g, "_").toLowerCase()
    }

    download(resource) {
        const {url, name} = resource
            , {removeIllegalCharacters, mediaFolder} = this
            , fileName = removeIllegalCharacters(name)
            , pathToSave = `${mediaFolder}/${fileName}`

        return new Promise((resolve, reject) => {
            if (url)
                request({url, rejectUnauthorized: false})
                    .pipe(fs.createWriteStream(pathToSave))
                    .on('finish', () => resolve(fileName))
                    .on('error', error => reject(error))
        })
    }

    downloadImages(images) {
        const download = this.download.bind(this)

        console.log(images.length)
        
        
        const imagesDownload = images.length ? images.map(image => download(image)) : []



        return Promise.all(imagesDownload)
    }

    getImages(word) {
        const downloadImages = this.downloadImages.bind(this)
        return this.searchImage(word).then(downloadImages)
    }
}

module.exports = ImageDownloader

