/**
 * Manages the visibility tracking of components
 * Does not work 100% - so rather debug before using
 * @type {Set<any>}
 */

export let visibleComponents = new Set()
let previouslyVisibleComponents = null

export function createIntersectionObserver() {
    const intervalId = setInterval(handleRefreshInterval, 1000)
    localStorage.setItem('intervalId', intervalId)
    return new IntersectionObserver((entries) => {
        handleIntersection(entries)
    }, {
        root: null,
        rootMargin: '0px',
        threshold: [0.0, 0.75]
    })
}

function handleIntersection(entries) {
    entries.forEach((entry) => {
            if (localStorage.getItem('trackViewTime') === 'true') {
                const component = entry.target
                if (entry.isIntersecting) {
                    if (entry.intersectionRatio >= 0.75) {
                        component.dataset.lastViewStarted = entry.time
                        visibleComponents.add(component)
                    }
                } else {

                    visibleComponents.delete(component)
                }
            }
        }
    )
}


export function handleRefreshInterval() {
    visibleComponents.forEach((component) => {
        if (localStorage.getItem('trackViewTime') === 'true') {
            updateTimer(component)
        }
    })
}

export function handleIntersectionVisibilityChange() {
    if (localStorage.getItem('trackViewTime') === 'true') {
        if (document.hidden) {
            if (!previouslyVisibleComponents) {
                previouslyVisibleComponents = visibleComponents
                visibleComponents = []
                previouslyVisibleComponents.forEach((component) => {
                    updateTimer(component)
                    component.dataset.lastViewStarted = 0
                })
            }
        } else {
            previouslyVisibleComponents.forEach((component) => {
                component.dataset.lastViewStarted = performance.now()
            })
            visibleComponents = previouslyVisibleComponents
            previouslyVisibleComponents = null
        }
    }
}

function updateTimer(component) {
    const lastStarted = component.dataset.lastViewStarted
    const currentTime = performance.now()

    if (lastStarted) {
        const diff = currentTime - lastStarted
        if (component.dataset.totalViewTime) {
            component.dataset.totalViewTime = parseFloat(component.dataset.totalViewTime) + diff
        } else {
            component.dataset.totalViewTime = diff.toString()
        }
    }
    component.dataset.lastViewStarted = currentTime
}
