import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const conversationList =
  document.getElementById("conversationList");

const chatHeader =
  document.getElementById("chatHeader");

const messagesList =
  document.getElementById("messagesList");

const messageForm =
  document.getElementById("messageForm");

const messageInput =
  document.getElementById("messageInput");

const newChatBtn =
  document.getElementById("newChatBtn");

let currentUser = null;
let activeConversationId = null;
let unsubscribeMessages = null;

// =========================
// AUTH CHECK
// =========================

onAuthStateChanged(auth, async (user) => {

  if (!user) {

    window.location.href = "../auth/login.html";

    return;

  }

  currentUser = user;

  loadConversations();

});

// =========================
// LOAD CONVERSATIONS
// =========================

function loadConversations() {

  const conversationsRef =
    collection(db, "conversations");

  const q =
    query(
      conversationsRef,
      where("participants", "array-contains", currentUser.uid),
      orderBy("updatedAt", "desc")
    );

  onSnapshot(q, async (snapshot) => {

    conversationList.innerHTML = "";

    if (snapshot.empty) {

      conversationList.innerHTML =
        "<p>No conversations yet.</p>";

      return;

    }

    snapshot.forEach(async (docSnap) => {

      const conversation =
        docSnap.data();

      const otherUserId =
        conversation.participants.find(
          (id) => id !== currentUser.uid
        );

      const otherUser =
        await getUserData(otherUserId);

      const conversationItem =
        document.createElement("div");

      conversationItem.classList.add("conversation-item");

      conversationItem.innerHTML = `

        <img
          src="${otherUser.profileImage || "../assets/images/default-profile.png"}"
          alt="${otherUser.name || "User"}"
        >

        <div>
          <h4>${otherUser.name || otherUser.fullName || "User"}</h4>
          <p>${conversation.lastMessage || "No messages yet"}</p>
        </div>

      `;

      conversationItem.addEventListener("click", () => {

        openConversation(
          docSnap.id,
          otherUser
        );

      });

      conversationList.appendChild(conversationItem);

    });

  });

}

// =========================
// GET USER DATA
// =========================

async function getUserData(userId) {

  const userRef =
    doc(db, "users", userId);

  const userSnap =
    await getDoc(userRef);

  if (userSnap.exists()) {

    return userSnap.data();

  }

  return {
    name: "User",
    profileImage: ""
  };

}

// =========================
// OPEN CONVERSATION
// =========================

function openConversation(conversationId, otherUser) {

  activeConversationId = conversationId;

  chatHeader.innerHTML = `

    <div class="chat-user-header">

      <img
        src="${otherUser.profileImage || "../assets/images/default-profile.png"}"
        alt="${otherUser.name || "User"}"
      >

      <div>
        <h2>${otherUser.name || otherUser.fullName || "User"}</h2>
        <p>${otherUser.role || "TalentGoldPlus User"}</p>
      </div>

    </div>

  `;

  if (unsubscribeMessages) {

    unsubscribeMessages();

  }

  const messagesRef =
    collection(
      db,
      "conversations",
      conversationId,
      "messages"
    );

  const q =
    query(
      messagesRef,
      orderBy("createdAt", "asc")
    );

  unsubscribeMessages =
    onSnapshot(q, (snapshot) => {

      messagesList.innerHTML = "";

      snapshot.forEach((docSnap) => {

        const message =
          docSnap.data();

        const messageBubble =
          document.createElement("div");

        messageBubble.classList.add("message-bubble");

        if (message.senderId === currentUser.uid) {

          messageBubble.classList.add("sent");

        } else {

          messageBubble.classList.add("received");

        }

        messageBubble.innerHTML = `
          <p>${message.text}</p>
        `;

        messagesList.appendChild(messageBubble);

      });

      messagesList.scrollTop =
        messagesList.scrollHeight;

    });

}

// =========================
// SEND MESSAGE
// =========================

if (messageForm) {

  messageForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const text =
      messageInput.value.trim();

    if (!text || !activeConversationId) {

      alert("Select a conversation first.");

      return;

    }

    await addDoc(
      collection(
        db,
        "conversations",
        activeConversationId,
        "messages"
      ),
      {
        senderId: currentUser.uid,
        text: text,
        createdAt: serverTimestamp()
      }
    );

    await updateDoc(
      doc(db, "conversations", activeConversationId),
      {
        lastMessage: text,
        updatedAt: serverTimestamp()
      }
    );

    messageInput.value = "";

  });

}

// =========================
// START NEW CHAT
// =========================

if (newChatBtn) {

  newChatBtn.addEventListener("click", async () => {

    const email =
      prompt("Enter the email of the user you want to message:");

    if (!email) return;

    const usersRef =
      collection(db, "users");

    const q =
      query(
        usersRef,
        where("email", "==", email)
      );

    const snapshot =
      await getDocs(q);

    if (snapshot.empty) {

      alert("No user found with that email.");

      return;

    }

    const otherUserDoc =
      snapshot.docs[0];

    const otherUserId =
      otherUserDoc.id;

    if (otherUserId === currentUser.uid) {

      alert("You cannot message yourself.");

      return;

    }

    const conversationId =
      [currentUser.uid, otherUserId]
        .sort()
        .join("_");

    const conversationRef =
      doc(db, "conversations", conversationId);

    await setDoc(
      conversationRef,
      {
        participants: [
          currentUser.uid,
          otherUserId
        ],
        lastMessage: "",
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );

    openConversation(
      conversationId,
      otherUserDoc.data()
    );

  });

}