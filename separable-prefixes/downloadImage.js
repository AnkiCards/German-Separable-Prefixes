const request = require('request')
    , fs = require('fs')

class Downloader {

    constructor() {
        this.mediaFolder = './media'
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
            const {thumbnailUrl: url, name, encodingFormat:format} = imageInfo
            return { url, name: name, format }
        })
    }

    formatPathName(name){
        return name.replace(/(s|\|)/g, '_').toLowerCase()
    }

    download(resource) {
        const {url, name, format} = resource
            , {formatPathName, mediaFolder} = this
            , pathToSave = `${mediaFolder}/${formatPathName(name)}.${format}`

        request(url).pipe(fs.createWriteStream(pathToSave))
    }

    downloadImages(images) {
        const download = this.download.bind(this)        
        images.forEach(image => download(image))
    }

    getImage(word) {
        const downloadImages = this.downloadImages.bind(this)
        return this.searchImage(word).then(downloadImages)
    }
}

const downloader = new Downloader()
downloader.getImage('sex')