import {
    auth,
    db
}
from "../firebase.js";

import {

    addDoc,

    collection,

    serverTimestamp,

    query,

    where,

    getDocs

}
from
"https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

export function initialiseRegistration(event){

    const button =
        document.getElementById(
            "eventRegisterBtn"
        );

    if(!button){
        return;
    }

    button.addEventListener(
        "click",
        ()=>registerForEvent(event)
    );

}

async function registerForEvent(event){

    const user =
        auth.currentUser;

    if(!user){

        alert(
            "Please login before registering."
        );

        window.location.href =
            "../auth/login.html";

        return;

    }

    if(
        event.registrationType ===
        "paid"
    ){

        alert(
            "Paid registrations will be enabled soon."
        );

        return;

    }

    try{

        const existingQuery =
            query(

                collection(
                    db,
                    "eventRegistrations"
                ),

                where(
                    "eventId",
                    "==",
                    event.id
                ),

                where(
                    "userId",
                    "==",
                    user.uid
                )

            );

        const existing =
            await getDocs(
                existingQuery
            );

        if(!existing.empty){

            alert(
                "You are already registered."
            );

            return;

        }

        await addDoc(

            collection(
                db,
                "eventRegistrations"
            ),

            {

                eventId:
                    event.id,

                eventTitle:
                    event.title,

                organiserId:
                    event.organiserId,

                userId:
                    user.uid,

                attendeeName:
                    user.displayName || "",

                attendeeEmail:
                    user.email || "",

                registrationType:
                    event.registrationType,

                paymentStatus:
                    "not-required",

                registrationStatus:
                    "registered",

                checkedIn:
                    false,

                createdAt:
                    serverTimestamp()

            }

        );

        alert(
            "Registration successful."
        );

    }

    catch(error){

        console.error(error);

        alert(
            "Unable to register."
        );

    }

}