const cookieBanner = document.getElementById("cookie-banner");
const cookieHiddenClass = "hidden-unless-js-enabled";
const cookieKey = "cookies_accepted";

const showCookieBanner = () => { cookieBanner.classList.remove(cookieHiddenClass); }
const hideCookieBanner = () => { cookieBanner.classList.add(cookieHiddenClass); }
const acceptCookies = () => { localStorage.setItem(cookieKey, "yes") }
const rejectCookies = () => { localStorage.setItem(cookieKey, "no") }

const acceptButton = document.querySelector("#accept-cookies");
const rejectButton = document.querySelector("#reject-cookies");

document.addEventListener("DOMContentLoaded", () => {
  // if there's any response to the cookie banner, leave it hidden,
  // otherwise show it and add handlers for the accept/reject clicks
  if (!localStorage.getItem("cookies_accepted")) {
    showCookieBanner();

    acceptButton.addEventListener("click", () => {
      acceptCookies();
      hideCookieBanner();
    });

    rejectButton.addEventListener("click", () => {
      rejectCookies();
      hideCookieBanner();
    });
  }
});
