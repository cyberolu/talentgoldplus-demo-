import {
  auth,
  db
} from "../firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  collection,
  getDocs,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import {
  getFunctions,
  httpsCallable,
  connectFunctionsEmulator
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-functions.js";


/* =========================
   CLOUD FUNCTIONS
========================= */

const functions =
  getFunctions(
    undefined,
    "europe-west2"
  );

if (
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname === "localhost"
) {

  connectFunctionsEmulator(
    functions,
    "127.0.0.1",
    5001
  );

}


const setUserRoleFunction =
  httpsCallable(
    functions,
    "setUserRole"
  );

const setUserStatusFunction =
  httpsCallable(
    functions,
    "setUserStatus"
  );

const approveUserAccountFunction =
  httpsCallable(
    functions,
    "approveUserAccount"
  );

const rejectUserAccountFunction =
  httpsCallable(
    functions,
    "rejectUserAccount"
  );


/* =========================
   ADMIN SETTINGS
========================= */

const allowedRoles = [
  "admin",
  "superadmin"
];


const roleOptions = [
  "athlete",
  "coach",
  "physiotherapist",
  "sports-therapist",
  "nutritionist",
  "psychologist",
  "wellbeing-specialist",
  "recovery-expert",
  "mentor",
  "performance-specialist",
  "scout",
  "moderator",
  "admin",
  "superadmin"
];


const normalAdminRoleOptions = [
  "athlete",
  "coach",
  "physiotherapist",
  "sports-therapist",
  "nutritionist",
  "psychologist",
  "wellbeing-specialist",
  "recovery-expert",
  "mentor",
  "performance-specialist",
  "scout",
  "moderator"
];


/* =========================
   PAGE ELEMENTS
========================= */

const adminWelcome =
  document.getElementById(
    "adminWelcome"
  );

const usersTableBody =
  document.getElementById(
    "usersTableBody"
  );

const logoutBtn =
  document.getElementById(
    "logoutBtn"
  );


let currentAdmin =
  null;

let currentAdminRole =
  null;


/* =========================
   AUTH
========================= */

onAuthStateChanged(
  auth,
  async (user) => {

    if (!user) {

      window.location.href =
        "../auth/login.html";

      return;

    }


    currentAdmin =
      user;


    const adminSnapshot =
      await getDoc(
        doc(
          db,
          "users",
          user.uid
        )
      );


    if (
      !adminSnapshot.exists()
    ) {

      window.location.href =
        "../pages/dashboard.html";

      return;

    }


    const adminData =
      adminSnapshot.data();


    currentAdminRole =
      adminData.role ||
      "athlete";


    if (
      !allowedRoles.includes(
        currentAdminRole
      )
    ) {

      alert(
        "You do not have permission to access this page."
      );

      window.location.href =
        "../pages/dashboard.html";

      return;

    }


    document.body.style.display =
      "block";


    if (
      adminWelcome
    ) {

      adminWelcome.textContent =
        `Welcome ${
          adminData.name ||
          adminData.fullName ||
          "Admin"
        } (${currentAdminRole})`;

    }


    await loadUsers();

  }
);


/* =========================
   LOAD USERS
========================= */

async function loadUsers() {

  usersTableBody.innerHTML = `
    <tr>
      <td colspan="6">
        Loading users...
      </td>
    </tr>
  `;


  try {

    const usersSnapshot =
      await getDocs(
        collection(
          db,
          "users"
        )
      );


    usersTableBody.innerHTML =
      "";


    if (
      usersSnapshot.empty
    ) {

      usersTableBody.innerHTML = `
        <tr>
          <td colspan="6">
            No users found.
          </td>
        </tr>
      `;

      return;

    }


    usersSnapshot.forEach(
      (userDoc) => {

        const user =
          userDoc.data();


        const userId =
          userDoc.id;


        const name =
          user.fullName ||
          user.name ||
          "TalentGoldPlus User";


        const email =
          user.email ||
          "No email";


        const role =
          user.role ||
          "athlete";

          const professionalCategory =
          user.professionalCategory ||
          "";
        
        
        const displayedRole =
          role === "professional" &&
          professionalCategory
            ? professionalCategory
            : role;


        const status =
          (
            user.status ||
            "active"
          ).toLowerCase();


        const profileImage =
          user.profileImage &&
          user.profileImage.startsWith(
            "http"
          )
            ? user.profileImage
            : "../assets/images/avatar-placeholder.png";


        const pendingAccount =
          status === "pending" ||
          status === "under-review";


        /* =========================
           ROLE PERMISSIONS
        ========================= */

        const isOwnAccount =
          currentAdmin.uid ===
          userId;


        const isSuperadminAccount =
          role ===
          "superadmin";


        const isAdminAccount =
          role ===
          "admin";


        /*
          Superadmin:
          - can edit normal users
          - can edit admins
          - cannot edit superadmins

          Admin:
          - can edit normal users
          - cannot edit admins
          - cannot edit superadmins

          Nobody:
          - can edit their own role
        */

        const canChangeRole =
          !isOwnAccount &&
          !isSuperadminAccount &&
          (
            currentAdminRole ===
              "superadmin" ||
            (
              currentAdminRole ===
                "admin" &&
              !isAdminAccount
            )
          );


        /*
          Superadmin accounts cannot
          be suspended through the UI.

          Normal admins also cannot
          suspend other admins.
        */

        const canChangeStatus =
          !isOwnAccount &&
          !isSuperadminAccount &&
          (
            currentAdminRole ===
              "superadmin" ||
            (
              currentAdminRole ===
                "admin" &&
              !isAdminAccount
            )
          );


        /*
          Normal admins only see
          ordinary roles.

          Superadmins see all roles.
        */

        const availableRoleOptions =
          currentAdminRole ===
            "superadmin"
            ? roleOptions
            : normalAdminRoleOptions;


        const tr =
          document.createElement(
            "tr"
          );


        tr.innerHTML = `
          <td>

            <div class="admin-user-cell">

              <img
                src="${profileImage}"
                alt="${escapeHtml(name)}"
                onerror="this.src='../assets/images/avatar-placeholder.png'"
              >

              <div>

                <strong>
                  ${escapeHtml(name)}
                </strong>

                <p>
                  ${escapeHtml(
                    user.sport ||
                    user.professionalCategory ||
                    ""
                  )}
                </p>

              </div>

            </div>

          </td>


          <td>
            ${escapeHtml(email)}
          </td>


          <td>

            <span class="admin-status">
            ${escapeHtml(displayedRole)}
            </span>

          </td>


          <td>

            ${
              canChangeRole
                ? `
                  <select
                    class="admin-role-select"
                    data-user-id="${userId}"
                    data-original-role="${displayedRole}"
                  >

                    ${
                      availableRoleOptions
                        .map(
                          (option) => `
                            <option
                              value="${option}"
                              ${
                               option === displayedRole
                                ? "selected"
                                : ""
                              }
                            >
                              ${option}
                            </option>
                          `
                        )
                        .join("")
                    }

                  </select>
                `
                : `
                  <span class="admin-status">
                    ${escapeHtml(displayedRole)}
                  </span>
                `
            }

          </td>


          <td>

            ${
              user.profileCompleted
                ? "Profile complete"
                : "Profile incomplete"
            }

          </td>


          <td>

            <div class="admin-user-status-area">

              <span
                class="admin-status admin-status-${status}"
              >
                ${escapeHtml(status)}
              </span>


              ${
                user.rejectionReason
                  ? `
                    <small class="admin-status-reason">
                      Rejection reason:
                      ${escapeHtml(
                        user.rejectionReason
                      )}
                    </small>
                  `
                  : ""
              }


              ${
                user.suspensionReason
                  ? `
                    <small class="admin-status-reason">
                      Suspension reason:
                      ${escapeHtml(
                        user.suspensionReason
                      )}
                    </small>
                  `
                  : ""
              }


              ${
                pendingAccount
                  ? `
                    <div class="admin-account-approval-actions">

                      <button
                        class="approve-account-btn"
                        data-user-id="${userId}"
                      >
                        Approve Account
                      </button>

                      <button
                        class="reject-account-btn"
                        data-user-id="${userId}"
                      >
                        Reject Account
                      </button>

                    </div>
                  `
                  : status === "rejected"
                    ? `
                      <span class="admin-account-result">
                        Registration rejected
                      </span>
                    `
                    : canChangeStatus
                      ? `
                        <button
                          class="admin-status-btn"
                          data-user-id="${userId}"
                          data-user-role="${role}"
                          data-user-status="${status}"
                        >

                          ${
                            status ===
                              "suspended"
                              ? "Reactivate"
                              : "Suspend"
                          }

                        </button>
                      `
                      : `
                        <span class="admin-account-result">
                          Protected
                        </span>
                      `
              }

            </div>

          </td>
        `;


        usersTableBody.appendChild(
          tr
        );

      }
    );


    attachAccountApprovalEvents();
    attachRoleChangeEvents();
    attachStatusChangeEvents();


  } catch (error) {

    console.error(
      "Users loading error:",
      error
    );


    usersTableBody.innerHTML = `
      <tr>
        <td colspan="6">
          Unable to load users.
        </td>
      </tr>
    `;

  }

}


/* =========================
   ACCOUNT APPROVAL
========================= */

function attachAccountApprovalEvents() {

  document
    .querySelectorAll(
      ".approve-account-btn"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        async () => {

          const userId =
            button.dataset.userId;


          if (
            !userId
          ) {

            return;

          }


          const confirmed =
            confirm(
              "Approve this TalentGoldPlus account?"
            );


          if (
            !confirmed
          ) {

            return;

          }


          try {

            button.disabled =
              true;

            button.textContent =
              "Approving...";


            await approveUserAccountFunction({
              userId
            });


            alert(
              "Account approved successfully."
            );


            await loadUsers();


          } catch (error) {

            console.error(
              "Account approval failed:",
              error
            );


            alert(
              error?.message ||
              "Unable to approve account."
            );


            await loadUsers();

          }

        }
      );

    });


  document
    .querySelectorAll(
      ".reject-account-btn"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        async () => {

          const userId =
            button.dataset.userId;


          if (
            !userId
          ) {

            return;

          }


          const response =
            window.prompt(
              "Please enter the reason for rejecting this registration:"
            );


          if (
            response === null
          ) {

            return;

          }


          const reason =
            response.trim();


          if (
            !reason
          ) {

            alert(
              "A rejection reason is required."
            );

            return;

          }


          const confirmed =
            confirm(
              "Are you sure you want to reject this account?"
            );


          if (
            !confirmed
          ) {

            return;

          }


          try {

            button.disabled =
              true;

            button.textContent =
              "Rejecting...";


            await rejectUserAccountFunction({
              userId,
              reason
            });


            alert(
              "Account rejected."
            );


            await loadUsers();


          } catch (error) {

            console.error(
              "Account rejection failed:",
              error
            );


            alert(
              error?.message ||
              "Unable to reject account."
            );


            await loadUsers();

          }

        }
      );

    });

}


/* =========================
   ROLE CHANGES
========================= */

function attachRoleChangeEvents() {

  document
    .querySelectorAll(
      ".admin-role-select"
    )
    .forEach((select) => {

      select.addEventListener(
        "change",
        async () => {

          const userId =
            select.dataset.userId;


          const newRole =
            select.value;


          const originalRole =
            select.dataset.originalRole;


          if (
            !userId ||
            !newRole
          ) {

            await loadUsers();

            return;

          }


          /*
            Extra frontend protection.

            Backend remains the real
            security boundary.
          */

          if (
            currentAdminRole ===
              "admin" &&
            (
              newRole === "admin" ||
              newRole === "superadmin"
            )
          ) {

            alert(
              "Admins cannot assign admin or superadmin roles."
            );


            await loadUsers();

            return;

          }


          const confirmed =
            confirm(
              `Change this user's role from ${originalRole} to ${newRole}?`
            );


          if (
            !confirmed
          ) {

            await loadUsers();

            return;

          }


          try {

            select.disabled =
              true;


            await setUserRoleFunction({
              userId,
              role:
                newRole
            });


            alert(
              "User role updated successfully."
            );


            await loadUsers();


          } catch (error) {

            console.error(
              "Role change failed:",
              error
            );


            alert(
              error?.message ||
              "Unable to update user role."
            );


            await loadUsers();

          }

        }
      );

    });

}


/* =========================
   SUSPEND / REACTIVATE
========================= */

function attachStatusChangeEvents() {

  document
    .querySelectorAll(
      ".admin-status-btn"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        async () => {

          const userId =
            button.dataset.userId;


          const targetRole =
            button.dataset.userRole;


          const currentStatus =
            (
              button.dataset.userStatus ||
              "active"
            ).toLowerCase();


          if (
            !userId
          ) {

            return;

          }


          if (
            currentAdmin.uid ===
            userId
          ) {

            alert(
              "You cannot suspend your own account."
            );

            return;

          }


          /*
            Superadmin accounts are
            completely protected.
          */

          if (
            targetRole ===
            "superadmin"
          ) {

            alert(
              "Superadmin accounts are protected."
            );

            return;

          }


          /*
            Normal admins cannot
            suspend another admin.
          */

          if (
            currentAdminRole !==
              "superadmin" &&
            targetRole ===
              "admin"
          ) {

            alert(
              "Only a superadmin can suspend or reactivate an admin."
            );

            return;

          }


          const newStatus =
            currentStatus ===
              "suspended"
              ? "active"
              : "suspended";


          let reason =
            "";


          if (
            newStatus ===
            "suspended"
          ) {

            const response =
              window.prompt(
                "Please enter the reason for suspending this account:"
              );


            if (
              response ===
              null
            ) {

              return;

            }


            reason =
              response.trim();


            if (
              !reason
            ) {

              alert(
                "A suspension reason is required."
              );

              return;

            }

          }


          const confirmed =
            confirm(
              newStatus ===
                "suspended"
                ? "Are you sure you want to suspend this account?"
                : "Are you sure you want to reactivate this account?"
            );


          if (
            !confirmed
          ) {

            return;

          }


          try {

            button.disabled =
              true;


            button.textContent =
              newStatus ===
                "suspended"
                ? "Suspending..."
                : "Reactivating...";


            await setUserStatusFunction({
              userId,
              status:
                newStatus,
              reason
            });


            alert(
              newStatus ===
                "suspended"
                ? "User account suspended."
                : "User account reactivated."
            );


            await loadUsers();


          } catch (error) {

            console.error(
              "User status change failed:",
              error
            );


            alert(
              error?.message ||
              "Unable to update user status."
            );


            await loadUsers();

          }

        }
      );

    });

}


/* =========================
   LOGOUT
========================= */

if (
  logoutBtn
) {

  logoutBtn.addEventListener(
    "click",
    async () => {

      await signOut(
        auth
      );


      window.location.href =
        "../index.html";

    }
  );

}


/* =========================
   ESCAPE HTML
========================= */

function escapeHtml(
  value = ""
) {

  const element =
    document.createElement(
      "div"
    );


  element.textContent =
    String(value);


  return element.innerHTML;

}