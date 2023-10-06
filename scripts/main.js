import { addParticipant, addReadingTime, addSession, addViewPortData, endSession, startSession } from './firestore.js'
import { loadArticles, prepareAndStoreDatasets } from './loadArticles.js'
import { createIntersectionObserver, handleIntersectionVisibilityChange } from './intersection.js'

document.getElementsByClassName('dialog-button-primary condition')[0].addEventListener('click', () => handleCondition('prototype'))
document.getElementsByClassName('dialog-button-secondary condition')[0].addEventListener('click', () => handleCondition('control'))
document.getElementsByClassName('dialog-button-primary session')[0].addEventListener('click', handleSessionStart)
document.getElementsByClassName('dialog-button-primary interaction')[0].addEventListener('click', handleInteractionStop)
document.getElementsByClassName('dialog-button-primary reload')[0].addEventListener('click', () => {
    handleReload(true)
})
document.getElementsByClassName('dialog-button-secondary reload')[0].addEventListener('click', () => handleReload(false))

/**
 * Handles the procedural logic
 * Condition decision using a popup
 * Loading screen while newsfeed loads articles
 * Popup for returning to the questionnaire
 * 10 minute timer per session
 * to reset the application state include hte url parameter ?reset=true in the URL
 */
export let prototypeArticles, controlArticles
const surveyURL = 'YOUR URL FOR THE QUALTRICS SURVEY'
let surveyTab
const timerDuration = 600000

window.addEventListener('beforeunload', e => {
    const confirmationMessage = 'You tried to reload the page. Please do NOT click the button below. Talk to your supervisor.'
    e.returnValue = confirmationMessage
    return confirmationMessage
})

document.addEventListener('visibilitychange', () => {
    handleIntersectionVisibilityChange()
    handleClickVisibilityChange()
}, false)


window.onload = async function () {
    if (window.location.href.includes('reset')) {
        localStorage.clear()
        reloadPage()
    } else {
        if (localStorage.getItem('condition') === null) {
            showConditionModal()
        } else {
            showInteractionModal()
        }
    }
}

async function handleCondition(condition, next = false) {
    if (next) {
        localStorage.setItem('condition', condition)
        localStorage.setItem('interactionDone', 'true')

        hideConditionModal()
    } else if (localStorage.getItem('condition') === null) {
        const participantId = await addParticipant()
        localStorage.setItem('participantId', participantId)
        localStorage.setItem('condition', condition)

        hideConditionModal()
        const conditionLabel = condition === 'prototype' ? 'A' : 'B'
        surveyTab = window.open(surveyURL + `?participantId=${participantId}&startCondition=${conditionLabel}`, '_blank')

        const datasets = await prepareAndStoreDatasets()
        prototypeArticles = datasets[0]
        controlArticles = datasets[1]
    }

    const observer = createIntersectionObserver()

    const sessionId = await addSession(localStorage.getItem('participantId'), condition)
    localStorage.setItem('sessionId', sessionId)

    showMask()

    condition === 'prototype'
        ? loadArticles(observer).then(async () => {
            hideMask()
            showSessionModal()
        })
        : loadArticles(observer, true).then(async () => {
            hideMask()
            showSessionModal()
        })
}

async function handleSessionEnd() {
    await handleClickVisibilityChange()
    localStorage.setItem('trackViewTime', 'false')
    clearInterval(parseInt(localStorage.getItem('intervalId')))

    const articles = document.getElementsByClassName('article')
    let viewportData = []
    for (const article of articles) {
        viewportData.push({...article.dataset})
    }

    await addViewPortData(viewportData)
    await endSession(localStorage.getItem('sessionId'))

    showInteractionModal()
}

async function handleSessionStart() {
    await startSession(localStorage.getItem('sessionId'))
    localStorage.setItem('trackViewTime', 'true')
    setTimeout(handleSessionEnd, timerDuration)
    hideSessionModal()
}

async function handleInteractionStop() {
    surveyTab.focus()
    if (localStorage.getItem('interactionDone') === 'true') {
        showReloadModal()
    } else {
        localStorage.getItem('condition') === 'prototype' ? await handleCondition('control', true) : await handleCondition('prototype', true)
        hideInteractionModal()
    }
}

function handleReload(reload) {
    if (reload) {
        window.location.search += '&reset=true'
    } else {
        hideReloadModal()
    }
}

async function handleClickVisibilityChange() {
    const lastClickedComponentId = localStorage.getItem('lastClickedComponentId')
    const lastClickedComponentType = localStorage.getItem('lastClickedComponentType')
    const component = document.querySelector(`[data-component-id=${lastClickedComponentId}]`)
    if (lastClickedComponentId && lastClickedComponentType && component !== null && component !== undefined) {
        if (document.hidden) {
            component.dataset.lastReadingStarted = performance.now()
        } else {
            const diff = performance.now() - component.dataset.lastReadingStarted
            await addReadingTime(lastClickedComponentId, diff, lastClickedComponentType)
            localStorage.removeItem('lastClickedComponentId')
            localStorage.removeItem('lastClickedComponentType')
        }
    }
}


function showConditionModal() {
    document.getElementById('dialog-overlay-condition').style.display = 'flex'
}

function hideConditionModal() {
    document.getElementById('dialog-overlay-condition').style.display = 'none'
}

function showSessionModal() {
    document.getElementById('dialog-overlay-session').style.display = 'flex'
}

function hideSessionModal() {
    document.getElementById('dialog-overlay-session').style.display = 'none'
}

function showInteractionModal() {
    document.getElementById('dialog-overlay-interaction').style.display = 'flex'
}

function hideInteractionModal() {
    document.getElementById('dialog-overlay-interaction').style.display = 'none'
}

function showReloadModal() {
    document.getElementById('dialog-overlay-reload').style.display = 'flex'
}

function hideReloadModal() {
    document.getElementById('dialog-overlay-reload').style.display = 'none'
}

function showMask() {
    document.getElementById('mask').style.display = 'block'
    document.getElementsByTagName('body')[0].classList.add('no-scroll')
}

function hideMask() {
    document.getElementById('mask').style.display = 'none'
    document.getElementsByTagName('body')[0].classList.remove('no-scroll')
}

function reloadPage() {
    window.location = window.location.href.split('?')[0]
}

