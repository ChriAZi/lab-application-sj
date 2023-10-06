import { controlArticles, prototypeArticles } from './main.js'
import { addClick, addComponent } from './firestore.js'

/**
 * Loads a random set of articles to be displayed in the prototype and control conditions
 * @param observer - included for visibility tracking
 * @param traditionalArticles - if is control condition
 * @returns {Promise<unknown>}
 */

export async function loadArticles(observer, traditionalArticles = false) {

    return new Promise(async (resolve, reject) => {
        try {
            let articles
            if (traditionalArticles) {
                articles = controlArticles
            } else {
                articles = prototypeArticles
            }

            document.getElementById('articles').innerHTML = ''

            for (const article of articles) {
                const index = articles.indexOf(article)

                const articleElement = document.createElement('div')
                articleElement.className = 'article'

                const articleRow = document.createElement('div')
                articleRow.className = 'article-row'

                const imageElement = document.createElement('img')
                imageElement.src = article.traditionalImageURL
                imageElement.className = 'article-image'
                imageElement.onerror = function () {
                    imageElement.src = 'https://plchldr.co/i/500x250'
                }

                const contentElement = document.createElement('div')
                contentElement.className = 'article-content'

                const headingElement = document.createElement('h2')
                const headingLink = document.createElement('a')
                headingLink.href = article.formattedURL
                headingLink.target = '_blank'
                headingLink.textContent = article.traditionalTitle
                headingElement.appendChild(headingLink)

                const dateElement = document.createElement('p')
                const date = new Date(Date.parse(article.traditionalPublishedDate))
                const year = date.getFullYear()

                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                ]
                const month = monthNames[date.getMonth()]
                const day = date.getDate()
                dateElement.textContent = `${month} ${day} ${year}`
                dateElement.className = 'publication-date'

                contentElement.appendChild(headingElement)
                contentElement.appendChild(dateElement)

                articleRow.appendChild(imageElement)
                articleRow.appendChild(contentElement)

                articleElement.appendChild(articleRow)

                if (traditionalArticles) {
                    if (index < articles.length - 1) {
                        const dividerElement = document.createElement('hr')
                        dividerElement.className = 'divider'
                        articleElement.appendChild(dividerElement)
                    }
                    const componentId = await addComponent(localStorage.getItem('sessionId'), 'traditional', article.traditionalTitle, '', '', article.formattedURL)
                    articleElement.dataset.componentId = componentId
                    observer.observe(articleElement)
                    headingLink.addEventListener('click', async () => {
                        await addClick(componentId, 'traditional--link')
                    })
                } else {
                    // includes all data in the dataset properties of the created element to be used in the chrome extension
                    articleElement.dataset.embedding = article.formattedEmbedding
                    articleElement.dataset.sjTitle = article.sjTitle
                    articleElement.dataset.sjDescription = article.sjDescription
                    articleElement.dataset.sjNewsOutlet = article.sjNewsOutlet
                    articleElement.dataset.sjPublishingDate = article.sjPublishingDate
                    articleElement.dataset.sjURL = article.sjURL
                    articleElement.dataset.componentId = await addComponent(localStorage.getItem('sessionId'), 'recommendation', article.traditionalTitle, article.sjURL, article.sjTitle, article.formattedURL)
                    observer.observe(articleElement)
                    articleElement.style.borderTopRightRadius = '1rem'
                    articleElement.style.borderTopLeftRadius = '1rem'
                    articleElement.style.paddingTop = '2rem'
                }
                document.getElementById('articles').appendChild(articleElement)
            }
            resolve()
        } catch (error) {
            reject(error)
        }
    })
}

/**
 * Loads the data from the csv file and shuffles it before splitting it into prototype and control condition
 * Also downloads the data as JSON files per condition
 * @returns {Promise<*[]>}
 */
export async function prepareAndStoreDatasets() {
    return fetch('../data/hp_data_new.csv')
        .then(response => response.text())
        .then(async data => {
                const articlesString = data.split('\n').slice(0)
                let articles = []
                for (const article of articlesString) {
                    const [traditionalTitle, traditionalPublishedDate, traditionalURL, traditionalImageURL, traditionalEmbedding, sjTitle, sjDescription, sjNewsOutlet, sjPublishingDate, sjURL] = article.split(',')
                    if (traditionalTitle !== '') {
                        const formattedEmbedding = traditionalEmbedding.replace(/\^/g, ',')
                        const formattedURL = traditionalURL.replace(/\^/g, ',')
                        articles.push({
                            traditionalTitle,
                            traditionalPublishedDate,
                            formattedURL,
                            traditionalImageURL,
                            formattedEmbedding,
                            sjTitle,
                            sjDescription,
                            sjNewsOutlet,
                            sjPublishingDate,
                            sjURL
                        })
                    }
                }


                const prototypeArticles = []
                const controlArticles = []


                const shuffledArticles = shuffleFisherYates(articles)
                const half = shuffledArticles.length / 2
                prototypeArticles.push(...shuffledArticles.slice(0, half))
                controlArticles.push(...shuffledArticles.slice(half))

                const shuffledPrototypeArticles = shuffleFisherYates(prototypeArticles)
                const shuffledControlArticles = shuffleFisherYates(controlArticles)

                saveJSONLocally(JSON.stringify(shuffledPrototypeArticles), `prototype-${localStorage.getItem('participantId')}.json`)
                saveJSONLocally(JSON.stringify(shuffledControlArticles), `control-${localStorage.getItem('participantId')}.json`)

                return [shuffledPrototypeArticles, shuffledControlArticles]
            }
        )
}

function shuffleFisherYates(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]
    }
    return array
}

function saveJSONLocally(text, filename) {
    const a = document.createElement('a')
    a.setAttribute('style', 'display: none')
    a.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text))
    a.setAttribute('download', filename)
    a.click()
}
