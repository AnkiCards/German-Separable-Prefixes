const request = require('request')
    , fs = require('fs')

 class ImageDownloader {

    constructor(mediaFolder) {
        this.mediaFolder = mediaFolder
    }

    requestOptions(word) {
        const bingKey = '90a9877c58c44c2ba04cf6094fbee3ea'
        return {
            url: 'https://api.cognitive.microsoft.com/bing/v5.0/images/search',
            qs: {
                q: encodeURIComponent(word),
                safeSearch: 'Off',
                mkt: 'de-DE',
                count: 10
            },
            headers: {
                'Ocp-Apim-Subscription-Key': bingKey
            }
        }
    }


    searchImage(word) {
        const {processImagesInfo, requestOptions} = this
            , options = requestOptions(word)

        return new Promise((resolve, reject) => {
            request(options, function (error, response, body) {
                if (!error && response.statusCode == 200) resolve(processImagesInfo(body))
                reject('problems during the request of image')
            })
        })
    }

    processImagesInfo(info) {
        return JSON.parse(info).value.map(imageInfo => {
            const {thumbnailUrl: url, name, encodingFormat: format} = imageInfo
            return { url, name: name, format }
        })
    }

    removeIllegalCharacters(name) {
        return name.replace(/([^a-zA-Z0-9.-]|\.)/g, "_").toLowerCase()
    }

    download(resource) {
        const {url, name, format} = resource
            , {removeIllegalCharacters, mediaFolder} = this
            , pathToSave = `${mediaFolder}/${removeIllegalCharacters(name)}`

        return new Promise((resolve, reject) => {
            request(url)
                .pipe(fs.createWriteStream(pathToSave))
                .on('finish', () => resolve(pathToSave))
                .on('error', error=>reject(error))
        })
    }

    downloadImages(images) {
        const download = this.download.bind(this)
            , imagesDownload = images.map(image => download(image))

        return Promise.all(imagesDownload)
    }

    getImages(word) {
        const downloadImages = this.downloadImages.bind(this)
        return this.searchImage(word).then(downloadImages)
    }
}

module.exports = ImageDownloader