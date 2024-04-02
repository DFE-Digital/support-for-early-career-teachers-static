// configuring cookies on initial visit

const cookieBanner = document.getElementById("cookie-banner");
const cookieHiddenClass = "hidden-unless-js-enabled";
const cookieKey = "cookies_accepted";

const showCookieBanner = () => { cookieBanner.classList.remove(cookieHiddenClass); }
const hideCookieBanner = () => { cookieBanner.classList.add(cookieHiddenClass); }
const reloadPage = () => { window.location.reload(); }
const acceptCookies = () => { localStorage.setItem(cookieKey, "yes") }
const rejectCookies = () => { localStorage.setItem(cookieKey, "no") }

const acceptButton = document.querySelector("#accept-cookies");
const rejectButton = document.querySelector("#reject-cookies");

// toggling cookies once set

const enableButton = document.querySelector("#enable-cookies");
const disableButton = document.querySelector("#disable-cookies");

const cookiesEnabled = localStorage.getItem(cookieKey) == "yes";

// only show cookie control if JavaScript is enabled, as it's required
// to toggle it
if (cookiesEnabled) {
  const cookieControlDisableControl = document.getElementById("cookie-control-enabled");

  cookieControlDisableControl.classList.remove("hidden");
} else {
  const cookieControlEnableControl = document.getElementById("cookie-control-disabled");

  cookieControlEnableControl.classList.remove("hidden");
}

document.addEventListener("DOMContentLoaded", () => {
  // if there's any response to the cookie banner, leave it hidden,
  // otherwise show it and add handlers for the accept/reject clicks
  if (!localStorage.getItem("cookies_accepted")) {
    showCookieBanner();
  }

  acceptButton.addEventListener("click", () => {
    acceptCookies();

    hideCookieBanner();
  });

  rejectButton.addEventListener("click", () => {
    rejectCookies();

    hideCookieBanner();
  });

  enableButton.addEventListener("click", () => {
    acceptCookies();

    reloadPage();
  });

  disableButton.addEventListener("click", () => {
    rejectCookies();

    reloadPage();
  });
});
