const siteHeader = document.querySelector(".site-header");
const menuButton = siteHeader?.querySelector(".menu-toggle");
const siteNav = siteHeader?.querySelector(".site-nav");

function setMenu(isOpen) {
    siteHeader.dataset.menu = isOpen ? "open" : "closed";
    menuButton.setAttribute("aria-expanded", String(isOpen));
}

if (siteHeader && menuButton && siteNav) {
    menuButton.hidden = false;
    setMenu(false);

    menuButton.addEventListener("click", () => {
        setMenu(siteHeader.dataset.menu !== "open");
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && siteHeader.dataset.menu === "open") {
            setMenu(false);
            menuButton.focus();
        }
    });

    siteNav.addEventListener("click", (event) => {
        if (event.target.closest("a")) setMenu(false);
    });
}