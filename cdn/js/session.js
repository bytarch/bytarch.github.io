// CDN script (sessionChecker.js)

// version: 2.0
(async function () {

  function getSessionTokenFromLocalStorage() {
    return localStorage.getItem('auth.sessionToken');
  }

  // Function to check if URL includes "login", "signup", or "pricing"
  function shouldSkipSessionManagement() {
    const currentUrl = window.location.href;
    return (
      currentUrl.includes('login') ||
      currentUrl.includes('signup') ||
      currentUrl.includes('pricing')
    );
  }

  function handleLogout() {
    // Clear the session token from localStorage
    handle_sessionRemove();

    const currentUrl = window.location.href;
    window.location.href = `https://blue-lion-79.telebit.io/login?callbackUrl=${encodeURIComponent(
      currentUrl
    )}`;
  }

  function handle_sessionRemove() {
    // Clear the session token from localStorage
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('auth.sessionToken');
  }

  // Function to parse session token from query parameters
  function parseSessionTokenFromQueryParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionToken = urlParams.get('sessionToken');
    if (sessionToken) {
      // Remove sessionToken from URL without reloading
      urlParams.delete('sessionToken');
      const newUrl = `${window.location.origin}${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ''}`;
      window.history.replaceState({}, document.title, newUrl);
    }
    return sessionToken;
  }

  // Function to set session token in localStorage
  function setSessionTokenToLocalStorage(sessionToken) {
    localStorage.setItem('auth.sessionToken', sessionToken);
  }

  // Function to fetch session data and manage redirects
  async function fetchData() {
    // Exit early if URL includes "login", "signup", or "pricing"
    if (shouldSkipSessionManagement()) {
      return;
    }

    // Retrieve the sessionToken from localStorage
    let sessionToken = getSessionTokenFromLocalStorage();

    // If session token is not found in localStorage, check query parameters
    if (!sessionToken) {
      sessionToken = parseSessionTokenFromQueryParams();
    }

    // If session token is found, proceed with fetching session data
    if (sessionToken) {
      try {
        let headers = {};

        // If session token is retrieved from query params, include Authorization header
        if (sessionToken !== getSessionTokenFromLocalStorage()) {
          headers = {
            'Authorization': `Bearer ${sessionToken}` // Include session token in Authorization header
          };
        }

        const response = await fetch('https://blue-lion-79.telebit.io/api/auth/session', {
          method: 'GET',
          headers: headers
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();

        // Check if the response contains a new session token
        if (data && data.accessToken) {
          const newSessionToken = data.accessToken;

          // Check if expiration_date is less than the current date
          const expirationDate = new Date(data.expiration_date);
          const currentDate = new Date();
          if (expirationDate < currentDate) {
            handleLogout();
            // Redirect to the services/pricing page
            const currentUrl = window.location.href;
            window.location.href = `https://blue-lion-79.telebit.io/login?callbackUrl=${encodeURIComponent(
              currentUrl
            )}`;
          }
        }
      } catch (error) {
        handleLogout();

        // Redirect to the login page on fetch error
        console.error('There was a problem with the fetch operation:', error);
      }
    } else {
      handleLogout();
    }
  }

  // Immediately execute fetchData function when script is loaded
  fetchData();

  // Expose fetchData globally for external use
  window.fetchData = fetchData;

})();
