import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js'
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getFirestore,
    increment,
    serverTimestamp,
    updateDoc
} from 'https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js'

/**
 * Includes all relevant tracking using firestore for behavioral data
 * @type {any|FirebaseAppImpl}
 */

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const firestore = getFirestore(app)

export async function addParticipant() {
    try {
        const participantRef = await addDoc(collection(firestore, 'participants'), {
            sessions: []
        })
        return participantRef.id
    } catch (e) {
        console.error('Error adding participant: ', e)
    }
}

export async function addSession(participantId, condition) {
    try {
        const participantRef = doc(firestore, 'participants', participantId)
        const sessionRef = await addDoc(collection(firestore, 'sessions'),
            {
                participantId,
                condition
            })
        const participantSnap = await getDoc(participantRef)
        if (participantSnap.exists()) {
            const sessions = participantSnap.get('sessions') ?? []
            await updateDoc(participantRef, {
                sessions: [...sessions, sessionRef.id]
            })
        } else {
            console.error('No such participant')
        }
        return sessionRef.id
    } catch (e) {
        console.error('Error adding session')
    }
}

export async function startSession(sessionId) {
    try {
        const sessionRef = doc(firestore, 'sessions', sessionId)
        const sessionSnap = await getDoc(sessionRef)
        if (sessionSnap.exists()) {
            await updateDoc(sessionRef, {
                sessionStart: serverTimestamp()
            })
        } else {
            console.error('No such session')
        }
    } catch (e) {
        console.error('Error starting session')
    }
}

export async function endSession(sessionId) {
    try {
        const sessionRef = doc(firestore, 'sessions', sessionId)
        await updateDoc(sessionRef, {
            sessionEnd: serverTimestamp()
        })
    } catch (e) {
        console.error('Error ending session: ', e)
    }
}

export async function addComponent(sessionId, type, traditionalTitle, sjURL = '', sjTitle = '', traditionalURL = '') {
    try {
        const sessionRef = doc(firestore, 'sessions', sessionId)
        const componentRef = await addDoc(collection(firestore, 'components'), {
            sessionId: sessionRef.id,
            type,
            sjTitle,
            sjURL,
            traditionalTitle,
            traditionalURL
        })
        const sessionSnap = await getDoc(sessionRef)
        if (sessionSnap.exists()) {
            const components = sessionSnap.get('components')
            let updatedComponents
            if (components !== undefined) {
                updatedComponents = [...components, componentRef.id]
            } else {
                updatedComponents = [componentRef.id]
            }
            await updateDoc(sessionRef, {
                components: updatedComponents
            })
            return componentRef.id
        } else {
            console.error('No such session')
        }
    } catch (e) {
        console.error('Error getting component: ', e)
    }
}

export async function addClick(componentId, clickType) {
    localStorage.setItem('lastClickedComponentId', componentId)
    localStorage.setItem('lastClickedComponentType', clickType)
    try {
        const componentRef = doc(firestore, 'components', componentId)
        const componentSnap = await getDoc(componentRef)
        if (componentSnap.exists()) {
            const clicks = componentSnap.get('clicks') ?? []
            await updateDoc(componentRef, {
                clicks: [...clicks, {
                    clickType,
                    clickedAt: new Date()
                }]
            })
        } else {
            console.error('No such component')
        }
    } catch (e) {
        console.error('Error adding click: ', e)
    }
}

export async function addViewPortData(viewportData) {
    try {
        for (const component of viewportData) {
            const componentRef = doc(firestore, 'components', component.componentId)
            const componentSnap = await getDoc(componentRef)

            if (componentSnap.exists()) {
                if (component.totalViewTime) {
                    await updateDoc(componentRef, {
                        timeInViewport: component.totalViewTime
                    })
                }
            } else {
                console.error('No such component')
            }
        }
    } catch (e) {
        console.error('Error adding viewportdata', e)
    }
}

export async function addReadingTime(componentId, duration, clickType) {
    try {
        const componentRef = doc(firestore, 'components', componentId)
        const componentSnap = await getDoc(componentRef)

        if (componentSnap.exists()) {
            if (clickType.startsWith('sj')) {
                await updateDoc(componentRef, {
                    sjReadingTime: increment(duration)
                })
            } else {
                await updateDoc(componentRef, {
                    traditionalReadingTime: increment(duration)
                })
            }
        } else {
            console.error('No such component')
        }
    } catch (e) {
        console.error('Error adding reading time', e)
    }
}
