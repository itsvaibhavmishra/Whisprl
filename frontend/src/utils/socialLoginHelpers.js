export const getOAuthCode = (url) => {
  const oauthAuthUrl = url;

  return new Promise((resolve, reject) => {
    const popup = window.open(oauthAuthUrl, "_blank", "width=600,height=600");

    const checkPopupClosed = setInterval(() => {
      if (!popup || popup.closed || popup.closed === undefined) {
        clearInterval(checkPopupClosed);

        reject(new Error("Popup closed before authorization"));
      } else {
        try {
          const urlParams = new URLSearchParams(popup.location.search);
          const code = urlParams.get("code");
          if (code) {
            popup.close();
            clearInterval(checkPopupClosed);
            resolve(code);
          }
        } catch {
          // the popup's address can't be read while it is still on the provider's own site
        }
      }
    }, 1000);
  });
};
