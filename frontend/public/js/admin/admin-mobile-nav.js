/* =========================
   ADMIN MOBILE NAVIGATION
========================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const sidebar =
      document.querySelector(
        ".admin-sidebar"
      );

    const topbar =
      document.querySelector(
        ".admin-topbar"
      );


    if (
      !sidebar ||
      !topbar
    ) {
      return;
    }


    /* =========================
       CREATE TOGGLE
    ========================= */

    let toggle =
      document.querySelector(
        ".admin-mobile-toggle"
      );


    if (
      !toggle
    ) {

      toggle =
        document.createElement(
          "button"
        );


      toggle.type =
        "button";


      toggle.className =
        "admin-mobile-toggle";


      toggle.setAttribute(
        "aria-label",
        "Open admin navigation"
      );


      toggle.setAttribute(
        "aria-expanded",
        "false"
      );


      toggle.textContent =
        "☰";


      topbar.appendChild(
        toggle
      );

    }


    /* =========================
       CREATE OVERLAY
    ========================= */

    let overlay =
      document.querySelector(
        ".admin-sidebar-overlay"
      );


    if (
      !overlay
    ) {

      overlay =
        document.createElement(
          "div"
        );


      overlay.className =
        "admin-sidebar-overlay";


      document.body.appendChild(
        overlay
      );

    }


    /* =========================
       OPEN
    ========================= */

    function openMenu() {

      sidebar.classList.add(
        "mobile-open"
      );


      overlay.classList.add(
        "active"
      );


      toggle.classList.add(
        "active"
      );


      toggle.textContent =
        "✕";


      toggle.setAttribute(
        "aria-expanded",
        "true"
      );


      toggle.setAttribute(
        "aria-label",
        "Close admin navigation"
      );


      document.body.classList.add(
        "admin-menu-open"
      );

    }


    /* =========================
       CLOSE
    ========================= */

    function closeMenu() {

      sidebar.classList.remove(
        "mobile-open"
      );


      overlay.classList.remove(
        "active"
      );


      toggle.classList.remove(
        "active"
      );


      toggle.textContent =
        "☰";


      toggle.setAttribute(
        "aria-expanded",
        "false"
      );


      toggle.setAttribute(
        "aria-label",
        "Open admin navigation"
      );


      document.body.classList.remove(
        "admin-menu-open"
      );

    }


    /* =========================
       TOGGLE
    ========================= */

    toggle.addEventListener(
      "click",
      () => {

        if (
          sidebar.classList.contains(
            "mobile-open"
          )
        ) {

          closeMenu();

        } else {

          openMenu();

        }

      }
    );


    /* =========================
       OVERLAY CLOSE
    ========================= */

    overlay.addEventListener(
      "click",
      closeMenu
    );


    /* =========================
       CLOSE AFTER NAVIGATION
    ========================= */

    sidebar
      .querySelectorAll(
        "a"
      )
      .forEach(
        (link) => {

          link.addEventListener(
            "click",
            closeMenu
          );

        }
      );


    /* =========================
       ESCAPE KEY
    ========================= */

    document.addEventListener(
      "keydown",
      (event) => {

        if (
          event.key ===
          "Escape"
        ) {

          closeMenu();

        }

      }
    );


    /* =========================
       RESET DESKTOP
    ========================= */

    window.addEventListener(
      "resize",
      () => {

        if (
          window.innerWidth >
          900
        ) {

          closeMenu();

        }

      }
    );

  }
);